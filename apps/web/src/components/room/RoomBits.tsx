'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { type PersonView, REACTIONS, type RoomView, gameInfo, type GameId } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { Avatar } from '@/components/ui/Avatar';
import { useAfter } from '@/components/ui/Later';
import { Icon } from '@/components/icons/Icon';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
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

type Floater = { id: number; e: number; x: number; y: number; size: number; tilt: number; delay: number };

/** Emoji per tap, and the most on screen at once, so a spam storm stays smooth. */
const BURST = 6;
const MAX_FLOATERS = 70;
const LIFETIME = 2200;

/**
 * Reactions from anyone in the room, spammed across the whole screen: every tap throws a burst of
 * big emoji at random spots, on the stage and on every phone, and they pile up when people mash.
 */
export function ReactionLayer() {
  const room = useRoom();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const lastBoing = useRef(0);
  useEffect(
    () =>
      room.onReaction((r) => {
        const now = performance.now();
        if (now - lastBoing.current > 70) {
          lastBoing.current = now;
          play('boing', r.e);
        }
        const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const burst: Floater[] = Array.from({ length: calm ? 1 : BURST }, (_, k) => ({
          id: r.id * 100 + k,
          e: r.e,
          x: 4 + Math.random() * 92,
          y: 6 + Math.random() * 88,
          size: 56 + Math.random() * 84,
          tilt: (Math.random() - 0.5) * 50,
          delay: k * 0.04,
        }));
        setFloaters((all) => [...all, ...burst].slice(-MAX_FLOATERS));
        const ids = new Set(burst.map((f) => f.id));
        setTimeout(() => setFloaters((all) => all.filter((x) => !ids.has(x.id))), LIFETIME + 400);
      }),
    [room],
  );
  return (
    <div className={styles.reactions} aria-hidden>
      <AnimatePresence>
        {floaters.map((f) => (
          <span key={f.id} className={styles.floater} style={{ left: `${f.x}%`, top: `${f.y}%` }}>
            <motion.span
              style={{ display: 'block', lineHeight: 0 }}
              initial={{ opacity: 0, scale: 0.2, rotate: f.tilt }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.2, 1.25, 1, 0.9], y: [0, 0, -30, -60] }}
              transition={{ duration: LIFETIME / 1000, delay: f.delay, ease: 'easeOut', times: [0, 0.15, 0.7, 1] }}
            >
              <Icon name={REACTIONS[f.e]} size={f.size} />
            </motion.span>
          </span>
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
      {REACTIONS.map((reaction, i) => (
        <motion.button
          key={reaction}
          type="button"
          className={styles.reactionButton}
          whileTap={{ scale: 1.35 }}
          onClick={() => {
            haptic('tap');
            room.react(i);
          }}
          aria-label={`React: ${reaction.replace('react-', '')}`}
        >
          <Icon name={reaction} size={34} />
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

/**
 * Animated leaderboard. Given `previous` scores, it starts in the old order, shows each
 * player's gain, counts up from the old totals, then re-sorts so you can watch people move.
 */
export function Scoreboard({ view, scores, previous, limit = 10 }: { view: RoomView; scores: Record<string, number>; previous?: Record<string, number> | null; limit?: number }) {
  const people = usePeople(view);
  const moved = useAfter(previous ? 1_400 : 0, previous);
  const shown = previous && !moved ? previous : scores;
  const rows = Object.entries(scores)
    .filter(([id]) => people.has(id))
    .sort((a, b) => (shown[b[0]] ?? 0) - (shown[a[0]] ?? 0))
    .slice(0, limit);
  const top = Math.max(1, ...rows.map(([id]) => shown[id] ?? 0));
  return (
    <ol className={styles.scoreboard}>
      {rows.map(([id, score], i) => {
        const p = people.get(id)!;
        const before = previous?.[id] ?? 0;
        const gain = previous ? score - before : 0;
        return (
          <motion.li key={id} layout className={styles.scoreRow} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 24, layout: { type: 'spring', stiffness: 260, damping: 26 } }}>
            <span className={styles.rank}>{i + 1}</span>
            <Avatar avatar={p.avatar} size={44} />
            <span className={styles.scoreName}>
              <span className={styles.scoreNameText}>{p.name}</span>
              {gain > 0 && (
                <motion.span className={styles.gain} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 + i * 0.06, type: 'spring', stiffness: 420, damping: 14 }}>
                  +{gain.toLocaleString()}
                </motion.span>
              )}
            </span>
            <span className={styles.scoreBar}>
              <motion.span initial={{ width: 0 }} animate={{ width: `${((shown[id] ?? 0) / top) * 100}%` }} transition={{ delay: 0.2 + i * 0.06, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
            </span>
            <CountUp className={styles.scoreValue} value={shown[id] ?? 0} from={previous ? before : 0} />
          </motion.li>
        );
      })}
    </ol>
  );
}

export function CountUp({ value, className, duration = 900, from = 0 }: { value: number; className?: string; duration?: number; from?: number }) {
  const [shown, setShown] = useState(from);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const k = Math.min(1, (t - start) / duration);
      setShown(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, from]);
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
              <Avatar avatar={p.avatar} size={size} name={p.name} dim={done ? !isDone : !p.connected} badge={isDone ? <Icon name="check" size={Math.round(size * 0.3)} label="Done" /> : undefined} />
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
