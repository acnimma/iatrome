'use client';

import { motion } from 'motion/react';
import { useEffect } from 'react';
import type { PoisonView, RoomView } from '@iatrome/game/client';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { AvatarRow, IntroCard, Pill, Stamp, nameOf, usePeople } from '@/components/room/RoomBits';
import { play } from '@/lib/sound';
import { speak } from '@/lib/speech';
import { jelly } from '@/components/ui/jelly';
import styles from './Poison.module.css';

export function PoisonStage({ view, game }: { view: RoomView; game: PoisonView }) {
  const people = usePeople(view);
  const phase = game.phase.name;
  useEffect(() => {
    if (phase === 'choose' && game.a) speak(`Would you rather ${game.a}? Or ${game.b}?`);
    if (phase === 'reveal') play(game.majority === 'tie' ? 'buzz' : 'reveal');
    if (phase === 'defence' && game.defence) speak(game.defence);
  }, [phase, game.number]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro')
    return <IntroCard eyebrow="Up next" title="Pick Your Poison" body="Pick your side, then guess which side the room picked. Anyone in the minority can defend it." />;

  const players = view.people.filter((p) => p.inGame).map((p) => p.id);
  const revealed = game.counts !== null;
  const total = Math.max(1, (game.counts?.a ?? 0) + (game.counts?.b ?? 0));

  if (phase === 'defend' || phase === 'defence') {
    const defender = game.defender ? people.get(game.defender) : null;
    const side = game.defender && game.sides ? game.sides[game.defender] : null;
    return (
      <div className={styles.defence}>
        {defender && <Avatar avatar={defender.avatar} size={110} />}
        <h2 className={styles.heading}>
          {phase === 'defend' ? `${defender?.name ?? 'Someone'} volunteered. Bold.` : `${defender?.name ?? 'Someone'} says:`}
        </h2>
        <p className={styles.sub}>They’d rather {side === 'a' ? game.a : game.b}.</p>
        {phase === 'defend' ? (
          <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={110} ticks />
        ) : (
          <>
            <motion.blockquote className={styles.quote} initial={{ scale: 0.7, rotate: -3, opacity: 0 }} animate={{ scale: 1, rotate: -1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 16 }}>
              “{game.defence ?? '…'}”
            </motion.blockquote>
            <div className={styles.converts}>
              <span>{game.converts.length ? `Convinced ${game.converts.length}` : 'Majority: tap “Convinced” if this worked on you'}</span>
              <AvatarRow ids={game.converts} view={view} size={40} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <div className={styles.top}>
        <Pill>
          {game.number} of {game.total}
        </Pill>
        {phase === 'choose' && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={72} ticks />}
      </div>
      <h2 className={styles.ask}>Would you rather…</h2>
      <div className={styles.sides}>
        {(['a', 'b'] as const).map((side, i) => {
          const count = game.counts?.[side] ?? 0;
          const majority = revealed && game.majority === side;
          const pickers = Object.entries(game.sides ?? {})
            .filter(([, s]) => s === side)
            .map(([id]) => id);
          return (
            <motion.div
              key={`${game.number}-${side}`}
              className={`${styles.side} ${jelly(side === 'a' ? 'rose' : 'blue')} ${majority ? styles.majority : ''}`}
              initial={{ x: i ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            >
              <p className={styles.option}>{side === 'a' ? game.a : game.b}</p>
              {revealed && (
                <>
                  <div className={styles.bar}>
                    <motion.span initial={{ width: 0 }} animate={{ width: `${(count / total) * 100}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
                    <strong>{count}</strong>
                  </div>
                  <div className={styles.pickers}>
                    {pickers.map((id) => {
                      const p = people.get(id);
                      return p ? <Avatar key={id} avatar={p.avatar} size={36} /> : null;
                    })}
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
        <span className={`${styles.or} ${jelly()}`}>or</span>
        {revealed && game.majority === 'tie' && (
          <span className={styles.stampSpot}>
            <Stamp tone="sky">Dead even</Stamp>
          </span>
        )}
      </div>
      {phase === 'choose' && <AvatarRow ids={players} view={view} size={48} done={new Set(game.done)} />}
      {phase === 'volunteer' && (
        <motion.div className={styles.volunteer} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <span>The minority may defend itself. Tap “Defend it” on your phone.</span>
          <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={56} />
        </motion.div>
      )}
      {revealed && Object.keys(game.earned).length > 0 && (
        <p className={styles.earned}>
          Read the room: {Object.keys(game.earned).map((id) => nameOf(people, id)).join(', ')}
        </p>
      )}
    </div>
  );
}
