import type { HostEvent } from '@iatrome/content';
import type { RngState } from './rng';
import type { GameState } from './games/registry';

export type GameId = 'grand-rounds' | 'sketch' | 'survive' | 'poison' | 'didactics';

/** Normal: anyone can play, no healthcare knowledge needed. Pro: for people who work in healthcare. */
export type ContentMode = 'normal' | 'pro';

export interface RoomSettings {
  game: GameId;
  mode: ContentMode;
  /** ×1.5 on writing, drawing and voting timers. Handy on Zoom or with slower typers. */
  extendedTimers: boolean;
  /** Dev/test only: multiplies every timer (e.g. 0.05 for end-to-end tests). */
  speed: number;
}

export const defaultSettings: RoomSettings = {
  game: 'grand-rounds',
  mode: 'normal',
  extendedTimers: false,
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
  /** Shown under the name instead of points when points aren't what ranked them (e.g. "Lasted 9 of 20"). */
  note?: string;
}

export interface Highlight {
  title: string;
  playerId: string | null;
  detail: string;
}

export interface TeamStanding {
  name: string;
  color: number;
  score: number;
  rank: number;
  members: string[];
}

export interface GameResult {
  game: GameId;
  standings: Standing[];
  /** Team games rank teams first. */
  teams?: TeamStanding[];
  highlights: Highlight[];
}

/** A Stat for finishing near the top, or a sympathy one for finishing last. */
export type StatGrant = 'top' | 'mercy';

export interface HostLine {
  event: HostEvent;
  text: string;
  at: number;
  /** Hold the line this long (ms) so Beep doesn't spoil a reveal that's still animating. */
  delay?: number;
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
  /** Stats earned in the last finished game, to spend in the next: why each holder got one. */
  stats?: Record<string, StatGrant>;
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

/** Avatars: a brand icon on a coloured badge (names match the web app's icon set). */
export const AVATARS = [
  'tooth', 'heart', 'brain', 'bone', 'eye', 'lungs', 'pill', 'stethoscope',
  'syringe', 'bandage', 'microbe', 'dna', 'thermometer', 'flask', 'xray', 'microscope',
] as const;
