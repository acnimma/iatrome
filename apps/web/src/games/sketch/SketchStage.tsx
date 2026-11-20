'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { RoomView, SketchView } from '@iatrome/game/client';
import { useDrawing } from '@/realtime/use-room';
import { DrawingView } from '@/components/drawing/DrawingView';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { IntroCard, Pill, Scoreboard, nameOf, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import styles from './Sketch.module.css';

export function SketchStage({ view, game }: { view: RoomView; game: SketchView }) {
  const people = usePeople(view);
  const drawer = game.drawer ? people.get(game.drawer) : null;
  const drawing = useDrawing(game.drawingId);
  useSketchSounds(game);

  if (game.phase.name === 'intro') return <IntroCard eyebrow="Up next" title="Sketch" body="One player draws. Everyone races to guess on their phone. Faster guesses score more." />;

  if (game.phase.name === 'choose')
    return (
      <div className={styles.choosing}>
        {drawer && <Avatar avatar={drawer.avatar} size={120} />}
        <h2 className={styles.heading}>{drawer?.name ?? 'Someone'} is picking something to draw…</h2>
        <Pill>
          Turn {game.turn + 1} of {game.turns}
        </Pill>
      </div>
    );

  const revealing = game.phase.name === 'reveal';
  return (
    <div className={styles.board}>
      <div className={styles.canvasCol}>
        <div className={styles.canvasHead}>
          {drawer && (
            <span className={styles.drawer}>
              <Avatar avatar={drawer.avatar} size={40} /> {drawer.name} is drawing
            </span>
          )}
          {!revealing && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={64} ticks />}
        </div>
        <DrawingView drawing={drawing} className={styles.canvas} label="The drawing so far" />
        <Mask mask={game.mask} revealed={revealing} />
      </div>

      <aside className={styles.side}>
        {revealing ? (
          <div className={styles.revealList}>
            <h3 className={styles.sideTitle}>{game.solved.length ? 'Got it' : 'Nobody got it!'}</h3>
            {game.solved.map((s, i) => (
              <motion.div key={s.playerId} className={styles.solvedRow} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                <span>{nameOf(people, s.playerId)}</span>
                <strong>+{s.points}</strong>
              </motion.div>
            ))}
            {game.drawerPoints > 0 && drawer && (
              <div className={styles.solvedRow}>
                <span>{drawer.name} (artist)</span>
                <strong>+{game.drawerPoints}</strong>
              </div>
            )}
            <div className={styles.miniScores}>
              <Scoreboard view={view} scores={game.scores} limit={5} />
            </div>
          </div>
        ) : (
          <Feed view={view} game={game} />
        )}
      </aside>
    </div>
  );
}

function Mask({ mask, revealed }: { mask: string; revealed: boolean }) {
  return (
    <div className={`${styles.mask} ${revealed ? styles.maskRevealed : ''}`} aria-label={revealed ? `The answer was ${mask}` : 'Hint'}>
      {mask.split('').map((ch, i) =>
        ch === ' ' ? (
          <span key={i} className={styles.gap} />
        ) : (
          <motion.span key={`${i}-${ch}`} className={styles.letter} initial={ch !== '_' ? { scale: 1.6, y: -10 } : false} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 14, delay: revealed ? i * 0.04 : 0 }}>
            {ch === '_' ? '' : ch}
          </motion.span>
        ),
      )}
    </div>
  );
}

function Feed({ view, game }: { view: RoomView; game: SketchView }) {
  const people = usePeople(view);
  return (
    <div className={styles.feed} aria-live="polite">
      <h3 className={styles.sideTitle}>Guesses</h3>
      <AnimatePresence initial={false}>
        {game.feed.map((f, i) => {
          const p = people.get(f.playerId);
          return (
            <motion.div
              key={`${f.playerId}-${i}-${f.text}`}
              layout
              className={`${styles.feedItem} ${f.kind === 'correct' ? styles.correct : ''}`}
              initial={{ scale: 0.6, opacity: 0, x: 30 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            >
              {p && <Avatar avatar={p.avatar} size={28} />}
              <span className={styles.feedName}>{p?.name ?? 'Someone'}</span>
              <span className={styles.feedText}>{f.kind === 'correct' ? 'got it! ✓' : f.text}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function useSketchSounds(game: SketchView) {
  const solved = useRef(0);
  useEffect(() => {
    if (game.solved.length > solved.current) play('correct');
    solved.current = game.solved.length;
  }, [game.solved.length]);
  useEffect(() => {
    if (game.phase.name === 'reveal') play(game.solved.length ? 'reveal' : 'lose');
    if (game.phase.name === 'draw') play('whoosh');
  }, [game.phase.name, game.turn]); // eslint-disable-line react-hooks/exhaustive-deps
}
