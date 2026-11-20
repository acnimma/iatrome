// Generates every logo, favicon, and social image from the font + palette.
// Run with `npm run brand` from the repo root. Outputs are committed so the web
// app never needs this package at build time.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { jelly, palette, rainbow, surface } from './palette.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const fontFile = path.resolve(here, '../fonts/Dogbangy.ttf');
const webApp = path.join(root, 'apps/web/src/app'); // Next.js file-convention icons
const webPublic = path.join(root, 'apps/web/public/brand');
const glyphModule = path.join(root, 'apps/web/src/components/brand/wordmark-glyphs.ts');

const font = opentype.parse((await fs.readFile(fontFile)).buffer);
const round = (n) => Math.round(n * 100) / 100;

const WORD = 'iatrome';
const TABLET = WORD.indexOf('o'); // the "o" is drawn as a scored tablet, not the font's glyph
const WORD_SIZE = 200; // font size the wordmark is laid out at (its user units)

/** Where each palette colour sits along a gradient (0 = left edge, 1 = right edge). */
const STOP_OFFSETS = [0.04, 0.3, 0.49, 0.66, 0.96];
const gradientStops = rainbow.map((color, i) => ({ offset: STOP_OFFSETS[i], color }));

// ── The black-jelly finish ───────────────────────────────────────────────────
// A deep black body, a glossy crescent of light just inside each top edge, a
// faint sheen on the very rim, and the palette glowing through the bottom edge
// the way light passes through a gummy sweet. Every measure scales with `em`,
// the font size (or its equivalent) the shape is drawn at.

function jellyLook(em) {
  return {
    shadow: { dy: round(em * 0.05), blur: round(em * 0.034), opacity: 0.34, color: jelly.shadow },
    edge: round(em * 0.022), // softness of the rim bands
    glow: { blur: round(em * 0.04), rise: round(em * 0.042), opacity: 0.8 },
    sheen: { drop: round(em * 0.02), opacity: 0.32 },
    shine: { blur: round(em * 0.05), drop: round(em * 0.05), soften: round(em * 0.008), opacity: 0.88 },
  };
}

/**
 * The paint every jelly shape uses: `${id}-fill` (the palette, which only shows
 * as the glow), `${id}-jelly` (the finish) and `${id}-shadow` (a soft blur).
 * The fill gradient runs horizontally from x1 to x2 in user units.
 */
function jellyDefs(id, look, { x1, x2 }) {
  const { edge, glow, sheen, shine } = look;
  // the part of the shape that `from` (a copy of its silhouette), shifted by dy, no longer covers,
  // softened and kept inside the shape
  const band = (from, dy, name) =>
    `<feOffset in="${from}" dy="${dy}"/><feComposite in="SourceAlpha" operator="out"/>` +
    `<feGaussianBlur stdDeviation="${edge / 2}"/><feComposite in2="SourceAlpha" operator="in" result="${name}"/>`;
  const paint = (color, opacity, area, name) =>
    `<feFlood flood-color="${color}" flood-opacity="${opacity}"/><feComposite in2="${area}" operator="in" result="${name}"/>`;
  return (
    `<linearGradient id="${id}-fill" gradientUnits="userSpaceOnUse" x1="${round(x1)}" y1="0" x2="${round(x2)}" y2="0">` +
    gradientStops.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join('') +
    `</linearGradient>` +
    `<filter id="${id}-jelly" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    paint(jelly.body, 1, 'SourceAlpha', 'body') +
    // palette glow through the bottom edge, fading softly upwards
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${glow.blur}" result="deep"/>` +
    band('deep', -glow.rise, 'low') +
    `<feComposite in="SourceGraphic" in2="low" operator="in"/>` +
    `<feComponentTransfer result="glow"><feFuncA type="linear" slope="${glow.opacity}"/></feComponentTransfer>` +
    // faint sheen on the top-facing rims only
    band('SourceAlpha', sheen.drop, 'top') +
    paint('#fff', sheen.opacity, 'top', 'sheen') +
    // the glossy crescent: the top of an inset copy of the shape
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${shine.blur}"/>` +
    `<feComponentTransfer result="inset"><feFuncA type="linear" slope="12" intercept="-6.6"/></feComponentTransfer>` +
    `<feOffset in="inset" dy="${shine.drop}" result="inset-low"/>` +
    `<feComposite in="inset" in2="inset-low" operator="out"/>` +
    `<feGaussianBlur stdDeviation="${shine.soften}" result="crescent"/>` +
    paint('#fff', shine.opacity, 'crescent', 'shine') +
    `<feMerge><feMergeNode in="body"/><feMergeNode in="glow"/><feMergeNode in="sheen"/><feMergeNode in="shine"/></feMerge>` +
    `</filter>` +
    `<filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="180%"><feGaussianBlur stdDeviation="${look.shadow.blur}"/></filter>`
  );
}

