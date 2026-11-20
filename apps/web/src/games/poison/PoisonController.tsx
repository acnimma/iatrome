'use client';

import { useState } from 'react';
import { LIMITS, type PoisonView, type RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { AnswerBox } from '@/components/ui/Field';
import { Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, nameOf, usePeople } from '@/components/room/RoomBits';
import { haptic } from '@/lib/haptics';
import styles from './Poison.module.css';

export function PoisonController({ view, game }: { view: RoomView; game: PoisonView }) {
  const room = useRoom();
  const people = usePeople(view);
  const me = view.you?.id ?? '';
  const playing = view.you?.inGame;
  const phase = game.phase.name;
  const defender = nameOf(people, game.defender);

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
      { side: 'b' as const, text: game.b, tone: 'sky' as const },
    ];
    const step = mine.side ? 'predict' : 'pick';
    if (mine.side && mine.predict) return <PhoneMessage icon="lock" title="Locked in">Waiting for everyone else…</PhoneMessage>;
    return (
      <PhoneStack>
        <PhonePrompt
          label={step === 'pick' ? 'Step 1 of 2' : 'Step 2 of 2'}
          prompt={step === 'pick' ? 'Would you rather…' : 'What did MOST people pick?'}
          phase={game.phase}
          pausedAt={view.pausedAt}
        />
        {options.map((o) => (
          <Choice
            key={o.side}
            tone={o.tone}
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

  if (phase === 'defend' && game.defender === me) return <Defend view={view} game={game} />;

  if (phase === 'defend' || phase === 'defence')
    return (
      <PhoneStack>
        {phase === 'defence' && !view.screen && game.defence ? (
          <div className={styles.phoneDefence}>
            <span className={styles.phoneDefenceLabel}>{defender}, in their defence</span>
            <blockquote>“{game.defence}”</blockquote>
          </div>
        ) : (
          <PhoneMessage icon="mic" title={phase === 'defend' ? `${defender} is in the minority` : 'Judge them'}>
            {phase === 'defend' ? 'They’re writing their defence.' : ''}
          </PhoneMessage>
        )}
        <ReactionBar />
      </PhoneStack>
    );

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
      <Button tone="rose" size="lg" block type="submit" disabled={!text.trim()}>
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
