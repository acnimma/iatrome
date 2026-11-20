'use client';

import { useEffect, useRef } from 'react';
import type { Phase } from '@iatrome/game/client';
import { useRoom } from '@/realtime/use-room';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';
import styles from './TimerRing.module.css';

interface Props {
  phase: Phase;
  pausedAt: number | null;
  size?: number;
  /** Tick sound for the last five seconds and a buzzer at zero (stage only). */
  ticks?: boolean;
}

const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;
/** The ring cools from blue to gold to rose as time runs out. */
const STOPS: [number, [number, number, number]][] = [
  [1, [73, 136, 184]], // cool sky
  [0.45, [73, 136, 184]],
  [0.25, [204, 182, 74]], // royal gold
  [0, [204, 78, 115]], // rose kiss
];

function colorAt(fraction: number): string {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [hi, a] = STOPS[i];
    const [lo, b] = STOPS[i + 1];
    if (fraction <= hi && fraction >= lo) {
      const t = hi === lo ? 0 : (hi - fraction) / (hi - lo);
      return `rgb(${a.map((c, k) => Math.round(c + (b[k] - c) * t)).join(' ')})`;
    }
  }
  return 'rgb(204 78 115)';
}

/**
 * A countdown ring driven by server time, so every screen shows the same second.
 * Animates straight on the DOM at 60fps (no React re-render per frame). The last
 * five seconds pop and buzz the phone; zero gets a squishy "time's up".
 */
export function TimerRing({ phase, pausedAt, size = 64, ticks = false }: Props) {
  const room = useRoom();
  const wrap = useRef<HTMLDivElement>(null);
  const bar = useRef<SVGCircleElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const total = phase.endsAt ? phase.endsAt - phase.startedAt : 0;

  useEffect(() => {
    if (!phase.endsAt || total <= 0) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let shown = -1;

    const frame = () => {
      const now = pausedAt ?? room.serverNow();
      const left = Math.max(0, phase.endsAt! - now);
      const fraction = Math.min(1, left / total);
      const secs = Math.ceil(left / 1000);

      if (bar.current) {
        bar.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - fraction));
        bar.current.style.stroke = colorAt(fraction);
      }

      if (secs !== shown) {
        const first = shown === -1;
        shown = secs;
        if (count.current) count.current.textContent = String(secs);
        wrap.current?.setAttribute('aria-label', `${secs} seconds left`);
        wrap.current?.toggleAttribute('data-urgent', secs <= 5 && secs > 0);
        if (!first && !pausedAt) {
          if (secs <= 5 && secs > 0) {
            if (!calm) count.current?.animate([{ transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
            if (secs <= 3) haptic('tap');
            if (ticks) play('tick');
          }
          if (secs === 0) {
            if (!calm)
              wrap.current?.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(1.25, 0.8)' }, { transform: 'scale(0.92, 1.1)' }, { transform: 'scale(1)' }],
                { duration: 520, easing: 'ease-out' },
              );
            if (ticks) play('buzz');
          }
        }
      }
      if (left > 0 && !pausedAt) raf = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [phase.endsAt, total, pausedAt, room, ticks]);

  if (!phase.endsAt || total <= 0) return null;

  return (
    <div ref={wrap} className={styles.ring} style={{ width: size, height: size }} role="timer">
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r={R} className={styles.track} />
        <circle ref={bar} cx="50" cy="50" r={R} className={styles.bar} strokeDasharray={CIRCUMFERENCE} />
      </svg>
      <span ref={count} className={styles.count} style={{ fontSize: size * 0.36 }} />
      {pausedAt && <span className={styles.paused} aria-hidden />}
    </div>
  );
}
