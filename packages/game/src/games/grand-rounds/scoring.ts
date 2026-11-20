import { GRAND_ROUNDS as GR } from '../../constants';
import { tidy } from '../context';

export type Side = 0 | 1;

export interface ScoreInput {
  /** Votes from players, per side. */
  players: [number, number];
  /** Votes from the audience, per side. */
  audience: [number, number];
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
 * gets a bonus; a unanimous win (≥ 2 player voters, > ½ the audience) gets the bigger
 * consensus bonus. Audience votes count individually but never for more than a third.
 */
export function scoreVotes({ players, audience, multiplier, curbside }: ScoreInput): ScoreOutput {
  const pTotal = players[0] + players[1];
  const aTotal = audience[0] + audience[1];
  const audienceWeight = aTotal === 0 ? 0 : pTotal === 0 ? 1 : Math.min(GR.audienceShareCap, aTotal / (aTotal + pTotal));
  const shareA =
    pTotal + aTotal === 0
      ? 0.5
      : (pTotal ? (1 - audienceWeight) * (players[0] / pTotal) : 0) + (aTotal ? audienceWeight * (audience[0] / aTotal) : 0);
  const shares: [number, number] = [shareA, 1 - shareA];

  const winner: Side | null = Math.abs(shareA - 0.5) < 1e-9 ? null : shareA > 0.5 ? 0 : 1;
  const consensus =
    winner !== null &&
    pTotal >= 2 &&
    players[winner] === pTotal &&
    (aTotal === 0 || audience[winner] > aTotal / 2);

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
