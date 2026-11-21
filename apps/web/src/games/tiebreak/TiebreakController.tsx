'use client';

import { useEffect } from 'react';
import type { RoomView, TiebreakView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Choice, Choices, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, nameOf, usePeople } from '@/components/room/RoomBits';
import { ANSWER_TONES, AnswerLetter } from '@/components/room/answers';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import styles from '../didactics/Didactics.module.css';

/** The secret tie-breaker on a phone: the tied players answer, everyone else cheers from the sidelines. */
export function TiebreakController({ view, game }: { view: RoomView; game: TiebreakView }) {
  const room = useRoom();
  const people = usePeople(view);
  const me = view.you?.id ?? '';
  const revealed = game.phase.name === 'reveal';
  useEffect(() => {
    if (!revealed || !game.inIt) return;
    const t = setTimeout(() => play(game.winner === me ? 'win' : game.right.includes(me) ? 'ding' : 'wrong'), 450);
    return () => clearTimeout(t);
  }, [revealed, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  const names = game.contenders.map((id) => nameOf(people, id)).join(' & ');

  if (game.phase.name === 'intro')
    return (
      <PhoneStack>
        <PhoneMessage icon="hourglass" title="Sudden death">
          {game.inIt ? 'It’s a tie, and you’re in it. One question. The fastest right answer wins.' : `${names} are tied for first. One trivia question decides it. Eyes up.`}
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );

  if (!game.inIt) {
    return (
      <PhoneStack>
        <PhoneMessage icon="hourglass" title="Sudden death">
          {revealed ? (game.winner ? `${nameOf(people, game.winner)} takes it!` : 'Nobody got it.') : `${names} are settling a tie. Watch the big screen.`}
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );
  }

  if (revealed) {
    const won = game.winner === me;
    return (
      <PhoneStack>
        <PhoneMessage icon={won ? 'trophy' : game.right.includes(me) ? 'target' : 'sweat'} title={won ? 'You win it!' : game.winner ? `${nameOf(people, game.winner)} takes it` : 'Nobody got it'}>
          {won ? 'Fastest right answer. First place is yours.' : game.winner ? (game.right.includes(me) ? 'Right, but not first.' : 'Not this time.') : 'Another question, or the tie stands.'}
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );
  }

  return (
    <PhoneStack>
      <PhonePrompt label={game.number > 1 ? `Sudden death · round ${game.number}` : 'Sudden death · fastest right answer wins'} prompt={game.question ?? ''} phase={game.phase} pausedAt={view.pausedAt} />
      <Choices layout="grid" label="Answers">
        {game.options.map((option, i) => (
          <Choice
            key={i}
            tone={ANSWER_TONES[i]}
            picked={game.myAnswer === i}
            dimmed={!game.canPick && game.myAnswer !== i}
            onClick={() => {
              if (!game.canPick) return;
              haptic('success');
              room.command({ type: 'pick-option', option: i });
            }}
          >
            <AnswerLetter index={i} />
            <span className={styles.phoneOption}>{option}</span>
          </Choice>
        ))}
      </Choices>
      <p className={styles.locked}>{game.myAnswer !== null ? 'Locked in. Waiting on the others.' : ''}</p>
    </PhoneStack>
  );
}
