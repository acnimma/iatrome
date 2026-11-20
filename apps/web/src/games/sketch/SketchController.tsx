'use client';

import { motion } from 'motion/react';
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
          Draw when it’s your turn. Otherwise, guess fast.
        </PhoneMessage>
      );
    case 'choose':
      return drawing ? (
        <PhoneStack>
          <div className={styles.phoneHead}>
            <h2 className={styles.phoneTitle}>Pick something to draw</h2>
            <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={52} />
          </div>
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
          Get ready to guess.
        </PhoneMessage>
      );
    case 'draw':
      return drawing ? <Drawer view={view} game={game} /> : <Guesser view={view} game={game} />;
    case 'reveal': {
      const mine = game.solved.find((s) => s.playerId === me);
      return (
        <PhoneStack>
          <PhoneMessage icon={mine ? 'target' : drawing ? 'palette' : 'melt'} title={`It was “${game.term}”`}>
            {mine ? `+${mine.points} points` : drawing ? `+${game.drawerPoints} for your art` : 'You’ll get the next one.'}
          </PhoneMessage>
          {!view.screen && game.solved.length > 0 && (
            <p className={styles.solvedCount}>Got it: {game.solved.map((s) => nameOf(people, s.playerId)).join(', ')}</p>
          )}
          <ReactionBar />
        </PhoneStack>
      );
    }
    default:
      return null;
  }
}

function Drawer({ view, game }: { view: RoomView; game: SketchView }) {
  const room = useRoom();
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
      <p className={styles.solvedCount}>
        {game.solved.length} guessed it
      </p>
    </div>
  );
}

function Guesser({ view, game }: { view: RoomView; game: SketchView }) {
  const room = useRoom();
  const snap = useSnapshot(room);
  const drawing = useDrawing(game.drawingId);
  const [guess, setGuess] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const playing = view.you?.inGame;

  useEffect(() => {
    const n = snap.feedback?.notice;
    if (n === 'close') {
      setHint('So close!');
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
        <span className={styles.phoneMask}>{game.mask.split('').join(' ')}</span>
        <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={52} />
      </div>
      <DrawingView drawing={drawing} label="The drawing" />
      {game.youSolved ? (
        <motion.p className={styles.gotIt} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
          You got it!
        </motion.p>
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
    </div>
  );
}
