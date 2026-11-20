import type { HostEvent } from '@iatrome/content';
import { READING } from '../constants';
import type { Rng } from '../rng';
import type { GameId, GameResult, Person, Phase, RoomState } from '../types';

/** Everything a game module may touch while handling an event. */
export interface GameContext {
  now: number;
  rng: Rng;
  room: RoomState;
  /** Look up a participant (null if they were kicked). */
  person(id: string): Person | null;
  /** Of these ids, players still present (connected, or within their reconnect grace). */
  connectedPlayers(playerIds: readonly string[]): string[];
  /** Have Beep say a line for this event, optionally after `delay` ms (to land after a reveal). */
  say(event: HostEvent, vars?: Record<string, string>, delay?: number): void;
  /** Scale a phase duration by the room's timer settings. */
  scale(ms: number, kind?: 'input' | 'show'): number;
  /** Draw `count` items no one in this room has seen yet (recycles when exhausted). */
  draw<T extends { id: string; breadth: 'universal' | 'clinical' }>(pool: readonly T[], count: number): T[];
}

export type Viewer = { kind: 'stage' } | { kind: 'player' | 'audience'; id: string };

export interface ActionOutcome {
  /** Private feedback for the acting player (e.g. "Too late!"). */
  error?: string;
  notice?: string;
}

export interface BaseGameState {
  game: GameId;
  playerIds: string[];
  scores: Record<string, number>;
  phase: Phase;
  /** Stats carried in from the last game: who can still call one, and which round each was spent on. */
  stat?: StatState;
}

/**
 * A Stat: the top finishers (and, in bigger groups, a pitied last place) carry one into
 * the next game. Called on one round, it doubles that player's points for it. Use it or lose it.
 */
export interface StatState {
  ready: string[];
  used: Record<string, string>;
}

/** Points for a round, doubled if the player called their Stat on it. */
export function statted(state: BaseGameState, playerId: string, round: string, points: number) {
  return state.stat?.used[playerId] === round ? points * 2 : points;
}

/** A game mode. Modules mutate their state in place; the room persists and broadcasts. */
export interface GameModule<S extends BaseGameState, A extends { type: string }, V> {
  id: GameId;
  minPlayers: number;
  maxPlayers: number;
  start(ctx: GameContext, playerIds: string[]): S;
  act(state: S, ctx: GameContext, playerId: string, action: A): ActionOutcome | void;
  /** The current phase's deadline passed. */
  timeout(state: S, ctx: GameContext): void;
  /** Someone left or timed out of their reconnect grace: advance if nobody else is needed. */
  settle(state: S, ctx: GameContext): void;
  /** Host pressed "hide" on the current item (Grand Rounds answers, guesses, defences). */
  hide?(state: S, ctx: GameContext, target: string): void;
  /** The game is over when this returns a result. */
  result(state: S, ctx: GameContext): GameResult | null;
  view(state: S, ctx: GameContext, viewer: Viewer): V;
  /** Games that take late arrivals (team trivia) seat them here. */
  addPlayer?(state: S, ctx: GameContext, playerId: string): void;
  /** The round a Stat called now would land on, or why it can't be called (`target` picks a Grand Rounds prompt). */
  statKey(state: S, ctx: GameContext, playerId: string, target?: string): string | { error: string };
  /** The round in play, and whether its results are showing (only then do others see whose Stat was on it). */
  statRound(state: S): { key: string | null; revealed: boolean };
  /** Moments inside a phase that need the server awake (hint letters, a nag before time's up). */
  wakeAt?(state: S): number[];
  /** Called on every wake; act on any moment that has arrived. Return true if anything changed. */
  tick?(state: S, ctx: GameContext): boolean;
  /** Dev bots: act if there's something to do. Return true if the bot did something. */
  bot(state: S, ctx: GameContext, botId: string): boolean;
}

// ── Helpers shared by game modules ───────────────────────────────────────────

export function setPhase<N extends string>(
  state: { phase: Phase },
  ctx: GameContext,
  name: N,
  durationMs: number | null,
  kind: 'input' | 'show' = 'show',
) {
  state.phase = {
    name,
    startedAt: ctx.now,
    endsAt: durationMs === null ? null : ctx.now + ctx.scale(durationMs, kind),
  };
}

/** A question's timer, plus reading time for long ones (Pro vignettes). */
export function questionTime(base: number, question: string, options: readonly string[]) {
  const length = question.length + options.join('').length / 2;
  return base + Math.min(READING.max, Math.max(0, length - READING.free) * READING.perChar);
}

/** Sorted standings, ties share a rank. */
export function standings(ctx: GameContext, scores: Record<string, number>, order?: string[]) {
  const ids = (order ?? Object.keys(scores)).filter((id) => ctx.person(id));
  const sorted = order ? ids : ids.sort((a, b) => scores[b] - scores[a]);
  let rank = 0;
  let last = Number.NaN;
  return sorted.map((id, i) => {
    if (order || scores[id] !== last) rank = i + 1;
    last = scores[id];
    const p = ctx.person(id)!;
    return { playerId: id, name: p.name, avatar: p.avatar, score: scores[id] ?? 0, rank };
  });
}

/**
 * Trivia order that feels like a game, not a test: a sawtooth of easy wins and
 * harder surprises (easy, medium, easy, hard, …) instead of a steady climb.
 */
export function sawtooth<T extends { difficulty: number }>(items: T[]): T[] {
  const by = (d: number) => items.filter((q) => q.difficulty === d);
  const queues = [by(1), by(2), by(3)];
  const pattern = [0, 1, 0, 2, 1, 0, 2, 1];
  const out: T[] = [];
  for (let i = 0; out.length < items.length; i++) {
    const want = pattern[i % pattern.length];
    const q = queues[want].shift() ?? queues.find((x) => x.length)?.shift();
    if (q) out.push(q);
  }
  return out;
}

/** Round to the nearest 10 so scores look tidy. */
export const tidy = (n: number) => Math.round(n / 10) * 10;
