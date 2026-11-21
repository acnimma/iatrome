'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import { DIDACTICS, type DidacticsView, type RoomView } from '@iatrome/game/client';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { CountUp, IntroCard, Pill, nameOf, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import { teamTone } from './teams';
import { ANSWER_TONES, AnswerLetter, LETTERS } from '@/components/room/answers';
import { jelly } from '@/components/ui/jelly';
import { REVEAL_BEAT, useAfter } from '@/components/ui/Later';
import { bonusText, calloutText, nextUp, pctLabel, swingText } from './copy';
import styles from './Didactics.module.css';

export function DidacticsStage({ view, game }: { view: RoomView; game: DidacticsView }) {
  const phase = game.phase.name;
  useEffect(() => {
    if (phase === 'reveal') {
      play('reveal');
      const anyRight = Object.values(game.last?.perTeam ?? {}).some((t) => t.right > 0);
      setTimeout(() => play(anyRight ? 'ding' : 'wrong'), 450);
      if (game.number === game.total) play('cheer');
    }
    if (phase === 'teams' || phase === 'lightning' || phase === 'wager') play('whoosh');
    if (phase === 'standings') {
      play('whoosh');
      setTimeout(() => play('coin'), 350);
    }
    if (phase === 'huddle') play('pop');
  }, [phase, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro')
    return (
      <IntroCard
        eyebrow="Up next"
        title="Didactics Mode"
        body={
          game.solo
            ? 'Everyone for themselves. Answer on your phone or laptop. Streaks and the fastest right answer earn bonus points.'
            : 'Random teams. Everyone answers on their phone or laptop, then your team huddles. Your team scores when you get it right.'
        }
      />
    );
  if (phase === 'teams') return <Teams view={view} game={game} />;
  if (phase === 'standings') return <Standings game={game} />;
  if (phase === 'lightning')
    return (
      <IntroCard
        eyebrow={`Questions ${game.number} to ${game.total - 1}`}
        title="Lightning round"
        body={`${DIDACTICS.lightningQuestion / 1000} seconds a question. Double points. ${game.solo ? 'Think fast.' : 'No huddle, so no committee.'}`}
        badge="×2"
      />
    );
  if (phase === 'wager') return <Wager view={view} game={game} />;
  return <Question view={view} game={game} />;
}

/** Big rooms get more teams: lay them out in rows of four at most. */
const columns = (teams: number) => (teams <= 4 ? teams : Math.ceil(teams / 2));

function Teams({ view, game }: { view: RoomView; game: DidacticsView }) {
  const people = usePeople(view);
  return (
    <div className={styles.stage}>
      <h2 className={styles.heading}>Meet your teams</h2>
      <p className={styles.subheading}>Rename your team on your phone.</p>
      <div className={styles.teams} style={{ '--cols': columns(game.teams.length) } as React.CSSProperties} data-many={game.teams.length > 4 || undefined}>
        {game.teams.map((team, i) => (
          <motion.section
            key={team.id}
            className={styles.team}
            style={{ '--tone': teamTone(team.color) } as React.CSSProperties}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.18, type: 'spring', stiffness: 260, damping: 20 }}
          >
            <h3 className={styles.teamName}>{team.name}</h3>
            <ul className={styles.members}>
              {team.members.map((id, j) => {
                const p = people.get(id);
                return p ? (
                  <motion.li key={id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.18 + j * 0.05, type: 'spring', stiffness: 500, damping: 16 }}>
                    <Avatar avatar={p.avatar} size={32} />
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
  const huddle = game.phase.name === 'huddle';
  // How the room answered lands first; the right answer a beat later; on the final, the wagers after that.
  const beat = useAfter(REVEAL_BEAT, `${game.number}-${revealed}`);
  const late = useAfter(REVEAL_BEAT * 2.4, `${game.number}-${revealed}`);
  const answerShown = revealed && beat;
  const swingsShown = revealed && game.final && late;
  const answered = new Set(game.answered);
  return (
    <div className={styles.stage} data-lightning={game.lightning || undefined} data-compact={revealed || huddle || undefined}>
      <div className={styles.top}>
        <Pill>
          Question {game.number} of {game.total}
        </Pill>
        {game.lightning && <Pill tone="gold">Lightning round · double points</Pill>}
        {game.final && <Pill tone="rose">Final question · wagered</Pill>}
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
              transition={{ delay: revealed || huddle ? 0 : 0.25 + i * 0.1, type: 'spring', stiffness: 380, damping: 22 }}
            >
              <AnswerLetter index={i} size="lg" />
              <span className={styles.optionText}>{option}</span>
              {revealed && <span className={styles.tally}>{game.tally[i]}</span>}
            </motion.div>
          );
        })}
      </div>
      {huddle && (
        <motion.div className={styles.huddle} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }}>
          <strong>Huddle</strong>
          <span>Each team sees its own split. One switch each. {game.switches ? `${game.switches} switched so far.` : 'Nobody has caved yet.'}</span>
        </motion.div>
      )}
      {answerShown && (game.callout || game.fact) && (
        <motion.div className={styles.afterword} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
          {game.callout && <p className={styles.callout}>{calloutText(game.callout, game.options)}</p>}
          {game.fact && !game.final && <p className={styles.fact}>{game.fact}</p>}
        </motion.div>
      )}
      {revealed && answerShown && <BonusPills view={view} game={game} />}
      {game.solo ? (
        <div className={styles.teamStrip}>
          <div className={styles.teamChip} style={{ '--tone': 'var(--card)' } as React.CSSProperties}>
            <span className={styles.chipProgress}>
              {answered.size} of {game.teams.length} answered
            </span>
          </div>
        </div>
      ) : (
      <div className={styles.teamStrip} data-many={game.teams.length > 4 || undefined}>
        {game.teams.map((team) => {
          const r = game.last?.perTeam[team.id];
          const done = team.members.filter((id) => answered.has(id)).length;
          return (
            <div key={team.id} className={styles.teamChip} style={{ '--tone': teamTone(team.color) } as React.CSSProperties}>
              <span className={styles.chipName}>{team.name}</span>
              {revealed && r ? (
                <>
                  <motion.span className={styles.chipResult} initial={{ scale: 0 }} animate={{ scale: answerShown ? 1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
                    {r.right} of {r.of} right · +{r.points}
                  </motion.span>
                  {r.wager && swingsShown && (
                    <motion.span
                      className={`${styles.chipSwing} ${r.wager.swing < 0 ? styles.swingDown : ''}`}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 12 }}
                    >
                      Bet {pctLabel(r.wager.pct).toLowerCase()} · {swingText(r.wager.swing)}
                    </motion.span>
                  )}
                </>
              ) : (
                <span className={styles.chipProgress}>{huddle ? 'Huddling' : `${done}/${team.members.length} answered`}</span>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

/** Who earned a streak or first-answer bonus on this question: the loudest few. */
function BonusPills({ view, game }: { view: RoomView; game: DidacticsView }) {
  const people = usePeople(view);
  const earned = Object.entries(game.last?.bonus ?? {})
    .sort((a, b) => b[1].points - a[1].points)
    .slice(0, 5);
  if (!earned.length) return null;
  return (
    <div className={styles.bonusRow}>
      {earned.map(([id, b], i) => (
        <motion.span
          key={id}
          className={`${styles.bonusPill} ${b.first ? styles.bonusFirst : ''}`}
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5 + i * 0.12, type: 'spring', stiffness: 460, damping: 14 }}
        >
          <strong>{nameOf(people, id)}</strong> {bonusText(b)}
        </motion.span>
      ))}
    </div>
  );
}

/** The captains bet. The stage shows who's deciding, not what they picked. */
function Wager({ view, game }: { view: RoomView; game: DidacticsView }) {
  const people = usePeople(view);
  const hard = ['', 'easy', 'medium', 'hard'][game.wager?.difficulty ?? 2];
  const ranked = game.teams.slice().sort((a, b) => b.score - a.score);
  return (
    <div className={styles.stage}>
      <div className={styles.top}>
        <Pill tone="rose">Final wager</Pill>
        <Pill>The last question is {hard}</Pill>
        <span className={styles.timer}>
          <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={84} ticks />
        </span>
      </div>
      <h2 className={styles.heading}>{game.solo ? 'Place your bets' : 'Captains, place your bets'}</h2>
      <p className={styles.wagerRules}>
        {game.solo ? 'Nothing, a quarter, half or everything. Get the last question right and it pays. Anyone can still win.' : 'Nothing, a quarter, half or everything. The team’s majority answer decides it. Anyone can still win.'}
      </p>
      <div className={styles.wagerGrid} style={{ '--cols': columns(ranked.length) } as React.CSSProperties} data-many={ranked.length > 4 || undefined}>
        {ranked.map((team, i) => {
          const w = game.wager?.teams[team.id];
          const captain = w ? people.get(w.captain) : null;
          return (
            <motion.section
              key={team.id}
              className={styles.wagerCard}
              style={{ '--tone': teamTone(team.color) } as React.CSSProperties}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 300, damping: 22 }}
            >
              <h3 className={styles.teamName}>{team.name}</h3>
              <CountUp className={styles.wagerScore} value={team.score} />
              {captain && !game.solo && (
                <span className={styles.captain}>
                  <Avatar avatar={captain.avatar} size={ranked.length > 4 ? 30 : 40} />
                  <span>
                    <small>Captain</small>
                    {nameOf(people, w!.captain)}
                  </span>
                </span>
              )}
              <motion.span key={String(w?.picked)} className={`${styles.wagerState} ${w?.picked ? styles.wagerLocked : ''}`} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                {w?.picked ? 'Bet locked' : 'Thinking…'}
              </motion.span>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}

function Standings({ game }: { game: DidacticsView }) {
  const everyone = game.teams.slice().sort((a, b) => b.score - a.score);
  // A big free-for-all would run off the screen: show the leaders.
  const ranked = game.solo ? everyone.slice(0, 8) : everyone;
  const top = Math.max(1, ranked[0]?.score ?? 1);
  const next = nextUp(game);
  return (
    <div className={styles.stage}>
      <h2 className={styles.heading}>The scores so far</h2>
      <ol className={styles.standings} data-many={ranked.length > 5 || undefined}>
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
      {next && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}>
          <Pill tone={next.includes('wager') ? 'rose' : 'gold'}>Next: {next}</Pill>
        </motion.div>
      )}
    </div>
  );
}
