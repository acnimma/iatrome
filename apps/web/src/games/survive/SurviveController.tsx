'use client';

import type { RoomView, SurviveView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar } from '@/components/room/RoomBits';
import { haptic } from '@/lib/haptics';
import { LETTERS, OPTION_TONES } from './SurviveStage';
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
    if (!playing) return <PhoneMessage icon="popcorn" title="Watch the big screen" />;
    return (
      <PhoneStack>
        <PhonePrompt label={out ? 'Ghost mode · half points' : `Question ${game.number}`} prompt={game.question ?? ''} phase={game.phase} pausedAt={view.pausedAt} />
        {game.options.map((option, i) => (
          <Choice
            key={i}
            tone={OPTION_TONES[i]}
            picked={game.myAnswer === i}
            dimmed={game.myAnswer !== null && game.myAnswer !== i}
            onClick={() => {
              if (game.myAnswer !== null) return;
              haptic('success');
              room.command({ type: 'pick-option', option: i });
            }}
          >
            <span className={styles.phoneLetter}>{LETTERS[i]}</span>
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
  const points = game.last?.points[me];
  return (
    <PhoneStack>
      {!playing ? (
        <PhoneMessage icon="clipboard" title={`Answer: ${LETTERS[game.answer ?? 0]}`} />
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
      <ReactionBar />
    </PhoneStack>
  );
}
