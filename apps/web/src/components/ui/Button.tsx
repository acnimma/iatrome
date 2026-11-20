'use client';

import { type HTMLMotionProps, motion } from 'motion/react';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { type JellyTone, jelly } from './jelly';
import styles from './Button.module.css';

type Tone = JellyTone | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'xl';

type Props = HTMLMotionProps<'button'> & { tone?: Tone; size?: Size; block?: boolean };

/** The house button: a glossy jelly pill that squishes under your thumb and wobbles back. */
export function Button({ tone = 'black', size = 'md', block, className, onClick, disabled, children, ...rest }: Props) {
  const finish = tone === 'ghost' ? styles.ghost : jelly(tone);
  return (
    <motion.button
      type="button"
      className={`${styles.button} ${finish} ${styles[size]} ${block ? styles.block : ''} ${className ?? ''}`}
      whileHover={disabled ? undefined : { y: -2, scale: 1.015 }}
      whileTap={disabled ? undefined : { scaleX: 1.06, scaleY: 0.88, y: 2 }}
      transition={{ type: 'spring', stiffness: 650, damping: 14, mass: 0.8 }}
      disabled={disabled}
      onClick={(e) => {
        haptic('tap');
        play('pop');
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
