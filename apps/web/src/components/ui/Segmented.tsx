'use client';

import { motion } from 'motion/react';
import { useId } from 'react';
import { haptic } from '@/lib/haptics';
import { jelly } from './jelly';
import styles from './Segmented.module.css';

type Option<T extends string> = { id: T; title: string };

/** A pearl track with a black jelly pill that slides to whatever you pick. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const pill = useId();
  return (
    <div className={styles.track} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`${styles.option} ${on ? styles.on : ''}`}
            onClick={() => {
              if (on) return;
              haptic('tap');
              onChange(o.id);
            }}
          >
            {on && <motion.span layoutId={pill} className={`${styles.pill} ${jelly()}`} transition={{ type: 'spring', stiffness: 520, damping: 34 }} />}
            <span className={styles.text}>{o.title}</span>
          </button>
        );
      })}
    </div>
  );
}
