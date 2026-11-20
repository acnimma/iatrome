'use client';

import { useEffect, useMemo, useState } from 'react';
import { CANVAS_SIZE, type Drawing } from '@iatrome/game/client';
import { strokeColor, strokePath } from './strokes';
import styles from './Drawing.module.css';

interface Props {
  drawing: Drawing | null;
  /** Replay the drawing stroke-by-stroke over this many ms. */
  replayMs?: number;
  className?: string;
  label?: string;
}

/** Renders a drawing as crisp SVG at any size, optionally replaying how it was drawn. */
export function DrawingView({ drawing, replayMs, className, label }: Props) {
  const total = useMemo(() => drawing?.strokes.reduce((n, s) => n + s.p.length / 2, 0) ?? 0, [drawing]);
  const [shown, setShown] = useState(replayMs ? 0 : Infinity);

  useEffect(() => {
    if (!replayMs || !total) {
      setShown(Infinity);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      const progress = Math.min(1, (t - start) / replayMs);
      setShown(Math.floor(progress * total));
      if (progress < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [replayMs, total]);

  let budget = shown;
  return (
    <svg viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} className={`${styles.view} ${className ?? ''}`} role="img" aria-label={label ?? 'A drawing'}>
      {drawing?.strokes.map((s, i) => {
        if (budget <= 0) return null;
        const count = Math.min(s.p.length / 2, budget);
        budget -= count;
        const d = strokePath(count === s.p.length / 2 ? s.p : s.p.slice(0, count * 2), s.w, count === s.p.length / 2);
        return <path key={i} d={d} fill={strokeColor(s)} />;
      })}
    </svg>
  );
}
