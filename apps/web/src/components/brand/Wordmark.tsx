'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls, useReducedMotion, type TargetAndTransition } from 'motion/react';
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

const ENTRANCE_DELAY = 0.15; // seconds
const LETTER_STAGGER = 0.07; // seconds between letters

const wobble: TargetAndTransition = {
  scaleX: [1, 1.18, 0.9, 1.05, 1],
  scaleY: [1, 0.82, 1.1, 0.97, 1],
  transition: { duration: 0.55, ease: 'easeOut' },
};

const hop: TargetAndTransition = {
  y: [0, -46, 0, 0, 0],
  scaleX: [1, 0.88, 1.22, 0.95, 1],
  scaleY: [1, 1.16, 0.78, 1.04, 1],
  transition: { duration: 0.7, times: [0, 0.32, 0.55, 0.75, 1], ease: 'easeOut' },
};

const heartbeat: TargetAndTransition = {
  scale: [1, 1.28, 1.02, 1.2, 1],
  rotate: [0, -6, 0, 5, 0],
  transition: { duration: 0.75, times: [0, 0.14, 0.32, 0.46, 1], ease: 'easeOut' },
};

// ── Letter ───────────────────────────────────────────────────────────────────

type LetterProps = { index: number; d: string; box: Box; wave: number; animateIn: boolean };

function Letter({ index, d, box, wave, animateIn }: LetterProps) {
  const controls = useAnimationControls();
  const gradientId = `wm-grad-${index}`;

  // Entrance: drop in one by one and land with a squash.
  useEffect(() => {
    if (!animateIn) return;
    controls.set({ y: -140, opacity: 0 });
    controls.start({
      y: [-140, 0, 0],
      opacity: [0, 1, 1],
      scaleX: [0.9, 1.25, 1],
      scaleY: [1.15, 0.75, 1],
      transition: { delay: ENTRANCE_DELAY + index * LETTER_STAGGER, duration: 0.65, times: [0, 0.55, 1], ease: 'easeOut' },
    });
  }, [animateIn, controls, index]);

  // Idle wave, triggered by the parent.
  useEffect(() => {
    if (wave === 0) return;
    controls.start({ y: [0, -16, 0], transition: { delay: index * 0.06, duration: 0.45, ease: 'easeInOut' } });
  }, [wave, controls, index]);

  const outlineWidth = W.outline * 2;
  return (
    <motion.span
      className={styles.piece}
      style={placement(box)}
      animate={controls}
      drag
      dragSnapToOrigin
      dragElastic={0.55}
      dragTransition={{ bounceStiffness: 520, bounceDamping: 14 }}
      whileDrag={{ scale: 1.12, rotate: index % 2 ? 8 : -8 }}
      onHoverStart={(e) => {
        if ((e as PointerEvent).pointerType === 'mouse') controls.start(wobble);
      }}
      onTap={() => {
        haptic('tap');
        controls.start(hop);
      }}
    >
      <svg viewBox={viewBox(box)} className={styles.svg} aria-hidden>
        <defs>
          <RainbowGradient id={gradientId} />
        </defs>
        <path d={d} transform={`translate(0 ${W.depth})`} fill={W.ink} stroke={W.ink} strokeWidth={outlineWidth} strokeLinejoin="round" />
        <path d={d} fill={W.ink} stroke={W.ink} strokeWidth={outlineWidth} strokeLinejoin="round" />
        <path d={d} fill={`url(#${gradientId})`} />
      </svg>
    </motion.span>
  );
}

function RainbowGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={W.gradient.x1} y1={0} x2={W.gradient.x2} y2={0}>
      {W.rainbow.map((color, i) => (
        <stop key={color} offset={i / (W.rainbow.length - 1)} stopColor={color} />
      ))}
    </linearGradient>
  );
}

// ── Stethoscope "!" ──────────────────────────────────────────────────────────

type Heart = { id: number; dx: number };

