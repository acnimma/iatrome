'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import type { RoomView, SurviveView } from '@iatrome/game/client';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { IntroCard, Pill, Stamp, nameOf, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import styles from './Survive.module.css';
import { Icon } from '@/components/icons/Icon';
import { ANSWER_TONES, AnswerLetter, LETTERS } from '@/components/room/answers';
import { jelly } from '@/components/ui/jelly';
import { REVEAL_BEAT, useAfter } from '@/components/ui/Later';
import { Cups } from './Cups';

/** The clock-out scene starts once the answer has landed and stays up this long. */
const OUT_AT = REVEAL_BEAT + 900;
const OUT_FOR = 3_400;

export function SurviveStage({ view, game }: { view: RoomView; game: SurviveView }) {
  const people = usePeople(view);
  const revealed = game.phase.name === 'reveal';
  // The room's split lands first; the right answer a beat later.
  const answerShown = useAfter(revealed ? REVEAL_BEAT : 0, `${game.number}-${revealed}`);
  useEffect(() => {
    if (revealed) play(game.last?.clockedOut.length ? 'lose' : 'reveal');
  }, [game.phase.name, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  if (game.phase.name === 'intro')
    return (
      <IntroCard
        eyebrow="Up next"
        title="Survive the Shift"
        body="Two coffees each. A wrong answer costs one. Staying on shift pays. Run out and you clock out, then haunt the place for points."
      />
    );

  if (game.phase.name === 'chase') return <ChaseCard view={view} game={game} />;

  return (
    <div className={styles.stage}>
      <div className={styles.top}>
        <Pill>
          Question {game.number} of {game.total}
        </Pill>
        {game.chase && (
          <span className={styles.chasePills}>
            <Pill tone="gold">
              Sign-out · ×{game.multiplier}
            </Pill>
            {game.handicap.length > 0 && <Pill tone="rose">{game.handicap.map((id) => nameOf(people, id)).join(' & ')}: no speed bonus</Pill>}
          </span>
        )}
        {game.phase.name === 'question' ? <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={72} ticks /> : <span className={styles.timerSpace} />}
      </div>
      <motion.h2 key={game.number} className={styles.question} data-long={(game.question?.length ?? 0) > 140 || undefined} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {game.question}
      </motion.h2>
      <div className={styles.options}>
        {game.options.map((option, i) => {
          const right = answerShown && game.answer === i;
          const wrong = answerShown && game.answer !== i;
          return (
            <motion.div
              key={`${game.number}-${i}`}
              className={`${styles.option} ${jelly(ANSWER_TONES[i])} ${right ? styles.right : ''} ${wrong ? styles.wrong : ''}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: revealed ? 0 : 0.3 + i * 0.12, type: 'spring', stiffness: 400, damping: 22 }}
            >
              <AnswerLetter index={i} size="lg" />
              <span className={styles.optionText}>{option}</span>
              {revealed && <span className={styles.tally}>{game.tally[i]}</span>}
            </motion.div>
          );
        })}
        {answerShown && game.last?.mercy && (
          <span className={styles.stampSpot}>
            <Stamp tone="sky">Mercy rule: everyone keeps their coffee</Stamp>
          </span>
        )}
      </div>
      {answerShown && game.fact && (
        <motion.div className={styles.fact} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <span className={styles.factLabel}>Chart note</span>
          {game.fact}
        </motion.div>
      )}
      <Roster view={view} game={game} />
      {revealed && game.last && game.last.clockedOut.length > 0 && <OutScene view={view} game={game} />}
    </div>
  );
}

function Roster({ view, game }: { view: RoomView; game: SurviveView }) {
  const people = usePeople(view);
  const answered = new Set(game.answered);
  const last = game.last;
  const lost = new Set(last?.lostCoffee ?? []);
  const ids = Object.keys(game.coffees).filter((id) => people.has(id));
  const size = ids.length > 12 ? 48 : 60;
  return (
    <div className={styles.roster}>
      {ids.map((id) => {
        const p = people.get(id)!;
        const out = id in game.clockedOut;
        const justLost = lost.has(id);
        const gained = (last?.points[id] ?? 0) + (last?.pay[id] ?? 0);
        const streak = game.ghostStreak[id] ?? 0;
        return (
          <motion.div
            key={id}
            className={`${styles.person} ${out ? styles.out : ''} ${justLost ? styles.hit : ''}`}
            animate={justLost ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }}
            transition={{ duration: 0.6, delay: justLost ? REVEAL_BEAT / 1000 : 0 }}
          >
            <span className={styles.avatarSpot}>
              <Avatar avatar={p.avatar} size={size} badge={game.phase.name === 'question' && answered.has(id) ? <Icon name="check" size={16} /> : undefined} />
              {out && (
                <span className={styles.ghostMark} aria-hidden>
                  <Icon name="ghost" size={26} />
                </span>
              )}
              <AnimatePresence>
                {game.phase.name === 'reveal' && gained > 0 && (
                  <motion.span
                    className={styles.gain}
                    initial={{ y: 6, opacity: 0, scale: 0.6 }}
                    animate={{ y: -4, opacity: 1, scale: 1 }}
                    transition={{ delay: REVEAL_BEAT / 1000 + 0.2, type: 'spring', stiffness: 420, damping: 16 }}
                  >
                    +{gained}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className={styles.name}>{p.name}</span>
            <span className={styles.score}>{(game.scores[id] ?? 0).toLocaleString()}</span>
            <span className={styles.coffees} aria-label={out ? 'clocked out' : `${game.coffees[id]} coffees left`}>
              {out ? (
                <span className={styles.streak} title="Two right in a row gets back on shift">
                  <i data-on={streak >= 1 || undefined} />
                  <i data-on={streak >= 2 || undefined} />
                </span>
              ) : (
                <Cups left={game.coffees[id]} spilling={justLost && game.phase.name === 'reveal'} delay={REVEAL_BEAT} size={24} />
              )}
            </span>
            {last?.revived.includes(id) && <span className={styles.backTag}>Back on shift</span>}
          </motion.div>
        );
      })}
    </div>
  );
}

/** Someone clocked out: the stage gives them a moment. */
function OutScene({ view, game }: { view: RoomView; game: SurviveView }) {
  const people = usePeople(view);
  const key = `${game.number}-out`;
  const started = useAfter(OUT_AT, key);
  const ended = useAfter(OUT_AT + OUT_FOR, key);
  const ids = (game.last?.clockedOut ?? []).filter((id) => people.has(id)).slice(0, 3);
  const big = ids.length === 1 ? 200 : ids.length === 2 ? 160 : 128;
  return (
    <AnimatePresence>
      {started && !ended && (
        <motion.div className={styles.outScene} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className={styles.outPeople}>
            {ids.map((id, i) => {
              const p = people.get(id)!;
              return (
                <motion.div
                  key={id}
                  className={styles.outPerson}
                  initial={{ y: 60, scale: 0.7, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 18 }}
                >
                  <span className={styles.outAvatar}>
                    <motion.span initial={{ filter: 'grayscale(0)' }} animate={{ filter: 'grayscale(1)' }} transition={{ delay: 1.1 + i * 0.15, duration: 0.6 }}>
                      <Avatar avatar={p.avatar} size={big} />
                    </motion.span>
                    <span className={styles.outCup}>
                      <Cups left={0} spilling size={Math.round(big * 0.42)} delay={300 + i * 150} />
                    </span>
                    <motion.span className={styles.outStamp} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + i * 0.15 }}>
                      <Stamp tone="ink">Off shift</Stamp>
                    </motion.span>
                  </span>
                  <span className={styles.outName}>{p.name}</span>
                </motion.div>
              );
            })}
          </div>
          <motion.p className={styles.outNote} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
            Out of coffee on question {game.number}. Still playing as a ghost: two right in a row and they’re back on.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Sign-out: the final chase gets its own card. */
function ChaseCard({ view, game }: { view: RoomView; game: SurviveView }) {
  const people = usePeople(view);
  const ids = Object.keys(game.scores).filter((id) => people.has(id));
  const top = Math.max(0, ...ids.map((id) => game.scores[id] ?? 0));
  const leaders = top > 0 ? ids.filter((id) => game.scores[id] === top) : [];
  const ghosts = ids.filter((id) => id in game.clockedOut);
  return (
    <div className={styles.chase}>
      <IntroCard
        eyebrow="Final chase"
        title="Sign-out"
        body={`The last ${game.chaseLength} questions. Everyone plays for full points, ghosts included. The leader loses the speed bonus.`}
      />
      <div className={styles.chaseFactors}>
        {game.chaseFactors.map((f, i) => (
          <motion.span
            key={i}
            className={`${styles.factor} ${jelly(i === game.chaseFactors.length - 1 ? 'gold' : 'black')}`}
            initial={{ scale: 0, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.6 + i * 0.25, type: 'spring', stiffness: 420, damping: 12 }}
          >
            ×{f}
          </motion.span>
        ))}
      </div>
      <motion.div className={styles.chaseCast} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.4 }}>
        {leaders.length > 0 && (
          <span className={styles.castGroup}>
            <span className={styles.castLabel}>Leading, no speed bonus</span>
            <span className={styles.castFaces}>
              {leaders.map((id) => (
                <Avatar key={id} avatar={people.get(id)!.avatar} size={56} name={people.get(id)!.name} />
              ))}
            </span>
          </span>
        )}
        {ghosts.length > 0 && (
          <span className={styles.castGroup}>
            <span className={styles.castLabel}>Ghosts, back to full pay</span>
            <span className={styles.castFaces}>
              {ghosts.slice(0, 8).map((id) => (
                <Avatar key={id} avatar={people.get(id)!.avatar} size={56} name={people.get(id)!.name} />
              ))}
            </span>
          </span>
        )}
      </motion.div>
    </div>
  );
}
