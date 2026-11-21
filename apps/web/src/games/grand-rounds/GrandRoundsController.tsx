'use client';

import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type GrandRoundsView, LIMITS, type MatchupView, type RoomView, type TaskView, duelRevealTiming, finaleRevealTiming } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { AnswerBox, TextInput } from '@/components/ui/Field';
import { useAfter } from '@/components/ui/Later';
import { Confetti } from '@/components/ui/Confetti';
import { Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, Scoreboard, nameOf, usePeople } from '@/components/room/RoomBits';
import { StatButton, StatChip } from '@/components/room/Stat';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { ROUND_NAMES } from './rounds';
import { MatchupShow } from './GrandRoundsStage';
import styles from './GrandRounds.module.css';
import { Icon } from '@/components/icons/Icon';

export function GrandRoundsController({ view, game }: { view: RoomView; game: GrandRoundsView }) {
  const playing = view.you?.inGame;
  switch (game.phase.name) {
    case 'intro':
      return (
        <PhoneMessage icon={(['speech', 'pencil', 'clipboard'] as const)[game.round]} title={`Round ${game.round + 1}: ${ROUND_NAMES[game.round]}`}>
          {[game.multiplier > 1 && `${game.multiplier}× points.`, view.screen && 'Eyes on the big screen.'].filter(Boolean).join(' ')}
        </PhoneMessage>
      );
    case 'write':
      return playing ? (
        <WriteTasks view={view} game={game} />
      ) : (
        <PhoneMessage icon="pencil" title="Players are writing…">
          You’re not in this one. You still get a vote.
        </PhoneMessage>
      );
    case 'present':
    case 'vote':
    case 'results':
      return game.matchup ? <MatchupPhone view={view} game={game} matchup={game.matchup} /> : null;
    case 'scores': {
      const ranked = Object.entries(game.scores).sort((a, b) => b[1] - a[1]);
      const rank = ranked.findIndex(([id]) => id === view.you?.id) + 1;
      return (
        <PhoneStack>
          {view.screen ? (
            <PhoneMessage icon="list" title={rank ? `You’re #${rank}` : 'Scores are up'}>
              {rank ? `${(game.scores[view.you!.id] ?? 0).toLocaleString()} points so far.` : 'Check the big screen.'}
            </PhoneMessage>
          ) : (
            <>
              <h2 className={styles.phoneHeading}>{rank ? `You’re #${rank}` : 'The scores so far'}</h2>
              <Scoreboard view={view} scores={game.scores} previous={game.previousScores} limit={8} />
            </>
          )}
          <ReactionBar />
        </PhoneStack>
      );
    }
    default:
      return null;
  }
}

// ── Writing ──────────────────────────────────────────────────────────────────

function WriteTasks({ view, game }: { view: RoomView; game: GrandRoundsView }) {
  const open = game.tasks.filter((t) => !t.done);
  const [index, setIndex] = useState(0);
  const task = open[Math.min(index, open.length - 1)];

  if (!task) {
    const others = game.waitingOn.length;
    return (
      <PhoneStack>
        <PhoneMessage icon="check" title="All locked in!">
          {others ? `Waiting on ${others} other${others === 1 ? '' : 's'}…` : 'Here we go!'}
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );
  }

  const number = game.tasks.indexOf(task) + 1;
  return (
    <motion.div key={task.matchupId} className={styles.task} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
      <div className={styles.taskNav}>
        <span>
          Prompt {number} of {game.tasks.length}
        </span>
        <span className={styles.dots}>
          {game.tasks.map((t) => (
            <span key={t.matchupId} className={t.done ? styles.dotDone : t === task ? styles.dotNow : styles.dot} />
          ))}
        </span>
      </div>
      <PhonePrompt label="Finish this" prompt={task.prompt} phase={game.phase} pausedAt={view.pausedAt} />
      {view.stat.used === task.matchupId ? (
        <p className={styles.taskNav}>
          <StatChip /> Your Stat is on this prompt.
        </p>
      ) : (
        <StatButton view={view} target={task.matchupId} label="Stat this prompt ×2" />
      )}
      <QuipTask task={task} onSkip={open.length > 1 ? () => setIndex((i) => (i + 1) % open.length) : undefined} />
    </motion.div>
  );
}

