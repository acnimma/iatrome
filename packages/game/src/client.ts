/**
 * Browser-safe entry: constants, types, drawing helpers and game info.
 * No content packs, filters or validation: those stay on the server.
 */
export * from './constants';
export * from './types';
export * from './drawing';
export { gameInfo } from './games/info';
export type * from './protocol';
export type { RoomView, PersonView, HostCommand, PlayerCommand, JoinError } from './room';
export type { GameView } from './games/registry';
export type { Viewer } from './games/context';
export type { GrandRoundsView, MatchupView, EntryView, TaskView, MatchupResult, MatchupKind } from './games/grand-rounds';
export { duelReadTiming, duelRevealTiming, finaleRevealTiming } from './games/grand-rounds/timing';
export type { SketchView } from './games/sketch';
export type { SurviveView } from './games/survive';
export type { PoisonView } from './games/poison';
export type { DidacticsView, Team } from './games/didactics';
