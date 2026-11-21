/*
 * iatrome icon set: original glossy, chunky icons that replace emoji in the UI.
 *
 * Each value is the inner markup of a `0 0 64 64` SVG. Every icon shares the same recipe:
 * flat palette fills, a 3-unit ink outline with round joins, and one soft white gloss
 * highlight near the top-left. No ids, defs or gradients, so any number of icons can sit
 * on one page without clashing.
 */

// ── Palette (mirrors styles/tokens.css) ────────────────────────────────────
const INK = '#1f2a4d';
const CARD = '#fffdf9';
const SKY = '#67a1c6';
const COOL = '#4988b8';
const SNOW = '#c8c8c8';
const GOLD = '#ccb64a';
const ROSE = '#cc4e73';
// Light tints of the palette, for secondary surfaces.
const ROSE_L = '#eeacbe';
const SKY_L = '#cfe3ef';
const GOLD_L = '#ecdc97';
const CREAM = '#f3e8d6';
/** Face base colour shared by every face icon. */
const FACE = '#e3c95a';

// ── Building blocks ────────────────────────────────────────────────────────
/** Root group: ink outline defaults so shapes only need a fill. */
const icon = (inner: string) =>
  `<g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;

/** The soft white gloss highlight. */
const gloss = (d: string, w = 4) => `<path d="${d}" stroke="#fff" stroke-opacity=".45" stroke-width="${w}"/>`;

/** Fill several shapes as one silhouette with a single outer outline (no inner seams). */
const union = (shapes: string, fill: string) =>
  `<g fill="${INK}" stroke-width="6">${shapes}</g><g fill="${fill}" stroke="none">${shapes}</g>`;

/** A thick outlined stroke (a tube): ink underlay, coloured core. */
const tube = (d: string, color: string, w = 5) =>
  `<path d="${d}" stroke-width="${w + 6}"/><path d="${d}" stroke="${color}" stroke-width="${w}"/>`;

const blush = (y = 40, lx = 19.5, rx = 44.5) =>
  `<g fill="${ROSE}" stroke="none" opacity=".4"><ellipse cx="${lx}" cy="${y}" rx="4.5" ry="2.8"/><ellipse cx="${rx}" cy="${y}" rx="4.5" ry="2.8"/></g>`;

/** The shared round head for every face. */
const HEAD = `<circle cx="32" cy="33" r="23" fill="${FACE}"/>${gloss('M16 23.8A18.5 18.5 0 0 1 25.7 15.6')}`;

const dotEyes = (y = 30, lx = 24, rx = 40) =>
  `<g fill="${INK}" stroke="none"><ellipse cx="${lx}" cy="${y}" rx="3.2" ry="4.3"/><ellipse cx="${rx}" cy="${y}" rx="3.2" ry="4.3"/></g>` +
  `<g fill="#fff" stroke="none"><circle cx="${lx + 1}" cy="${y - 1.6}" r="1.2"/><circle cx="${rx + 1}" cy="${y - 1.6}" r="1.2"/></g>`;

const PILL_SHAPE = `<rect x="8" y="21" width="48" height="22" rx="11"/>`;

const pencil = (transform: string, glossSide: 'top' | 'bottom' = 'top') =>
  `<g transform="${transform}">` +
  `<path d="M14 25H9a5 5 0 0 0-5 5v4a5 5 0 0 0 5 5h5Z" fill="${ROSE}"/>` +
  `<rect x="14" y="25" width="8" height="14" fill="${SNOW}"/>` +
  `<path d="M18 25.5v13" stroke-width="2"/>` +
  `<rect x="22" y="25" width="24" height="14" fill="${GOLD}"/>` +
  `<path d="M46 25 58.5 32 46 39Z" fill="${CREAM}"/>` +
  `<path d="M53.5 29.2 58.5 32 53.5 34.8Z" fill="${INK}"/>` +
  (glossSide === 'top' ? gloss('M25 29H42', 3) : gloss('M25 35H42', 3)) +
  `</g>`;

const CIRCLE_BADGE = (fill: string) => `<circle cx="32" cy="32" r="25" fill="${fill}"/>${gloss('M14 26A19 19 0 0 1 24 15')}`;

const HEART_D =
  'M32 56C20 47.5 6 38.5 6 23.5 6 14.5 12.8 8 20.5 8 26 8 30 11 32 15 34 11 38 8 43.5 8 51.2 8 58 14.5 58 23.5 58 38.5 44 47.5 32 56Z';

const STAR_D =
  'M30.4 11.5Q32 8.5 33.6 11.5L39 21.8Q39.9 23.6 42 23.9L53.4 25.9Q56.7 26.5 54.3 28.9L46.3 37.2Q44.8 38.7 45.1 40.7L46.8 52.2Q47.3 55.5 44.2 54L33.8 48.9Q32 48 30.2 48.9L19.8 54Q16.7 55.5 17.2 52.2L18.9 40.7Q19.2 38.7 17.7 37.2L9.7 28.9Q7.3 26.5 10.6 25.9L22 23.9Q24.1 23.6 25 21.8Z';

const sparkle = (cx: number, cy: number, r: number, fill: string) => {
  const k = r * 0.16;
  return `<path d="M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z" fill="${fill}"/>`;
};

const GEAR_TEETH = [0, 45, 90, 135, 180, 225, 270, 315]
  .map((a) => `<rect x="26.5" y="5" width="11" height="14" rx="3.5" transform="rotate(${a} 32 32)"/>`)
  .join('');

// ── Icons ──────────────────────────────────────────────────────────────────
export const ICONS = {
  // ── Avatars ──
  tooth: icon(
    `<path d="M20 8C26 8 28 11 32 11S38 8 44 8C52 8 56 15 56 24 56 33 51 37 49 46 47 54 45 58 41 58 37 58 37 48 32 48S27 58 23 58C19 58 17 54 15 46 13 37 8 33 8 24 8 15 12 8 20 8Z" fill="${CARD}"/>` +
      `<path d="M26 19Q32 23 38 19" stroke-opacity=".35"/>` +
      gloss('M14 25C13 18 16 13 21 13'),
  ),

  heart: icon(
    tube('M20 26V9', SKY, 6.5) +
      tube('M35.5 7 34.5 2.5M42.5 7 43.5 2.5', ROSE_L, 3.5) +
      tube('M30 24V14C30 8.5 34 5.5 39 5.5S48 8.5 48 14V22', ROSE_L, 7) +
      tube('M37.5 24 45 25', COOL, 5) +
      `<path d="${HEART_D}" fill="${ROSE_L}" transform="translate(32 38) scale(.86) rotate(-8) translate(-32 -32)"/>` +
      `<path d="M34 24.5C37 33 36 42 31 50" stroke="${ROSE}" stroke-width="3"/>` +
      gloss('M14 31C13.5 26 16 22 20 21'),
  ),

  brain: icon(
    union(
      `<circle cx="22" cy="22" r="11"/><circle cx="36" cy="18" r="11"/><circle cx="46" cy="28" r="10.5"/><circle cx="44" cy="42" r="10.5"/><circle cx="30" cy="46" r="10.5"/><circle cx="17" cy="38" r="10.5"/><circle cx="32" cy="32" r="16"/>`,
      ROSE_L,
    ) +
      `<path d="M32 10V54" />` +
      `<path d="M15 28Q21 26 22 31T28 34M18 44Q22 39 27 42M38 22Q41 27 46 25M37 36Q42 33 46 38T44 48M24 18Q26 23 22 25" stroke-width="2.6"/>` +
      gloss('M14 19C15 15 18 13 21 13'),
  ),

  bone: icon(
    `<g transform="rotate(-45 32 32)">` +
      union(
        `<rect x="14" y="26" width="36" height="12" rx="3"/><circle cx="13" cy="25" r="7.5"/><circle cx="13" cy="39" r="7.5"/><circle cx="51" cy="25" r="7.5"/><circle cx="51" cy="39" r="7.5"/>`,
        CREAM,
      ) +
      gloss('M10 22.5A4 4 0 0 1 14 20M20 29.5H44', 3) +
      `</g>`,
  ),

  eye: icon(
    `<path d="M5 33C12 20 21 15 32 15S52 20 59 33C52 46 43 51 32 51S12 46 5 33Z" fill="${CARD}"/>` +
      `<circle cx="32" cy="33" r="12.5" fill="${SKY}"/>` +
      `<circle cx="32" cy="33" r="6" fill="${INK}" stroke="none"/>` +
      `<circle cx="35.5" cy="29" r="2.8" fill="#fff" stroke="none"/>` +
      `<path d="M21 13.5 19 9M32 11V6M43 13.5 45 9"/>` +
      gloss('M13 27C16 23 19 21 23 19.5', 3),
  ),

  lungs: icon(
    tube('M32 5V24M32 23 25 29M32 23 39 29', SNOW, 5) +
      `<path d="M27 22C20 18 10 25 8 39 7 49 11 56 19 55 25 54 28 50 28 44V25Q28 23 27 22Z" fill="${ROSE}"/>` +
      `<path d="M37 22C44 18 54 25 56 39 57 49 53 56 45 55 39 54 36 50 36 44V25Q36 23 37 22Z" fill="${ROSE}"/>` +
      `<path d="M28 33 20 39M36 33 44 39" stroke-opacity=".4" stroke-width="2.5"/>` +
      gloss('M12 36C13 30 16 26 20 24.5'),
  ),

  pill: icon(
    `<g transform="rotate(-40 32 32)">` +
      `<rect x="8" y="21" width="48" height="22" rx="11" fill="${CARD}"/>` +
      `<path d="M32 21H19a11 11 0 0 0 0 22H32Z" fill="${SKY}"/>` +
      gloss('M14 29Q15 26 19 26H28M36 26H45', 3.5) +
      `</g>`,
  ),

  stethoscope: icon(
    tube('M17 9V20C17 32 24 38 30 38S43 32 43 20V9', SKY, 4) +
      tube('M30 38V46C30 54 40 57 45 50', SKY, 4) +
      `<circle cx="17" cy="8" r="3.5" fill="${GOLD}"/><circle cx="43" cy="8" r="3.5" fill="${GOLD}"/>` +
      `<circle cx="48" cy="44" r="10" fill="${SNOW}"/>` +
      `<circle cx="48" cy="44" r="4.5" fill="${CARD}"/>` +
      gloss('M41.5 41A7 7 0 0 1 45 37.5', 3),
  ),

  syringe: icon(
    `<g transform="rotate(-45 32 32)">` +
      `<path d="M50 32H61"/>` +
      `<rect x="44" y="28.5" width="7" height="7" rx="1.5" fill="${SNOW}"/>` +
      `<path d="M5 32H16"/>` +
      `<rect x="3" y="23" width="5" height="18" rx="2.5" fill="${SNOW}"/>` +
      `<rect x="15" y="21" width="4.5" height="22" rx="2.25" fill="${SNOW}"/>` +
      `<rect x="19" y="24" width="26" height="16" rx="4" fill="${CARD}"/>` +
      `<path d="M27 25.5H43a.5.5 0 0 1 .5.5V38a.5.5 0 0 1-.5.5H27Z" fill="${ROSE}" stroke="none"/>` +
      `<path d="M27 24.5V39.5" stroke-width="2.5"/>` +
      `<path d="M32 24.5V29M37 24.5V29M42 24.5V29" stroke-width="2"/>` +
      `<rect x="19" y="24" width="26" height="16" rx="4"/>` +
      gloss('M22 28H25', 3) +
      `</g>`,
  ),

  bandage: icon(
    `<g transform="rotate(-40 32 32)">` +
      `<rect x="5" y="20" width="54" height="24" rx="12" fill="${GOLD}"/>` +
      `<rect x="22" y="23" width="20" height="18" rx="4" fill="${CARD}"/>` +
      `<g fill="${INK}" stroke="none" opacity=".35"><circle cx="13" cy="28" r="1.4"/><circle cx="13" cy="36" r="1.4"/><circle cx="17" cy="32" r="1.4"/><circle cx="51" cy="28" r="1.4"/><circle cx="51" cy="36" r="1.4"/><circle cx="47" cy="32" r="1.4"/></g>` +
      gloss('M10 28Q11 25 15 25', 3) +
      `</g>`,
  ),

  microbe: icon(
    `<g stroke-width="3"><path d="M32 12V6M51 22l5-3M51 43l5 3M32 54v5M13 43l-5 3M13 22l-5-3"/></g>` +
      `<g fill="${ROSE}"><circle cx="32" cy="5.5" r="3.2"/><circle cx="56.5" cy="18.5" r="3.2"/><circle cx="56.5" cy="46.5" r="3.2"/><circle cx="32" cy="59" r="3.2" /><circle cx="7.5" cy="46.5" r="3.2"/><circle cx="7.5" cy="18.5" r="3.2"/></g>` +
      `<path d="M32 11C44 11 53 19 53 31 53 44 45 54 32 54 19 54 11 45 11 32 11 19 20 11 32 11Z" fill="${GOLD}"/>` +
      `<g fill="${GOLD_L}" stroke-width="2.5"><circle cx="25" cy="27" r="5"/><circle cx="39" cy="39" r="6"/><circle cx="38" cy="22" r="2.8"/><circle cx="23" cy="41" r="3"/></g>` +
      gloss('M16 26C17 21 20 17 25 15'),
  ),

  dna: icon(
    `<path d="M24 12H40M21 22H43M21 42H43M24 52H40" stroke-width="3"/>` +
      tube('M20 6C20 20 44 18 44 32S20 44 20 58', SKY, 5) +
      tube('M44 6C44 20 20 18 20 32S44 44 44 58', GOLD, 5) +
      gloss('M18 9V12', 3),
  ),

  thermometer: icon(
    `<g transform="rotate(35 32 32)">` +
      union(`<rect x="24" y="4" width="16" height="40" rx="8"/><circle cx="32" cy="48" r="11"/>`, CARD) +
      `<path d="M32 46V22" stroke="${ROSE}" stroke-width="6"/>` +
      `<circle cx="32" cy="48" r="7.5" fill="${ROSE}" stroke="none"/>` +
      `<path d="M36 13H40M36 20H40M36 27H40M36 34H40" stroke-width="2.5"/>` +
      gloss('M28 34V12', 3.5) +
      `</g>`,
  ),

  flask: icon(
    `<path d="M18.9 38 12 50C10 54 12 58 17 58H47C52 58 54 54 52 50L45.1 38C40 41 36 35 32 38S24 41 18.9 38Z" fill="${ROSE}" stroke="none"/>` +
      `<path d="M18.9 38C24 41 28 35 32 38S40 41 45.1 38" stroke-width="2.5"/>` +
      `<path d="M27 9V24L12 50C10 54 12 58 17 58H47C52 58 54 54 52 50L37 24V9" fill="${CARD}" fill-opacity=".001"/>` +
      `<rect x="23" y="5" width="18" height="6" rx="3" fill="${CARD}"/>` +
      `<g fill="${CARD}" stroke-width="2.5"><circle cx="27" cy="49" r="3"/><circle cx="38" cy="46" r="2"/><circle cx="34" cy="28" r="2"/></g>` +
      gloss('M23 30 17 40.5', 3.5),
  ),

  xray: icon(
    `<rect x="10" y="6" width="44" height="52" rx="8" fill="#34477a"/>` +
      `<g stroke="${SKY_L}" stroke-width="3"><path d="M32 14V50"/><path d="M29 20C22 18 17 21 17 25M35 20C42 18 47 21 47 25M29 28C22 26 16 29 16 33M35 28C42 26 48 29 48 33M29 36C23 34 17 37 17 41M35 36C41 34 47 37 47 41M29 44C24 42 20 44 20 47M35 44C40 42 44 44 44 47"/></g>` +
      `<rect x="10" y="6" width="44" height="52" rx="8"/>` +
      gloss('M15 20V14Q15 11 18 11H24'),
  ),

  microscope: icon(
    tube('M44 51V38C44 30 40 25 33 23', CARD, 7) +
      `<rect x="12" y="51" width="40" height="8" rx="4" fill="${SNOW}"/>` +
      `<rect x="14" y="39" width="27" height="5.5" rx="2.75" fill="${SNOW}"/>` +
      `<circle cx="44" cy="38" r="4" fill="${ROSE}"/>` +
      `<g transform="rotate(-28 27 21)">` +
      `<rect x="24.5" y="30" width="6" height="7" rx="1.5" fill="${SNOW}"/>` +
      `<rect x="21" y="9" width="13" height="23" rx="3.5" fill="${GOLD}"/>` +
      `<rect x="19" y="4" width="17" height="7" rx="3.5" fill="${SNOW}"/>` +
      gloss('M24.5 15V27', 2.5) +
      `</g>`,
  ),

  // ── Game modes ──
  'game-rounds': icon(
    `<path d="M10 6H30A7 7 0 0 1 37 13V27A7 7 0 0 1 30 34H18L11 41 12 34H10A7 7 0 0 1 3 27V13A7 7 0 0 1 10 6Z" fill="${SKY}"/>` +
      `<g fill="${CARD}" stroke="none"><circle cx="13" cy="20" r="2.6"/><circle cx="20" cy="20" r="2.6"/><circle cx="27" cy="20" r="2.6"/></g>` +
      gloss('M8 14Q8 10 12 10H18', 3) +
      `<path d="M54 24H34A7 7 0 0 0 27 31V45A7 7 0 0 0 34 52H46L53 59 52 52H54A7 7 0 0 0 61 45V31A7 7 0 0 0 54 24Z" fill="${ROSE}"/>` +
      `<path d="M35 34H53M35 42H46" stroke="${CARD}" stroke-width="3.5"/>` +
      gloss('M32 32Q32 28 36 28H42', 3),
  ),

  'game-sketch': icon(
    tube('M6 52C9 44 13 41 15 46S20 54 24 47 31 36 34 41', ROSE, 3) +
      pencil('translate(40.5 24.5) rotate(135) scale(.8) translate(-32 -32)', 'bottom'),
  ),

  'game-survive': icon(
    `<path d="M24 12C21 9 27 7 24 3M32 12C29 9 35 7 32 3M40 12C37 9 43 7 40 3" stroke-width="2.6"/>` +
      `<path d="M17 25H47L43 59H21Z" fill="${CARD}"/>` +
      `<path d="M18.6 34H45.4L43.6 49H20.4Z" fill="${GOLD}"/>` +
      `<rect x="14" y="19" width="36" height="8" rx="4" fill="${COOL}"/>` +
      `<path d="M21 19 23 14H41L43 19" fill="${COOL}"/>` +
      gloss('M21 30 25 54', 3) +
      gloss('M19 23H28', 2.5),
  ),

  'game-poison': icon(
    `<path d="M25 6H39V22A19 19 0 1 1 25 22Z" fill="${CARD}" fill-opacity=".001" stroke="none"/>` +
      `<path d="M13.3 38C17 35 22 41 32 38S47 35 50.7 38A19 19 0 0 1 13.3 38Z" fill="${COOL}" stroke="none"/>` +
      `<path d="M13.3 38C17 35 22 41 32 38S47 35 50.7 38" stroke-width="2.5"/>` +
      `<path d="M27 14V23A19 19 0 1 0 37 23V14" fill="none"/>` +
      `<rect x="24" y="4" width="16" height="11" rx="3.5" fill="${GOLD}"/>` +
      `<g fill="${CARD}" stroke-width="2.5"><circle cx="26" cy="46" r="3"/><circle cx="38" cy="50" r="2.2"/><circle cx="36" cy="30" r="2"/></g>` +
      gloss('M18 33C19 29 22 26 25 25', 3.5),
  ),

  // ── Reactions ──
  'react-laugh': icon(
    HEAD +
      `<path d="M18.5 30Q23.5 23.5 28.5 30M35.5 30Q40.5 23.5 45.5 30" stroke-width="3.5"/>` +
      `<path d="M19 37H45A13 12.5 0 0 1 19 37Z" fill="${INK}"/>` +
      `<path d="M22 38.5H42" stroke="${CARD}" stroke-width="2.6"/>` +
      `<ellipse cx="32" cy="45.8" rx="6.5" ry="2.8" fill="${ROSE}" stroke="none"/>` +
      `<path d="M11 24C6.5 30 4.5 33 4.5 36.2A6.5 6.5 0 0 0 17.5 36.2C17.5 33 15.5 30 11 24Z" fill="${SKY}"/>` +
      `<path d="M53 24C48.5 30 46.5 33 46.5 36.2A6.5 6.5 0 0 0 59.5 36.2C59.5 33 57.5 30 53 24Z" fill="${SKY}"/>` +
      gloss('M8 35.5Q8 33 9.5 31.2', 2.5),
  ),

  'react-fire': icon(
    `<path d="M32 4C36 14 50 21 50 38A18 18 0 0 1 14 38C14 30 17 25 22 21 22 27 25 30 28 30 26 21 28 12 32 4Z" fill="${ROSE}"/>` +
      `<path d="M33 27C36 33 42 37 42 44A10 10 0 0 1 22 44C22 40 24 38 26 36 27 39 29 40 31 40 30 35 31 31 33 27Z" fill="${GOLD}"/>` +
      `<path d="M32 42C33.5 45 36 46 36 49A4 4 0 0 1 28 49C28 46 30.5 45 32 42Z" fill="${CARD}" stroke="none"/>` +
      gloss('M18.5 37C18.5 33 20 30 22 28', 3.5),
  ),

  'react-clap': icon(
    `<path d="M32 10V4M22 12 18 7M42 12 46 7" stroke-width="3"/>` +
      `<g transform="rotate(22 40 50)">` +
      union(`<rect x="31" y="16" width="19" height="38" rx="9.5"/>`, GOLD_L) +
      `<path d="M35.5 18V27M40.5 16.5V27M45.5 18V27" stroke-width="2.5"/>` +
      `</g>` +
      `<g transform="rotate(-22 24 50)">` +
      union(`<rect x="14" y="16" width="19" height="38" rx="9.5"/><rect x="29" y="30" width="9" height="17" rx="4.5" transform="rotate(30 33.5 38.5)"/>`, FACE) +
      `<path d="M18.5 18V27M23.5 16.5V27M28.5 18V27" stroke-width="2.5"/>` +
      gloss('M17.5 33V45', 3) +
      `</g>`,
  ),

  'react-gasp': icon(
    HEAD +
      `<path d="M18 21Q22.5 16.5 28 18.5M36 18.5Q41.5 16.5 46 21" stroke-width="3"/>` +
      dotEyes(29.5) +
      `<ellipse cx="32" cy="44" rx="5.8" ry="7.2" fill="${INK}"/>` +
      `<ellipse cx="32" cy="47.5" rx="3.4" ry="2" fill="${ROSE}" stroke="none"/>` +
      blush(38, 17.5, 46.5),
  ),

  'react-cringe': icon(
    HEAD +
      `<path d="M19 25.5 27 30 19 34.5M45 25.5 37 30 45 34.5" stroke-width="3.5"/>` +
      `<rect x="18" y="39" width="28" height="11" rx="5.5" fill="${CARD}"/>` +
      `<path d="M18.5 44.5H45.5M25 39.5V49.5M32 39.5V49.5M39 39.5V49.5" stroke-width="2.4"/>` +
      `<path d="M50 8C46.5 13 45 15.5 45 18A5 5 0 0 0 55 18C55 15.5 53.5 13 50 8Z" fill="${SKY}"/>`,
  ),

  'react-heart': icon(
    `<path d="${HEART_D}" fill="${ROSE}"/>` +
      gloss('M12 22C12 17 15.5 13.5 20 13.5', 4.5) +
      `<circle cx="13.5" cy="29" r="1.8" fill="#fff" fill-opacity=".45" stroke="none"/>`,
  ),

  // ── UI moments ──
  check: icon(
    CIRCLE_BADGE(COOL) +
      `<path d="M20 33 28.5 41.5 44.5 24" stroke-width="12"/>` +
      `<path d="M20 33 28.5 41.5 44.5 24" stroke="${CARD}" stroke-width="6"/>`,
  ),

  lock: icon(
    tube('M21 30V21A11 11 0 0 1 43 21V30', SNOW, 6) +
      `<rect x="11" y="27" width="42" height="30" rx="10" fill="${GOLD}"/>` +
      `<circle cx="32" cy="39" r="4.5" fill="${INK}" stroke="none"/>` +
      `<path d="M32 40V47" stroke-width="4.5"/>` +
      gloss('M16 40V36Q16 32 20 32H26'),
  ),

  trophy: icon(
    tube('M17 15H11Q8 15 8 19C8 26 13 30 19 31M47 15H53Q56 15 56 19C56 26 51 30 45 31', GOLD, 3.5) +
      `<path d="M16 8H48V22A16 16 0 0 1 16 22Z" fill="${GOLD}"/>` +
      `<path d="M28 37H36V46H28Z" fill="${GOLD}"/>` +
      `<rect x="18" y="45" width="28" height="12" rx="4" fill="${COOL}"/>` +
      `<rect x="25" y="49" width="14" height="4" rx="2" fill="${GOLD_L}" stroke-width="2"/>` +
      `<path d="M32 15.5 34.2 20 39 20.5 35.4 23.8 36.4 28.5 32 26.1 27.6 28.5 28.6 23.8 25 20.5 29.8 20Z" fill="${GOLD_L}" stroke-width="2"/>` +
      gloss('M21 13V21Q21 25 23 28', 3.5),
  ),

  medal: icon(
    `<path d="M15 4H27L37 27H25Z" fill="${SKY}"/>` +
      `<path d="M49 4H37L27 27H39Z" fill="${ROSE}"/>` +
      `<circle cx="32" cy="41" r="16" fill="${GOLD}"/>` +
      `<circle cx="32" cy="41" r="10.5" fill="${GOLD_L}" stroke-width="2.5"/>` +
      `<path d="M32 35.2 33.8 38.8 37.7 39.3 34.9 42 35.6 45.9 32 44 28.4 45.9 29.1 42 26.3 39.3 30.2 38.8Z" fill="${GOLD}" stroke-width="2"/>` +
      gloss('M20 36A13 13 0 0 1 26 29', 3.5),
  ),

  target: icon(
    `<circle cx="29" cy="35" r="23" fill="${ROSE}"/>` +
      `<circle cx="29" cy="35" r="15.5" fill="${CARD}"/>` +
      `<circle cx="29" cy="35" r="8" fill="${ROSE}"/>` +
      gloss('M11.5 28A18.5 18.5 0 0 1 21 17.5') +
      `<path d="M29 35 52 12"/>` +
      `<path d="M48 8 47 15 54 14 59 9 54 8.5 54 4Z" fill="${GOLD}"/>` +
      `<circle cx="29" cy="35" r="2.5" fill="${INK}" stroke="none"/>`,
  ),

  palette: icon(
    `<path d="M32 7C47 7 59 16 59 28 59 37 52 40 46 38 40 36 36 40 38 46 40 52 37 58 30 58 16 58 5 47 5 32 5 18 17 7 32 7ZM19 37A5 5 0 1 0 19 47 5 5 0 1 0 19 37Z" fill="${CREAM}" fill-rule="evenodd"/>` +
      `<circle cx="18" cy="26" r="5" fill="${ROSE}"/>` +
      `<circle cx="29" cy="18" r="5" fill="${GOLD}"/>` +
      `<circle cx="42" cy="18" r="5" fill="${SKY}"/>` +
      `<circle cx="50" cy="28" r="4.5" fill="${COOL}"/>` +
      gloss('M10 27C12 20 17 15 23 12.5', 3.5),
  ),

  thinking: icon(
    HEAD +
      `<path d="M17 21H26M37 19Q42 14.5 47 18.5" stroke-width="3"/>` +
      dotEyes(29, 25, 41) +
      `<path d="M30 41.5 40 39" stroke-width="3.5"/>` +
      union(
        `<rect x="24" y="38" width="6.5" height="16" rx="3.25" transform="rotate(35 27.25 46)"/><rect x="12" y="47" width="18" height="12" rx="6" transform="rotate(-10 21 53)"/>`,
        FACE,
      ) +
      `<path d="M16 52 23 51M16.5 55.8 23 55" stroke-width="2.3"/>`,
  ),

  party: icon(
    `<path d="M7 57 18 25 39 46Z" fill="${GOLD}"/>` +
      `<path d="M14.5 36.5 27.5 49.5M11 46.5 17.5 53" stroke="${ROSE}" stroke-width="4"/>` +
      `<path d="M7 57 18 25 39 46Z"/>` +
      `<ellipse cx="28.5" cy="35.5" rx="5" ry="15" transform="rotate(-45 28.5 35.5)" fill="${ROSE}"/>` +
      tube('M34 24C34 16 40 16 40 10', SKY, 3) +
      tube('M41 31C47 28 50 34 56 30', GOLD, 3) +
      `<circle cx="52" cy="15" r="3.5" fill="${ROSE}"/>` +
      `<rect x="25" y="6" width="6" height="6" rx="1.5" transform="rotate(20 28 9)" fill="${GOLD}"/>` +
      `<rect x="50" y="42" width="6" height="6" rx="1.5" transform="rotate(-20 53 45)" fill="${SKY}"/>` +
      `<circle cx="46" cy="5" r="2.5" fill="${COOL}"/>`,
  ),

  popcorn: icon(
    union(
      `<circle cx="20" cy="24" r="8"/><circle cx="31" cy="18" r="9"/><circle cx="43" cy="22" r="8.5"/><circle cx="26" cy="28" r="7"/><circle cx="38" cy="29" r="7"/><circle cx="48" cy="29" r="5.5"/><circle cx="15" cy="30" r="5"/>`,
      CARD,
    ) +
      `<path d="M25 21Q27 24 25 27M37 16Q39 19 36 22M44 27Q41 28 40 31" stroke-width="2.2" stroke-opacity=".35"/>` +
      `<path d="M13 31H51L46 59H18Z" fill="${CARD}"/>` +
      `<path d="M20.5 31.5 23 58.5H28.5L27.5 31.5ZM36.5 31.5 35.5 58.5H41L43.5 31.5Z" fill="${ROSE}" stroke="none"/>` +
      `<path d="M13 31H51L46 59H18Z"/>` +
      gloss('M21 13A9 9 0 0 1 27 11.5', 3),
  ),

  clipboard: icon(
    `<rect x="11" y="9" width="42" height="50" rx="8" fill="${COOL}"/>` +
      `<rect x="17" y="16" width="30" height="37" rx="4" fill="${CARD}"/>` +
      `<rect x="23" y="5" width="18" height="10" rx="4" fill="${SNOW}"/>` +
      `<path d="M22 28 25 31 30 25M34 28H42M22 40 25 43 30 37M34 40H42" stroke-width="2.8"/>` +
      gloss('M14.5 30V18Q14.5 13 19 12.5', 3),
  ),

  'heart-broken': icon(
    `<g transform="rotate(-8 20 40) translate(-2.5 0)"><path d="M32 15C30 11 26 8 20.5 8 12.8 8 6 14.5 6 23.5 6 38.5 20 47.5 32 56L29 44 35 34 28 25Z" fill="${ROSE}"/>${gloss('M12 22C12 17 15.5 13.5 20 13.5', 4)}</g>` +
      `<g transform="rotate(8 44 40) translate(2.5 0)"><path d="M32 15C34 11 38 8 43.5 8 51.2 8 58 14.5 58 23.5 58 38.5 44 47.5 32 56L29 44 35 34 28 25Z" fill="${ROSE}"/></g>`,
  ),

  ghost: icon(
    `<path d="M13 54V31A19 19 0 0 1 51 31V54C47.8 57.5 44.2 57.5 41.5 54 38.8 50.5 35.2 50.5 32 54 28.8 57.5 25.2 57.5 22.5 54 19.8 50.5 16.2 50.5 13 54Z" fill="${CARD}"/>` +
      `<path d="M46.5 27V49" stroke="${SKY_L}" stroke-width="5"/>` +
      `<g fill="${INK}" stroke="none"><ellipse cx="25" cy="30" rx="3.2" ry="4.3"/><ellipse cx="39" cy="30" rx="3.2" ry="4.3"/></g>` +
      `<ellipse cx="32" cy="40" rx="3" ry="3.6" fill="${INK}" stroke="none"/>` +
      blush(37, 19.5, 44.5) +
      `<path d="M13 54V31A19 19 0 0 1 51 31V54C47.8 57.5 44.2 57.5 41.5 54 38.8 50.5 35.2 50.5 32 54 28.8 57.5 25.2 57.5 22.5 54 19.8 50.5 16.2 50.5 13 54Z"/>` +
      `<path d="M18 26A14 14 0 0 1 24 16.5" stroke="${SKY_L}" stroke-width="4"/>`,
  ),

  sweat: icon(
    HEAD +
      `<path d="M18 23 27 20M46 23 37 20" stroke-width="3"/>` +
      dotEyes(30.5) +
      `<path d="M21 44Q23.5 41 26 44T31 44 36 44 41 44" stroke-width="3"/>` +
      `<path d="M50 6C46 12 44.5 15 44.5 18A5.5 5.5 0 0 0 55.5 18C55.5 15 54 12 50 6Z" fill="${SKY}"/>` +
      gloss('M47.6 18Q47.6 16 48.6 14.5', 2),
  ),

  coffee: icon(
    `<path d="M25 18C22 14 28 12 25 7M33 18C30 14 36 12 33 7" stroke-width="2.6"/>` +
      `<ellipse cx="30" cy="53" rx="24" ry="5.5" fill="${CARD}"/>` +
      tube('M44 31H48A6 6 0 0 1 48 43H43', ROSE, 3.5) +
      `<path d="M12 24H46V36A14 14 0 0 1 32 50H26A14 14 0 0 1 12 36Z" fill="${ROSE}"/>` +
      gloss('M17 29V35Q17 40 20 43', 3.5),
  ),

  shush: icon(
    HEAD +
      `<path d="M17 21Q21.5 17.5 27 19.5M37 19.5Q42.5 17.5 47 21" stroke-width="3"/>` +
      `<path d="M19.5 29Q24 33 28.5 29M35.5 29Q40 33 44.5 29" stroke-width="3.2"/>` +
      `<ellipse cx="34" cy="42.5" rx="5.5" ry="4" fill="${INK}"/>` +
      `<g transform="rotate(-12 30 48)">` +
      union(`<rect x="26.5" y="32" width="7" height="21" rx="3.5"/><rect x="20" y="46" width="20" height="13" rx="6.5"/>`, FACE) +
      `<path d="M23.5 51.5H31M24 55.5H31" stroke-width="2.3"/>` +
      `</g>` +
      blush(37.5, 17, 47),
  ),

  drum: icon(
    tube('M16 6 34 24M48 6 30 24', CREAM, 3) +
      `<circle cx="15" cy="5.5" r="3" fill="${ROSE}"/><circle cx="49" cy="5.5" r="3" fill="${ROSE}"/>` +
      `<path d="M8 32V48C8 54 19 59 32 59S56 54 56 48V32Z" fill="${ROSE}"/>` +
      `<path d="M8 48C8 54 19 59 32 59S56 54 56 48" stroke="${INK}"/>` +
      `<path d="M11 37 18 50 25 40 32 53 39 40 46 50 53 37" stroke="${GOLD_L}" stroke-width="3"/>` +
      `<ellipse cx="32" cy="32" rx="24" ry="8" fill="${CARD}"/>` +
      gloss('M12 40V46', 3.5),
  ),

  melt: icon(
    `<path d="M11 36A21 21 0 0 1 53 36C53 42 54 45 57 48 61 52 58 57 51 57H15C8 57 4 53 7.5 49.5 10.5 46.5 11 42 11 36Z" fill="${FACE}"/>` +
      gloss('M15 27A17 17 0 0 1 24 18') +
      `<g fill="${INK}" stroke="none"><ellipse cx="24" cy="32" rx="3.2" ry="4.3" transform="rotate(-12 24 32)"/><ellipse cx="40" cy="31" rx="3.2" ry="4.3" transform="rotate(-12 40 31)"/></g>` +
      `<path d="M22 42Q31 49 42 40" stroke-width="3.5"/>` +
      `<path d="M44 46C46 49 46 52 44 55" stroke-opacity=".35" stroke-width="2.5"/>` +
      blush(40, 17.5, 46.5),
  ),

  'upside-down': icon(
    HEAD +
      `<g transform="rotate(180 32 33)">${dotEyes(30)}<path d="M23 41Q32 49 41 41" stroke-width="3.5"/>${blush(38.5, 18, 46)}</g>`,
  ),

  robot: icon(
    `<path d="M32 16V8" stroke-width="3"/>` +
      `<circle cx="32" cy="7" r="4" fill="${ROSE}"/>` +
      `<rect x="4" y="29" width="7" height="14" rx="3.5" fill="${GOLD}"/>` +
      `<rect x="53" y="29" width="7" height="14" rx="3.5" fill="${GOLD}"/>` +
      `<rect x="9" y="16" width="46" height="40" rx="15" fill="${SKY}"/>` +
      `<rect x="15" y="23" width="34" height="25" rx="10" fill="${INK}"/>` +
      `<g fill="${SKY_L}" stroke="none"><ellipse cx="25" cy="33" rx="3.5" ry="4.5"/><ellipse cx="39" cy="33" rx="3.5" ry="4.5"/></g>` +
      `<path d="M27 40Q32 44 37 40" stroke="${SKY_L}" stroke-width="3"/>` +
      gloss('M15 20.5H27', 3.5),
  ),

  mic: icon(
    tube('M16 31A16 16 0 0 0 48 31M32 47V55', COOL, 3) +
      `<rect x="22" y="53" width="20" height="6" rx="3" fill="${COOL}"/>` +
      `<rect x="21" y="5" width="22" height="36" rx="11" fill="${SNOW}"/>` +
      `<path d="M22 24H42M26 7V22M32 6V22M38 7V22" stroke-width="2.4" stroke-opacity=".55"/>` +
      `<rect x="21" y="5" width="22" height="36" rx="11"/>` +
      `<path d="M21.5 27H42.5" stroke-width="3"/>` +
      gloss('M25.5 12Q26.5 9 29 8.5', 3),
  ),

  scales: icon(
    `<path d="M8 18H56" stroke-width="4"/>` +
      `<path d="M14 18 6 37M14 18 22 37M50 18 42 37M50 18 58 37" stroke-width="2.4"/>` +
      `<path d="M4 37H24A10 8 0 0 1 4 37Z" fill="${GOLD}"/>` +
      `<path d="M40 37H60A10 8 0 0 1 40 37Z" fill="${GOLD}"/>` +
      `<path d="M29 16H35V50H29Z" fill="${COOL}"/>` +
      `<rect x="17" y="50" width="30" height="8" rx="4" fill="${COOL}"/>` +
      `<circle cx="32" cy="12" r="5" fill="${GOLD}"/>` +
      gloss('M8 39.5Q10 42 13 42.5', 2.5),
  ),

  'see-no-evil': icon(
    HEAD +
      `<path d="M25 45Q32 51 39 45" stroke-width="3.5"/>` +
      blush(43, 17.5, 46.5) +
      `<g transform="rotate(24 21 30)">` +
      union(`<rect x="13" y="15" width="16" height="27" rx="8"/>`, FACE) +
      `<path d="M17.5 16.5V23M21 15.5V23M24.5 16.5V23" stroke-width="2.3"/>` +
      `</g>` +
      `<g transform="rotate(-24 43 30)">` +
      union(`<rect x="35" y="15" width="16" height="27" rx="8"/>`, FACE) +
      `<path d="M39.5 16.5V23M43 15.5V23M46.5 16.5V23" stroke-width="2.3"/>` +
      `</g>`,
  ),

  sleep: icon(
    `<circle cx="27" cy="38" r="20.5" fill="${FACE}"/>` +
      gloss('M12.5 30.5A16.5 16.5 0 0 1 21 21.5') +
      `<path d="M15.5 37Q20 41.5 24.5 37M29.5 37Q34 41.5 38.5 37" stroke-width="3.2"/>` +
      `<ellipse cx="27" cy="48" rx="3.2" ry="3.8" fill="${INK}" stroke="none"/>` +
      blush(44, 14.5, 39.5) +
      `<path d="M47 3H59L47 15H59" stroke-width="3.5"/>` +
      `<path d="M38 12H45L38 19H45" stroke-width="3"/>`,
  ),

  'eye-closed': icon(
    `<path d="M6 30C14 18 23 14 32 14S50 18 58 30C50 42 41 44 32 44S14 42 6 30Z" fill="${SKY_L}"/>` +
      `<path d="M6 30C14 40 23 43 32 43S50 40 58 30" />` +
      `<path d="M13 37 9 43M22 41.5 20 48M32 43V50M42 41.5 44 48M51 37 55 43"/>` +
      gloss('M14 25C18 21 22 19 26 18', 3),
  ),

  pencil: icon(pencil('rotate(-45 32 32)')),

  speech: icon(
    `<path d="M14 8H50A9 9 0 0 1 59 17V38A9 9 0 0 1 50 47H28L16 57 18 47H14A9 9 0 0 1 5 38V17A9 9 0 0 1 14 8Z" fill="${SKY}"/>` +
      `<g fill="${CARD}" stroke="none"><circle cx="20" cy="28" r="4"/><circle cx="32" cy="28" r="4"/><circle cx="44" cy="28" r="4"/></g>` +
      gloss('M10 22V18Q10 13 15 13H24'),
  ),

  mail: icon(
    `<rect x="6" y="13" width="52" height="38" rx="9" fill="${CARD}"/>` +
      `<path d="M9 19 32 37 55 19" stroke-width="3.5"/>` +
      `<circle cx="49" cy="17" r="6" fill="${ROSE}"/>` +
      gloss('M11 21V20Q11 18 13 18H20'),
  ),

  list: icon(
    `<rect x="7" y="6" width="50" height="52" rx="9" fill="${CARD}"/>` +
      `<circle cx="18" cy="19" r="5" fill="${GOLD}"/><circle cx="18" cy="32" r="5" fill="${ROSE}"/><circle cx="18" cy="45" r="5" fill="${SKY}"/>` +
      `<path d="M28 19H48M28 32H44M28 45H46" stroke-width="3.5"/>`,
  ),

  hourglass: icon(
    `<path d="M19 11H45C45 24 36 27 34 32 36 37 45 40 45 53H19C19 40 28 37 30 32 28 27 19 24 19 11Z" fill="${CARD}"/>` +
      `<path d="M24.5 22H39.5C38 25.5 34.5 27.5 33 30.5H31C29.5 27.5 26 25.5 24.5 22Z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M21 52.5C22 45 27 42 32 42S42 45 43 52.5Z" fill="${GOLD}" stroke="none"/>` +
      `<path d="M32 33V44" stroke="${GOLD}" stroke-width="2"/>` +
      `<path d="M19 11H45C45 24 36 27 34 32 36 37 45 40 45 53H19C19 40 28 37 30 32 28 27 19 24 19 11Z"/>` +
      `<rect x="13" y="5" width="38" height="7" rx="3.5" fill="${COOL}"/>` +
      `<rect x="13" y="52" width="38" height="7" rx="3.5" fill="${COOL}"/>` +
      gloss('M23.5 16Q24.5 21 27 23.5', 2.5),
  ),

  wave: icon(
    `<path d="M50 8Q56 11 57 18M51 3Q60 7 62 16" stroke-width="2.6"/>` +
      `<path d="M8 40Q8 48 14 53M3 42Q4 52 11 58" stroke-width="2.6"/>` +
      `<g transform="rotate(-16 32 36)">` +
      union(
        `<rect x="17" y="13" width="8" height="26" rx="4"/><rect x="25" y="8" width="8" height="30" rx="4"/><rect x="33" y="10" width="8" height="28" rx="4"/><rect x="41" y="16" width="8" height="24" rx="4"/><rect x="17" y="28" width="32" height="30" rx="14"/><rect x="10" y="34.5" width="8" height="17" rx="4" transform="rotate(-35 14 43)"/>`,
        FACE,
      ) +
      `<path d="M25 18V30M33 16V30M41 20V30" stroke-width="2.4"/>` +
      gloss('M21 18V30', 3) +
      `</g>`,
  ),

  star: icon(`<path d="${STAR_D}" fill="${GOLD}"/>` + gloss('M15 29H21M26 25 29 18', 3.5)),

  sparkles: icon(
    sparkle(26, 36, 21, GOLD) + sparkle(49, 14, 10, ROSE) + sparkle(51, 47, 7, SKY) + gloss('M22.5 28 24.5 23', 3),
  ),

  back: icon(
    CIRCLE_BADGE(SKY) +
      `<path d="M30 21 19 32 30 43M20 32H45" stroke-width="12"/>` +
      `<path d="M30 21 19 32 30 43M20 32H45" stroke="${CARD}" stroke-width="6"/>`,
  ),

  settings: icon(
    union(GEAR_TEETH + `<circle cx="32" cy="32" r="18.5"/>`, SKY) +
      `<circle cx="32" cy="32" r="8" fill="${CARD}"/>` +
      gloss('M17 27A15 15 0 0 1 24 18.5', 3.5),
  ),

  pause: icon(
    CIRCLE_BADGE(COOL) +
      `<rect x="21" y="20" width="8" height="24" rx="3" fill="${CARD}"/><rect x="35" y="20" width="8" height="24" rx="3" fill="${CARD}"/>`,
  ),

  play: icon(CIRCLE_BADGE(COOL) + `<path d="M26 19.5 45 32 26 44.5Z" fill="${CARD}" stroke-width="3"/>`),

  skip: icon(
    CIRCLE_BADGE(COOL) +
      `<path d="M17 21 31 32 17 43ZM31 21 45 32 31 43Z" fill="${CARD}"/>` +
      `<rect x="45" y="21" width="4" height="22" rx="2" fill="${CARD}"/>`,
  ),

  // ── Groups ──
  'game-didactics': icon(
    `<path d="M32 18C24 12 22 6 26.5 4 29 3 31 4.5 32 6.5 33 4.5 35 3 37.5 4 42 6 40 12 32 18Z" fill="${ROSE}"/>` +
      `<circle cx="15" cy="30" r="11.5" fill="${SKY}"/>` +
      gloss('M7.5 28A8 8 0 0 1 11.5 23', 3) +
      `<g fill="${INK}" stroke="none"><circle cx="11" cy="30" r="1.8"/><circle cx="18" cy="30" r="1.8"/></g><path d="M12 34.5Q14.5 36.5 17 34.5" stroke-width="2.4"/>` +
      `<circle cx="49" cy="30" r="11.5" fill="${ROSE_L}"/>` +
      gloss('M41.5 28A8 8 0 0 1 45.5 23', 3) +
      `<g fill="${INK}" stroke="none"><circle cx="46" cy="30" r="1.8"/><circle cx="53" cy="30" r="1.8"/></g><path d="M47 34.5Q49.5 36.5 52 34.5" stroke-width="2.4"/>` +
      `<circle cx="32" cy="42" r="15" fill="${FACE}"/>` +
      gloss('M21.5 39A11 11 0 0 1 27 32', 3.5) +
      `<g fill="${INK}" stroke="none"><ellipse cx="27" cy="41" rx="2.2" ry="2.8"/><ellipse cx="37" cy="41" rx="2.2" ry="2.8"/></g>` +
      `<path d="M27.5 47Q32 51 36.5 47" stroke-width="2.8"/>` +
      `<g fill="${ROSE}" stroke="none" opacity=".4"><ellipse cx="22.5" cy="46" rx="3" ry="2"/><ellipse cx="41.5" cy="46" rx="3" ry="2"/></g>`,
  ),

  team: icon(
    `<path d="M4 56V42A12 13 0 0 1 28 42V56Z" fill="${SKY}"/><circle cx="16" cy="19" r="7.5" fill="${SKY}"/>` +
      `<path d="M36 56V42A12 13 0 0 1 60 42V56Z" fill="${ROSE}"/><circle cx="48" cy="19" r="7.5" fill="${ROSE}"/>` +
      `<path d="M15 58V52A17 15 0 0 1 49 52V58Z" fill="${GOLD}"/><circle cx="32" cy="25" r="9" fill="${GOLD}"/>` +
      gloss('M27 21.5A5.5 5.5 0 0 1 30 19', 3) +
      gloss('M20.5 50A11 10 0 0 1 25 43.5', 3),
  ),

  crowd: icon(
    `<path d="M3 46V31A9 10 0 0 1 21 31V46Z" fill="${SKY}"/><circle cx="12" cy="13" r="6" fill="${SKY}"/>` +
      `<path d="M23 46V31A9 10 0 0 1 41 31V46Z" fill="${COOL}"/><circle cx="32" cy="13" r="6" fill="${COOL}"/>` +
      `<path d="M43 46V31A9 10 0 0 1 61 31V46Z" fill="${ROSE_L}"/><circle cx="52" cy="13" r="6" fill="${ROSE_L}"/>` +
      `<path d="M7 59V52A14 13 0 0 1 35 52V59Z" fill="${GOLD}"/><circle cx="21" cy="31" r="7.5" fill="${GOLD}"/>` +
      `<path d="M29 59V52A14 13 0 0 1 57 52V59Z" fill="${ROSE}"/><circle cx="43" cy="31" r="7.5" fill="${ROSE}"/>` +
      gloss('M17 28A4.5 4.5 0 0 1 19.5 26', 2.5) +
      gloss('M12 51A9 8 0 0 1 15 46', 2.5),
  ),
} as const;

export type IconName = keyof typeof ICONS;

/** Every icon name, in declaration order. */
export const ICON_NAMES = Object.keys(ICONS) as IconName[];
