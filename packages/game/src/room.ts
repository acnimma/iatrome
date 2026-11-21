import { type HostEvent, hostLines } from '@iatrome/content';
import { EXTENDED_TIMERS_FACTOR, REVEAL, ROOM, STAT } from './constants';
import type { ActionOutcome, GameContext, Viewer } from './games/context';
import { startTiebreak } from './games/tiebreak';
import { type GameAction, type GameView, games } from './games/registry';
import { createRng } from './rng';
import { cleanText, comparable } from './text';
import {
  AVATARS,
  type GameId,
  type PlayableGameId,
  type GameResult,
  type HostLine,
  type Person,
  type RoomSettings,
  type RoomState,
  type StatGrant,
  defaultSettings,
} from './types';

/**
 * The room: lobby, people, moderation and the current game. Server-authoritative:
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

export function join(room: RoomState, opts: { deviceId: string; name: string; now: number }): JoinResult {
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
  if (!p) return;
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
  return room.people.filter((p) => p.role === 'player' && p.connected).sort((a, b) => a.joinedAt - b.joinedAt)[0]?.id ?? null;
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
  /** End the room for everyone (handled by the server: it disconnects everyone and deletes the room). */
  | { type: 'close' };

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
      if (cmd.type === 'ban') room.bannedDevices.push(p.deviceId);
      if (room.game) {
        games[room.game.game].settle(room.game, ctx);
        checkFinished(room, now);
      }
      return;
    }
    case 'hide':
      if (room.game) games[room.game.game].hide?.(room.game, ctx, cmd.target);
      return;
    case 'close':
      return;
    case 'settings':
      room.settings = sanitizeSettings({ ...room.settings, ...cmd.settings }, room.devMode);
      return;
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
  const game = module.start(
    ctx,
    ready.slice(0, module.maxPlayers).map((p) => p.id),
  );
  const stats = room.stats ?? {};
  game.stat = { ready: game.playerIds.filter((id: string) => stats[id]), used: {} };
  room.game = game;
}

/** Spend a Stat on the current round (or, in Grand Rounds, on one of your prompts). */
function callStat(room: RoomState, person: Person, target: string | undefined, now: number): ActionOutcome {
  const game = room.game!;
  if (!game.stat?.ready.includes(person.id)) return { error: 'You don’t have a Stat to call.' };
  const key = games[game.game].statKey(game, context(room, now), person.id, target);
  if (typeof key !== 'string') return key;
  game.stat.ready = game.stat.ready.filter((id) => id !== person.id);
  game.stat.used[person.id] = key;
  delete room.stats?.[person.id];
  say(room, now, 'statCalled', { name: person.name });
  return { notice: 'stat' };
}

/** Who carries a Stat into the next game: the top finishers, plus last place in bigger groups. */
function grantStats(result: GameResult): Record<string, StatGrant> {
  // Team games rank whole teams together, so individual points decide here.
  const order = result.teams ? [...result.standings].sort((a, b) => b.score - a.score) : result.standings;
  const grants: Record<string, StatGrant> = {};
  for (const s of order.slice(0, STAT.top(order.length))) grants[s.playerId] = 'top';
  const last = order.at(-1);
  if (order.length >= STAT.mercyFrom && last && !grants[last.playerId]) grants[last.playerId] = 'mercy';
  return grants;
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

/** Players level for first place, when that is a real tie (someone scored, and more than one leader). */
function tiedLeaders(result: GameResult): string[] {
  if (result.teams) {
    const top = result.teams.filter((t) => t.rank === 1);
    return top.length > 1 && top[0].score > 0 ? top.flatMap((t) => t.members) : [];
  }
  const top = result.standings.filter((s) => s.rank === 1);
  return top.length > 1 && top[0].score > 0 ? top.map((s) => s.playerId) : [];
}

function checkFinished(room: RoomState, now: number) {
  if (!room.game) return;
  const result = games[room.game.game].result(room.game, context(room, now));
  if (!result) return;
  // A tie for first is settled by sudden-death trivia before anyone is crowned (never twice).
  if (room.game.game !== 'tiebreak') {
    const ctx = context(room, now);
    const tied = ctx.connectedPlayers(tiedLeaders(result));
    if (tied.length >= 2) {
      room.game = startTiebreak(ctx, result, tied);
      return;
    }
  }
  room.result = result;
  room.stats = grantStats(result);
  room.stage = 'over';
  room.game = null;
  room.drawings = {};
  // Team games crown the team. Beep waits for the podium to climb to first place.
  const winner = result.teams?.[0]?.name ?? result.standings[0]?.name;
  if (winner) say(room, now, 'winner', { name: winner }, REVEAL.podium);
}

// ── Player actions ───────────────────────────────────────────────────────────

export type PlayerCommand = GameAction | { type: 'start' } | { type: 'leave' } | { type: 'avatar'; avatar: number } | { type: 'stat'; target?: string };

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
  if (cmd.type === 'stat') return callStat(room, person, cmd.target, now);
  const outcome = games[room.game.game].act(room.game, context(room, now), personId, cmd);
  checkFinished(room, now);
  return outcome;
}

