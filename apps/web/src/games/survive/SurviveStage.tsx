'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import type { RoomView, SurviveView } from '@iatrome/game/client';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { IntroCard, Pill, Stamp, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import { speak } from '@/lib/speech';
import styles from './Survive.module.css';

export const LETTERS = ['A', 'B', 'C', 'D'];
export const OPTION_TONES = ['blue', 'rose', 'gold', 'sky'] as const;

export function SurviveStage({ view, game }: { view: RoomView; game: SurviveView }) {
  const revealed = game.phase.name === 'reveal';
  useEffect(() => {
    if (game.phase.name === 'question' && game.question) speak(`${game.question} ${game.options.map((o, i) => `${LETTERS[i]}: ${o}.`).join(' ')}`);
    if (revealed) play(game.last?.clockedOut.length ? 'lose' : 'reveal');
  }, [game.phase.name, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  if (game.phase.name === 'intro')
    return <IntroCard eyebrow="Up next" title="Survive the Shift" body="Everyone starts with two coffees. Wrong answers cost one. Run out and you clock out." />;

  return (
    <div className={styles.stage}>
      <div className={styles.top}>
        <Pill>
          Question {game.number} of {game.total}
        </Pill>
        {game.phase.name === 'question' && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={72} ticks />}
      </div>
      <motion.h2 key={game.number} className={styles.question} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {game.question}
      </motion.h2>
      <div className={styles.options}>
        {game.options.map((option, i) => {
          const right = revealed && game.answer === i;
          const wrong = revealed && game.answer !== i;
          return (
            <motion.div
              key={`${game.number}-${i}`}
              className={`${styles.option} ${styles[OPTION_TONES[i]]} ${right ? styles.right : ''} ${wrong ? styles.wrong : ''}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: right ? 1.05 : 1, opacity: 1 }}
              transition={{ delay: revealed ? 0 : 0.3 + i * 0.12, type: 'spring', stiffness: 400, damping: 22 }}
            >
              <span className={styles.letter}>{LETTERS[i]}</span>
              <span className={styles.optionText}>{option}</span>
              {revealed && <span className={styles.tally}>{game.tally[i]}</span>}
            </motion.div>
          );
        })}
      </div>
      {revealed && game.fact && (
        <motion.div className={styles.fact} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
          <span className={styles.factLabel}>Chart note</span>
          {game.fact}
        </motion.div>
      )}
      {revealed && game.last?.mercy && <Stamp tone="sky">Mercy rule — everyone keeps their coffee</Stamp>}
      <Roster view={view} game={game} />
    </div>
  );
}

function Roster({ view, game }: { view: RoomView; game: SurviveView }) {
  const people = usePeople(view);
  const answered = new Set(game.answered);
  const lost = new Set(game.last?.lostCoffee ?? []);
  const ids = Object.keys(game.coffees).filter((id) => people.has(id));
  return (
    <div className={styles.roster}>
      {ids.map((id) => {
        const p = people.get(id)!;
        const out = id in game.clockedOut;
        return (
          <motion.div key={id} className={`${styles.person} ${out ? styles.out : ''}`} animate={lost.has(id) ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.5 }}>
            <Avatar avatar={p.avatar} size={48} badge={game.phase.name === 'question' && answered.has(id) ? '✓' : undefined} />
            <span className={styles.name}>{p.name}</span>
            <span className={styles.coffees} aria-label={`${game.coffees[id]} coffees left`}>
              {out ? 'clocked out' : '☕'.repeat(Math.max(0, game.coffees[id]))}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
