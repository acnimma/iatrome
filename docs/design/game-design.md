# iatrome game design

> The party game that speaks fluent medicine. Punches at medicine, never at patients.

Research behind these decisions: `docs/research/reports/`.

## Pillars

1. **Time to laughter ≈ zero.** One-line how-to on each intro card; the first prompt arrives within seconds of Start.
2. **Nobody feels left out.** **Normal mode** (the default) uses only `universal` content: anyone gets it, grandparents included. **Pro mode** is mostly `clinical` content (rounds, charting, eponyms, specialty in-jokes) for people who work or train in healthcare.
3. **Anonymity flattens the hierarchy.** Authors are hidden until votes lock; the server never sends authorship early.
4. **Never dead air.** Every phase ends early when all inputs are in. Beep narrates every beat.
5. **Zoom-bomb proof by default.** 6-letter codes, optional password, kick + device ban, lock, one-tap hide.
6. **Feels like a toy, looks grown-up.** Round, glossy, springy: thin ink outlines on warm white.

## Surfaces

| Surface | Route | Purpose |
|---|---|---|
| Home | `/` | Enter a room code, or go host. |
| Host setup | `/host` | Pick a game, optional password, options → creates a room. |
| Stage | `/host/CODE` | The show. Only the browser that created the room can run it. Host controls live in a tucked-away dock. |
| Controller | `/play/CODE` (short link `/CODE`) | Each phone: write, draw, vote, guess, react. Late joiners are dealt into the next game (or straight onto a team in Didactics Mode). |

## Beep

The host is Beep, a pager with a face. Event-keyed line pools (13+ per event) rarely repeat in a session. Optional **read aloud** speaks prompts and answers on the stage: great on Zoom.

## Games

### Grand Rounds (3–8, ~15 min)

| Round | Format | Points |
|---|---|---|
| 1 · Quips | Each player answers 2 prompts; every prompt goes to exactly 2 players (ring). About 60 seconds, or until everyone has submitted. | ×1 |
| 2 · Quips | Same ring, new prompts. | ×2 |
| 3 · The Finale | One open-ended quip that everyone answers (plus Beep); everyone votes, three votes each, never for their own. | ×3 |

**Inside jokes** (always on): ~40% of prompts name a player in the room, like “Why is Sam in the ER at 3 a.m.?”, never one of the two people answering it.

Scoring per matchup: a 1,000-point pool split by vote share, +100 to the winner, or **+250 for a CONSENSUS** (every voter, 2+). **DUPLICATE ORDER**: identical answers both score 0. No answer or host-hidden → the other side takes everything. **Curbside consult**: a stuck player’s ready-made answer, half points. Drafts autosave, so an answer still counts if the timer runs out.

### Sketch (3–10)

The drawer picks one of three terms (easy/medium/hard) and draws live: strokes stream to every phone and the stage. Guessers race: 500 → 100 points by speed; the artist earns 75 per correct guess. Letter hints unlock at 45% and 70% of the time. “So close!” for near misses.

### Didactics Mode (2–40, ~12 min)

Trivia for big groups, built for a family party. By default players are split into random teams (at least two, about five a team; teams can rename themselves). A **Teams** setting turns that off, and everyone plays for themselves. Players get 30 seconds to answer (45 with More time). Streaks (right again and again) and the fastest right answer earn bonus points. Everyone answers each question on their phone; a team scores by the share of its members who got it right (1,000 × share), so small teams aren’t punished. Standings every three questions; the last three are a double-points lightning round. Late arrivals join the smallest team mid-game. Team podium plus an MVP.

### The secret tie-breaker

Not a game anyone picks. When any game ends with players level for first (and someone scored), only the tied players get a sudden-death trivia question on their phones; the fastest right answer wins and takes first, the other leaders drop to second. Nobody right means another question, up to five, after which the tie stands.

### Pick Your Poison (3–20)

Pick a side, then predict the majority (+100 if right, +50 each on a tie). One of the minority gets 20 s to defend their choice on the big screen (+50).

## Room safety

- Codes: 6 letters from a 24-letter alphabet → 191M combinations, generated server-side.
- Per-IP limits on room creation and connections; password lockout after repeated failures.
- Optional password, lock, kick, device ban, hide code on stage, host can hide any answer.
- No word filter: it’s the group’s game and the group’s sense of humour. The host can still hide any answer from the big screen with one tap.

## Host options

Deliberately tiny: pick a game, pick **Normal** or **Pro**, and optionally **More time** (×1.5 timers for video calls or slower typers).

## Content rules

Original writing only; punch up at medicine, never at patients; generic drug names; no real hospitals or living people; every trivia answer has a source. `packages/content` tests enforce the structural rules.
