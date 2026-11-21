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
| `NEXT_PUBLIC_ADS_ENABLED` | `true` to turn ads on (off by default; nothing loads without it) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Your AdSense publisher id, `ca-pub-…` |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME`, `_LOBBY`, `_FUN_FACT`, `_GAME_OVER` | One 728x90 ad unit id per placement |

Ads show on the big screen only, never during a timer: in the lobby, on every third fun fact once it has settled, and after the podium finishes. A visitor must accept cookies first, and one tap on × hides ads for the visit.

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
| Scripts mass-creating rooms | Strict per-address limit (10 rooms / 10 min, IPv6 counted per /64) in a `Limiter` Durable Object, plus Cloudflare's rate-limit binding; a global cap on open rooms and rooms per day (below) |
| Code guessing / socket spam | 60 connections / min per address; at most 6 not-yet-joined sockets per address per room |
| Message floods | Per-socket token bucket (80 burst, 40/s) and 1.5 MB / 10 s; repeat offenders are disconnected |
| Filling a room so nobody can join | 70 sockets per room; idle not-yet-joined sockets are dropped oldest-first instead of locking players out |
| Oversized or junk requests | Room creation bodies over 4 KB rejected; every message is schema-validated and size-capped; drawings capped |
| Other websites using the server | Origin allow-list (`ALLOWED_ORIGINS`) |
| Clickjacking etc. on the site | Security headers in `apps/web/next.config.ts` |
| A surprise bill | The Workers Free plan has hard daily limits: abuse can at worst pause the game for the day, never charge you |

### Global room caps

The game server refuses new rooms once **25 are open at once** or **300 have been created today (UTC)**, whoever is asking. Players see "The hospital is full right now". Slots free when a room closes or empties, and lapse on their own after 6 hours as a safety net. Change `MAX_ROOMS` and `MAX_ROOMS_PER_DAY` in `apps/realtime/wrangler.jsonc` to raise or lower them.

### Extra hardening in the Cloudflare and Vercel dashboards (optional)

- Vercel → Settings → Firewall: keep the default DDoS protection on; turn on **Attack Challenge Mode** only during an attack.
- Cloudflare → Workers → `iatrome-realtime` → Observability: logs are on, so spikes are visible.

## 4. Smoke test

1. Open `https://iatrome.com/host` on a laptop → Create room.
2. Join from two phones on mobile data (not Wi-Fi) via the QR code.
3. There are no bots: you need 3 real people for Grand Rounds, 2 for Didactics.

## Costs & limits (free tiers)

- Durable Objects on the Workers Free plan: generous for friend groups. Each game writes a few hundred small storage rows; drawings are stored per room and deleted when the room empties.
- Empty rooms delete themselves after 30 minutes.
