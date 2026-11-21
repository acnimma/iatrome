'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { RoomView, SketchView } from '@iatrome/game/client';
import { useDrawing } from '@/realtime/use-room';
import { DrawingView } from '@/components/drawing/DrawingView';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { IntroCard, Pill, Scoreboard, Stamp, nameOf, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import { Mask } from './Mask';
import { GalleryTile } from './SketchController';
import { useNewNudges } from './nudges';
import styles from './Sketch.module.css';

export function SketchStage({ view, game }: { view: RoomView; game: SketchView }) {
  const people = usePeople(view);
  const drawer = game.drawer ? people.get(game.drawer) : null;
  const drawing = useDrawing(game.drawingId);
  const nudges = useNewNudges(game.nudges);
  useSketchSounds(game, view);

  if (game.phase.name === 'intro')
    return (
      <IntroCard
        eyebrow="Up next"
        title="Sketch"
        body={`One player draws. Everyone races to guess on their phone or laptop. Faster guesses score more.${game.laps > 1 ? ' Everyone draws twice.' : ''} Letters get flagged.`}
      />
    );

  if (game.phase.name === 'gallery') return <Gallery view={view} game={game} />;

  if (game.phase.name === 'choose')
    return (
      <div className={styles.choosing}>
        {drawer && <Avatar avatar={drawer.avatar} size={120} />}
        <h2 className={styles.heading}>{drawer?.name ?? 'Someone'} is picking something to draw…</h2>
        <div className={styles.pills}>
          <Pill>
            Turn {game.turn + 1} of {game.turns}
          </Pill>
          {game.laps > 1 && (
            <Pill tone="sky">
              Lap {game.lap} of {game.laps}
            </Pill>
          )}
          {game.multiplier > 1 && <Pill tone="gold">Final stretch · double points</Pill>}
        </div>
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
          {game.multiplier > 1 && <Pill tone="gold">×2</Pill>}
          {!revealing && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={64} ticks />}
        </div>
        <div className={styles.canvasWrap}>
          <DrawingView drawing={drawing} className={styles.canvas} label="The drawing so far" />
          {game.flagged && (
            <span className={styles.stampSpot}>
              <Stamp>That’s handwriting</Stamp>
            </span>
          )}
          <div className={styles.nudges} aria-live="polite">
            <AnimatePresence>
              {nudges.map((n) => (
                <motion.span
                  key={n.id}
                  className={`${styles.nudge} ${n.kind === 'warmer' ? styles.warm : styles.cold}`}
                  initial={{ x: 40, opacity: 0, scale: 0.6 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                >
                  {people.get(n.playerId) && <Avatar avatar={people.get(n.playerId)!.avatar} size={26} />}
                  {n.kind === 'warmer' ? 'Warmer' : 'Colder'}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <Mask mask={game.mask} revealed={revealing} />
        {!revealing && game.flags > 0 && !game.flagged && (
          <p className={styles.flagMeter}>
            Letters? {game.flags} of {game.flagNeed} flags to void the artist’s points
          </p>
        )}
        {game.flagged && <p className={styles.flagMeter}>The room flagged letters. No artist points this turn.</p>}
      </div>

      <aside className={styles.side}>
        {revealing ? (
          <div className={styles.revealList}>
            <h3 className={styles.sideTitle}>{game.solved.length ? 'Got it' : 'Nobody got it'}</h3>
            {game.solved.map((s, i) => (
              <motion.div key={s.playerId} className={styles.solvedRow} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
                <span>{nameOf(people, s.playerId)}</span>
                <strong>+{s.points}</strong>
              </motion.div>
            ))}
            {drawer && (game.drawerPoints > 0 || game.flagged) && (
              <div className={styles.solvedRow}>
                <span>{drawer.name} (artist)</span>
                <strong>{game.flagged ? 'void' : `+${game.drawerPoints}`}</strong>
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

function Feed({ view, game }: { view: RoomView; game: SketchView }) {
  const people = usePeople(view);
  return (
    <div className={styles.feed} aria-live="polite">
      <h3 className={styles.sideTitle}>Guesses</h3>
      {game.feed.length === 0 && <p className={styles.feedEmpty}>Nothing yet. Bold of everyone.</p>}
      <AnimatePresence initial={false}>
        {game.feed.map((f) => {
          const p = people.get(f.playerId);
          return (
            <motion.div
              key={f.kind === 'correct' ? `c-${f.playerId}` : `g-${f.text.toLowerCase()}`}
              layout
              className={`${styles.feedItem} ${f.kind === 'correct' ? styles.correct : ''}`}
              initial={{ scale: 0.6, opacity: 0, x: 30 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            >
              {p && <Avatar avatar={p.avatar} size={28} />}
              <span className={styles.feedName}>{p?.name ?? 'Someone'}</span>
              <span className={styles.feedText}>{f.kind === 'correct' ? 'got it' : f.text}</span>
              {f.count > 1 && (
                <motion.span key={f.count} className={styles.feedCount} initial={{ scale: 1.6 }} animate={{ scale: 1 }}>
                  ×{f.count}
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/** Before the podium: everything drawn tonight, with its word and its artist. */
function Gallery({ view, game }: { view: RoomView; game: SketchView }) {
  const people = usePeople(view);
  const n = game.gallery.length;
  const cols = n <= 4 ? n : n <= 8 ? 4 : 5;
  return (
    <div className={styles.gallery}>
      <h2 className={styles.galleryTitle}>Tonight’s gallery</h2>
      <p className={styles.gallerySub}>Curated with the care of a hospital lobby.</p>
      <div className={styles.galleryGrid} style={{ '--cols': cols, '--tile': n <= 4 ? '290px' : n <= 8 ? '250px' : '220px' } as React.CSSProperties}>
        {game.gallery.map((g, i) => (
          <motion.div
            key={g.drawingId}
            initial={{ y: 40, opacity: 0, rotate: i % 2 ? 3 : -3 }}
            animate={{ y: 0, opacity: 1, rotate: i % 2 ? 1.2 : -1.2 }}
            transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 300, damping: 20 }}
          >
            <GalleryTile item={g} artist={nameOf(people, g.drawer)} className={styles.frame} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function useSketchSounds(game: SketchView, view: RoomView) {
  const solved = useRef(0);
  useEffect(() => {
    if (game.solved.length > solved.current) play('correct');
    solved.current = game.solved.length;
  }, [game.solved.length]);
  useEffect(() => {
    if (game.phase.name === 'reveal') {
      play(game.solved.length ? 'reveal' : 'lose');
      // The whole room read the drawing: the artist earned a hand.
      if (game.solved.length && game.solved.length >= view.people.filter((p) => p.inGame).length - 1) play('applause');
    }
    if (game.phase.name === 'draw' || game.phase.name === 'gallery') play('whoosh');
  }, [game.phase.name, game.turn]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (game.flagged) play('lose');
  }, [game.flagged]);
}