/** Shadow paths for a set of shapes; draw them all before any of the shapes. */
const shadowOf = (parts, id, { shadow }) =>
  parts
    .map((d) => `<path d="${d}" transform="translate(0 ${shadow.dy})" fill="${shadow.color}" opacity="${shadow.opacity}" filter="url(#${id}-shadow)"/>`)
    .join('');

const jellyOf = (parts, id) => parts.map((d) => `<path d="${d}" fill="url(#${id}-fill)" filter="url(#${id}-jelly)"/>`).join('');

const svgDoc = (w, h, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(w)} ${round(h)}" width="${round(w)}" height="${round(h)}"><defs>${defs}</defs>${body}</svg>`;

// ── The tablet: a round pill with a score line ───────────────────────────────

const TILT = 10; // degrees the score line leans to the right, for a playful bounce

/**
 * The two halves of a scored tablet centred on (cx, cy), as path data
 * [left, right]. The score line is a gap between two D shapes whose inner
 * corners are softly rounded; `pivot` is the bottom end of the score line,
 * the hinge the halves open around when the tablet cracks.
 */
function tablet({ cx, cy, r, gap = r * 0.075 }) {
  const a = (TILT * Math.PI) / 180;
  const at = (x, y) => [round(cx + x * Math.cos(a) - y * Math.sin(a)), round(cy + x * Math.sin(a) + y * Math.cos(a))];
  const h = gap / 2;
  const s = Math.sqrt(r * r - h * h);
  const corner = r * 0.2; // how softly the chord meets the rim
  const turn = corner / r;
  const half = (side) => {
    // side = 1 for the right half; -1 mirrors it
    const pt = (x, y) => at(side * x, y).join(' ');
    const top = Math.atan2(-s, h) + turn;
    const bottom = Math.atan2(s, h) - turn;
    return (
      `M${pt(h, -s + corner)}Q${pt(h, -s)} ${pt(r * Math.cos(top), r * Math.sin(top))}` +
      `A${round(r)} ${round(r)} 0 0 ${side > 0 ? 1 : 0} ${pt(r * Math.cos(bottom), r * Math.sin(bottom))}` +
      `Q${pt(h, s)} ${pt(h, s - corner)}Z`
    );
  };
  const [px, py] = at(0, r);
  return { parts: [half(-1), half(1)], pivot: { x: px, y: py } };
}

// ── Wordmark: "iatrome" with a tablet for the "o" ────────────────────────────

/**
 * Each letter's shapes (one path, or the tablet's two halves) and ink box,
 * with the word's pen starting at (x, baseline).
 */
function wordLetters(x, baseline, size = WORD_SIZE) {
  const letters = [];
  font.forEachGlyph(WORD, x, baseline, size, {}, (glyph, gx, gy, gs) => {
    const p = glyph.getPath(gx, gy, gs);
    const b = p.getBoundingBox();
    if (letters.length !== TABLET) {
      letters.push({ char: String.fromCharCode(glyph.unicode), parts: [p.toPathData(2)], box: b });
      return;
    }
    // sized to the font's "o", nudged up a touch so the solid disc doesn't look heavier
    const r = ((b.y2 - b.y1) / 2) * 0.99;
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2 - r * 0.02;
    letters.push({
      char: 'o',
      ...tablet({ cx, cy, r }),
      box: { x1: cx - r, y1: cy - r, x2: cx + r, y2: cy + r },
    });
  });
  return letters;
}

