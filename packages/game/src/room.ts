import { type HostEvent, hostLines } from '@iatrome/content';
import { EXTENDED_TIMERS_FACTOR, ROOM } from './constants';
import type { ActionOutcome, GameContext, Viewer } from './games/context';
import { type GameAction, type GameView, games } from './games/registry';
import { createRng } from './rng';
import { cleanText, comparable } from './text';
import {
  AVATARS,
  type GameId,
  type GameResult,
  type HostLine,
  type Person,
  type RoomSettings,
  type RoomState,
  defaultSettings,
} from './types';

/**
 * The room: lobby, people, moderation and the current game. Server-authoritative , 
 * the realtime server calls these functions, persists the state and broadcasts views.
 * Everything takes `now` explicitly so the engine is deterministic and testable.
 */

// ── Creation ─────────────────────────────────────────────────────────────────

export function createRoom(opts: {
  code: string;
  seed: number;
  now: number;
  devMode?: boolean;
  settings?: Partial<RoomSettings>;
}): RoomState {
  return {
    code: opts.code,
    createdAt: opts.now,
    devMode: opts.devMode ?? false,
    rng: { seed: opts.seed, draws: 0 },
    settings: sanitizeSettings({ ...defaultSettings, ...opts.settings }, opts.devMode ?? false),
    people: [],
    bannedDevices: [],
    locked: false,
    stage: 'lobby',
    game: null,
    result: null,
    pausedAt: null,
    hostLine: null,
    recentLines: [],
    usedContent: [],
    drawings: {},
  };
}

export function generateCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < ROOM.codeLength; i++) code += ROOM.codeAlphabet[Math.floor(random() * ROOM.codeAlphabet.length)];
  return code;
}

export const isRoomCode = (s: string) => new RegExp(`^[${ROOM.codeAlphabet}]{${ROOM.codeLength}}$`).test(s);

// ── People ───────────────────────────────────────────────────────────────────

export type JoinError = 'banned' | 'locked' | 'full' | 'name-taken' | 'name-invalid';

export type JoinResult = { ok: true; person: Person } | { ok: false; error: JoinError };

export function join(room: RoomState, opts: { deviceId: string; name: string; now: number; isBot?: boolean }): JoinResult {
  if (room.bannedDevices.includes(opts.deviceId)) return { ok: false, error: 'banned' };
  if (room.locked) return { ok: false, error: 'locked' };
  if (room.people.length >= ROOM.maxPeople) return { ok: false, error: 'full' };

  const name = cleanText(opts.name, ROOM.maxNameLength);
  if (!name || !comparable(name)) return { ok: false, error: 'name-invalid' };
  if (room.people.some((p) => comparable(p.name) === comparable(name))) return { ok: false, error: 'name-taken' };

  const playing = room.stage === 'playing';
  const playerCount = room.people.filter((p) => p.role === 'player').length;
  // Mid-game, people wait for the next game, unless this game takes late arrivals (team trivia).
  const lateEntry = playing && room.game && games[room.game.game].addPlayer && playerCount < games[room.game.game].maxPlayers;

  const rng = createRng(room.rng);
  const usedAvatars = new Set(room.people.map((p) => p.avatar));
  const free = AVATARS.map((_, i) => i).filter((i) => !usedAvatars.has(i));
  const person: Person = {
    id: rng.id(10),
    token: rng.id(24),
    deviceId: opts.deviceId,
    name,
    avatar: free.length ? rng.pick(free) : rng.int(AVATARS.length),
    role: (playing && !lateEntry) || playerCount >= ROOM.maxPlayers ? 'audience' : 'player',
    connected: true,
    disconnectedAt: null,
    joinedAt: opts.now,
    isBot: opts.isBot ?? false,
  };
  room.people.push(person);
  if (lateEntry && room.game) games[room.game.game].addPlayer!(room.game, context(room, opts.now), person.id);
  return { ok: true, person };
}

export function findByToken(room: RoomState, token: string): Person | null {
  return room.people.find((p) => p.token === token) ?? null;
}

export function setConnected(room: RoomState, personId: string, connected: boolean, now: number) {
  const p = room.people.find((x) => x.id === personId);
  if (!p || p.isBot) return;
  p.connected = connected;
  p.disconnectedAt = connected ? null : now;
}

