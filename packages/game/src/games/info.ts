import { GRAND_ROUNDS, POISON, SKETCH, SURVIVE } from '../constants';
import type { GameId } from '../types';

export interface GameInfo {
  title: string;
  tagline: string;
  /** One-line how-to, shown on the round intro card. */
  howTo: string;
  minutes: number;
  min: number;
  max: number;
}

/** Display info for each game — safe to import on the client (no content packs). */
export const gameInfo: Record<GameId, GameInfo> = {
  'grand-rounds': {
    title: 'Grand Rounds',
    tagline: 'Head-to-head quips and doodles. The room votes.',
    howTo: 'Answer prompts on your phone. Two answers face off — everyone else votes.',
    minutes: 15,
    min: GRAND_ROUNDS.minPlayers,
    max: GRAND_ROUNDS.maxPlayers,
  },
  sketch: {
    title: 'Sketch',
    tagline: 'One draws, everyone races to guess.',
    howTo: 'Draw your secret term. Everyone else races to guess it.',
    minutes: 10,
    min: SKETCH.minPlayers,
    max: SKETCH.maxPlayers,
  },
  survive: {
    title: 'Survive the Shift',
    tagline: 'Trivia elimination. Two coffees. Last one on shift wins.',
    howTo: 'Wrong answers cost a coffee. Run out and you clock out.',
    minutes: 8,
    min: SURVIVE.minPlayers,
    max: SURVIVE.maxPlayers,
  },
  poison: {
    title: 'Pick Your Poison',
    tagline: 'Would you rather — and can you read the room?',
    howTo: 'Pick your side, then predict what the room picked.',
    minutes: 8,
    min: POISON.minPlayers,
    max: POISON.maxPlayers,
  },
};
