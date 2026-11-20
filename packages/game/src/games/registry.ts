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
