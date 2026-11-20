import { GRAND_ROUNDS as GR } from '../../constants';
import { tidy } from '../context';

export type Side = 0 | 1;

export interface ScoreInput {
  /** Votes per side. */
  votes: [number, number];
  multiplier: number;
  /** A side that used a curbside consult scores half. */
  curbside: [boolean, boolean];
}

export interface ScoreOutput {
  shares: [number, number];
  points: [number, number];
  winner: Side | null;
  consensus: boolean;
}

/**
 * Vote-share scoring. Each matchup splits a pool by share of the vote; the winner
 * gets a bonus; a unanimous win with at least two voters gets the bigger consensus bonus.
 */
export function scoreVotes({ votes, multiplier, curbside }: ScoreInput): ScoreOutput {
  const total = votes[0] + votes[1];
  const shareA = total === 0 ? 0.5 : votes[0] / total;
  const shares: [number, number] = [shareA, 1 - shareA];
  const winner: Side | null = Math.abs(shareA - 0.5) < 1e-9 ? null : shareA > 0.5 ? 0 : 1;
  const consensus = winner !== null && total >= 2 && votes[winner] === total;

  const points = shares.map((share, side) => {
    const bonus = winner === side ? (consensus ? GR.consensusBonus : GR.winBonus) : 0;
    const raw = (GR.pool * share + bonus) * multiplier;
    return tidy(curbside[side] ? raw / 2 : raw);
  }) as [number, number];

  return { shares, points, winner, consensus };
}

/** One side didn't answer (or was hidden): the other side takes the whole pool + bonus. */
export function scoreForfeit(winner: Side, multiplier: number, curbside: boolean): [number, number] {
  const full = tidy(((GR.pool + GR.winBonus) * multiplier) / (curbside ? 2 : 1));
  return winner === 0 ? [full, 0] : [0, full];
}