export function setAvatar(room: RoomState, personId: string, avatar: number) {
  const p = room.people.find((x) => x.id === personId);
  if (!p || !Number.isInteger(avatar) || avatar < 0 || avatar >= AVATARS.length) return;
  if (room.people.some((x) => x.id !== personId && x.avatar === avatar)) return;
  p.avatar = avatar;
}

/** The VIP is the earliest-joined present player: they can start the game from their phone. */
export function vipId(room: RoomState): string | null {
  return room.people.filter((p) => p.role === 'player' && p.connected && !p.isBot).sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id ?? null;
}

// ── Host controls ────────────────────────────────────────────────────────────

export type HostCommand =
  | { type: 'start' }
  | { type: 'again' }
  | { type: 'lobby' }
  | { type: 'end' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'skip' }
  | { type: 'lock' }
  | { type: 'unlock' }
  | { type: 'kick'; id: string }
  | { type: 'ban'; id: string }
  | { type: 'hide'; target: string }
  | { type: 'settings'; settings: Partial<RoomSettings> }
  | { type: 'add-bot' };

/** Returns an error message for the host, if any. */
export function hostCommand(room: RoomState, cmd: HostCommand, now: number): string | void {
  const ctx = context(room, now);
  switch (cmd.type) {
    case 'start':
    case 'again':
      return startGame(room, now);
    case 'lobby':
    case 'end':
      room.stage = 'lobby';
      room.game = null;
      room.pausedAt = null;
      room.drawings = {};
      if (cmd.type === 'lobby') promoteAudience(room);
      return;
    case 'pause':
      if (room.stage === 'playing' && room.pausedAt === null) room.pausedAt = now;
      return;
    case 'resume':
      resume(room, now);
      return;
    case 'skip':
      if (room.game && room.game.phase.endsAt !== null) {
        resume(room, now);
        games[room.game.game].timeout(room.game, context(room, now));
        checkFinished(room, now);
      }
      return;
    case 'lock':
      room.locked = true;
      return;
    case 'unlock':
      room.locked = false;
      return;
    case 'kick':
    case 'ban': {
      const p = room.people.find((x) => x.id === cmd.id);
      if (!p) return;
      room.people = room.people.filter((x) => x.id !== cmd.id);
      if (cmd.type === 'ban' && !p.isBot) room.bannedDevices.push(p.deviceId);
      if (room.game) {
        games[room.game.game].settle(room.game, ctx);
        checkFinished(room, now);
      }
      return;
    }
    case 'hide':
      if (room.game) games[room.game.game].hide?.(room.game, ctx, cmd.target);
      return;
    case 'settings':
      room.settings = sanitizeSettings({ ...room.settings, ...cmd.settings }, room.devMode);
      return;
    case 'add-bot': {
      if (!room.devMode) return 'Bots are only available in development.';
      const names = ['Dr. Bot', 'Nurse Bot', 'PA Bot', 'DDS Bot', 'PharmBot', 'Intern Bot', 'Resident Bot', 'Scrub Bot'];
      const name = names.find((n) => !room.people.some((p) => p.name === n)) ?? `Bot ${room.people.length}`;
      const r = join(room, { deviceId: `bot-${name}`, name, now, isBot: true });
      return r.ok ? undefined : 'Couldn’t add a bot.';
    }
  }
}

function startGame(room: RoomState, now: number): string | void {
  if (room.stage === 'playing') return 'A game is already running.';
  promoteAudience(room); // whoever's watching between games gets a seat if there's room
  const module = games[room.settings.game];
  const ready = room.people.filter((p) => p.role === 'player' && p.connected).sort((a, b) => a.joinedAt - b.joinedAt);
  if (ready.length < module.minPlayers) return `This game needs at least ${module.minPlayers} players.`;
  const ctx = context(room, now);
  room.drawings = {};
  room.result = null;
  room.pausedAt = null;
  room.stage = 'playing';
  room.game = module.start(
    ctx,
    ready.slice(0, module.maxPlayers).map((p) => p.id),
  );
}

function resume(room: RoomState, now: number) {
  if (room.pausedAt === null) return;
  const shift = now - room.pausedAt;
  room.pausedAt = null;
  if (!room.game) return;
  room.game.phase.startedAt += shift;
  if (room.game.phase.endsAt !== null) room.game.phase.endsAt += shift;
}

function promoteAudience(room: RoomState) {
  for (const p of room.people.sort((a, b) => a.joinedAt - b.joinedAt)) {
    const players = room.people.filter((x) => x.role === 'player').length;
    if (p.role === 'audience' && players < ROOM.maxPlayers) p.role = 'player';
  }
}

