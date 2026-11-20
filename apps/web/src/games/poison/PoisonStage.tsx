'use client';

import { LayoutGroup, motion } from 'motion/react';
import { useEffect } from 'react';
import type { PoisonView, RoomView } from '@iatrome/game/client';
import { Avatar } from '@/components/ui/Avatar';
import { TimerRing } from '@/components/ui/TimerRing';
import { IntroCard, Pill, Scoreboard, Stamp, nameOf, usePeople } from '@/components/room/RoomBits';
import { Icon } from '@/components/icons/Icon';
import { play } from '@/lib/sound';
import { jelly } from '@/components/ui/jelly';
import styles from './Poison.module.css';

type Side = 'a' | 'b';

export function PoisonStage({ view, game }: { view: RoomView; game: PoisonView }) {
  const people = usePeople(view);
  const phase = game.phase.name;
  useEffect(() => {
    if (phase === 'reveal') play(game.majority === 'tie' ? 'buzz' : 'reveal');
    if (phase === 'verdict') play(game.flips.length ? 'reveal' : 'buzz');
  }, [phase, game.number]); // eslint-disable-line react-hooks/exhaustive-deps
  // Every flip gets a sound as the avatar slides across.
  useEffect(() => {
    if (phase === 'defence' && game.flips.length) play('pop');
  }, [game.flips.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'intro')
    return (
      <IntroCard
        eyebrow="Up next"
        title="Pick Your Poison"
        body="Pick a side, then guess what everyone else picked. End up in the minority and one of you explains it. Out loud."
      />
    );

  if (phase === 'final')
    return (
      <div className={styles.final}>
        <IntroCard eyebrow="Last one" title="Final dilemma" body="Worth triple. Reading the room, being alone, talking people round: all ×3." badge="×3" />
        <Scoreboard view={view} scores={game.scores} limit={5} />
      </div>
    );

  if (phase === 'bet' || phase === 'defence' || phase === 'verdict') return <Ama view={view} game={game} />;

  const players = view.people.filter((p) => p.inGame).map((p) => p.id);
  const revealed = game.counts !== null;
  const total = Math.max(1, (game.counts?.a ?? 0) + (game.counts?.b ?? 0));
  const lone = game.pay?.lone ?? {};

  return (
    <div className={styles.stage}>
      <div className={styles.top}>
        <Pill>
          {game.number} of {game.total}
        </Pill>
        {game.multiplier > 1 && <Pill tone="gold">Final dilemma · triple points</Pill>}
        {phase === 'choose' ? <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={72} ticks /> : <span className={styles.timerSpace} />}
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
                    {pickers.map((id, k) => {
                      const p = people.get(id);
                      if (!p) return null;
                      return (
                        <motion.span key={id} className={styles.picker} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + k * 0.05, type: 'spring', stiffness: 500, damping: 18 }}>
                          <Avatar avatar={p.avatar} size={44} />
                          <AmaTag count={game.ama[id]} />
                        </motion.span>
                      );
                    })}
                  </div>
                  {pickers.length === 1 && lone[pickers[0]] && (
                    <motion.span className={styles.alone} initial={{ scale: 2, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: -6 }} transition={{ delay: 1.1, type: 'spring', stiffness: 500, damping: 14 }}>
                      Alone · +{lone[pickers[0]]}
                    </motion.span>
                  )}
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
        {revealed && game.counts && (game.counts.a === 0 || game.counts.b === 0) && total > 1 && (
          <span className={styles.stampSpot}>
            <Stamp tone="gold">Unanimous. Nobody to argue with.</Stamp>
          </span>
        )}
      </div>
      {phase === 'choose' && <Room ids={players} view={view} game={game} />}
      {revealed && Object.keys(game.pay?.read ?? {}).length > 0 && (
        <p className={styles.earned}>
          Read the others: {Object.keys(game.pay!.read).map((id) => nameOf(people, id)).join(', ')}
        </p>
      )}
    </div>
  );
}

/** A small running tally next to an avatar: rounds spent alone on a side. */
function AmaTag({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className={styles.amaTag} title="Rounds spent alone on a side">
      AMA{count > 1 ? ` ×${count}` : ''}
    </span>
  );
}

/** Who's still picking, with their AMA tags. */
function Room({ ids, view, game }: { ids: string[]; view: RoomView; game: PoisonView }) {
  const people = usePeople(view);
  const done = new Set(game.done);
  return (
    <div className={styles.room}>
      {ids.map((id) => {
        const p = people.get(id);
        if (!p) return null;
        const isDone = done.has(id);
        return (
          <motion.span key={id} className={styles.picker} animate={{ y: isDone ? [0, -12, 0] : 0 }} transition={{ duration: 0.45 }}>
            <Avatar avatar={p.avatar} size={52} name={p.name} dim={!isDone} badge={isDone ? <Icon name="check" size={16} /> : undefined} />
            <AmaTag count={game.ama[id]} />
          </motion.span>
        );
      })}
    </div>
  );
}

