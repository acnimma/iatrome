'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import type { EntryView, GrandRoundsView, MatchupView, RoomView } from '@iatrome/game/client';
import { useDrawing } from '@/realtime/use-room';
import { DrawingView } from '@/components/drawing/DrawingView';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { AvatarRow, CountUp, IntroCard, Pill, Scoreboard, Stamp, nameOf, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { ROUND_NAMES, ROUND_BLURBS } from './rounds';
import styles from './GrandRounds.module.css';

export function GrandRoundsStage({ view, game }: { view: RoomView; game: GrandRoundsView }) {
  const phase = game.phase.name;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phase === 'present' || phase === 'vote' || phase === 'results' ? `m-${game.matchup?.id}` : `${phase}-${game.round}`}
        className={styles.stageScene}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {phase === 'intro' && (
          <IntroCard
            eyebrow={`Round ${game.round + 1} of ${game.rounds}`}
            title={ROUND_NAMES[game.round]}
            body={ROUND_BLURBS[game.round]}
            badge={game.multiplier > 1 ? `×${game.multiplier}` : undefined}
          />
        )}
        {phase === 'write' && <Writing view={view} game={game} />}
        {game.matchup && (phase === 'present' || phase === 'vote' || phase === 'results') && <Matchup view={view} game={game} matchup={game.matchup} />}
        {phase === 'scores' && (
          <div className={styles.scores}>
            <h2 className={styles.heading}>After round {game.round + 1}</h2>
            <Scoreboard view={view} scores={game.scores} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Writing({ view, game }: { view: RoomView; game: GrandRoundsView }) {
  const players = view.people.filter((p) => p.inGame).map((p) => p.id);
  const waiting = new Set(game.waitingOn);
  const done = new Set(players.filter((id) => !waiting.has(id)));
  const title = game.round === 2 ? 'Write your differential' : game.round === 1 ? 'Write & draw on your phones' : 'Answer on your phones';
  return (
    <div className={styles.writing}>
      <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={150} ticks />
      <h2 className={styles.heading}>{title}</h2>
      <p className={styles.sub}>Be funny. Be fast. Your answer stays anonymous until the votes are in.</p>
      <AvatarRow ids={players} view={view} size={68} done={done} />
    </div>
  );
}

// ── The duel ─────────────────────────────────────────────────────────────────

function Matchup({ view, game, matchup }: { view: RoomView; game: GrandRoundsView; matchup: MatchupView }) {
  const phase = game.phase.name;
  const result = phase === 'results' ? matchup.result : null;
  useMatchupSounds(matchup, phase);

  return (
    <div className={styles.matchup}>
      <div className={styles.matchupTop}>
        <Pill>
          {matchup.kind === 'doodle' ? '✏️ Doodle' : matchup.kind === 'differential' ? '📋 Differential' : '💬 Quip'} · {matchup.index + 1} of {matchup.total}
        </Pill>
        {phase === 'vote' && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={72} ticks />}
      </div>

      <motion.h2 className={styles.prompt} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        {matchup.prompt}
      </motion.h2>

      <div className={styles.versus}>
        {([0, 1] as const).map((side) => (
          <AnswerCard key={side} view={view} matchup={matchup} side={side} phase={phase} />
        ))}
        <motion.span className={styles.vs} initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }} transition={{ delay: entryDelay(matchup.kind, 1) + 0.2, type: 'spring', stiffness: 400, damping: 12 }}>
          VS
        </motion.span>
      </div>

      <div className={styles.footer}>
        {phase === 'vote' && (
          <motion.div className={styles.votePrompt} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <strong>Vote on your phones!</strong>
            <span className={styles.pips}>
              {Array.from({ length: Math.max(matchup.votersExpected, matchup.votesIn) }, (_, i) => (
                <motion.span key={i} className={i < matchup.votesIn ? styles.pipOn : styles.pip} animate={i < matchup.votesIn ? { scale: [1, 1.5, 1] } : {}} />
              ))}
            </span>
          </motion.div>
        )}
        {result && <ResultBanner result={result} />}
      </div>
    </div>
  );
}

/** When each answer appears during the present phase (seconds). */
function entryDelay(kind: MatchupView['kind'], side: 0 | 1) {
  if (kind === 'doodle') return 0.5 + side * 0.4;
  if (kind === 'differential') return 0.8 + side * 3;
  return 1.1 + side * 1.2;
}

function AnswerCard({ view, matchup, side, phase }: { view: RoomView; matchup: MatchupView; side: 0 | 1; phase: string }) {
  const people = usePeople(view);
  const entry = matchup.entries[side];
  const result = phase === 'results' ? matchup.result : null;
  const won = result?.winner === side;
  const lost = result && result.winner !== null && result.winner !== side;
  const voters = result?.playerVotes.filter((v) => v.side === side) ?? [];
  const share = result ? Math.round(result.shares[side] * 100) : 0;
  const author = entry.author ? people.get(entry.author) : null;
  const delay = entryDelay(matchup.kind, side);

  return (
    <motion.div
      className={`${styles.answer} ${side === 0 ? styles.left : styles.right} ${won ? styles.won : ''} ${lost ? styles.lost : ''}`}
      initial={{ y: 40, opacity: 0, rotate: side === 0 ? -3 : 3 }}
      animate={{ y: 0, opacity: 1, rotate: won ? (side === 0 ? -1.5 : 1.5) : 0, scale: won ? 1.04 : lost ? 0.96 : 1 }}
      transition={{ delay: phase === 'present' ? delay : 0, type: 'spring', stiffness: 260, damping: 20 }}
    >
      <AnswerContent entry={entry} kind={matchup.kind} replay={phase === 'present'} delay={delay} />

      {result && (
        <div className={styles.reveal}>
          <div className={styles.voters}>
            {voters.map((v, i) => {
              const p = people.get(v.voterId);
              return p ? (
                <motion.span key={v.voterId} initial={{ scale: 0, y: -60 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 500, damping: 15 }}>
                  <Avatar avatar={p.avatar} size={34} />
                </motion.span>
              ) : null;
            })}
            {result.audienceVotes[side] > 0 && <Pill>+{result.audienceVotes[side]} audience</Pill>}
          </div>
          <div className={styles.shareBar}>
            <motion.span initial={{ width: 0 }} animate={{ width: `${share}%` }} transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }} />
            <CountUp className={styles.share} value={share} duration={1200} />
          </div>
          <motion.div className={styles.author} initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ delay: 1.6, type: 'spring', stiffness: 300, damping: 20 }}>
            {entry.author === 'beep' ? (
              <span className={styles.authorName}>🤖 Beep</span>
            ) : author ? (
              <>
                <Avatar avatar={author.avatar} size={40} />
                <span className={styles.authorName}>{author.name}</span>
              </>
            ) : (
              <span className={styles.authorName}>{nameOf(people, entry.author)}</span>
            )}
            <motion.span className={styles.points} initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 2.2, type: 'spring', stiffness: 500, damping: 12 }}>
              +{result.points[side].toLocaleString()}
            </motion.span>
          </motion.div>
          {entry.curbside && (
            <motion.span className={styles.curbside} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}>
              Curbside consult · half points
            </motion.span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function AnswerContent({ entry, kind, replay, delay }: { entry: EntryView; kind: MatchupView['kind']; replay: boolean; delay: number }) {
  const drawing = useDrawing(entry.drawingId);
  if (entry.hidden) return <p className={styles.missing}>🙈 Hidden by the host</p>;
  if (kind === 'doodle') return entry.drawingId ? <DrawingView drawing={drawing} replayMs={replay ? 4200 : undefined} className={styles.doodle} /> : <p className={styles.missing}>😴 No drawing</p>;
  if (kind === 'differential') {
    if (!entry.items) return <p className={styles.missing}>😴 No answer</p>;
    return (
      <ol className={styles.list}>
        {entry.items.map((item, i) => (
          <motion.li key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: replay ? delay + i * 0.85 : 0 }}>
            {item || '…'}
          </motion.li>
        ))}
      </ol>
    );
  }
  return entry.text ? <p className={styles.quip}>{entry.text}</p> : <p className={styles.missing}>😴 No answer</p>;
}

