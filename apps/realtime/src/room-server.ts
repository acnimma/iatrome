import {
  type ClientMessage,
  type ConnectError,
  type Drawing,
  type DrawOp,
  type RoomSettings,
  type RoomState,
  type ServerMessage,
  type Viewer,
  ROOM,
  advance,
  createRoom,
  findByToken,
  hostCommand,
  join,
  nextWake,
  parseClientMessage,
  playerCommand,
  referencedDrawings,
  setConnected,
  viewFor,
} from '@iatrome/game';
import { type Connection, type ConnectionContext, Server } from 'partyserver';
import { hashPassword, safeEqual } from './crypto';
import type { Env } from './env';
import { releaseSlot } from './registry';

/** What we remember about each socket (survives hibernation; max 2 KB). */
/** `host` on a person: the phone that created a phones-only room, allowed to run host commands. */
type ConnState = { kind: 'pending'; ip: string; at: number } | { kind: 'host' } | { kind: 'person'; id: string; host?: boolean };

interface Auth {
  hostToken: string;
  password: { salt: string; hash: string } | null;
}

export interface InitRequest {
  code: string;
  hostToken: string;
  password?: string;
  settings?: Partial<RoomSettings>;
}

const REACTION_COOLDOWN = 150;

/**
 * Abuse limits per room. Real play never comes close: a phone sends a few messages a second
 * (a live drawing streams more, in small ops). Scripts that flood get throttled, then dropped.
 */
const LIMITS_PER_SOCKET = {
  /** Token bucket: burst size and refill per second. */
  burst: 80,
  perSecond: 40,
  /** Bytes per 10 seconds (a finished doodle is the biggest message, ~200 KB). */
  bytesPer10s: 1_500_000,
  /** Dropped messages before the socket is closed. */
  strikes: 200,
};
/** Every socket in one room: people (44 max), the stage and a few spare tabs. */
const MAX_SOCKETS = 70;
/** Sockets that connected but haven't joined yet, per address and overall. */
const MAX_PENDING_PER_IP = 6;
const MAX_PENDING = 20;
const MAX_PASSWORD_FAILURES = 6;
const DRAWING_FLUSH_MS = 2_000;

/**
 * One Durable Object per room. It owns the authoritative game state, drives timers with
 * alarms, persists to storage (so it survives hibernation and restarts) and sends every
 * connection its own view.
 */
export class Room extends Server<Env> {
  static override options = { hibernate: true };

  private room: RoomState | null = null;
  private auth: Auth | null = null;
  private persistedDrawings = new Set<string>();
  private dirtyDrawings = new Set<string>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  /** Drawings each connection already has (rebuilt after hibernation: a resend is harmless). */
  private sentDrawings = new Map<string, Set<string>>();
  private lastReaction = new Map<string, number>();
  private passwordFailures = new Map<string, number>();
  private budgets = new Map<string, { tokens: number; at: number; bytes: number; bytesAt: number; strikes: number }>();

  override async onStart() {
    const [room, auth] = await Promise.all([
      this.ctx.storage.get<RoomState>('room'),
      this.ctx.storage.get<Auth>('auth'),
    ]);
    if (!room || !auth) return;
    const stored = await this.ctx.storage.list<Drawing>({ prefix: 'd:' });
    room.drawings = {};
    for (const [key, drawing] of stored) {
      const id = key.slice(2);
      room.drawings[id] = drawing;
      this.persistedDrawings.add(id);
    }
    this.room = room;
    this.auth = auth;
  }

  // ── Room creation (called by the worker) ──────────────────────────────────

  override async onRequest(request: Request): Promise<Response> {
    if (request.method !== 'POST' || new URL(request.url).pathname.split('/').pop() !== 'init')
      return new Response('Not found', { status: 404 });
    if (this.room) return new Response('Room exists', { status: 409 });
    const body = (await request.json()) as InitRequest;
    const now = Date.now();
    this.room = createRoom({
      code: body.code,
      seed: crypto.getRandomValues(new Uint32Array(1))[0],
      now,
      devMode: this.env.DEV_MODE === 'true',
      settings: body.settings,
    });
    this.auth = {
      hostToken: body.hostToken,
      password: body.password ? await hashPassword(body.password) : null,
    };
    await this.ctx.storage.put({ room: stripDrawings(this.room), auth: this.auth });
    // A room nobody joins expires like an empty one.
    await this.ctx.storage.setAlarm(now + ROOM.emptyRoomTtl);
    return new Response('ok');
  }

