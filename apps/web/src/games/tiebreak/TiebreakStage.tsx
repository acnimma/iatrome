'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import type { RoomView, TiebreakView } from '@iatrome/game/client';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/icons/Icon';
import { TimerRing } from '@/components/ui/TimerRing';
import { IntroCard, Pill, nameOf, usePeople } from '@/components/room/RoomBits';
import { ANSWER_TONES, AnswerLetter } from '@/components/room/answers';
import { jelly } from '@/components/ui/jelly';
import { REVEAL_BEAT, useAfter } from '@/components/ui/Later';
import { play } from '@/lib/sound';
import styles from '../didactics/Didactics.module.css';

/** The secret tie-breaker on the big screen: only the tied players answer, everyone else watches. */
export function TiebreakStage({ view, game }: { view: RoomView; game: TiebreakView }) {
  const people = usePeople(view);
  const phase = game.phase.name;
  const revealed = phase === 'reveal';
  const answerShown = useAfter(revealed ? REVEAL_BEAT : 0, `${game.number}-${revealed}`);
  useEffect(() => {
    if (!revealed) return;
    play('reveal');
    const t = setTimeout(() => play(game.winner ? 'cheer' : 'wrong'), 450);
    return () => clearTimeout(t);
  }, [revealed, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  const names = game.contenders.map((id) => nameOf(people, id)).join(' & ');
  if (phase === 'intro') return <IntroCard eyebrow="It’s a tie!" title="Sudden death" body={`${names}. One trivia question. The fastest right answer takes it.`} badge="TIE" />;

  const answered = new Set(game.answered);
  const lastRound = game.number >= game.total;
  return (
    <div className={styles.stage} data-compact={revealed || undefined}>
      <div className={styles.top}>
        <Pill tone="rose">Sudden death</Pill>
        {game.number > 1 && (
          <Pill>
            Round {game.number} of {game.total}
          </Pill>
        )}
        <span className={styles.timer}>{!revealed && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={84} ticks />}</span>
      </div>
      <motion.h2 key={game.number} className={styles.question} data-long={(game.question?.length ?? 0) > 140 || undefined} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {game.question}
      </motion.h2>
      <div className={styles.options}>
        {game.options.map((option, i) => {
          const right = answerShown && game.answer === i;
          return (
            <motion.div
              key={`${game.number}-${i}`}
              className={`${styles.option} ${jelly(ANSWER_TONES[i])} ${right ? styles.right : ''} ${answerShown && !right ? styles.wrong : ''}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: revealed ? 0 : 0.25 + i * 0.1, type: 'spring', stiffness: 380, damping: 22 }}
            >
              <AnswerLetter index={i} size="lg" />
              <span className={styles.optionText}>{option}</span>
            </motion.div>
          );
        })}
      </div>
      {answerShown && (
        <motion.div className={styles.afterword} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className={styles.callout}>
            {game.winner ? `${nameOf(people, game.winner)} takes it!` : lastRound ? 'Nobody got it. The tie stands.' : 'Nobody got it. Another question.'}
          </p>
          {game.fact && <p className={styles.fact}>{game.fact}</p>}
        </motion.div>
      )}
      <div className={styles.teamStrip}>
        {game.contenders.map((id) => {
          const p = people.get(id);
          return (
            <div key={id} className={styles.teamChip} style={{ '--tone': 'var(--card)' } as React.CSSProperties}>
              {p && <Avatar avatar={p.avatar} size={36} badge={!revealed && answered.has(id) ? <Icon name="check" size={16} /> : undefined} />}
              <span className={styles.chipName}>{nameOf(people, id)}</span>
              <span className={styles.chipProgress}>{revealed ? (game.right.includes(id) ? `Right${game.right[0] === id ? ' · first' : ''}` : 'Wrong') : answered.has(id) ? 'Locked in' : 'Thinking…'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