function ResultBanner({ result }: { result: NonNullable<MatchupView['result']> }) {
  const stamp =
    result.outcome === 'duplicate'
      ? { text: 'Duplicate order!', tone: 'ink' as const, note: 'Same answer twice — both cancelled.' }
      : result.outcome === 'forfeit'
        ? { text: 'Forfeit', tone: 'gold' as const, note: 'No answer means the other side takes it all.' }
        : result.outcome === 'empty'
          ? { text: 'Nobody answered', tone: 'ink' as const, note: '' }
          : result.consensus
            ? { text: 'Consensus!', tone: 'rose' as const, note: 'The whole room agreed. Bonus points!' }
            : result.winner === null
              ? { text: 'Tie!', tone: 'sky' as const, note: '' }
              : null;
  if (!stamp) return null;
  return (
    <div className={styles.banner}>
      <Stamp tone={stamp.tone}>{stamp.text}</Stamp>
      {stamp.note && <span className={styles.bannerNote}>{stamp.note}</span>}
    </div>
  );
}

function useMatchupSounds(matchup: MatchupView, phase: string) {
  useEffect(() => {
    if (phase === 'present') {
      play('whoosh');
      const [a, b] = matchup.entries;
      const say = matchup.kind === 'quip' ? `${matchup.prompt}. ${a.text ?? ''}. Or. ${b.text ?? ''}` : matchup.prompt;
      speak(say);
    }
    if (phase === 'vote') play('vote');
    if (phase === 'results' && matchup.result) {
      const r = matchup.result;
      play('drumroll');
      const t = setTimeout(() => play(r.outcome === 'duplicate' ? 'buzz' : r.consensus ? 'consensus' : 'reveal'), 1500);
      return () => clearTimeout(t);
    }
  }, [phase, matchup.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
