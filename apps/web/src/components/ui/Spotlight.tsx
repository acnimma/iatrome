'use client';

import { AnimatePresence, motion } from 'motion/react';
import styles from './Spotlight.module.css';

/**
 * The drumroll spotlight: the stage dims and a circle of light sweeps back and forth looking for
 * the winner. When the winner lands, their card takes over with `spotlit` (see the CSS).
 */
export function SpotlightSweep({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div className={styles.sweep} aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
      )}
    </AnimatePresence>
  );
}

/** The class that puts a card in the light while it's the moment's winner. */
export const spotlitClass = styles.spotlit;
