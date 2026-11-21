'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { type EntryView, GRAND_ROUNDS, type GrandRoundsView, type MatchupView, type RoomView, duelReadTiming, duelRevealTiming, finaleRevealTiming } from '@iatrome/game/client';
import { useDrawing, useRoom } from '@/realtime/use-room';
import { DrawingView } from '@/components/drawing/DrawingView';
import { jelly } from '@/components/ui/jelly';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { AvatarRow, CountUp, IntroCard, Pill, Scoreboard, Stamp, nameOf, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import { haptic } from '@/lib/haptics';
import { Icon } from '@/components/icons/Icon';
import { ROUND_NAMES, ROUND_BLURBS } from './rounds';
import { Pathognomonic } from './Pathognomonic';
import { SpotlightSweep, spotlitClass } from '@/components/ui/Spotlight';
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
            <Scoreboard view={view} scores={game.scores} previous={game.previousScores} />
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
  // Every lock-in gets a little sting, so the room hears the pressure building.
  const locked = useRef(done.size);
  useEffect(() => {
    if (done.size > locked.current) play('lockin');
    locked.current = done.size;
  }, [done.size]);
  const title = game.round === 2 ? 'Write your differential' : game.round === 1 ? 'Write & draw on your devices' : 'Answer on your devices';
  return (
    <div className={styles.writing}>
      <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={150} ticks />
      <h2 className={styles.heading}>{title}</h2>
      <p className={styles.sub}>Answers stay anonymous until the votes are in.</p>
      <AvatarRow ids={players} view={view} size={68} done={done} />
    </div>
  );
}

// ── The duel ─────────────────────────────────────────────────────────────────

/** Milliseconds since the current phase began (server time), ticking while the show runs. */
function usePhaseClock(game: GrandRoundsView) {
  const room = useRoom();
  const { startedAt, name } = game.phase;
  const live = name === 'present' || name === 'results';
  const [elapsed, setElapsed] = useState(() => room.serverNow() - startedAt);
  useEffect(() => {
    setElapsed(room.serverNow() - startedAt);
    if (!live) return;
    const t = setInterval(() => setElapsed(room.serverNow() - startedAt), 80);
    return () => clearInterval(t);
  }, [room, startedAt, live]);
  return live ? elapsed : Infinity;
}

/** The duel or finale as a show. Used by the big screen, and by every phone when there isn't one. */
export function MatchupShow(props: { view: RoomView; game: GrandRoundsView; matchup: MatchupView; onPhone?: boolean }) {
  return <Matchup {...props} />;
}