/** Lays the word out so its ink (incl. shadow) starts at the origin. */
function wordLayout() {
  const look = jellyLook(WORD_SIZE);
  const pad = look.edge;
  const raw = wordLetters(0, 0);
  const x0 = pad - Math.min(...raw.map((l) => l.box.x1));
  const baseline = pad - Math.min(...raw.map((l) => l.box.y1));
  const letters = wordLetters(x0, baseline);
  const box = {
    x1: Math.min(...letters.map((l) => l.box.x1)),
    x2: Math.max(...letters.map((l) => l.box.x2)),
    y2: Math.max(...letters.map((l) => l.box.y2)),
  };
  const below = look.shadow.dy + look.shadow.blur * 2.5;
  return { look, letters, box, width: box.x2 + pad, height: box.y2 + below, below };
}

function wordmark() {
  const { look, letters, box, width, height } = wordLayout();
  const parts = letters.flatMap((l) => l.parts);
  const id = 'iatrome';
  return svgDoc(width, height, jellyDefs(id, look, box), shadowOf(parts, id, look) + jellyOf(parts, id));
}

// ── App mark: the tablet on a palette squircle ───────────────────────────────

/** `minimal` keeps flat shapes and a simple glint so 16–32px favicons stay crisp. */
function appMark({ size = 512, minimal = false, maskable = false } = {}) {
  const r = size * (maskable ? 0.27 : minimal ? 0.4 : 0.35); // maskable art stays in the safe zone
  const look = jellyLook(r * 2.9); // the tablet's equivalent font size
  const cy = size / 2 - (minimal ? 0 : look.shadow.dy * 0.4); // optically centred over its shadow
  const { parts } = tablet({ cx: size / 2, cy, r, gap: r * (minimal ? 0.16 : 0.09) });
  const id = 'mark';

  const radius = maskable ? 0 : size * 0.23;
  const defs =
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.skyBlue}"/><stop offset="1" stop-color="${palette.coolSky}"/></linearGradient>` +
    (minimal ? '' : jellyDefs(id, look, { x1: size / 2 - r, x2: size / 2 + r }));
  const bg = `<rect width="${size}" height="${size}" rx="${round(radius)}" fill="url(#bg)"/>`;
  if (!minimal) return svgDoc(size, size, defs, bg + shadowOf(parts, id, look) + jellyOf(parts, id));

  // a flat black tablet with one bright glint on its upper left
  const glint = r * 0.62;
  const g = (deg) => [round(size / 2 + glint * Math.cos((deg * Math.PI) / 180)), round(size / 2 + glint * Math.sin((deg * Math.PI) / 180))];
  const [sx, sy] = g(-160);
  const [ex, ey] = g(-122);
  const shine = `<path d="M${sx} ${sy}A${round(glint)} ${round(glint)} 0 0 1 ${ex} ${ey}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="${round(r * 0.17)}" stroke-linecap="round"/>`;
  return svgDoc(size, size, defs, bg + parts.map((d) => `<path d="${d}" fill="${jelly.body}"/>`).join('') + shine);
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

// ── Interactive wordmark data (per-letter shapes for the React component) ────

/** Placeholder the component swaps for its own unique id prefix. */
const ID = '__ID__';

function wordmarkGlyphs() {
  const { look, letters, box, width, height, below } = wordLayout();
  const bleed = look.edge;
  return {
    width: round(width),
    height: round(height),
    paint: jellyDefs(ID, look, box),
    shadow: look.shadow,
    below: round(below), // how far each letter's box reaches below its ink (room for the shadow)
    // which letter is the tablet, its size, the hinge its halves open around, and its tilt
    tablet: {
      index: TABLET,
      radius: round((letters[TABLET].box.x2 - letters[TABLET].box.x1) / 2),
      pivot: letters[TABLET].pivot,
      tilt: TILT,
    },
    letters: letters.map(({ char, parts, box: b }) => ({
      char,
      parts,
      // the letter's own box (incl. its shadow), in wordmark units
      box: {
        x: round(b.x1 - bleed),
        y: round(b.y1 - bleed),
        width: round(b.x2 - b.x1 + bleed * 2),
        height: round(b.y2 - b.y1 + bleed + below),
      },
    })),
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
