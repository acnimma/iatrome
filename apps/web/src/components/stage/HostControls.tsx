'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Toggle } from '@/components/ui/Toggle';
import { unlockAudio } from '@/lib/sound';
import type { StagePrefs } from './Stage';
import styles from './HostControls.module.css';

/** The host's tucked-away control pill + drawer. Never in the way of the show. */
export function HostControls({ view, prefs, onPrefs }: { view: RoomView; prefs: StagePrefs; onPrefs: (p: Partial<StagePrefs>) => void }) {
  const room = useRoom();
  const [open, setOpen] = useState(false);
  const playing = view.stage === 'playing';
  const gr = view.game?.game === 'grand-rounds' ? view.game : null;
  const canHide = Boolean(gr?.matchup && ['present', 'vote', 'results'].includes(gr.phase.name));

  return (
    <div className={styles.dock}>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.drawer}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            <h3 className={styles.title}>Host controls</h3>
            {canHide && (
              <div className={styles.group}>
                <span className={styles.label}>Hide an answer (it forfeits)</span>
                <div className={styles.row}>
                  <button type="button" className={styles.action} onClick={() => room.host({ type: 'hide', target: 'a' })}>
                    Hide left
                  </button>
                  <button type="button" className={styles.action} onClick={() => room.host({ type: 'hide', target: 'b' })}>
                    Hide right
                  </button>
                </div>
              </div>
            )}
            {view.game?.game === 'poison' && view.game.phase.name === 'defence' && (
              <button type="button" className={styles.action} onClick={() => room.host({ type: 'hide', target: 'defence' })}>
                Hide this defence
              </button>
            )}
            <Toggle label="Sound" checked={!prefs.muted} onChange={(on) => onPrefs({ muted: !on })} />
            <Toggle label="Read prompts aloud" hint="Great when the stage is shared on Zoom." checked={prefs.readAloud} onChange={(readAloud) => onPrefs({ readAloud })} />
            <Toggle label="Hide room code" hint="Streaming? Keep the code off screen." checked={prefs.hideCode} onChange={(hideCode) => onPrefs({ hideCode })} />
            <Toggle
              label="Lock room"
              hint="Nobody new can join, not even to watch."
              checked={view.locked}
              onChange={(locked) => room.host({ type: locked ? 'lock' : 'unlock' })}
            />
            {playing && (
              <button
                type="button"
                className={`${styles.action} ${styles.danger}`}
                onClick={() => {
                  room.host({ type: 'end' });
                  setOpen(false);
                }}
              >
                End game &amp; return to lobby
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.pill}>
        {playing && (
          <>
            <button
              type="button"
              className={styles.icon}
              onClick={() => room.host({ type: view.paused ? 'resume' : 'pause' })}
              aria-label={view.paused ? 'Resume' : 'Pause'}
              title={view.paused ? 'Resume' : 'Pause'}
            >
              {view.paused ? '▶' : '❚❚'}
            </button>
            <button type="button" className={styles.icon} onClick={() => room.host({ type: 'skip' })} aria-label="Skip ahead" title="Skip ahead">
              ⏭
            </button>
          </>
        )}
        <button
          type="button"
          className={`${styles.icon} ${open ? styles.active : ''}`}
          onClick={() => {
            unlockAudio();
            setOpen((o) => !o);
          }}
          aria-expanded={open}
          aria-label="Host controls"
          title="Host controls"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
