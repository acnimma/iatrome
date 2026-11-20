import type { HostEvent } from '@iatrome/content';
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
  /** Have Beep say a line for this event. */
  say(event: HostEvent, vars?: Record<string, string>): void;
  /** Scale a phase duration by the room's timer settings. */
  scale(ms: number, kind?: 'input' | 'show'): number;
  /** Draw `count` items no one in this room has seen yet (recycles when exhausted). */
  draw<T extends { id: string; breadth: 'universal' | 'clinical' }>(pool: readonly T[], count: number): T[];
}

export type Viewer = { kind: 'stage' } | { kind: 'player' | 'audience'; id: string };

export interface ActionOutcome {
  /** Private feedback for the acting player (e.g. "Filtered — try different words"). */
  error?: string;
  notice?: string;
}

export interface BaseGameState {
  game: GameId;
  playerIds: string[];
  scores: Record<string, number>;
  phase: Phase;
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

/** Round to the nearest 10 so scores look tidy. */
export const tidy = (n: number) => Math.round(n / 10) * 10;
