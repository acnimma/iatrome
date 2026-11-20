'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CANVAS_SIZE, DRAW_COLORS, DRAW_SIZES, type DrawOp, type Drawing, type Stroke } from '@iatrome/game/client';
import { haptic } from '@/lib/haptics';
import { strokeColor, strokePath } from './strokes';
import styles from './Drawing.module.css';

interface Props {
  /** Called after every finished stroke, undo or clear (for autosave). */
  onChange?: (drawing: Drawing) => void;
  /** Live operations, streamed while drawing (Sketch). */
  onOp?: (op: DrawOp) => void;
  disabled?: boolean;
  /** No undo: committed strokes stay, so the art stays gloriously bad (doodle duels). */
  noUndo?: boolean;
}

const MIN_STEP = 3; // canvas units between recorded points
const FLUSH_MS = 45; // batch live points this often

/**
 * A finger-friendly drawing surface. Pointer capture + coalesced events for smooth
 * curves, touch-action: none so drawing never scrolls or zooms the page.
 */
export function DrawPad({ onChange, onOp, disabled, noUndo }: Props) {
  const surface = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<Stroke | null>(null);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(1);
  const active = useRef<{ stroke: Stroke; pointerId: number; pending: number[]; sentBegin: boolean } | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // iOS Safari: belt-and-braces against page scroll / rubber-banding while drawing.
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const stop = (e: TouchEvent) => e.preventDefault();
    el.addEventListener('touchmove', stop, { passive: false });
    el.addEventListener('touchstart', stop, { passive: false });
    return () => {
      el.removeEventListener('touchmove', stop);
      el.removeEventListener('touchstart', stop);
    };
  }, []);

  const toCanvas = (e: PointerEvent | React.PointerEvent): [number, number] => {
    const r = surface.current!.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * CANVAS_SIZE);
    const y = Math.round(((e.clientY - r.top) / r.height) * CANVAS_SIZE);
    return [Math.max(0, Math.min(CANVAS_SIZE, x)), Math.max(0, Math.min(CANVAS_SIZE, y))];
  };

  const flush = useCallback(() => {
    flushTimer.current = null;
    const a = active.current;
    if (!a || !onOp || a.pending.length === 0) return;
    if (!a.sentBegin) {
      onOp({ op: 'begin', c: a.stroke.c, w: a.stroke.w, p: a.pending });
      a.sentBegin = true;
    } else onOp({ op: 'extend', p: a.pending });
    a.pending = [];
  }, [onOp]);

  const commit = (next: Stroke[]) => {
    setStrokes(next);
    onChange?.({ strokes: next });
  };

  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled || active.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = toCanvas(e);
    const stroke: Stroke = { c: color, w: size, p: [x, y] };
    active.current = { stroke, pointerId: e.pointerId, pending: [x, y], sentBegin: false };
    setCurrent({ ...stroke });
    flush();
  };

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = active.current;
    if (!a || e.pointerId !== a.pointerId) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const [x, y] = toCanvas(ev);
      const p = a.stroke.p;
      if (Math.hypot(x - p[p.length - 2], y - p[p.length - 1]) < MIN_STEP) continue;
      p.push(x, y);
      a.pending.push(x, y);
    }
    setCurrent({ ...a.stroke, p: a.stroke.p.slice() });
    if (onOp && !flushTimer.current) flushTimer.current = setTimeout(flush, FLUSH_MS);
  };

  const up = (e: React.PointerEvent<SVGSVGElement>) => {
    const a = active.current;
    if (!a || e.pointerId !== a.pointerId) return;
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flush();
    active.current = null;
    setCurrent(null);
    commit([...strokes, a.stroke]);
  };

  const undo = () => {
    if (!strokes.length) return;
    haptic('tap');
    commit(strokes.slice(0, -1));
    onOp?.({ op: 'undo' });
  };

  const clear = () => {
    if (!strokes.length) return;
    haptic('error');
    commit([]);
    onOp?.({ op: 'clear' });
  };

  return (
    <div className={styles.pad}>
      <svg
        ref={surface}
        viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
        className={`${styles.view} ${styles.surface}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label="Drawing canvas"
      >
        {strokes.map((s, i) => (
          <path key={i} d={strokePath(s.p, s.w)} fill={strokeColor(s)} />
        ))}
        {current && <path d={strokePath(current.p, current.w, false)} fill={strokeColor(current)} />}
      </svg>

      <div className={styles.tools}>
        <div className={styles.swatches} role="radiogroup" aria-label="Colour">
          {DRAW_COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === i}
              aria-label={`Colour ${i + 1}`}
              className={`${styles.swatch} ${color === i ? styles.picked : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(i)}
            />
          ))}
        </div>
        <div className={styles.row}>
          <div className={styles.sizes} role="radiogroup" aria-label="Brush size">
            {DRAW_SIZES.map((s, i) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === i}
                aria-label={['Fine', 'Medium', 'Thick'][i]}
                className={`${styles.size} ${size === i ? styles.picked : ''}`}
                onClick={() => setSize(i)}
              >
                <span style={{ width: 6 + i * 6, height: 6 + i * 6, background: DRAW_COLORS[color] }} />
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            {!noUndo && (
              <button type="button" className={styles.tool} onClick={undo} disabled={!strokes.length}>
                Undo
              </button>
            )}
            <button type="button" className={styles.tool} onClick={clear} disabled={!strokes.length}>
              {noUndo ? 'Start over' : 'Clear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
