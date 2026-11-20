'use client';

import { motion } from 'motion/react';
import { type GameResult, type RoomView, gameInfo } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { CountUp, nameOf, usePeople } from '@/components/room/RoomBits';
import styles from './Podium.module.css';

const PLACES = [
  { place: 2, height: '62%', medal: '🥈', tone: 'var(--sky-blue)' },
  { place: 1, height: '86%', medal: '🥇', tone: 'var(--royal-gold)' },
  { place: 3, height: '46%', medal: '🥉', tone: 'var(--rose-kiss)' },
];

/** Final standings: podium, the rest, and the night's highlights. */
export function Podium({ view, result }: { view: RoomView; result: GameResult }) {
  const room = useRoom();
  const people = usePeople(view);
  const byRank = (rank: number) => result.standings.filter((s) => s.rank === rank);
  const rest = result.standings.filter((s) => s.rank > 3);

  return (
    <div className={styles.podium}>
      <Confetti />
      <span className={styles.eyebrow}>{gameInfo[result.game].title} · final results</span>
      <div className={styles.steps}>
        {PLACES.map(({ place, height, medal, tone }, i) => {
          const winners = byRank(place);
          return (
            <div key={place} className={styles.column}>
              <div className={styles.winners}>
                {winners.map((w, j) => (
                  <motion.div
                    key={w.playerId}
                    className={styles.winner}
                    initial={{ y: -80, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + (2 - i) * 0.5 + j * 0.15, type: 'spring', stiffness: 300, damping: 14 }}
                  >
                    <Avatar avatar={w.avatar} size={place === 1 ? 96 : 72} />
                    <span className={styles.name}>{w.name}</span>
                    <CountUp className={styles.score} value={w.score} duration={1400} />
                  </motion.div>
                ))}
              </div>
              <motion.div
                className={styles.step}
                style={{ background: tone }}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className={styles.medal}>{medal}</span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <ol className={styles.rest}>
          {rest.map((s) => (
            <li key={s.playerId}>
              <span>{s.rank}.</span> {s.name} <strong>{s.score.toLocaleString()}</strong>
            </li>
          ))}
        </ol>
      )}

      {result.highlights.length > 0 && (
        <div className={styles.highlights}>
          {result.highlights.map((h, i) => (
            <motion.div
              key={h.title}
              className={styles.highlight}
              initial={{ y: 30, opacity: 0, rotate: i % 2 ? 2 : -2 }}
              animate={{ y: 0, opacity: 1, rotate: i % 2 ? 1 : -1 }}
              transition={{ delay: 2.6 + i * 0.25, type: 'spring', stiffness: 260, damping: 18 }}
            >
              <span className={styles.highlightTitle}>{h.title}</span>
              <span className={styles.highlightWho}>{h.playerId ? nameOf(people, h.playerId) : 'Beep'}</span>
              <span className={styles.highlightDetail}>{h.detail}</span>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div className={styles.actions} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
        <Button tone="rose" size="lg" onClick={() => room.host({ type: 'again' })}>
          Play again
        </Button>
        <Button tone="card" size="lg" onClick={() => room.host({ type: 'lobby' })}>
          Pick another game
        </Button>
      </motion.div>
    </div>
  );
}
