'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { RoomView } from '@iatrome/game/client';
import { RoomContext, useRoomConnection, useSnapshot } from '@/realtime/use-room';
import type { Snapshot } from '@/realtime/room-client';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { haptic } from '@/lib/haptics';
import { GrandRoundsController } from '@/games/grand-rounds/GrandRoundsController';
import { SketchController } from '@/games/sketch/SketchController';
import { SurviveController } from '@/games/survive/SurviveController';
import { PoisonController } from '@/games/poison/PoisonController';
import { DidacticsController } from '@/games/didactics/DidacticsController';
import { JoinForm } from './JoinForm';
import { BeepBanner, PhoneMessage } from './Phone';
import { HostMenu, useIsHost } from './PhoneHost';
import { StatCalls, StatOnThis } from '@/components/room/Stat';
import { ControllerLobby, ControllerResults } from './ControllerLobby';
import styles from './Controller.module.css';

/** A player's phone. */
export function Controller({ code }: { code: string }) {
  const client = useRoomConnection(code, false);
  const snap = useSnapshot(client);
  useWakeLock(snap.status === 'ready');

  if (!client) return null;
  return (
    <RoomContext.Provider value={client}>
      <div className={styles.phone}>
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
  if (!snap.view) return <p className={styles.connecting}>Connecting…</p>;
  return <InRoom view={snap.view} reconnecting={snap.status === 'reconnecting'} />;
}

function InRoom({ view, reconnecting }: { view: RoomView; reconnecting: boolean }) {
  const me = view.people.find((p) => p.id === view.you?.id);
  const watching = view.stage === 'playing' && !view.you?.inGame;
  // Grand Rounds lets everyone vote, seated or not; other games park watchers until the next one.
  const parked = watching && view.game?.game !== 'grand-rounds';
  const isHost = useIsHost(view.code);
  return (
    <>
      <header className={styles.header}>
        {me && <Avatar avatar={me.avatar} size={36} />}
        <span className={styles.me}>{me?.name}</span>
        {watching && <span className={styles.tag}>{parked ? 'Next game' : 'Audience'}</span>}
        <span className={styles.code}>{view.code}</span>
        {isHost && !view.screen && <HostMenu view={view} />}
      </header>
      {reconnecting && <div className={styles.reconnecting}>Reconnecting…</div>}
      {!view.screen && view.stage !== 'lobby' && <BeepBanner line={view.hostLine} />}
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
    case 'survive':
      return <SurviveController view={view} game={view.game} />;
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

function Removed({ reason }: { reason: 'kicked' | 'banned' | 'closed' }) {
  return (
    <div className={styles.center}>
      <h1 className={styles.bigTitle}>{reason === 'banned' ? 'You’ve been banned from this room' : 'You were removed'}</h1>
      <p className={styles.soft}>{reason === 'banned' ? 'The host banned this device from the room.' : 'The host removed you from the room.'}</p>
      <Link href="/">
        <Button tone="pearl" size="lg">
          Back home
        </Button>
      </Link>
    </div>
  );
}

function NoRoom({ code }: { code: string }) {
  return (
    <div className={styles.center}>
      <h1 className={styles.bigTitle}>No room called {code}</h1>
      <p className={styles.soft}>Double-check the code. Rooms close after 30 minutes with nobody in them.</p>
      <Link href="/">
        <Button size="lg">
          Try another code
        </Button>
      </Link>
    </div>
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
