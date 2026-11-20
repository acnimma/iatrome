import { DRAW_COLORS, DRAW_SIZES, type Stroke } from '@iatrome/game/client';
import { getStroke } from 'perfect-freehand';

/** perfect-freehand outline → SVG path. Simulated pressure makes finger strokes feel inked. */
export function strokePath(points: number[], sizeIndex: number, complete = true): string {
  const input: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) input.push([points[i], points[i + 1]]);
  if (input.length === 1) input.push([input[0][0] + 0.5, input[0][1] + 0.5]); // a dot
  const outline = getStroke(input, {
    size: DRAW_SIZES[sizeIndex] ?? DRAW_SIZES[1],
    thinning: 0.55,
    smoothing: 0.6,
    streamline: 0.45,
    simulatePressure: true,
    last: complete,
  });
  return svgPath(outline);
}

export const strokeColor = (s: Pick<Stroke, 'c'>) => DRAW_COLORS[s.c] ?? DRAW_COLORS[0];

function svgPath(points: number[][]): string {
  if (points.length < 4) return '';
  const avg = (a: number, b: number) => ((a + b) / 2).toFixed(1);
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)} Q${points[1][0].toFixed(1)},${points[1][1].toFixed(1)} ${avg(points[1][0], points[2][0])},${avg(points[1][1], points[2][1])} T`;
  for (let i = 2; i < points.length - 1; i++) d += `${avg(points[i][0], points[i + 1][0])},${avg(points[i][1], points[i + 1][1])} `;
  return `${d}Z`;
}
