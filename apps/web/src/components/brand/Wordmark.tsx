'use client';

import { useEffect, useId, useMemo, useRef } from 'react';
import {
  motion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
} from 'motion/react';
import { wordmarkGlyphs as W } from './wordmark-glyphs';
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

// ── Motion recipes ───────────────────────────────────────────────────────────

/** Staggered entrance: each letter rises softly into place and comes into focus. */
const entrance = (index: number) => {
  const delay = 0.15 + index * 0.065;
  return {
    initial: { opacity: 0, y: '22%', filter: 'blur(6px)' },
    animate: { opacity: 1, y: '0%', filter: 'blur(0px)' },
    transition: {
      y: { type: 'spring', stiffness: 140, damping: 18, delay },
      default: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
    } satisfies Transition,
  };
};

/** How the letters follow the pointer: quick but never bouncy. */
const FOLLOW = { stiffness: 220, damping: 24, mass: 0.7 };
/** Soft squish on press. */
const SQUISH = { scaleX: 1.06, scaleY: 0.92 };
const SQUISH_SPRING: Transition = { type: 'spring', stiffness: 520, damping: 20 };

// How far the pointer's pull reaches, in wordmark units.
const REACH_X = W.width * 0.12;
const REACH_Y = W.height * 0.75;
const LIFT = 7; // % of the letter's height at full pull
const TILT = 7; // degrees at full pull

/** The pointer in wordmark units, and whether it is present (0–1). */
type Pointer = { x: MotionValue<number>; y: MotionValue<number>; present: MotionValue<number> };

// ── Letter ───────────────────────────────────────────────────────────────────

type LetterProps = { index: number; d: string; box: Box; pointer: Pointer; ids: Ids };

/** One letter: its soft shadow on the "ground" and the glossy glyph above it. */
function Letter({ index, d, box, pointer, ids }: LetterProps) {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // 0–1: how strongly the pointer pulls this letter, and which way it leans.
  const pull = useSpring(
    useTransform(() => {
      const dx = (pointer.x.get() - cx) / REACH_X;
      const dy = (pointer.y.get() - cy) / REACH_Y;
      return pointer.present.get() * Math.exp(-(dx * dx + dy * dy));
    }),
    FOLLOW,
  );
  const lean = useSpring(
    useTransform(() => {
      const dx = (pointer.x.get() - cx) / REACH_X;
      return pointer.present.get() * Math.max(-1, Math.min(1, dx)) * Math.exp(-dx * dx);
    }),
    FOLLOW,
  );

  const y = useTransform(pull, (p) => `${-p * LIFT}%`);
  const rotate = useTransform(lean, (l) => l * TILT);
  const scale = useTransform(pull, (p) => 1 + p * 0.03);
  // as a letter lifts, its shadow spreads and fades
  const shadowOpacity = useTransform(pull, (p) => W.shadow.opacity * (1 - p * 0.4));
  const shadowScale = useTransform(pull, (p) => 1 - p * 0.05);

  const enter = entrance(index);
  return (
    <>
      <motion.span className={`${styles.piece} ${styles.shadow}`} style={placement(box)} {...enter}>
        <motion.svg viewBox={viewBox(box)} style={{ opacity: shadowOpacity, scale: shadowScale }} aria-hidden>
          <path d={d} transform={`translate(0 ${W.shadow.dy})`} fill={W.ink} filter={`url(#${ids.shadow})`} />
        </motion.svg>
      </motion.span>
      <motion.span className={styles.piece} style={placement(box)} {...enter}>
        <motion.span
          className={styles.glyph}
          style={{ y, rotate, scale }}
          whileTap={SQUISH}
          transition={SQUISH_SPRING}
          onTapStart={() => haptic('tap')}
        >
          <svg viewBox={viewBox(box)} aria-hidden>
            <path d={d} fill={W.ink} stroke={W.ink} strokeWidth={W.outline * 2} strokeLinejoin="round" />
            <path d={d} fill={`url(#${ids.fill})`} filter={`url(#${ids.gloss})`} />
          </svg>
        </motion.span>
      </motion.span>
    </>
  );
}

// ── Shared paint (gradient + filters, as in packages/brand) ──────────────────

type Ids = { fill: string; gloss: string; shadow: string };

/** The gloss lights the top inside edge of a letter and shades the bottom one. */
function Rim({ name, dy, color, opacity }: { name: string; dy: number; color: string; opacity: number }) {
  return (
    <>
      <feOffset in="soft" dy={dy} result={`${name}-shifted`} />
      <feComposite in="SourceAlpha" in2={`${name}-shifted`} operator="out" result={`${name}-band`} />
      <feFlood floodColor={color} floodOpacity={opacity} />
      <feComposite in2={`${name}-band`} operator="in" result={name} />
    </>
  );
}

function Paint({ ids }: { ids: Ids }) {
  const { gradient, gloss, shadow } = W;
  return (
    <svg className={styles.paint} aria-hidden>
      <defs>
        <linearGradient id={ids.fill} gradientUnits="userSpaceOnUse" x1={gradient.x1} y1={0} x2={gradient.x2} y2={0}>
          {gradient.stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <filter id={ids.gloss} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation={gloss.blur} result="soft" />
          <Rim name="highlight" dy={gloss.offset} color="#fff" opacity={gloss.highlight} />
          <Rim name="shade" dy={-gloss.offset} color={W.ink} opacity={gloss.shade} />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shade" />
            <feMergeNode in="highlight" />
          </feMerge>
        </filter>
        <filter id={ids.shadow} x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation={shadow.blur} />
        </filter>
      </defs>
    </svg>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────

/**
 * The interactive iatrome logo. Letters rise in one by one, lean and lift
 * towards a passing pointer (or finger), and squish softly when pressed.
 * With reduced motion they simply fade in and stay put.
 */
export function Wordmark() {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const ids = useMemo(() => ({ fill: `${uid}-fill`, gloss: `${uid}-gloss`, shadow: `${uid}-shadow` }), [uid]);

  const pointer: Pointer = {
    x: useMotionValue(0),
    y: useMotionValue(0),
    present: useMotionValue(0),
  };
  const { x, y, present } = pointer;

  useEffect(() => {
    if (reduceMotion) return;
    const track = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      x.set(((e.clientX - r.left) / r.width) * W.width);
      y.set(((e.clientY - r.top) / r.height) * W.height);
      present.set(1);
    };
    const release = () => present.set(0);
    const lift = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') release(); // a finger leaving the screen
    };
    window.addEventListener('pointerdown', track);
    window.addEventListener('pointermove', track);
    window.addEventListener('pointerup', lift);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    document.documentElement.addEventListener('pointerleave', release);
    return () => {
      window.removeEventListener('pointerdown', track);
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointerup', lift);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.documentElement.removeEventListener('pointerleave', release);
    };
  }, [reduceMotion, x, y, present]);

  return (
    <MotionConfig reducedMotion="user">
      <span ref={ref} className={styles.wordmark} style={{ aspectRatio: `${W.width} / ${W.height}` }}>
        <span className="visually-hidden">iatrome</span>
        <Paint ids={ids} />
        {W.letters.map((l, i) => (
          <Letter key={i} index={i} d={l.d} box={l.box} pointer={pointer} ids={ids} />
        ))}
      </span>
    </MotionConfig>
  );
}