  // ── Connections ───────────────────────────────────────────────────────────

  override onConnect(conn: Connection<ConnState>, ctx: ConnectionContext) {
    if (!this.room) {
      this.send(conn, { t: 'connect-error', error: 'no-room' });
      conn.close(4404, 'No such room');
      return;
    }
    const ip = ctx.request.headers.get('CF-Connecting-IP') ?? 'local';
    const sockets = [...this.getConnections<ConnState>()].filter((c) => c.id !== conn.id);
    const pending = sockets.filter((c) => c.state?.kind === 'pending');
    const pendingAt = (c: Connection<ConnState>) => (c.state?.kind === 'pending' ? c.state.at : 0);
    if (sockets.length >= MAX_SOCKETS || pending.filter((c) => c.state?.kind === 'pending' && c.state.ip === ip).length >= MAX_PENDING_PER_IP) {
      conn.close(4429, 'Room is busy');
      return;
    }
    // Too many sockets that never joined: drop the oldest rather than lock real players out.
    // A real phone that gets dropped reconnects on its own.
    if (pending.length >= MAX_PENDING) pending.sort((a, b) => pendingAt(a) - pendingAt(b))[0].close(4408, 'Idle');
    conn.setState({ kind: 'pending', ip, at: Date.now() });
  }

  /** False when this socket is over its budget; repeat offenders are disconnected. */
  private withinBudget(conn: Connection<ConnState>, size: number, now: number): boolean {
    const b = this.budgets.get(conn.id) ?? { tokens: LIMITS_PER_SOCKET.burst, at: now, bytes: 0, bytesAt: now, strikes: 0 };
    b.tokens = Math.min(LIMITS_PER_SOCKET.burst, b.tokens + ((now - b.at) / 1000) * LIMITS_PER_SOCKET.perSecond);
    b.at = now;
    if (now - b.bytesAt > 10_000) {
      b.bytes = 0;
      b.bytesAt = now;
    }
    b.bytes += size;
    const ok = b.tokens >= 1 && b.bytes <= LIMITS_PER_SOCKET.bytesPer10s;
    if (ok) b.tokens -= 1;
    else b.strikes += 1;
    this.budgets.set(conn.id, b);
    if (b.strikes > LIMITS_PER_SOCKET.strikes) {
      this.budgets.delete(conn.id);
      conn.close(4429, 'Too many messages');
    }
    return ok;
  }

  override async onMessage(conn: Connection<ConnState>, raw: string | ArrayBuffer) {
    if (!this.room || typeof raw !== 'string') return;
    if (!this.withinBudget(conn, raw.length, Date.now())) return;
    const msg = parseClientMessage(raw);
    if (!msg) return;
    const now = Date.now();
    const state = conn.state;

    switch (msg.t) {
      case 'ping':
        this.send(conn, { t: 'pong', c: msg.c, s: now });
        return;
      case 'host':
        return this.authenticateHost(conn, msg.token);
      case 'claim-host':
        if (state?.kind === 'person' && this.auth && safeEqual(msg.token, this.auth.hostToken)) conn.setState({ ...state, host: true });
        return;
      case 'resume':
        return this.resume(conn, msg.token, now);
      case 'join':
        return this.join(conn, msg, now);
      case 'react': {
        if (state?.kind !== 'person') return;
        const last = this.lastReaction.get(state.id) ?? 0;
        if (now - last < REACTION_COOLDOWN) return;
        this.lastReaction.set(state.id, now);
        this.broadcastMessage({ t: 'react', from: state.id, e: msg.e });
        return;
      }
      case 'host-cmd': {
        if (state?.kind !== 'host' && !(state?.kind === 'person' && state.host)) return;
        if (msg.cmd.type === 'close') return this.closeRoom();
        const before = new Set(this.room.people.map((p) => p.id));
        const error = hostCommand(this.room, msg.cmd, now);
        if (error) this.send(conn, { t: 'feedback', error });
        // Disconnect anyone the host removed.
        for (const id of before)
          if (!this.room.people.some((p) => p.id === id)) this.removeConnections(id, msg.cmd.type === 'ban' ? 'banned' : 'kicked');
        await this.commit(now);
        return;
      }
      case 'cmd': {
        if (state?.kind !== 'person') return;
        const outcome = playerCommand(this.room, state.id, msg.cmd, now);
        if (outcome && (outcome.error || outcome.notice)) this.send(conn, { t: 'feedback', ...outcome });
        if (msg.cmd.type === 'draw' && !outcome?.error) {
          // Live strokes skip the full state broadcast: relay just the op.
          this.relayDrawOp(conn, msg.cmd.op);
          return;
        }
        if (msg.cmd.type === 'doodle' || msg.cmd.type === 'draw') this.markDrawingsDirty();
        await this.commit(now);
        return;
      }
    }
  }

