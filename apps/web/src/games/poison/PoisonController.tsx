'use client';

import { useState } from 'react';
import { LIMITS, type PoisonView, type RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { AnswerBox } from '@/components/ui/Field';
import { Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, nameOf, usePeople } from '@/components/room/RoomBits';
import { StatButton } from '@/components/room/Stat';
import { haptic } from '@/lib/haptics';
import { useAfter } from '@/components/ui/Later';
import styles from './Poison.module.css';

export function PoisonController({ view, game }: { view: RoomView; game: PoisonView }) {
  const room = useRoom();
  const people = usePeople(view);
  const me = view.you?.id ?? '';
  const playing = view.you?.inGame;
  const phase = game.phase.name;
  const defender = nameOf(people, game.defender);
  const stepReady = useAfter(450, `${game.number}-${game.mine?.side ?? 'none'}`);

  if (phase === 'intro')
    return (
      <PhoneMessage icon="game-poison" title="Pick Your Poison">
        Pick a side, then read the room.
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
    // A double tap on step one shouldn't land on step two.
    const ready = stepReady;
    if (mine.side && mine.predict) return <PhoneMessage icon="lock" title="Locked in">Waiting for everyone else…</PhoneMessage>;
    return (
      <PhoneStack>
        <PhonePrompt
          label={`${game.multiplier > 1 ? 'Final dilemma · ×3 · ' : ''}${step === 'pick' ? 'Step 1 of 2' : 'Step 2 of 2'}`}
          prompt={step === 'pick' ? 'Would you rather…' : 'What did MOST people pick?'}
          phase={game.phase}
          pausedAt={view.pausedAt}
        />
        <StatButton view={view} />
        {options.map((o) => (
          <Choice
            key={`${step}-${o.side}`}
            tone={o.tone}
            disabled={!ready}
            onClick={() => {
              haptic('success');
              room.command({ type: step, side: o.side });
            }}
          >
            {o.text}
          </Choice>
        ))}
        {step === 'predict' && <p className={styles.note}>You picked: {mine.side === 'a' ? game.a : game.b}</p>}
      </PhoneStack>
    );
  }

  const mySide = game.sides?.[me] ?? null;
  const inMinority = Boolean(mySide && (game.majority === 'a' || game.majority === 'b') && mySide !== game.majority);

  if (phase === 'volunteer')
    return inMinority ? (
      <PhoneStack>
        <PhoneMessage icon="mic" title="You’re in the minority">
          Want to defend it? Nobody has to. You earn points for everyone you convince.
        </PhoneMessage>
        <Button size="xl" block onClick={() => { haptic('success'); room.command({ type: 'volunteer' }); }}>
          Defend it
        </Button>
      </PhoneStack>
    ) : (
      <PhoneMessage icon="mic" title="Any defenders?">
        Waiting to see if the minority wants to explain itself.
      </PhoneMessage>
    );

  if (phase === 'defend' && game.defender === me) return <Defend view={view} game={game} />;

  if (phase === 'defend')
    return (
      <PhoneStack>
        <PhoneMessage icon="mic" title={`${defender} is defending it`}>
          They’re writing. Brace yourself.
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );

  if (phase === 'defence') {
    const canConvince = playing && game.defender !== me && mySide === game.majority;
    const convinced = game.converts.includes(me);
    return (
      <PhoneStack>
        {!view.screen && game.defence ? (
          <div className={styles.phoneDefence}>
            <span className={styles.phoneDefenceLabel}>{defender}, in their defence</span>
            <blockquote>“{game.defence}”</blockquote>
          </div>
        ) : (
          <PhoneMessage icon="mic" title={game.defender === me ? 'Your defence is up' : `${defender}’s defence is up`} />
        )}
        {canConvince && (
          <Button tone={convinced ? 'pearl' : 'gold'} size="lg" block disabled={convinced} onClick={() => { haptic('success'); room.command({ type: 'convinced' }); }}>
            {convinced ? 'Convinced. Noted.' : 'Convinced'}
          </Button>
        )}
        <ReactionBar />
      </PhoneStack>
    );
  }

  // Reveal
  const earned = game.earned[me];
  return (
    <PhoneStack>
      <PhoneMessage icon={earned ? 'brain' : game.majority === 'tie' ? 'scales' : 'see-no-evil'} title={earned ? 'You read the room!' : game.majority === 'tie' ? 'Dead even' : 'Misread the room'}>
        {earned ? `+${earned} points` : ''}
      </PhoneMessage>
      {!view.screen && game.counts && <Split a={game.a ?? ''} b={game.b ?? ''} counts={game.counts} />}
      <ReactionBar />
    </PhoneStack>
  );
}

function Defend({ view, game }: { view: RoomView; game: PoisonView }) {
  const room = useRoom();
  const [text, setText] = useState('');
  const side = game.sides?.[view.you!.id];
  return (
    <form
      className={styles.defend}
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        haptic('success');
        room.command({ type: 'defend', text });
      }}
    >
      <PhonePrompt label="You’re in the minority!" prompt={`Defend: you’d rather ${side === 'a' ? game.a : game.b}.`} phase={game.phase} pausedAt={view.pausedAt} />
      <AnswerBox value={text} maxLength={LIMITS.defence} onChange={(e) => setText(e.target.value)} placeholder="Make your case…" autoFocus />
      <Button size="lg" block type="submit" disabled={!text.trim()}>
        Rest my case
      </Button>
    </form>
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
