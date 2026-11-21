/**
 * Prompt assignment.
 *
 * Rounds 1–2 use a ring: prompt i goes to players i and i+1, so every player answers
 * exactly two prompts against two different opponents, for any N ≥ 3.
 * The finale gives everyone the same prompt (see index.ts), so it needs no assignment.
 */

export function ring(playerIds: readonly string[]): [string, string][] {
  const n = playerIds.length;
  return playerIds.map((id, i) => [id, playerIds[(i + 1) % n]]);
}

/** Order matchups so nobody appears in two reveals back to back where avoidable. */
export function spreadOrder<T extends { playerIds: readonly string[] }>(items: T[]): T[] {
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
