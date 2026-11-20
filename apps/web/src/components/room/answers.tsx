import type { JellyTone } from '@/components/ui/jelly';
import styles from './answers.module.css';

export const LETTERS = ['A', 'B', 'C', 'D'] as const;

/**
 * Multiple-choice answers wear the palette, in the same order everywhere (stage, phone, reveal),
 * so "the gold one" means the same thing on every screen.
 */
export const ANSWER_TONES = ['blue', 'rose', 'gold', 'sky'] as const satisfies readonly JellyTone[];

/** The A/B/C/D bubble that sits on an answer. */
export function AnswerLetter({ index, size = 'md' }: { index: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`${styles.letter} ${styles[size]}`} aria-hidden>
      {LETTERS[index]}
    </span>
  );
}