function checkFinished(room: RoomState, now: number) {
  if (!room.game) return;
  const result = games[room.game.game].result(room.game, context(room, now));
  if (!result) return;
  room.result = result;
  room.stage = 'over';
  room.game = null;
  room.drawings = {};
  const top = result.standings[0];
  if (top) say(room, now, 'winner', { name: top.name });
}

// ── Player actions ───────────────────────────────────────────────────────────

export type PlayerCommand = GameAction | { type: 'start' } | { type: 'leave' } | { type: 'avatar'; avatar: number };

export function playerCommand(room: RoomState, personId: string, cmd: PlayerCommand, now: number): ActionOutcome | void {
  const person = room.people.find((p) => p.id === personId);
  if (!person) return { error: 'You’re not in this room.' };
  if (cmd.type === 'leave') {
    room.people = room.people.filter((p) => p.id !== personId);
    if (room.game) {
      games[room.game.game].settle(room.game, context(room, now));
      checkFinished(room, now);
    }
    return;
  }
  if (cmd.type === 'avatar') {
    if (room.stage !== 'playing') setAvatar(room, personId, cmd.avatar);
    return;
  }
  if (cmd.type === 'start') {
    if (vipId(room) !== personId) return { error: 'Only the host can start.' };
    const err = startGame(room, now);
    return err ? { error: err } : undefined;
  }
  if (!room.game || room.pausedAt !== null) return { error: room.pausedAt ? 'The game is paused.' : 'No game running.' };
  const outcome = games[room.game.game].act(room.game, context(room, now), personId, cmd);
  checkFinished(room, now);
  return outcome;
}

// ── Time ─────────────────────────────────────────────────────────────────────

const BOT_TICK = 900;
/** Share of Pro-mode content drawn from the clinical pool. */
const PRO_SHARE = 0.7;

/** When the server should next call `advance`. */
export function nextWake(room: RoomState, now: number): number | null {
  if (room.pausedAt !== null || !room.game) return null;
  const times: number[] = [];
  if (room.game.phase.endsAt !== null) times.push(room.game.phase.endsAt);
  for (const p of room.people)
    if (!p.connected && p.disconnectedAt !== null && p.disconnectedAt + ROOM.reconnectGrace > now)
      times.push(p.disconnectedAt + ROOM.reconnectGrace);
  if (room.people.some((p) => p.isBot && room.game!.playerIds.includes(p.id))) times.push(now + BOT_TICK * room.settings.speed);
  return times.length ? Math.min(...times) : null;
}

/** Run deadlines, reconnect-grace expiries and bots. Returns true if anything changed. */
export function advance(room: RoomState, now: number): boolean {
  if (room.pausedAt !== null || !room.game) return false;
  let changed = false;

  // Reconnect grace expired: let games stop waiting for dropouts.
  const expired = room.people.some(
    (p) => !p.connected && p.disconnectedAt !== null && p.disconnectedAt + ROOM.reconnectGrace <= now && p.disconnectedAt + ROOM.reconnectGrace > now - 60_000,
  );
  if (expired) {
    games[room.game.game].settle(room.game, context(room, now));
    changed = true;
  }

  for (let guard = 0; guard < 32 && room.game; guard++) {
    const game = room.game;
    const module = games[game.game];
    const ctx = context(room, now);
    let acted = false;

    const bots = room.people.filter((p) => p.isBot && game.playerIds.includes(p.id));
    bots.forEach((bot, i) => {
      if (now >= game.phase.startedAt + (1200 + i * 700) * room.settings.speed && module.bot(game, ctx, bot.id)) acted = true;
    });

    if (game.phase.endsAt !== null && game.phase.endsAt <= now) {
      module.timeout(game, ctx);
      acted = true;
    }
    checkFinished(room, now);
    if (!acted) break;
    changed = true;
  }
  return changed;
}

// ── Context ──────────────────────────────────────────────────────────────────

