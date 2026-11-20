'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { LIMITS, type RoomView, type SketchView } from '@iatrome/game/client';
import { useDrawing, useRoom, useSnapshot } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { TimerRing } from '@/components/ui/TimerRing';
import { DrawPad } from '@/components/drawing/DrawPad';
import { DrawingView } from '@/components/drawing/DrawingView';
import { Choice, PhoneMessage, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, nameOf, usePeople } from '@/components/room/RoomBits';
import { StatButton } from '@/components/room/Stat';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { Mask } from './Mask';
import { useNewNudges } from './nudges';
import styles from './Sketch.module.css';

const DIFFICULTY = ['', 'Easy · ×1', 'Medium · ×1.5', 'Hard · ×2'];

export function SketchController({ view, game }: { view: RoomView; game: SketchView }) {
  const room = useRoom();
  const people = usePeople(view);
  const me = view.you?.id;
  const drawing = me === game.drawer;
  const drawerName = nameOf(people, game.drawer);

  switch (game.phase.name) {
    case 'intro':
      return (
        <PhoneMessage icon="pencil" title="Sketch">
          {game.laps > 1 ? 'Everyone draws twice. ' : ''}Draw when it’s your turn. Otherwise, guess fast. No letters.
        </PhoneMessage>
      );
    case 'choose':
      return drawing ? (
        <PhoneStack>
          <div className={styles.phoneHead}>
            <h2 className={styles.phoneTitle}>Pick something to draw</h2>
            <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={52} />
          </div>
          {game.multiplier > 1 && <p className={styles.stretch}>Final stretch: everything pays double</p>}
          <StatButton view={view} label="Call your Stat on your turn ×2" />
          {game.choices.map((c, i) => (
            <Choice key={c.answer} tone={(['sky', 'gold', 'rose'] as const)[i]} onClick={() => room.command({ type: 'choose', index: i })}>
              <span className={styles.choiceText}>
                <strong>{c.answer}</strong>
                <span>{DIFFICULTY[c.difficulty]}</span>
              </span>
            </Choice>
          ))}
        </PhoneStack>
      ) : (
        <PhoneMessage icon="thinking" title={`${drawerName} is choosing…`}>
          Get ready to guess.{game.laps > 1 ? ` Lap ${game.lap} of ${game.laps}.` : ''}
        </PhoneMessage>
      );
    case 'draw':
      return drawing ? <Drawer view={view} game={game} /> : <Guesser view={view} game={game} />;
    case 'reveal': {
      const mine = game.solved.find((s) => s.playerId === me);
      return (
        <PhoneStack>
          <PhoneMessage icon={mine ? 'target' : drawing ? 'palette' : 'melt'} title={`It was “${game.term}”`}>
            {mine
              ? `+${mine.points} points`
              : drawing
                ? game.flagged
                  ? 'The room flagged letters. No artist points.'
                  : `+${game.drawerPoints} for your art`
                : 'You’ll get the next one.'}
          </PhoneMessage>
          {!view.screen && game.flagged && !drawing && <p className={styles.solvedCount}>Flagged for letters. The artist gets nothing.</p>}
          {!view.screen && game.solved.length > 0 && (
            <p className={styles.solvedCount}>Got it: {game.solved.map((s) => nameOf(people, s.playerId)).join(', ')}</p>
          )}
          <ReactionBar />
        </PhoneStack>
      );
    }
    case 'gallery':
      return view.screen ? (
        <PhoneStack>
          <PhoneMessage icon="palette" title="The gallery">
            Everything drawn tonight is on the big screen. Admission is free. So was the training.
          </PhoneMessage>
          <ReactionBar />
        </PhoneStack>
      ) : (
        <PhoneStack>
          <h2 className={styles.phoneTitle}>The gallery</h2>
          <div className={styles.phoneGallery}>
            {game.gallery.map((g) => (
              <GalleryTile key={g.drawingId} item={g} artist={nameOf(people, g.drawer)} />
            ))}
          </div>
        </PhoneStack>
      );
    default:
      return null;
  }
}

export function GalleryTile({ item, artist, className }: { item: SketchView['gallery'][number]; artist: string; className?: string }) {
  const drawing = useDrawing(item.drawingId);
  return (
    <figure className={`${styles.tile} ${className ?? ''}`}>
      <DrawingView drawing={drawing} label={`${artist}’s drawing of ${item.term}`} />
      <figcaption>
        <strong>{item.term}</strong>
        <span>
          {artist}
          {item.flagged ? ' · flagged' : item.share === 0 ? ' · nobody got it' : ''}
        </span>
      </figcaption>
    </figure>
  );
}

