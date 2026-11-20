# iatrome!

**The party game that speaks fluent medicine.** A free, phone-friendly multiplayer party game for med, nursing, PA and dental students and clinicians: quips, doodles, survival trivia and would-you-rathers. It punches at medicine, never at patients.

## Repo layout

```
apps/
  web/              Next.js site + game client (deployed on Vercel)
packages/
  brand/            Palette, font and the logo/favicon generator
docs/
  research/         Design research that informs the game
tools/              Dev utilities (e.g. screenshot checks)
```

## Getting started

```bash
nvm use            # Node 22+
npm install
npm run dev        # http://localhost:3000
```

### Brand assets

All logos, favicons and the social card are generated from `packages/brand` (the Super Nugget font + palette) and committed to `apps/web`. To regenerate them:

```bash
npm run brand
```

## Deploying

The web app deploys to Vercel. In the Vercel project settings, set **Root Directory** to `apps/web`.

## Fonts

- **Super Nugget**: logo only, outlined into SVG paths (free for personal and commercial use; see `packages/brand/fonts/SuperNugget-LICENSE.txt`).
- **Inter**: all UI and body text (SIL Open Font License).
