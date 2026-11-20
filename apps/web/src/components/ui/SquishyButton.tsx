'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import styles from './SquishyButton.module.css';

type Variant = 'gold' | 'rose' | 'sky' | 'snow';

type Props = HTMLMotionProps<'button'> & { variant?: Variant };

/**
 * The house button: a chunky sticker that squashes when pressed and
 * springs back with a little overshoot.
 */
export function SquishyButton({ variant = 'gold', className, children, ...rest }: Props) {
  return (
    <motion.button
      type="button"
      className={`${styles.button} ${styles[variant]} ${className ?? ''}`}
      whileHover={{ scale: 1.04, rotate: -1 }}
      whileTap={{ scaleX: 1.08, scaleY: 0.88, y: 4 }}
      transition={{ type: 'spring', stiffness: 600, damping: 15 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
