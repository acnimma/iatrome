'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#4988b8', '#67a1c6', '#ccb64a', '#cc4e73', '#fffdf9'];

/** A one-shot confetti burst on a canvas (cheap: one draw loop, auto-stops). */
export function Confetti({ pieces = 160 }: { pieces?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();
    const w = () => canvas.width;
    const parts = Array.from({ length: pieces }, () => ({
      x: w() / 2 + (Math.random() - 0.5) * w() * 0.3,
      y: canvas.height * 0.35,
      vx: (Math.random() - 0.5) * 22 * dpr,
      vy: (-Math.random() * 22 - 8) * dpr,
      size: (6 + Math.random() * 8) * dpr,
      spin: Math.random() * Math.PI,
      vspin: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    let raf = 0;
    let frames = 0;
    const tick = () => {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.vy += 0.45 * dpr;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.spin += p.vspin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#1f2a4d';
        ctx.lineWidth = dpr;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.strokeRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (frames < 240) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [pieces]);

  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 45 }} aria-hidden />;
}
