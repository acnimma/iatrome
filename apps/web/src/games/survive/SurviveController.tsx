'use client';

import type { RoomView, SurviveView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { AnswerCard, Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar } from '@/components/room/RoomBits';
import { StatButton } from '@/components/room/Stat';
import { haptic } from '@/lib/haptics';
import { ANSWER_TONES, AnswerLetter, LETTERS } from '@/components/room/answers';
import styles from './Survive.module.css';

export function SurviveController({ view, game }: { view: RoomView; game: SurviveView }) {
  const room = useRoom();
  const me = view.you?.id ?? '';
  const playing = me in game.coffees;
  const out = me in game.clockedOut;

  if (game.phase.name === 'intro')
    return (
      <PhoneMessage icon="coffee" title="Survive the Shift">
        Two coffees. Don’t run out.
      </PhoneMessage>
    );

  if (game.phase.name === 'question') {
    if (!playing && view.screen) return <PhoneMessage icon="popcorn" title="Watch the big screen" />;
    if (!playing)
      return (
        <PhoneStack>
          <PhonePrompt label={`Question ${game.number}`} prompt={game.question ?? ''} phase={game.phase} pausedAt={view.pausedAt} />
          {game.options.map((option, i) => (
            <Choice key={i} tone={ANSWER_TONES[i]} disabled>
              <AnswerLetter index={i} />
              <span>{option}</span>
            </Choice>
          ))}
        </PhoneStack>
      );
    return (
      <PhoneStack>
        <PhonePrompt
          label={out ? 'Ghost mode · half points · 3 right in a row gets you back' : `${game.lastCall ? 'Last call · double points' : `Question ${game.number}`} · ${game.coffees[me]} ${game.coffees[me] === 1 ? 'coffee' : 'coffees'} left`}
          prompt={game.question ?? ''}
          phase={game.phase}
          pausedAt={view.pausedAt}
        />
        <StatButton view={view} />
        {game.options.map((option, i) => (
          <Choice
            key={i}
            tone={ANSWER_TONES[i]}
            picked={game.myAnswer === i}
            dimmed={game.myAnswer !== null && game.myAnswer !== i}
            onClick={() => {
              if (game.myAnswer !== null) return;
              haptic('success');
              room.command({ type: 'pick-option', option: i });
            }}
          >
            <AnswerLetter index={i} />
            <span>{option}</span>
          </Choice>
        ))}
      </PhoneStack>
    );
  }

  // Reveal
  const right = game.myAnswer !== null && game.myAnswer === game.answer;
  const lostCoffee = game.last?.lostCoffee.includes(me);
  const justOut = game.last?.clockedOut.includes(me);
  const backIn = game.last?.revived.includes(me);
  const points = game.last?.points[me];
  return (
    <PhoneStack>
      {!playing ? (
        <PhoneMessage icon="clipboard" title={`Answer: ${LETTERS[game.answer ?? 0]}`} />
      ) : backIn ? (
        <PhoneMessage icon="coffee" title="Back on shift">
          Someone found you a coffee. Try to keep this one.
        </PhoneMessage>
      ) : justOut ? (
        <PhoneMessage icon="ghost" title="You clocked out">
          Keep answering as a ghost for half points.
        </PhoneMessage>
      ) : right ? (
        <PhoneMessage icon="target" title="Correct!">
          +{points ?? 0} points
        </PhoneMessage>
      ) : (
        <PhoneMessage icon={lostCoffee ? 'heart-broken' : 'sweat'} title={lostCoffee ? 'Lost a coffee' : 'Missed it'}>
          {lostCoffee ? `${game.coffees[me]} left.` : game.last?.mercy ? 'Mercy rule: nobody loses a coffee.' : out ? 'Ghosts don’t lose coffee.' : ''}
        </PhoneMessage>
      )}
      {!view.screen && <AnswerCard letter={LETTERS[game.answer ?? 0]} text={game.options[game.answer ?? 0]} fact={game.fact} />}
      <ReactionBar />
    </PhoneStack>
  );
}
