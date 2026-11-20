import type { HostEvent } from '@iatrome/content';
import type { RngState } from './rng';
import type { FilterLevel } from './text';
import type { GameState } from './games/registry';

export type GameId = 'grand-rounds' | 'sketchy' | 'survive' | 'poison';

export interface RoomSettings {
  game: GameId;
  /** Content filter for player text. */
  filter: FilterLevel;
  /** 'universal' keeps prompts any first-year gets; 'all' adds clinical-life prompts. */
  breadth: 'universal' | 'all';
  /** ×1.5 on writing/drawing/voting timers — recommended when the stage is shared on Zoom. */
  extendedTimers: boolean;
  /** Let late joiners in as voting audience. */
  audience: boolean;
  /** The VIP (first player) can start the game from their phone. */
  playersCanStart: boolean;
  /** Grand Rounds: include doodle prompts in round 2. */
  doodles: boolean;
  /** Sketchy Diagnosis: how many times everyone draws. */
  sketchTurns: 1 | 2;
  /** Dev/test only: multiplies every timer (e.g. 0.05 for end-to-end tests). */
  speed: number;
}

export const defaultSettings: RoomSettings = {
  game: 'grand-rounds',
  filter: 'standard',
  breadth: 'universal',
  extendedTimers: false,
  audience: true,
  playersCanStart: true,
  doodles: true,
  sketchTurns: 1,
  speed: 1,
};

export type Role = 'player' | 'audience';

export interface Person {
  id: string;
  /** Secret used to resume a session after a reconnect. Never sent to other clients. */
  token: string;
  deviceId: string;
  name: string;
  avatar: number;
  role: Role;
  connected: boolean;
  /** When they dropped; they keep their place for a short grace period. */
  disconnectedAt: number | null;
  joinedAt: number;
  isBot: boolean;
}

export interface Phase<Name extends string = string> {
  name: Name;
  startedAt: number;
  /** null = waits for an input or the host. */
  endsAt: number | null;
}

export interface Standing {
  playerId: string;
  name: string;
  avatar: number;
  score: number;
  rank: number;
}

export interface Highlight {
  title: string;
  playerId: string | null;
  detail: string;
}

export interface GameResult {
  game: GameId;
  standings: Standing[];
  highlights: Highlight[];
}

export interface HostLine {
  event: HostEvent;
  text: string;
  at: number;
}

export interface RoomState {
  code: string;
  createdAt: number;
  /** Dev mode allows bots and the speed setting. Set by the server from its environment. */
  devMode: boolean;
  rng: RngState;
  settings: RoomSettings;
  people: Person[];
  bannedDevices: string[];
  locked: boolean;
  stage: 'lobby' | 'playing' | 'over';
  game: GameState | null;
  result: GameResult | null;
  pausedAt: number | null;
  hostLine: HostLine | null;
  recentLines: string[];
  usedContent: string[];
  /** Drawings, kept apart from game state because they're large. */
  drawings: Record<string, Drawing>;
}

// ── Drawings ─────────────────────────────────────────────────────────────────

/** Drawings live on a 1000 × 1000 canvas. Points are a flat [x, y, x, y, …] list. */
export interface Stroke {
  /** Index into the brush colour palette. */
  c: number;
  /** Index into the brush sizes. */
  w: number;
  p: number[];
}

export interface Drawing {
  strokes: Stroke[];
}

export const DRAW_COLORS = ['#1f2a4d', '#cc4e73', '#4988b8', '#ccb64a', '#67a1c6', '#f7f3ec', '#3f9d6e', '#8a5a44'] as const;
export const DRAW_SIZES = [6, 14, 32] as const;
export const CANVAS_SIZE = 1000;

/** Avatars: an emoji on a coloured badge. */
export const AVATARS = ['🦷', '🫀', '🧠', '🦴', '👁️', '🫁', '💊', '🩺', '💉', '🩹', '🦠', '🧬', '🌡️', '🧪', '🩻', '🔬'] as const;
