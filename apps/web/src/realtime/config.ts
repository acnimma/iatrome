/**
 * Where the realtime server lives.
 * Production: NEXT_PUBLIC_REALTIME_HOST (e.g. `iatrome-realtime.<account>.workers.dev`).
 * Local dev: the same machine as the page on port 8787, so phones on the same Wi-Fi
 * can play against a laptop running `npm run dev`.
 */
export function realtimeTarget(): { host: string; secure: boolean } {
  const configured = process.env.NEXT_PUBLIC_REALTIME_HOST;
  if (configured) return { host: configured.replace(/^https?:\/\//, '').replace(/\/$/, ''), secure: true };
  return { host: `${window.location.hostname}:8787`, secure: window.location.protocol === 'https:' };
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