/** Saves drafts as you type, so an answer still counts if the timer runs out. */
function useDraftSaver(send: (final: boolean) => void, deps: unknown[]) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => send(false), 700);
    return () => clearTimeout(t);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

function QuipTask({ task, onSkip }: { task: TaskView; onSkip?: () => void }) {
  const room = useRoom();
  const [text, setText] = useState(typeof task.draft === 'string' ? task.draft : '');
  const [confirming, setConfirming] = useState(false);
  const send = (final: boolean) => room.command({ type: 'answer', matchupId: task.matchupId, text, final });
  useDraftSaver(send, [text]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    haptic('success');
    send(true);
  };

  return (
    <form className={styles.task} onSubmit={submit}>
      <AnswerBox
        value={text}
        maxLength={LIMITS.quip}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) submit(e);
        }}
        placeholder="Your answer…"
        autoFocus
      />
      <div className={styles.taskActions}>
        <Button size="lg" type="submit" disabled={!text.trim()}>
          Lock it in
        </Button>
        {onSkip && (
          <Button tone="pearl" size="lg" onClick={onSkip} aria-label="Answer the other prompt first">
            Later
          </Button>
        )}
      </div>
      {/* Only offered on an empty answer, and it takes two taps: it replaces whatever you'd write. */}
      {!text.trim() && (
        <Button
          tone="ghost"
          block
          onClick={() => {
            if (!confirming) return setConfirming(true);
            play('reveal');
            room.command({ type: 'curbside', matchupId: task.matchupId });
          }}
        >
          <Icon name="stethoscope" size={26} /> {confirming ? 'Tap again. Beep’s answer, half points.' : 'Stuck? Use Beep’s answer (half points)'}
        </Button>
      )}
    </form>
  );
}

// ── Voting ───────────────────────────────────────────────────────────────────

