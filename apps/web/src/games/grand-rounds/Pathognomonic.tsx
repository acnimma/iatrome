'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Confetti } from '@/components/ui/Confetti';
import styles from './Pathognomonic.module.css';

/**
 * The signature moment: every voter picked the same answer. In medicine, a pathognomonic sign
 * is the one finding that settles the diagnosis on its own. Here it settles the argument.
 */
export function Pathognomonic({ show, name }: { show: boolean; name: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <Confetti pieces={140} />
          <motion.div
            className={styles.card}
            initial={{ scale: 2.4, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: -3, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14 }}
          >
            <span className={styles.word}>Pathognomonic!</span>
            <motion.span className={styles.note} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
              Every vote went to {name}. The room agreed. That never happens.
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