  override async onClose(conn: Connection<ConnState>) {
    this.sentDrawings.delete(conn.id);
    this.budgets.delete(conn.id);
    const state = conn.state;
    // The big screen left: phones take over showing everything.
    if (this.room && state?.kind === 'host') return this.commit(Date.now(), conn.id);
    if (!this.room || state?.kind !== 'person') return;
    const stillHere = [...this.getConnections<ConnState>()].some((c) => c.id !== conn.id && c.state?.kind === 'person' && c.state.id === state.id);
    if (stillHere) return;
    setConnected(this.room, state.id, false, Date.now());
    await this.commit(Date.now());
  }

  override async onAlarm() {
    if (!this.room) return;
    const now = Date.now();
    const connected = [...this.getConnections()].length;
    const lastSeen = Math.max(this.room.createdAt, ...this.room.people.map((p) => p.disconnectedAt ?? 0));
    if (connected === 0 && now - lastSeen >= ROOM.emptyRoomTtl - 1000) {
      const code = this.room.code;
      await this.ctx.storage.deleteAll();
      this.room = null;
      this.auth = null;
      await releaseSlot(this.env, code);
      return;
    }
    advance(this.room, now);
    await this.commit(now);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  private async authenticateHost(conn: Connection<ConnState>, token: string) {
    if (!this.auth || !safeEqual(token, this.auth.hostToken)) {
      this.send(conn, { t: 'connect-error', error: 'bad-token' });
      return;
    }
    conn.setState({ kind: 'host' });
    this.send(conn, { t: 'welcome', role: 'host', you: null });
    // Everyone's phone learns a big screen is here.
    await this.commit(Date.now());
  }

  private async resume(conn: Connection<ConnState>, token: string, now: number) {
    const person = findByToken(this.room!, token);
    if (!person) {
      this.send(conn, { t: 'connect-error', error: 'bad-token' });
      return;
    }
    conn.setState({ kind: 'person', id: person.id });
    setConnected(this.room!, person.id, true, now);
    this.send(conn, { t: 'welcome', role: person.role, you: { id: person.id, token: person.token } });
    await this.commit(now);
  }

  private async join(conn: Connection<ConnState>, msg: Extract<ClientMessage, { t: 'join' }>, now: number) {
    const ip = conn.state?.kind === 'pending' ? conn.state.ip : 'unknown';
    const failKey = `${ip}|${msg.deviceId}`;
    if ((this.passwordFailures.get(failKey) ?? 0) >= MAX_PASSWORD_FAILURES) return this.reject(conn, 'too-many-attempts');

    if (this.auth?.password) {
      const attempt = await hashPassword(msg.password ?? '', this.auth.password.salt);
      if (!safeEqual(attempt.hash, this.auth.password.hash)) {
        // Only real attempts count: a phone checking the door with no password isn't guessing.
        if (msg.password) this.passwordFailures.set(failKey, (this.passwordFailures.get(failKey) ?? 0) + 1);
        return this.reject(conn, 'bad-password');
      }
    }

    const result = join(this.room!, { deviceId: msg.deviceId, name: msg.name, now });
    if (!result.ok) return this.reject(conn, result.error);
    conn.setState({ kind: 'person', id: result.person.id });
    this.send(conn, { t: 'welcome', role: result.person.role, you: { id: result.person.id, token: result.person.token } });
    await this.commit(now);
  }

  private reject(conn: Connection<ConnState>, error: ConnectError) {
    this.send(conn, { t: 'connect-error', error });
  }

  // ── State sync ────────────────────────────────────────────────────────────

  /** Persist, schedule the next wake-up and send everyone their view. `leaving` is a socket on its way out. */
  private async commit(now: number, leaving?: string) {
    if (!this.room) return;
    await this.ctx.storage.put('room', stripDrawings(this.room));
    await this.flushDrawings();

    const connected = [...this.getConnections()].length;
    const wake = nextWake(this.room, now);
    const expiry = connected === 0 ? now + ROOM.emptyRoomTtl : null;
    const next = [wake, expiry].filter((t): t is number => t !== null);
    if (next.length) await this.ctx.storage.setAlarm(Math.min(...next));
    else await this.ctx.storage.deleteAlarm();

    const screen = [...this.getConnections<ConnState>()].some((c) => c.id !== leaving && c.state?.kind === 'host');
    for (const conn of this.getConnections<ConnState>()) if (conn.id !== leaving) this.sendView(conn, now, screen);
  }

  private viewerOf(conn: Connection<ConnState>): Viewer | null {
    const s = conn.state;
    if (s?.kind === 'host') return { kind: 'stage' };
    if (s?.kind === 'person') {
      const p = this.room?.people.find((x) => x.id === s.id);
      return p ? { kind: p.role, id: p.id } : null;
    }
    return null;
  }

  private sendView(conn: Connection<ConnState>, now: number, screen: boolean) {
    const viewer = this.viewerOf(conn);
    if (!viewer || !this.room) return;
    const view = viewFor(this.room, viewer, now, screen);
    const sent = this.sentDrawings.get(conn.id) ?? new Set<string>();
    for (const id of referencedDrawings(view)) {
      const drawing = this.room.drawings[id];
      if (drawing && !sent.has(id)) {
        this.send(conn, { t: 'drawing', id, drawing });
        sent.add(id);
      }
    }
    this.sentDrawings.set(conn.id, sent);
    this.send(conn, { t: 'state', view });
  }

  private relayDrawOp(from: Connection<ConnState>, op: DrawOp) {
    const game = this.room?.game;
    if (!game || game.game !== 'sketch' || !game.drawingId) return;
    const id = game.drawingId;
    this.markDrawingsDirty();
    this.scheduleFlush();
    for (const conn of this.getConnections<ConnState>()) {
      if (conn.id === from.id) continue;
      const sent = this.sentDrawings.get(conn.id) ?? new Set<string>();
      if (sent.has(id)) this.send(conn, { t: 'draw-op', id, op });
      else {
        this.send(conn, { t: 'drawing', id, drawing: this.room!.drawings[id] });
        sent.add(id);
        this.sentDrawings.set(conn.id, sent);
      }
    }
  }

  private markDrawingsDirty() {
    for (const id of Object.keys(this.room?.drawings ?? {})) this.dirtyDrawings.add(id);
  }

  private scheduleFlush() {
    this.flushTimer ??= setTimeout(() => {
      this.flushTimer = null;
      void this.flushDrawings();
    }, DRAWING_FLUSH_MS);
  }

  private async flushDrawings() {
    if (!this.room) return;
    const current = this.room.drawings;
    const puts: Record<string, Drawing> = {};
    for (const id of this.dirtyDrawings) if (current[id]) puts[`d:${id}`] = current[id];
    const stale = [...this.persistedDrawings].filter((id) => !current[id]).map((id) => `d:${id}`);
    this.dirtyDrawings.clear();
    if (Object.keys(puts).length) await this.ctx.storage.put(puts);
    if (stale.length) await this.ctx.storage.delete(stale);
    for (const key of Object.keys(puts)) this.persistedDrawings.add(key.slice(2));
    for (const key of stale) this.persistedDrawings.delete(key.slice(2));
  }

  /** The host ended the room: tell everyone, disconnect everyone, forget everything. */
  private async closeRoom() {
    for (const conn of this.getConnections<ConnState>()) {
      this.send(conn, { t: 'removed', reason: 'closed' });
      conn.close(4410, 'Room closed');
    }
    const code = this.room?.code;
    this.room = null;
    this.auth = null;
    await this.ctx.storage.deleteAll();
    if (code) await releaseSlot(this.env, code);
  }

  private removeConnections(personId: string, reason: 'kicked' | 'banned') {
    for (const conn of this.getConnections<ConnState>()) {
      if (conn.state?.kind === 'person' && conn.state.id === personId) {
        this.send(conn, { t: 'removed', reason });
        conn.setState({ kind: 'pending', ip: 'removed', at: Date.now() });
        conn.close(4403, reason);
      }
    }
  }

  private send(conn: Connection, msg: ServerMessage) {
    try {
      conn.send(JSON.stringify(msg));
    } catch {
      // socket already closing
    }
  }

  private broadcastMessage(msg: ServerMessage) {
    this.broadcast(JSON.stringify(msg));
  }
}

/** Drawings are stored under their own keys so the room record stays small. */
function stripDrawings(room: RoomState): RoomState {
  return { ...room, drawings: {} };
}
