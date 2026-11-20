'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { type RoomView, gameInfo } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { roomPassword } from '@/realtime/identity';
import { siteDisplayHost } from '@/realtime/config';
import { Avatar } from '@/components/ui/Avatar';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { GamePicker, RoomOptions } from '@/components/room/GameSettings';
import { InviteButton } from '@/components/room/InviteButton';
import { JoinQr, Pill, RoomCode } from '@/components/room/RoomBits';
import { unlockAudio } from '@/lib/sound';
import styles from './StageLobby.module.css';
import { Icon } from '@/components/icons/Icon';

export function StageLobby({ view, hideCode }: { view: RoomView; hideCode: boolean }) {
  const room = useRoom();
  const [site, setSite] = useState('');
  const [password, setPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSite(siteDisplayHost());
    setPassword(roomPassword(view.code));
  }, [view.code]);

  const info = gameInfo[view.settings.game];
  const players = view.people.filter((p) => p.role === 'player');
  const audience = view.people.filter((p) => p.role === 'audience');
  const ready = players.filter((p) => p.connected).length;
  const needed = Math.max(0, info.min - ready);
  // Shrink the bubbles as the room fills (team trivia takes up to 40).
  const bubble = players.length > 20 ? 40 : players.length > 10 ? 52 : 64;
  const joinUrl = site ? `${window.location.protocol}//${window.location.host}/${view.code}` : '';

  return (
    <div className={styles.lobby}>
      <section className={styles.join}>
        <div className={styles.home}>
          <BackButton href="/" label="Home" />
        </div>
        <img src="/brand/wordmark.svg" alt="iatrome" className={styles.wordmark} />
        <p className={styles.lead}>Grab your phone and go to</p>
        <p className={styles.site}>{site}</p>
        <RoomCode code={view.code} hidden={hideCode} />
        <div className={styles.qrRow}>
          <div className={styles.qr}>{joinUrl && !hideCode && <JoinQr url={joinUrl} />}</div>
          <div className={styles.joinNotes}>
            {password && (
              <button type="button" className={styles.password} onClick={() => setShowPassword((s) => !s)}>
                <Pill tone="gold">
                  <Icon name="lock" size={18} /> Password
                </Pill>
                <span className={styles.passwordText}>{showPassword ? password : 'tap to reveal'}</span>
              </button>
            )}
            {!hideCode && <InviteButton code={view.code} />}
            {view.locked && <Pill tone="rose">Room locked</Pill>}
            <p className={styles.note}>No real patients or identifiers, please.</p>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.gameHead}>
          <div>
            <span className={styles.eyebrow}>Playing</span>
            <h2 className={styles.gameTitle}>{info.title}</h2>
            <p className={styles.tagline}>{info.tagline}</p>
          </div>
          <Button tone="card" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>
            {editing ? 'Done' : 'Change'}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {editing && (
            <motion.div className={styles.settings} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <GamePicker compact value={view.settings.game} onChange={(game) => room.host({ type: 'settings', settings: { game } })} />
              <RoomOptions settings={view.settings} onChange={(settings) => room.host({ type: 'settings', settings })} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.playersHead}>
          <span className={styles.eyebrow}>
            Players {players.length}/{info.max}
          </span>
          {audience.length > 0 && <Pill>+{audience.length} watching</Pill>}
        </div>

        <ul className={styles.players} style={{ '--bubble': `${bubble}px` } as React.CSSProperties}>
          <AnimatePresence>
            {players.map((p) => (
              <motion.li
                key={p.id}
                layout
                className={styles.player}
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16 }}
              >
                <Avatar avatar={p.avatar} size={bubble} name={p.name} dim={!p.connected} badge={view.vip === p.id ? <Icon name="star" size={Math.round(bubble * 0.32)} label="VIP" /> : undefined} />
                <span className={styles.playerActions}>
                  <button type="button" onClick={() => room.host({ type: 'kick', id: p.id })} aria-label={`Kick ${p.name}`}>
                    Kick
                  </button>
                  <button type="button" onClick={() => room.host({ type: 'ban', id: p.id })} aria-label={`Ban ${p.name}`}>
                    Ban
                  </button>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
          {Array.from({ length: Math.max(0, Math.min(info.max, 8) - players.length) }, (_, i) => (
            <li key={`empty-${i}`} className={styles.empty} aria-hidden />
          ))}
        </ul>

        <div className={styles.actions}>
          <Button
            tone="rose"
            size="xl"
            block
            disabled={needed > 0}
            onClick={() => {
              unlockAudio();
              room.host({ type: 'start' });
            }}
          >
            {needed > 0 ? `Waiting for ${needed} more player${needed === 1 ? '' : 's'}` : 'Everybody’s in. Start!'}
          </Button>
          <div className={styles.secondary}>
            <Button tone="ghost" onClick={() => room.host({ type: view.locked ? 'unlock' : 'lock' })}>
              <Icon name="lock" size={22} /> {view.locked ? 'Unlock room' : 'Lock room'}
            </Button>
            {view.devMode && (
              <Button tone="ghost" onClick={() => room.host({ type: 'add-bot' })}>
                <Icon name="robot" size={22} /> Add a bot
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