function Stethoscope({ beatSignal }: { beatSignal: number }) {
  const controls = useAnimationControls();
  const s = W.stethoscope;

  useEffect(() => {
    if (beatSignal > 0) controls.start(heartbeat);
  }, [beatSignal, controls]);

  const [hearts, setHearts] = useState<Heart[]>([]);
  const nextId = useRef(0);

  const beat = () => {
    haptic('heartbeat');
    controls.start(heartbeat);
    const id = nextId.current++;
    setHearts((h) => [...h.slice(-5), { id, dx: Math.round(Math.random() * 60 - 30) }]);
  };

  const shapeLayer = (paint: string, grow: number, dy = 0) => (
    <g transform={`translate(${s.x} ${s.y + dy}) scale(${s.scale})`}>
      {s.shapes.map((sh, i) =>
        sh.kind === 'line' ? (
          <path key={i} d={sh.d} fill="none" stroke={paint} strokeWidth={sh.w + (2 * grow) / s.scale} strokeLinecap="round" />
        ) : (
          <circle key={i} cx={sh.cx} cy={sh.cy} r={sh.r + grow / s.scale} fill={paint} />
        ),
      )}
    </g>
  );

  return (
    <motion.button
      type="button"
      className={`${styles.piece} ${styles.scope}`}
      style={placement(s.box)}
      animate={controls}
      onTap={beat}
      aria-label="Listen to the heartbeat"
      whileHover={{ rotate: -4 }}
    >
      <svg viewBox={viewBox(s.box)} className={styles.svg} aria-hidden>
        <defs>
          <linearGradient id="wm-scope" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={100} y2={0}>
            {s.gradientStops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>
        {shapeLayer(W.ink, W.outline, W.depth)}
        {shapeLayer(W.ink, W.outline)}
        {shapeLayer('url(#wm-scope)', 0)}
        <g transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}>
          {s.details.map((dt, i) => (
            <circle key={i} cx={dt.cx} cy={dt.cy} r={dt.r} fill="none" stroke={W.snow} strokeWidth={dt.w} />
          ))}
        </g>
      </svg>
      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className={styles.heart}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], y: -110, x: h.dx, scale: [0.4, 1.2, 1] }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          onAnimationComplete={() => setHearts((all) => all.filter((x) => x.id !== h.id))}
          aria-hidden
        >
          ♥
        </motion.span>
      ))}
    </motion.button>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────

/**
 * The interactive iatrome! logo. Every letter is its own squishy sticker:
 * hover to wobble, tap to hop, drag to stretch (it springs back).
 * The stethoscope "!" beats like a heart when tapped.
 */
export function Wordmark({ idleWave = true }: { idleWave?: boolean }) {
  const reduceMotion = useReducedMotion() ?? false;
  const [wave, setWave] = useState(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    // the "!" thumps once the last letter has landed…
    const landed = setTimeout(() => setBeat((b) => b + 1), (ENTRANCE_DELAY + W.letters.length * LETTER_STAGGER + 0.45) * 1000);
    // …then an occasional Mexican wave keeps the logo alive.
    const idle = idleWave
      ? setInterval(() => {
          if (document.hidden) return;
          setWave((w) => w + 1);
          setTimeout(() => setBeat((b) => b + 1), W.letters.length * 60 + 200);
        }, 7000)
      : undefined;
    return () => {
      clearTimeout(landed);
      clearInterval(idle);
    };
  }, [idleWave, reduceMotion]);

  return (
    <span className={styles.wordmark} style={{ aspectRatio: `${W.width} / ${W.height}` }}>
      <span className="visually-hidden">iatrome!</span>
      {W.letters.map((l, i) => (
        <Letter key={i} index={i} d={l.d} box={l.box} wave={wave} animateIn={!reduceMotion} />
      ))}
      <Stethoscope beatSignal={beat} />
    </span>
  );
}
