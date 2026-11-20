# iatrome game design

> The party game that speaks fluent medicine. Punches at medicine, never at patients.

Research behind these decisions: `docs/research/reports/`.

## Pillars

1. **Time to laughter ≈ zero.** One-line how-to on each intro card; the first prompt arrives within seconds of Start.
2. **Everyone in healthcare gets every joke.** Prompts target the shared pain of training and the system — pagers, charting, rounds, boards, coffee, history’s worst cures — and default to the `universal` tier any first-year gets.
3. **Anonymity flattens the hierarchy.** Authors are hidden until votes lock; the server never sends authorship early.
4. **Never dead air.** Every phase ends early when all inputs are in. Beep narrates every beat.
5. **Zoom-bomb proof by default.** 6-letter codes, optional password, kick + device ban, lock, filter on, one-tap hide.
6. **Feels like a toy, looks grown-up.** Round, glossy, springy — thin ink outlines on warm white.

## Surfaces

| Surface | Route | Purpose |
|---|---|---|
| Home | `/` | Enter a room code, or go host. |
| Host setup | `/host` | Pick a game, optional password, options → creates a room. |
| Stage | `/host/CODE` | The show. Only the browser that created the room can run it. Host controls live in a tucked-away dock. |
| Controller | `/play/CODE` (short link `/CODE`) | Each phone: write, draw, vote, guess, react. Late joiners are audience. |

## Beep

The host is Beep, a pager with a face. Event-keyed line pools (13+ per event) rarely repeat in a session. Optional **read aloud** speaks prompts and answers on the stage — great on Zoom.

## Games

### Grand Rounds (3–8, ~15 min)

| Round | Format | Points |
|---|---|---|
| 1 · Quips | Each player answers 2 prompts; every prompt goes to exactly 2 players (ring). | ×1 |
| 2 · Quips & Doodles | Same ring, alternating quips and drawings. Doodles replay stroke by stroke. | ×2 |
| 3 · The Differential | Pairs list three answers, revealed line by line. Odd player out faces Beep. | ×3 |

**Inside jokes** (on by default): ~40% of prompts name a player in the room — “Why is Sam in the ER at 3 a.m.?” — never one of the two people answering it.

Scoring per matchup: a 1,000-point pool split by vote share (audience capped at ⅓), +100 to the winner, or **+250 for a CONSENSUS** (every player voter, 2+). **DUPLICATE ORDER**: identical answers both score 0. No answer or host-hidden → the other side takes everything. **Curbside consult**: a stuck player’s ready-made answer, half points. Drafts autosave, so an answer still counts if the timer runs out.

### Sketch (3–10)

The drawer picks one of three terms (easy/medium/hard) and draws live — strokes stream to every phone and the stage. Guessers race: 500 → 100 points by speed; the artist earns 75 per correct guess. Letter hints unlock at 45% and 70% of the time. “So close!” for near misses.

### Survive the Shift (2–20)

Multiple choice, easiest first. Two coffees each; a wrong or missing answer costs one; zero = clocked out (keep playing as a ghost for half points). If every survivor misses, nobody loses a coffee. Last one on shift wins. Every reveal shows a sourced “chart note”.

### Pick Your Poison (3–20)

Pick a side, then predict the majority (+100 if right, +50 each on a tie). One of the minority gets 20 s to defend their choice on the big screen (+50).

## Room safety

- Codes: 6 letters from a 24-letter alphabet → 191M combinations, generated server-side.
- Per-IP limits on room creation and connections; password lockout after repeated failures.
- Optional password, lock, kick, device ban, hide code on stage, host can hide any answer.
- Filter on answers, names, guesses and defences. *Standard* blocks slurs and hate; *Clean* also blocks swearing. Anatomy is always allowed — this is a medical game. Blocked text is rejected with a nudge, never silently masked.

## Content rules

Original writing only; punch up at medicine, never at patients; generic drug names; no real hospitals or living people; every trivia answer has a source. `packages/content` tests enforce the structural rules.
