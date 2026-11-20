/** Every tunable number in one place. Times are milliseconds. */

export const ROOM = {
  /** Room codes: 6 letters, no I or O (easy to read aloud and type on a phone). */
  codeAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  codeLength: 6,
  maxPeople: 44, // everyone connected to one room
  maxPlayers: 40, // most players any game supports
  maxNameLength: 16,
  maxPasswordLength: 32,
  /** A dropped player still counts as present this long (phones sleep, tunnels happen). */
  reconnectGrace: 20_000,
  /** An empty room is destroyed after this long. */
  emptyRoomTtl: 30 * 60_000,
} as const;

export const LIMITS = {
  quip: 60,
  differentialItem: 40,
  guess: 40,
  defence: 80,
  drawing: { maxStrokes: 400, maxPoints: 12_000 },
  reactionCooldown: 350,
} as const;

/** Grand Rounds pacing. Writing/voting scale with the "extended timers" setting. */
export const GRAND_ROUNDS = {
  minPlayers: 3,
  maxPlayers: 8,
  intro: 4_500,
  writeQuips: 90_000,
  writeMixed: 120_000,
  writeDifferential: 75_000,
  present: { quip: 4_000, doodle: 6_500, differential: 7_500 },
  /** The finale reveals every list one after another: this long per list, on top of the base. */
  presentPerList: 2_600,
  vote: 15_000,
  /** Reading everyone's list takes longer than reading two. */
  voteFinale: 25_000,
  results: 6_500,
  scores: 7_000,
  pool: 1_000,
  winBonus: 100,
  consensusBonus: 250,
  /** The finale is worth as much as round two, so it decides the game, like Quiplash's last round. */
  multipliers: [1, 2, 4] as const,
  /** People watching (not in the game) vote as one block worth this share of the result. */
  audienceWeight: 1 / 3,
  /** With a single voter, the winner's share is capped so one person can't swing a full pool. */
  soloVoteCap: 0.65,
  /** Finale: every vote is worth this (before the multiplier); the most-voted list gets a bonus. */
  finaleVote: 500,
  /** An audience vote in the finale is worth this much of a player's. */
  finaleAudienceVote: 0.3,
  finaleWinBonus: 250,
  /** Every voter picked the same list. */
  finaleSweepBonus: 500,
  /** Beep nags when this much writing time is left. */
  nagAt: 20_000,
} as const;

export const SKETCH = {
  minPlayers: 3,
  maxPlayers: 10,
  intro: 4_000,
  choose: 12_000,
  draw: 80_000,
  reveal: 5_500,
  /** Points for a correct guess scale from max → min with elapsed time. */
  guessMax: 500,
  guessMin: 100,
  /** Harder words pay more, for guessers and the artist: easy, medium, hard. */
  difficultyPay: [1, 1.5, 2] as const,
  /** The artist earns this share of every correct guess, so drawing clearly pays as well as guessing. */
  drawerShare: 0.5,
  /** Hint letters appear at these points of the drawing time. */
  hintsAt: [0.45, 0.7],
} as const;

export const SURVIVE = {
  minPlayers: 2,
  maxPlayers: 20,
  intro: 4_500,
  question: 15_000,
  reveal: 6_500,
  coffees: 2,
  /** Short and tense beats long and grinding: Trivia Murder Party runs about 7–9. */
  maxQuestions: 12,
  /** The last question is "last call": worth this much more. */
  lastCallFactor: 2,
  /** Correct answers score base + up to speedBonus for answering fast. */
  base: 100,
  speedBonus: 100,
  /** Clocked-out players keep answering for a share of the points. */
  ghostFactor: 0.5,
  /** This many right in a row as a ghost puts you back on shift with one coffee (once a game). */
  ghostRevive: 3,
} as const;

/** Long questions (Pro vignettes) get extra reading time: per character past `free`, capped. */
export const READING = { free: 120, perChar: 45, max: 20_000 } as const;

export const POISON = {
  minPlayers: 3,
  maxPlayers: 20,
  intro: 4_500,
  choose: 20_000,
  reveal: 5_500,
  /** The minority gets a moment to volunteer a defence. Nobody is forced to. */
  volunteer: 6_000,
  defend: 15_000,
  /** The majority reads the defence and can tap "Convinced". */
  defence: 9_000,
  rounds: 8,
  /** Calling the majority pays this, up to double when the room was nearly split. */
  predictPoints: 100,
  defendPoints: 50,
  /** Per person the defence convinced. */
  convertPoints: 50,
} as const;

export const DIDACTICS = {
  minPlayers: 4,
  maxPlayers: 40,
  intro: 6_000,
  teams: 8_000,
  question: 20_000,
  reveal: 7_000,
  standings: 7_000,
  questions: 12,
  /** Show the team standings after every this many questions. */
  standingsEvery: 3,
  /** The last questions are worth double. */
  lightning: 3,
  /** Each question splits this many points per team by share of members right. */
  pool: 1_000,
  /** Individual points (for the MVP): base + up to speedBonus for a fast right answer. */
  base: 100,
  speedBonus: 100,
} as const;

/** Reveal choreography the server times Beep's lines (and phones) around, in ms. */
export const REVEAL = {
  /** The stage's matchup results: voters land, then the authors flip over. */
  results: 2_400,
  /** The podium climbs 3rd, 2nd, then 1st. */
  podium: 3_600,
} as const;

export const EXTENDED_TIMERS_FACTOR = 1.5;

/** Quick reactions players can fling at the stage. */
export const REACTIONS = ['react-laugh', 'react-fire', 'react-clap', 'react-gasp', 'react-cringe', 'react-heart'] as const;

/** Stats: carried from one game to the next, each doubles one round. */
export const STAT = {
  /** How many top finishers earn one, by group size (index = players). Small groups give fewer, so it still means something. */
  top: (players: number) => (players >= 6 ? 3 : players >= 4 ? 2 : 1),
  /** From this many players, last place gets one too. */
  mercyFrom: 5,
};
