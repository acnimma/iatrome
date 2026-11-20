'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import type { HostLine } from '@iatrome/game/client';
import { beepTalk } from '@/lib/sound';
import styles from './Beep.module.css';

const SHOW_MS = 7_000;

/**
 * Beep: the host. A bedside heart-rate monitor with opinions. Its trace runs at `bpm`, which the
 * stage raises as the show gets tense (writing, voting, the drumroll before a reveal).
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

/** One heartbeat (P wave, QRS spike, T wave) on a 60-unit-wide tile, baseline at y=0. */
const BEAT = 'h10 q3 -3 6 0 h4 l2 3 l3 -18 l3 21 l2 -6 h6 q4 -6 8 0 h13';

/**
 * The monitor itself: glossy black jelly casing, a dark screen with two green eyes, the ECG
 * trace sweeping underneath them like a mouth, and the heart rate in the corner.
 */
export function BeepFace({ talking = false, bpm = 72 }: { talking?: boolean; bpm?: number }) {
  const id = useId().replace(/:/g, '');
  const rate = Math.max(40, Math.min(180, Math.round(bpm)));
  // The trace scrolls one beat-tile per heartbeat, so the drawn rhythm matches the number.
  const beatSeconds = 60 / rate;
  return (
    <svg viewBox="0 0 140 112" className={styles.svg} role="img" aria-label={`Beep, the heart-rate monitor, reading ${rate} beats per minute`}>
      <defs>
        <radialGradient id={`${id}-case`} cx="50%" cy="8%" r="110%">
          <stop offset="0" stopColor="#3a4266" />
          <stop offset="0.5" stopColor="#0e101b" />
          <stop offset="1" stopColor="#030409" />
        </radialGradient>
        <linearGradient id={`${id}-glow`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4988b8" />
          <stop offset="0.3" stopColor="#67a1c6" />
          <stop offset="0.5" stopColor="#c8c8c8" />
          <stop offset="0.7" stopColor="#ccb64a" />
          <stop offset="1" stopColor="#cc4e73" />
        </linearGradient>
        <clipPath id={`${id}-screen`}>
          <rect x="17" y="17" width="106" height="66" rx="12" />
        </clipPath>
      </defs>

      {/* the pole clamp it hangs from */}
      <rect x="60" y="94" width="20" height="14" rx="5" fill="#1f2a4d" />
      {/* the lead, trailing off to some unseen patient */}
      <path d="M128 66 q14 6 8 22 q-5 13 -18 18" fill="none" stroke="#1f2a4d" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="117" cy="106" r="4.5" fill="#cc4e73" stroke="#1f2a4d" strokeWidth="2" />

      {/* casing: the same black jelly as the logo and every button */}
      <rect x="6" y="6" width="128" height="90" rx="24" fill={`url(#${id}-case)`} />
      <rect x="10" y="74" width="120" height="20" rx="10" fill={`url(#${id}-glow)`} opacity="0.35" />
      <path d="M26 12 h88" stroke="rgb(255 255 255 / 0.45)" strokeWidth="5" strokeLinecap="round" />

      {/* screen */}
      <rect x="17" y="17" width="106" height="66" rx="12" fill="#06140f" stroke="#2c3550" strokeWidth="2" />
      <g clipPath={`url(#${id}-screen)`}>
        {/* faint grid */}
        <path d="M17 39 h106 M17 61 h106 M52 17 v66 M88 17 v66" stroke="#7fe0a8" strokeOpacity="0.08" strokeWidth="1" />
        {/* eyes */}
        <g className={styles.eyes}>
          <rect x="42" y="30" width="9" height="13" rx="4.5" fill="#7fe0a8" />
          <rect x="66" y="30" width="9" height="13" rx="4.5" fill="#7fe0a8" />
        </g>
        {/* the trace, which doubles as a mouth: taller when Beep is talking */}
        <g transform={`translate(0 ${talking ? 64 : 62})`}>
          <g className={talking ? styles.traceTalking : undefined}>
            <path
              className={styles.trace}
              style={{ animationDuration: `${beatSeconds}s` }}
              d={`M17 0 ${BEAT} ${BEAT} ${BEAT}`}
              fill="none"
              stroke="#7fe0a8"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
        {/* heart rate readout */}
        <text x="118" y="31" textAnchor="end" className={styles.rate}>
          {rate}
        </text>
        <path className={styles.heart} style={{ animationDuration: `${beatSeconds}s` }} d="M93 25 c-2 -3 -6 -1 -4 2 l4 4 l4 -4 c2 -3 -2 -5 -4 -2 z" fill="#cc4e73" />
      </g>
      {/* the alarm light on top: blinks when things get tense */}
      <circle cx="116" cy="10" r="4" fill="#ccb64a" stroke="#1f2a4d" strokeWidth="1.5" className={rate >= 120 ? styles.alarm : undefined} />
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
