'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { HostLine } from '@iatrome/game/client';
import { beepTalk } from '@/lib/sound';
import styles from './Beep.module.css';

const SHOW_MS = 7_000;

/** Beep: the host. A cheerful little light-blue robot with a screen for a face, and opinions. */
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
      <div className={styles.body} style={{ width: size }}>
        <BeepFace talking={Boolean(visible)} bpm={bpm} />
      </div>
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

/** Beep: the original light-blue robot with a screen for a face. `bpm` is accepted for callers; the look stays calm. */
export function BeepFace(_props: { talking?: boolean; bpm?: number }) {
  return (
    <svg viewBox="0 0 120 100" className={styles.svg} aria-label="Beep, the robot host">
      <defs>
        <linearGradient id="beep-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6c9fc8" />
          <stop offset="1" stopColor="#3f78a6" />
        </linearGradient>
      </defs>
      {/* antenna */}
      <rect x="86" y="2" width="12" height="20" rx="6" fill="#1f2a4d" />
      {/* belt clip */}
      <rect x="4" y="36" width="10" height="30" rx="5" fill="#1f2a4d" />
      {/* body */}
      <rect x="10" y="14" width="100" height="80" rx="26" fill="url(#beep-body)" stroke="#1f2a4d" strokeWidth="3" />
      <path d="M24 22 h56" stroke="rgb(255 255 255 / 0.45)" strokeWidth="5" strokeLinecap="round" />
      {/* screen */}
      <rect x="22" y="30" width="76" height="46" rx="14" fill="#eef3e8" stroke="#1f2a4d" strokeWidth="3" />
      {/* face */}
      <g className={styles.eyes}>
        <ellipse cx="46" cy="49" rx="5" ry="6.5" fill="#1f2a4d" />
        <ellipse cx="74" cy="49" rx="5" ry="6.5" fill="#1f2a4d" />
      </g>
      <ellipse cx="38" cy="60" rx="5" ry="3" fill="#cc4e73" opacity="0.35" />
      <ellipse cx="82" cy="60" rx="5" ry="3" fill="#cc4e73" opacity="0.35" />
      <path d="M52 61 q8 8 16 0" fill="none" stroke="#1f2a4d" strokeWidth="3.5" strokeLinecap="round" />
      {/* button */}
      <circle cx="60" cy="86" r="4" fill="#ccb64a" stroke="#1f2a4d" strokeWidth="2" />
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
