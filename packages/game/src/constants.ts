/** Every tunable number in one place. Times are milliseconds. */

export const ROOM = {
  /** Room codes: 6 letters, no I or O (easy to read aloud and type on a phone). */
  codeAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  codeLength: 6,
  maxPeople: 44, // everyone connected to one room
  maxPlayers: 40, // most players any game supports
  maxNameLength: 20,
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
  /**
   * Duels are read aloud: the prompt, a beat, answer A, a beat, answer B. The present phase is
   * as long as that takes (lead-in + per word), so the read never gets cut off.
   */
  readLeadIn: 1_200,
  readMsPerWord: 360,
  readGap: 700,
  presentMax: 15_000,
  /**
   * The reveal, as a show: a drumroll (Beep's heart racing), voters land one by one, the winner
   * lights up, the author flips over, the points count up. Results last as long as that takes.
   */
  drumroll: 1_600,
  perVoter: 380,
  resultsHold: 3_600,
  /** A unanimous duel gets the full-screen PATHOGNOMONIC moment: this much longer. */
  pathognomonicExtra: 2_000,
  /** Finale: every player has this many votes and can stack them; lists are revealed fewest votes first. */
  finalePicks: 3,
  finalePerList: 1_700,
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
  /** The last third of the turns are worth double, so the bottom of the board can still win. */
  finalStretch: 1 / 3,
  finalStretchFactor: 2,
  /** The artist earns this share of every correct guess, so drawing clearly pays as well as guessing. */
  drawerShare: 0.5,
  /** Hint letters appear at these points of the drawing time. */
  hintsAt: [0.45, 0.7],
  /** Small groups go round twice (one lap would leave the final stretch to one drawing), on a shorter clock. */
  twoLapsUpTo: 4,
  drawTwoLaps: 65_000,
  /** The end-of-game gallery: a base, plus a little per drawing, capped. */
  gallery: 3_000,
  galleryPerDrawing: 600,
  galleryMax: 9_000,
  /** Solvers can nudge the room (warmer, colder) this often. */
  nudgeCooldown: 1_500,
  /** "They're writing letters": at least this share of guessers (and at least 2) voids the artist's points. */
  flagShare: 0.5,
} as const;

export const SURVIVE = {
  minPlayers: 2,
  maxPlayers: 20,
  intro: 4_500,
  question: 15_000,
  reveal: 6_500,
  /** Extra reveal time when someone clocks out, so they get their moment on stage. */
  outScene: 3_000,
  /** Beep's clock-out line lands with the scene, after the answer. */
  outLineDelay: 1_800,
  /** The Sign-out title card before the final chase. */
  chaseIntro: 6_000,
  coffees: 2,
  /** Short and tense beats long and grinding: Trivia Murder Party runs about 7–9. Everyone plays all of them. */
  maxQuestions: 12,
  /** Sign-out, the final chase: the last questions climb through these multipliers, ghosts at full value. */
  chaseFactors: [2, 2, 3] as readonly number[],
  /** Correct answers score base + up to speedBonus for answering fast (the leader gets no speed bonus in the chase). */
  base: 100,
  speedBonus: 100,
  /** Paid to everyone still on shift after each question: staying on shift is worth something. */
  shiftPay: 50,
  /** Clocked-out players keep answering for a share of the points (full value in the chase). */
  ghostFactor: 0.5,
  /** This many right in a row as a ghost puts you back on shift with one coffee. As often as you earn it. */
  ghostRevive: 2,
  /** Mercy (every survivor missed, nobody loses a coffee) needs at least this many on shift, and never applies in the chase. */
  mercyFrom: 3,
} as const;

/** Long questions (Pro vignettes) get extra reading time: per character past `free`, capped. */
export const READING = { free: 120, perChar: 45, max: 20_000 } as const;

export const POISON = {
  minPlayers: 3,
  maxPlayers: 20,
  intro: 4_500,
  choose: 20_000,
  reveal: 5_500,
  /** Before the defence, the majority bets on whether anyone will switch. */
  bet: 7_000,
  /** Against Medical Advice: the defender argues out loud while the majority can switch sides. */
  defence: 20_000,
  /** Who switched, and who called it. */
  verdict: 5_000,
  /** The final dilemma's title card. */
  finalIntro: 5_000,
  rounds: 8,
  /** The final dilemma is worth this much more: anyone can still win it. */
  finalFactor: 3,
  /** Calling the other players' majority pays this, up to double when they were nearly split. Half if they tied. */
  predictPoints: 100,
  /** The only one on your side (with at least two on the other): the contrarian bonus. */
  loneBonus: 100,
  /** The defender, per person they talked into switching. */
  flipPoints: 100,
  /** A right call on "Will anyone switch?". Small on purpose. */
  betPoints: 50,
} as const;

export const DIDACTICS = {
  minPlayers: 2,
  maxPlayers: 40,
  intro: 6_000,
  /** Team reveal: long enough to give your team a name of its own. */
  teams: 20_000,
  maxTeamName: 24,
  question: 20_000,
  /** Once everyone has answered (or time is up), teams see their split and can switch once. */
  huddle: 20_000,
  /** The answer, the split and the fact stay up this long. */
  reveal: 10_000,
  standings: 7_000,
  questions: 12,
  /** Show the team standings after every this many questions. */
  standingsEvery: 3,
  /** Before the final question: lightning questions, worth double, short clock, no huddle. */
  lightning: 3,
  lightningIntro: 4_500,
  lightningQuestion: 12_000,
  /** The final question: each team's captain bets a share of the team's score. */
  wager: 15_000,
  wagers: [0, 0.25, 0.5, 1] as const,
  /** A team below this bets as if it had this much, so a team near zero can still swing. Losses never go below zero. */
  wagerFloor: 1_000,
  /** Split, then answer, then every team's swing. */
  finalReveal: 10_000,
  /** Teams of about this many: up to `maxTeams`, never fewer than 2. */
  perTeam: 5.5,
  maxTeams: 8,
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
