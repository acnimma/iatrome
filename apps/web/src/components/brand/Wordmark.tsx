'use client';

import { useEffect, useId, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { wordmarkGlyphs as W } from './wordmark-glyphs';
import { JellyLetter, JellyTablet } from './jelly';
import { haptic } from '@/lib/haptics';
import styles from './Wordmark.module.css';

type Box = { x: number; y: number; width: number; height: number };

/** Positions an element over its slice of the wordmark, in percentages. */
const placement = (box: Box) => ({
  left: `${(box.x / W.width) * 100}%`,
  top: `${(box.y / W.height) * 100}%`,
  width: `${(box.width / W.width) * 100}%`,
  height: `${(box.height / W.height) * 100}%`,
});

const viewBox = (box: Box) => `${box.x} ${box.y} ${box.width} ${box.height}`;

/** The bottom centre of a letter's ink: where it sits, squashes and sways from. */
const seat = (box: Box) => `50% ${((1 - W.below / box.height) * 100).toFixed(2)}%`;

const { box: tabletBox } = W.letters[W.tablet.index];
const { pivot, radius, tilt } = W.tablet;
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
/** The hinge the tablet's halves open around (the bottom of its score line), relative to its box. */
const hinge = `${pct((pivot.x - tabletBox.x) / tabletBox.width)} ${pct((pivot.y - tabletBox.y) / tabletBox.height)}`;
/** The double helix inside the crack, standing on the hinge along the score line. */
const flashPlacement = {
  left: pct((pivot.x - radius * 0.5 - tabletBox.x) / tabletBox.width),
  top: pct((pivot.y - radius * 3.4 - tabletBox.y) / tabletBox.height),
  width: pct((radius * 1.0) / tabletBox.width),
  height: pct((radius * 3.4) / tabletBox.height),
  rotate: `${tilt}deg`,
};

// ── Interaction tuning (wordmark units) ──────────────────────────────────────

const REACH_X = W.width * 0.12; // how far the hover pull reaches
const REACH_Y = W.height * 0.75;
const LIFT = 7; // % of the letter's height at full pull
const TILT = 7; // degrees of lean at full pull
const SWEEP_REACH = W.width * 0.07; // how far a passing finger's wobble spreads
const TAP_SLOP = W.height * 0.12; // movement still counted as a tap on the tablet

/** Entrance: letters plop in one after another. */
const dropTime = (index: number) => 0.2 + index * 0.075;
/** Past this (s since navigation) the page is already visible: skip the entrance. */
const LATE = 3;
/** Roughly how often (ms) an idle letter jiggles on its own. */
const FIDGET_EVERY = 4500;

// ── Wordmark ─────────────────────────────────────────────────────────────────

/**
 * The interactive iatrome logo, in black jelly. Letters plop in one by one,
 * lean and lift towards a mouse, squish when pressed and wobble when a finger
 * sweeps across them. Tapping the tablet "o" cracks it along its score line;
 * the halves wobble apart and snap back together. With reduced motion it is a
 * still logo.
 */
export function Wordmark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const glyphs = useRef<(HTMLSpanElement | null)[]>([]);
  const shadows = useRef<(HTMLSpanElement | null)[]>([]);
  const halves = useRef<(HTMLSpanElement | null)[]>([]);
  const flashRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const id = useId().replace(/[^\w-]/g, '');

  useEffect(() => {
    const root = rootRef.current;
    if (reduceMotion || !root) return;

    const letters = W.letters.map(() => new JellyLetter());
    const pill = new JellyTablet();
    const clock = () => performance.now() / 1000;

    const startedAt = clock();
    if (startedAt < LATE) letters.forEach((l, i) => l.drop(startedAt + dropTime(i)));
    root.dataset.live = '';

    // The pointer, in wordmark units.
    const pointer = { x: 0, y: 0, present: 0, down: false, over: -1 };
    let pressed = -1;
    let tabletTap: { x: number; y: number } | null = null;

    // ── frame loop: runs only while something moves ──
    let frame = 0;
    let last = 0;
    const tick = (ms: number) => {
      const now = ms / 1000;
      const dt = Math.min(1 / 30, now - last || 1 / 60);
      last = now;

      let moving = false;
      letters.forEach((l, i) => {
        const { x, y, width, height } = W.letters[i].box;
        const dx = (pointer.x - (x + width / 2)) / REACH_X;
        const dy = (pointer.y - (y + height / 2)) / REACH_Y;
        const near = Math.exp(-dx * dx);
        l.y.target = -LIFT * pointer.present * near * Math.exp(-dy * dy);
        l.rot.target = TILT * pointer.present * Math.max(-1, Math.min(1, dx)) * near;
        // two half-steps keep the stiff squash spring stable on slow frames
        l.step(dt / 2, now);
        l.step(dt / 2, now);
        moving ||= !l.resting;
      });
      const thud = pill.step(dt, now);
      if (thud > 2) {
        letters[W.tablet.index].poke(Math.min(1, thud / 12));
        haptic('tap');
      }
      moving ||= !pill.resting;

      letters.forEach((l, i) => {
        const glyph = glyphs.current[i];
        const shadow = shadows.current[i];
        if (glyph) {
          glyph.style.transform = l.transform;
          glyph.style.opacity = String(l.opacity);
        }
        if (shadow) Object.assign(shadow.style, l.shadow);
      });
      pill.halves.forEach((t, k) => {
        const half = halves.current[k];
        if (half) half.style.transform = t;
      });
      if (flashRef.current) Object.assign(flashRef.current.style, pill.flash);

      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (frame) return;
      last = performance.now() / 1000;
      frame = requestAnimationFrame(tick);
    };
    wake();

    // now and then a letter gives a little jiggle, so the logo feels alive
    let fidget = 0;
    const scheduleFidget = () => {
      fidget = window.setTimeout(() => {
        if (!pointer.down && document.visibilityState === 'visible') {
          letters[Math.floor(Math.random() * letters.length)].poke(0.4);
          wake();
        }
        scheduleFidget();
      }, FIDGET_EVERY * (1 + Math.random()));
    };
    scheduleFidget();

    // ── pointer → wordmark units, and which letter is under it ──
    const locate = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * W.width, y: ((e.clientY - r.top) / r.height) * W.height };
    };
    const letterAt = ({ x, y }: { x: number; y: number }) =>
      W.letters.findIndex(({ box }) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height - W.below);

    const press = (index: number) => {
      if (pressed === index) return;
      if (pressed >= 0) letters[pressed].hold(false);
      pressed = index;
      if (index < 0) return;
      letters[index].poke();
      letters[index].hold(true);
      haptic('tap');
    };

    const onDown = (e: PointerEvent) => {
      const p = locate(e);
      Object.assign(pointer, p, { present: 1, down: true });
      const index = letterAt(p);
      pointer.over = index;
      press(index);
      tabletTap = index === W.tablet.index ? p : null;
      wake();
    };

    const onMove = (e: PointerEvent) => {
      const p = locate(e);
      const dx = p.x - pointer.x;
      const dragging = pointer.down || e.pointerType !== 'mouse' ? 1 : 0.35;
      // a sweep wobbles every letter near the path, most of all the one beneath it
      letters.forEach((l, i) => {
        const { x, width } = W.letters[i].box;
        const d = (p.x - (x + width / 2)) / SWEEP_REACH;
        const inside = p.y > -REACH_Y * 0.2 && p.y < W.height + REACH_Y * 0.2;
        if (inside) l.sweep(dx, dragging * Math.exp(-d * d));
      });
      Object.assign(pointer, p, { present: 1 });
      if (pointer.down) {
        const index = letterAt(p);
        if (index !== pointer.over && index >= 0) press(index); // pluck each letter the finger crosses
        pointer.over = index;
        if (tabletTap && Math.hypot(p.x - tabletTap.x, p.y - tabletTap.y) > TAP_SLOP) tabletTap = null;
      }
      wake();
    };

    const onUp = (e: PointerEvent) => {
      if (tabletTap && letterAt(locate(e)) === W.tablet.index) {
        pill.crack(clock());
        haptic('success');
      }
      tabletTap = null;
      pointer.down = false;
      press(-1);
      if (e.pointerType !== 'mouse') pointer.present = 0; // a finger leaving the screen
      wake();
    };

    const release = () => {
      Object.assign(pointer, { present: 0, down: false });
      tabletTap = null;
      press(-1);
      wake();
    };

    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    document.documentElement.addEventListener('pointerleave', release);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(fidget);
      delete root.dataset.live;
      for (const el of [...glyphs.current, ...shadows.current, ...halves.current, flashRef.current]) {
        el?.style.removeProperty('transform');
        el?.style.removeProperty('opacity');
      }
      root.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.documentElement.removeEventListener('pointerleave', release);
    };
  }, [reduceMotion]);

  const fill = `url(#${id}-fill)`;
  const finish = `url(#${id}-jelly)`;
  const jelly = (d: string) => <path key={d} d={d} fill={fill} filter={finish} />;
  // the tablet: a black outline under a white pill; the halves' outlines meet as the score line
  const pill = (d: string) => (
    <g key={d}>
      <path d={d} fill={W.tablet.colors.line} stroke={W.tablet.colors.line} strokeWidth={W.tablet.outline * 2} strokeLinejoin="round" />
      <path d={d} fill={W.tablet.colors.body} filter={`url(#${id}-pill)`} />
    </g>
  );

  return (
    <span
      ref={rootRef}
      className={className ? `${styles.wordmark} ${className}` : styles.wordmark}
      style={{ aspectRatio: `${W.width} / ${W.height}` }}
    >
      <span className="visually-hidden">iatrome</span>
      <svg className={styles.paint} aria-hidden>
        <defs dangerouslySetInnerHTML={{ __html: W.paint.replaceAll('__ID__', id) }} />
      </svg>

      {/* every shadow sits below every letter */}
      {W.letters.map(({ box, parts }, i) => (
        <span key={i} className={`${styles.piece} ${styles.shadow}`} style={placement(box)}>
          <span ref={(el) => void (shadows.current[i] = el)} className={styles.shadowInner} style={{ transformOrigin: seat(box) }}>
            <svg viewBox={viewBox(box)} aria-hidden>
              {parts.map((d) => (
                <path
                  key={d}
                  d={d}
                  transform={`translate(0 ${W.shadow.dy})`}
                  fill={W.shadow.color}
                  opacity={W.shadow.opacity}
                  filter={`url(#${id}-shadow)`}
                />
              ))}
            </svg>
          </span>
        </span>
      ))}

      {W.letters.map(({ box, parts }, i) => (
        <span key={i} className={styles.piece} style={placement(box)}>
          <span ref={(el) => void (glyphs.current[i] = el)} className={styles.glyph} style={{ transformOrigin: seat(box) }}>
            {i === W.tablet.index ? (
              <>
                {parts.map((d, k) => (
                  <span key={d} ref={(el) => void (halves.current[k] = el)} className={styles.half} style={{ transformOrigin: hinge }}>
                    <svg viewBox={viewBox(box)} aria-hidden>
                      {pill(d)}
                    </svg>
                  </span>
                ))}
                {/* clipped at the hinge, so the helix rises out of the crack and sinks back in */}
                <span className={styles.flashClip} style={flashPlacement}>
                  <span ref={flashRef} className={styles.flash}>
                    <Helix />
                  </span>
                </span>
              </>
            ) : (
              <svg viewBox={viewBox(box)} aria-hidden>
                {parts.map(jelly)}
              </svg>
            )}
          </span>
        </span>
      ))}
    </span>
  );
}

