import { GRAND_ROUNDS as GR } from '../../constants';

/**
 * Show timing shared by the server (phase lengths) and the stage (when things appear), so the
 * read-aloud, the reveal and the clock always agree. All times in ms from the phase start.
 */

const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).length : 0);

/** A duel read aloud: prompt, beat, answer A, beat, answer B, beat. */
export function duelReadTiming(prompt: string, a: string | null, b: string | null, kind: 'quip' | 'doodle') {
  const per = GR.readMsPerWord;
  // Doodles have no words to read: give each drawing a moment to be looked at instead.
  const aAt = GR.readLeadIn + words(prompt) * per + GR.readGap;
  const bAt = aAt + (kind === 'doodle' ? 2_200 : Math.max(1, words(a)) * per) + GR.readGap;
  const end = bAt + (kind === 'doodle' ? 2_600 : Math.max(1, words(b)) * per) + GR.readGap;
  return { aAt, bAt, total: Math.min(GR.presentMax, end) };
}

/** A duel's reveal: drumroll, voters one by one, then the winner, the author and the points. */
export function duelRevealTiming(votes: number, pathognomonic: boolean) {
  const votersDone = GR.drumroll + votes * GR.perVoter;
  return {
    voterAt: (i: number) => GR.drumroll + i * GR.perVoter,
    winnerAt: votersDone + 300,
    authorAt: votersDone + 900,
    pointsAt: votersDone + 1_400,
    total: votersDone + GR.resultsHold + (pathognomonic ? GR.pathognomonicExtra : 0),
  };
}

/** The finale's reveal: lists one at a time, fewest votes first, the winner last. */
export function finaleRevealTiming(lists: number) {
  return {
    listAt: (rank: number) => GR.drumroll + rank * GR.finalePerList,
    total: GR.drumroll + lists * GR.finalePerList + GR.resultsHold,
  };
}
