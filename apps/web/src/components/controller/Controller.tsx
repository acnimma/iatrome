'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { RoomView } from '@iatrome/game/client';
import { RoomContext, useRoom, useRoomConnection, useSnapshot } from '@/realtime/use-room';
import type { Snapshot } from '@/realtime/room-client';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { haptic } from '@/lib/haptics';
import { Icon } from '@/components/icons/Icon';
import { GrandRoundsController } from '@/games/grand-rounds/GrandRoundsController';
import { SketchController } from '@/games/sketch/SketchController';
import { TiebreakController } from '@/games/tiebreak/TiebreakController';
import { PoisonController } from '@/games/poison/PoisonController';
import { DidacticsController } from '@/games/didactics/DidacticsController';
import { EdgePage } from '@/components/home/EdgePage';
import { JoinForm } from './JoinForm';
import { ReactionLayer } from '@/components/room/RoomBits';
import { play, unlockAudio } from '@/lib/sound';
import { BeepBanner, PhoneMessage, SoundHint } from './Phone';
import { HostMenu, useIsHost } from './PhoneHost';
import { StatCalls, StatOnThis } from '@/components/room/Stat';
import { ControllerLobby, ControllerResults } from './ControllerLobby';
import styles from './Controller.module.css';

/** Timed phases where the phone is for answering, so Beep's banner waits its turn. */
const QUIET_PHASES = new Set(['question', 'draw']);

/** A player's phone. */
export function Controller({ code }: { code: string }) {
  const client = useRoomConnection(code, false);
  const snap = useSnapshot(client);
  useWakeLock(snap.status === 'ready');

  if (!client) return null;
  return (
    <RoomContext.Provider value={client}>
      <div className={styles.phone} onPointerDown={unlockAudio}>
        <PhoneScreen code={code} snap={snap} />
        <FeedbackToast feedback={snap.feedback} />
      </div>
    </RoomContext.Provider>
  );
}

function PhoneScreen({ code, snap }: { code: string; snap: Snapshot }) {
  if (snap.removed) return <Removed reason={snap.removed} />;
  if (snap.error === 'no-room') return <NoRoom code={code} />;
  if (snap.status === 'needs-join' || snap.status === 'joining') return <JoinForm code={code} snap={snap} />;
  if (!snap.view) return snap.stalled ? <Stalled /> : <Connecting />;
  return <InRoom view={snap.view} reconnecting={snap.status === 'reconnecting'} />;
}

function Connecting() {
  return (
    <motion.p className={styles.connecting} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.4 }}>
      Connecting…
    </motion.p>
  );
}

/** The first connection never landed: say so, and offer the one thing that might help. */
function Stalled() {
  const room = useRoom();
  return (
    <EdgePage
      eyebrow="No answer"
      title="Can’t reach the room"
      line="Eight seconds of knocking and nobody answered. Check your Wi-Fi or signal, then try again."
      bpm={118}
      action={
        <Button size="lg" block onClick={() => room.retry()}>
          Try again
        </Button>
      }
    />
  );
}

/** Sound on the phone, same as the laptop: someone joins, a round opens, the answers land. */
function usePhoneSounds(view: RoomView) {
  const people = useRef(view.people.length);
  const seen = useRef('');
  useEffect(() => {
    if (view.people.length > people.current) play('pop');
    people.current = view.people.length;
  }, [view.people.length]);
  useEffect(() => {
    const name = view.game?.phase.name ?? '';
    const key = `${view.stage}:${view.game?.game ?? ''}:${name}`;
    if (seen.current && key !== seen.current && view.stage === 'playing') {
      if (['reveal', 'results', 'verdict'].includes(name)) play('reveal');
      else if (['question', 'write', 'choose', 'draw'].includes(name)) play('whoosh');
    }
    seen.current = key;
  }, [view.stage, view.game]);
}

/** Beep's "turn the sound on" nudge: once per visit, gone after two seconds. */
function useSoundHint() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('iatrome:sound-hint');
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem('iatrome:sound-hint', '1');
    } catch {}
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, [show]);
  return show;
}

