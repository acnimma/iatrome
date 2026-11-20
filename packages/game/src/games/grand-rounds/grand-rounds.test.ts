import { describe, expect, it } from 'vitest';
import { mixedKinds, ring, spreadOrder } from './assign';
import { scoreFinale, scoreForfeit, scoreVotes } from './scoring';

describe('ring assignment', () => {
  for (const n of [3, 4, 5, 6, 7, 8]) {
    it(`gives each of ${n} players exactly two prompts against two different opponents`, () => {
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const pairs = ring(ids);
      expect(pairs).toHaveLength(n);
      for (const id of ids) {
        const mine = pairs.filter((p) => p.includes(id));
        expect(mine).toHaveLength(2);
        const opponents = mine.map((p) => p.find((x) => x !== id));
        expect(new Set(opponents).size).toBe(2);
      }
    });
  }
});

describe('round 2 mix', () => {
  it('gives everyone one doodle and one quip with an even count', () => {
    const kinds = mixedKinds(6);
    const pairs = ring(['a', 'b', 'c', 'd', 'e', 'f']);
    for (const id of 'abcdef') {
      const mine = pairs.map((p, i) => (p.includes(id) ? kinds[i] : null)).filter(Boolean);
      expect(mine.sort()).toEqual(['doodle', 'quip']);
    }
  });

  it('never gives anyone two doodles with an odd count', () => {
    for (const n of [3, 5, 7]) {
      const ids = Array.from({ length: n }, (_, i) => `p${i}`);
      const kinds = mixedKinds(n);
      const pairs = ring(ids);
      for (const id of ids) {
        const doodles = pairs.filter((p, i) => p.includes(id) && kinds[i] === 'doodle').length;
        expect(doodles).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('spreadOrder', () => {
  it('avoids the same player in back-to-back matchups where possible', () => {
    const items = ring(['a', 'b', 'c', 'd', 'e', 'f']).map((playerIds) => ({ playerIds }));
    const ordered = spreadOrder(items);
    for (let i = 1; i < ordered.length; i++) {
      const shared = ordered[i].playerIds.some((p) => ordered[i - 1].playerIds.includes(p));
      expect(shared).toBe(false);
    }
  });
});

describe('scoring', () => {
  const none: [boolean, boolean] = [false, false];

  it('splits the pool by vote share and gives the winner a bonus', () => {
    const r = scoreVotes({ votes: [3, 1], multiplier: 1, curbside: none });
    expect(r.winner).toBe(0);
    expect(r.consensus).toBe(false);
    expect(r.points).toEqual([850, 250]);
  });

  it('awards the consensus bonus for a unanimous win with 2+ voters', () => {
    const r = scoreVotes({ votes: [4, 0], multiplier: 2, curbside: none });
    expect(r.consensus).toBe(true);
    expect(r.points).toEqual([2500, 0]);
  });

  it('lets a single vote pick the winner but not take the whole pool', () => {
    const r = scoreVotes({ votes: [1, 0], multiplier: 1, curbside: none });
    expect(r.consensus).toBe(false);
    expect(r.winner).toBe(0);
    expect(r.points).toEqual([750, 350]);
  });

  it('counts the audience as one block worth a third', () => {
    // Players split 2–0 for A; a big audience goes 0–9 for B. Players still decide.
    const r = scoreVotes({ votes: [2, 0], audience: [0, 9], multiplier: 1, curbside: none });
    expect(r.shares[0]).toBeCloseTo(2 / 3);
    expect(r.winner).toBe(0);
    expect(r.consensus).toBe(false);
  });

  it('lets the audience decide when no players can vote', () => {
    const r = scoreVotes({ votes: [0, 0], audience: [3, 1], multiplier: 1, curbside: none });
    expect(r.shares[0]).toBeCloseTo(0.75);
  });

  it('splits evenly on a tie with no bonus', () => {
    const r = scoreVotes({ votes: [2, 2], multiplier: 1, curbside: none });
    expect(r.winner).toBeNull();
    expect(r.points).toEqual([500, 500]);
  });

  it('halves curbside consult points', () => {
    const r = scoreVotes({ votes: [3, 1], multiplier: 1, curbside: [true, false] });
    expect(r.points).toEqual([430, 250]);
  });

  it('gives a forfeit the whole pool plus bonus', () => {
    expect(scoreForfeit(1, 3, false)).toEqual([0, 3300]);
  });
});

describe('finale scoring', () => {
  it('pays per vote and gives the top list a bonus', () => {
    const r = scoreFinale({ votes: [2, 1, 0, 0], audience: [0, 0, 0, 0], multiplier: 4 });
    expect(r.winner).toBe(0);
    expect(r.consensus).toBe(false);
    expect(r.points).toEqual([5000, 2000, 0, 0]);
  });

  it('pays the sweep bonus when everyone picked the same list', () => {
    const r = scoreFinale({ votes: [0, 3, 0], audience: [0, 1, 0], multiplier: 1 });
    expect(r.consensus).toBe(true);
    expect(r.points[1]).toBe(Math.round((3.3 * 500 + 500) / 10) * 10);
  });

  it('has no winner on a tie at the top, and nothing for nobody', () => {
    const r = scoreFinale({ votes: [1, 1, 0], audience: [0, 0, 0], multiplier: 1 });
    expect(r.winner).toBeNull();
    expect(r.points).toEqual([500, 500, 0]);
    expect(scoreFinale({ votes: [0, 0], audience: [0, 0], multiplier: 4 }).winner).toBeNull();
  });

  it('weights audience votes below player votes', () => {
    // One player vote beats three audience votes.
    const r = scoreFinale({ votes: [1, 0], audience: [0, 3], multiplier: 1 });
    expect(r.winner).toBe(0);
    expect(r.shares[1]).toBeCloseTo(0.9 / 1.9);
  });
});
