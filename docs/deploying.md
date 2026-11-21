# Going live

Two pieces deploy separately — both on Cloudflare:

| Piece | Where | Why |
|---|---|---|
| `apps/web` (the site) | **Cloudflare Workers** via OpenNext | Next.js 16 with dynamic join-code routes (`/[code]`, `/host/[code]`, `/play/[code]`) — not a static export. |
| `apps/realtime` (the game server) | **Cloudflare Workers + Durable Objects** | Holds WebSockets open. Each room is one Durable Object with server-side timers. Free tier covers casual play. |

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
`https://iatrome.com` and `https://www.iatrome.com`. Change them there if your domain differs, then redeploy.

## 2. Site → Cloudflare Workers (OpenNext)

```bash
npm run deploy:web
```

That builds with OpenNext (`@opennextjs/cloudflare`) and deploys the `iatrome` Worker. `NEXT_PUBLIC_SITE_URL=https://iatrome.com` is set at build time so link previews get absolute URLs.

Config lives in `apps/web/wrangler.jsonc` and `apps/web/open-next.config.ts`. Preview locally in the Workers runtime with `npm run preview -w @iatrome/web`.

**Build-time environment variables.** Every `NEXT_PUBLIC_*` value (realtime host, site URL, the ads flag, and the AdSense client and slot IDs) is baked into the client bundle at build time — set them wherever the build runs (the deploy script, Wrangler CI, or your local shell), not only as Worker runtime secrets.

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://iatrome.com` (already set in the deploy script; also the code fallback in `layout.tsx`) |
| `NEXT_PUBLIC_REALTIME_HOST` | `iatrome-realtime.<your-subdomain>.workers.dev` (no `https://`) — only if not using the default |
| `NEXT_PUBLIC_ADS_ENABLED` | `true` to turn ads on (off by default; nothing loads without it) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | Your AdSense publisher id, `ca-pub-…` |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME`, `_LOBBY`, `_FUN_FACT`, `_GAME_OVER` | One 728x90 ad unit id per placement |

Ads show on the big screen only, never during a timer: in the lobby, on every third fun fact once it has settled, and after the podium finishes. A visitor must accept cookies first, and one tap on × hides ads for the visit.

The ad frame picks the banner that fits the screen (728x90 on laptops and TVs, 468x60 on tablets, 320x100 on phones) and reserves its space before the ad loads, so nothing shifts. Create the units in AdSense as fixed-size display ads in those sizes, and turn **Auto ads off** for the site: they place units wherever they like, including next to buttons.

Redeploy after changing them (they’re baked in at build time).

Workers preview URLs look like `https://<alias>-iatrome.iatrome-realtime.workers.dev`. Add them to `ALLOWED_ORIGINS` only if you need preview hosts to open rooms.

## 3. Domain → Cloudflare / Namecheap DNS

In the Cloudflare dashboard: **Workers & Pages → iatrome → Settings → Domains & Routes → Add** `iatrome.com` and `www.iatrome.com`.

If the zone is on Cloudflare DNS, records are created for you. If DNS stays at Namecheap, point the apex and `www` at the Worker as Cloudflare instructs (typically a CNAME to `iatrome.<your-subdomain>.workers.dev`, or Cloudflare’s proxied records if you move the zone).

In Namecheap: **Domain List → iatrome.com → Advanced DNS** → delete parking records → add whatever Cloudflare shows. Propagation usually takes minutes; HTTPS is issued automatically.

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

### Extra hardening in the Cloudflare dashboard (optional)

- Workers → `iatrome` / `iatrome-realtime` → Observability: logs are on, so spikes are visible.
- Turn on **Under Attack Mode** or a WAF challenge only during an attack.

## 4. Smoke test

1. Open `https://iatrome.com/host` on a laptop → Create room.
2. Join from two phones on mobile data (not Wi-Fi) via the QR code.
3. There are no bots: you need 3 real people for Grand Rounds, 2 for Didactics.

## Costs & limits (free tiers)

- Durable Objects on the Workers Free plan: generous for friend groups. Each game writes a few hundred small storage rows; drawings are stored per room and deleted when the room empties.
- Empty rooms delete themselves after 30 minutes.
