'use client';

import { DIDACTICS, type DidacticsView, type RoomView } from '@iatrome/game/client';
import { useEffect, useRef } from 'react';
import { play } from '@/lib/sound';
import { useRoom } from '@/realtime/use-room';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Avatar } from '@/components/ui/Avatar';
import { AnswerCard, Choice, Choices, PhoneMessage, PhonePrompt, PhoneStack } from '@/components/controller/Phone';
import { ReactionBar, nameOf, usePeople } from '@/components/room/RoomBits';
import { StatButton } from '@/components/room/Stat';
import { haptic } from '@/lib/haptics';
import { teamTone } from './teams';
import { ANSWER_TONES, AnswerLetter, LETTERS } from '@/components/room/answers';
import { bonusText, calloutText, nextUp, pctLabel, swingText } from './copy';
import styles from './Didactics.module.css';

export function DidacticsController({ view, game }: { view: RoomView; game: DidacticsView }) {
  const room = useRoom();
  const people = usePeople(view);
  const team = game.teams.find((t) => t.id === game.myTeam) ?? null;
  const tone = team ? teamTone(team.color) : 'var(--card)';
  // Your own answer, as it lands.
  const revealing = game.phase.name === 'reveal';
  useEffect(() => {
    if (!revealing || game.myAnswer === null) return;
    const t = setTimeout(() => play(game.myAnswer === game.answer ? 'ding' : 'wrong'), 450);
    return () => clearTimeout(t);
  }, [revealing, game.number]); // eslint-disable-line react-hooks/exhaustive-deps
  const streakChip = game.myStreak >= 2 && <div className={styles.streakChip}>{game.myStreak} in a row</div>;
  const badge = team && (
    <>
      {!game.solo && (
        <div className={styles.myTeam} style={{ '--tone': tone } as React.CSSProperties}>
          {team.name}
        </div>
      )}
      {streakChip}
    </>
  );

  switch (game.phase.name) {
    case 'intro':
      return (
        <PhoneMessage icon="game-didactics" title="Didactics Mode">
          {game.solo
            ? 'Everyone for themselves. Streaks and the fastest right answer earn bonus points.'
            : 'You’ll be put on a team. Answer on your phone, then huddle: you see your team’s split and can switch once.'}
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
          <TeamNamer key={team.name} current={team.name} />
        </PhoneStack>
      ) : null;
    case 'lightning':
      return (
        <PhoneMessage icon="hourglass" title="Lightning round">
          {DIDACTICS.lightningQuestion / 1000} seconds a question. Double points. No huddle, so no committee.
        </PhoneMessage>
      );
    case 'wager':
      return <Wager view={view} game={game} badge={badge} />;
    case 'question':
    case 'huddle': {
      const huddle = game.phase.name === 'huddle';
      const label = huddle ? 'Huddle · switch once' : game.final ? 'Final question · wagered' : game.lightning ? 'Lightning · double points' : `Question ${game.number} of ${game.total}`;
      return (
        <PhoneStack>
          {badge}
          <PhonePrompt label={label} prompt={game.question ?? ''} phase={game.phase} pausedAt={view.pausedAt} />
          {!huddle && <StatButton view={view} label="Call your Stat: your answer counts twice" />}
          <Choices layout="grid" label="Answers">
            {game.options.map((option, i) => (
              <Choice
                key={i}
                tone={ANSWER_TONES[i]}
                picked={game.myAnswer === i}
                dimmed={!game.canPick && game.myAnswer !== i}
                onClick={() => {
                  if (!game.canPick || game.myAnswer === i) return;
                  haptic('success');
                  if (game.phase.name === 'huddle') play('switch');
                  room.command({ type: 'pick-option', option: i });
                }}
              >
                <AnswerLetter index={i} />
                <span className={styles.phoneOption}>{option}</span>
                {game.teamPicks && game.teamPicks[i] > 0 && (
                  <span className={styles.teamCount} aria-label={`${game.teamPicks[i]} on your team`}>
                    ×{game.teamPicks[i]}
                  </span>
                )}
              </Choice>
            ))}
          </Choices>
          <p className={styles.locked}>
            {huddle
              ? game.myAnswer === null
                ? 'Time’s up. Answer now, no bonus.'
                : game.mySwitched
                  ? 'Switched. Final answer.'
                  : 'Your team’s split. Switch once.'
              : game.myAnswer !== null
                ? game.lightning
                  ? 'Locked in. No huddle now.'
                  : 'Locked in. Huddle next.'
                : ''}
          </p>
        </PhoneStack>
      );
    }
    case 'reveal': {
      const right = game.myAnswer !== null && game.myAnswer === game.answer;
      const result = team && game.last?.perTeam[team.id];
      return (
        <PhoneStack>
          {badge}
          <PhoneMessage icon={right ? 'target' : game.myAnswer === null ? 'sleep' : 'sweat'} title={right ? 'You got it!' : game.myAnswer === null ? 'No answer' : 'Not quite'}>
            The answer was {LETTERS[game.answer ?? 0]}: {game.options[game.answer ?? 0]}
            {result ? (game.solo ? `. +${result.points}.` : `. Your team: ${result.right} of ${result.of} right, +${result.points}.`) : '.'}
          </PhoneMessage>
          {view.you && game.last?.bonus[view.you.id] && <p className={styles.bonusLine}>{bonusText(game.last.bonus[view.you.id])}</p>}
          {result?.wager && (
            <p className={`${styles.swingLine} ${result.wager.swing < 0 ? styles.swingDown : ''}`}>
              {pctLabel(result.wager.pct)} wagered: {swingText(result.wager.swing)}
            </p>
          )}
          {!view.screen && game.callout && <p className={styles.phoneCallout}>{calloutText(game.callout, game.options)}</p>}
          {!view.screen && game.fact && <AnswerCard fact={game.fact} />}
          <ReactionBar />
        </PhoneStack>
      );
    }
    case 'standings': {
      const ranked = game.teams.slice().sort((a, b) => b.score - a.score);
      const place = team ? ranked.findIndex((t) => t.id === team.id) + 1 : 0;
      const next = nextUp(game);
      return (
        <PhoneStack>
          {badge}
          <PhoneMessage icon={place === 1 ? 'trophy' : 'list'} title={place === 1 ? (game.solo ? 'You’re winning' : 'Your team is winning') : place ? (game.solo ? `You’re #${place}` : `Your team is #${place}`) : 'Scores are up'}>
            {team ? `${team.score.toLocaleString()} points so far.` : view.screen ? 'Check the big screen.' : ''}
            {next ? ` Next: ${next}.` : ''}
          </PhoneMessage>
          {!view.screen && (
            <ol className={styles.phoneStandings}>
              {ranked.map((t, i) => (
                <li key={t.id} style={{ '--tone': teamTone(t.color) } as React.CSSProperties}>
                  <span>{i + 1}</span>
                  <strong>{t.name}</strong>
                  <span>{t.score.toLocaleString()}</span>
                </li>
              ))}
            </ol>
          )}
          <ReactionBar />
        </PhoneStack>
      );
    }
    default:
      return null;
  }
}

