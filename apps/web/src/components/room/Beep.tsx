'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import type { HostLine } from '@iatrome/game/client';
import { beepTalk } from '@/lib/sound';
import styles from './Beep.module.css';

const SHOW_MS = 7_000;

/**
 * Beep: the host. A cute TV-headed robot with opinions. `bpm` is the show's tension (the stage
 * raises it while people write, vote and wait for a reveal): Beep's antenna blinks along to it.
 */
export function Beep({
  line,
  size = 132,
  compact = false,
  voiced = false,
  bpm = 72,
}: {
  line: HostLine | null;
  size?: number;
  compact?: boolean;
  voiced?: boolean;
  bpm?: number;
}) {
  const visible = useHostLine(line);
  // On the stage Beep "speaks" in monitor chirps, never words.
  useEffect(() => {
    if (voiced && visible) beepTalk(visible.text);
  }, [voiced, visible]);

  return (
    <div className={`${styles.host} ${compact ? styles.compact : ''}`}>
      <motion.div
        key={visible?.at ?? 'idle'}
        className={styles.body}
        initial={{ scaleY: 0.88, scaleX: 1.08, y: 6 }}
        animate={{ scaleY: 1, scaleX: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 12 }}
        style={{ width: size }}
      >
        <BeepFace talking={Boolean(visible)} bpm={bpm} />
      </motion.div>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={visible.at}
            className={styles.bubble}
            initial={{ opacity: 0, scale: 0.8, x: -12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            {visible.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Beep: a little TV-headed robot. Rabbit-ear antennas, a cream screen with a face on it,
 * rosy cheeks, stubby arms. The antenna bulb blinks faster as the show gets tense (`bpm`).
 */
export function BeepFace({ talking = false, bpm = 72 }: { talking?: boolean; bpm?: number }) {
  const id = useId().replace(/:/g, '');
  const rate = Math.max(40, Math.min(180, Math.round(bpm)));
  return (
    <svg viewBox="0 0 140 132" className={styles.svg} role="img" aria-label="Beep, the TV robot host">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7aaed3" />
          <stop offset="1" stopColor="#3f78a6" />
        </linearGradient>
        <radialGradient id={`${id}-screen`} cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#e9e3d6" />
        </radialGradient>
      </defs>

      {/* rabbit-ear antennas, with a bulb that blinks with the tension */}
      <path d="M58 28 L44 6" stroke="#1f2a4d" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 28 L98 8" stroke="#1f2a4d" strokeWidth="4" strokeLinecap="round" />
      <circle cx="44" cy="6" r="5" fill="#cc4e73" stroke="#1f2a4d" strokeWidth="2.5" />
      <circle cx="98" cy="8" r="5" fill="#ccb64a" stroke="#1f2a4d" strokeWidth="2.5" className={styles.bulb} style={{ animationDuration: `${(60 / rate) * 2}s` }} />

      {/* stubby arms, waving a little when Beep talks */}
      <g className={talking ? styles.wave : undefined}>
        <path d="M14 78 q-12 -2 -10 -16" fill="none" stroke="#1f2a4d" strokeWidth="5" strokeLinecap="round" />
        <circle cx="4" cy="61" r="5" fill="#7aaed3" stroke="#1f2a4d" strokeWidth="2.5" />
      </g>
      <path d="M126 78 q12 2 11 14" fill="none" stroke="#1f2a4d" strokeWidth="5" strokeLinecap="round" />
      <circle cx="137" cy="93" r="5" fill="#7aaed3" stroke="#1f2a4d" strokeWidth="2.5" />

      {/* little feet */}
      <rect x="42" y="114" width="20" height="12" rx="6" fill="#1f2a4d" />
      <rect x="78" y="114" width="20" height="12" rx="6" fill="#1f2a4d" />

      {/* the TV body */}
      <rect x="12" y="26" width="116" height="92" rx="28" fill={`url(#${id}-body)`} stroke="#1f2a4d" strokeWidth="3.5" />
      <path d="M30 34 h64" stroke="rgb(255 255 255 / 0.5)" strokeWidth="5" strokeLinecap="round" />
      {/* knobs */}
      <circle cx="112" cy="92" r="5" fill="#ccb64a" stroke="#1f2a4d" strokeWidth="2" />
      <circle cx="112" cy="106" r="3.5" fill="#cc4e73" stroke="#1f2a4d" strokeWidth="2" />

      {/* the screen, and the face on it */}
      <rect x="24" y="40" width="80" height="64" rx="18" fill={`url(#${id}-screen)`} stroke="#1f2a4d" strokeWidth="3" />
      <g className={styles.eyes}>
        <ellipse cx="50" cy="66" rx="5.5" ry="7" fill="#1f2a4d" />
        <ellipse cx="78" cy="66" rx="5.5" ry="7" fill="#1f2a4d" />
        <circle cx="52" cy="63" r="1.8" fill="#fff" />
        <circle cx="80" cy="63" r="1.8" fill="#fff" />
      </g>
      <ellipse cx="40" cy="80" rx="6" ry="3.5" fill="#cc4e73" opacity="0.35" />
      <ellipse cx="88" cy="80" rx="6" ry="3.5" fill="#cc4e73" opacity="0.35" />
      <path className={talking ? styles.talk : undefined} d="M56 80 q8 9 16 0" fill="none" stroke="#1f2a4d" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The line Beep is saying right now: held back by its `delay` (so a reveal isn't spoiled),
 * shown for a few seconds, then cleared. Keyed on when it was said, so the room's state
 * updates (which resend the same line) don't keep it on screen forever.
 */
export function useHostLine(line: HostLine | null, showMs = SHOW_MS) {
  const [visible, setVisible] = useState<HostLine | null>(null);
  const said = line?.at ?? null;
  useEffect(() => {
    if (!line) return;
    const wait = Math.max(0, line.delay ?? 0);
    const timers = [
      setTimeout(() => setVisible(line), wait),
      setTimeout(() => setVisible(null), wait + showMs),
    ];
    return () => timers.forEach(clearTimeout);
  }, [said, showMs]); // eslint-disable-line react-hooks/exhaustive-deps
  return visible;
}
