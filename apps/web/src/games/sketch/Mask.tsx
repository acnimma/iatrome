'use client';

import { motion } from 'motion/react';
import styles from './Sketch.module.css';

/**
 * The hint: one underlined slot per letter, words kept together with a clear gap between
 * them, punctuation shown as is. Letters pop in as hints drop (and all at once at the reveal).
 */
export function Mask({ mask, revealed, size = 'stage' }: { mask: string; revealed?: boolean; size?: 'stage' | 'phone' }) {
  const words = mask.split(' ');
  let offset = 0;
  return (
    <div
      className={`${styles.mask} ${size === 'phone' ? styles.maskPhone : ''} ${revealed ? styles.maskRevealed : ''}`}
      role="img"
      aria-label={revealed ? `The answer was ${mask}` : `Hint: ${words.map((w) => `${w.length} letters`).join(', then ')}`}
    >
      {words.map((word, w) => {
        const start = offset;
        offset += word.length + 1;
        return (
          <span key={w} className={styles.word}>
            {[...word].map((ch, i) => {
              const at = start + i;
              if (ch !== '_' && !/[a-z0-9]/i.test(ch)) return <span key={at} className={styles.punct}>{ch}</span>;
              return (
                <motion.span
                  key={`${at}-${ch}`}
                  className={styles.letter}
                  initial={ch !== '_' ? { scale: 1.6, y: -10 } : false}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 14, delay: revealed ? at * 0.04 : 0 }}
                >
                  {ch === '_' ? '' : ch}
                </motion.span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}