/** The surprise inside the tablet: a double helix in the palette, spiralling. */
function Helix() {
  return (
    <svg viewBox="0 0 40 100" className={styles.helix} aria-hidden>
      <g className={styles.spiral}>
          <line x1="26.4" y1="-61.7" x2="13.6" y2="-61.7" stroke="var(--royal-gold)" strokeWidth="5" strokeLinecap="round" />
          <line x1="33.8" y1="-51.7" x2="6.2" y2="-51.7" stroke="var(--sky-blue)" strokeWidth="5" strokeLinecap="round" />
          <line x1="29.9" y1="-41.7" x2="10.1" y2="-41.7" stroke="var(--bright-snow)" strokeWidth="5" strokeLinecap="round" />
          <line x1="17.8" y1="-31.7" x2="22.2" y2="-31.7" stroke="var(--rose-kiss)" strokeWidth="5" strokeLinecap="round" />
          <line x1="7.5" y1="-21.7" x2="32.5" y2="-21.7" stroke="var(--cool-sky)" strokeWidth="5" strokeLinecap="round" />
          <line x1="7.5" y1="-11.7" x2="32.5" y2="-11.7" stroke="var(--royal-gold)" strokeWidth="5" strokeLinecap="round" />
          <line x1="17.8" y1="-1.7" x2="22.2" y2="-1.7" stroke="var(--sky-blue)" strokeWidth="5" strokeLinecap="round" />
          <line x1="29.9" y1="8.3" x2="10.1" y2="8.3" stroke="var(--bright-snow)" strokeWidth="5" strokeLinecap="round" />
          <line x1="33.8" y1="18.3" x2="6.2" y2="18.3" stroke="var(--rose-kiss)" strokeWidth="5" strokeLinecap="round" />
          <line x1="26.4" y1="28.3" x2="13.6" y2="28.3" stroke="var(--cool-sky)" strokeWidth="5" strokeLinecap="round" />
          <line x1="13.6" y1="38.3" x2="26.4" y2="38.3" stroke="var(--royal-gold)" strokeWidth="5" strokeLinecap="round" />
          <line x1="6.2" y1="48.3" x2="33.8" y2="48.3" stroke="var(--sky-blue)" strokeWidth="5" strokeLinecap="round" />
          <line x1="10.1" y1="58.3" x2="29.9" y2="58.3" stroke="var(--bright-snow)" strokeWidth="5" strokeLinecap="round" />
          <line x1="22.2" y1="68.3" x2="17.8" y2="68.3" stroke="var(--rose-kiss)" strokeWidth="5" strokeLinecap="round" />
          <line x1="32.5" y1="78.3" x2="7.5" y2="78.3" stroke="var(--cool-sky)" strokeWidth="5" strokeLinecap="round" />
          <line x1="32.5" y1="88.3" x2="7.5" y2="88.3" stroke="var(--royal-gold)" strokeWidth="5" strokeLinecap="round" />
          <line x1="22.2" y1="98.3" x2="17.8" y2="98.3" stroke="var(--sky-blue)" strokeWidth="5" strokeLinecap="round" />
          <line x1="10.1" y1="108.3" x2="29.9" y2="108.3" stroke="var(--bright-snow)" strokeWidth="5" strokeLinecap="round" />
          <line x1="6.2" y1="118.3" x2="33.8" y2="118.3" stroke="var(--rose-kiss)" strokeWidth="5" strokeLinecap="round" />
          <line x1="13.6" y1="128.3" x2="26.4" y2="128.3" stroke="var(--cool-sky)" strokeWidth="5" strokeLinecap="round" />
          <line x1="26.4" y1="138.3" x2="13.6" y2="138.3" stroke="var(--royal-gold)" strokeWidth="5" strokeLinecap="round" />
          <line x1="33.8" y1="148.3" x2="6.2" y2="148.3" stroke="var(--sky-blue)" strokeWidth="5" strokeLinecap="round" />
          <line x1="29.9" y1="158.3" x2="10.1" y2="158.3" stroke="var(--bright-snow)" strokeWidth="5" strokeLinecap="round" />
        <path d="M20.0 -66.7L23.3 -64.2L26.4 -61.7L29.1 -59.2L31.3 -56.7L32.9 -54.2L33.8 -51.7L34.0 -49.2L33.3 -46.7L31.9 -44.2L29.9 -41.7L27.3 -39.2L24.3 -36.7L21.1 -34.2L17.8 -31.7L14.6 -29.2L11.8 -26.7L9.4 -24.2L7.5 -21.7L6.4 -19.2L6.0 -16.7L6.4 -14.2L7.5 -11.7L9.4 -9.2L11.8 -6.7L14.6 -4.2L17.8 -1.7L21.1 0.8L24.3 3.3L27.3 5.8L29.9 8.3L31.9 10.8L33.3 13.3L34.0 15.8L33.8 18.3L32.9 20.8L31.3 23.3L29.1 25.8L26.4 28.3L23.3 30.8L20.0 33.3L16.7 35.8L13.6 38.3L10.9 40.8L8.7 43.3L7.1 45.8L6.2 48.3L6.0 50.8L6.7 53.3L8.1 55.8L10.1 58.3L12.7 60.8L15.7 63.3L18.9 65.8L22.2 68.3L25.4 70.8L28.2 73.3L30.6 75.8L32.5 78.3L33.6 80.8L34.0 83.3L33.6 85.8L32.5 88.3L30.6 90.8L28.2 93.3L25.4 95.8L22.2 98.3L18.9 100.8L15.7 103.3L12.7 105.8L10.1 108.3L8.1 110.8L6.7 113.3L6.0 115.8L6.2 118.3L7.1 120.8L8.7 123.3L10.9 125.8L13.6 128.3L16.7 130.8L20.0 133.3L23.3 135.8L26.4 138.3L29.1 140.8L31.3 143.3L32.9 145.8L33.8 148.3L34.0 150.8L33.3 153.3L31.9 155.8L29.9 158.3L27.3 160.8L24.3 163.3L21.1 165.8" fill="none" stroke="#1f2a4d" strokeWidth="8" strokeLinecap="round" />
        <path d="M20.0 -66.7L23.3 -64.2L26.4 -61.7L29.1 -59.2L31.3 -56.7L32.9 -54.2L33.8 -51.7L34.0 -49.2L33.3 -46.7L31.9 -44.2L29.9 -41.7L27.3 -39.2L24.3 -36.7L21.1 -34.2L17.8 -31.7L14.6 -29.2L11.8 -26.7L9.4 -24.2L7.5 -21.7L6.4 -19.2L6.0 -16.7L6.4 -14.2L7.5 -11.7L9.4 -9.2L11.8 -6.7L14.6 -4.2L17.8 -1.7L21.1 0.8L24.3 3.3L27.3 5.8L29.9 8.3L31.9 10.8L33.3 13.3L34.0 15.8L33.8 18.3L32.9 20.8L31.3 23.3L29.1 25.8L26.4 28.3L23.3 30.8L20.0 33.3L16.7 35.8L13.6 38.3L10.9 40.8L8.7 43.3L7.1 45.8L6.2 48.3L6.0 50.8L6.7 53.3L8.1 55.8L10.1 58.3L12.7 60.8L15.7 63.3L18.9 65.8L22.2 68.3L25.4 70.8L28.2 73.3L30.6 75.8L32.5 78.3L33.6 80.8L34.0 83.3L33.6 85.8L32.5 88.3L30.6 90.8L28.2 93.3L25.4 95.8L22.2 98.3L18.9 100.8L15.7 103.3L12.7 105.8L10.1 108.3L8.1 110.8L6.7 113.3L6.0 115.8L6.2 118.3L7.1 120.8L8.7 123.3L10.9 125.8L13.6 128.3L16.7 130.8L20.0 133.3L23.3 135.8L26.4 138.3L29.1 140.8L31.3 143.3L32.9 145.8L33.8 148.3L34.0 150.8L33.3 153.3L31.9 155.8L29.9 158.3L27.3 160.8L24.3 163.3L21.1 165.8" fill="none" stroke="var(--rose-kiss)" strokeWidth="5" strokeLinecap="round" />
        <path d="M20.0 -66.7L16.7 -64.2L13.6 -61.7L10.9 -59.2L8.7 -56.7L7.1 -54.2L6.2 -51.7L6.0 -49.2L6.7 -46.7L8.1 -44.2L10.1 -41.7L12.7 -39.2L15.7 -36.7L18.9 -34.2L22.2 -31.7L25.4 -29.2L28.2 -26.7L30.6 -24.2L32.5 -21.7L33.6 -19.2L34.0 -16.7L33.6 -14.2L32.5 -11.7L30.6 -9.2L28.2 -6.7L25.4 -4.2L22.2 -1.7L18.9 0.8L15.7 3.3L12.7 5.8L10.1 8.3L8.1 10.8L6.7 13.3L6.0 15.8L6.2 18.3L7.1 20.8L8.7 23.3L10.9 25.8L13.6 28.3L16.7 30.8L20.0 33.3L23.3 35.8L26.4 38.3L29.1 40.8L31.3 43.3L32.9 45.8L33.8 48.3L34.0 50.8L33.3 53.3L31.9 55.8L29.9 58.3L27.3 60.8L24.3 63.3L21.1 65.8L17.8 68.3L14.6 70.8L11.8 73.3L9.4 75.8L7.5 78.3L6.4 80.8L6.0 83.3L6.4 85.8L7.5 88.3L9.4 90.8L11.8 93.3L14.6 95.8L17.8 98.3L21.1 100.8L24.3 103.3L27.3 105.8L29.9 108.3L31.9 110.8L33.3 113.3L34.0 115.8L33.8 118.3L32.9 120.8L31.3 123.3L29.1 125.8L26.4 128.3L23.3 130.8L20.0 133.3L16.7 135.8L13.6 138.3L10.9 140.8L8.7 143.3L7.1 145.8L6.2 148.3L6.0 150.8L6.7 153.3L8.1 155.8L10.1 158.3L12.7 160.8L15.7 163.3L18.9 165.8" fill="none" stroke="#1f2a4d" strokeWidth="8" strokeLinecap="round" />
        <path d="M20.0 -66.7L16.7 -64.2L13.6 -61.7L10.9 -59.2L8.7 -56.7L7.1 -54.2L6.2 -51.7L6.0 -49.2L6.7 -46.7L8.1 -44.2L10.1 -41.7L12.7 -39.2L15.7 -36.7L18.9 -34.2L22.2 -31.7L25.4 -29.2L28.2 -26.7L30.6 -24.2L32.5 -21.7L33.6 -19.2L34.0 -16.7L33.6 -14.2L32.5 -11.7L30.6 -9.2L28.2 -6.7L25.4 -4.2L22.2 -1.7L18.9 0.8L15.7 3.3L12.7 5.8L10.1 8.3L8.1 10.8L6.7 13.3L6.0 15.8L6.2 18.3L7.1 20.8L8.7 23.3L10.9 25.8L13.6 28.3L16.7 30.8L20.0 33.3L23.3 35.8L26.4 38.3L29.1 40.8L31.3 43.3L32.9 45.8L33.8 48.3L34.0 50.8L33.3 53.3L31.9 55.8L29.9 58.3L27.3 60.8L24.3 63.3L21.1 65.8L17.8 68.3L14.6 70.8L11.8 73.3L9.4 75.8L7.5 78.3L6.4 80.8L6.0 83.3L6.4 85.8L7.5 88.3L9.4 90.8L11.8 93.3L14.6 95.8L17.8 98.3L21.1 100.8L24.3 103.3L27.3 105.8L29.9 108.3L31.9 110.8L33.3 113.3L34.0 115.8L33.8 118.3L32.9 120.8L31.3 123.3L29.1 125.8L26.4 128.3L23.3 130.8L20.0 133.3L16.7 135.8L13.6 138.3L10.9 140.8L8.7 143.3L7.1 145.8L6.2 148.3L6.0 150.8L6.7 153.3L8.1 155.8L10.1 158.3L12.7 160.8L15.7 163.3L18.9 165.8" fill="none" stroke="var(--cool-sky)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
