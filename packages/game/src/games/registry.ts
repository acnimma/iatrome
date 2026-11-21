import type { GameId } from '../types';
import { type DidacticsAction, type DidacticsState, type DidacticsView, didactics } from './didactics';
import type { GameModule } from './context';
import { type GrandRoundsAction, type GrandRoundsState, type GrandRoundsView, grandRounds } from './grand-rounds';
import { type PoisonAction, type PoisonState, type PoisonView, poison } from './poison';
import { type SketchAction, type SketchState, type SketchView, sketch } from './sketch';
import { type TiebreakAction, type TiebreakState, type TiebreakView, tiebreak } from './tiebreak';

export type GameState = GrandRoundsState | SketchState | PoisonState | DidacticsState | TiebreakState;
export type GameAction = GrandRoundsAction | SketchAction | PoisonAction | DidacticsAction | TiebreakAction;
export type GameView = GrandRoundsView | SketchView | PoisonView | DidacticsView | TiebreakView;

// Each module is typed precisely; the registry erases that so the room can dispatch by id.
type AnyModule = GameModule<any, any, any>;

export const games: Record<GameId, AnyModule> = {
  'grand-rounds': grandRounds,
  sketch,
  poison,
  didactics,
  tiebreak,
};