/** The artist's phone: the word, the pad, and what the room is guessing (small, under the pad). */
function Drawer({ view, game }: { view: RoomView; game: SketchView }) {
  const room = useRoom();
  const people = usePeople(view);
  const guesses = game.feed.filter((f) => f.kind === 'guess').slice(-8).reverse();
  return (
    <div className={styles.phoneDraw}>
      <div className={styles.phoneHead}>
        <div>
          <span className={styles.label}>Draw this. No letters!</span>
          <h2 className={styles.term}>{game.term}</h2>
        </div>
        <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={52} />
      </div>
      <DrawPad onOp={(op) => room.command({ type: 'draw', op })} />
      <div className={styles.ticker} aria-label="What they’re guessing" aria-live="polite">
        {guesses.length === 0 ? (
          <span className={styles.tickerEmpty}>Their guesses show up here.</span>
        ) : (
          <AnimatePresence initial={false}>
            {guesses.map((f) => (
              <motion.span
                key={f.text.toLowerCase()}
                layout
                className={`${styles.tick} ${f.close ? styles.tickClose : ''}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                title={nameOf(people, f.playerId)}
              >
                {f.text}
                {f.count > 1 && <b>×{f.count}</b>}
                {f.close && <em>close</em>}
              </motion.span>
            ))}
          </AnimatePresence>
        )}
      </div>
      <p className={styles.solvedCount}>
        {game.flagged
          ? 'The room flagged letters. No artist points this turn.'
          : `${game.solved.length} guessed it${game.flags ? ` · ${game.flags} think you’re writing letters` : ''}`}
      </p>
    </div>
  );
}

function Guesser({ view, game }: { view: RoomView; game: SketchView }) {
  const room = useRoom();
  const snap = useSnapshot(room);
  const people = usePeople(view);
  const drawing = useDrawing(game.drawingId);
  const [guess, setGuess] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const playing = view.you?.inGame;
  const nudge = useNewNudges(game.nudges, view.you?.id).at(-1);

  useEffect(() => {
    const n = snap.feedback?.notice;
    if (n === 'close') {
      setHint('So close. Check your spelling.');
      haptic('tap');
    }
    if (n === 'correct') {
      haptic('success');
      play('correct');
    }
    const t = setTimeout(() => setHint(null), 1800);
    return () => clearTimeout(t);
  }, [snap.feedback]);

  return (
    <div className={styles.phoneDraw}>
      <div className={styles.phoneHead}>
        <Mask mask={game.mask} size="phone" />
        <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={52} />
      </div>
      <div className={styles.phoneCanvas}>
        <DrawingView drawing={drawing} label="The drawing" />
        {game.flagged && <span className={styles.phoneStamp}>Handwriting</span>}
        <AnimatePresence>
          {nudge && (
            <motion.span
              key={nudge.id}
              className={`${styles.phoneNudge} ${nudge.kind === 'warmer' ? styles.warm : styles.cold}`}
              initial={{ y: 12, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {nameOf(people, nudge.playerId)}: {nudge.kind}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {game.youSolved ? (
        <>
          <motion.p className={styles.gotIt} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
            You got it! Now heckle.
          </motion.p>
          <div className={styles.nudgeRow}>
            <Button tone="rose" onClick={() => room.command({ type: 'vote', side: 0 })}>
              Warmer
            </Button>
            <Button tone="sky" onClick={() => room.command({ type: 'vote', side: 1 })}>
              Colder
            </Button>
          </div>
          <ReactionBar />
        </>
      ) : playing ? (
        <>
          <StatButton view={view} />
          <form
            className={styles.guessForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (!guess.trim()) return;
              room.command({ type: 'guess', text: guess });
              setGuess('');
              input.current?.focus();
            }}
          >
            <TextInput ref={input} value={guess} onChange={(e) => setGuess(e.target.value)} maxLength={LIMITS.guess} placeholder="Your guess…" enterKeyHint="send" autoCapitalize="none" />
            <Button size="lg" type="submit">
              Guess
            </Button>
          </form>
        </>
      ) : (
        <p className={styles.solvedCount}>You’re watching. Guesses are for players.</p>
      )}
      {hint && <p className={styles.close}>{hint}</p>}
      {playing && !game.flagged && (
        <Button tone="pearl" size="sm" className={styles.flag} aria-pressed={game.youFlagged} onClick={() => room.command({ type: 'volunteer' })}>
          {game.youFlagged ? `Flagged for letters (${game.flags} of ${game.flagNeed}) · undo` : 'They’re writing letters'}
        </Button>
      )}
    </div>
  );
}
