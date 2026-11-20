// Generates every logo, favicon, and social image from the font + palette.
// Run with `npm run brand` from the repo root. Outputs are committed so the web
// app never needs this package at build time.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { palette, rainbow, surface } from './palette.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const fontFile = path.resolve(here, '../fonts/Dogbangy.ttf');
const webApp = path.join(root, 'apps/web/src/app'); // Next.js file-convention icons
const webPublic = path.join(root, 'apps/web/public/brand');
const glyphModule = path.join(root, 'apps/web/src/components/brand/wordmark-glyphs.ts');

const font = opentype.parse((await fs.readFile(fontFile)).buffer);
const round = (n) => Math.round(n * 100) / 100;

const WORD = 'iatrome';
const WORD_SIZE = 200; // font size the wordmark is laid out at (its user units)

/** Where each palette colour sits along the word (0 = left edge, 1 = right edge). */
const STOP_OFFSETS = [0.04, 0.3, 0.49, 0.66, 0.96];
const gradientStops = rainbow.map((color, i) => ({ offset: STOP_OFFSETS[i], color }));

// ── The letter treatment ─────────────────────────────────────────────────────
// A fine ink outline, a soft pillowy gloss inside the letter and a diffuse
// shadow underneath. Every measure scales with the font size.
// apps/web/src/components/brand/Wordmark.tsx renders the same layers.

function treatment(size) {
  return {
    outline: round(size * 0.017), // visible ink outside the letter edge
    shadow: { dy: round(size * 0.045), blur: round(size * 0.032), opacity: 0.2 },
    gloss: { blur: round(size * 0.028), offset: round(size * 0.04), highlight: 0.62, shade: 0.2 },
  };
}

const stopsSvg = (stops) => stops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('');

/**
 * Filters shared by every rendering of the letters. The gloss lights the top
 * inside edge of each letter and gently shades the bottom one, so the flat
 * fill reads as a soft, rounded pillow.
 */
function filterDefs({ shadow, gloss }) {
  // a soft band just inside the letter edge: dy > 0 picks the top edge, dy < 0 the bottom
  const rim = (name, dy, color, opacity) =>
    `<feOffset in="soft" dy="${dy}" result="${name}-shifted"/>` +
    `<feComposite in="SourceAlpha" in2="${name}-shifted" operator="out" result="${name}-band"/>` +
    `<feFlood flood-color="${color}" flood-opacity="${opacity}"/>` +
    `<feComposite in2="${name}-band" operator="in" result="${name}"/>`;
  return (
    `<filter id="shadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="${shadow.blur}"/></filter>` +
    `<filter id="gloss" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${gloss.blur}" result="soft"/>` +
    rim('highlight', gloss.offset, '#fff', gloss.highlight) +
    rim('shade', -gloss.offset, palette.ink, gloss.shade) +
    `<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="highlight"/></feMerge>` +
    `</filter>`
  );
}

/** Shadow, outline, then the glossy fill: one letter (or word) path, fully dressed. */
function dressed(d, { outline, shadow }, fill) {
  return (
    `<path d="${d}" transform="translate(0 ${shadow.dy})" fill="${palette.ink}" opacity="${shadow.opacity}" filter="url(#shadow)"/>` +
    `<path d="${d}" fill="${palette.ink}" stroke="${palette.ink}" stroke-width="${round(outline * 2)}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="${fill}" filter="url(#gloss)"/>`
  );
}

const svgDoc = (w, h, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(w)} ${round(h)}" width="${round(w)}" height="${round(h)}"><defs>${defs}</defs>${body}</svg>`;

// ── Wordmark: "iatrome" ──────────────────────────────────────────────────────

/** Lays the word out so its ink (incl. outline and shadow) starts at the origin. */
function wordLayout(size = WORD_SIZE) {
  const t = treatment(size);
  const pad = t.outline * 2;
  const raw = font.getPath(WORD, 0, 0, size).getBoundingBox();
  const x0 = pad - raw.x1;
  const baseline = pad - raw.y1;
  const box = font.getPath(WORD, x0, baseline, size).getBoundingBox();
  return {
    t,
    x0,
    baseline,
    box,
    width: box.x2 + pad,
    height: box.y2 + Math.max(pad, t.shadow.dy + t.shadow.blur * 2),
  };
}

function wordmark() {
  const { t, x0, baseline, box, width, height } = wordLayout();
  const d = font.getPath(WORD, x0, baseline, WORD_SIZE).toPathData(2);
  const defs =
    `<linearGradient id="fill" gradientUnits="userSpaceOnUse" x1="${round(box.x1)}" y1="0" x2="${round(box.x2)}" y2="0">${stopsSvg(gradientStops)}</linearGradient>` +
    filterDefs(t);
  return svgDoc(width, height, defs, dressed(d, t, 'url(#fill)'));
}

// ── App mark: the "i" on a palette squircle ──────────────────────────────────

