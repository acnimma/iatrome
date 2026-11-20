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
  left: pct((pivot.x - radius * 0.34 - tabletBox.x) / tabletBox.width),
  top: pct((pivot.y - radius * 1.75 - tabletBox.y) / tabletBox.height),
  width: pct((radius * 0.68) / tabletBox.width),
  height: pct((radius * 1.7) / tabletBox.height),
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
                <span ref={flashRef} className={styles.flash} style={flashPlacement}>
                  <Helix />
                </span>
                {parts.map((d, k) => (
                  <span key={d} ref={(el) => void (halves.current[k] = el)} className={styles.half} style={{ transformOrigin: hinge }}>
                    <svg viewBox={viewBox(box)} aria-hidden>
                      {pill(d)}
                    </svg>
                  </span>
                ))}
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

/** The surprise inside the tablet: a double helix in the palette. */
function Helix() {
  return (
    <svg viewBox="0 0 40 100" className={styles.helix} aria-hidden>
      <line x1="29.7" y1="7.5" x2="10.3" y2="7.5" stroke="var(--royal-gold)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="35.0" y1="17.5" x2="5.0" y2="17.5" stroke="var(--sky-blue)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="27.8" y1="27.5" x2="12.2" y2="27.5" stroke="var(--bright-snow)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="14.3" y1="37.5" x2="25.7" y2="37.5" stroke="var(--rose-kiss)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="5.4" y1="47.5" x2="34.6" y2="47.5" stroke="var(--cool-sky)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="8.6" y1="57.5" x2="31.4" y2="57.5" stroke="var(--royal-gold)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="21.2" y1="67.5" x2="18.8" y2="67.5" stroke="var(--sky-blue)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="32.8" y1="77.5" x2="7.2" y2="77.5" stroke="var(--bright-snow)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="33.9" y1="87.5" x2="6.1" y2="87.5" stroke="var(--rose-kiss)" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="23.5" y1="97.5" x2="16.5" y2="97.5" stroke="var(--cool-sky)" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M20.0 0.0L23.5 2.5L26.8 5.0L29.7 7.5L32.1 10.0L33.9 12.5L34.8 15.0L35.0 17.5L34.3 20.0L32.8 22.5L30.6 25.0L27.8 27.5L24.6 30.0L21.2 32.5L17.7 35.0L14.3 37.5L11.2 40.0L8.6 42.5L6.6 45.0L5.4 47.5L5.0 50.0L5.4 52.5L6.6 55.0L8.6 57.5L11.2 60.0L14.3 62.5L17.7 65.0L21.2 67.5L24.6 70.0L27.8 72.5L30.6 75.0L32.8 77.5L34.3 80.0L35.0 82.5L34.8 85.0L33.9 87.5L32.1 90.0L29.7 92.5L26.8 95.0L23.5 97.5L20.0 100.0" fill="none" stroke="#1f2a4d" strokeWidth="7" strokeLinecap="round" />
      <path d="M20.0 0.0L23.5 2.5L26.8 5.0L29.7 7.5L32.1 10.0L33.9 12.5L34.8 15.0L35.0 17.5L34.3 20.0L32.8 22.5L30.6 25.0L27.8 27.5L24.6 30.0L21.2 32.5L17.7 35.0L14.3 37.5L11.2 40.0L8.6 42.5L6.6 45.0L5.4 47.5L5.0 50.0L5.4 52.5L6.6 55.0L8.6 57.5L11.2 60.0L14.3 62.5L17.7 65.0L21.2 67.5L24.6 70.0L27.8 72.5L30.6 75.0L32.8 77.5L34.3 80.0L35.0 82.5L34.8 85.0L33.9 87.5L32.1 90.0L29.7 92.5L26.8 95.0L23.5 97.5L20.0 100.0" fill="none" stroke="var(--rose-kiss)" strokeWidth="4" strokeLinecap="round" />
      <path d="M20.0 0.0L16.5 2.5L13.2 5.0L10.3 7.5L7.9 10.0L6.1 12.5L5.2 15.0L5.0 17.5L5.7 20.0L7.2 22.5L9.4 25.0L12.2 27.5L15.4 30.0L18.8 32.5L22.3 35.0L25.7 37.5L28.8 40.0L31.4 42.5L33.4 45.0L34.6 47.5L35.0 50.0L34.6 52.5L33.4 55.0L31.4 57.5L28.8 60.0L25.7 62.5L22.3 65.0L18.8 67.5L15.4 70.0L12.2 72.5L9.4 75.0L7.2 77.5L5.7 80.0L5.0 82.5L5.2 85.0L6.1 87.5L7.9 90.0L10.3 92.5L13.2 95.0L16.5 97.5L20.0 100.0" fill="none" stroke="#1f2a4d" strokeWidth="7" strokeLinecap="round" />
      <path d="M20.0 0.0L16.5 2.5L13.2 5.0L10.3 7.5L7.9 10.0L6.1 12.5L5.2 15.0L5.0 17.5L5.7 20.0L7.2 22.5L9.4 25.0L12.2 27.5L15.4 30.0L18.8 32.5L22.3 35.0L25.7 37.5L28.8 40.0L31.4 42.5L33.4 45.0L34.6 47.5L35.0 50.0L34.6 52.5L33.4 55.0L31.4 57.5L28.8 60.0L25.7 62.5L22.3 65.0L18.8 67.5L15.4 70.0L12.2 72.5L9.4 75.0L7.2 77.5L5.7 80.0L5.0 82.5L5.2 85.0L6.1 87.5L7.9 90.0L10.3 92.5L13.2 95.0L16.5 97.5L20.0 100.0" fill="none" stroke="var(--cool-sky)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
