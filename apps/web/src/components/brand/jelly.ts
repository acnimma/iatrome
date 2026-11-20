/**
 * Tiny damped-spring physics for the jelly wordmark. Each letter is a few
 * springs (bounce, lean, squash and shear) that settle back to rest; the
 * component steps them once per animation frame and writes the result as a
 * CSS transform, so nothing ever triggers layout.
 */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** A value pulled towards `target` by a spring, with velocity `v` (units per second). */
class Spring {
  x = 0;
  v = 0;
  target = 0;

  constructor(
    public stiffness: number,
    public damping: number,
    private readonly epsilon: number, // "close enough" to call it at rest
  ) {}

  step(dt: number) {
    this.v += (-this.stiffness * (this.x - this.target) - this.damping * this.v) * dt;
    this.x += this.v * dt;
  }

  get resting() {
    return Math.abs(this.v) < this.epsilon * 10 && Math.abs(this.x - this.target) < this.epsilon;
  }

  settle() {
    this.x = this.target;
    this.v = 0;
  }
}

// ── A jelly letter ───────────────────────────────────────────────────────────

const DROP_FROM = -60; // % of the letter's height above its seat
const GRAVITY = 2600; // %/s²
const IMPACT_SQUASH = 0.0075; // squash velocity per unit of landing speed
const BOUNCE = 0.18; // how much of the landing speed bounces back up
const FADE_IN = 0.12; // s

export class JellyLetter {
  /** Vertical offset, in % of the letter's height (negative = up). */
  readonly y = new Spring(170, 13, 0.02);
  /** Lean, in degrees. */
  readonly rot = new Spring(200, 15, 0.02);
  /** Squash (positive = wider and shorter, negative = taller). Wobbly on purpose. */
  readonly squash = new Spring(330, 8.5, 0.0005);
  /** Sideways jelly sway, in degrees of skew. */
  readonly shear = new Spring(260, 7, 0.02);

  private airborne = false;
  private dropAt = 0;
  opacity = 1;

  /** Starts the letter above its seat; it falls in at `at` (s) and lands with a plop. */
  drop(at: number) {
    this.airborne = true;
    this.dropAt = at;
    this.y.x = DROP_FROM;
    this.opacity = 0;
  }

  /** A quick squish, e.g. a tap. */
  poke(strength = 1) {
    this.squash.v += 2.8 * strength;
    this.y.v += 25 * strength;
  }

  /** Held down: stays squished until released, then springs back past round. */
  hold(down: boolean) {
    this.squash.target = down ? 0.12 : 0;
    if (!down) this.squash.v -= 1.2;
  }

  /** Something swept past sideways by `dx` (wordmark units) with `reach` 0–1. */
  sweep(dx: number, reach: number) {
    this.shear.v += dx * reach * 0.5;
    this.rot.v += dx * reach * 0.25;
    this.squash.v += Math.abs(dx) * reach * 0.008;
  }

  step(dt: number, now: number) {
    if (this.airborne) {
      if (now < this.dropAt) return;
      this.opacity = Math.min(1, (now - this.dropAt) / FADE_IN);
      this.y.v += GRAVITY * dt;
      this.y.x += this.y.v * dt;
      if (this.y.x >= 0) {
        // landed: the fall turns into a squash, and a little hop
        this.airborne = false;
        this.squash.v += this.y.v * IMPACT_SQUASH;
        this.y.x = 0;
        this.y.v *= -BOUNCE;
      }
    } else {
      this.y.step(dt);
    }
    this.rot.step(dt);
    this.squash.step(dt);
    this.shear.step(dt);
    // keep wild flicks fun rather than broken
    this.squash.x = clamp(this.squash.x, -0.3, 0.32);
    this.shear.x = clamp(this.shear.x, -14, 14);
  }

  get resting() {
    return !this.airborne && this.y.resting && this.rot.resting && this.squash.resting && this.shear.resting;
  }

  /** The letter's CSS transform (origin: bottom centre of its ink). */
  get transform() {
    // stretch along the fall while airborne
    const s = this.airborne ? -clamp(this.y.v * 0.0005, 0, 0.2) : this.squash.x;
    const sx = 1 + s * 0.85;
    const sy = 1 - s;
    return `translate3d(0,${this.y.x.toFixed(2)}%,0) rotate(${this.rot.x.toFixed(2)}deg) skewX(${this.shear.x.toFixed(2)}deg) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
  }

  /** The shadow spreads as the letter squashes and shrinks and fades as it lifts. */
  get shadow() {
    const lift = clamp(-this.y.x / 30, 0, 1);
    const spread = 1 + (this.airborne ? 0 : this.squash.x) * 0.9 - lift * 0.35;
    return {
      transform: `scale(${spread.toFixed(4)},1)`,
      opacity: (this.opacity * (1 - lift * 0.9)).toFixed(3),
    };
  }
}

// ── The tablet "o": two halves that crack apart and snap back ────────────────

const HOLD_OPEN = 0.5; // s the halves stay apart before snapping back
const OPEN = { stiffness: 170, damping: 11 };
const SNAP = { stiffness: 320, damping: 13 };

export class JellyTablet {
  /** 0 = whole, 1 = cracked open. */
  readonly open = new Spring(OPEN.stiffness, OPEN.damping, 0.001);
  private closeAt = 0;

  crack(now: number) {
    Object.assign(this.open, OPEN);
    this.open.target = 1;
    this.open.v += 6;
    this.closeAt = now + HOLD_OPEN;
  }

  /** Steps the halves; returns the speed they hit each other at when they snap shut (else 0). */
  step(dt: number, now: number) {
    if (this.open.target === 1 && now >= this.closeAt) {
      Object.assign(this.open, SNAP);
      this.open.target = 0;
    }
    this.open.step(dt);
    if (this.open.x >= 0) return 0;
    // the halves collide: bounce off each other with a jelly thud
    const impact = -this.open.v;
    this.open.x = 0;
    this.open.v = impact * 0.35;
    return impact;
  }

  get resting() {
    return this.open.target === 0 && this.open.resting;
  }

  /** Transforms for the left and right halves (origin: the bottom of the score line). */
  get halves() {
    const o = this.open.x;
    const half = (side: number) =>
      `translate3d(${(side * o * 7).toFixed(2)}%,${(-o * 5).toFixed(2)}%,0) rotate(${(side * o * 20).toFixed(2)}deg)`;
    return [half(-1), half(1)] as const;
  }

  /** The palette flash glimpsed inside while it is open. */
  get flash() {
    const o = clamp(this.open.x, 0, 1.4);
    return { transform: `scale(${(0.4 + o * 0.6).toFixed(3)})`, opacity: clamp(o * 1.6, 0, 1).toFixed(3) };
  }
}
