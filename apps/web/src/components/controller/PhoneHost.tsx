'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { hostToken } from '@/realtime/identity';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { Icon } from '@/components/icons/Icon';
import styles from './PhoneHost.module.css';

/** True on the phone that created the room. */
export function useIsHost(code: string) {
  const [host, setHost] = useState(false);
  useEffect(() => setHost(Boolean(hostToken(code))), [code]);
  return host;
}

/**
 * Host controls for phones-only rooms: pause, skip, lock, remove people, end the game.
 * With a big screen connected, the stage has these instead.
 */
export function HostMenu({ view }: { view: RoomView }) {
  const room = useRoom();
  const [open, setOpen] = useState(false);
  const playing = view.stage === 'playing';
  const others = view.people.filter((p) => p.id !== view.you?.id && !p.isBot);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const run = (cmd: Parameters<typeof room.host>[0]) => {
    room.host(cmd);
    setOpen(false);
  };

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label="Host controls" aria-haspopup="dialog">
        <Icon name="settings" size={26} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className={styles.scrim} onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Host controls"
              className={styles.sheet}
              onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            >
              <span className={styles.grabber} aria-hidden />
              <h2 className={styles.title}>Host controls</h2>

              {playing && (
                <div className={styles.row}>
                  <button type="button" className={styles.action} onClick={() => run({ type: view.paused ? 'resume' : 'pause' })}>
                    <Icon name={view.paused ? 'play' : 'pause'} size={22} /> {view.paused ? 'Resume' : 'Pause'}
                  </button>
                  <button type="button" className={styles.action} onClick={() => run({ type: 'skip' })}>
                    <Icon name="skip" size={22} /> Skip ahead
                  </button>
                </div>
              )}

              {view.devMode && view.stage === 'lobby' && (
                <button type="button" className={styles.action} onClick={() => run({ type: 'add-bot' })}>
                  <Icon name="robot" size={22} /> Add a bot
                </button>
              )}

              <Toggle label="Lock room" hint="Nobody new can join." checked={view.locked} onChange={(locked) => room.host({ type: locked ? 'lock' : 'unlock' })} />

              {others.length > 0 && (
                <div className={styles.people}>
                  <span className={styles.label}>Remove someone</span>
                  <ul>
                    {others.map((p) => (
                      <li key={p.id} className={styles.person}>
                        <Avatar avatar={p.avatar} size={34} />
                        <span className={styles.name}>{p.name}</span>
                        <button type="button" className={styles.small} onClick={() => room.host({ type: 'kick', id: p.id })}>
                          Kick
                        </button>
                        <button type="button" className={`${styles.small} ${styles.danger}`} onClick={() => room.host({ type: 'ban', id: p.id })}>
                          Ban
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {playing && (
                <button type="button" className={`${styles.action} ${styles.danger}`} onClick={() => run({ type: 'end' })}>
                  End game and go back to the lobby
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
