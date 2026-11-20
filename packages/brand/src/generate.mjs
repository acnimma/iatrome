// Generates every logo, favicon, and social image from the font + palette.
// Run with `npm run brand` from the repo root. Outputs are committed so the web
// app never needs this package at build time.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { palette, rainbow, rainbowAt } from './palette.mjs';
import { STETHOSCOPE_BOX, stethoscopeShapes, stethoscopeDetails } from './stethoscope.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const fontFile = path.resolve(here, '../fonts/SuperNugget.ttf');
const webApp = path.join(root, 'apps/web/src/app'); // Next.js file-convention icons
const webPublic = path.join(root, 'apps/web/public/brand');

const font = opentype.parse((await fs.readFile(fontFile)).buffer);
const round = (n) => Math.round(n * 100) / 100;

// ── Building blocks ──────────────────────────────────────────────────────────

/** Gradient through all five palette colours, spanning x1 → x2. */
function rainbowGradient(id, x1, x2, y1 = 0, y2 = 0) {
  const stops = rainbow
    .map((c, i) => `<stop offset="${i / (rainbow.length - 1)}" stop-color="${c}"/>`)
    .join('');
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}">${stops}</linearGradient>`;
}

/**
 * The stethoscope is drawn in its own scaled coordinate space (0–100 wide), so
 * it gets the matching slice of the rainbow as a local gradient.
 */
function scopeSegmentGradient(id, gradStart, gradEnd, scopeLeft) {
  const t0 = (scopeLeft - gradStart) / (gradEnd - gradStart);
  const stops = [0, 0.5, 1]
    .map((f) => `<stop offset="${f}" stop-color="${rainbowAt(t0 + (1 - t0) * f)}"/>`)
    .join('');
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${STETHOSCOPE_BOX.width}" y2="0">${stops}</linearGradient>`;
}

/** Text as outlined paths, so no font file ever ships to the browser. */
function textPath(text, x, baseline, size) {
  const p = font.getPath(text, x, baseline, size);
  return { d: p.toPathData(2), box: p.getBoundingBox(), advance: font.getAdvanceWidth(text, size) };
}

/** Stethoscope "!" placed with its baseline at (x, baseline), `height` tall. */
function stethoscope(x, baseline, height) {
  const s = height / STETHOSCOPE_BOX.height;
  const top = baseline - height;
  return {
    width: STETHOSCOPE_BOX.width * s,
    /** Render one layer. `grow` thickens every shape (used for outlines). */
    layer(fill, grow = 0, dy = 0) {
      const t = `translate(${round(x)} ${round(top + dy)}) scale(${round(s * 1000) / 1000})`;
      const g = grow / s;
      const body = stethoscopeShapes
        .map((sh) =>
          sh.kind === 'line'
            ? `<path d="${sh.d}" fill="none" stroke="${fill}" stroke-width="${round(sh.w + 2 * g)}" stroke-linecap="round"/>`
            : `<circle cx="${sh.cx}" cy="${sh.cy}" r="${round(sh.r + g)}" fill="${fill}"/>`,
        )
        .join('');
      return `<g transform="${t}">${body}</g>`;
    },
    details(color) {
      const t = `translate(${round(x)} ${round(top)}) scale(${round(s * 1000) / 1000})`;
      return `<g transform="${t}">${stethoscopeDetails
        .map((d) => `<circle cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="none" stroke="${color}" stroke-width="${d.w}"/>`)
        .join('')}</g>`;
    },
  };
}

/**
 * The bubbly "sticker" treatment: ink extrusion underneath, ink outline,
 * colour fill on top. `parts` is a list of text paths and stethoscopes.
 */
function sticker({ texts, scopes, fill, scopeFill = fill, outline, depth, highlight }) {
  const textLayer = (paint, grow, dy) =>
    texts
      .map(
        (t) =>
          `<path d="${t.d}" transform="translate(0 ${dy})" fill="${paint}"${
            grow ? ` stroke="${paint}" stroke-width="${round(grow * 2)}" stroke-linejoin="round"` : ''
          }/>`,
      )
      .join('');
  const scopeLayer = (paint, grow, dy) => scopes.map((s) => s.layer(paint, grow, dy)).join('');
  return [
    depth ? textLayer(palette.ink, outline, depth) + scopeLayer(palette.ink, outline, depth) : '',
    outline ? textLayer(palette.ink, outline, 0) + scopeLayer(palette.ink, outline, 0) : '',
    textLayer(fill, 0, 0) + scopeLayer(scopeFill, 0, 0),
    highlight ? scopes.map((s) => s.details(highlight)).join('') : '',
  ].join('');
}

const svgDoc = (w, h, defs, body, bg = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(w)} ${round(h)}" width="${round(w)}" height="${round(h)}"><defs>${defs}</defs>${bg}${body}</svg>`;