/** Against Medical Advice: the bet, the out-loud defence, the verdict. */
function Ama({ view, game }: { view: RoomView; game: PoisonView }) {
  const people = usePeople(view);
  const phase = game.phase.name;
  const defender = game.defender ? people.get(game.defender) : null;
  const theirs: Side = game.majority === 'a' ? 'b' : 'a';
  const ours: Side = theirs === 'a' ? 'b' : 'a';
  const text = (s: Side) => (s === 'a' ? game.a : game.b);
  const flips = new Set(game.flips);
  const sides = game.sides ?? {};
  const now = (id: string): Side => (flips.has(id) ? theirs : sides[id]);
  const on = (s: Side) => Object.keys(sides).filter((id) => people.has(id) && now(id) === s);
  const count = { a: on('a').length, b: on('b').length };
  const total = Math.max(1, count.a + count.b);
  const majorityIds = Object.keys(sides).filter((id) => sides[id] === ours && people.has(id));
  const bets = game.bets ?? {};
  const calledIt = Object.entries(game.pay?.bet ?? {}).map(([id]) => id);

  return (
    <div className={styles.ama}>
      <div className={styles.amaTop}>
        <span className={styles.amaEyebrow}>Against Medical Advice{game.multiplier > 1 ? ' · ×3' : ''}</span>
        {phase !== 'verdict' && <TimerRing phase={game.phase} pausedAt={view.pausedAt} size={phase === 'defence' ? 96 : 64} ticks={phase === 'defence'} />}
      </div>
      <div className={styles.amaMain}>
        {defender && (
          <motion.span className={styles.amaDefender} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
            <Avatar avatar={defender.avatar} size={phase === 'defence' ? 190 : 150} />
            {phase === 'defence' && (
              <motion.span className={styles.amaMic} animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                <Icon name="mic" size={56} />
              </motion.span>
            )}
          </motion.span>
        )}
        <div className={styles.amaText}>
          <h2 className={styles.amaName}>{defender?.name ?? 'Someone'}</h2>
          <p className={styles.amaSide}>would rather {text(theirs)}.</p>
          {phase === 'bet' && <p className={styles.amaCue}>Majority: will anyone switch? Bet on your phone.</p>}
          {phase === 'defence' && (
            <motion.p className={styles.amaCall} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }}>
              Make your case. Out loud.
            </motion.p>
          )}
          {phase === 'verdict' && (
            <span className={styles.amaVerdict}>
              <Stamp tone={game.flips.length ? 'gold' : 'ink'}>
                {game.flips.length ? `${game.flips.length} switched` : 'Nobody budged'}
              </Stamp>
            </span>
          )}
        </div>
      </div>

      <LayoutGroup>
        <div className={styles.split}>
          {([ours, theirs] as const).map((s) => (
            <div key={s} className={`${styles.splitSide} ${s === theirs ? styles.splitTheirs : ''}`} data-side={s}>
              <span className={styles.splitLabel}>{text(s)}</span>
              <div className={styles.splitFaces}>
                {on(s).map((id) => {
                  const p = people.get(id)!;
                  const bet = phase === 'bet' ? game.betters.includes(id) : false;
                  return (
                    <motion.span key={id} layoutId={`ama-${id}`} className={styles.picker} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
                      <Avatar
                        avatar={p.avatar}
                        size={52}
                        name={p.name}
                        dim={phase === 'bet' && sides[id] === ours && !bet}
                        badge={bet ? <Icon name="check" size={16} /> : flips.has(id) ? <Icon name="speech" size={16} /> : undefined}
                      />
                      {phase === 'verdict' && id in bets && (
                        <span className={`${styles.betTag} ${calledIt.includes(id) ? styles.betWon : ''}`}>{bets[id] ? 'bet yes' : 'bet no'}</span>
                      )}
                    </motion.span>
                  );
                })}
              </div>
            </div>
          ))}
          <div className={styles.splitBar}>
            <motion.span className={styles.splitFill} data-side={ours} animate={{ width: `${(count[ours] / total) * 100}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
            <motion.span className={styles.splitFill} data-side={theirs} animate={{ width: `${(count[theirs] / total) * 100}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
          </div>
        </div>
      </LayoutGroup>

      {phase === 'defence' && majorityIds.length > 0 && (
        <p className={styles.amaFoot}>{game.flips.length ? `Switched so far: ${game.flips.length} of ${majorityIds.length}` : 'Majority: tap “Convinced” on your phone if this is working on you.'}</p>
      )}
      {phase === 'verdict' && (
        <p className={styles.amaFoot}>
          {calledIt.length ? `Called it: ${calledIt.map((id) => nameOf(people, id)).join(', ')}` : 'Nobody called it.'}
          {game.defender && game.pay?.flips[game.defender] ? ` · ${nameOf(people, game.defender)} +${game.pay.flips[game.defender]}` : ''}
        </p>
      )}
    </div>
  );
}
