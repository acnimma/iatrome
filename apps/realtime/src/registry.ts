import type { Env } from './env';

/**
 * Global caps on rooms, so no flood of traffic can run up the Cloudflare bill.
 * Both are deliberately far below what the free plan allows; raise MAX_ROOMS / MAX_ROOMS_PER_DAY
 * in wrangler.jsonc if the game outgrows them.
 */
const DEFAULT_MAX_ROOMS = 25;
const DEFAULT_MAX_ROOMS_PER_DAY = 300;
/** A slot frees itself after this long even if its room never reported back. */
const SLOT_LEASE_MS = 6 * 60 * 60_000;

function positive(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return n > 0 ? n : fallback;
}

function registry(env: Env) {
  return env.Limiter.get(env.Limiter.idFromName('rooms'));
}

/** Takes a global room slot. False means the server is full (or hit today's cap). Fails open on outage. */
export async function claimSlot(env: Env, code: string): Promise<boolean> {
  try {
    return await registry(env).claimRoom(
      code,
      positive(env.MAX_ROOMS, DEFAULT_MAX_ROOMS),
      positive(env.MAX_ROOMS_PER_DAY, DEFAULT_MAX_ROOMS_PER_DAY),
      SLOT_LEASE_MS,
    );
  } catch {
    return true;
  }
}

/** Frees a room's slot when it ends. If this fails the lease lapses on its own. */
export async function releaseSlot(env: Env, code: string): Promise<void> {
  try {
    await registry(env).releaseRoom(code);
  } catch {
    // ignore
  }
}
