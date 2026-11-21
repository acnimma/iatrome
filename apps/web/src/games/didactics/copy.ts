import { type Bonus, DIDACTICS, type DidacticsView } from '@iatrome/game/client';

/** "4 people picked Leeches" for the most popular wrong answer. */
export function calloutText(callout: NonNullable<DidacticsView['callout']>, options: string[]) {
  const who = callout.count === 1 ? '1 person' : `${callout.count} people`;
  return `${who} picked ${options[callout.option]}.`;
}

/** "First to answer! +120", "3 in a row! +80": what earned the bonus. */
export function bonusText(b: Bonus) {
  const streak = b.streak >= 2 ? `${b.streak} in a row` : '';
  const what = b.first && streak ? `First in, ${streak}` : b.first ? 'First to answer' : streak;
  return `${what}! +${b.points}`;
}

export const pctLabel = (pct: number) => (pct === 0 ? 'Nothing' : pct === 1 ? 'Everything' : `${Math.round(pct * 100)}%`);

export const swingText = (swing: number) => (swing > 0 ? `+${swing.toLocaleString()}` : swing < 0 ? `−${Math.abs(swing).toLocaleString()}` : '±0');

/** What the standings lead into, if it's a special round. Mirrors the engine's schedule. */
export function nextUp(game: DidacticsView) {
  const next = game.number; // index of the next question
  if (next === game.total - 1) return 'the final wager';
  if (next === Math.max(1, game.total - 1 - DIDACTICS.lightning)) return 'the lightning round';
  return null;
}
