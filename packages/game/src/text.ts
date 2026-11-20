// ── Normalising ──────────────────────────────────────────────────────────────

/** Trim, collapse whitespace, strip control characters. Used on all player text. */
export function cleanText(input: string, maxLength: number): string {
  return input.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Control characters, zero-width characters and bidi overrides. */
const INVISIBLE = new RegExp('[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u2028-\\u202e\\u2066-\\u2069]', 'g');

/** Comparison key: lowercase, no accents, punctuation or articles. */
export function comparable(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Same answer for "duplicate order" purposes (ignores case, punctuation, plural s). */
export function sameAnswer(a: string, b: string): boolean {
  const key = (s: string) => singular(comparable(s)).replace(/ /g, '');
  const ka = key(a);
  return ka.length > 0 && ka === key(b);
}

/** Naive English singular, per word: leeches → leech, bones → bone, glass stays glass. */
function singular(s: string): string {
  return s
    .split(' ')
    .map((w) => (/(ch|sh|ss|x|z)es$/.test(w) ? w.slice(0, -2) : /[^s]s$/.test(w) && w.length > 3 ? w.slice(0, -1) : w))
    .join(' ');
}

// ── Guess matching (Sketch) ───────────────────────────────────────

export type GuessResult = 'correct' | 'close' | 'wrong';

export function matchGuess(guess: string, answers: readonly string[]): GuessResult {
  const g = singular(comparable(guess));
  if (!g) return 'wrong';
  let best = Infinity;
  for (const answer of answers) {
    const a = singular(comparable(answer));
    if (g === a || g.replace(/ /g, '') === a.replace(/ /g, '')) return 'correct';
    best = Math.min(best, levenshtein(g, a));
    if (a.length >= 6 && levenshtein(g, a) <= 1) return 'correct';
  }
  return best <= 2 && g.length >= 4 ? 'close' : 'wrong';
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length];
}
