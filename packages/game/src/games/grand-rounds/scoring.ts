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

export interface FinaleInput {
  /** Player votes per list. */
  votes: number[];
  /** Audience votes per list. */
  audience: number[];
  multiplier: number;
}

export interface FinaleOutput {
  /** Each list's share of all the (weighted) votes, for the bars. */
  shares: number[];
  points: number[];
  /** The single most-voted list, or null on a tie at the top (or no votes). */
  winner: number | null;
  /** Every voter (at least two) picked the winner. */
  consensus: boolean;
}

/**
 * The finale, Last-Lash style: everyone answered the same prompt and everyone voted for a
 * favourite that isn't theirs. Points per vote (audience votes count for less), plus a bonus
 * for the top list and a bigger one if the whole room agreed.
 */
export function scoreFinale({ votes, audience, multiplier }: FinaleInput): FinaleOutput {
  const weighted = votes.map((v, i) => v + audience[i] * GR.finaleAudienceVote);
  const total = weighted.reduce((a, b) => a + b, 0);
  const shares = weighted.map((w) => (total ? w / total : 0));
  const top = Math.max(0, ...weighted);
  const leaders = weighted.flatMap((w, i) => (w === top && top > 0 ? [i] : []));
  const winner = leaders.length === 1 ? leaders[0] : null;
  const voters = votes.reduce((a, b) => a + b, 0) + audience.reduce((a, b) => a + b, 0);
  const consensus = winner !== null && voters >= 2 && votes[winner] + audience[winner] === voters;
  const points = weighted.map((w, i) => {
    const bonus = i === winner ? (consensus ? GR.finaleSweepBonus : GR.finaleWinBonus) : 0;
    return tidy((w * GR.finaleVote + bonus) * multiplier);
  });
  return { shares, points, winner, consensus };
}
