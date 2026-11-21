'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import type { RoomSettings } from '@iatrome/game/client';
import { Button } from '@/components/ui/Button';
import { CROWD_LABEL, GamePicker, ModePicker, TeamsToggle, TimeToggle } from './GameSettings';
import styles from './SettingsDialog.module.css';

interface Props {
  open: boolean;
  settings: RoomSettings;
  onChange: (patch: Partial<RoomSettings>) => void;
  onClose: () => void;
}

/** Change the game from the lobby: a focused dialog instead of a panel that shoves the lobby around. */
export function SettingsDialog({ open, settings, onChange, onClose }: Props) {
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 30, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <h2 id="settings-title" className={styles.title}>
              Change game
            </h2>
            <section className={styles.section}>
              <h3 className={styles.label}>Game</h3>
              <GamePicker value={settings.game} onChange={(game) => onChange({ game })} />
            </section>
            <section className={styles.section}>
              <h3 className={styles.label}>{CROWD_LABEL}</h3>
              <ModePicker value={settings.mode} onChange={(mode) => onChange({ mode })} />
            </section>
            <section className={styles.section}>
              <h3 className={styles.label}>Timers</h3>
              <TimeToggle settings={settings} onChange={onChange} />
            </section>
            <section className={styles.section}>
              <h3 className={styles.label}>Team trivia</h3>
              <TeamsToggle settings={settings} onChange={onChange} />
            </section>
            <Button autoFocus size="lg" block onClick={onClose}>
              Done
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
