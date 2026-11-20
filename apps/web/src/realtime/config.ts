/**
 * Where the realtime server lives.
 * Production: NEXT_PUBLIC_REALTIME_HOST (e.g. `iatrome-realtime.<account>.workers.dev`).
 * Local dev: the same machine as the page on port 8787, so phones on the same Wi-Fi
 * can play against a laptop running `npm run dev`.
 */
/** The deployed game server, used by the live site when no env var overrides it. */
const PRODUCTION_REALTIME_HOST = 'iatrome-realtime.iatrome-realtime.workers.dev';

/** Local dev: localhost or a LAN address (phones on the same Wi-Fi). Anything else is a deployment. */
const isLocal = (hostname: string) => hostname === 'localhost' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname) || hostname.endsWith('.local');

export function realtimeTarget(): { host: string; secure: boolean } {
  const configured = process.env.NEXT_PUBLIC_REALTIME_HOST;
  if (configured) return { host: configured.replace(/^https?:\/\//, '').replace(/\/$/, ''), secure: true };
  if (!isLocal(window.location.hostname)) return { host: PRODUCTION_REALTIME_HOST, secure: true };
  return { host: `${window.location.hostname}:8787`, secure: window.location.protocol === 'https:' };
}

/** Cloudflare Turnstile site key (public), when room creation is protected. */
export function turnstileSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined;
}

export function realtimeHttpUrl(path: string): string {
  const { host, secure } = realtimeTarget();
  return `${secure ? 'https' : 'http'}://${host}${path}`;
}

/** The public URL players type, without protocol (e.g. "iatrome.com"). */
export function siteDisplayHost(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const host = configured ? new URL(configured).host : window.location.host;
  return host.replace(/^www\./, '');
}
