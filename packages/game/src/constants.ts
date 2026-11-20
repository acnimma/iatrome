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
  vote: 15_000,
  results: 6_500,
  scores: 7_000,
  pool: 1_000,
  winBonus: 100,
  consensusBonus: 250,
  multipliers: [1, 2, 3] as const,
} as const;

export const SKETCH = {
  minPlayers: 3,
  maxPlayers: 10,
  intro: 4_000,
  choose: 12_000,
  draw: 80_000,
  reveal: 5_500,
  scores: 6_000,
  /** Points for a correct guess scale from max → min with elapsed time. */
  guessMax: 500,
  guessMin: 100,
  drawerPerGuess: 75,
} as const;

export const SURVIVE = {
  minPlayers: 2,
  maxPlayers: 20,
  intro: 4_500,
  question: 15_000,
  reveal: 6_500,
  coffees: 2,
  maxQuestions: 20,
  /** Correct answers score base + up to speedBonus for answering fast. */
  base: 100,
  speedBonus: 100,
  /** Clocked-out players keep answering for a share of the points. */
  ghostFactor: 0.5,
} as const;

export const POISON = {
  minPlayers: 3,
  maxPlayers: 20,
  intro: 4_500,
  choose: 20_000,
  reveal: 5_500,
  defend: 20_000,
  defence: 6_500,
  rounds: 8,
  predictPoints: 100,
  defendPoints: 50,
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

/** Final standings screen. */
export const PODIUM = 9_000;

export const EXTENDED_TIMERS_FACTOR = 1.5;

/** Quick reactions players can fling at the stage. */
export const REACTIONS = ['react-laugh', 'react-fire', 'react-clap', 'react-gasp', 'react-cringe', 'react-heart'] as const;
