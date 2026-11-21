import { DurableObject } from 'cloudflare:workers';

/**
 * A strictly consistent rate limiter: one tiny Durable Object per client address, so every
 * request from that address, wherever it lands, counts against the same sliding windows.
 * Counts live in memory: an idle limiter that gets evicted simply starts fresh.
 *
 * One instance (named "rooms") also doubles as the global room registry: it caps how many
 * rooms are open at once, across everyone, so a flood can't run up the Cloudflare bill.
 */
export class Limiter extends DurableObject {
  private hits = new Map<string, number[]>();

  /** Records a hit for `bucket`; false when it's over `max` in the last `windowMs`. */
  async hit(bucket: string, max: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const recent = (this.hits.get(bucket) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    this.hits.set(bucket, recent.slice(-(max + 1)));
    return recent.length <= max;
  }

  /**
   * Takes one of `max` room slots, and one of `perDay` creations for today (UTC). Each slot is a
   * lease that lapses on its own after `leaseMs`, so a room that never reports back can't hold a
   * slot forever. False when everything is taken.
   */
  async claimRoom(code: string, max: number, perDay: number, leaseMs: number): Promise<boolean> {
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const [stored, daily] = await Promise.all([
      this.ctx.storage.get<Record<string, number>>('leases'),
      this.ctx.storage.get<{ day: string; n: number }>('daily'),
    ]);
    const leases = stored ?? {};
    for (const [c, expires] of Object.entries(leases)) if (expires <= now) delete leases[c];
    const today = daily?.day === day ? daily : { day, n: 0 };
    if (Object.keys(leases).length >= max || today.n >= perDay) {
      await this.ctx.storage.put('leases', leases);
      return false;
    }
    leases[code] = now + leaseMs;
    today.n++;
    await this.ctx.storage.put({ leases, daily: today });
    return true;
  }

  /** Frees a room's slot (the room closed or expired). */
  async releaseRoom(code: string): Promise<void> {
    const leases = (await this.ctx.storage.get<Record<string, number>>('leases')) ?? {};
    if (!(code in leases)) return;
    delete leases[code];
    await this.ctx.storage.put('leases', leases);
  }
}
