import { type CreateRoomRequest, type CreateRoomResponse, ROOM, generateCode, isRoomCode } from '@iatrome/game';
import { getServerByName, routePartykitRequest } from 'partyserver';
import { randomToken } from './crypto';
import type { Env } from './env';
import { type InitRequest, Room } from './room-server';

export { Room };

/**
 * The realtime Worker.
 *   POST /api/rooms            → create a room, returns { code, hostToken }
 *   GET  /parties/room/:CODE   → WebSocket into that room's Durable Object
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
    const allowed = isAllowedOrigin(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') return cors(new Response(null, { status: allowed ? 204 : 403 }), origin, allowed);

    if (url.pathname === '/api/health') return new Response('ok');

    if (url.pathname === '/api/rooms' && request.method === 'POST') {
      if (!allowed) return new Response('Forbidden', { status: 403 });
      if (limited(`create:${ip}`, 12, 10 * 60_000)) return cors(json({ error: 'rate-limited' }, 429), origin, allowed);
      return cors(await createRoom(request, env), origin, allowed);
    }

    const response = await routePartykitRequest(request, env, {
      onBeforeConnect: (req, { name }) => {
        if (!isAllowedOrigin(req.headers.get('Origin'), env.ALLOWED_ORIGINS)) return new Response('Forbidden', { status: 403 });
        if (!isRoomCode(name)) return new Response('Not found', { status: 404 });
        // Generous for real players (reconnects included), hostile to code-guessing scripts.
        if (limited(`ws:${ip}`, 60, 60_000)) return new Response('Too many requests', { status: 429 });
      },
      onBeforeRequest: () => new Response('Not found', { status: 404 }),
    });
    return response ?? new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function createRoom(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as CreateRoomRequest;
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

/** Best-effort sliding-window limiter (per Worker isolate). */
const hits = new Map<string, number[]>();
function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) hits.clear();
  return recent.length > max;
}
