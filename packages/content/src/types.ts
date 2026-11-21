/**
 * iatrome content schema.
 *
 * House rules for every item:
 *  - Original writing only. Never transcribe or paraphrase another game's prompts.
 *  - Punch at medicine, training culture, history and wordplay, never at patients
 *    or people living with a condition.
 *  - Generic drug names only. No real hospitals, brands or living people.
 *  - `breadth: 'universal'` = Normal mode: anyone gets it, including people with no
 *    healthcare background (think a family party). `'clinical'` = Pro mode: for
 *    people who work or train in healthcare; jargon and in-jokes welcome.
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
  'roundTwoIntro', // Grand Rounds round 2 (quips, double points)
  'finalIntro', // Grand Rounds: the final quip, everyone answers (triple points)
  'consensus', // every voter picked the same answer
  'duplicate', // both players wrote the same answer
  'blowout', // one answer won by a lot (not unanimous)
  'tie', // votes split evenly
  'forfeit', // someone didn't answer in time
  'curbsideWin', // a ready-made curbside consult answer won
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
  'didacticsIntro', // Didactics Mode (team trivia) begins
  'didacticsLightning', // the double-points lightning round is next
  'didacticsStumped', // no team got the question right
  'statCalled', // a player spent their Stat (double points on one round); {name} is the player
  'writeNag', // twenty seconds of writing left
  'leadChange', // a new leader on the scoreboard; {name} is the new leader
  'oneVote', // a single person decided a matchup
  'noVotes', // nobody voted on a matchup
  'ghostRevive', // Survive the Shift: a ghost earned their way back on shift
  'noDefender', // Pick Your Poison: nobody in the minority volunteered to defend it
  // ── The show: Beep reacting to what actually happened. Vars listed in hostEventVars. ──
  'matchupWinner', // a duel or finale list just won; {name} wrote it, {answer} is the winning answer
  'pathognomonic', // unanimous duel win (the signature moment); {name} wrote it
  'lastPlace', // scoreboard: a gentle roast of whoever is last; {name}
  'comeback', // someone climbed the board fast; {name}
  'writingBanter', // chatter while everyone writes
  'votingBanter', // chatter while the room votes
  'finaleReveal', // right before the finale results land
  'surviveOut', // Survive the Shift: {name} just clocked out
  'surviveChase', // Survive the Shift: the final chase begins (ghosts can still win)
  'poisonAma', // Pick Your Poison: the lone dissenter takes the floor (Against Medical Advice); {name}
  'poisonFlip', // Pick Your Poison: the defence flipped someone; {name} is the defender
  'sketchHint', // Sketch: a hint letter drops because nobody has it yet; {name} is the drawer
  'sketchFirst', // Sketch: first correct guess; {name} guessed it
  'didacticsHuddle', // Didactics: teams get a few seconds to argue before answers lock
  'didacticsWager', // Didactics: the final wager is open
] as const;

export type HostEvent = (typeof hostEvents)[number];

/** Didactics Mode lines live in their own pack. */
export type DidacticsHostEvent = 'didacticsIntro' | 'didacticsLightning' | 'didacticsStumped';

/** Smaller moments across games (Stats, nags, lead changes, odd votes) have their own pack too. */
export type MomentHostEvent = 'statCalled' | 'writeNag' | 'leadChange' | 'oneVote' | 'noVotes' | 'ghostRevive' | 'noDefender';

/** The {vars} each event's lines may use (events not listed take none). */
export const hostEventVars: Partial<Record<HostEvent, readonly string[]>> = {
  winner: ['name'],
  statCalled: ['name'],
  leadChange: ['name'],
  matchupWinner: ['name', 'answer'],
  pathognomonic: ['name'],
  lastPlace: ['name'],
  comeback: ['name'],
  surviveOut: ['name'],
  poisonAma: ['name'],
  poisonFlip: ['name'],
  sketchHint: ['name'],
  sketchFirst: ['name'],
};

/** Events whose lines take the player's {name}. */
export const namedHostEvents: readonly HostEvent[] = Object.keys(hostEventVars) as HostEvent[];

/** The show's reaction lines live in their own pack. */
export type ShowHostEvent =
  | 'matchupWinner'
  | 'pathognomonic'
  | 'lastPlace'
  | 'comeback'
  | 'writingBanter'
  | 'votingBanter'
  | 'finaleReveal'
  | 'surviveOut'
  | 'surviveChase'
  | 'poisonAma'
  | 'poisonFlip'
  | 'sketchHint'
  | 'sketchFirst'
  | 'didacticsHuddle'
  | 'didacticsWager';

/** The main host-lines pack covers every event except Didactics Mode's and the smaller moments. */
export type HostLines = Record<Exclude<HostEvent, DidacticsHostEvent | MomentHostEvent | ShowHostEvent>, string[]>;
