# Going live

Two pieces deploy separately:

| Piece | Where | Why |
|---|---|---|
| `apps/web` (the site) | **Vercel** | Static + server-rendered pages. |
| `apps/realtime` (the game server) | **Cloudflare Workers + Durable Objects** | Vercel functions can’t hold WebSockets open. Each room is one Durable Object with server-side timers. Free tier covers casual play. |

## 1. Game server → Cloudflare (once, ~5 minutes)

1. Create a free Cloudflare account at dash.cloudflare.com.
2. In this repo:
   ```bash
   npx wrangler login          # opens your browser to authorize
   npm run deploy:realtime
   ```
3. Wrangler prints your server’s URL, e.g. `https://iatrome-realtime.<your-subdomain>.workers.dev`.
   Check it: `curl https://iatrome-realtime.<your-subdomain>.workers.dev/api/health` → `ok`.

Live server: `https://iatrome-realtime.iatrome-realtime.workers.dev`. The site uses it automatically on any non-local hostname (`apps/web/src/realtime/config.ts`), so `NEXT_PUBLIC_REALTIME_HOST` is only needed to point somewhere else.

Allowed site origins are set in `apps/realtime/wrangler.jsonc` (`ALLOWED_ORIGINS`):
`https://iatrome.com, https://www.iatrome.com, https://*.vercel.app`. Change them there if your domain differs, then redeploy.

## 2. Site → Vercel

Project settings (already done if the site is live):
- **Root Directory:** `apps/web` (with “Include files outside the root directory” on).
- Framework is pinned to Next.js by `apps/web/vercel.json`.

**Environment variables** (Settings → Environment Variables, for Production and Preview):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_REALTIME_HOST` | `iatrome-realtime.<your-subdomain>.workers.dev` (no `https://`) |
| `NEXT_PUBLIC_SITE_URL` | `https://iatrome.com` |

Redeploy after adding them (they’re baked in at build time).

## 3. Domain → Namecheap DNS

In Vercel: **Settings → Domains → Add** `iatrome.com` and `www.iatrome.com`. Vercel shows the exact records to create: use those values. They are typically:

| Type | Host | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com.` |

In Namecheap: **Domain List → iatrome.com → Advanced DNS** → delete the default parking records (the `@` URL redirect and `www` CNAME to parkingpage) → add the records above. Propagation usually takes minutes; Vercel issues HTTPS automatically.

## Abuse protection

What's already in place:

| Threat | Protection |
|---|---|
| Scripts mass-creating rooms | Strict per-address limit (10 rooms / 10 min, IPv6 counted per /64) in a `Limiter` Durable Object, plus Cloudflare's rate-limit binding; optional Turnstile (below) |
| Code guessing / socket spam | 60 connections / min per address; at most 6 not-yet-joined sockets per address per room |
| Message floods | Per-socket token bucket (80 burst, 40/s) and 1.5 MB / 10 s; repeat offenders are disconnected |
| Filling a room so nobody can join | 70 sockets per room; idle not-yet-joined sockets are dropped oldest-first instead of locking players out |
| Oversized or junk requests | Room creation bodies over 4 KB rejected; every message is schema-validated and size-capped; drawings capped |
| Other websites using the server | Origin allow-list (`ALLOWED_ORIGINS`) |
| Clickjacking etc. on the site | Security headers in `apps/web/next.config.ts` |
| A surprise bill | The Workers Free plan has hard daily limits: abuse can at worst pause the game for the day, never charge you |

### Turn on Turnstile (recommended, 2 minutes)

Turnstile is Cloudflare's invisible "are you a person" check. With it on, scripts can't create rooms at all.

1. Cloudflare dashboard → **Turnstile → Add widget**: name `iatrome`, hostnames `iatrome.com` and `www.iatrome.com` (add `localhost` for testing), widget mode **Managed**.
2. Copy the **site key** into Vercel as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Production) and redeploy the site.
3. Store the **secret key** on the game server: `npx wrangler secret put TURNSTILE_SECRET` (from `apps/realtime`).

Do step 2 before step 3: once the secret is set, room creation requires a token.

### Extra hardening in the Cloudflare and Vercel dashboards (optional)

- Vercel → Settings → Firewall: keep the default DDoS protection on; turn on **Attack Challenge Mode** only during an attack.
- Cloudflare → Workers → `iatrome-realtime` → Observability: logs are on, so spikes are visible.

## 4. Smoke test

1. Open `https://iatrome.com/host` on a laptop → Create room.
2. Join from two phones on mobile data (not Wi-Fi) via the QR code.
3. There are no bots: you need 3 real people for Grand Rounds, 2 for Survive the Shift.

## Costs & limits (free tiers)

- Durable Objects on the Workers Free plan: generous for friend groups. Each game writes a few hundred small storage rows; drawings are stored per room and deleted when the room empties.
- Empty rooms delete themselves after 30 minutes.
