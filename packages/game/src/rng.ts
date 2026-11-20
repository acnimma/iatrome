/**
 * Seeded PRNG (mulberry32). The room stores its seed + draw count so games are
 * deterministic in tests and survive server restarts.
 */
export interface RngState {
  seed: number;
  draws: number;
}

export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  shuffle<T>(items: readonly T[]): T[];
  id(length?: number): string;
}

export function createRng(state: RngState): Rng {
  const next = () => {
    state.draws += 1;
    let t = (state.seed + state.draws * 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (max: number) => Math.floor(next() * max);
  return {
    next,
    int,
    pick: (items) => items[int(items.length)],
    shuffle: (items) => {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    id: (length = 12) => {
      const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
      let s = '';
      for (let i = 0; i < length; i++) s += chars[int(chars.length)];
      return s;
    },
  };
}
