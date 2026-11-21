# Audit of existing iatrome would-you-rather dilemmas

All sources are local files under /Users/acnimma/Code/iatrome. Classifications are my own editorial judgment, not measured pick rates. No pick-rate data exists in the repo. Primary category only; secondary flags are listed separately.

## 1. Code and test constraints for a rewrite

### Takeaway
Rewrites are low-risk: no code or test references any specific dilemma id or count above the minimums, ids only need to be unique, and the only text rules are max 80 chars per side, no "would you rather" prefix, no em dashes, and no duplicate a/b text. Pro-pack minimum (55 clinical) and Normal minimum (100 universal) are the binding counts.

### Cited Findings
- Type: `Dilemma { id: string; a: string; b: string; breadth: Breadth }`, where `Breadth = 'universal' | 'clinical'` — packages/content/src/types.ts lines 14 and 64-69
- Files: `dilemmas` (Normal, 135 entries, all `breadth: 'universal'`) in packages/content/src/packs/dilemmas.ts; `dilemmasPro` (88 entries, all `breadth: 'clinical'`) in packages/content/src/packs/dilemmas-pro.ts. Each entry is one line: `{ id: 'wyr-NNN', a: '...', b: '...', breadth: 'universal' },`. Strings are single-quoted TS with curly apostrophes (’) and curly quotes (“ ”) used inside. packages/content/src/index.ts line 30 exports `dilemmas = [...dilemmasNormal, ...dilemmasPro]`; the game imports only the merged `dilemmas`.
- Id scheme: Normal `wyr-NNN` (3 digits; used numbers are sparse between 002 and 260, with gaps), Pro `wyr-pNNN` (p001 to p060) plus 28 Normal-numbered ids "moved from Normal" into the Pro file (wyr-001, 007, 008, 016, 018, 025, 026, 028, 029, 033, 039, 040, 042, 054, 055, 059, 063, 089, 091, 092, 094, 102, 108, 111, 114, 124, 126, 127). Only constraint is global uniqueness across the merged array.
- Tests in packages/content/src/content.test.ts:
  - every pack: ids unique, and a/b text (id and breadth stripped, lowercased, JSON-stringified) unique, so a pair is a duplicate only if both sides match exactly (lines 24-33)
  - minimum counts: `dilemmas: [100, 55]` means at least 100 `universal` and at least 55 `clinical` entries (lines 35-54)
  - no em dashes anywhere in the packs JSON (lines 56+)
  - "Pick Your Poison" test (lines 179-188): total length at least 100; for every entry `a` must not start with "would you rather" (case-insensitive); `a.length <= 80` and `b.length <= 80`. Note: it only checks `a` for the prefix, but both sides should obey it.
- Current stats: longest side is 68 chars (wyr-p016), average side is about 47-48 chars, so there is slack under the 80 cap. 18 entries have a side at 60+ chars.
- Game use (packages/game/src/games/poison.ts): `ctx.draw(dilemmas, PO.rounds)` at line 102, with `PO.rounds = 8` (packages/game/src/constants.ts line 138). `a` and `b` are shown verbatim as the two options; the view sends `d.a` and `d.b` only (lines 199-215). No length truncation or text manipulation in game code. Last (8th) dilemma is "final", worth triple (`finalFactor: 3`).
- Display (apps/web/src/games/poison): Stage renders `<h2>Would you rather…</h2>` then each side in a `.option` paragraph (PoisonStage.tsx lines 64, 80), font clamp(1.5rem, 2.7vw, 2.3rem). Phone shows prompt "Would you rather…" and also reads as a sentence, `{a}. Or. {b}.` (PoisonController.tsx lines 46-47), and has a Split bar that prints both strings. Consequence: entries must be lowercase-initial fragments that complete "Would you rather…", must not end in punctuation (the controller appends the period; wyr-081 and wyr-033 end in "p.m."/"a.m." which works), and should read cleanly spoken as "A. Or. B."
- Selection (packages/game/src/room.ts lines 392-413): Normal mode draws only `universal`, 8 per game. Pro mode draws `round(8 * 0.7)` = 6 `clinical` plus 2 `universal` (PRO_SHARE = 0.7 at line 329), shuffled. Items are tracked in `room.usedContent` per room; when fewer fresh items remain than needed in a bucket, that bucket recycles. So a pool of 100 Normal supports about 12 games before repeats in one room; 55 Pro supports about 9 games' clinical draws (6 per game).
- Ids referenced elsewhere: grep for `wyr-` and `dilemma` across ts/tsx/json/md (excluding node_modules) found no reference to any specific dilemma id outside the two pack files. The only other mentions are generic (poison.ts, PoisonStage/Controller "Final dilemma", host-lines.ts line 315 joke, constants, and research docs). poison.test.ts has no dilemma ids. So ids may be changed or renumbered freely as long as they are unique; `usedContent` is runtime room state and unknown ids just count as fresh.
- Agent-voice rules from the brief: deadpan, sarcastic, never corny, no em dashes (enforced by test), per project memory.

