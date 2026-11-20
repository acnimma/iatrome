'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CANVAS_SIZE, DRAW_SIZES, type DrawOp, type Drawing, type Stroke } from '@iatrome/game/client';
import { haptic } from '@/lib/haptics';
import { PALETTE, PALETTE_NAMES, strokeColor, strokePath } from './strokes';
import styles from './Drawing.module.css';

interface Props {
  /** Called after every finished stroke, undo or clear (for autosave). */
  onChange?: (drawing: Drawing) => void;
  /** Live operations, streamed while drawing (Sketch). */
  onOp?: (op: DrawOp) => void;
  disabled?: boolean;
  /** No undo: committed strokes stay, so the art stays gloriously bad (doodle duels). */
  noUndo?: boolean;
  /** Pixels to keep free under the pad (a submit button, a guess ticker) so they stay on screen. */
  reserve?: number;
}

const SIZE_NAMES = ['Fine', 'Medium', 'Thick'];
/** Never shrink below this, however short the phone: a cramped canvas is worse than a scroll. */
const MIN_SIDE = 220;

const MIN_STEP = 3; // canvas units between recorded points
const FLUSH_MS = 45; // batch live points this often

/**
 * A finger-friendly drawing surface. Pointer capture + coalesced events for smooth
 * curves, touch-action: none so drawing never scrolls or zooms the page.
 */
export function DrawPad({ onChange, onOp, disabled, noUndo, reserve = 76 }: Props) {
  const surface = useRef<SVGSVGElement>(null);
  const pad = useRef<HTMLDivElement>(null);
  const tools = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<number | null>(null);
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

  // As big as the phone allows: the full width, unless that would push the colours or the
  // button under the canvas off the bottom of the screen.
  useLayoutEffect(() => {
    const fit = () => {
      const svg = surface.current;
      if (!svg || !pad.current) return;
      const top = svg.getBoundingClientRect().top + window.scrollY;
      const toolsHeight = (tools.current?.offsetHeight ?? 44) + 10;
      const room = window.innerHeight - top - toolsHeight - reserve - 16;
      setSide(Math.floor(Math.max(MIN_SIDE, Math.min(pad.current.clientWidth, room))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.body);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [reserve]);

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
    <div ref={pad} className={styles.pad}>
      <div className={styles.board} style={side ? { width: side } : undefined}>
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

        {/* Brush, undo and clear float in the top corner, so the canvas gets the height. */}
        <div className={styles.corner}>
          <button
            type="button"
            className={styles.tool}
            onClick={() => setSize((size + 1) % DRAW_SIZES.length)}
            aria-label={`Brush: ${SIZE_NAMES[size]}. Tap for ${SIZE_NAMES[(size + 1) % DRAW_SIZES.length]}`}
          >
            <span className={styles.brush} style={{ width: 5 + size * 6, height: 5 + size * 6, background: PALETTE[color] }} />
          </button>
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

      <div ref={tools} className={styles.swatches} role="radiogroup" aria-label="Colour" style={side ? { width: side } : undefined}>
        {PALETTE.map((c, i) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === i}
            aria-label={PALETTE_NAMES[i]}
            className={`${styles.swatch} ${color === i ? styles.picked : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(i)}
          />
        ))}
      </div>
    </div>
  );
}
