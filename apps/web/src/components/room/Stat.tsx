'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { RoomView } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar } from '@/components/ui/Avatar';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import { nameOf, usePeople } from './RoomBits';
import styles from './Stat.module.css';

/**
 * Stats: the top finishers (and, in bigger groups, last place) carry one into the next game.
 * Called on one round, it doubles that player's points for it. Use it or lose it.
 */

/** The little STAT ×2 token. */
export function StatChip({ label = 'Stat ×2' }: { label?: string }) {
  return <span className={styles.chip}>{label}</span>;
}

/** Spend your Stat on this round (Grand Rounds passes the prompt as `target`). */
export function StatButton({ view, target, label = 'Call your Stat ×2' }: { view: RoomView; target?: string; label?: string }) {
  const room = useRoom();
  if (!view.stat.ready) return null;
  return (
    <motion.button
      type="button"
      className={styles.call}
      onClick={() => {
        haptic('success');
        play('reveal');
        room.command({ type: 'stat', target });
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <StatChip label="Stat" /> {label}
    </motion.button>
  );
}

/** Shown on your phone while your Stat is riding on the round in play. */
export function StatOnThis({ view }: { view: RoomView }) {
  if (!view.stat.onThis) return null;
  return (
    <motion.p className={styles.onThis} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <StatChip /> Your Stat is on this one.
    </motion.p>
  );
}

/** Whose Stats rode on the round whose results are showing. */
export function StatCalls({ view, floating = false }: { view: RoomView; floating?: boolean }) {
  const people = usePeople(view);
  const calls = view.stat.calls.filter((id) => id !== view.you?.id || floating);
  return (
    <div className={floating ? styles.floating : styles.inline}>
      <AnimatePresence>
        {calls.map((id, i) => (
          <motion.span
            key={id}
            className={styles.stamp}
            initial={{ scale: 2.2, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: -4 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 + i * 0.2, type: 'spring', stiffness: 380, damping: 16 }}
          >
            {nameOf(people, id)}’s Stat ×2
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Who carries a Stat into the next game (stage lobby and podium). */
export function StatHolders({ view }: { view: RoomView }) {
  const people = usePeople(view);
  const holders = view.stat.holders.filter((h) => people.has(h.id));
  if (!holders.length) return null;
  return (
    <div className={styles.holders}>
      <span className={styles.holdersTitle}>
        <StatChip label="Stat" /> Carried into the next game: double points on one round
      </span>
      <ul>
        {holders.map((h) => {
          const p = people.get(h.id)!;
          return (
            <li key={h.id}>
              <Avatar avatar={p.avatar} size={30} />
              {p.name}
              {h.grant === 'mercy' && <em>sympathy</em>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Your own Stat, explained (phone lobby and results). */
export function MyStat({ view }: { view: RoomView }) {
  const mine = view.stat.holders.find((h) => h.id === view.you?.id);
  if (!mine) return null;
  return (
    <motion.div className={styles.mine} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
      <StatChip label="Stat" />
      <p>
        <strong>{mine.grant === 'mercy' ? 'You earned a sympathy Stat.' : 'You earned a Stat.'}</strong>{' '}
        {mine.grant === 'mercy' ? 'Last place gets one. Beep felt bad. ' : ''}Next game, call it on one round to double your points for it. Use it or lose it.
      </p>
    </motion.div>
  );
}

