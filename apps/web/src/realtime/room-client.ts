import {
  type ClientMessage,
  type ConnectError,
  type Drawing,
  type HostCommand,
  type PlayerCommand,
  type RoomView,
  type ServerMessage,
  applyDrawOp,
} from '@iatrome/game/client';
import { PartySocket } from 'partysocket';
import { realtimeTarget } from './config';
import { deviceId, hostToken, rememberSession, roomPassword, sessionToken } from './identity';

export type Status = 'connecting' | 'needs-join' | 'joining' | 'ready' | 'reconnecting' | 'failed';

export interface Snapshot {
  status: Status;
  view: RoomView | null;
  role: 'host' | 'player' | 'audience' | null;
  error: ConnectError | null;
  removed: 'kicked' | 'banned' | 'closed' | null;
  /** Latest private feedback (e.g. "filter blocked that"). `at` makes repeats distinct. */
  feedback: { error?: string; notice?: string; at: number } | null;
  /** The first connection is taking too long (server down, flaky network): offer a retry. */
  stalled: boolean;
  /**
   * What the door says before you type a name: 'locked', 'full', 'banned', 'bad-password'
   * (needs a password) or 'too-many-attempts'. Null when it's open (or not known yet).
   */
  gate: ConnectError | null;
}

type Listener = () => void;

export const EMPTY_SNAPSHOT: Snapshot = { status: 'connecting', view: null, role: null, error: null, removed: null, feedback: null, stalled: false, gate: null };

/** How long the first connection may take before the screen offers "Try again". */
const STALL_MS = 8_000;
export type ReactionEvent = { from: string; e: number; id: number };

/**
 * One live connection to a room. Handles auth (host / resume / join), automatic
 * reconnects, server clock sync, the drawing cache and reaction events.
 * React subscribes via `useRoom` (useSyncExternalStore).
 */
export class RoomClient {
  readonly code: string;
  private readonly asHost: boolean;
  private socket: PartySocket;
  private snapshot: Snapshot = { ...EMPTY_SNAPSHOT };
  private listeners = new Set<Listener>();
  private reactionListeners = new Set<(r: ReactionEvent) => void>();
  private drawingListeners = new Set<(id: string) => void>();
  private drawings = new Map<string, Drawing>();
  private offset = 0;
  private bestRtt = Infinity;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reactionSeq = 0;
  private stallTimer: ReturnType<typeof setTimeout> | null = null;
  /** A probe join is in flight: its connect-error describes the door, not a real failure. */
  private probing = false;
  private probed = false;

