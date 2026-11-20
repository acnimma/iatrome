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

In Vercel: **Settings → Domains → Add** `iatrome.com` and `www.iatrome.com`. Vercel shows the exact records to create — use those values. They are typically:

| Type | Host | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com.` |

In Namecheap: **Domain List → iatrome.com → Advanced DNS** → delete the default parking records (the `@` URL redirect and `www` CNAME to parkingpage) → add the records above. Propagation usually takes minutes; Vercel issues HTTPS automatically.

## 4. Smoke test

1. Open `https://iatrome.com/host` on a laptop → Create room.
2. Join from two phones on mobile data (not Wi-Fi) via the QR code.
3. Bots are disabled in production (`DEV_MODE=false`) — you need 3 real people for Grand Rounds, 2 for Survive the Shift.

## Costs & limits (free tiers)

- Durable Objects on the Workers Free plan: generous for friend groups. Each game writes a few hundred small storage rows; drawings are stored per room and deleted when the room empties.
- Empty rooms delete themselves after 30 minutes.
