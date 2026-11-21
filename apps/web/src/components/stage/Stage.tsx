'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { REVEAL, type RoomView } from '@iatrome/game/client';
import { RoomContext, useRoom, useRoomConnection, useSnapshot } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { Beep } from '@/components/room/Beep';
import { ReactionLayer, RoomCode } from '@/components/room/RoomBits';
import { type Mood, audioLocked, isMuted, play, setMuted, startMusic, stopMusic, unlockAudio } from '@/lib/sound';
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
}

/** The stage is laid out for this screen and scaled to fit whatever it's really on, like a TV show. */
const DESIGN = { width: 1440, height: 900 };

function useStageZoom() {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const fit = () => setZoom(Math.min(2.2, Math.max(0.6, Math.min(innerWidth / DESIGN.width, innerHeight / DESIGN.height))));
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);
  return zoom;
}

/** The shared screen: on a TV, a laptop, or screen-shared on Zoom. */
export function Stage({ code }: { code: string }) {
  const client = useRoomConnection(code, true);
  const snap = useSnapshot(client);
  const [prefs, setPrefs] = useState<StagePrefs>({ hideCode: false, muted: false });
  const zoom = useStageZoom();

  useEffect(() => setPrefs((p) => ({ ...p, muted: isMuted() })), []);

  const updatePrefs = (patch: Partial<StagePrefs>) => {
    if (patch.muted !== undefined) setMuted(patch.muted);
    setPrefs((p) => ({ ...p, ...patch }));
  };

  if (!client) return null;
  if (snap.status === 'failed') return <StageProblem code={code} error={snap.error} />;
  if (!snap.view) return <Loading stalled={snap.stalled} onRetry={() => client.retry()} />;

  return (
    <RoomContext.Provider value={client}>
      <div className={styles.stage} style={{ '--z': zoom } as React.CSSProperties} onPointerDown={unlockAudio}>
        <StageScreen view={snap.view} prefs={prefs} />
        <ReactionLayer />
        <HostControls view={snap.view} prefs={prefs} onPrefs={updatePrefs} />
        {snap.status === 'reconnecting' && <div className={styles.banner}>Reconnecting…</div>}
        {snap.feedback?.error && <Toast key={snap.feedback.at} text={snap.feedback.error} />}
      </div>
    </RoomContext.Provider>
  );
}

function StageScreen({ view, prefs }: { view: RoomView; prefs: StagePrefs }) {
  useStageSounds(view);
  useMusic(view, prefs.muted);
  const bpm = useShowBpm(view);
  const locked = useAudioLocked();
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
        <Beep line={view.hostLine} size={124} bpm={bpm} voiced />
      </div>
      <AnimatePresence>
        {locked && !prefs.muted && (
          <motion.button
            type="button"
            className={styles.soundHint}
            onClick={unlockAudio}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            Tap anywhere for sound
          </motion.button>
        )}
      </AnimatePresence>
      {view.stage === 'playing' && <StatCalls view={view} floating />}
      {view.paused && (
        <motion.div className={styles.paused} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className={styles.pausedText}>Paused</span>
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

// ── The show's pulse ─────────────────────────────────────────────────────────

const THINKING = ['write', 'question', 'choose', 'draw', 'defend', 'wager', 'huddle'];
const VOTING = ['vote', 'predict', 'pick'];
const REVEALING = ['results', 'reveal', 'scores', 'standings'];

/**
 * Beep's heart rate follows the show: calm in the lobby, up while people think, racing in the
 * last ten seconds of a timer, spiking at every reveal, then settling.
 */
function useShowBpm(view: RoomView): number {
  const room = useRoom();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(room.serverNow()), 500);
    return () => clearInterval(t);
  }, [room]);
  if (view.stage === 'lobby') return Math.min(86, 66 + view.people.length * 3);
  if (view.stage === 'over') return 118;
  const phase = view.game?.phase;
  if (!phase) return 72;
  const since = now - phase.startedAt;
  const left = phase.endsAt === null ? Infinity : phase.endsAt - now;
  const panic = left < 10_000 ? Math.round((10_000 - Math.max(0, left)) / 300) : 0;
  if (THINKING.includes(phase.name)) return 92 + panic;
  if (VOTING.includes(phase.name)) return 104 + panic;
  if (REVEALING.includes(phase.name)) return since < 2_200 ? 148 : 110;
  if (phase.name === 'present') return 98;
  return 84;
}

/** The music bed: on while people think or vote, silent for reveals (the drama needs the quiet). */
function useMusic(view: RoomView, muted: boolean) {
  const phase = view.game?.phase.name ?? '';
  const mood: Mood | null = muted
    ? null
    : view.stage === 'lobby'
      ? 'lobby'
      : view.stage !== 'playing'
        ? null
        : THINKING.includes(phase)
          ? 'think'
          : VOTING.includes(phase)
            ? 'vote'
            : null;
  useEffect(() => {
    if (mood) startMusic(mood);
    else stopMusic();
  }, [mood]);
  useEffect(() => () => stopMusic(), []);
}

/** Browsers block sound until the page is tapped: say so instead of being mysteriously silent. */
function useAudioLocked() {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const check = () => setLocked(audioLocked());
    const t = setInterval(check, 1000);
    const unlock = () => setTimeout(check, 100);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      clearInterval(t);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  return locked;
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
        setTimeout(() => play('cheer'), REVEAL.podium);
      }
      else if (view.game && view.game.phase.name === 'intro') play('start');
      else if (view.game && view.game.phase.name === 'scores') play('whoosh');
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

function Loading({ stalled, onRetry }: { stalled: boolean; onRetry: () => void }) {
  if (stalled)
    return (
      <div className={styles.problem}>
        <h1>Can’t reach the room</h1>
        <p>The game server isn’t answering. Check this screen’s connection, then try again.</p>
        <div className={styles.problemActions}>
          <Button size="lg" onClick={onRetry}>
            Try again
          </Button>
        </div>
      </div>
    );
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