// ── Wordmark: "iatrome" + stethoscope "!" ────────────────────────────────────

function wordmark({ size = 200 } = {}) {
  const outline = size * 0.045;
  const depth = size * 0.05;
  const pad = outline * 2;
  const capHeight = (font.tables.os2.sCapHeight / font.unitsPerEm) * size;
  const baseline = pad + capHeight * 1.08;
  const word = textPath('iatrome', pad, baseline, size);
  const scope = stethoscope(word.box.x2 + size * 0.06, baseline, capHeight * 1.08);
  const right = word.box.x2 + size * 0.06 + scope.width;
  const width = right + pad;
  const height = baseline + depth + pad;
  const defs = rainbowGradient('rainbow', pad, right) + scopeSegmentGradient('rainbow-scope', pad, right, right - scope.width);
  const body = sticker({
    texts: [word],
    scopes: [scope],
    fill: 'url(#rainbow)',
    scopeFill: 'url(#rainbow-scope)',
    outline,
    depth,
    highlight: palette.brightSnow,
  });
  return svgDoc(width, height, defs, body);
}

// ── App mark: "I" + stethoscope "!" on a squircle ────────────────────────────

/** `minimal` drops the outline/extrusion so 16–32px favicons stay crisp. */
function appMark({ size = 512, minimal = false, maskable = false } = {}) {
  const inset = maskable ? size * 0.1 : 0; // keep art inside the maskable safe zone
  const radius = maskable ? 0 : size * 0.23;
  const glyphSize = (size - inset * 2) * 0.78;
  const capHeight = (font.tables.os2.sCapHeight / font.unitsPerEm) * glyphSize;
  const letter = textPath('I', 0, 0, glyphSize);
  const scopeHeight = capHeight * 1.02;
  const scopeWidth = (STETHOSCOPE_BOX.width / STETHOSCOPE_BOX.height) * scopeHeight;
  const gap = glyphSize * 0.04;
  const groupWidth = letter.box.x2 - letter.box.x1 + gap + scopeWidth;
  const x0 = (size - groupWidth) / 2 - letter.box.x1;
  const baseline = size / 2 + capHeight / 2 - (minimal ? 0 : size * 0.015);
  const word = textPath('I', x0, baseline, glyphSize);
  const scope = stethoscope(word.box.x2 + gap, baseline, scopeHeight);

  const defs =
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.skyBlue}"/><stop offset="1" stop-color="${palette.coolSky}"/></linearGradient>` +
    `<linearGradient id="scope" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${STETHOSCOPE_BOX.height}"><stop offset="0" stop-color="${palette.royalGold}"/><stop offset="1" stop-color="${palette.roseKiss}"/></linearGradient>`;
  const bg = `<rect width="${size}" height="${size}" rx="${round(radius)}" fill="url(#bg)"/>`;
  const outline = minimal ? 0 : size * 0.022;
  const depth = minimal ? 0 : size * 0.028;
  const body = [
      depth ? `<path d="${word.d}" transform="translate(0 ${depth})" fill="${palette.ink}" stroke="${palette.ink}" stroke-width="${outline * 2}" stroke-linejoin="round"/>` + scope.layer(palette.ink, outline, depth) : '',
      outline ? `<path d="${word.d}" fill="${palette.ink}" stroke="${palette.ink}" stroke-width="${outline * 2}" stroke-linejoin="round"/>` + scope.layer(palette.ink, outline) : '',
      `<path d="${word.d}" fill="${palette.brightSnow}"/>`,
      scope.layer('url(#scope)'),
    minimal ? '' : scope.details(palette.brightSnow),
  ].join('');
  return svgDoc(size, size, defs, body, bg);
}

// ── Social card ──────────────────────────────────────────────────────────────