  constructor(code: string, opts: { asHost: boolean }) {
    this.code = code;
    this.asHost = opts.asHost;
    const { host, secure } = realtimeTarget();
    this.socket = new PartySocket({ host, protocol: secure ? 'wss' : 'ws', party: 'room', room: code, maxRetries: Infinity });
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('close', this.onClose);
    this.watchStall();
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  onReaction(listener: (r: ReactionEvent) => void) {
    this.reactionListeners.add(listener);
    return () => void this.reactionListeners.delete(listener);
  }

  onDrawing(listener: (id: string) => void) {
    this.drawingListeners.add(listener);
    return () => void this.drawingListeners.delete(listener);
  }

  drawing(id: string): Drawing | undefined {
    return this.drawings.get(id);
  }

  /** Server time, corrected for this device's clock skew. */
  serverNow = () => Date.now() + this.offset;

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Give up on the current attempt and dial again (after a stall). */
  retry() {
    this.update({ stalled: false });
    this.watchStall();
    this.socket.reconnect();
  }

  /**
   * Ask the door before anyone types a name: a join with no name is always refused, and the
   * reason says whether the room is locked, full, banned this device or wants a password.
   */
  probe() {
    if (this.asHost || this.socket.readyState !== WebSocket.OPEN) return;
    this.probing = true;
    this.probed = true;
    this.update({ error: null });
    this.send({ t: 'join', deviceId: deviceId(), name: '', password: roomPassword(this.code) || undefined });
  }

  join(name: string, password?: string) {
    this.update({ status: 'joining', error: null, stalled: false });
    this.watchStall();
    this.send({ t: 'join', deviceId: deviceId(), name, password: password || undefined });
  }

  command(cmd: PlayerCommand) {
    this.send({ t: 'cmd', cmd });
  }

  host(cmd: HostCommand) {
    this.send({ t: 'host-cmd', cmd });
  }

  react(e: number) {
    this.send({ t: 'react', e });
  }

  close() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.stallTimer) clearTimeout(this.stallTimer);
    this.socket.close();
    this.listeners.clear();
  }

  // ── Socket events ─────────────────────────────────────────────────────────

  private onOpen = () => {
    this.bestRtt = Infinity;
    [0, 250, 600].forEach((delay) => setTimeout(() => this.ping(), delay));
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.ping(), 10_000);

    if (this.asHost) {
      const token = hostToken(this.code);
      if (token) this.send({ t: 'host', token });
      else this.update({ status: 'failed', error: 'bad-token' });
      return;
    }
    const token = sessionToken(this.code);
    if (token) this.send({ t: 'resume', token });
    else {
      this.settled();
      this.update({ status: 'needs-join' });
      if (!this.probed) this.probe();
    }
  };

  private onClose = () => {
    if (this.snapshot.removed || this.snapshot.status === 'failed') return;
    if (this.snapshot.status === 'ready') this.update({ status: 'reconnecting' });
  };

  private onMessage = (event: MessageEvent) => {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    this.settled();
    switch (msg.t) {
      case 'welcome':
        if (msg.you) {
          rememberSession(this.code, msg.you.token);
          // This phone created the room (phones-only): unlock host controls on it.
          const host = hostToken(this.code);
          if (host) this.send({ t: 'claim-host', token: host });
        }
        this.update({ status: 'ready', role: msg.role, error: null, gate: null });
        return;
      case 'state':
        this.update({ view: msg.view, status: 'ready', role: this.snapshot.role ?? (this.asHost ? 'host' : null) });
        return;
      case 'drawing':
        this.drawings.set(msg.id, msg.drawing);
        this.drawingListeners.forEach((l) => l(msg.id));
        return;
      case 'draw-op': {
        const d = this.drawings.get(msg.id);
        if (d) {
          applyDrawOp(d, msg.op);
          this.drawingListeners.forEach((l) => l(msg.id));
        }
        return;
      }
      case 'feedback':
        this.update({ feedback: { error: msg.error, notice: msg.notice, at: Date.now() } });
        return;
      case 'connect-error':
        if (this.probing && msg.error !== 'no-room') {
          this.probing = false;
          this.update({ gate: msg.error === 'name-invalid' || msg.error === 'name-taken' ? null : msg.error });
          return;
        }
        if (msg.error === 'bad-token' && !this.asHost) {
          // Our saved session is gone (room restarted or we were removed): join fresh.
          rememberSession(this.code, null);
          this.update({ status: 'needs-join', error: null });
          return;
        }
        if (msg.error === 'no-room') this.socket.close();
        this.update({ status: msg.error === 'no-room' || this.asHost ? 'failed' : 'needs-join', error: msg.error });
        return;
      case 'pong': {
        const now = Date.now();
        const rtt = now - msg.c;
        if (rtt <= this.bestRtt) {
          this.bestRtt = rtt;
          this.offset = msg.s - (msg.c + rtt / 2);
        }
        return;
      }
      case 'react':
        this.reactionListeners.forEach((l) => l({ from: msg.from, e: msg.e, id: this.reactionSeq++ }));
        return;
      case 'removed':
        rememberSession(this.code, null);
        this.update({ removed: msg.reason });
        this.socket.close();
        return;
    }
  };

  /** If nothing answers within a few seconds of dialling, say so instead of "Connecting…" forever. */
  private watchStall() {
    if (this.stallTimer) clearTimeout(this.stallTimer);
    this.stallTimer = setTimeout(() => {
      this.stallTimer = null;
      const { status, view } = this.snapshot;
      if (status === 'joining') {
        // The join went out and nothing came back: hand the form back and redial underneath it.
        this.update({ stalled: true, status: 'needs-join' });
        this.socket.reconnect();
      } else if (status === 'connecting' || (status === 'ready' && !view)) this.update({ stalled: true });
    }, STALL_MS);
  }

  /** The server answered: whatever happens next, we're not stuck dialling. */
  private settled() {
    if (this.stallTimer) clearTimeout(this.stallTimer);
    this.stallTimer = null;
    if (this.snapshot.stalled) this.update({ stalled: false });
  }

  private ping() {
    this.send({ t: 'ping', c: Date.now() });
  }

  private send(msg: ClientMessage) {
    if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(msg));
  }

  private update(patch: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((l) => l());
  }
}