### Inferences
- Safe rewrite plan: keep the type and file split, keep `wyr-NNN` / `wyr-pNNN` ids (renumbering is allowed but gains nothing), target at least 100 universal and 55 clinical after cuts (aim 120+ and 70+ for headroom), keep sides at most about 60 chars, lowercase, no terminal punctuation.
- The 28 "moved" Pro entries with Normal-style ids are an inconsistency; a rewrite can fold them into `wyr-pNNN`.
- Dedup test is weak (only exact a+b match), so near-duplicates (e.g. same template with swapped nouns) will pass tests and must be caught by hand.
- Mixed-breadth caveat: `clinical` items are only drawn in Pro. In Pro, 2 of 8 rounds are universal, so universal quality matters for both modes.

### Gaps
- No pick-rate telemetry exists, so "lopsided" is my judgment, not measured.
- I did not check whether Pro mode is also gated by anything beyond `room.settings.mode`.

## 2. Classification of all 223 existing dilemmas

### Takeaway
About two thirds are playable (91 of 135 Normal, 65 of 88 Pro), but only about 20 are strong. The weak third fail mainly by being lopsided or by having no cost on either side; a smaller cluster is vague "be an organ" nonsense. Only 2 Normal entries are properly jargon-heavy, since most Normal copy is plain; Pro jargon is acceptable. Counts below are by primary category.

### Cited Findings (counts and ids)

Counts (primary category):

| Category | Normal (135) | Pro (88) | Total |
|---|---|---|---|
| Good (playable) | 91 | 65 | 156 |
| Lopsided / no-brainer / no cost | 24 | 12 | 36 |
| Unclear / confusing / vague | 12 | 6 | 18 |
| Non-parallel | 6 | 5 | 11 |
| Jargon-heavy in Normal | 2 | n/a (expected in Pro) | 2 |
| Total | 135 | 88 | 223 |

Too long is not a primary category because nothing is near the 80 limit. Secondary flag: sides at 58+ chars that read clumsily when spoken as "A. Or. B.": wyr-065, 162, 202, 246, 248, 257, 258, p002, p003, p010, p011, p012, p016 (68), p018, p020, p022, p023, p024, p027, p029, p031, p041, p043, p048, p054. Length imbalance of 20+ chars between sides (a tell for non-parallel): wyr-067, 132, 149, 225, 235, 094, 111, p002, p010, p022, p023, p024, p027, p031, p040, p052.