// ── Time ─────────────────────────────────────────────────────────────────────

/** Share of Pro-mode content drawn from the clinical pool. */
const PRO_SHARE = 0.7;

/** When the server should next call `advance`. */
export function nextWake(room: RoomState, now: number): number | null {
  if (room.pausedAt !== null || !room.game) return null;
  const times: number[] = [];
  if (room.game.phase.endsAt !== null) times.push(room.game.phase.endsAt);
  for (const t of games[room.game.game].wakeAt?.(room.game) ?? []) if (t > now) times.push(t);
  for (const p of room.people)
    if (!p.connected && p.disconnectedAt !== null && p.disconnectedAt + ROOM.reconnectGrace > now)
      times.push(p.disconnectedAt + ROOM.reconnectGrace);
  return times.length ? Math.min(...times) : null;
}

/** Run deadlines and reconnect-grace expiries. Returns true if anything changed. */
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

    if (module.tick?.(game, ctx)) acted = true;

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
    say: (event, vars, delay) => say(room, now, event, vars, delay),
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

function say(room: RoomState, now: number, event: HostEvent, vars: Record<string, string> = {}, delay?: number) {
  const lines = hostLines[event];
  if (!lines?.length) return;
  const rng = createRng(room.rng);
  const fresh = lines.filter((l) => !room.recentLines.includes(l));
  const line = rng.pick(fresh.length ? fresh : lines);
  room.recentLines = [...room.recentLines.slice(-15), line];
  const text = line.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
  room.hostLine = { event, text, at: now, ...(delay ? { delay } : {}) } satisfies HostLine;
}

// ── Settings ─────────────────────────────────────────────────────────────────

function sanitizeSettings(s: RoomSettings, devMode: boolean): RoomSettings {
  // The tie-breaker is internal: it can't be picked, only triggered.
  const gameIds = (Object.keys(games) as GameId[]).filter((id): id is PlayableGameId => id !== 'tiebreak');
  return {
    game: gameIds.includes(s.game) ? s.game : defaultSettings.game,
    mode: s.mode === 'pro' ? 'pro' : 'normal',
    extendedTimers: Boolean(s.extendedTimers),
    teams: s.teams !== false,
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
  /** Playing in the current game (vs watching). */
  inGame: boolean;
}

/** Stats as one viewer sees them. Whose Stat rode on a round is only shown once its results are up. */
export interface StatView {
  /** Earned in the last game for the next one (lobby and results). */
  holders: { id: string; grant: StatGrant }[];
  /** You hold one you can still call this game. */
  ready: boolean;
  /** The round you spent yours on (Grand Rounds: a matchup id). */
  used: string | null;
  /** Your Stat is on the round in play. */
  onThis: boolean;
  /** Players whose Stat rode on the round whose results are showing. */
  calls: string[];
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
  stat: StatView;
  /** A big screen (the stage) is connected. Without one, phones show everything themselves. */
  screen: boolean;
}

export function viewFor(room: RoomState, viewer: Viewer, now: number, screen = false): RoomView {
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
    stat: statView(room, me?.id ?? null),
    screen,
  };
}

function statView(room: RoomState, you: string | null): StatView {
  const holders = Object.entries(room.stats ?? {}).map(([id, grant]) => ({ id, grant }));
  const game = room.game;
  if (!game?.stat) return { holders, ready: false, used: null, onThis: false, calls: [] };
  const round = games[game.game].statRound(game);
  const used = you ? (game.stat.used[you] ?? null) : null;
  return {
    holders,
    ready: Boolean(you && game.stat.ready.includes(you)),
    used,
    onThis: used !== null && used === round.key,
    calls: round.revealed ? Object.keys(game.stat.used).filter((id) => game.stat!.used[id] === round.key) : [],
  };
}

/** Drawing ids referenced by the current view (so the server can ship them). */
export function referencedDrawings(view: RoomView): string[] {
  const g = view.game;
  if (!g) return [];
  if (g.game === 'sketch') return [...(g.drawingId ? [g.drawingId] : []), ...(g.gallery ?? []).map((x) => x.drawingId)];
  return [];
}