function InRoom({ view, reconnecting }: { view: RoomView; reconnecting: boolean }) {
  usePhoneSounds(view);
  const soundHint = useSoundHint();
  const me = view.people.find((p) => p.id === view.you?.id);
  const watching = view.stage === 'playing' && !view.you?.inGame;
  // Grand Rounds lets everyone vote, seated or not; other games park watchers until the next one.
  const parked = watching && view.game?.game !== 'grand-rounds';
  const isHost = useIsHost(view.code);
  // Beep keeps quiet on the phone while a timed question or drawing is open: the screen is for answering.
  const phase = view.game?.phase;
  const heads = view.stage === 'playing' && phase && phase.endsAt !== null && QUIET_PHASES.has(phase.name) && !watching;
  // Curtain up when a game starts, a flourish when it ends.
  const stage = useRef(view.stage);
  useEffect(() => {
    if (stage.current !== view.stage) {
      if (view.stage === 'playing') play('start');
      if (view.stage === 'over') play('win');
    }
    stage.current = view.stage;
  }, [view.stage]);
  return (
    <>
      <ReactionLayer />
      <SoundHint show={soundHint} />
      <header className={styles.header}>
        {me && <Avatar avatar={me.avatar} size={36} />}
        <span className={styles.me}>{me?.name}</span>
        {watching && <span className={styles.tag}>{parked ? 'Next game' : 'Audience'}</span>}
        <span className={styles.code}>{view.code}</span>
        {isHost && !view.screen && <HostMenu view={view} />}
      </header>
      {reconnecting && <div className={styles.reconnecting}>Reconnecting…</div>}
      {watching && !parked && (
        <p className={styles.audience}>
          <Icon name="popcorn" size={22} /> You’re in the audience. Vote along; you’ll play next game.
        </p>
      )}
      {!view.screen && view.stage !== 'lobby' && !heads && <BeepBanner line={view.hostLine} />}
      {view.stage === 'playing' && (
        <div className={styles.statRow}>
          <StatOnThis view={view} />
          {!view.screen && <StatCalls view={view} />}
        </div>
      )}
      <main className={styles.body}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view.stage === 'playing' ? `${view.game?.game}` : view.stage}
            className={styles.scene}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {view.stage === 'lobby' && <ControllerLobby view={view} />}
            {view.stage === 'playing' &&
              (parked ? (
                <PhoneMessage icon="hourglass" title="You’re in for the next game">
                  A game is already going. You’ll be dealt in when it ends.{view.screen ? ' Enjoy the big screen until then.' : ''}
                </PhoneMessage>
              ) : (
                <ControllerGame view={view} />
              ))}
            {view.stage === 'over' && view.result && <ControllerResults view={view} result={view.result} />}
          </motion.div>
        </AnimatePresence>
      </main>
      {view.paused && <div className={styles.paused}>Paused by the host</div>}
    </>
  );
}

function ControllerGame({ view }: { view: RoomView }) {
  switch (view.game?.game) {
    case 'grand-rounds':
      return <GrandRoundsController view={view} game={view.game} />;
    case 'sketch':
      return <SketchController view={view} game={view.game} />;
    case 'tiebreak':
      return <TiebreakController view={view} game={view.game} />;
    case 'poison':
      return <PoisonController view={view} game={view.game} />;
    case 'didactics':
      return <DidacticsController view={view} game={view.game} />;
    default:
      return null;
  }
}

function FeedbackToast({ feedback }: { feedback: Snapshot['feedback'] }) {
  const [shown, setShown] = useState<{ text: string; at: number; error: boolean } | null>(null);
  useEffect(() => {
    if (!feedback) return;
    // "correct"/"close" are handled by the guessing screen, "stat" by the Stat badge.
    const text = feedback.error ?? (feedback.notice && !['correct', 'close', 'stat'].includes(feedback.notice) ? `Beep wrote: “${feedback.notice}”` : null);
    if (!text) return;
    if (feedback.error) haptic('error');
    setShown({ text, at: feedback.at, error: Boolean(feedback.error) });
    const t = setTimeout(() => setShown(null), feedback.error ? 3200 : 2600);
    return () => clearTimeout(t);
  }, [feedback]);
  return (
    <AnimatePresence>
      {shown && (
        <motion.div key={shown.at} className={styles.toast} role={shown.error ? 'alert' : 'status'} initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}>
          {shown.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const REMOVED = {
  banned: { title: 'You’ve been banned from this room', text: 'The host banned this device. That decision is final, and not appealable to Beep.' },
  kicked: { title: 'You were removed', text: 'The host removed you from the room. You can rejoin if they let you.' },
  closed: { title: 'The room has closed', text: 'The host ended it. Discharged, effective immediately.' },
};

function Removed({ reason }: { reason: 'kicked' | 'banned' | 'closed' }) {
  return <EdgePage eyebrow="Room update" title={REMOVED[reason].title} line={REMOVED[reason].text} joinForm={reason !== 'banned'} />;
}

function NoRoom({ code }: { code: string }) {
  return (
    <EdgePage
      eyebrow={`Room ${code}`}
      title="No room by that code"
      joinForm
    />
  );
}

/** Keep the phone awake while playing (where the Wake Lock API exists). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // denied (battery saver etc.): not critical
      }
    };
    const onVisible = () => document.visibilityState === 'visible' && acquire();
    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [active]);
}
