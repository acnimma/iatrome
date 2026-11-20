'use client';

import { type HTMLMotionProps, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { type JellyTone, jelly } from './jelly';
import styles from './Button.module.css';

type Tone = JellyTone | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

type Props = HTMLMotionProps<'button'> & {
  tone?: Tone;
  size?: Size;
  block?: boolean;
  /** Disabled because the room is waiting on something: reads as progress (pearl, pulsing dots), not as broken. */
  waiting?: boolean;
  /** Destructive: the first tap swaps the label for this question, the second tap within a few seconds does it. */
  confirm?: string;
};

/** The house button: a glossy jelly pill that squishes under your thumb and wobbles back. */
export function Button({ tone = 'black', size = 'md', block, waiting, confirm, className, onClick, disabled, children, ...rest }: Props) {
  const ask = useConfirm();
  const armed = Boolean(confirm) && ask.armed('button');
  const finish = armed ? jelly('rose') : tone === 'ghost' ? styles.ghost : jelly(tone);
  const off = disabled || waiting;
  return (
    <motion.button
      type="button"
      className={`${styles.button} ${finish} ${styles[size]} ${block ? styles.block : ''} ${waiting ? styles.waiting : ''} ${className ?? ''}`}
      whileHover={off ? undefined : { y: -2, scale: 1.015 }}
      whileTap={off ? undefined : { scaleX: 1.06, scaleY: 0.88, y: 2 }}
      transition={{ type: 'spring', stiffness: 650, damping: 14, mass: 0.8 }}
      disabled={off}
      aria-live={confirm ? 'polite' : undefined}
      onClick={(e) => {
        if (confirm && !armed) return ask.ask('button', () => {}); // arms it
        haptic('tap');
        play('pop');
        ask.reset();
        onClick?.(e);
      }}
      {...rest}
    >
      {armed ? confirm : (children as React.ReactNode)}
      {waiting && (
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
      )}
    </motion.button>
  );
}

/**
 * Two taps for anything you can't take back (kick, ban, end, leave): the first tap arms one
 * key, the second tap on the same key within `ms` runs it. One hook can guard a whole list.
 */
export function useConfirm(ms = 3_000) {
  const [armedKey, setArmedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!armedKey) return;
    const t = setTimeout(() => setArmedKey(null), ms);
    return () => clearTimeout(t);
  }, [armedKey, ms]);
  const ask = useCallback(
    (key: string, run: () => void) => {
      if (armedKey === key) {
        setArmedKey(null);
        run();
      } else {
        haptic('error');
        setArmedKey(key);
      }
    },
    [armedKey],
  );
  return { armed: (key: string) => armedKey === key, ask, reset: () => setArmedKey(null) };
}
