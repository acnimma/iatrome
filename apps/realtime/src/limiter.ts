import { DurableObject } from 'cloudflare:workers';

/**
 * A strictly consistent rate limiter: one tiny Durable Object per client address, so every
 * request from that address, wherever it lands, counts against the same sliding windows.
 * Counts live in memory: an idle limiter that gets evicted simply starts fresh.
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
}
