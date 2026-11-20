'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { REVEAL, type RoomView } from '@iatrome/game/client';
import { RoomContext, useRoomConnection, useSnapshot } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { Beep } from '@/components/room/Beep';
import { ReactionLayer, RoomCode } from '@/components/room/RoomBits';
import { isMuted, play, setMuted, unlockAudio } from '@/lib/sound';
import { readAloudEnabled, setReadAloud } from '@/lib/speech';
import { GrandRoundsStage } from '@/games/grand-rounds/GrandRoundsStage';
import { SketchStage } from '@/games/sketch/SketchStage';
import { SurviveStage } from '@/games/survive/SurviveStage';
import { PoisonStage } from '@/games/poison/PoisonStage';
import { DidacticsStage } from '@/games/didactics/DidacticsStage';
import { StageLobby } from './StageLobby';
import { HostControls } from './HostControls';
import { Podium } from './Podium';
import { StatCalls } from '@/components/room/Stat';
import styles from './Stage.module.css';

export interface StagePrefs {
  hideCode: boolean;
  muted: boolean;
  readAloud: boolean;
}

/** The shared screen: on a TV, a laptop, or screen-shared on Zoom. */
export function Stage({ code }: { code: string }) {
  const client = useRoomConnection(code, true);
  const snap = useSnapshot(client);
  const [prefs, setPrefs] = useState<StagePrefs>({ hideCode: false, muted: false, readAloud: false });

  useEffect(() => setPrefs((p) => ({ ...p, muted: isMuted(), readAloud: readAloudEnabled() })), []);

  const updatePrefs = (patch: Partial<StagePrefs>) => {
    if (patch.muted !== undefined) setMuted(patch.muted);
    if (patch.readAloud !== undefined) setReadAloud(patch.readAloud);
    setPrefs((p) => ({ ...p, ...patch }));
  };

  if (!client) return null;
  if (snap.status === 'failed') return <StageProblem code={code} error={snap.error} />;
  if (!snap.view) return <Loading />;

  return (
    <RoomContext.Provider value={client}>
      <div className={styles.stage} onPointerDown={unlockAudio}>
        <StageScreen view={snap.view} prefs={prefs} />
        <ReactionLayer view={snap.view} />
        <HostControls view={snap.view} prefs={prefs} onPrefs={updatePrefs} />
        {snap.status === 'reconnecting' && <div className={styles.banner}>Reconnecting…</div>}
        {snap.feedback?.error && <Toast key={snap.feedback.at} text={snap.feedback.error} />}
      </div>
    </RoomContext.Provider>
  );
}

function StageScreen({ view, prefs }: { view: RoomView; prefs: StagePrefs }) {
  useStageSounds(view);
  const inGame = view.stage !== 'lobby';
  return (
    <>
      {inGame && (
        <header className={styles.header}>
          <img src="/brand/wordmark.svg" alt="iatrome" className={styles.logo} />
          <span className={styles.joinHint}>
            <span>Room code</span>
            <RoomCode code={view.code} hidden={prefs.hideCode} size="md" />
          </span>
        </header>
      )}
      <main className={`${styles.main} ${inGame ? styles.inGame : ''}`} data-phase={`${view.stage}:${view.game?.phase.name ?? ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view.stage === 'playing' ? `game-${view.game?.game}` : view.stage}
            className={styles.scene}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {view.stage === 'lobby' && <StageLobby view={view} hideCode={prefs.hideCode} />}
            {view.stage === 'playing' && <StageGame view={view} />}
            {view.stage === 'over' && view.result && <Podium view={view} result={view.result} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <div className={styles.beep}>
        <Beep line={view.hostLine} size={110} voiced />
      </div>
      {view.stage === 'playing' && <StatCalls view={view} floating />}
      {view.paused && (
        <motion.div className={styles.paused} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span>Paused</span>
        </motion.div>
      )}
    </>
  );
}

function StageGame({ view }: { view: RoomView }) {
  switch (view.game?.game) {
    case 'grand-rounds':
      return <GrandRoundsStage view={view} game={view.game} />;
    case 'sketch':
      return <SketchStage view={view} game={view.game} />;
    case 'survive':
      return <SurviveStage view={view} game={view.game} />;
    case 'poison':
      return <PoisonStage view={view} game={view.game} />;
    case 'didactics':
      return <DidacticsStage view={view} game={view.game} />;
    default:
      return null;
  }
}

/** Joins, phase changes and the final fanfare. Game-specific stings live in each game. */
function useStageSounds(view: RoomView) {
  const people = useRef(view.people.length);
  const phase = useRef('');
  useEffect(() => {
    if (view.people.length > people.current) play('pop');
    people.current = view.people.length;
  }, [view.people.length]);
  useEffect(() => {
    const key = `${view.stage}:${view.game?.phase.name ?? ''}`;
    if (key !== phase.current && phase.current) {
      if (view.stage === 'over') {
        play('drumroll');
        setTimeout(() => play('win'), REVEAL.podium - 200);
      }
      else if (view.game && ['intro', 'scores'].includes(view.game.phase.name)) play('whoosh');
    }
    phase.current = key;
  }, [view.stage, view.game]);
}

function StageProblem({ code, error }: { code: string; error: string | null }) {
  const gone = error === 'no-room';
  return (
    <div className={styles.problem}>
      <h1>{gone ? 'This room has closed' : 'This screen isn’t the host'}</h1>
      <p>
        {gone
          ? 'Rooms close after 30 minutes with nobody in them. Start a fresh one in seconds.'
          : 'Only the browser that created the room can run its stage. Want to play instead?'}
      </p>
      <div className={styles.problemActions}>
        {!gone && (
          <Link href={`/play/${code}`}>
            <Button tone="pearl" size="lg">
              Join as a player
            </Button>
          </Link>
        )}
        <Link href="/host">
          <Button size="lg">
            Host a new game
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className={styles.problem}>
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className={styles.loading}>
        Connecting…
      </motion.div>
    </div>
  );
}

function Toast({ text }: { text: string }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShown(false), 3500);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {shown && (
        <motion.div className={styles.toast} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
