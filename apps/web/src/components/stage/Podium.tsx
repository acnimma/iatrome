'use client';

import { motion } from 'motion/react';
import { type GameResult, REVEAL, type RoomView, gameInfo } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { Later } from '@/components/ui/Later';
import { CountUp, nameOf, usePeople } from '@/components/room/RoomBits';
import { teamTone } from '@/games/didactics/teams';
import { StatHolders } from '@/components/room/Stat';
import styles from './Podium.module.css';
import { Icon } from '@/components/icons/Icon';

/** Left to right 2nd, 1st, 3rd, revealed 3rd, then 2nd, then 1st (when Beep calls the winner). */
const PLACES = [
  { place: 2, height: '62%', medal: 'medal', tone: 'var(--sky-blue)', at: 1.8 },
  { place: 1, height: '86%', medal: 'trophy', tone: 'var(--royal-gold)', at: REVEAL.podium / 1000 - 0.2 },
  { place: 3, height: '46%', medal: 'medal', tone: 'var(--rose-kiss)', at: 0.8 },
];

/** Final standings: podium, the rest, and the night's highlights. */
export function Podium({ view, result }: { view: RoomView; result: GameResult }) {
  const room = useRoom();
  const people = usePeople(view);
  if (result.teams) return <TeamPodium view={view} result={result} />;
  const byRank = (rank: number) => result.standings.filter((s) => s.rank === rank);
  const rest = result.standings.filter((s) => s.rank > 3);

  return (
    <div className={styles.podium}>
      <Later ms={REVEAL.podium}>
        <Confetti />
      </Later>
      <span className={styles.eyebrow}>{gameInfo[result.game].title} · final results</span>
      <div className={styles.steps}>
        {PLACES.map(({ place, height, medal, tone, at }, i) => {
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
                    transition={{ delay: at + j * 0.15, type: 'spring', stiffness: 300, damping: 14 }}
                  >
                    <Avatar avatar={w.avatar} size={place === 1 ? 96 : 72} />
                    <span className={styles.name}>{w.name}</span>
                    {w.note ? <span className={styles.score}>{w.note}</span> : <CountUp className={styles.score} value={w.score} duration={1400} />}
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
                <span className={styles.medal}>
                  <Icon name={medal as 'medal' | 'trophy'} size={56} />
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <ol className={styles.rest}>
          {rest.map((s) => (
            <li key={s.playerId}>
              <span>{s.rank}.</span> {s.name} <strong>{s.note ?? s.score.toLocaleString()}</strong>
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
              transition={{ delay: 4.2 + i * 0.25, type: 'spring', stiffness: 260, damping: 18 }}
            >
              <span className={styles.highlightTitle}>{h.title}</span>
              <span className={styles.highlightWho}>{h.playerId ? nameOf(people, h.playerId) : 'Beep'}</span>
              <span className={styles.highlightDetail}>{h.detail}</span>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.8 }}>
        <StatHolders view={view} />
      </motion.div>

      <motion.div className={styles.actions} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5 }}>
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

/** Team games: the teams take the podium, with everyone on them. */
function TeamPodium({ view, result }: { view: RoomView; result: GameResult }) {
  const room = useRoom();
  const people = usePeople(view);
  const teams = result.teams!;
  const top = Math.max(1, teams[0]?.score ?? 1);
  return (
    <div className={styles.podium}>
      <Later ms={REVEAL.podium}>
        <Confetti />
      </Later>
      <span className={styles.eyebrow}>{gameInfo[result.game].title} · final results</span>
      <motion.h2 className={styles.teamWinner} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: REVEAL.podium / 1000 }}>
        {teams.filter((t) => t.rank === 1).map((t) => t.name).join(' & ')} win!
      </motion.h2>
      <ol className={styles.teamList}>
        {teams.map((team, i) => (
          <motion.li
            key={team.name}
            className={styles.teamRow}
            style={{ '--tone': teamTone(team.color) } as React.CSSProperties}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.2, type: 'spring', stiffness: 280, damping: 22 }}
          >
            <span className={styles.teamMedal}>{['1st', '2nd', '3rd', '4th'][team.rank - 1]}</span>
            <span className={styles.teamInfo}>
              <span className={styles.teamTitle}>{team.name}</span>
              <span className={styles.teamMembers}>
                {team.members.map((id) => {
                  const p = people.get(id);
                  return p ? <Avatar key={id} avatar={p.avatar} size={28} /> : null;
                })}
              </span>
            </span>
            <span className={styles.teamBar}>
              <motion.span initial={{ width: 0 }} animate={{ width: `${(team.score / top) * 100}%` }} transition={{ delay: 1 + i * 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }} />
            </span>
            <CountUp className={styles.score} value={team.score} duration={1400} />
          </motion.li>
        ))}
      </ol>
      {result.highlights.map((h) => (
        <motion.div key={h.title} className={styles.highlight} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 2 }}>
          <span className={styles.highlightTitle}>{h.title}</span>
          <span className={styles.highlightWho}>{nameOf(people, h.playerId)}</span>
          <span className={styles.highlightDetail}>{h.detail}</span>
        </motion.div>
      ))}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
        <StatHolders view={view} />
      </motion.div>

      <motion.div className={styles.actions} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>
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
