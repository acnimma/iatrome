'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { play } from '@/lib/sound';
import type { Phase, RoomView, SurviveView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { AnswerCard, Choice, PhoneMessage, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar } from '@/components/room/RoomBits';
import { StatButton } from '@/components/room/Stat';
import { TimerRing } from '@/components/ui/TimerRing';
import { haptic } from '@/lib/haptics';
import { ANSWER_TONES, AnswerLetter, LETTERS } from '@/components/room/answers';
import { Cups } from './Cups';
import styles from './Survive.module.css';

/** Past this, a question is set in the body font so all four options stay on an iPhone screen. */
const LONG_QUESTION = 90;
/** Options this short fit two to a row. */
const SHORT_OPTION = 18;
const LONG_OPTION = 42;

export function SurviveController({ view, game }: { view: RoomView; game: SurviveView }) {
  const room = useRoom();
  const me = view.you?.id ?? '';
  const playing = me in game.coffees;
  const out = me in game.clockedOut;
  const leading = game.handicap.includes(me);
  // Your own answer, as it lands.
  const revealing = game.phase.name === 'reveal';
  useEffect(() => {
    if (!revealing || game.myAnswer === null) return;
    const t = setTimeout(() => play(game.myAnswer === game.answer ? 'ding' : 'wrong'), 450);
    return () => clearTimeout(t);
  }, [revealing, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  if (game.phase.name === 'intro')
    return (
      <PhoneMessage icon="coffee" title="Survive the Shift">
        Two coffees. Don’t run out. Staying on shift pays.
      </PhoneMessage>
    );

  if (game.phase.name === 'chase')
    return (
      <PhoneMessage icon="hourglass" title="Sign-out">
        {!playing
          ? 'The final chase. Ghosts are back to full points.'
          : out
            ? `Last ${game.chaseLength} questions, ×${game.chaseFactors.join(', ×')}. Ghosts score full points now. You are very much still in this.`
            : `Last ${game.chaseLength} questions, ×${game.chaseFactors.join(', ×')}. The ghosts are back to full pay. The leader loses the speed bonus.`}
      </PhoneMessage>
    );

  if (game.phase.name === 'question') {
    if (!playing && view.screen) return <PhoneMessage icon="popcorn" title="Watch the big screen" />;
    const label = !playing
      ? `Question ${game.number}`
      : game.chase
        ? `Sign-out · ×${game.multiplier}${out ? ' · ghosts at full pay' : ''}`
        : out
          ? `Ghost · ${game.ghostStreak[me] ?? 0} of 2 to get back on`
          : `Question ${game.number} of ${game.total}`;
    return (
      <PhoneStack>
        <QuestionCard label={label} question={game.question ?? ''} phase={game.phase} pausedAt={view.pausedAt} />
        {playing && (
          <div className={styles.tags}>
            {out ? (
              <span className={styles.tag}>{game.chase ? 'Ghost · full points now' : 'Clocked out · half points'}</span>
            ) : (
              <span className={styles.tag}>
                {game.coffees[me]} {game.coffees[me] === 1 ? 'coffee' : 'coffees'} left
              </span>
            )}
            {leading && (
              <span className={styles.tag} data-tone="rose">
                You lead: no speed bonus
              </span>
            )}
          </div>
        )}
        {playing && <StatButton view={view} />}
        <Options
          options={game.options}
          picked={playing ? game.myAnswer : null}
          disabled={!playing}
          onPick={(i) => {
            if (game.myAnswer !== null) return;
            haptic('success');
            room.command({ type: 'pick-option', option: i });
          }}
        />
      </PhoneStack>
    );
  }

  // Reveal
  const right = game.myAnswer !== null && game.myAnswer === game.answer;
  const lostCoffee = game.last?.lostCoffee.includes(me);
  const justOut = game.last?.clockedOut.includes(me);
  const backIn = game.last?.revived.includes(me);
  const points = game.last?.points[me] ?? 0;
  const pay = game.last?.pay[me] ?? 0;
  const earned = (
    <div className={styles.points}>
      {points > 0 && <span>+{points} answer</span>}
      {pay > 0 && <span>+{pay} shift pay</span>}
    </div>
  );
  return (
    <PhoneStack>
      {!playing ? (
        <PhoneMessage icon="clipboard" title={`Answer: ${LETTERS[game.answer ?? 0]}`} />
      ) : backIn ? (
        <PhoneMessage icon="coffee" title="Back on shift">
          Someone found you a coffee. Try to keep this one.
          {earned}
        </PhoneMessage>
      ) : justOut ? (
        <Result title="Off shift" cups={<Cups left={0} spilling size={64} delay={400} />}>
          Out of coffee. Keep answering as a ghost: two right in a row and you’re back on.
        </Result>
      ) : lostCoffee ? (
        <Result title="Lost a coffee" cups={<Cups left={game.coffees[me]} spilling size={56} delay={400} />}>
          {game.coffees[me]} left. Make it last.
          {earned}
        </Result>
      ) : right ? (
        <PhoneMessage icon="target" title={out ? 'Correct. Spooky.' : 'Correct'}>
          {earned}
        </PhoneMessage>
      ) : (
        <PhoneMessage icon="sweat" title="Missed it">
          {game.last?.mercy ? 'Mercy rule: nobody loses a coffee.' : out ? 'Ghosts don’t lose coffee. Streak reset.' : ''}
          {earned}
        </PhoneMessage>
      )}
      {!view.screen && <AnswerCard letter={LETTERS[game.answer ?? 0]} text={game.options[game.answer ?? 0]} fact={game.fact} />}
      <ReactionBar />
    </PhoneStack>
  );
}

/** The question on a phone: long ones drop to the body font so the options stay above the fold. */
function QuestionCard({ label, question, phase, pausedAt }: { label: string; question: string; phase: Phase; pausedAt: number | null }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardText}>
        <span className={styles.cardLabel}>{label}</span>
        <p className={styles.cardQuestion} data-long={question.length > LONG_QUESTION || undefined}>
          {question}
        </p>
      </div>
      <TimerRing phase={phase} pausedAt={pausedAt} size={48} />
    </div>
  );
}

/** Four answers: two by two when they're short, a list (body font if long) when they aren't. */
function Options({ options, picked, disabled, onPick }: { options: string[]; picked: number | null; disabled: boolean; onPick: (i: number) => void }) {
  const longest = Math.max(0, ...options.map((o) => o.length));
  const grid = longest <= SHORT_OPTION;
  return (
    <div className={styles.phoneOptions} data-grid={grid || undefined}>
      {options.map((option, i) => (
        <Choice key={i} tone={ANSWER_TONES[i]} picked={picked === i} dimmed={picked !== null && picked !== i} disabled={disabled} onClick={() => onPick(i)}>
          <AnswerLetter index={i} />
          <span className={longest > LONG_OPTION ? styles.longOption : undefined}>{option}</span>
        </Choice>
      ))}
    </div>
  );
}

function Result({ title, cups, children }: { title: string; cups: React.ReactNode; children?: React.ReactNode }) {
  return (
    <motion.div className={styles.result} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }}>
      {cups}
      <h2 className={styles.resultTitle}>{title}</h2>
      {children && <div className={styles.resultText}>{children}</div>}
    </motion.div>
  );
}
