import type { Room } from './room-server';

export interface Env {
  Room: DurableObjectNamespace<Room>;
  /** Comma-separated origins allowed to use the server. Supports `*` wildcards, e.g. `https://*.vercel.app`. */
  ALLOWED_ORIGINS: string;
  /** "true" enables bots and the speed setting (local development only). */
  DEV_MODE: string;
}
