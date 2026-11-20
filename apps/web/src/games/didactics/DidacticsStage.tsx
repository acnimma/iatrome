'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import type { DidacticsView, RoomView } from '@iatrome/game/client';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { CountUp, IntroCard, Pill, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { LETTERS, teamTone } from './teams';
import styles from './Didactics.module.css';

export function DidacticsStage({ view, game }: { view: RoomView; game: DidacticsView }) {
  const phase = game.phase.name;
  useEffect(() => {
    if (phase === 'question' && game.question) speak(`${game.question} ${game.options.map((o, i) => `${LETTERS[i]}: ${o}.`).join(' ')}`);
    if (phase === 'reveal') play('reveal');
    if (phase === 'teams' || phase === 'standings') play('whoosh');
  }, [phase, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro')
    return <IntroCard eyebrow="Up next" title="Didactics Mode" body="Random teams. Everyone answers on their phone. Your team scores when you get it right." />;
  if (phase === 'teams') return <Teams view={view} game={game} />;
  if (phase === 'standings') return <Standings game={game} />;
  return <Question view={view} game={game} />;
}

function Teams({ view, game }: { view: RoomView; game: DidacticsView }) {
  const people = usePeople(view);
  return (
    <div className={styles.stage}>
      <h2 className={styles.heading}>Meet your teams</h2>
      <div className={styles.teams} style={{ '--cols': game.teams.length } as React.CSSProperties}>
        {game.teams.map((team, i) => (
          <motion.section
            key={team.id}
            className={styles.team}
            style={{ '--tone': teamTone(team.color) } as React.CSSProperties}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.25, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <h3 className={styles.teamName}>{team.name}</h3>
            <ul className={styles.members}>
              {team.members.map((id, j) => {
                const p = people.get(id);
                return p ? (
                  <motion.li key={id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.25 + j * 0.05, type: 'spring', stiffness: 500, damping: 16 }}>
                    <Avatar avatar={p.avatar} size={36} />
                    <span>{p.name}</span>
                  </motion.li>
                ) : null;
              })}
            </ul>
          </motion.section>
        ))}
      </div>
    </div>
  );
}

function Question({ view, game }: { view: RoomView; game: DidacticsView }) {
  const revealed = game.phase.name === 'reveal';
  const answered = new Set(game.answered);
  return (
    <div className={styles.stage}>
      <div className={styles.top}>
        <Pill>
          Question {game.number} of {game.total}
        </Pill>
        {game.lightning && <Pill tone="gold">Lightning round · double points</Pill>}
        <span className={styles.timer}>{!revealed && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={84} ticks />}</span>
      </div>
      <motion.h2 key={game.number} className={styles.question} data-long={(game.question?.length ?? 0) > 140 || undefined} initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        {game.question}
      </motion.h2>
      <div className={styles.options}>
        {game.options.map((option, i) => {
          const right = revealed && game.answer === i;
          return (
            <motion.div
              key={`${game.number}-${i}`}
              className={`${styles.option} ${right ? styles.right : ''} ${revealed && !right ? styles.wrong : ''}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: right ? 1.04 : 1, opacity: 1 }}
              transition={{ delay: revealed ? 0 : 0.25 + i * 0.1, type: 'spring', stiffness: 380, damping: 22 }}
            >
              <span className={styles.letter}>{LETTERS[i]}</span>
              <span className={styles.optionText}>{option}</span>
              {revealed && <span className={styles.tally}>{game.tally[i]}</span>}
            </motion.div>
          );
        })}
      </div>
      {revealed && game.fact && (
        <motion.p className={styles.fact} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          {game.fact}
        </motion.p>
      )}
      <div className={styles.teamStrip}>
        {game.teams.map((team) => {
          const r = game.last?.perTeam[team.id];
          const done = team.members.filter((id) => answered.has(id)).length;
          return (
            <div key={team.id} className={styles.teamChip} style={{ '--tone': teamTone(team.color) } as React.CSSProperties}>
              <span className={styles.chipName}>{team.name}</span>
              {revealed && r ? (
                <motion.span className={styles.chipResult} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.3 }}>
                  {r.right} of {r.of} right · +{r.points}
                </motion.span>
              ) : (
                <span className={styles.chipProgress}>
                  {done}/{team.members.length} answered
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Standings({ game }: { game: DidacticsView }) {
  const ranked = game.teams.slice().sort((a, b) => b.score - a.score);
  const top = Math.max(1, ranked[0]?.score ?? 1);
  return (
    <div className={styles.stage}>
      <h2 className={styles.heading}>The scores so far</h2>
      <ol className={styles.standings}>
        {ranked.map((team, i) => (
          <motion.li
            key={team.id}
            layout
            className={styles.standing}
            style={{ '--tone': teamTone(team.color) } as React.CSSProperties}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.12, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <span className={styles.rank}>{i + 1}</span>
            <span className={styles.standingName}>{team.name}</span>
            <span className={styles.bar}>
              <motion.span initial={{ width: 0 }} animate={{ width: `${(team.score / top) * 100}%` }} transition={{ delay: 0.3 + i * 0.12, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            </span>
            <CountUp className={styles.score} value={team.score} />
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
