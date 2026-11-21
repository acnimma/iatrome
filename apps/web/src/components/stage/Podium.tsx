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
import { jelly } from '@/components/ui/jelly';
import { AdSlot } from '@/components/ads/AdSlot';
import styles from './Podium.module.css';
import { Icon } from '@/components/icons/Icon';

/** When each place is called (seconds): 3rd, then 2nd, then a drumroll, then the winner. */
const WINNER_AT = REVEAL.podium / 1000;
/** Left to right 2nd, 1st, 3rd, like every podium since 1896. Heights in design pixels (stage is 1440x900). */
const PLACES = [
  { place: 2, step: 165, avatar: 92, tone: 'blue' as const, at: 1.9 },
  { place: 1, step: 230, avatar: 116, tone: 'gold' as const, at: WINNER_AT },
  { place: 3, step: 125, avatar: 84, tone: 'rose' as const, at: 1.0 },
];

/** Final standings: a proper podium (winner called last), then everyone else and the night's highlights. */
export function Podium({ view, result }: { view: RoomView; result: GameResult }) {
  const room = useRoom();
  const people = usePeople(view);
  if (result.teams) return <TeamPodium view={view} result={result} />;
  const byRank = (rank: number) => result.standings.filter((s) => s.rank === rank);
  const rest = result.standings.filter((s) => s.rank > 3);
  const after = WINNER_AT + 0.9;
  const champs = byRank(1).map((s) => s.name);

  return (
    <div className={styles.podium}>
      <Vibes at={WINNER_AT} />
      <Later ms={REVEAL.podium}>
        <Confetti pieces={220} />
      </Later>
      <span className={styles.eyebrow}>{gameInfo[result.game].title} · final results</span>
      {champs.length > 0 && <Headline at={WINNER_AT} text={`${champs.join(' & ')} ${champs.length > 1 ? 'take' : 'takes'} it!`} />}
      <div className={styles.stage}>
        <aside className={styles.side}>
          {result.highlights.filter((_, i) => i % 2 === 0).map((h, i) => (
            <Highlight key={h.title} h={h} people={people} delay={after + i * 0.5} tilt={-1} />
          ))}
        </aside>
        {/* The winner's spotlight: off until their name is called. */}
        <motion.div
          className={styles.spotlight}
          aria-hidden
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: WINNER_AT - 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className={styles.steps}>
          {PLACES.map(({ place, step, avatar, tone, at }, i) => {
            const winners = byRank(place);
            return (
              <div key={place} className={`${styles.column} ${place === 1 ? styles.first : ''} ${winners.length > 1 ? styles.tied : ''}`}>
                <div className={styles.winners}>
                  {place === 1 && winners.length > 0 && <Drumroll until={at} />}
                  {place === 1 && winners.length > 0 && <Twinkles at={at} />}
                  {winners.map((w, j) => (
                    <motion.div
                      key={w.playerId}
                      className={styles.winner}
                      initial={{ y: -120, opacity: 0, scale: 0.4 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: at + j * 0.15, type: 'spring', stiffness: place === 1 ? 260 : 320, damping: place === 1 ? 11 : 15 }}
                    >
                      <span className={place === 1 ? styles.bounceAvatar : styles.floatAvatar} style={{ animationDelay: `${at + 0.6 + j * 0.2}s` }}>
                        <Avatar avatar={w.avatar} size={Math.round(avatar * (winners.length > 2 ? 0.56 : winners.length > 1 ? 0.72 : 1))} />
                      </span>
                      <span className={styles.name}>{w.name}</span>
                      {w.note ? <span className={styles.score}>{w.note}</span> : <CountUp className={styles.score} value={w.score} duration={1400} />}
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className={`${styles.step} ${jelly(tone)}`}
                  initial={{ height: 0 }}
                  animate={{ height: step }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={styles.shine} aria-hidden />
                  <span className={styles.rank}>{place}</span>
                  <span className={styles.medal}>
                    <Icon name={place === 1 ? 'trophy' : 'medal'} size={place === 1 ? 52 : 40} />
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>
        <aside className={styles.side}>
          {result.highlights.filter((_, i) => i % 2 === 1).map((h, i) => (
            <Highlight key={h.title} h={h} people={people} delay={after + 0.25 + i * 0.5} tilt={1} />
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: after + 0.8 }}>
            <StatHolders view={view} />
          </motion.div>
        </aside>
      </div>

      {rest.length > 0 && (
        <motion.ol className={styles.rest} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {rest.map((s) => (
            <li key={s.playerId}>
              <span className={styles.restRank}>{s.rank}</span>
              <Avatar avatar={s.avatar} size={28} />
              <span className={styles.restName}>{s.name}</span>
              <strong>{s.note ?? s.score.toLocaleString()}</strong>
            </li>
          ))}
        </motion.ol>
      )}

      <motion.div className={styles.actions} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: after + 0.8 }}>
        <Button size="lg" onClick={() => room.host({ type: 'again' })}>
          Play again
        </Button>
        <Button tone="pearl" size="lg" onClick={() => room.host({ type: 'lobby' })}>
          Pick another game
        </Button>
      </motion.div>
      <AdSlot placement="game-over" />
    </div>
  );
}

/** One of the night's awards, pinned beside the podium like a card on a corkboard. */
function Highlight({ h, people, delay, tilt }: { h: GameResult['highlights'][number]; people: ReturnType<typeof usePeople>; delay: number; tilt: number }) {
  return (
    <motion.div
      className={styles.highlight}
      initial={{ y: 30, opacity: 0, rotate: tilt * 3 }}
      animate={{ y: 0, opacity: 1, rotate: tilt }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 18 }}
    >
      <span className={styles.highlightTitle}>{h.title}</span>
      <span className={styles.highlightWho}>{h.playerId ? nameOf(people, h.playerId) : 'Beep'}</span>
      <span className={styles.highlightDetail}>{h.detail}</span>
    </motion.div>
  );
}

/**
 * The party behind the podium: slow light rays and a few drifting jelly orbs that swell
 * when the winner is called. Pure decoration, never in the way.
 */
function Vibes({ at }: { at: number }) {
  return (
    <div className={styles.vibes} aria-hidden>
      <span className={`${styles.orb} ${styles.orbA}`} />
      <span className={`${styles.orb} ${styles.orbB}`} />
      <span className={`${styles.orb} ${styles.orbC}`} />
      <motion.span className={styles.rays} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: at - 0.1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

/** The winner's name, big and jelly, one letter at a time springing in when they are called. */
function Headline({ at, text }: { at: number; text: string }) {
  return (
    <h2 className={styles.headline} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className={styles.headlineChar}
          initial={{ y: -80, opacity: 0, scaleY: 1.5, scaleX: 0.6 }}
          animate={{ y: 0, opacity: 1, scaleY: 1, scaleX: 1 }}
          transition={{ delay: at + i * 0.035, type: 'spring', stiffness: 380, damping: 11 }}
        >
          {ch === ' ' ? '\u00a0' : ch}
        </motion.span>
      ))}
    </h2>
  );
}

/** Sparkles twinkling around the winner. */
function Twinkles({ at }: { at: number }) {
  const spots = [
    { x: -88, y: -150, size: 38, d: 0 },
    { x: 92, y: -120, size: 28, d: 0.35 },
    { x: -70, y: -40, size: 24, d: 0.7 },
    { x: 80, y: -210, size: 32, d: 0.2 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <motion.span
          key={i}
          className={styles.twinkle}
          aria-hidden
          style={{ left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)` }}
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={{ scale: [0, 1.2, 0.8, 1.1, 0.8], rotate: [-30, 0, 15, 0, 15], opacity: [0, 1, 1, 1, 1] }}
          transition={{ delay: at + 0.3 + s.d, duration: 2.4, repeat: Infinity, repeatDelay: 0.4, ease: 'easeInOut' }}
        >
          <Icon name="sparkles" size={s.size} />
        </motion.span>
      ))}
    </>
  );
}

/** The empty top spot before the winner is called: a pulsing question mark, not a hole. */
function Drumroll({ until }: { until: number }) {
  return (
    <motion.div
      className={styles.mystery}
      aria-hidden
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.08, 0.4] }}
      transition={{ duration: until, times: [0, 0.12, 0.92, 1], ease: 'easeInOut' }}
    >
      <motion.span animate={{ rotate: [-6, 6, -6] }} transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}>
        ?
      </motion.span>
    </motion.div>
  );
}

/** Team games: the teams take the podium, with everyone on them. */
/** 1st, 2nd, 3rd, 4th... 11th, 12th, 13th... 21st. */
const ordinal = (n: number) => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `${n}${suffix}`;
};

function TeamPodium({ view, result }: { view: RoomView; result: GameResult }) {
  const room = useRoom();
  const people = usePeople(view);
  const teams = result.teams!;
  const top = Math.max(1, teams[0]?.score ?? 1);
  return (
    <div className={styles.podium}>
      <Vibes at={REVEAL.podium / 1000} />
      <Later ms={REVEAL.podium}>
        <Confetti pieces={160} />
      </Later>
      <span className={styles.eyebrow}>{gameInfo[result.game].title} · final results</span>
      <Headline at={REVEAL.podium / 1000} text={`${teams.filter((t) => t.rank === 1).map((t) => t.name).join(' & ')} win!`} />
      <ol className={`${styles.teamList} ${teams.length > 5 ? styles.teamListMany : ''}`}>
        {teams.map((team, i) => (
          <motion.li
            key={team.name}
            className={styles.teamRow}
            style={{ '--tone': teamTone(team.color) } as React.CSSProperties}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.2, type: 'spring', stiffness: 280, damping: 22 }}
          >
            <span className={styles.teamMedal}>{ordinal(team.rank)}</span>
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
        <Button size="lg" onClick={() => room.host({ type: 'again' })}>
          Play again
        </Button>
        <Button tone="pearl" size="lg" onClick={() => room.host({ type: 'lobby' })}>
          Pick another game
        </Button>
      </motion.div>
      <AdSlot placement="game-over" />
    </div>
  );
}