Lopsided / no-brainer / no cost on either side (Normal, 24):
- wyr-022 text like a close friend vs email like a law firm: friend wins
- wyr-052 polite medieval bloodletting vs Victorian mercury dosing: mercury is just worse
- wyr-073 monthly painless dentist vs one every 5 years that is "an event": frequent painless wins
- wyr-084 "burp every time you tell a lie" vs "hiccup every time someone lies to you": B is a free lie detector
- wyr-129 vet treats you like a golden retriever vs doctor treats you like a tax audit: A is delightful
- wyr-136 grandma's mystery remedy every sneeze vs wear a scarf to bed: scarf is trivial
- wyr-138 everyone signs your cast vs cast plays music: both are perks
- wyr-143 appointments exactly on time vs empty pharmacy line: two free wishes
- wyr-159 "never catch a cold, but sneeze once every hour" vs "catch every cold, never sneeze": A is a huge win
- wyr-163 know the date of every cold vs never know but each lasts half as long: B dominates
- wyr-172 1950 doctor with today's medicine vs today's doctor with 1950's medicine: modern medicine wins; confusingly symmetrical wording
- wyr-174 visit from every coworker vs a fruit basket the size of a car: neither hurts
- wyr-175 prescriptions by drone, "sometimes at the neighbour's" vs by an extremely slow horse: drone wins (also British spelling)
- wyr-177 free parking forever vs never sit in a waiting room again: B dominates
- wyr-181 bed folds you in half at random vs bed creaks on every breath: unsafe vs annoying
- wyr-209 exam paper that crinkles like chips vs no paper at all: A is trivial
- wyr-222 TV stuck on one cooking show vs fish tank and one very tired fish: B is charming
- wyr-229 every pharmacy runs out of your medicine vs in stock behind a two-hour line: never getting it is worse
- wyr-235 drink colonoscopy prep from a crystal wine glass vs half as much but warm: glass changes nothing
- wyr-248 remember vitamins but horse-sized vs always forget and feel slightly guilty: B is nothing
- wyr-249 stitches in your initials vs in a tiny smiley: no cost either side
- wyr-252 doctor's note for anything vs never need one because your boss never asks: B is strictly freer
- wyr-258 mole checked with magnifying glass vs glanced at from the doorway: A obviously
- wyr-259 wake from anesthesia saying something embarrassing vs singing loudly on key: B is fine

Lopsided / no-cost (Pro, 12):
- wyr-p004 "Q4 call with a great team" vs "Q6 call alone with a broken vending machine": stacked penalties on B
- wyr-p008 last-ranked program near a beach vs first choice in a one-restaurant town: B is the dream
- wyr-p014 restock the code cart vs audit everyone's code cart checks: dull and no tension
- wyr-p023 admit every patient the ED calls about vs argue about every admission and lose: A is just the job
- wyr-p028 interpret 100 ABGs vs draw one ABG on a moving stretcher: A is easy
- wyr-p030 learn every eponym vs rename every eponym after yourself: B is a power fantasy
- wyr-p039 train under a 19th-century surgeon who never washes vs a modern attending who never stops rounding: modern wins
- wyr-p047 perfect sign-out nobody reads vs messy one that saves the night: B wins
- wyr-p056 rotate through every specialty for a year vs pick by drawing from a hat: A obviously
- wyr-p057 know every renal dose vs never be paged about renal dosing: B
- wyr-059 stethoscope that picks up radio vs penlight that projects movies: two free gadgets
- wyr-029 unlimited decaf vs "unlimited naps, but only inside a running MRI": B is physically absurd, not a dilemma

