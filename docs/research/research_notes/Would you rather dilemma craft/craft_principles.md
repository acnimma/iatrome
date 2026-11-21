# Craft of writing "would you rather" dilemmas for a phone party game

Scope note: published, citable craft material on this niche is thin. I found no designer write-up on vetting WYR balance, no r/wouldyourather analysis, and no usable vote-split dataset (the one candidate paper, a UW "WYR" PDF, came back unreadable). Most prescriptive rules below are therefore labeled Inferences (craft judgment, not evidence). Treat them as a starting checklist to playtest, not as findings.

## 1. Structural rules: what makes options parseable in under 3 seconds on a phone

### Takeaway
No source gives parse-time rules for WYR specifically. Project notes and Jackbox writers support "one specific detail, not a pile" and "the writer must be able to answer their own prompt"; everything else (parallel grammar, word counts) is inference from those and from the phone-screen constraint.

### Cited Findings
- Jackbox writer advice for open prompts: add one specific, absurd constraint; "an erotic movie for elephants" works, a 1940s film for elephants at the St. Louis Zoo is "way too much info to process" — [Jackbox: How to write a good Quiplash prompt](https://www.jackboxgames.com/how-to-write-a-good-quiplash-prompt), via project note `reports/Party humor design research.md`. This is for fill-in prompts, but the same cognitive-load logic applies to WYR sides.
- Same source: "If you can't think of a good answer to your own prompt, then it's probably not going to be very good." Analog for WYR: if the writer cannot instantly argue both sides, the card fails — same project note.
- Public WYR guides say specificity makes a dilemma feel real (concrete numbers and trade-offs beat vague "rich or famous") — [Science of People](https://www.scienceofpeople.com/would-you-rather-questions/) (search summary only; page not opened). Tension to note: specific numbers help realism but each extra clause costs parse time.
- Project note on Jackbox polish: prompts should "supply a vivid, ordinary scene and leave the joke slot empty" — [reports/Jackbox quality game mode polish.md](../../reports/Jackbox%20quality%20game%20mode%20polish.md).

### Inferences
Proposed parse rules (untested, my synthesis):
1. One idea per side: one noun phrase or one verb phrase, at most one modifier that does real work. Test: can you say it in one breath?
2. Parallel grammar: start both sides with the same verb form ("Lose...", "Always..."), so the eye only has to diff the ending. Mixed forms ("Be rich" vs "Having to...") force a re-parse.
3. Length: aim 6 to 12 words per side, hard cap 14. Put the cost last, because the cost is what the reader is hunting for.
4. No setup line. The two sides are the whole card. If a side needs context, the context is the side's modifier ("Every call is on speaker").
5. Avoid double-barreled sides ("Be rich and live in the cold"): the voter weighs a bundle, and a bundle invites "I'd take the first half" confusion. Exception: a deliberate benefit-plus-cost pairing inside one side is the engine of approach-avoidance (section 3), but keep it to exactly one benefit and one cost.
6. Avoid negation stacks and "not have to" phrasing; state the thing that happens.
7. Phone check: both sides visible without scrolling, equal visual weight, no side more than one line longer than the other (length asymmetry reads as detail asymmetry, which biases toward the more vivid side).

## 2. What makes dilemmas lopsided, and how to fix them

### Takeaway
Public guides agree balance is the core rule: roughly equal pull, each side with real offsetting advantages and drawbacks, and a "clear winner kills the debate". Failure modes and fixes are mostly craft inference; the diagnostic tests below are mine.

### Cited Findings
- Guides say both options should be "comparable in weight", with each carrying clear advantages and disadvantages that roughly offset — [Science of People](https://www.scienceofpeople.com/would-you-rather-questions/) and other WYR guide pages, per search summary (pages not individually opened).
- Example of a no-brainer from those guides: eating a bug vs $1,000, because everyone takes the money; pairing the bug with a real sacrifice creates deliberation — same search summary.
- Dilemmas can pit two good, two bad, or one good and one bad option — [Wikipedia: Would you rather](https://wikipedia.com/wiki/Would_you_rather) (via search summary).
- Quant: the only vote-split figures I found are incidental. BuzzFeed relationship poll: 53% would rather never find out a partner cheated vs 47% wanting every detail — [BuzzFeed poll](https://www.buzzfeed.com/benhenry/from-disney-to-dick-and-everything-between) (search snippet only). The Either/You Rather site reportedly passed 115 million votes by January 2013 — [Know Your Meme](https://amp.knowyourmeme.com/memes/would-you-rather) (search snippet). Neither gives the distribution of splits across questions, so "how often are real WYR questions near 50/50" is unanswered.
- Split the Room (Jackbox Party Pack 5) scores players by how evenly the room splits on a player-written question, i.e. the commercial precedent that "near 50/50" is the target — [Jackbox: Split the Room](https://www.jackboxgames.com/split-the-room), search summary. I could not retrieve designer commentary on how they judge good splits.
- Loss aversion: Tversky and Kahneman estimated gains must be about 2x equal losses to feel balanced (coefficient about 2 to 2.25) — [JDM 2012](https://dlab.sauder.ubc.ca/sjdm/journal/11/11303a/jdm11303a.html); replication is mixed, with loss aversion weak for small stakes — same search. Practical use: a "lose X" side feels heavier than a "gain X" side of equal size.

### Inferences
Failure modes and fixes (craft judgment):
- Dominated option: one side is strictly worse. Fix: give the worse-looking side a hidden upside, or add a cost to the better side that is a different currency.
- Magnitude mismatch ($1M vs a stubbed toe): match on the same felt scale. Rule: both sides should cost within about one order of "how much I'd complain about it".
- Hidden free lunch: a side with a benefit and a trivially avoidable cost. Fix: make the cost unavoidable and recurring, or remove the benefit's escape hatch.
- Funny side vs plain side: the vivid joke wins on votes regardless of merit. Fix: make both sides equally concrete, or put the joke in the cost of the plain side.
- Loophole wording ("one hour a day" invites "I'd sleep through it"): name the constraint ("awake, in public, every day").
- Asymmetric loss framing: a loss side beats a gain side of equal size (loss aversion). Fix: frame both as losses (avoidance-avoidance) or both as gains.
- Tests to run on every card:
  - Swap test: swap the sides' order mentally; does the card still feel the same? Also swap who suffers. A card that flips verdict is position-biased.
  - "What would the 30% say?" Write one sentence the minority would say in earnest. If it takes more than 10 seconds or is forced, the card is lopsided. This also serves the minority-defends mechanic (section 4).
  - Cost-symmetry: list the currencies each side spends (money, time, shame, pain, relationships, self-image). If both spend the same single currency, balance depends on numbers (fragile); prefer different currencies.
  - Three-person gut check: three quick readers answer without discussion; anything 3-0 gets a rewrite, 2-1 ships, and hesitation over 5 seconds is a good sign.
  - Pre-game ship rule: playtest data later replaces these. Log the actual split per card and cull cards that land outside roughly 35/65 over 20+ votes (threshold is my suggestion, not sourced).

## 3. What makes a dilemma agonizing

### Takeaway
Psychology supports that avoidance-avoidance (two bad options) and mixed approach-avoidance conflicts are the slow, conflicted ones, but this is context-dependent and some conflict-effects have replicated poorly. Currency-mixing and certainty-vs-gamble are standard decision-science levers; moral-foundation conflicts are the best source of values splits.

### Cited Findings
- Miller/Lewin conflict taxonomy: approach-approach (two desirable), avoidance-avoidance (two undesirable), approach-avoidance (one option with both good and bad features) — [Wikipedia: Approach-avoidance conflict](https://Www.Wikipedia.org/wiki/Approach-avoidance_conflict).
- Lewin: avoidance-avoidance conflicts are harder to resolve than approach-approach, and decisions take longer — same search ([decision time paper](https://typeset.io/pdf/decision-making-under-conflict-decision-time-as-a-measure-of-1ww4daxuau.pdf)). Contested: a Hebrew University study found avoidance-avoidance was harder only in a positive affective context, and the difference vanished in a negative context — [HUJI](https://cris.huji.ac.il/en/publications/the-relative-difficulty-of-resolving-motivational-conflicts-is-af/). Design read: a funny, light party mood is the positive context, so two-bad-options cards should work well here.
- Approach and avoidance motivation close to equal strength produce the most deflected, hesitant response trajectories — [neuro/computational work via search](https://pmc.ncbi.nlm.nih.gov/articles/PMC10023482). Supports the equal-pull rule.
- Tversky and Shafir (1992) argued conflict raises deferral and default choice; 40 direct and conceptual replications (n = 26,703) cast doubt on the effect — [Evangelidis, Levav, Simonson 2023](https://pubsonline.informs.org/doi/fpi/10.1287/mnsc.2022.4484). Do not lean on "more options means more paralysis"; WYR is forced choice anyway.
- Trolley data: in a 70,000-response multi-country study, average endorsement of sacrifice was 81% (Switch), 72% (Loop), 51% (Footbridge) — [Daily Nous summary](https://dailynous.com/?p=26753). Footbridge is the textbook near-50/50 values split. Haidt's binding foundations (loyalty, authority, purity) vs harm/fairness are the usual axis for such splits — [Graham et al. 2011 via search results](https://pmc.ncbi.nlm.nih.gov/articles/PMC4978433). I could not confirm the exact six-foundation mapping or the often-quoted 12% vs 90% figures.
- Project note: severe outcomes read better as distant/hypothetical, mild bodily mishaps better as close and personal; clinician "blame the patient" humor is punching down; "the system is the villain and the patient is never the target" — [Party humor design research](../../reports/Party%20humor%20design%20research.md) and [Jackbox quality polish](../../reports/Jackbox%20quality%20game%20mode%20polish.md).

### Inferences
Levers that create genuine splits (untested):
- Different currencies: pain vs shame, time vs money, self vs others, status vs comfort. Same-currency cards reduce to arithmetic.
- Recurring vs one-time cost: "one unforgettable disaster" vs "a mild annoyance forever". People split on time preference and on tolerance for dread.
- Certainty vs gamble: sure small loss vs 50% chance of big loss. Splits by risk temperament, which is a personality axis rather than a right-answer axis, so it defends well.
- Values conflicts: honesty vs kindness, loyalty vs fairness, autonomy vs safety. Splits by moral foundation, so the room divides along real personality lines.
- Identity: "who I am" costs (be disliked vs be fake) split strongly.
- For the medical theme: split on system-villain currencies (hold music, copays, being on call, awkward gowns), not on patient-targeting jokes.

## 4. How "pick, predict the room, minority defends" changes what makes a good dilemma

### Takeaway
The mechanic rewards defensibility and predictability over pure 50/50: a good card has two sides each with a sayable, funny justification, and its split should be guessable but not certain. Project notes already prescribe graded split prediction and a persistent minority marker for this game.

### Cited Findings
- Project note: Pick Your Poison pays a flat 100 for picking the majority side; recommended instead graded split prediction, a persistent minority marker, and majority betting on the defence — [reports/Jackbox quality game mode polish.md](../../reports/Jackbox%20quality%20game%20mode%20polish.md), lines 90 and 105.
- Same note: predict-the-room games score reading other people, keep the inactive side acting, and make being the odd one out a visible but sheddable stigma; cites Wavelength, Herd Mentality's Pink Cow, and Guesspionage — [Wavelength](https://en.wikipedia.org/wiki/Wavelength_(game)), [Guesspionage](https://jackboxgames.com/guesspionage).
- Split the Room rewards even splits, so a card that splits evenly is the explicit scoring goal there — [Jackbox: Split the Room](https://www.jackboxgames.com/split-the-room).
- Jackbox writers: test whether the writer can answer their own prompt — [Jackbox blog](https://www.jackboxgames.com/how-to-write-a-good-quiplash-prompt) (project note).

### Inferences
- Predictability band: a perfect 50/50 is impossible to predict, so graded prediction scoring is fair but low-signal. Cards that usually land 35/65 to 45/55 give prediction skill room to show. A 20/80 card is a fine "who is the odd one out" moment but the minority must have a funny defense or it is just shame.
- Defensibility test: the minority player must be able to say a one-sentence reason that makes the room laugh or nod. Add a "defender hook" to each side: a rationale people can reach for (principle, loophole they secretly love, absurd upside).
- Prefer cards where a loophole is a joke the defender can use rather than a crack that breaks the scoring.
- Social safety: avoid cards where a side is an identity or taste verdict about a person present (weight, sexuality, ability). The minority stigma should land on opinions about situations, not on bodies or groups.
- Avoid pure taste splits (pineapple pizza): predictable by demographics, short defenses, no moral texture. Values and risk-temperament splits generate better defenses.

## 5. Example before/after rewrites (all mine, for illustration; no em dashes, medical-flavored where it fits)

### Takeaway
Ten rewrites, each tagged by principle.

### Cited Findings
- None. These are original examples built on the principles above; no source claims these specific cards or their vote splits.

### Inferences
1. Dominated option
   - Before: Win $10,000, or get a mild paper cut.
   - After: Win $10,000 but every stranger knows how, or keep your quiet life and your rent stress.
   - Note: mixed currency (money+privacy) in place of obvious winner.
2. Magnitude mismatch
   - Before: Lose a kidney, or have to wait on hold for 3 minutes.
   - After: Spend a full workday on hold with insurance, or spend one hour naked in a waiting room.
   - Both are hours-scale indignities.
3. Hidden free lunch
   - Before: Get a free house but have to host dinner once.
   - After: Get a free house but your landlord is your ex, forever, or pay rent and own your doorbell.
   - Free-lunch cost now unavoidable.
4. Funny vs plain
   - Before: Fight a horse-sized duck, or do your taxes.
   - After: Fight a horse-sized duck once, or fill in your taxes and your coworker's every year.
   - The plain side gets a concrete grievance.
5. Loophole
   - Before: Sleep only 4 hours a night, or never sleep in.
   - After: Be awake at 4 a.m. every night, no naps, or sleep in but lose every weekend morning plans.
   - Name the constraint so "I'd just sleep through it" disappears.
6. Double-barreled
   - Before: Be smart and sad, or be dumb, happy, and rich.
   - After: Be brilliant and quietly miserable, or be average and delighted.
   - One state per side (the kottke "smart and sad" classic, [Kottke](https://kottke.org/17/12/would-you-rather-be-smart-and-sad-or-dumb-and-happy), is the same shape).
7. Parallel grammar
   - Before: Having to answer every email in rhyme, or be someone who always gets stuck behind slow walkers.
   - After: Always speak in rhyme at work, or always get stuck behind slow walkers.
   - Same verb frame, 7 words per side.
8. Setup removal
   - Before: Imagine you are at a party and your boss is there. Would you rather dance badly or sing badly?
   - After: Dance badly in front of your boss, or sing badly in front of your boss.
   - Even better: change one variable. Dance badly for the boss, or sing badly for strangers.
9. Certainty vs gamble (currency: risk)
   - Before: Get a small bonus, or maybe get a big bonus.
   - After: Take a sure $500, or flip a coin for $1,200 or nothing.
   - The EV is 600 vs 500: tune the numbers so the gamble is worth it only if you are a bit reckless.
10. Recurring vs one-time
   - Before: Be embarrassed once, or be embarrassed a lot.
   - After: One public meltdown nobody forgets, or a small awkward moment every day for a year.
   - Different shape of cost, not just bigger.
11. Values conflict
   - Before: Tell a lie, or lose a friend.
   - After: Tell your friend their business will fail, or watch them lose their savings and say nothing.
   - Splits honesty vs kindness; both defensible out loud.
12. Self vs others (system villain)
   - Before: Be sick, or let a patient suffer.
   - After: Work every holiday for 5 years, or cover for a coworker's mistake once and live with it.
   - Targets the system and the job, not patients (per the project rule on punching down).
13. Cost-symmetry fix (single currency)
   - Before: Lose $500, or lose $600.
   - After: Lose $500, or lose a week of sleep.
   - Different currencies make it a real choice.
14. Defender hook added
   - Before: Always have a mild headache, or always be slightly cold.
   - After: Always be slightly cold, or always have a mild headache that warns you of bad news.
   - The upside on the headache gives the minority something to argue.

### Gaps
- No usable dataset of per-question vote splits (Either/You Rather, wouldyourather.app, r/wouldyourather, either.io) was retrieved; the UW "WYR" PDF could not be parsed through the fetch tool, and I did not locate a Reddit analysis of top-voted vs most-split questions.
- No Jackbox designer commentary on Split the Room or Pick Your Poison prompt vetting was found; the PC Gamer article excerpt was truncated.
- Moral Foundations numbers (e.g., 12% vs 90% for footbridge/switch) were not confirmed; only the 81/72/51 multi-country averages were.
- No empirical study on parse time for two-option text on phones; the word-count and parallelism rules are unvalidated craft inference.
- Gneezy-Potters and certainty-effect sources were not retrieved; "certainty vs gamble" splitting is inference.
- Next step: log real vote splits in-game per card and calibrate the 35/65 cull rule with playtest data.
