import { type CreateRoomRequest, type CreateRoomResponse, ROOM, generateCode, isRoomCode } from '@iatrome/game';
import { getServerByName, routePartykitRequest } from 'partyserver';
import { randomToken } from './crypto';
import type { Env } from './env';
import { Limiter } from './limiter';
import { type InitRequest, Room } from './room-server';

export { Limiter, Room };

/** Per client address. Real hosts make a room or two; real phones reconnect a few times. */
const LIMITS = {
  create: { max: 10, windowMs: 10 * 60_000 },
  connect: { max: 60, windowMs: 60_000 },
};

/**
 * The realtime Worker.
 *   POST /api/rooms            → create a room, returns { code, hostToken }
 *   GET  /parties/room/:CODE   → WebSocket into that room's Durable Object
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const rawIp = request.headers.get('CF-Connecting-IP');
    const ip = clientKey(rawIp);
    const allowed = isAllowedOrigin(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: allowed ? 204 : 403 }), origin, allowed);

    if (url.pathname === '/api/health') return new Response('ok');

    if (url.pathname === '/api/rooms' && request.method === 'POST') {
      if (!allowed) return new Response('Forbidden', { status: 403 });
      if ((await overLimit(env.CREATE_LIMITER, `create:${ip}`)) || !(await allow(env, ip, 'create')))
        return cors(json({ error: 'rate-limited' }, 429), origin, allowed);
      return cors(await createRoom(request, env, rawIp ?? 'local'), origin, allowed);
    }

    const response = await routePartykitRequest(request, env, {
      onBeforeConnect: async (req, { name }) => {
        if (!isAllowedOrigin(req.headers.get('Origin'), env.ALLOWED_ORIGINS)) return new Response('Forbidden', { status: 403 });
        if (!isRoomCode(name)) return new Response('Not found', { status: 404 });
        // Generous for real players (reconnects included), hostile to code-guessing scripts.
        if ((await overLimit(env.CONNECT_LIMITER, `ws:${ip}`)) || !(await allow(env, ip, 'connect')))
          return new Response('Too many requests', { status: 429 });
      },
      onBeforeRequest: () => new Response('Not found', { status: 404 }),
    });
    return response ?? new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

/** Room settings and a password are tiny; anything bigger is not from our site. */
const MAX_CREATE_BODY = 4_096;

async function createRoom(request: Request, env: Env, ip: string): Promise<Response> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_CREATE_BODY) return json({ error: 'too-large' }, 413);
  const raw = await request.text().catch(() => '');
  if (raw.length > MAX_CREATE_BODY) return json({ error: 'too-large' }, 413);
  let body: CreateRoomRequest = {};
  try {
    body = raw ? (JSON.parse(raw) as CreateRoomRequest) : {};
  } catch {
    return json({ error: 'bad-request' }, 400);
  }
  if (env.TURNSTILE_SECRET && !(await passedTurnstile(env.TURNSTILE_SECRET, body.turnstile, ip)))
    return json({ error: 'challenge' }, 403);
  const password = typeof body.password === 'string' ? body.password.trim().slice(0, ROOM.maxPasswordLength) : '';
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateCode(secureRandom);
    const hostToken = randomToken(24);
    const stub = await getServerByName(env.Room, code);
    const init: InitRequest = { code, hostToken, password: password || undefined, settings: body.settings };
    const res = await stub.fetch(
      new Request(`https://room/parties/room/${code}/init`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-partykit-room': code },
        body: JSON.stringify(init),
      }),
    );
    if (res.ok) return json({ code, hostToken } satisfies CreateRoomResponse);
    if (res.status !== 409) break; // 409 = code already taken, try another
  }
  return json({ error: 'Could not create a room. Try again.' }, 503);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function secureRandom() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

function isAllowedOrigin(origin: string | null, allowList: string): boolean {
  const patterns = allowList.split(',').map((s) => s.trim()).filter(Boolean);
  if (patterns.includes('*')) return true;
  if (!origin) return false;
  return patterns.some((p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^.]+')}$`).test(origin));
}

function cors(res: Response, origin: string | null, allowed: boolean): Response {
  if (!allowed || !origin) return res;
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'content-type');
  headers.set('Vary', 'Origin');
  return new Response(res.body, { status: res.status, headers });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** Cloudflare's rate limiter: counts across every Worker instance, unlike the map below. */
async function overLimit(limiter: RateLimit | undefined, key: string): Promise<boolean> {
  if (!limiter) return false;
  try {
    return !(await limiter.limit({ key })).success;
  } catch {
    return false;
  }
}

/** Checks a Turnstile token with Cloudflare (the "are you a person" check on room creation). */
async function passedTurnstile(secret: string, token: unknown, ip: string): Promise<boolean> {
  if (typeof token !== 'string' || !token || token.length > 4_096) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip !== 'local') form.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    const result = (await res.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}

/**
 * Who to count a request against. IPv6 users usually get a whole /64 (and attackers can rotate
 * within it for free), so IPv6 counts per /64 network; IPv4 per address.
 */
function clientKey(ip: string | null): string {
  if (!ip) return 'local';
  if (!ip.includes(':')) return ip;
  const [head] = ip.split('::');
  const groups = head.split(':').filter(Boolean);
  return `${groups.slice(0, 4).join(':')}::/64`;
}

/** The strict limiter: one Durable Object per address. Fails open so an outage never blocks play. */
async function allow(env: Env, ip: string, bucket: keyof typeof LIMITS): Promise<boolean> {
  const { max, windowMs } = LIMITS[bucket];
  try {
    return await env.Limiter.get(env.Limiter.idFromName(ip)).hit(bucket, max, windowMs);
  } catch {
    return true;
  }
}
