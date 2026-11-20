/**
 * iatrome content schema.
 *
 * House rules for every item:
 *  - Original writing only. Never transcribe or paraphrase another game's prompts.
 *  - Punch at medicine, training culture, history and wordplay — never at patients
 *    or people living with a condition.
 *  - Generic drug names only. No real hospitals, brands or living people.
 *  - `breadth: 'universal'` = any first-year healthcare student (med, nursing, PA,
 *    dental, pharmacy) gets it. `'clinical'` = needs some ward/clinic time.
 */

export type Breadth = 'universal' | 'clinical';

/** Grand Rounds: fill-in-the-blank or open question. Use "____" for a blank. */
export interface QuipPrompt {
  id: string;
  text: string;
  breadth: Breadth;
  /** Two ready-made answers related to this prompt ("curbside consults"). */
  curbside: [string, string];
}

/** Grand Rounds round 2: draw it. Must be drawable in ~60 s with a finger. */
export interface DoodlePrompt {
  id: string;
  text: string;
  breadth: Breadth;
}

/** Grand Rounds finale: players list three answers. Beep's three answers are used when Beep plays. */
export interface DifferentialPrompt {
  id: string;
  text: string;
  breadth: Breadth;
  beep: [string, string, string];
}

/** Sketch: a term to draw. `accept` lists alternative correct guesses. */
export interface SketchTerm {
  id: string;
  answer: string;
  accept: string[];
  difficulty: 1 | 2 | 3;
  breadth: Breadth;
}

/** Survive the Shift: multiple choice. `answer` is the index of the correct option. */
export interface TriviaQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  /** One or two sentences shown after the reveal. */
  fact: string;
  /** URL of a reputable source confirming the answer. */
  source: string;
  difficulty: 1 | 2 | 3;
  breadth: Breadth;
}

/** Pick Your Poison: would you rather A or B. */
export interface Dilemma {
  id: string;
  a: string;
  b: string;
  breadth: Breadth;
}

/** Events Beep (the host) reacts to. Each needs a deep pool of short lines. */
export const hostEvents = [
  'lobbyWaiting', // waiting for players to join
  'gameStart', // any game begins
  'roundOneIntro', // Grand Rounds round 1
  'roundTwoIntro', // Grand Rounds round 2 (quips + doodles, double points)
  'finalIntro', // Grand Rounds: the Differential (triple points)
  'consensus', // every voter picked the same answer
  'duplicate', // both players wrote the same answer
  'blowout', // one answer won by a lot (not unanimous)
  'tie', // votes split evenly
  'forfeit', // someone didn't answer in time
  'curbsideWin', // a ready-made curbside consult answer won
  'beepWins', // Beep (the host) won its finale duel
  'scoreboard', // between rounds, looking at the scores
  'winner', // announcing the overall winner
  'sketchIntro', // Sketch begins
  'sketchEveryoneGotIt', // all guessers got the drawing
  'sketchNobodyGotIt', // nobody guessed the drawing
  'surviveIntro', // Survive the Shift begins
  'surviveClockOut', // players lost their last coffee
  'surviveMercy', // every survivor missed, so nobody loses a coffee
  'surviveLastStanding', // one survivor left
  'poisonIntro', // Pick Your Poison begins
  'poisonUnanimous', // everyone picked the same side
  'poisonMinority', // calling out the minority before their defence
] as const;

export type HostEvent = (typeof hostEvents)[number];

export type HostLines = Record<HostEvent, string[]>;
