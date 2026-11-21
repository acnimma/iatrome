# iatrome

**The party game that speaks fluent medicine.** A free, phone-friendly multiplayer party game about bodies, doctors and hospitals. One shared screen (a TV, a laptop, or a video call), everyone else plays on their phone. It punches at medicine, never at patients.

Two content modes: **Normal** works for anyone (grandparents included, no medical knowledge needed) and **Pro** is the jargon-heavy version for people who work or train in healthcare.

| Game | Players | What happens |
|---|---|---|
| **Grand Rounds** | 3–8 | Anonymous head-to-head quips, then a finale where everyone answers one prompt. The room votes. |
| **Imaging** | 3–10 | One player draws live, everyone races to guess. |
| **Pick Your Poison** | 3–20 | Would-you-rather, plus predicting the room. The minority defends itself. |
| **Didactics Mode** | 2–40 | Trivia for big parties, in teams or everyone for themselves. Streaks and the fastest right answer earn bonus points. |

## Play it locally (2 minutes)

```bash
nvm use          # Node 22+
npm install
npm run dev      # site on :3000, game server on :8787
```

1. On your laptop open **http://localhost:3000/host** → pick a game → **Create room**.
2. On your phone (same Wi-Fi) open **http://&lt;your-laptop-ip&gt;:3000** and type the room code: or scan the QR code on screen.
   Your laptop’s IP is printed by `npm run dev` (look for `http://192.168…:8787`).
3. Testing alone? Open a few private browser windows as extra phones. Every mode is for real people only.

## Repo layout

```
apps/
  web/              Next.js site: home, host setup, the stage and the phone controller
  realtime/         Cloudflare Worker: one Durable Object per room (the authoritative game server)
packages/
  game/             The engine: rooms, the four games, scoring, protocol. Pure TypeScript, no I/O.
  content/          Every prompt, term, trivia question and host line (+ validation tests)
  brand/            Palette, logo font and the logo/favicon generator
docs/
  design/           What the game is and why
  research/         The research behind it
  deploying.md      Going live (Cloudflare + Vercel + DNS)
tools/              Dev utilities (screenshots)
```

## Checks

```bash
npm test           # engine + content tests (full simulated games for every mode)
npm run typecheck  # every package
npm run e2e        # real browsers: a stage + three phones play every game end to end
```

## Brand assets

Logos, favicons and the social card are generated from `packages/brand` and committed to `apps/web`. Regenerate with `npm run brand`.

## Fonts

- **Dogbangy**: the logo (outlined into SVG paths) and big display moments. Free for personal and commercial use: see `packages/brand/fonts/Dogbangy-LICENSE.txt`.
- **Inter**: all UI and body text (SIL Open Font License).
