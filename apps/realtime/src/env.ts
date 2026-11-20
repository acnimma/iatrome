import type { Limiter } from './limiter';
import type { Room } from './room-server';

export interface Env {
  Room: DurableObjectNamespace<Room>;
  /** One strict rate limiter per client address. */
  Limiter: DurableObjectNamespace<Limiter>;
  /** Comma-separated origins allowed to use the server. Supports `*` wildcards, e.g. `https://*.vercel.app`. */
  ALLOWED_ORIGINS: string;
  /** "true" enables the speed setting (local development only). */
  DEV_MODE: string;
  /** Cloudflare's global rate limiters (see wrangler.jsonc). Absent in some local setups. */
  CREATE_LIMITER?: RateLimit;
  CONNECT_LIMITER?: RateLimit;
  /** When set (a secret), creating a room needs a passed Cloudflare Turnstile check. */
  TURNSTILE_SECRET?: string;
}
