'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import styles from './ConfirmSheet.module.css';

/** A small "are you sure" sheet for the one-way doors that need more than "tap again". */
export function ConfirmSheet({
  open,
  title,
  confirm,
  cancel = 'Stay',
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  confirm: string;
  cancel?: string;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.scrim} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className={styles.sheet}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
          >
            <span className={styles.grabber} aria-hidden />
            <h2 className={styles.title}>{title}</h2>
            {children && <p className={styles.text}>{children}</p>}
            <div className={styles.actions}>
              <Button size="lg" block autoFocus onClick={onClose}>
                {cancel}
              </Button>
              <Button size="lg" block tone="pearl" className={styles.danger} onClick={onConfirm}>
                {confirm}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
