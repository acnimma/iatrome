'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AVATARS, type GameResult, REVEAL, type RoomView, gameInfo } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar, avatarTone } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import { rememberSession } from '@/realtime/identity';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { useAfter } from '@/components/ui/Later';
import { Beep } from '@/components/room/Beep';
import { JoinQr, ReactionBar, RoomCode, Scoreboard } from '@/components/room/RoomBits';
import { SettingsDialog } from '@/components/room/SettingsDialog';
import { MyStat } from '@/components/room/Stat';
import { InviteButton } from '@/components/room/InviteButton';
import { haptic } from '@/lib/haptics';
import { GAME_ICONS } from '@/components/room/GameSettings';
import { ConfirmSheet } from './ConfirmSheet';
import { PhoneMessage } from './Phone';
import { useIsHost } from './PhoneHost';
import styles from './ControllerLobby.module.css';

/**
 * Leave the room for good: frees your name and seat, forgets the session, goes home.
 * Quiet, and never one tap: players get "tap again", a phones-only host gets told what it costs.
 */
function LeaveButton({ view }: { view: RoomView }) {
  const room = useRoom();
  const router = useRouter();
  const isHost = useIsHost(view.code);
  const [asking, setAsking] = useState(false);
  const leave = () => {
    room.command({ type: 'leave' });
    rememberSession(view.code, null);
    router.push('/');
  };
  if (isHost && !view.screen) {
    return (
      <>
        <Button tone="ghost" size="sm" onClick={() => setAsking(true)} aria-haspopup="dialog">
          <Icon name="back" size={22} /> Leave
        </Button>
        <ConfirmSheet
          open={asking}
          title="End the room for everyone?"
          confirm="End the room"
          onConfirm={() => {
            room.host({ type: 'close' });
            leave();
          }}
          onClose={() => setAsking(false)}
        >
          You’re the host. If you leave, the room closes and everyone in it goes home.
        </ConfirmSheet>
      </>
    );
  }
  return (
    <Button tone="ghost" size="sm" confirm="Tap again to leave" onClick={leave}>
      <Icon name="back" size={22} /> Leave
    </Button>
  );
}

export function ControllerLobby({ view }: { view: RoomView }) {
  const room = useRoom();
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState(false);
  const isHost = useIsHost(view.code);
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
        <LeaveButton view={view} />
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
        <Avatar avatar={me.avatar} size={view.screen ? 112 : 84} />
        <span className={styles.tapHint}>{picking ? 'Pick one' : 'Tap to change'}</span>
      </motion.button>
      <p className={styles.myName}>{me.name}</p>

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
      ) : (view.screen || !isHost || me.role === 'audience') && (
        <PhoneMessage title={me.role === 'audience' ? 'You’re up next game' : 'You’re in!'}>
          {me.role === 'audience' ? 'This game is full. You’ll be dealt into the next one.' : `Next up: ${info.title}.${view.screen ? ' Eyes on the big screen.' : ''}`}
        </PhoneMessage>
      )}

      {isHost && !view.screen && (
        <>
          <button type="button" className={styles.gamePill} onClick={() => setEditing(true)} aria-haspopup="dialog" aria-label={`Change game: ${info.title}, ${view.settings.mode === 'pro' ? 'Pro' : 'Normal'}`}>
            <Icon name={GAME_ICONS[view.settings.game]} size={34} />
            <span className={styles.gamePillText}>
              <strong>{info.title}</strong>
              <span>{view.settings.mode === 'pro' ? 'Pro' : 'Normal'}{view.settings.extendedTimers ? ' · More time' : ''}</span>
            </span>
            <span className={styles.gamePillAction}>Change</span>
          </button>
          <SettingsDialog open={editing} settings={view.settings} onChange={(settings) => room.host({ type: 'settings', settings })} onClose={() => setEditing(false)} />
        </>
      )}

      <div className={styles.others}>
        {players
          .filter((p) => p.id !== me.id)
          .map((p) => (
            <div key={p.id} className={styles.other}>
              <Avatar avatar={p.avatar} size={34} />
              <span className={styles.otherName}>{p.name}</span>
            </div>
          ))}
      </div>

      <MyStat view={view} />

      {view.screen ? <InviteButton code={view.code} /> : <JoinCard code={view.code} />}

      {/* One obvious place to start: the big screen when there is one, the VIP's phone when there isn't. */}
      {isVip && view.screen && (
        <p className={styles.vipScreen}>
          <Icon name="star" size={22} /> You’re the VIP. Start it on the big screen when everyone’s in.
        </p>
      )}
      {isVip && !view.screen && (
        <div className={styles.vip}>
          <Button
            size="xl"
            block
            waiting={needed > 0}
            onClick={() => {
              room.command({ type: 'start' });
            }}
          >
            {needed > 0 ? `Waiting for ${needed} more player${needed === 1 ? '' : 's'}` : 'Everybody’s in. Start!'}
          </Button>
          <p className={styles.vipNote}>
            {needed > 0 ? `${players.length} of ${info.min} in. ${info.title} needs at least ${info.min} players. Share the code above.` : 'You’re the VIP, so you start the game.'}
          </p>
        </div>
      )}
    </div>
  );
}

