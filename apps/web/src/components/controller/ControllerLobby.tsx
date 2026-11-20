'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AVATARS, type GameResult, type RoomView, gameInfo } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar, avatarTone } from '@/components/ui/Avatar';
import { BackButton } from '@/components/ui/BackButton';
import { Icon } from '@/components/icons/Icon';
import { rememberSession } from '@/realtime/identity';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { Beep } from '@/components/room/Beep';
import { ReactionBar } from '@/components/room/RoomBits';
import { haptic } from '@/lib/haptics';
import { PhoneMessage } from './Phone';
import styles from './ControllerLobby.module.css';

/** Leave the room for good: frees your name and seat, forgets the session, goes home. */
function LeaveButton({ code }: { code: string }) {
  const room = useRoom();
  const router = useRouter();
  return (
    <BackButton
      label="Leave room"
      onClick={() => {
        room.command({ type: 'leave' });
        rememberSession(code, null);
        router.push('/');
      }}
    />
  );
}

export function ControllerLobby({ view }: { view: RoomView }) {
  const room = useRoom();
  const [picking, setPicking] = useState(false);
  const me = view.people.find((p) => p.id === view.you?.id);
  const info = gameInfo[view.settings.game];
  const players = view.people.filter((p) => p.role === 'player' && p.connected);
  const isVip = view.vip === me?.id;
  const needed = Math.max(0, info.min - players.length);
  const taken = new Set(view.people.filter((p) => p.id !== me?.id).map((p) => p.avatar));
  if (!me) return null;

  return (
    <div className={styles.lobby}>
      <div className={styles.topBar}>
        <LeaveButton code={view.code} />
      </div>
      <motion.button
        type="button"
        className={styles.me}
        onClick={() => setPicking((p) => !p)}
        whileTap={{ scale: 0.94 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 14 }}
        aria-label="Change your avatar"
      >
        <Avatar avatar={me.avatar} size={112} />
        <span className={styles.tapHint}>{picking ? 'Pick one' : 'Tap to change'}</span>
      </motion.button>

      {picking ? (
        <div className={styles.picker} role="radiogroup" aria-label="Avatar">
          {AVATARS.map((name, i) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={me.avatar === i}
              disabled={taken.has(i)}
              className={styles.option}
              style={{ background: avatarTone(i) }}
              onClick={() => {
                haptic('tap');
                room.command({ type: 'avatar', avatar: i });
                setPicking(false);
              }}
            >
              <Icon name={name} size={40} />
            </button>
          ))}
        </div>
      ) : (
        <PhoneMessage title={me.role === 'audience' ? 'You’re in the audience' : 'You’re in!'}>
          {me.role === 'audience' ? 'You’ll get to vote on everyone’s answers.' : `Next up: ${info.title}. Eyes on the big screen.`}
        </PhoneMessage>
      )}

      <div className={styles.others}>
        {players
          .filter((p) => p.id !== me.id)
          .map((p) => (
            <Avatar key={p.id} avatar={p.avatar} size={34} />
          ))}
      </div>

      {isVip && (
        <div className={styles.vip}>
          <Button tone="rose" size="xl" block disabled={needed > 0} onClick={() => room.command({ type: 'start' })}>
            {needed > 0 ? `Need ${needed} more` : 'Everybody’s in. Start!'}
          </Button>
          <p className={styles.vipNote}>You’re the VIP, so you can start the game.</p>
        </div>
      )}
    </div>
  );
}

/** Phone screen once a game ends. */
export function ControllerResults({ view, result }: { view: RoomView; result: GameResult }) {
  const room = useRoom();
  const mine = result.standings.find((s) => s.playerId === view.you?.id);
  const myTeam = result.teams?.find((t) => t.members.includes(view.you?.id ?? ''));
  const isVip = view.vip === view.you?.id;
  const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? 'th'}`;
  return (
    <div className={styles.lobby}>
      <div className={styles.topBar}>
        <LeaveButton code={view.code} />
      </div>
      {mine?.rank === 1 && <Confetti pieces={90} />}
      <PhoneMessage icon={mine?.rank === 1 ? 'trophy' : mine && mine.rank <= 3 ? 'party' : 'stethoscope'} title={mine ? `You came ${ordinal(mine.rank)}!` : 'Game over!'}>
        {mine ? `${mine.score.toLocaleString()} points` : 'Thanks for watching.'}
      </PhoneMessage>
      <Beep line={view.hostLine} size={64} compact />
      <ReactionBar />
      {isVip && (
        <Button tone="rose" size="lg" block onClick={() => room.command({ type: 'start' })}>
          Play again
        </Button>
      )}
    </div>
  );
}