/** The final wager: the captain bets a share of the team's score; everyone else watches them sweat. */
function Wager({ view, game, badge }: { view: RoomView; game: DidacticsView; badge: React.ReactNode }) {
  const room = useRoom();
  const people = usePeople(view);
  const mine = game.myTeam ? game.wager?.teams[game.myTeam] : undefined;
  if (!mine) return <PhoneMessage icon="scales" title="Final wager">The captains are betting. Stand back.</PhoneMessage>;
  const captain = nameOf(people, mine.captain);
  const hard = ['', 'an easy one', 'a medium one', 'a hard one'][game.wager?.difficulty ?? 2];
  if (!game.youCaptain)
    return (
      <PhoneStack>
        {badge}
        <PhoneMessage icon="scales" title={`${captain} is betting`}>
          {mine.pct === null ? `Your captain is deciding how much of your ${mine.stake.toLocaleString()} to bet on the final question. It’s ${hard}.` : `${captain} bet ${pctLabel(mine.pct)}. Your team’s majority answer decides it.`}
        </PhoneMessage>
        <ReactionBar />
      </PhoneStack>
    );
  return (
    <PhoneStack>
      {badge}
      <div className={styles.wagerHead}>
        <span className={styles.wagerLabel}>{game.solo ? 'Place your bet' : 'You’re the captain'}</span>
        <h2 className={styles.wagerTitle}>Bet on the final</h2>
        <p>
          {game.solo ? `It’s ${hard}. Right adds the bet, wrong takes it away.` : `It’s ${hard}. Your team’s majority answer decides it. Right adds the bet, wrong takes it away.`}
        </p>
      </div>
      {(game.wager?.options ?? []).map((pct, i) => (
        <Choice key={pct} tone={(['pearl', 'sky', 'gold', 'rose'] as const)[i]} picked={mine.pct === pct} onClick={() => room.command({ type: 'pick-option', option: i })}>
          <span className={styles.wagerOption}>
            <strong>{pctLabel(pct)}</strong>
            <span>{pct === 0 ? 'Play it safe' : `${Math.round((pct * mine.stake) / 10) * 10} points`}</span>
          </span>
        </Choice>
      ))}
    </PhoneStack>
  );
}

/** Rename your team while the teams are shown. Anyone on it can; the last name sticks. */
function TeamNamer({ current }: { current: string }) {
  const room = useRoom();
  const input = useRef<HTMLInputElement>(null);
  return (
    <form
      className={styles.teamNamer}
      onSubmit={(e) => {
        e.preventDefault();
        const name = input.current?.value.trim();
        if (!name || name === current) return;
        haptic('success');
        play('chime');
        room.command({ type: 'name-team', name });
      }}
    >
      <TextInput ref={input} label="Team name" hint="Your team can rename itself until the teams lock." defaultValue={current} maxLength={DIDACTICS.maxTeamName} enterKeyHint="done" />
      <Button type="submit" tone="pearl" block>
        Rename team
      </Button>
    </form>
  );
}