function Matchup({ view, game, matchup, onPhone = false }: { view: RoomView; game: GrandRoundsView; matchup: MatchupView; onPhone?: boolean }) {
  const phase = game.phase.name;
  const elapsed = usePhaseClock(game);
  const people = usePeople(view);
  const result = phase === 'results' ? matchup.result : null;
  const [a, b] = matchup.entries;
  const read = duelReadTiming(matchup.prompt, a.text, b?.text ?? null, matchup.kind === 'doodle' ? 'doodle' : 'quip');
  const reveal = duelRevealTiming(result?.playerVotes.length ?? 0, Boolean(result?.consensus));
  useMatchupShow(matchup, phase, elapsed, read, onPhone);

  // When each answer appears: in the present phase it follows the read-aloud; afterwards, always shown.
  const shownAt = (side: number) =>
    phase !== 'present' ? 0 : matchup.finale ? 600 + side * GRAND_ROUNDS.presentPerList : side === 0 ? read.aAt : read.bAt;

  return (
    <div className={`${styles.matchup} ${onPhone ? styles.onPhone : ''}`}>
      <div className={styles.matchupTop}>
        <Pill>
          <Icon name={matchup.kind === 'doodle' ? 'pencil' : matchup.kind === 'differential' ? 'list' : 'speech'} size={20} />
          {matchup.finale ? 'The Differential · everyone’s answer' : `${matchup.kind === 'doodle' ? 'Doodle' : 'Quip'} · ${matchup.index + 1} of ${matchup.total}`}
        </Pill>
        {phase === 'vote' && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={72} ticks />}
      </div>

      <motion.h2 className={styles.prompt} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        <Narrated text={matchup.prompt} startAt={250} elapsed={phase === 'present' ? elapsed : Infinity} />
      </motion.h2>

      {matchup.finale ? (
        <FinaleBoard view={view} matchup={matchup} phase={phase} elapsed={elapsed} shownAt={shownAt} />
      ) : (
        <div className={styles.versus}>
          {([0, 1] as const).map((side) => (
            <AnswerCard key={side} view={view} matchup={matchup} side={side} phase={phase} elapsed={elapsed} shown={elapsed >= shownAt(side)} reveal={reveal} typeAt={shownAt(side)} />
          ))}
          {elapsed >= shownAt(1) && (
            <motion.span
              className={`${styles.vs} ${jelly('pearl')}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
              transition={{ scale: { type: 'spring', stiffness: 400, damping: 12 }, rotate: { duration: 0.6 } }}
            >
              VS
            </motion.span>
          )}
        </div>
      )}

      <div className={styles.footer}>
        {phase === 'vote' && (
          <motion.div className={styles.votePrompt} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <strong>{matchup.finale ? `Vote on your devices · ${matchup.picksPerVoter} votes each, stack them if you like` : 'Vote on your devices'}</strong>
            <span className={styles.pips}>
              {Array.from({ length: Math.max(matchup.votersExpected, matchup.votesIn) }, (_, i) => (
                <motion.span key={i} className={i < matchup.votesIn ? styles.pipOn : styles.pip} animate={i < matchup.votesIn ? { scale: [1, 1.5, 1] } : {}} />
              ))}
            </span>
          </motion.div>
        )}
        {result && !matchup.finale && elapsed >= reveal.winnerAt && <ResultBanner result={result} />}
      </div>

      <SpotlightSweep
        active={
          Boolean(result) &&
          (matchup.finale
            ? elapsed >= finaleRevealTiming(matchup.entries.length).listAt(matchup.entries.length - 1) - GRAND_ROUNDS.drumroll &&
              elapsed < finaleRevealTiming(matchup.entries.length).listAt(matchup.entries.length - 1)
            : elapsed < reveal.winnerAt)
        }
      />

      {result?.consensus && result.winner !== null && (
        <Pathognomonic
          show={elapsed >= (matchup.finale ? finaleRevealTiming(matchup.entries.length).listAt(matchup.entries.length - 1) : reveal.winnerAt)}
          name={nameOf(people, matchup.entries[result.winner].author)}
        />
      )}
    </div>
  );
}

/** Two to a row up to four lists, then three, then four. */
const boardColumns = (n: number) => (n <= 4 ? 2 : n <= 6 || n === 9 ? 3 : 4);

/** The finale: everyone's list, revealed fewest votes first so the winner lands last. */
function FinaleBoard({ view, matchup, phase, elapsed, shownAt }: { view: RoomView; matchup: MatchupView; phase: string; elapsed: number; shownAt: (side: number) => number }) {
  const result = phase === 'results' ? matchup.result : null;
  const votesFor = (side: number) => result?.playerVotes.filter((v) => v.side === side).length ?? 0;
  const order = matchup.entries.map((_, i) => i).sort((x, y) => votesFor(x) - votesFor(y) || x - y);
  const timing = finaleRevealTiming(matchup.entries.length);
  return (
    <div className={styles.board} style={{ '--cols': boardColumns(matchup.entries.length) } as React.CSSProperties}>
      {matchup.entries.map((_, side) => {
        const revealAt = timing.listAt(order.indexOf(side));
        return (
          <AnswerCard
            key={side}
            view={view}
            matchup={matchup}
            side={side}
            phase={phase}
            elapsed={elapsed}
            shown={elapsed >= shownAt(side)}
            reveal={{ voterAt: () => revealAt, winnerAt: revealAt, authorAt: revealAt + 200, pointsAt: revealAt + 500, total: timing.total }}
            waiting={Boolean(result) && elapsed < revealAt}
          />
        );
      })}
    </div>
  );
}

type Reveal = ReturnType<typeof duelRevealTiming>;

function AnswerCard({
  view,
  matchup,
  side,
  phase,
  elapsed,
  shown,
  reveal,
  waiting = false,
  typeAt,
}: {
  view: RoomView;
  matchup: MatchupView;
  side: number;
  phase: string;
  elapsed: number;
  shown: boolean;
  reveal: Reveal;
  waiting?: boolean;
  /** When this answer starts typing in during the present phase (duels only). */
  typeAt?: number;
}) {
  const people = usePeople(view);
  const entry = matchup.entries[side];
  const result = phase === 'results' ? matchup.result : null;
  // Nobody wins until the drumroll is over: both cards stay neutral while the votes land.
  const decided = result && elapsed >= reveal.winnerAt;
  const won = decided && result.winner === side;
  const inTheLight = won && elapsed < reveal.winnerAt + 2_600;
  const lost = decided && result.winner !== null && result.winner !== side && !matchup.finale;
  const all = result?.playerVotes ?? [];
  // Voters land one at a time, alternating sides, in the order they're listed.
  const mine = all.map((v, i) => ({ ...v, i })).filter((v) => v.side === side);
  const landed = mine.filter((v) => elapsed >= reveal.voterAt(matchup.finale ? 0 : v.i));
  const total = all.length;
  const share = result ? Math.round(result.shares[side] * 100) : 0;
  const author = entry.author ? people.get(entry.author) : null;
  const tilt = matchup.finale ? (side % 2 ? 2 : -2) : side === 0 ? -3 : 3;

  if (!shown) return <div className={styles.answerSlot} aria-hidden />;

  return (
    <motion.div
      className={`${styles.answer} ${jelly()} ${won ? styles.won : ''} ${lost ? styles.lost : ''} ${waiting ? styles.waiting : ''} ${inTheLight ? spotlitClass : ''}`}
      initial={{ y: 40, opacity: 0, rotate: tilt }}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <AnswerContent entry={entry} kind={matchup.kind} replay={phase === 'present'} typedFrom={phase === 'present' && typeAt !== undefined ? elapsed - typeAt : Infinity} />

      {result && !waiting && (
        <div className={styles.reveal}>
          <div className={styles.voters}>
            <AnimatePresence>
              {landed.map((v, k) => {
                const p = people.get(v.voterId);
                return p ? (
                  <motion.span key={`${v.voterId}-${k}`} initial={{ scale: 0, y: -80, rotate: -20 }} animate={{ scale: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 14 }}>
                    <Avatar avatar={p.avatar} size={34} />
                  </motion.span>
                ) : null;
              })}
            </AnimatePresence>
          </div>
          {matchup.finale || total < 4 ? (
            <span className={styles.voteCount}>
              {landed.length} {landed.length === 1 ? 'vote' : 'votes'}
            </span>
          ) : (
            <div className={styles.shareBar}>
              <motion.span initial={{ width: 0 }} animate={{ width: decided ? `${share}%` : '0%' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              {decided && <CountUp className={styles.share} value={share} duration={900} />}
            </div>
          )}
          {elapsed >= reveal.authorAt && (
            <motion.div className={styles.author} initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              {author ? (
                <>
                  <Avatar avatar={author.avatar} size={40} />
                  <span className={styles.authorName}>{author.name}</span>
                </>
              ) : (
                <span className={styles.authorName}>{nameOf(people, entry.author)}</span>
              )}
              {elapsed >= reveal.pointsAt && (
                <motion.span className={styles.points} initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
                  +<CountUp value={result.points[side]} duration={700} />
                </motion.span>
              )}
            </motion.div>
          )}
          {entry.curbside && elapsed >= reveal.authorAt && <span className={styles.curbside}>Curbside consult · half points</span>}
        </div>
      )}
    </motion.div>
  );
}

function AnswerContent({ entry, kind, replay, typedFrom = Infinity }: { entry: EntryView; kind: MatchupView['kind']; replay: boolean; typedFrom?: number }) {
  const drawing = useDrawing(entry.drawingId);
  if (entry.hidden)
    return (
      <p className={styles.missing}>
        <Icon name="eye-closed" size={44} /> Hidden by the host
      </p>
    );
  if (kind === 'doodle')
    return entry.drawingId ? <DrawingView drawing={drawing} replayMs={replay ? 2_200 : undefined} className={styles.doodle} /> : <p className={styles.missing}>No drawing</p>;
  if (kind === 'differential') {
    if (!entry.items) return <p className={styles.missing}>No answer</p>;
    return (
      <ol className={styles.list}>
        {entry.items.map((item, i) => (
          <motion.li key={i} initial={replay ? { x: -20, opacity: 0 } : false} animate={{ x: 0, opacity: 1 }} transition={{ delay: replay ? 0.25 + i * 0.55 : 0 }}>
            {item || '…'}
          </motion.li>
        ))}
      </ol>
    );
  }
  return entry.text ? (
    <p className={styles.quip}>
      <Narrated text={entry.text} startAt={0} elapsed={typedFrom} />
    </p>
  ) : (
    <p className={styles.missing}>No answer</p>
  );
}

/**
 * Visual narration: the words land one at a time at reading pace, like Beep is presenting them.
 * The full text is laid out from the start (invisible words keep their space), so nothing reflows.
 */
function Narrated({ text, startAt, elapsed }: { text: string; startAt: number; elapsed: number }) {
  const words = text.split(/(\s+)/);
  let n = -1;
  return (
    <>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return w;
        n += 1;
        const on = elapsed >= startAt + n * GRAND_ROUNDS.readMsPerWord;
        return (
          <span key={i} className={on ? styles.wordOn : styles.wordOff}>
            {w}
          </span>
        );
      })}
    </>
  );
}

function ResultBanner({ result }: { result: NonNullable<MatchupView['result']> }) {
  const stamp =
    result.outcome === 'duplicate'
      ? { text: 'Duplicate order', tone: 'ink' as const, note: 'Same answer twice. Both cancelled.' }
      : result.outcome === 'forfeit'
        ? { text: 'Forfeit', tone: 'gold' as const, note: 'No answer means the other side takes it all.' }
        : result.outcome === 'empty'
          ? { text: 'Nobody answered', tone: 'ink' as const, note: '' }
          : result.playerVotes.length === 0
            ? { text: 'No votes', tone: 'ink' as const, note: 'Nobody voted. Nobody scores.' }
            : result.winner === null && !result.consensus
              ? { text: 'Tie', tone: 'sky' as const, note: '' }
              : null;
  if (!stamp) return null;
  return (
    <motion.div className={styles.banner} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 16 }}>
      <Stamp tone={stamp.tone}>{stamp.text}</Stamp>
      {stamp.note && <span className={styles.bannerNote}>{stamp.note}</span>}
    </motion.div>
  );
}

/**
 * The show's soundtrack and narration, in step with the phase clock: Beep reads the prompt and
 * each answer as it appears, the drumroll races, each vote lands with a blip, the winner gets a
 * sting (or the full PATHOGNOMONIC alarm).
 */
function useMatchupShow(matchup: MatchupView, phase: string, elapsed: number, read: ReturnType<typeof duelReadTiming>, onPhone: boolean) {
  // On phones the big beats are felt too: a heartbeat under the drumroll, a buzz for the winner.
  const buzz = (kind: 'tap' | 'success') => onPhone && haptic(kind);
  const fired = useRef(new Set<string>());
  const key = `${matchup.id}-${phase}`;
  const cue = (id: string, at: number, run: () => void) => {
    const k = `${key}:${id}`;
    if (elapsed >= at && !fired.current.has(k)) {
      fired.current.add(k);
      // Skip cues that are long past (a reconnecting stage shouldn't replay the whole show).
      if (elapsed - at < 1_500) run();
    }
  };
  useEffect(() => {
    if (phase === 'present') {
      cue('open', 0, () => play('whoosh'));
      if (matchup.finale) {
        matchup.entries.forEach((e, i) =>
          cue(`list-${i}`, 600 + i * GRAND_ROUNDS.presentPerList, () => play('pop')),
        );
      } else {
        cue('a', read.aAt, () => play('pop'));
        cue('b', read.bAt, () => play('pop'));
      }
    }
    if (phase === 'vote') cue('vote', 0, () => play('vote'));
    if (phase === 'results' && matchup.result) {
      const r = matchup.result;
      if (matchup.finale) {
        const timing = finaleRevealTiming(matchup.entries.length);
        cue('drum', 0, () => play('drumroll'));
        matchup.entries.forEach((_, rank) =>
          cue(`rank-${rank}`, timing.listAt(rank), () => {
            const last = rank === matchup.entries.length - 1;
            play(last ? (r.consensus ? 'pathognomonic' : 'win') : 'reveal');
            if (last && r.winner !== null) play('cheer');
            buzz(last ? 'success' : 'tap');
          }),
        );
      } else {
        const reveal = duelRevealTiming(r.playerVotes.length, r.consensus);
        cue('drum', 0, () => {
          play('drumroll');
          buzz('tap');
        });
        r.playerVotes.forEach((_, i) =>
          cue(`voter-${i}`, reveal.voterAt(i), () => {
            play('vote');
            buzz('tap');
          }),
        );
        cue('winner', reveal.winnerAt, () => {
          play(r.outcome === 'duplicate' ? 'buzz' : r.consensus ? 'pathognomonic' : r.winner === null ? 'tick' : 'reveal');
          if (r.winner !== null && r.outcome === 'vote') play(r.consensus ? 'cheer' : 'applause');
          buzz('success');
        });
      }
    }
  }, [phase, matchup.id, Math.floor(elapsed / 80)]); // eslint-disable-line react-hooks/exhaustive-deps
}
