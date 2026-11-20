// The stethoscope "!" — the brand's signature glyph.
// Earpieces + Y-tube form the bar of the exclamation mark; the chestpiece is the dot.
// Drawn in a 100 × 200 box (y down), with the baseline at y = 200.

export const STETHOSCOPE_BOX = { width: 100, height: 200 };

/** Shapes are stroked lines (`w` = stroke width) or filled circles. */
export const stethoscopeShapes = [
  // binaural arms curving into the Y
  { kind: 'line', d: 'M24 16 C 19 56, 33 84, 50 100', w: 15 },
  { kind: 'line', d: 'M76 16 C 81 56, 67 84, 50 100', w: 15 },
  // tube — the bar of the "!"
  { kind: 'line', d: 'M50 100 L 50 134', w: 24 },
  // earpiece tips
  { kind: 'circle', cx: 24, cy: 14, r: 12 },
  { kind: 'circle', cx: 76, cy: 14, r: 12 },
  // chestpiece — the dot of the "!"
  { kind: 'circle', cx: 50, cy: 176, r: 24 },
];

/** Decorative details drawn on top of the colour layer (not outlined). */
export const stethoscopeDetails = [
  { kind: 'ring', cx: 50, cy: 176, r: 11, w: 5 },
];
