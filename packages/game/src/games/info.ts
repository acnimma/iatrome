import { DIDACTICS, GRAND_ROUNDS, POISON, SKETCH } from '../constants';
import type { PlayableGameId } from '../types';

export interface GameInfo {
  title: string;
  tagline: string;
  /** One-line how-to, shown on the round intro card. */
  howTo: string;
  minutes: number;
  min: number;
  max: number;
}

/** Display info for each game, safe to import on the client (no content packs). */
export const gameInfo: Record<PlayableGameId, GameInfo> = {
  'grand-rounds': {
    title: 'Grand Rounds',
    tagline: 'Funny answers, head to head',
    howTo: 'Answer prompts on your phone. Two answers face off and everyone else votes.',
    minutes: 15,
    min: GRAND_ROUNDS.minPlayers,
    max: GRAND_ROUNDS.maxPlayers,
  },
  sketch: {
    title: 'Imaging',
    tagline: 'One draws, everyone guesses',
    howTo: 'Draw your secret word. Everyone else races to guess it.',
    minutes: 10,
    min: SKETCH.minPlayers,
    max: SKETCH.maxPlayers,
  },
  poison: {
    title: 'Pick Your Poison',
    tagline: 'Would you rather, read the room',
    howTo: 'Pick your side, then guess what most people picked.',
    minutes: 8,
    min: POISON.minPlayers,
    max: POISON.maxPlayers,
  },
  didactics: {
    title: 'Didactics Mode',
    tagline: 'Team trivia for the whole crowd',
    howTo: 'Random teams. Everyone answers on their phone. Your team scores when you get it right.',
    minutes: 12,
    min: DIDACTICS.minPlayers,
    max: DIDACTICS.maxPlayers,
  },
};
