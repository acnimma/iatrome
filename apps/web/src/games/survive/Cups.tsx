'use client';

import { motion } from 'motion/react';
import { Icon } from '@/components/icons/Icon';
import styles from './Survive.module.css';

/**
 * A row of coffees. With `spilling`, one more cup stands at the end, then tips over
 * and spills: that's the coffee you just lost.
 */
export function Cups({ left, spilling, size = 24, delay = 0 }: { left: number; spilling?: boolean; size?: number; delay?: number }) {
  const d = delay / 1000;
  return (
    <span className={styles.cups} style={{ '--cup': `${size}px` } as React.CSSProperties}>
      {Array.from({ length: Math.max(0, left) }, (_, k) => (
        <Icon key={k} name="coffee" size={size} />
      ))}
      {spilling && (
        <span className={styles.spillCup} aria-hidden>
          <motion.span
            className={styles.spillPuddle}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: d + 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className={styles.spillIcon}
            initial={{ rotate: 0, y: 0, opacity: 1 }}
            animate={{ rotate: [0, -12, 98], y: [0, -size * 0.25, size * 0.12], opacity: [1, 1, 0.55] }}
            transition={{ delay: d, duration: 0.7, times: [0, 0.3, 1], ease: 'easeIn' }}
          >
            <Icon name="coffee" size={size} />
          </motion.span>
        </span>
      )}
    </span>
  );
}
