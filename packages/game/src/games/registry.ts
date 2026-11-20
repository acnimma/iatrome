import type { GameId } from '../types';
import type { GameModule } from './context';
import { type GrandRoundsAction, type GrandRoundsState, type GrandRoundsView, grandRounds } from './grand-rounds';
import { type PoisonAction, type PoisonState, type PoisonView, poison } from './poison';
import { type SketchyAction, type SketchyState, type SketchyView, sketchy } from './sketchy';
import { type SurviveAction, type SurviveState, type SurviveView, survive } from './survive';

export type GameState = GrandRoundsState | SketchyState | SurviveState | PoisonState;
export type GameAction = GrandRoundsAction | SketchyAction | SurviveAction | PoisonAction;
export type GameView = GrandRoundsView | SketchyView | SurviveView | PoisonView;

// Each module is typed precisely; the registry erases that so the room can dispatch by id.
type AnyModule = GameModule<any, any, any>;

export const games: Record<GameId, AnyModule> = {
  'grand-rounds': grandRounds,
  sketchy,
  survive,
  poison,
};

export const gameInfo: Record<GameId, { title: string; tagline: string; players: string; minutes: string }> = {
  'grand-rounds': { title: 'Grand Rounds', tagline: 'Head-to-head quips and doodles. The room votes.', players: '3–8', minutes: '15' },
  sketchy: { title: 'Sketchy Diagnosis', tagline: 'One draws, everyone races to guess.', players: '3–10', minutes: '10' },
  survive: { title: 'Survive the Shift', tagline: 'Trivia elimination. Two coffees. Last one on shift wins.', players: '2–20', minutes: '8' },
  poison: { title: 'Pick Your Poison', tagline: 'Would you rather — and can you read the room?', players: '3–20', minutes: '8' },
};