Unclear / confusing / vague (Normal, 12):
- wyr-070 "be the liver: overworked, but you grow back" vs "be a kidney: detail work, but you have a spare": needs biology, "be an organ" has no stakes. Worst offender.
- wyr-067 "have your organs file formal complaints in writing" vs "have your cells form a union": nonsense whimsy, 22-char imbalance
- wyr-066 "be able to talk to bacteria" vs "talk to your own organs": both are free powers
- wyr-147 "be the tissue box in a house with the flu" vs "be the toothbrush of someone who eats garlic every day": be-an-object, no stakes
- wyr-176 "spend one day as your own stomach at a holiday dinner" vs "your own nose in allergy season": same family
- wyr-085 "be a dentist for sharks" vs "be a chiropractor for giraffes": pure absurd; no real preference
- wyr-051 "wisdom teeth that actually make you wiser" vs "an appendix that actually does something": both free upgrades, no cost
- wyr-064 coffee that tastes faintly of hand sanitizer vs sanitizer that smells exactly like coffee: B costs nothing
- wyr-068 "the friend who always has a bandage" vs "who always knows where the bathroom is": both pure positives
- wyr-232 "pick your bathroom habits from a chart of pictures" vs "describe them to the doctor in your own words, out loud": mis-worded (you do not pick habits); intent is "point at a chart" vs "say it aloud"
- wyr-243 "leave with a prescription you can’t pronounce" vs "a diagnosis you can’t spell": neither hurts
- wyr-246 "a dentist who only asks questions when your mouth is free" vs "one who’s twice as fast but chats the whole time": A is a dream dentist; muddled

Unclear (Pro, 6):
- wyr-p024 "get consulted on everything by every service" vs "need a consult on everything while every consultant is on vacation": unreadable at speed
- wyr-p034 "med cabinet that requires a witness for everything" vs "opens every drawer at once": unclear what hurts
- wyr-p035 "hourly rounding with a mandatory rhyming script" vs "while carrying the entire supply room": absurd vs absurd
- wyr-p038 "be Lister in a room full of skeptics" vs "be Semmelweis with a really good PR team": history trivia and B is a win
- wyr-016 "autocorrect turns every word into Latin anatomy" vs "every song you hear is about the Krebs cycle": random
- wyr-033 "woken by a rooster at 4:00 a.m." vs "woken by a page at 4:07 a.m.": no meaningful difference

Non-parallel (Normal, 6):
- wyr-006 "see everything your doctor types about you, live" vs "never have to watch your doctor type again": B is the absence of A
- wyr-021 "heartbeat audible to everyone in the room" vs "digestion narrated by a sports commentator": mild fact vs a joke
- wyr-038 "need to sneeze and not be able to for an hour" vs "hiccups through an entire job interview": one has no context, other has stakes
- wyr-060 "instantly read any doctor’s handwriting" vs "instantly fix any printer you touch": unrelated domains
- wyr-169 "have your dentist live next door" vs "have your doctor be your ex": different roles and unclear which is bad
- wyr-242 "sit next to a crying baby on a long flight" vs "sit next to a man coughing in the waiting room": different settings

Non-parallel (Pro, 5):
- wyr-p002 write every note from scratch vs inherit a note copied forward since 2014 and own every word: 27-char imbalance, one side mundane
- wyr-p007 hold a retractor 9 hours vs hold the pager for every surgery resident: unclear equivalence
- wyr-p010 one prior auth a day vs "one peer-to-peer call a day with a retired ophthalmologist": joke tacked on to B
- wyr-p015 retake Step 1 vs retake the NCLEX "and every question asks what to do FIRST": different professions
- wyr-001 "write every note in Comic Sans forever" vs "pager goes off every time you sit down to eat": trivial vs real

Jargon-heavy in Normal (2): 
- wyr-097 "convince 1840s doctors to wash their hands" vs "convince 1600s royals that bathing is safe": needs history knowledge
- wyr-123 "go back in time and tell Galen he’s wrong" vs "tell 1950s doctors to stop smoking": Galen unknown to lay players; B is a sure good deed
Borderline Normal items I left as Good but a rewrite should check: wyr-112 (tongue depressor), wyr-003 and 149 and 052 (history jokes), wyr-224 (pupil dilation).

