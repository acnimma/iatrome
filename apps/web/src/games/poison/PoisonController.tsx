'use client';

import { motion } from 'motion/react';
import { POISON, type PoisonView, type RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, nameOf, usePeople } from '@/components/room/RoomBits';
import { StatButton } from '@/components/room/Stat';
import { TimerRing } from '@/components/ui/TimerRing';
import { haptic } from '@/lib/haptics';
import { useAfter } from '@/components/ui/Later';
import styles from './Poison.module.css';

type Side = 'a' | 'b';

export function PoisonController({ view, game }: { view: RoomView; game: PoisonView }) {
  const room = useRoom();
  const people = usePeople(view);
  const me = view.you?.id ?? '';
  const playing = view.you?.inGame;
  const phase = game.phase.name;
  const defender = nameOf(people, game.defender);
  const stepReady = useAfter(450, `${game.number}-${game.mine?.side ?? 'none'}`);
  const text = (s: Side | null | undefined) => (s === 'a' ? game.a : s === 'b' ? game.b : '');

  if (phase === 'intro')
    return (
      <PhoneMessage icon="game-poison" title="Pick Your Poison">
        Pick a side, then guess what everyone else picked.
      </PhoneMessage>
    );

  if (phase === 'final')
    return (
      <PhoneMessage icon="star" title="Final dilemma">
        Worth triple. Every point is still in play.
      </PhoneMessage>
    );

  if (phase === 'choose') {
    if (!playing)
      return view.screen ? (
        <PhoneMessage icon="popcorn" title="Watch the big screen" />
      ) : (
        <PhoneMessage icon="game-poison" title="Would you rather…">
          {game.a}. Or. {game.b}.
        </PhoneMessage>
      );
    const mine = game.mine ?? { side: null, predict: null };
    const options = [
      { side: 'a' as const, text: game.a, tone: 'rose' as const },
      { side: 'b' as const, text: game.b, tone: 'blue' as const },
    ];
    const step = mine.side ? 'predict' : 'pick';
    if (mine.side && mine.predict) return <PhoneMessage icon="lock" title="Locked in">Waiting for everyone else…</PhoneMessage>;
    return (
      <PhoneStack>
        <PhonePrompt
          label={`${game.multiplier > 1 ? 'Final dilemma · ×3 · ' : ''}${step === 'pick' ? 'Step 1 of 2' : 'Step 2 of 2'}`}
          prompt={step === 'pick' ? 'Would you rather…' : 'What did most of the OTHERS pick?'}
          phase={game.phase}
          pausedAt={view.pausedAt}
        />
        <StatButton view={view} />
        {options.map((o) => (
          <Choice
            key={`${step}-${o.side}`}
            tone={o.tone}
            // A double tap on step one shouldn't land on step two.
            disabled={!stepReady}
            onClick={() => {
              haptic('success');
              room.command({ type: step, side: o.side });
            }}
          >
            {o.text}
          </Choice>
        ))}
        {step === 'predict' && <p className={styles.note}>You picked: {text(mine.side)}. Your own pick doesn’t count.</p>}
      </PhoneStack>
    );
  }

  const mySide = (game.sides?.[me] ?? null) as Side | null;
  const minoritySide: Side | null = game.majority === 'a' ? 'b' : game.majority === 'b' ? 'a' : null;
  const inMajority = Boolean(playing && mySide && mySide === game.majority);
  const flipped = game.flips.includes(me);
  const isDefender = game.defender === me;
  const pay = game.pay;
  const myPoints = pay
    ? ([
        ['read the others', pay.read[me]],
        ['alone', pay.lone[me]],
        ['flips', pay.flips[me]],
        ['bet', pay.bet[me]],
      ] as const).filter(([, n]) => n)
    : [];
  const points = myPoints.length > 0 && (
    <div className={styles.phonePoints}>
      {myPoints.map(([why, n]) => (
        <span key={why}>
          +{n} {why}
        </span>
      ))}
    </div>
  );

  if (phase === 'bet') {
    if (isDefender)
      return (
        <PhoneStack>
          <PhoneMessage icon="mic" title="You’re up">
            You’re speaking for {text(minoritySide)}. Out loud, in a moment. Every switch pays.
          </PhoneMessage>
          <ReactionBar />
        </PhoneStack>
      );
    if (!inMajority)
      return (
        <PhoneStack>
          <PhoneMessage icon="mic" title={`${defender} has the floor next`}>
            {mySide === minoritySide ? 'They’re speaking for your side. Look supportive.' : 'The majority is placing bets.'}
          </PhoneMessage>
          <ReactionBar />
        </PhoneStack>
      );
    if (game.myBet !== null)
      return (
        <PhoneMessage icon="lock" title="Bet placed">
          {game.myBet ? 'You think someone caves.' : 'You think nobody budges.'}
        </PhoneMessage>
      );
    return (
      <PhoneStack>
        <PhonePrompt label={`Quick bet · +${POISON.betPoints * game.multiplier} if you call it`} prompt={`${defender} is about to defend it. Will anyone switch?`} phase={game.phase} pausedAt={view.pausedAt} />
        {/* The bet rides on `predict`: a = someone switches, b = nobody does. */}
        <Choice tone="gold" onClick={() => { haptic('success'); room.command({ type: 'predict', side: 'a' }); }}>
          Yes, someone caves
        </Choice>
        <Choice tone="sky" onClick={() => { haptic('success'); room.command({ type: 'predict', side: 'b' }); }}>
          No, nobody budges
        </Choice>
      </PhoneStack>
    );
  }

  if (phase === 'defence') {
    if (isDefender)
      return (
        <div className={styles.phoneFloor}>
          <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={96} ticks />
          <h2 className={styles.phoneFloorTitle}>Make your case. Out loud.</h2>
          <p className={styles.phoneFloorSide}>You’d rather {text(minoritySide)}.</p>
          <motion.span key={game.flips.length} className={styles.phoneCount} initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
            {game.flips.length}
          </motion.span>
          <p className={styles.phoneFloorSide}>{game.flips.length === 1 ? 'person switched' : 'people switched'}</p>
        </div>
      );
    if (inMajority && !flipped)
      return (
        <PhoneStack>
          <PhonePrompt label={`${defender} has the floor`} prompt={`They’d rather ${text(minoritySide)}.`} phase={game.phase} pausedAt={view.pausedAt} />
          <Button
            tone="gold"
            size="xl"
            block
            className={styles.convince}
            onClick={() => {
              haptic('success');
              room.command({ type: 'convinced' });
            }}
          >
            Convinced. I’m switching.
          </Button>
          <p className={styles.note}>You’d rather {text(mySide)}. For now.</p>
        </PhoneStack>
      );
    return (
      <PhoneStack>
        <PhoneMessage icon="mic" title={flipped ? 'Switched' : `${defender} has the floor`}>
          {flipped ? `You’re on ${defender}’s side now. They get the credit.` : 'Listen. React if you must.'}
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );
  }

  if (phase === 'verdict') {
    const others = game.flips.filter((id) => id !== me).length;
    const title = isDefender
      ? game.flips.length
        ? `You flipped ${game.flips.length}`
        : 'Nobody budged'
      : game.myBet !== null
        ? pay?.bet[me]
          ? 'Called it'
          : 'Bad bet'
        : game.flips.length
          ? `${game.flips.length} switched`
          : 'Nobody budged';
    return (
      <PhoneStack>
        <PhoneMessage icon={isDefender ? 'mic' : pay?.bet[me] ? 'target' : 'scales'} title={title}>
          {!isDefender && game.myBet !== null && (others ? `${others} switched.` : 'Nobody else switched.')}
          {points}
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );
  }

  // Reveal
  const read = pay?.read[me];
  const alone = pay?.lone[me];
  const title = alone ? 'Alone on this one' : read ? 'You read the room' : game.majority === 'tie' ? 'Dead even' : 'Misread the room';
  return (
    <PhoneStack>
      <PhoneMessage icon={alone ? 'mic' : read ? 'brain' : game.majority === 'tie' ? 'scales' : 'see-no-evil'} title={title}>
        {alone ? `Contrarian bonus, and an AMA tag (${game.ama[me] ?? 1} so far).` : ''}
        {points}
      </PhoneMessage>
      {!view.screen && game.counts && <Split a={game.a ?? ''} b={game.b ?? ''} counts={game.counts} />}
      <ReactionBar />
    </PhoneStack>
  );
}

/** How the room split, for phones with no big screen to look at. */
function Split({ a, b, counts }: { a: string; b: string; counts: { a: number; b: number } }) {
  const total = Math.max(1, counts.a + counts.b);
  return (
    <div className={styles.phoneSplit}>
      {(['a', 'b'] as const).map((side) => (
        <div key={side} className={`${styles.phoneSplitRow} ${side === 'a' ? styles.a : styles.b}`}>
          <span className={styles.phoneSplitFill} style={{ width: `${(counts[side] / total) * 100}%` }} />
          <span className={styles.phoneSplitText}>{side === 'a' ? a : b}</span>
          <strong>{Math.round((counts[side] / total) * 100)}%</strong>
        </div>
      ))}
    </div>
  );
}