function context(room: RoomState, now: number): GameContext {
  const rng = createRng(room.rng);
  return {
    now,
    rng,
    room,
    person: (id) => room.people.find((p) => p.id === id) ?? null,
    connectedPlayers: (ids) =>
      ids.filter((id) => {
        const p = room.people.find((x) => x.id === id);
        return Boolean(p && (p.connected || (p.disconnectedAt !== null && now - p.disconnectedAt < ROOM.reconnectGrace)));
      }),
    say: (event, vars) => say(room, now, event, vars),
    scale: (ms, kind = 'show') =>
      Math.round(ms * room.settings.speed * (kind === 'input' && room.settings.extendedTimers ? EXTENDED_TIMERS_FACTOR : 1)),
    draw: (pool, count) => {
      // Normal mode: everyday items only. Pro mode: mostly clinical items, topped up with everyday ones.
      const take = <T extends { id: string }>(items: readonly T[], n: number): T[] => {
        const used = new Set(room.usedContent);
        let fresh = items.filter((item) => !used.has(item.id));
        if (fresh.length < n) {
          // Everything's been seen: recycle these.
          const ids = new Set(items.map((i) => i.id));
          room.usedContent = room.usedContent.filter((id) => !ids.has(id));
          fresh = items.slice();
        }
        const picked = rng.shuffle(fresh).slice(0, n);
        room.usedContent.push(...picked.map((p) => p.id));
        return picked;
      };
      const everyday = pool.filter((item) => item.breadth === 'universal');
      if (room.settings.mode === 'normal') return take(everyday, count);
      const clinical = take(pool.filter((item) => item.breadth === 'clinical'), Math.round(count * PRO_SHARE));
      return rng.shuffle([...clinical, ...take(everyday, count - clinical.length)]);
    },
  };
}

function say(room: RoomState, now: number, event: HostEvent, vars: Record<string, string> = {}) {
  const lines = hostLines[event];
  if (!lines?.length) return;
  const rng = createRng(room.rng);
  const fresh = lines.filter((l) => !room.recentLines.includes(l));
  const line = rng.pick(fresh.length ? fresh : lines);
  room.recentLines = [...room.recentLines.slice(-15), line];
  const text = line.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
  room.hostLine = { event, text, at: now } satisfies HostLine;
}

// ── Settings ─────────────────────────────────────────────────────────────────

function sanitizeSettings(s: RoomSettings, devMode: boolean): RoomSettings {
  const gameIds = Object.keys(games) as GameId[];
  return {
    game: gameIds.includes(s.game) ? s.game : defaultSettings.game,
    mode: s.mode === 'pro' ? 'pro' : 'normal',
    extendedTimers: Boolean(s.extendedTimers),
    speed: devMode && typeof s.speed === 'number' && s.speed >= 0.02 && s.speed <= 1 ? s.speed : 1,
  };
}

// ── Views ────────────────────────────────────────────────────────────────────

export interface PersonView {
  id: string;
  name: string;
  avatar: number;
  role: 'player' | 'audience';
  connected: boolean;
  isBot: boolean;
  /** Playing in the current game (vs watching). */
  inGame: boolean;
}

export interface RoomView {
  code: string;
  stage: RoomState['stage'];
  settings: RoomSettings;
  locked: boolean;
  devMode: boolean;
  people: PersonView[];
  vip: string | null;
  you: { id: string; role: 'player' | 'audience'; inGame: boolean } | null;
  hostLine: HostLine | null;
  paused: boolean;
  pausedAt: number | null;
  game: GameView | null;
  result: GameResult | null;
  serverNow: number;
}

export function viewFor(room: RoomState, viewer: Viewer, now: number): RoomView {
  const ctx = context(room, now);
  const inGame = (id: string) => Boolean(room.game?.playerIds.includes(id));
  const me = viewer.kind === 'stage' ? null : room.people.find((p) => p.id === viewer.id);
  return {
    code: room.code,
    stage: room.stage,
    settings: room.settings,
    locked: room.locked,
    devMode: room.devMode,
    people: room.people.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      role: p.role,
      connected: p.connected,
      isBot: p.isBot,
      inGame: inGame(p.id),
    })),
    vip: vipId(room),
    you: me ? { id: me.id, role: me.role, inGame: inGame(me.id) } : null,
    hostLine: room.hostLine,
    paused: room.pausedAt !== null,
    pausedAt: room.pausedAt,
    game: room.game ? games[room.game.game].view(room.game, ctx, viewer) : null,
    result: room.result,
    serverNow: now,
  };
}

/** Drawing ids referenced by the current view (so the server can ship them). */
export function referencedDrawings(view: RoomView): string[] {
  const g = view.game;
  if (!g) return [];
  if (g.game === 'grand-rounds') return (g.matchup?.entries ?? []).map((e) => e.drawingId).filter((x): x is string => Boolean(x));
  if (g.game === 'sketch') return g.drawingId ? [g.drawingId] : [];
  return [];
}