Good (playable), Normal (91): wyr-002, 003, 012, 023, 043, 045, 046, 061, 062, 065, 077, 080, 081, 090, 093, 099, 109, 112, 120, 131, 132, 133, 135, 137, 145, 146, 148, 149, 151, 152, 155, 156, 157, 158, 161, 162, 164, 165, 168, 170, 171, 178, 179, 182, 201, 202, 203, 204, 205, 206, 207, 208, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 223, 224, 225, 226, 227, 228, 230, 231, 233, 234, 236, 237, 238, 239, 240, 241, 244, 245, 247, 250, 251, 253, 254, 255, 256, 257, 260.

Good, Pro (65): wyr-p001, p003, p005, p006, p009, p011, p012, p013, p016, p017, p018, p019, p020, p021, p022, p025, p026, p027, p029, p031, p032, p033, p036, p037, p040, p041, p042, p043, p044, p045, p046, p048, p049, p050, p051, p052, p053, p054, p055, p058, p059, p060, plus the moved ones wyr-007, 008, 018, 025, 026, 028, 039, 040, 042, 054, 055, 063, 089, 091, 092, 094, 102, 108, 111, 114, 124, 126, 127. (Quick-sample count should be verified with a script before relying on exact totals; category totals above come from my hand tally, and the 223 entry count itself was verified by script: 135 plus 88.)

### Inferences
- "Good" is a low bar: it means two-sided and readable. Many are mild, mundane annoyances with no comedic spike, so the true share of "great" is around 20 to 25 entries.
- Normal copy is already mostly jargon-free; the jargon problem is overstated. The real problem is no tension and vagueness.

### Gaps
- Pro "good" total is hand-tallied; recount before quoting.

## 3. Recurring patterns in the weak ones

### Takeaway
The weak entries are overwhelmingly "one side is a free perk" or "one side is a strictly worse joke", plus a family of vague be-an-organ and talk-to-a-body-part whimsy.

### Cited Findings (patterns with examples)
- Free perk vs free perk, no cost: wyr-051, 060, 066, 138, 143, 174, 249, p059. Players cannot disagree, so the prediction round is trivial.
- Joke side vs mundane side (one side carries the whole entry): wyr-129, 222, 259, p010, p004, p008.
- Dominated option (one side is strictly better or worse): wyr-159, 163, 177, 252, 258, p047, p056, p057.
- "Be a body part or object" whimsy with no stakes: wyr-070, 147, 176, 067, 066. This is the "be the liver" family. There is no preference to defend, so the Against Medical Advice defence round has nothing to argue.
- Absurd career or world logic: wyr-085 (dentist for sharks), wyr-p035, wyr-016.
- History-lesson entries that need trivia and usually give the player a win: wyr-097, 123, p038, p039, plus the barber-surgeon family (wyr-003, 052, 149).
- Pro entries pasted from Normal templates: p006 reuses wyr-240's "itchy nose vs needing to pee" idea, p020 reuses wyr-137's "sings vs nature documentary" bit, p040 and wyr-182 both swap "voice" for a format; 062, 151, 234 all use "cold hands".
- Repeated premises: sneeze/hiccup/cold (wyr-038, 080, 109, 131, 132, 133, 145, 159, 161, 163), dentist (062, 073, 137, 212, 226, 246, 253), "doctor who ..." (more than 25). The pool feels samey within a single game.
- Mixed-spelling bug: British spellings "apologising" (wyr-168), "neighbour" (175), "recognises" (257), "apologise" (102) in an otherwise US-style pool. Not caught by tests.
- Muddled wording at speed: wyr-172, p024, p036, 232, 246 are hard to parse spoken aloud.
- Missing ending issue: none. All fragments are lowercase-initial; none start with a capital.

### Inferences
- Because Poison rewards predicting the majority and then defending a pick out loud, the most valuable entries are those where each side has a specific, defensible reason. Entries with a dominated side break both mechanics.

### Gaps
- No pick-rate data to confirm which patterns split worst.

## 4. Strong entries to keep as models

### Takeaway
Best models are symmetrical, specific, relatable annoyances with a real tradeoff, in plain words.