/** No big screen to show the code, so the phones do: tiles, a QR to scan, and a share link. */
function JoinCard({ code }: { code: string }) {
  const [qr, setQr] = useState(false);
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/${code}`;
  return (
    <div className={styles.joinCard}>
      <span className={styles.joinLabel}>Friends join with</span>
      <RoomCode code={code} size="md" />
      <div className={styles.joinActions}>
        <InviteButton code={code} />
        <Button tone="pearl" onClick={() => setQr((q) => !q)} aria-expanded={qr}>
          {qr ? 'Hide QR' : 'Show QR'}
        </Button>
      </div>
      {qr && (
        <motion.div className={styles.joinQr} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <JoinQr url={url} />
        </motion.div>
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
  const isHost = useIsHost(view.code);
  // With a big screen, let the podium land before the phone gives it away.
  const revealed = useAfter(view.screen ? REVEAL.podium : 0, result);
  const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] ?? 'th'}`;
  const place = myTeam?.rank ?? mine?.rank ?? 0;
  const headline = myTeam ? `${myTeam.name} came ${ordinal(myTeam.rank)}` : mine ? `You came ${ordinal(mine.rank)}` : 'Game over';
  return (
    <div className={styles.lobby}>
      <div className={styles.topBar}>
        <LeaveButton view={view} />
      </div>
      {!revealed ? (
        <PhoneMessage icon="drum" title="Eyes up." />
      ) : (
        <>
          {place === 1 && <Confetti pieces={90} />}
          <PhoneMessage icon={place === 1 ? 'trophy' : place && place <= 3 ? 'party' : 'stethoscope'} title={headline}>
            {myTeam ? `${myTeam.score.toLocaleString()} points as a team` : mine ? (mine.note ?? `${mine.score.toLocaleString()} points`) : 'Thanks for watching.'}
          </PhoneMessage>
          {!view.screen && result.teams && <TeamTable teams={result.teams} you={view.you?.id} />}
          {!view.screen && <Scoreboard view={view} scores={Object.fromEntries(result.standings.map((s) => [s.playerId, s.score]))} limit={8} />}
          {view.screen && <Beep line={view.hostLine} size={64} compact />}
          <MyStat view={view} />
          <ReactionBar />
        </>
      )}
      {isVip && !view.screen && (
        <Button size="lg" block onClick={() => {
            room.command({ type: 'start' });
          }}>
          Play again
        </Button>
      )}
      {/* Same room, same code: the phones-only host goes back to the lobby to pick another game or crowd. */}
      {isHost && !view.screen && (
        <Button tone="pearl" size="lg" block onClick={() => room.host({ type: 'lobby' })}>
          Pick another game
        </Button>
      )}
    </div>
  );
}

function TeamTable({ teams, you }: { teams: NonNullable<GameResult['teams']>; you?: string }) {
  return (
    <ol className={styles.teams}>
      {teams.map((t) => (
        <li key={t.name} className={t.members.includes(you ?? '') ? styles.myTeamRow : undefined}>
          <span>{t.rank}</span>
          <strong>{t.name}</strong>
          <span>{t.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}
