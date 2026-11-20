import type { GameId } from '../types';
import type { GameModule } from './context';
import { type GrandRoundsAction, type GrandRoundsState, type GrandRoundsView, grandRounds } from './grand-rounds';
import { type PoisonAction, type PoisonState, type PoisonView, poison } from './poison';
import { type SketchAction, type SketchState, type SketchView, sketch } from './sketch';
import { type SurviveAction, type SurviveState, type SurviveView, survive } from './survive';

export type GameState = GrandRoundsState | SketchState | SurviveState | PoisonState;
export type GameAction = GrandRoundsAction | SketchAction | SurviveAction | PoisonAction;
export type GameView = GrandRoundsView | SketchView | SurviveView | PoisonView;

// Each module is typed precisely; the registry erases that so the room can dispatch by id.
type AnyModule = GameModule<any, any, any>;

export const games: Record<GameId, AnyModule> = {
  'grand-rounds': grandRounds,
  sketch,
  survive,
  poison,
};
