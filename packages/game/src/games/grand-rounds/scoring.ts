import { GRAND_ROUNDS as GR } from '../../constants';
import { tidy } from '../context';

export type Side = 0 | 1;

export interface ScoreInput {
  /** Votes per side from players in the game. */
  votes: [number, number];
  /** Votes per side from the audience (everyone else in the room), weighted as one block. */
  audience?: [number, number];
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
export function scoreVotes({ votes, audience = [0, 0], multiplier, curbside }: ScoreInput): ScoreOutput {
  const players = votes[0] + votes[1];
  const crowd = audience[0] + audience[1];
  const total = players + crowd;
  const share = (v: [number, number], n: number) => v[0] / n;
  let shareA =
    players && crowd
      ? (1 - GR.audienceWeight) * share(votes, players) + GR.audienceWeight * share(audience, crowd)
      : players
        ? share(votes, players)
        : crowd
          ? share(audience, crowd)
          : 0.5;
  // One voter decides the winner but not the whole pool.
  if (total === 1) shareA = shareA > 0.5 ? GR.soloVoteCap : 1 - GR.soloVoteCap;
  const shares: [number, number] = [shareA, 1 - shareA];
  const winner: Side | null = Math.abs(shareA - 0.5) < 1e-9 ? null : shareA > 0.5 ? 0 : 1;
  const consensus = winner !== null && total >= 2 && votes[winner] + audience[winner] === total;

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
