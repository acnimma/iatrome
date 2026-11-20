// The iatrome palette. Mirrors apps/web/src/styles/tokens.css — keep in sync.
export const palette = {
  coolSky: '#4988b8',
  skyBlue: '#67a1c6',
  brightSnow: '#c8c8c8',
  royalGold: '#ccb64a',
  roseKiss: '#cc4e73',
  // Not in the source palette: a deep navy derived from cool-sky's hue,
  // used for outlines and text so the palette stays legible.
  ink: '#1f2a4d',
};

/** Page surface (not a palette colour): a warm white with softly warmer edges. */
export const surface = {
  warmWhite: '#fbf8f3',
  vignette: '#e9dccb',
};

/** The five palette colours in gradient order (left → right). */
export const rainbow = [
  palette.coolSky,
  palette.skyBlue,
  palette.brightSnow,
  palette.royalGold,
  palette.roseKiss,
];
