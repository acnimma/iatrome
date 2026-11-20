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

/**
 * The logo's black-jelly finish (not palette colours): a deep, slightly
 * blue-violet black, and the shadow it casts on the page.
 */
export const jelly = {
  body: '#0e101b',
  shadow: '#14121c',
};

/** The tablet "o": a white pill with a black outline and score line. */
export const pill = {
  body: '#fdfcf9',
  shade: '#b9b3aa', // soft shading along its lower edge, so it reads as a 3D tablet
  line: jelly.body,
};

/** The five palette colours in gradient order (left → right). */
export const rainbow = [
  palette.coolSky,
  palette.skyBlue,
  palette.brightSnow,
  palette.royalGold,
  palette.roseKiss,
];