### Cited Findings
Normal models (14):
- wyr-012 rude doctor who is always right vs lovely doctor who is right about half the time (classic accuracy vs bedside manner)
- wyr-206 doctor 90 minutes late but gives you an hour vs on time and gives you seven minutes (specific numbers, real tradeoff)
- wyr-109 one truly awful cold day vs three mild weeks (duration vs intensity)
- wyr-165 rip bandage in a second of agony vs peel slowly over an itchy hour
- wyr-156 amazing-tasting medicine that works twice as slow vs awful but twice as fast
- wyr-203 one enormous surprise medical bill a year vs a small one every month forever
- wyr-211 your mom reads your entire chart vs your boss reads one random page
- wyr-213 end up in the ER next to your boss vs next to your ex
- wyr-228 massage that hurts and helps vs feels great and does nothing
- wyr-234 warm hands and cold personality vs cold hands and warm personality (perfect mirror)
- wyr-233 doctor says "hmm" every exam vs "interesting" every exam (tiny, deadpan, tense)
- wyr-201 test results at 2 a.m. with no explanation vs wait two weeks for a doctor to explain
- wyr-208 blood drawn first try but it really hurts vs painlessly on the fourth
- wyr-131 sneeze every time you laugh vs laugh every time you sneeze (parallel, absurd)
Also strong: wyr-045, 090, 207, 231, 205, 245, 202.

Pro models (5): wyr-p005 (sign-out: 40 questions vs "they’re fine"), p009 (pharmacy calls back on every order vs quietly changes every order), p011 (surgeon waiting on anesthesia vs the reverse), p051 (PT vs the post-op patient), p058 (consultants answer instantly but disagree vs agree but take six hours). Also p027 and p052 as mirror-role entries.

What they share: both sides are plain, concrete, 35-60 chars, a single clause each, a real cost on each side, and the cost types are different (time vs pain, accuracy vs warmth, scale vs frequency).

### Inferences
- Best templates: (1) intensity vs duration/frequency, (2) competence vs warmth, (3) mirror roles (be the X vs be the Y), (4) public embarrassment audience swap (mom vs boss, boss vs ex), (5) information vs delay.

### Gaps
- Selection is my taste, not measured.

## 5. Exact constraints summary (for the rewriter)

### Takeaway
Follow this checklist and tests will pass.

### Cited Findings
- File format: one TS line per entry, `{ id: 'wyr-NNN', a: '...', b: '...', breadth: 'universal' },` in packages/content/src/packs/dilemmas.ts (Normal) or `breadth: 'clinical'` in packages/content/src/packs/dilemmas-pro.ts (`dilemmasPro`). Keep the header comments. Escape inner straight quotes or use curly ’ “ ” as existing entries do.
- Breadth values allowed: exactly `'universal'` or `'clinical'`. Everything in the Normal file is universal, in the Pro file clinical.
- Ids: unique strings across both files (test). Any scheme works. No external references to ids.
- Text: `a` and `b` each at most 80 chars (test; aim for 60 or less); must not start with "would you rather" (test); lowercase-initial fragment completing "Would you rather…"; no terminal period (UI appends one in the phone read-aloud); no em dashes (test, project voice rule); no exact duplicate a+b pair (test).
- Counts: at least 100 total (test), at least 100 `universal` and at least 55 `clinical` (test). Recommended headroom: 120+ universal, 70+ clinical, because a room draws 8 per game (Pro: 6 clinical + 2 universal) and recycles when fresh items run out.
- Ids may change freely; nothing in the repo (code, tests, docs) refers to a specific dilemma id.
- Pro vs Normal split: Normal = relatable to any patient, visitor or person with a body (header comment in dilemmas.ts: "Both sides should hurt about equally"); staff-only material belongs in dilemmas-pro.ts.

### Inferences
- If the rewrite removes ~50 weak entries from Normal without replacing them, Normal drops to 85 and fails the 100 minimum. Replace at least one for one.

### Gaps
- None for constraints.