/** `minimal` keeps just the fill and outline so 16–32px favicons stay crisp. */
function appMark({ size = 512, minimal = false, maskable = false } = {}) {
  const glyphHeight = size * (maskable ? 0.52 : 0.66); // maskable art stays in the safe zone
  const raw = font.getPath('i', 0, 0, 1000).getBoundingBox();
  const glyphSize = (glyphHeight / (raw.y2 - raw.y1)) * 1000;
  const t = treatment(glyphSize);
  const letterW = ((raw.x2 - raw.x1) / 1000) * glyphSize;
  const x = (size - letterW) / 2 - (raw.x1 / 1000) * glyphSize;
  // centre optically: nudge up a touch so the shadow doesn't weigh it down
  const nudge = minimal ? 0 : t.shadow.dy * 0.4;
  const baseline = (size - glyphHeight) / 2 - (raw.y1 / 1000) * glyphSize - nudge;
  const d = font.getPath('i', x, baseline, glyphSize).toPathData(2);

  const defs =
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.skyBlue}"/><stop offset="1" stop-color="${palette.coolSky}"/></linearGradient>` +
    `<linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0.1" stop-color="${palette.royalGold}"/><stop offset="1" stop-color="${palette.roseKiss}"/></linearGradient>` +
    (minimal ? '' : filterDefs(t));
  const radius = maskable ? 0 : size * 0.23;
  const bg = `<rect width="${size}" height="${size}" rx="${round(radius)}" fill="url(#bg)"/>`;
  const letter = minimal
    ? `<path d="${d}" fill="url(#fill)" stroke="${palette.ink}" stroke-width="${round(t.outline * 2)}" paint-order="stroke" stroke-linejoin="round"/>`
    : dressed(d, t, 'url(#fill)');
  return svgDoc(size, size, defs, bg + letter);
}

// ── Social card ──────────────────────────────────────────────────────────────

/** Warm-white page surface with a soft, warm vignette. */
function surfaceSvg(w, h) {
  return svgDoc(
    w,
    h,
    `<radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.45" stop-color="${surface.vignette}" stop-opacity="0"/><stop offset="1" stop-color="${surface.vignette}" stop-opacity="0.85"/></radialGradient>`,
    `<rect width="${w}" height="${h}" fill="${surface.warmWhite}"/><rect width="${w}" height="${h}" fill="url(#vignette)"/>`,
  );
}

async function socialCard(wordmarkSvg) {
  const W = 1200;
  const H = 630;
  const logo = await sharp(Buffer.from(wordmarkSvg), { density: 300 }).resize({ width: 820 }).png().toBuffer();
  const { width, height } = await sharp(logo).metadata();

  const tagline = 'medical party game';
  const tagOpts = { letterSpacing: 0.14 };
  const tagSize = 30;
  const tagBox = font.getPath(tagline, 0, 0, tagSize, tagOpts).getBoundingBox();
  const tagX = (W - (tagBox.x2 - tagBox.x1)) / 2 - tagBox.x1;
  const taglineSvg = svgDoc(W, H, '', `<path d="${font.getPath(tagline, tagX, 450, tagSize, tagOpts).toPathData(2)}" fill="${palette.ink}" opacity="0.62"/>`);

  return sharp(Buffer.from(surfaceSvg(W, H)))
    .composite([
      { input: logo, left: Math.round((W - width) / 2), top: Math.round(285 - height / 2) },
      { input: Buffer.from(taglineSvg), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

// ── Interactive wordmark data (per-letter paths for the React component) ─────

function wordmarkGlyphs() {
  const { t, x0, baseline, box, width, height } = wordLayout();
  const bleed = t.outline * 1.5;
  const letters = [];
  font.forEachGlyph(WORD, x0, baseline, WORD_SIZE, {}, (glyph, gx, gy, gs) => {
    const p = glyph.getPath(gx, gy, gs);
    const b = p.getBoundingBox();
    letters.push({
      char: String.fromCharCode(glyph.unicode),
      d: p.toPathData(2),
      // the letter's own box (incl. outline and shadow), in wordmark units
      box: {
        x: round(b.x1 - bleed),
        y: round(b.y1 - bleed),
        width: round(b.x2 - b.x1 + bleed * 2),
        height: round(b.y2 - b.y1 + bleed + t.shadow.dy + t.shadow.blur * 2),
      },
    });
  });
  return {
    width: round(width),
    height: round(height),
    ...t,
    gradient: { x1: round(box.x1), x2: round(box.x2), stops: gradientStops },
    letters,
    ink: palette.ink,
  };
}

// ── Write everything ─────────────────────────────────────────────────────────

const png = (svg, size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

await fs.mkdir(webPublic, { recursive: true });

const wordmarkSvg = wordmark();
const markSvg = appMark();

await fs.writeFile(path.join(webPublic, 'wordmark.svg'), wordmarkSvg);
await fs.writeFile(path.join(webPublic, 'mark.svg'), markSvg);
await fs.writeFile(path.join(webApp, 'icon.svg'), appMark({ size: 64, minimal: true }));
await fs.writeFile(path.join(webApp, 'apple-icon.png'), await png(appMark({ size: 180 }), 180));
await fs.writeFile(path.join(webPublic, 'icon-192.png'), await png(appMark({ size: 192 }), 192));
await fs.writeFile(path.join(webPublic, 'icon-512.png'), await png(markSvg, 512));
await fs.writeFile(path.join(webPublic, 'icon-maskable-512.png'), await png(appMark({ maskable: true }), 512));
await fs.writeFile(
  path.join(webApp, 'favicon.ico'),
  await pngToIco(await Promise.all([16, 32, 48].map((s) => png(appMark({ size: s, minimal: s < 48 }), s)))),
);
await fs.writeFile(path.join(webApp, 'opengraph-image.png'), await socialCard(wordmarkSvg));
await fs.writeFile(
  glyphModule,
  `// Generated by packages/brand (npm run brand). Do not edit by hand.\n` +
    `export const wordmarkGlyphs = ${JSON.stringify(wordmarkGlyphs(), null, 2)} as const;\n`,
);

console.log('✓ brand assets written to apps/web/src/app and apps/web/public/brand');
