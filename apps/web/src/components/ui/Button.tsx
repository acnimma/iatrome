'use client';

import { type HTMLMotionProps, motion } from 'motion/react';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import styles from './Button.module.css';

type Tone = 'rose' | 'sky' | 'gold' | 'card' | 'ghost';
type Size = 'md' | 'lg' | 'xl';

type Props = HTMLMotionProps<'button'> & { tone?: Tone; size?: Size; block?: boolean };

/** The house button: a glossy pill that squishes on press and springs back. */
export function Button({ tone = 'rose', size = 'md', block, className, onClick, disabled, children, ...rest }: Props) {
  return (
    <motion.button
      type="button"
      className={`${styles.button} ${styles[tone]} ${styles[size]} ${block ? styles.block : ''} ${className ?? ''}`}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scaleX: 1.04, scaleY: 0.92, y: 1 }}
      transition={{ type: 'spring', stiffness: 700, damping: 22 }}
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
