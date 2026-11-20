'use client';

import type { DidacticsView, RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar } from '@/components/ui/Avatar';
import { Choice, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, usePeople } from '@/components/room/RoomBits';
import { haptic } from '@/lib/haptics';
import { LETTERS, teamTone } from './teams';
import styles from './Didactics.module.css';

export function DidacticsController({ view, game }: { view: RoomView; game: DidacticsView }) {
  const room = useRoom();
  const people = usePeople(view);
  const team = game.teams.find((t) => t.id === game.myTeam) ?? null;
  const tone = team ? teamTone(team.color) : 'var(--card)';
  const badge = team && (
    <div className={styles.myTeam} style={{ '--tone': tone } as React.CSSProperties}>
      {team.name}
    </div>
  );

  switch (game.phase.name) {
    case 'intro':
      return (
        <PhoneMessage icon="game-didactics" title="Didactics Mode">
          You’ll be put on a team. Answer on your phone, your team scores together.
        </PhoneMessage>
      );
    case 'teams':
      return team ? (
        <PhoneStack>
          <div className={styles.teamCard} style={{ '--tone': tone } as React.CSSProperties}>
            <span className={styles.teamCardLabel}>You’re on</span>
            <span className={styles.teamCardName}>{team.name}</span>
            <div className={styles.teamCardMates}>
              {team.members.map((id) => {
                const p = people.get(id);
                return p ? <Avatar key={id} avatar={p.avatar} size={40} name={p.name} /> : null;
              })}
            </div>
          </div>
        </PhoneStack>
      ) : null;
    case 'question':
      return (
        <PhoneStack>
          {badge}
          <PhonePrompt label={game.lightning ? 'Double points' : `Question ${game.number} of ${game.total}`} prompt={game.question ?? ''} phase={game.phase} pausedAt={view.pausedAt} />
          {game.options.map((option, i) => (
            <Choice
              key={i}
              tone={(['blue', 'rose', 'gold', 'sky'] as const)[i]}
              picked={game.myAnswer === i}
              dimmed={game.myAnswer !== null && game.myAnswer !== i}
              onClick={() => {
                if (game.myAnswer !== null) return;
                haptic('success');
                room.command({ type: 'pick-option', option: i });
              }}
            >
              <span className={styles.phoneLetter}>{LETTERS[i]}</span>
              <span className={styles.phoneOption}>{option}</span>
            </Choice>
          ))}
          {game.myAnswer !== null && <p className={styles.locked}>Locked in. Waiting for everyone else.</p>}
        </PhoneStack>
      );
    case 'reveal': {
      const right = game.myAnswer !== null && game.myAnswer === game.answer;
      const result = team && game.last?.perTeam[team.id];
      return (
        <PhoneStack>
          {badge}
          <PhoneMessage icon={right ? 'target' : game.myAnswer === null ? 'sleep' : 'sweat'} title={right ? 'You got it!' : game.myAnswer === null ? 'No answer' : 'Not quite'}>
            The answer was {LETTERS[game.answer ?? 0]}: {game.options[game.answer ?? 0]}
            {result ? `. Your team: ${result.right} of ${result.of} right, +${result.points}.` : '.'}
          </PhoneMessage>
          <ReactionBar />
        </PhoneStack>
      );
    }
    case 'standings': {
      const ranked = game.teams.slice().sort((a, b) => b.score - a.score);
      const place = team ? ranked.findIndex((t) => t.id === team.id) + 1 : 0;
      return (
        <PhoneStack>
          {badge}
          <PhoneMessage icon={place === 1 ? 'trophy' : 'list'} title={place === 1 ? 'Your team is winning!' : place ? `Your team is #${place}` : 'Scores are up'}>
            {team ? `${team.score.toLocaleString()} points so far.` : 'Check the big screen.'}
          </PhoneMessage>
          <ReactionBar />
        </PhoneStack>
      );
    }
    default:
      return null;
  }
}
