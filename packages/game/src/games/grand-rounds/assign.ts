/**
 * Prompt assignment.
 *
 * Rounds 1–2 use a ring: prompt i goes to players i and i+1, so every player answers
 * exactly two prompts against two different opponents, for any N ≥ 3.
 * The finale pairs players up; with an odd count the last-place player faces Beep.
 */

export function ring(playerIds: readonly string[]): [string, string][] {
  const n = playerIds.length;
  return playerIds.map((id, i) => [id, playerIds[(i + 1) % n]]);
}

/**
 * Round 2 alternates doodles and quips so each player gets one of each. With an odd
 * count, the wrap-around prompt is a quip (one player gets two quips instead of two doodles).
 */
export function mixedKinds(n: number): ('quip' | 'doodle')[] {
  return Array.from({ length: n }, (_, i) => (i % 2 === 0 && !(n % 2 === 1 && i === n - 1) ? 'doodle' : 'quip'));
}

/** Finale pairs. `ranked` is best-first; with an odd count the last-ranked plays Beep. */
export function finalePairs(shuffled: readonly string[], lastPlace: string): [string, string][] {
  const pool = shuffled.filter((id) => id !== lastPlace);
  const odd = shuffled.length % 2 === 1;
  if (!odd) pool.push(lastPlace);
  const pairs: [string, string][] = [];
  for (let i = 0; i + 1 < pool.length; i += 2) pairs.push([pool[i], pool[i + 1]]);
  if (odd) pairs.push([lastPlace, BEEP]);
  return pairs;
}

/** Order matchups so nobody appears in two reveals back to back where avoidable. */
export function spreadOrder<T extends { playerIds: [string, string] }>(items: T[]): T[] {
  const left = items.slice();
  const out: T[] = [];
  while (left.length) {
    const prev = out[out.length - 1];
    const idx = prev ? left.findIndex((m) => !m.playerIds.some((p) => prev.playerIds.includes(p))) : 0;
    out.push(left.splice(idx === -1 ? 0 : idx, 1)[0]);
  }
  return out;
}

export const BEEP = 'beep';