function MatchupPhone({ view, game, matchup }: { view: RoomView; game: GrandRoundsView; matchup: MatchupView }) {
  const room = useRoom();
  const phase = game.phase.name;
  // The big screen reveals votes, then authors: don't let the phone announce the winner first.
  const r0 = matchup.result;
  const landsAt = !r0
    ? 0
    : matchup.finale
      ? finaleRevealTiming(matchup.entries.length).listAt(matchup.entries.length - 1)
      : duelRevealTiming(r0.playerVotes.length, r0.consensus).winnerAt;
  const heldBack = useAfter(phase === 'results' && view.screen ? landsAt : 0, `${matchup.id}-${phase}`);

  const sides = matchup.entries.map((_, i) => i);

  // No big screen: every phone becomes the stage for the read and the reveal.
  if (!view.screen && (phase === 'present' || (phase === 'results' && matchup.result)))
    return (
      <PhoneStack>
        <MatchupShow view={view} game={game} matchup={matchup} onPhone />
        {phase === 'results' && <ReactionBar />}
      </PhoneStack>
    );

  if (phase === 'present') {
    if (matchup.finale)
      return (
        <PhoneMessage icon="eye" title="Read everyone’s answers">
          Then pick your favourite. Yours doesn’t count.
        </PhoneMessage>
      );
    return matchup.yours !== null ? (
      <PhoneMessage icon="shush" title="This one’s yours">
        Keep a straight face.
      </PhoneMessage>
    ) : (
      <PhoneMessage icon="eye" title="Get ready to vote">
        {matchup.prompt}
      </PhoneMessage>
    );
  }

  if (phase === 'vote') {
    if (!matchup.finale && (matchup.yours !== null || !matchup.canVote)) {
      const title = matchup.yours !== null ? 'Votes are coming in…' : 'Players are voting';
      if (view.screen) return <PhoneMessage icon={matchup.yours !== null ? 'sweat' : 'popcorn'} title={title}>{matchup.yours !== null ? 'Don’t look at anyone. Especially the person who wrote the other one.' : ''}</PhoneMessage>;
      return (
        <PhoneStack>
          <PhonePrompt label={title} prompt={matchup.prompt} phase={game.phase} pausedAt={view.pausedAt} />
          {sides.map((side) => (
            <Choice key={side} tone="black" disabled>
              <VoteContent matchup={matchup} side={side} />
            </Choice>
          ))}
        </PhoneStack>
      );
    }
    if (!matchup.canVote)
      return <PhoneMessage icon="popcorn" title="Everyone’s voting" />;
    const options = sides.filter((side) => !matchup.entries[side].hidden && matchup.entries[side].text);
    if (matchup.finale) return <FinaleVote matchup={matchup} game={game} view={view} options={options} />;
    return (
      <PhoneStack>
        <PhonePrompt label="Vote for the best" prompt={matchup.prompt} phase={game.phase} pausedAt={view.pausedAt} />
        {options.map((side) => {
          const own = matchup.yours === side;
          return (
            <Choice
              key={side}
              tone={own ? 'pearl' : 'black'}
              disabled={own}
              picked={matchup.myVote === side}
              dimmed={own || (matchup.myVote !== null && matchup.myVote !== side)}
              onClick={() => {
                if (matchup.myVote !== null || own) return;
                haptic('success');
                play('vote');
                room.command({ type: 'vote', side });
              }}
            >
              <VoteContent matchup={matchup} side={side} />
              {own && <span className={styles.yours}>Yours</span>}
            </Choice>
          );
        })}
        {matchup.myVote !== null && <p className={styles.taskNav}>Vote locked in</p>}
      </PhoneStack>
    );
  }

  // Results
  const r = matchup.result;
  if (!heldBack) return <PhoneMessage icon="drum" title="Look up." />;
  if (matchup.yours !== null && r) {
    const mine = r.points[matchup.yours];
    const won = r.winner === matchup.yours;
    const sweep = won && r.consensus;
    return (
      <PhoneStack>
        {sweep && <Confetti pieces={90} />}
        <PhoneMessage icon={r.outcome === 'duplicate' ? 'upside-down' : won ? (sweep ? 'trophy' : 'party') : 'melt'} title={r.outcome === 'duplicate' ? 'Duplicate order' : sweep ? 'Pathognomonic!' : won ? 'You won the room' : 'Not this time'}>
          <span className={styles.outcome}>+{mine.toLocaleString()}</span>
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );
  }
  return (
    <PhoneStack>
      <PhoneMessage icon="drum" title="The results are in" />
      <ReactionBar />
    </PhoneStack>
  );
}

function VoteContent({ matchup, side }: { matchup: MatchupView; side: number }) {
  return <span>{matchup.entries[side].text}</span>;
}

/** The finale vote: three votes each, stack them on one list or spread them out. */
function FinaleVote({ matchup, game, view, options }: { matchup: MatchupView; game: GrandRoundsView; view: RoomView; options: number[] }) {
  const room = useRoom();
  const left = matchup.picksPerVoter - matchup.myPicks.length;
  const countOn = (side: number) => matchup.myPicks.filter((p) => p === side).length;
  return (
    <PhoneStack>
      <PhonePrompt
        label={left > 0 ? `${left} ${left === 1 ? 'vote' : 'votes'} left · stack them if you like` : 'Votes locked in'}
        prompt={matchup.prompt}
        phase={game.phase}
        pausedAt={view.pausedAt}
      />
      {options.map((side) => {
        const own = matchup.yours === side;
        const n = countOn(side);
        return (
          <Choice
            key={side}
            tone={own ? 'pearl' : 'black'}
            disabled={own}
            picked={n > 0}
            dimmed={own || (left === 0 && n === 0)}
            onClick={() => {
              if (own || left === 0) return;
              haptic(left === 1 ? 'success' : 'tap');
              play('vote');
              room.command({ type: 'vote', side });
            }}
          >
            <VoteContent matchup={matchup} side={side} />
            {own && <span className={styles.yours}>Yours</span>}
            {n > 0 && <span className={styles.stack}>×{n}</span>}
          </Choice>
        );
      })}
      {matchup.myPicks.length > 0 && (
        <Button
          tone="ghost"
          block
          onClick={() => {
            haptic('tap');
            room.command({ type: 'unvote' });
          }}
        >
          Take my votes back
        </Button>
      )}
    </PhoneStack>
  );
}
