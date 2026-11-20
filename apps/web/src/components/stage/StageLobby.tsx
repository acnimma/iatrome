'use client';

import { track } from '@vercel/analytics';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { type RoomView, gameInfo } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { roomPassword } from '@/realtime/identity';
import { siteDisplayHost } from '@/realtime/config';
import { Avatar } from '@/components/ui/Avatar';
import { useRouter } from 'next/navigation';
import { Button, useConfirm } from '@/components/ui/Button';
import { SettingsDialog } from '@/components/room/SettingsDialog';
import { StatHolders } from '@/components/room/Stat';
import { InviteButton } from '@/components/room/InviteButton';
import { JoinQr, Pill, RoomCode } from '@/components/room/RoomBits';
import { unlockAudio } from '@/lib/sound';
import styles from './StageLobby.module.css';
import { Icon } from '@/components/icons/Icon';

export function StageLobby({ view, hideCode }: { view: RoomView; hideCode: boolean }) {
  const room = useRoom();
  const router = useRouter();
  const confirm = useConfirm();
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
  const bubble = players.length > 30 ? 34 : players.length > 20 ? 40 : players.length > 10 ? 52 : 64;
  const joinUrl = site ? `${window.location.protocol}//${window.location.host}/${view.code}` : '';

  return (
    <div className={styles.lobby}>
      <section className={styles.join}>
        <div className={styles.home}>
          <Button tone="ghost" size="sm" confirm="Tap again to close the stage" onClick={() => router.push('/')}>
            <Icon name="back" size={22} /> Home
          </Button>
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
            <p className={styles.note}>Leave real patients out of it. Nobody here signed a consent form.</p>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.gameHead}>
          <div>
            <span className={styles.eyebrow}>Playing</span>
            <h2 className={styles.gameTitle}>{info.title}</h2>
            <p className={styles.tagline}>{info.tagline}</p>
            <div className={styles.chips}>
              <Pill tone={view.settings.mode === 'pro' ? 'rose' : 'sky'}>{view.settings.mode === 'pro' ? 'Pro' : 'Normal'}</Pill>
              {view.settings.extendedTimers && <Pill>More time</Pill>}
            </div>
          </div>
          <Button tone="pearl" onClick={() => setEditing(true)} aria-haspopup="dialog">
            <Icon name="settings" size={22} /> Change game
          </Button>
        </div>
        <SettingsDialog
          open={editing}
          settings={view.settings}
          onChange={(settings) => room.host({ type: 'settings', settings })}
          onClose={() => setEditing(false)}
        />

        <div className={styles.playersHead}>
          <span className={styles.eyebrow}>
            Players {players.length}/{info.max}
          </span>
          {audience.length > 0 && <Pill>+{audience.length} next game</Pill>}
        </div>
        {players.length > info.max && (
          <p className={styles.overflow}>
            {info.title} seats {info.max}. {view.settings.game === 'grand-rounds' ? `The other ${players.length - info.max} vote.` : `The other ${players.length - info.max} play the next game.`}
          </p>
        )}

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
                <Avatar avatar={p.avatar} size={bubble} dim={!p.connected} badge={view.vip === p.id ? <Icon name="star" size={Math.round(bubble * 0.32)} label="VIP" /> : undefined} />
                {/* Wraps to two lines rather than cutting "Benjamin Franklin" short. */}
                <span className={`${styles.playerName} ${p.connected ? '' : styles.away}`}>{p.name}</span>
                <span className={`${styles.playerActions} ${confirm.armed(`kick:${p.id}`) || confirm.armed(`ban:${p.id}`) ? styles.asking : ''}`}>
                  {(['kick', 'ban'] as const).map((type) => {
                    const key = `${type}:${p.id}`;
                    const verb = type === 'kick' ? 'Kick' : 'Ban';
                    return (
                      <button
                        key={type}
                        type="button"
                        className={`${styles.kick} ${confirm.armed(key) ? styles.armed : ''}`}
                        onClick={() => confirm.ask(key, () => room.host({ type, id: p.id }))}
                        aria-label={confirm.armed(key) ? `Confirm ${type} ${p.name}` : `${verb} ${p.name}`}
                      >
                        {confirm.armed(key) ? `${verb}?` : verb}
                      </button>
                    );
                  })}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
          {Array.from({ length: Math.max(0, Math.min(info.max, 8) - players.length) }, (_, i) => (
            <li key={`empty-${i}`} className={styles.empty} aria-hidden />
          ))}
        </ul>

        <StatHolders view={view} />

        <div className={styles.actions}>
          <Button
            size="xl"
            block
            waiting={needed > 0}
            onClick={() => {
              unlockAudio();
              room.host({ type: 'start' });
              track('game_started', { game: view.settings.game, players: players.length, screen: 'big' });
            }}
          >
            {needed > 0 ? `Waiting for ${needed} more player${needed === 1 ? '' : 's'}` : 'Everybody’s in. Start!'}
          </Button>
          <div className={styles.secondary}>
            <Button tone="pearl" size="sm" onClick={() => room.host({ type: view.locked ? 'unlock' : 'lock' })}>
              <Icon name="lock" size={22} /> {view.locked ? 'Unlock room' : 'Lock room'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
