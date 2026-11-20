// The iatrome palette. Mirrors apps/web/src/styles/tokens.css — keep in sync.
export const palette = {
  coolSky: '#5aa9e6',
  skyBlue: '#7fc8f8',
  brightSnow: '#f9f9f9',
  royalGold: '#ffe45e',
  roseKiss: '#ff6392',
  // Not in the source palette: a deep navy derived from cool-sky's hue,
  // used for outlines and text so the light palette stays legible.
  ink: '#1f2a4d',
};

/** The five palette colours in gradient order (left → right). */
export const rainbow = [
  palette.coolSky,
  palette.skyBlue,
  palette.brightSnow,
  palette.royalGold,
  palette.roseKiss,
];

/** Colour at position t (0–1) along the rainbow gradient. */
export function rainbowAt(t) {
  const clamped = Math.min(1, Math.max(0, t));
  const span = clamped * (rainbow.length - 1);
  const i = Math.min(rainbow.length - 2, Math.floor(span));
  const f = span - i;
  const a = hexToRgb(rainbow[i]);
  const b = hexToRgb(rainbow[i + 1]);
  const mix = a.map((c, k) => Math.round(c + (b[k] - c) * f));
  return `#${mix.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
