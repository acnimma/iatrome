'use client';

import { useEffect, useRef, useState } from 'react';
import type { Phase } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { play } from '@/lib/sound';
import styles from './TimerRing.module.css';

interface Props {
  phase: Phase;
  pausedAt: number | null;
  size?: number;
  /** Tick sound for the last five seconds (stage only). */
  ticks?: boolean;
}

/** A countdown ring driven by server time: every screen shows the same second. */
export function TimerRing({ phase, pausedAt, size = 64, ticks = false }: Props) {
  const room = useRoom();
  const [remaining, setRemaining] = useState(0);
  const lastTick = useRef<number | null>(null);
  const total = phase.endsAt ? phase.endsAt - phase.startedAt : 0;

  useEffect(() => {
    if (!phase.endsAt) return;
    let raf = 0;
    const frame = () => {
      const now = pausedAt ?? room.serverNow();
      const left = Math.max(0, phase.endsAt! - now);
      setRemaining(left);
      const secs = Math.ceil(left / 1000);
      if (ticks && !pausedAt && secs <= 5 && secs > 0 && lastTick.current !== secs) {
        lastTick.current = secs;
        play('tick');
      }
      if (left > 0 && !pausedAt) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [phase.endsAt, pausedAt, room, ticks]);

  if (!phase.endsAt || total <= 0) return null;
  const fraction = Math.max(0, Math.min(1, remaining / total));
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const urgent = remaining <= 5000;

  return (
    <div className={`${styles.ring} ${urgent ? styles.urgent : ''}`} style={{ width: size, height: size }} role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={r} className={styles.track} />
        <circle
          cx="50"
          cy="50"
          r={r}
          className={styles.bar}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <span className={styles.count} style={{ fontSize: size * 0.34 }}>
        {Math.ceil(remaining / 1000)}
      </span>
    </div>
  );
}
