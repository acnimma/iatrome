'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { hostToken } from '@/realtime/identity';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';
import { useConfirm } from '@/components/ui/Button';
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
  const others = view.people.filter((p) => p.id !== view.you?.id);
  const confirm = useConfirm();

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
        <Icon name="mic" size={22} />
        <span>Host</span>
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
                  <button type="button" className={`${styles.action} ${confirm.armed('skip') ? styles.armed : ''}`} onClick={() => confirm.ask('skip', () => run({ type: 'skip' }))}>
                    <Icon name="skip" size={22} /> {confirm.armed('skip') ? 'Tap to skip' : 'Skip ahead'}
                  </button>
                </div>
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
                        <button
                          type="button"
                          className={`${styles.small} ${confirm.armed(`kick:${p.id}`) ? styles.armed : ''}`}
                          onClick={() => confirm.ask(`kick:${p.id}`, () => room.host({ type: 'kick', id: p.id }))}
                          aria-label={confirm.armed(`kick:${p.id}`) ? `Confirm kick ${p.name}` : `Kick ${p.name}`}
                        >
                          {confirm.armed(`kick:${p.id}`) ? 'Sure?' : 'Kick'}
                        </button>
                        <button
                          type="button"
                          className={`${styles.small} ${confirm.armed(`ban:${p.id}`) ? styles.armed : ''}`}
                          onClick={() => confirm.ask(`ban:${p.id}`, () => room.host({ type: 'ban', id: p.id }))}
                          aria-label={confirm.armed(`ban:${p.id}`) ? `Confirm ban ${p.name}` : `Ban ${p.name}`}
                        >
                          {confirm.armed(`ban:${p.id}`) ? 'Sure?' : 'Ban'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {playing && (
                <button type="button" className={`${styles.quiet} ${confirm.armed('end') ? styles.armed : ''}`} onClick={() => confirm.ask('end', () => run({ type: 'end' }))}>
                  {confirm.armed('end') ? 'Tap again to end it for everyone' : 'End game and go back to the lobby'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