async function socialCard(wordmarkSvg) {
  const W = 1200;
  const H = 630;
  const blob = (cx, cy, r, c, o) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${o}"/>`;
  const bg = svgDoc(
    W,
    H,
    '<filter id="b"><feGaussianBlur stdDeviation="60"/></filter>',
    `<rect width="${W}" height="${H}" fill="${palette.brightSnow}"/><g filter="url(#b)">${[
      blob(120, 80, 220, palette.skyBlue, 0.8),
      blob(1100, 120, 200, palette.royalGold, 0.8),
      blob(1050, 600, 240, palette.roseKiss, 0.55),
      blob(160, 600, 200, palette.coolSky, 0.6),
    ].join('')}</g>`,
  );
  const tagline = textPath('the party game that speaks fluent medicine', 0, 0, 44);
  const tagX = (W - (tagline.box.x2 - tagline.box.x1)) / 2 - tagline.box.x1;
  const taglineSvg = svgDoc(W, H, '', `<path d="${textPath('the party game that speaks fluent medicine', tagX, 520, 44).d}" fill="${palette.ink}"/>`);
  const logo = await sharp(Buffer.from(wordmarkSvg)).resize({ width: 860 }).png().toBuffer();
  const meta = await sharp(logo).metadata();
  return sharp(Buffer.from(bg))
    .composite([
      { input: logo, left: Math.round((W - meta.width) / 2), top: Math.round(250 - meta.height / 2) },
      { input: Buffer.from(taglineSvg), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

// ── Interactive wordmark data (per-letter paths for the React component) ─────

function wordmarkGlyphs({ size = 200 } = {}) {
  const outline = size * 0.045;
  const depth = size * 0.05;
  const pad = outline * 2;
  const capHeight = (font.tables.os2.sCapHeight / font.unitsPerEm) * size;
  const baseline = pad + capHeight * 1.08;
  const letters = [];
  font.forEachGlyph('iatrome', pad, baseline, size, { kerning: true }, (glyph, gx, gy, gs) => {
    const p = glyph.getPath(gx, gy, gs);
    const box = p.getBoundingBox();
    const m = outline * 1.5; // room for the outline
    letters.push({
      char: String.fromCharCode(glyph.unicode),
      d: p.toPathData(2),
      // the letter's own box (incl. outline + extrusion), in wordmark units
      box: {
        x: round(box.x1 - m),
        y: round(box.y1 - m),
        width: round(box.x2 - box.x1 + 2 * m),
        height: round(box.y2 - box.y1 + 2 * m + depth),
      },
    });
  });
  const word = textPath('iatrome', pad, baseline, size);
  const scopeX = word.box.x2 + size * 0.06;
  const scopeHeight = capHeight * 1.08;
  const s = scopeHeight / STETHOSCOPE_BOX.height;
  const right = scopeX + STETHOSCOPE_BOX.width * s;
  return {
    width: round(right + pad),
    height: round(baseline + depth + pad),
    outline: round(outline),
    depth: round(depth),
    gradient: { x1: round(pad), x2: round(right) },
    letters,
    stethoscope: {
      x: round(scopeX),
      y: round(baseline - scopeHeight),
      scale: round(s * 1000) / 1000,
      box: {
        x: round(scopeX - outline * 1.5),
        y: round(baseline - scopeHeight - outline * 1.5),
        width: round(STETHOSCOPE_BOX.width * s + outline * 3),
        height: round(scopeHeight + outline * 3 + depth),
      },
      shapes: stethoscopeShapes,
      details: stethoscopeDetails,
      // the stethoscope's slice of the rainbow, in its local 0–100 space
      gradientStops: [0, 0.5, 1].map((f) => {
        const t0 = (scopeX - pad) / (right - pad);
        return { offset: f, color: rainbowAt(t0 + (1 - t0) * f) };
      }),
    },
    rainbow,
    ink: palette.ink,
    snow: palette.brightSnow,
  };
}

// ── Write everything ─────────────────────────────────────────────────────────

const png = (svg, size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();

await fs.mkdir(webPublic, { recursive: true });
await fs.mkdir(webApp, { recursive: true });

const wordmarkSvg = wordmark();
const markSvg = appMark();
const markMinimalSvg = appMark({ size: 64, minimal: true });

await fs.writeFile(path.join(webPublic, 'wordmark.svg'), wordmarkSvg);
await fs.writeFile(path.join(webPublic, 'mark.svg'), markSvg);
await fs.writeFile(path.join(webApp, 'icon.svg'), markMinimalSvg);
await fs.writeFile(path.join(webApp, 'apple-icon.png'), await png(appMark({ size: 180 }), 180));
await fs.writeFile(path.join(webPublic, 'icon-192.png'), await png(appMark({ size: 192 }), 192));
await fs.writeFile(path.join(webPublic, 'icon-512.png'), await png(markSvg, 512));
await fs.writeFile(path.join(webPublic, 'icon-maskable-512.png'), await png(appMark({ maskable: true }), 512));
await fs.writeFile(
  path.join(webApp, 'favicon.ico'),
  await pngToIco(await Promise.all([16, 32, 48].map((s) => png(appMark({ size: s, minimal: s < 48 }), s)))),
);
await fs.writeFile(path.join(webApp, 'opengraph-image.png'), await socialCard(wordmarkSvg));

const webBrandModule = path.join(root, 'apps/web/src/components/brand/wordmark-glyphs.ts');
await fs.mkdir(path.dirname(webBrandModule), { recursive: true });
await fs.writeFile(
  webBrandModule,
  `// Generated by packages/brand (npm run brand). Do not edit by hand.\n` +
    `export const wordmarkGlyphs = ${JSON.stringify(wordmarkGlyphs(), null, 2)} as const;\n`,
);

console.log('✓ brand assets written to apps/web/src/app and apps/web/public/brand');
