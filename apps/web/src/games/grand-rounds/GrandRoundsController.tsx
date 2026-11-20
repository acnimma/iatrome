'use client';

import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type Drawing, type GrandRoundsView, LIMITS, type MatchupView, type RoomView, type TaskView } from '@iatrome/game/client';
import { useDrawing, useRoom } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { AnswerBox, TextInput } from '@/components/ui/Field';
import { DrawPad } from '@/components/drawing/DrawPad';
import { DrawingView } from '@/components/drawing/DrawingView';
import { Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar } from '@/components/room/RoomBits';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { ROUND_NAMES } from './rounds';
import styles from './GrandRounds.module.css';
import { Icon } from '@/components/icons/Icon';

export function GrandRoundsController({ view, game }: { view: RoomView; game: GrandRoundsView }) {
  const playing = view.you?.inGame;
  switch (game.phase.name) {
    case 'intro':
      return (
        <PhoneMessage icon={(['speech', 'pencil', 'clipboard'] as const)[game.round]} title={`Round ${game.round + 1}: ${ROUND_NAMES[game.round]}`}>
          {game.multiplier > 1 ? `${game.multiplier}× points. ` : ''}Eyes on the big screen.
        </PhoneMessage>
      );
    case 'write':
      return playing ? <WriteTasks view={view} game={game} /> : <PhoneMessage icon="pencil" title="Players are writing…">You’ll vote on their answers in a moment.</PhoneMessage>;
    case 'present':
    case 'vote':
    case 'results':
      return game.matchup ? <MatchupPhone view={view} game={game} matchup={game.matchup} /> : null;
    case 'scores': {
      const ranked = Object.entries(game.scores).sort((a, b) => b[1] - a[1]);
      const rank = ranked.findIndex(([id]) => id === view.you?.id) + 1;
      return (
        <PhoneStack>
          <PhoneMessage icon="list" title={rank ? `You’re #${rank}` : 'Scores are up'}>
            {rank ? `${(game.scores[view.you!.id] ?? 0).toLocaleString()} points so far.` : 'Check the big screen.'}
          </PhoneMessage>
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
      <PhonePrompt label={task.kind === 'doodle' ? 'Draw this' : task.kind === 'differential' ? 'List three' : 'Finish this'} prompt={task.prompt} phase={game.phase} pausedAt={view.pausedAt} />
      {task.kind === 'quip' && <QuipTask task={task} onSkip={open.length > 1 ? () => setIndex((i) => (i + 1) % open.length) : undefined} />}
      {task.kind === 'doodle' && <DoodleTask task={task} />}
      {task.kind === 'differential' && <ListTask task={task} />}
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
        <Button tone="rose" size="lg" type="submit" disabled={!text.trim()}>
          Lock it in
        </Button>
        {onSkip && (
          <Button tone="card" size="lg" onClick={onSkip} aria-label="Answer the other prompt first">
            ↷
          </Button>
        )}
      </div>
      <Button
        tone="ghost"
        block
        onClick={() => {
          play('reveal');
          room.command({ type: 'curbside', matchupId: task.matchupId });
        }}
      >
        <Icon name="stethoscope" size={26} /> Stuck? Curbside consult (half points)
      </Button>
    </form>
  );
}

function DoodleTask({ task }: { task: TaskView }) {
  const room = useRoom();
  const drawing = useRef<Drawing>({ strokes: [] });
  const [count, setCount] = useState(0);
  const send = (final: boolean) => room.command({ type: 'doodle', matchupId: task.matchupId, drawing: drawing.current, final });
  // Autosave every few seconds of drawing, so nothing is lost if the timer runs out.
  useEffect(() => {
    if (!count) return;
    const t = setTimeout(() => send(false), 2500);
    return () => clearTimeout(t);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.task}>
      <DrawPad
        onChange={(d) => {
          drawing.current = d;
          setCount((c) => c + 1);
        }}
      />
      <Button
        tone="rose"
        size="lg"
        block
        disabled={!drawing.current.strokes.length}
        onClick={() => {
          haptic('success');
          send(true);
        }}
      >
        Lock in my masterpiece
      </Button>
    </div>
  );
}

function ListTask({ task }: { task: TaskView }) {
  const room = useRoom();
  const initial = Array.isArray(task.draft) ? task.draft : [];
  const [items, setItems] = useState<string[]>([initial[0] ?? '', initial[1] ?? '', initial[2] ?? '']);
  const send = (final: boolean) => room.command({ type: 'list', matchupId: task.matchupId, items, final });
  useDraftSaver(send, [items.join('\u0000')]);
  const complete = items.every((s) => s.trim());

  return (
    <form
      className={styles.task}
      onSubmit={(e) => {
        e.preventDefault();
        if (!complete) return;
        haptic('success');
        send(true);
      }}
    >
      <div className={styles.listInputs}>
        {items.map((value, i) => (
          <TextInput
            key={i}
            value={value}
            maxLength={LIMITS.differentialItem}
            placeholder={['First…', 'Second…', 'And the punchline…'][i]}
            onChange={(e) => setItems((all) => all.map((x, j) => (j === i ? e.target.value : x)))}
            autoFocus={i === 0}
            enterKeyHint={i < 2 ? 'next' : 'send'}
          />
        ))}
      </div>
      <Button tone="rose" size="lg" block type="submit" disabled={!complete}>
        Lock in my differential
      </Button>
    </form>
  );
}

// ── Voting ───────────────────────────────────────────────────────────────────

function MatchupPhone({ view, game, matchup }: { view: RoomView; game: GrandRoundsView; matchup: MatchupView }) {
  const room = useRoom();
  const phase = game.phase.name;

  if (phase === 'present') {
    return matchup.yours !== null ? (
      <PhoneMessage icon="shush" title="This one’s yours">
        Look innocent. Don’t give it away.
      </PhoneMessage>
    ) : (
      <PhoneMessage icon="eye" title="Get ready to vote">
        {matchup.prompt}
      </PhoneMessage>
    );
  }

  if (phase === 'vote') {
    if (matchup.yours !== null)
      return (
        <PhoneMessage icon="sweat" title="Votes are coming in…">
          Keep a straight face.
        </PhoneMessage>
      );
    if (!matchup.canVote) return <PhoneMessage icon="popcorn" title="Watch the big screen" />;
    return (
      <PhoneStack>
        <PhonePrompt label="Vote for the best" prompt={matchup.prompt} phase={game.phase} pausedAt={view.pausedAt} />
        {([0, 1] as const).map((side) => (
          <Choice
            key={side}
            tone={side === 0 ? 'rose' : 'sky'}
            picked={matchup.myVote === side}
            dimmed={matchup.myVote !== null && matchup.myVote !== side}
            onClick={() => {
              if (matchup.myVote !== null) return;
              haptic('success');
              play('vote');
              room.command({ type: 'vote', side });
            }}
          >
            <VoteContent matchup={matchup} side={side} />
          </Choice>
        ))}
        {matchup.myVote !== null && <p className={styles.taskNav}>Vote locked in</p>}
      </PhoneStack>
    );
  }

  // Results
  const r = matchup.result;
  if (matchup.yours !== null && r) {
    const mine = r.points[matchup.yours];
    const won = r.winner === matchup.yours;
    return (
      <PhoneStack>
        <PhoneMessage icon={r.outcome === 'duplicate' ? 'upside-down' : won ? (r.consensus ? 'trophy' : 'party') : 'melt'} title={r.outcome === 'duplicate' ? 'Duplicate order!' : won ? 'You won the room!' : 'Not this time'}>
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

function VoteContent({ matchup, side }: { matchup: MatchupView; side: 0 | 1 }) {
  const entry = matchup.entries[side];
  const drawing = useDrawing(entry.drawingId);
  const list = useMemo(() => entry.items ?? [], [entry.items]);
  if (matchup.kind === 'doodle')
    return (
      <span className={styles.voteChoice}>
        <DrawingView drawing={drawing} className={styles.voteDoodle} />
      </span>
    );
  if (matchup.kind === 'differential')
    return (
      <ol className={styles.voteList}>
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  return <span>{entry.text}</span>;
}
