import { LIMITS } from './constants';
import { CANVAS_SIZE, DRAW_COLORS, DRAW_SIZES, type Drawing, type Stroke } from './types';

export function validStroke(s: Stroke): boolean {
  return (
    Number.isInteger(s.c) &&
    s.c >= 0 &&
    s.c < DRAW_COLORS.length &&
    Number.isInteger(s.w) &&
    s.w >= 0 &&
    s.w < DRAW_SIZES.length &&
    Array.isArray(s.p) &&
    s.p.length % 2 === 0 &&
    s.p.every((n) => Number.isInteger(n) && n >= 0 && n <= CANVAS_SIZE)
  );
}

export function validDrawing(d: Drawing): boolean {
  if (!d || !Array.isArray(d.strokes) || d.strokes.length > LIMITS.drawing.maxStrokes) return false;
  let points = 0;
  for (const s of d.strokes) {
    if (!validStroke(s)) return false;
    points += s.p.length / 2;
  }
  return points <= LIMITS.drawing.maxPoints;
}

export function pointCount(d: Drawing): number {
  return d.strokes.reduce((n, s) => n + s.p.length / 2, 0);
}

/** Live drawing operations streamed during Sketchy Diagnosis. */
export type DrawOp =
  | { op: 'begin'; c: number; w: number; p: number[] }
  | { op: 'extend'; p: number[] }
  | { op: 'undo' }
  | { op: 'clear' };

/** Apply a live op. Returns false (and leaves the drawing untouched) if invalid. */
export function applyDrawOp(d: Drawing, op: DrawOp): boolean {
  switch (op.op) {
    case 'begin': {
      const stroke = { c: op.c, w: op.w, p: op.p };
      if (!validStroke(stroke) || d.strokes.length >= LIMITS.drawing.maxStrokes) return false;
      if (pointCount(d) + op.p.length / 2 > LIMITS.drawing.maxPoints) return false;
      d.strokes.push(stroke);
      return true;
    }
    case 'extend': {
      const last = d.strokes[d.strokes.length - 1];
      if (!last || !validStroke({ ...last, p: op.p })) return false;
      if (pointCount(d) + op.p.length / 2 > LIMITS.drawing.maxPoints) return false;
      last.p.push(...op.p);
      return true;
    }
    case 'undo':
      d.strokes.pop();
      return true;
    case 'clear':
      d.strokes = [];
      return true;
  }
}
