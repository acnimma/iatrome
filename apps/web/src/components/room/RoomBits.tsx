'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { type PersonView, REACTIONS, type RoomView, gameInfo, type GameId } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar } from '@/components/ui/Avatar';
import { haptic } from '@/lib/haptics';
import styles from './RoomBits.module.css';

// ── People ───────────────────────────────────────────────────────────────────

export function usePeople(view: RoomView) {
  return useMemo(() => new Map(view.people.map((p) => [p.id, p])), [view.people]);
}

export const nameOf = (people: Map<string, PersonView>, id: string | null | undefined) =>
  (id && people.get(id)?.name) ?? (id === 'beep' ? 'Beep' : 'Someone');

// ── Room code ────────────────────────────────────────────────────────────────

/** The room code as squishy letter tiles. */
export function RoomCode({ code, hidden, size = 'lg' }: { code: string; hidden?: boolean; size?: 'md' | 'lg' }) {
  return (
    <span className={`${styles.code} ${styles[size]}`} aria-label={hidden ? 'Room code hidden' : `Room code ${code.split('').join(' ')}`}>
      {code.split('').map((ch, i) => (
        <motion.span
          key={i}
          className={styles.tile}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 400, damping: 18 }}
        >
          {hidden ? '•' : ch}
        </motion.span>
      ))}
    </span>
  );
}

export function JoinQr({ url }: { url: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1f2a4d', light: '#00000000' } }).then(setSvg);
  }, [url]);
  return <div className={styles.qr} aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Reactions ────────────────────────────────────────────────────────────────

type Floater = { id: number; e: number; x: number; avatar: number | null };

/** Emoji reactions floating up the stage. */
export function ReactionLayer({ view }: { view: RoomView }) {
  const room = useRoom();
  const people = usePeople(view);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  useEffect(
    () =>
      room.onReaction((r) => {
        const f = { id: r.id, e: r.e, x: 8 + Math.random() * 84, avatar: people.get(r.from)?.avatar ?? null };
        setFloaters((all) => [...all.slice(-24), f]);
        setTimeout(() => setFloaters((all) => all.filter((x) => x.id !== f.id)), 2600);
      }),
    [room, people],
  );
  return (
    <div className={styles.reactions} aria-hidden>
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            className={styles.floater}
            style={{ left: `${f.x}%` }}
            initial={{ y: 0, opacity: 0, scale: 0.4 }}
            animate={{ y: -420, opacity: [0, 1, 1, 0], scale: [0.4, 1.3, 1, 1], rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
          >
            {REACTIONS[f.e]}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Reaction buttons for phones. */
export function ReactionBar() {
  const room = useRoom();
  return (
    <div className={styles.reactionBar} role="group" aria-label="React">
      {REACTIONS.map((emoji, i) => (
        <motion.button
          key={emoji}
          type="button"
          className={styles.reactionButton}
          whileTap={{ scale: 1.35 }}
          onClick={() => {
            haptic('tap');
            room.react(i);
          }}
          aria-label={`React ${emoji}`}
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────

/** Big round/game title card. */
export function IntroCard({ eyebrow, title, body, badge }: { eyebrow: string; title: string; body?: string; badge?: string }) {
  return (
    <motion.div
      className={styles.intro}
      initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 16 }}
    >
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h2 className={styles.introTitle}>{title}</h2>
      {body && <p className={styles.introBody}>{body}</p>}
      {badge && (
        <motion.span className={styles.badge} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 8 }} transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 10 }}>
          {badge}
        </motion.span>
      )}
    </motion.div>
  );
}

export function GameTitleCard({ game }: { game: GameId }) {
  const info = gameInfo[game];
  return <IntroCard eyebrow="Up next" title={info.title} body={info.howTo} />;
}

/** A big rotated rubber-stamp label: CONSENSUS!, DUPLICATE ORDER, … */
export function Stamp({ children, tone = 'rose' }: { children: React.ReactNode; tone?: 'rose' | 'gold' | 'sky' | 'ink' }) {
  return (
    <motion.span
      className={`${styles.stamp} ${styles[`stamp_${tone}`]}`}
      initial={{ scale: 2.6, opacity: 0, rotate: -18 }}
      animate={{ scale: 1, opacity: 1, rotate: -8 }}
      transition={{ type: 'spring', stiffness: 520, damping: 16 }}
    >
      {children}
    </motion.span>
  );
}

// ── Scores ───────────────────────────────────────────────────────────────────

/** Animated leaderboard: rows slide into rank order. */
export function Scoreboard({ view, scores, limit = 10 }: { view: RoomView; scores: Record<string, number>; limit?: number }) {
  const people = usePeople(view);
  const rows = Object.entries(scores)
    .filter(([id]) => people.has(id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  const top = Math.max(1, rows[0]?.[1] ?? 1);
  return (
    <ol className={styles.scoreboard}>
      {rows.map(([id, score], i) => {
        const p = people.get(id)!;
        return (
          <motion.li key={id} layout className={styles.scoreRow} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}>
            <span className={styles.rank}>{i + 1}</span>
            <Avatar avatar={p.avatar} size={44} />
            <span className={styles.scoreName}>{p.name}</span>
            <span className={styles.scoreBar}>
              <motion.span initial={{ width: 0 }} animate={{ width: `${(score / top) * 100}%` }} transition={{ delay: 0.2 + i * 0.06, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            </span>
            <CountUp className={styles.scoreValue} value={score} />
          </motion.li>
        );
      })}
    </ol>
  );
}

export function CountUp({ value, className, duration = 900 }: { value: number; className?: string; duration?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const from = 0;
    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setShown(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{shown.toLocaleString()}</span>;
}

// ── Little shared bits ───────────────────────────────────────────────────────

/** A row of avatars, e.g. "still writing…". */
export function AvatarRow({ ids, view, size = 52, done }: { ids: string[]; view: RoomView; size?: number; done?: Set<string> }) {
  const people = usePeople(view);
  return (
    <div className={styles.avatarRow}>
      <AnimatePresence>
        {ids.map((id) => {
          const p = people.get(id);
          if (!p) return null;
          const isDone = done?.has(id);
          return (
            <motion.span
              key={id}
              layout
              initial={{ scale: 0 }}
              animate={{ scale: 1, y: isDone ? [0, -14, 0] : 0 }}
              exit={{ scale: 0 }}
              transition={{ scale: { type: 'spring', stiffness: 500, damping: 18 }, y: { duration: 0.45, ease: 'easeOut' } }}
            >
              <Avatar avatar={p.avatar} size={size} name={p.name} dim={done ? !isDone : !p.connected} badge={isDone ? '✓' : undefined} />
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function Pill({ children, tone = 'card' }: { children: React.ReactNode; tone?: 'card' | 'rose' | 'gold' | 'sky' }) {
  return <span className={`${styles.pill} ${styles[`pill_${tone}`]}`}>{children}</span>;
}
