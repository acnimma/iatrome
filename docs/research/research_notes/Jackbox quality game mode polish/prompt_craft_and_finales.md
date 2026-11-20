# Prompt craft for comedy writing and drawing games, plus Quiplash finale mechanics

Scope note: The earlier report (`docs/research/reports/Quiplash design mechanics deep dive.md`) already covers the head-to-head rules, Round 1/2 scoring (10 pts per 1% + 100 bonus, doubled in R2, Quiplash/Jinx), safety quips, Spencer Ham's 2016 rules (answer your own prompt, specific-but-not-overloaded "erotic movie for elephants" calibration, vary structure, alienating 1-2 people kills it), C.J. Tuor's 2019 tactics, the "NO MORE PIZZA DRAWINGS" note, and a version table of finals. These notes do not repeat that material except where needed for context. They add depth on the finales, drawing prompts, broad-appeal ("humor incubator") prompts, failure modes and pacing.

**Correction to the brief:** Thriplash is the finale of **Quiplash 3** (2020), not Quiplash 2. Quiplash 2 / InterLASHional's finale is the Last Lash with its three variants (Acro-Lash, Word-Lash, Comic-Lash). Quiplash 1/XL's finale is a plain Last Lash. No source found shows Quiplash 3 having Last Lash variants ([Jackboxpedia Q3](https://jackbox.wiki/wiki/Quiplash_3); [Jackboxpedia Q2](https://jackbox.wiki/wiki/Quiplash_2)).

**Source quality caveat:** Jackbox has published almost nothing on finale scoring, reveal timing or prompt-testing process. No GDC Vault talk by Jackbox staff on prompt writing turned up in searches. The fan wikis are partial: Jackboxpedia marks its Q2 and Q3 pages "under construction", and the Fandom wiki returned HTTP 402 to automated fetches this session. Its content appears here only through search snippets and the earlier report's citations.

---

## 1. What Jackbox writers say makes a good Quiplash prompt

### Takeaway
Jackbox's public guidance comes down to a few points. A prompt is a launch pad, not a joke. It should be specific enough to suggest a scene but open enough that many quick answers come to mind. The writer should be able to answer it well themselves. A set of prompts should vary its sentence structure and the kind of answer it asks for. Prompts are tested in live lunchtime playtests, not by a formal metric.

### Cited Findings
- Ham's framing: the writer's job is to set up a clear launch point. "If you can't think of a good answer to your own prompt, then it's probably not going to be a very good" one, and a good prompt should inspire many quick answers. — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- Ham on length: over-detailed setups become "way too much info to process"; "Don't overthink it... [don't] labor over it." — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- Ham on structure: "Don't just write fill-in-the blanks." Mix questions and statements, and vary the requested answer type (phrases, questions, objects, puns) so players aren't set up for the same joke every round. — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- Ham on inside jokes: they work only if "it's a collective inside joke"; niche references (an obscure TV show) shut out non-fans. — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- Tuor's six prompt sources: (1) funny words, imaginary characters and absurd premises, so players' "response should be equally whimsical" ("Boogey" is inherently funny, and the Boogeyman isn't real); old textbook facts ("why the T-Rex had teeny tiny arms"); (2) reliving past mistakes, "transform our pain into art", where "you just have to imagine the scenario"; (3) specialty/event questions (a Bachelorette edition built to create inside jokes among a bridal party); (4) "let's change the world" prompts that can spark "intelligent conversations"; (5) "stuff about butts", crude humor they "refuse to say we're sorry" for; (6) "things we authentically want to know". A good prompt "should work with a variety of audiences." — [Jackbox blog, Tuor](https://www.jackboxgames.com/blog/the-science-of-creating-a-quiplash-prompt)
- Testing practice: Jackbox runs daily lunch-hour playtests. Spencer Ham called them his favorite part of making Drawful: Animate. — [Jackbox blog, Ham Q&A](https://www.jackboxgames.com/blog/mini-qa-with-drawful-animate-game-director-spencer-ham)
- PP10 directors' playtest questions were "Does this make sense to the player?" and "Is this fun?"; Warren Arnold: "If I'm not having fun as a user, then the players at home likely aren't having fun either." — [Jackbox blog, PP10 directing](https://jackboxgames.com/blog/behind-the-scenes-of-pp10-directing)
- Prompts are also harvested from playtests: "Especially in Dirty Drawful, we harvest a lot of the prompts from our actual playtesting," and many writers come from Chicago improv (Allard Laban, CCO). — [Gamereactor](https://www.gamereactor.eu/the-jackbox-naughty-pack-was-inspired-by-the-dirty-minds-of-the-players-1430943/)
- Quiplash 3 prompts each carry at least two prompt-specific safety quips, plus "US" and family-friendly ("X") flags, according to a fan-compiled prompt list. — [Fandom: Quiplash list of prompts](https://jackboxgames.fandom.com/wiki/Quiplash_(series)/List_of_Prompts) (via search snippet; page not fetched)

### Inferences
- **The templated-prompt problem in iatrome.** "X's dating profile" and "Y's out-of-office reply" are *format* prompts. The format (dating profile) supplies the structure and the slot (X) supplies the subject. When the format repeats, players learn a single joke shape ("profile that reveals a gross trait") and answer on autopilot. Ham's variety rule targets exactly this. Treat each format as a scarce resource: use it at most once or twice per pack, and never in the same session.
- **What the good examples share.** Ham's elephant and Tuor's Boogeyman prompts each start from a familiar frame and add exactly one wrong element: an erotic movie, but for elephants; fear, but felt by the Boogeyman. This is the improv structure of "base reality + first unusual thing" (see section 2). For iatrome, that means a familiar clinical frame (handoff, discharge instructions, pager message, consent form, M&M conference) plus one category violation (the patient is a ghost, the handoff is to your replacement on day one, the consent form is for something non-medical).
- **Practical prompt archetypes, built from the cited principles** (each is a different sentence structure, not a different subject in the same template):
  1. *Inverted perspective* (Tuor's Boogeyman move): something normally on the receiving end gets the voice. Pattern: "What the [feared thing] is afraid of" or "What the [object] thinks about [person]".
  2. *Pain-into-art scenario* (Tuor's past mistakes): a specific shared indignity with a gap at the worst moment. Pattern: "The worst possible thing to say right after [universally awkward clinical moment]".
  3. *Authentic question* (Tuor's #6): something players would actually want answered. Pattern: a sincere-sounding question with no single answer.
  4. *Imaginary-world fact* (Tuor's T-Rex): explain a real but absurd fact or a fictional institution.
  5. *Object/name answer* (Ham's answer-type variety): the answer is a noun, a title or a name rather than a sentence, which suits puns.
  6. *Question-as-answer*: the answer is itself a question (for example, what a specific person secretly wants to ask).
- **A lightweight test to adopt from the cited guidance:** the writer must be able to produce 3+ answers they'd actually submit (Ham's rule). The prompt should still read in one breath when read aloud (Ham's overload warning). A pack is checked for structure repetition, not only topic repetition.

### Gaps
- No source gives the share of Jackbox prompts that are reused templates or formats. No published Jackbox numbers on prompt length (words or characters) were found.
- No GDC talk, AMA or podcast with a Jackbox writer explaining a formal prompt QA or culling metric was found. "Playtest and keep what got laughs" is the only documented process.

---

## 2. Broad-appeal "humor incubator" prompts: working for every sense of humor and every room

### Takeaway
No Jackbox source counts how many "joke angles" a prompt should allow or describes a formal range test. The documented practice has four parts: a mixed tonal palette (whimsical, embarrassing, crude, earnest), a broad audience as the default, a family-friendly filter that removes a minority of flagged prompts, and adult content that is "in on the joke" rather than mean. Comedy theory (benign violation, improv "game") explains why some prompts afford many angles. Range-testing by imagining player types is an inference, not a documented Jackbox method.

### Cited Findings
- Tuor: a good prompt "should work with a variety of audiences." The blog's own tactic list spans whimsy, embarrassment, crude humor, earnest debate and sincere curiosity, which in practice is a palette for different senses of humor. — [Jackbox blog, Tuor](https://www.jackboxgames.com/blog/the-science-of-creating-a-quiplash-prompt)
- Ham: "If you're alienating even 1-2 people, the game is a lot less fun." Tailor prompts to who's playing, since what suits friends may not suit relatives. — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- The family-friendly filter works at the prompt level and does not touch player text. A 2015 developer post (as surfaced in search) said the filter omits "some of the naughtier content", and that player answers can't be filtered. A fan thread quotes a Jackbox post putting Quiplash XL at **844 normal vs 154 "adult" prompts** (~15% adult) that the filter blocks. — [Steam community thread (attribution to a specific Jackbox post unverified)](https://steamcommunity.com/app/351510/discussions/0/594820656473105270). Treat the numbers as unverified.
- Fans observe that even a family-friendly prompt set "could still be made dirty through player answers" (search-surfaced Steam forum comment; anecdotal). — [Steam PP3 discussion](https://steamcommunity.com/app/434170/discussions/0/305509857561889566/)
- Naughty Pack creative director Brooke Breit: the target tone is "funcomfortable", meaning "Can we all have fun with this, but we're all kind of in on the joke?" Content went through "internal checks, sensitivity reviews" so they're "never trying to punch down or have anything that is intentionally mean-spirited." Drawful's phrasing has "a little bit of an unhinged nature." Even the base games are "geared towards a slightly older audience, not quite that mature audience." — [Shacknews](https://www.shacknews.com/article/141077/jackbox-naughty-pack-m-rated-interview)
- Benign-violation theory: laughter happens when something is a violation and benign at the same time. Too much threat kills it, and too little gives no violation. — [McGraw & Warren 2010](https://leeds-faculty.colorado.edu/mcgrawp/pdf/mcgraw.warren.2010.pdf) (already summarized in `Party humor design research.md`)
- Improv "game of the scene": comedy comes from a believable base reality plus a "first unusual thing", which is then heightened ("do it again but more") and explored ("tell me the story of this thing"). The guiding question is "if this is true, then what else is true." A common mistake is "making your first unusual thing TOO unusual." — [Hoopla Impro](https://www.hooplaimpro.com/quick-guide-game-of-scene); [Will Hines, heighten and explore](https://willhines.substack.com/p/teaching-game-2-heighten-and-explore); [Wikipedia: Game of the scene](https://en.wikipedia.org/wiki/Game_of_the_scene)
- Jackbox's Hear Say director reported that broad testing made content work "for six and sixty year olds alike", with about 95% family friendly. This is anecdotal developer judgment (see `Party humor design research.md`, sourced there to a Loot Level Chill interview: [lootlevelchill.com](https://lootlevelchill.com/?p=8040)).

### Inferences
- **Why a prompt "incubates" many humor styles.** The prompt should supply the base reality and leave the unusual thing to the player. Ham's overloaded elephant prompt fails because the writer has already used up the unusual-thing slot and the heightening. Once the prompt itself is the joke, only one angle remains: echo the prompt's joke. An incubator prompt is a *normal, vivid situation with a gap*. Each humor type then supplies its own violation in that gap: absurdist (category error), dry (understatement), dark (raised stakes), wholesome (sweet twist), nerdy (precise jargon), crude (body).
- **Rating vs. range.** Jackbox's practice suggests handling family vs adult mostly through the *answers*, not the prompt. A clean prompt with an open gap lets an adult room go blue and a family room go silly, and the filter only removes the ~15% of prompts whose *premise* is adult. For iatrome, the default prompt should be clean and open, with a small flagged "after-hours" subset. Never make the premise itself the dirty or dark joke, because that locks every room into a single angle.
- **A proposed range test (inferred, not a Jackbox method):** before accepting a prompt, the writer drafts one answer from each of six personas:
  1. the literal-minded nerd (precise, technically correct);
  2. the absurdist (category error);
  3. the deadpan cynic (understated, institutional);
  4. the wholesome one (sweet or earnest twist);
  5. the dark one (raised stakes, kept benign through distance);
  6. the 12-year-old (body or gross-out).
  A prompt where four or more personas produce a distinct, fun answer passes. Two or fewer means it's too narrow or has a single obvious answer.
- **Second check, the jinx test:** if two of the persona answers are near-identical, the prompt has a gravitational "obvious answer" and will jinx often. The earlier report's "Oops" example for "worst thing to hear from your surgeon" is the canonical failure.
- **Medical-specific range lever:** a prompt should be answerable from three knowledge depths: a layperson (bodies, hospitals as seen on TV), a student (exams, rounds) and a clinician (EHR, pages, codes). Universal frames (waiting rooms, gowns, pagers, cafeteria, paperwork) pass all three. Eponyms and specialty jargon fail the layperson tier (consistent with Ham's alienation rule).
- **Inside-joke prompts are a separate category.** Ham notes they only work if collective, so custom or "room-specific" prompts (for example, a residency program's own lore) belong in a custom-episode feature, not the base pack.

### Gaps
- No source quantifies how many distinct joke angles a strong prompt affords, and no Jackbox persona or range-test method is documented.
- No official Jackbox statement on the exact share of family-friendly vs adult prompts in Quiplash 2 or 3 was found. The XL figure is fan-relayed.

---

## 3. What makes a good drawing prompt (Drawful, Drawful 2, Drawful: Animate, Tee K.O.)

### Takeaway
Drawful's prompts are deliberately "bonkers" compound scenes: a subject, an action and a setting, often with a count. They are meant to be drawn badly on a phone with no eraser, and then guessed at through player-written lies. So the prompt has two jobs at once. It must be drawable well enough to give guessers a chance, and ambiguous enough that plausible fake titles exist. Tee K.O. takes a different approach: free drawing paired later with other players' slogans. There, the comedy comes from recombination, not from the prompt.

### Cited Findings
- Spencer Ham's sample Drawful: Animate prompt is "three raccoons leaving a broom closet". It has a count, a creature, an action verb and a location. He also says "the prompts are straight-up bonkers." — [Jackbox blog, Ham Q&A](https://www.jackboxgames.com/blog/mini-qa-with-drawful-animate-game-director-spencer-ham)
- The canonical Drawful pattern pairs a historical figure with an animal (e.g. "Napoleon riding a squirrel"). The no-eraser choice is intentional ("It's called Dr-AWFUL for a reason... Sometimes the drawing error is part of the fun"), so the game doesn't feel "like a drawing competition." — summarized in `Party humor design research.md`; [jackboxgames.com/drawful](https://jackboxgames.com/drawful)
- Drawful 2: two colors, "(Still no eraser, though. It's a choice.)", a family-friendly toggle, VIP censoring of drawings and answers, and custom episodes "with your own inside jokes and references". — [Jackbox blog, Drawful 2 is Here](https://www.jackboxgames.com/blog/drawful-2-is-here)
- Lie mechanics (Drawful 1): other players write a fake title. Liars get 500 per player fooled, the truth earns 1,000 to the guesser, and the artist gets 1,000 per player who guesses correctly. If a player doesn't submit a lie, the game inserts its own decoy, and picking a game decoy costs **−500**. Likes give no points. — [Jackboxpedia: Drawful](https://jackbox.wiki/wiki/Drawful)
- Drawful 2 scoring: liar 500 per player fooled plus a share of a 1,000-point pool based on audience members fooled; truth 1,000; artist 1,000 per correct guesser; the audience also guesses. There is no separate final round, only a final leaderboard and then a likes board. — [Jackboxpedia: Drawful 2](https://jackbox.wiki/wiki/Drawful_2)
- Because the artist is paid per correct guesser, the artist is motivated to draw *clearly*, while liars are motivated to find alternate readings. That tension depends on the prompt allowing both (from the scoring rules above; Jackboxpedia).
- Naughty Pack: Drawful has "a little bit of an unhinged nature sometimes to the way things are phrased," and "for some of the pictures that were being drawn, you just need to react in the moment." — [Shacknews](https://www.shacknews.com/article/141077/jackbox-naughty-pack-m-rated-interview)
- Tee K.O.: Round 1, players draw 3 designs and write at least 4 slogans. Round 2 is 1 drawing and 2 slogans. Each player then gets *random* drawings and slogans from the pool (often other players') and combines them into shirts, which face off in a tournament voted on by players and audience. ~30 min. — [Jackboxpedia: Tee K.O.](https://jackbox.wiki/wiki/Tee_K.O.)
- Tee K.O. 2: missing drawings are replaced with "one of the hundreds of drawings made by Jackbox employees." The pizza cap ("NO MORE PIZZA DRAWINGS") shows that default subjects pile up when drawing is open-ended. — [Jackbox blog, PP10 directing](https://jackboxgames.com/blog/behind-the-scenes-of-pp10-directing)
- Third-party prompt advice (non-Jackbox, lower authority): funny drawing prompts work because "two ideas do not belong together", should be "understandable quickly", and "specific funny > vague funny". — [Techpresso prompt guide](https://academy.techpresso.co/prompts/funny-drawing-prompts)

### Inferences
- **Why flat nouns fail in iatrome's doodle mode.** A single noun ("stethoscope") has one canonical drawing. Everyone draws the same thing, guessers get it instantly, and there's no room for lies. Drawful's structure works because the *relationship* is what's hard to draw and easy to misread. "Riding", "leaving" and "three of" leave the drawing at the mercy of the artist.
- **Drawing prompt template (inferred from Ham's raccoon and Napoleon examples):** [number or adjective] + [concrete, drawable subject] + [action verb] + [place or object it interacts with]. Example structure (original, medical): "two pigeons doing a lumbar puncture", "a skeleton waiting for the results of its own X-ray", "a kidney stone graduating from medical school". Each prompt has one *visual* subject people can draw (animal, skeleton, organ with a face) and one *relationship* that creates the joke.
- **Prompt properties to check:**
  1. **Drawable core:** every noun can be sketched in under 10 seconds by a non-artist. Avoid abstract nouns (anxiety, burnout) as the main subject; put them in the verb or the situation instead.
  2. **Misreadable relationship:** at least one element should invite a different plausible title, so liars have material.
  3. **No spelled-out text needed:** if the prompt can only be conveyed by writing words in the drawing, it fails as a guessing prompt (though it's fine for Tee K.O.-style modes).
  4. **Decoy-friendly neighbors:** the game's own fallback decoys work best when they share the prompt's grammar (same structure, different subject or verb). Drawful's −500 for picking a game decoy implies decoys must be plausible.
  5. **One absurd element, not three:** Ham's overload rule applies to drawing too. "Napoleon riding a squirrel" has one wrong pairing; adding a time and a city makes it undrawable.
- **Medical tie-in:** anthropomorphized organs, instruments and germs doing human activities are drawable by anyone and readable by lay players. Procedures done by the wrong agent (animals, objects) give relationship comedy without patient-directed humor.
- **Tee K.O.-style alternative:** if iatrome wants drawing modes without a guessing layer, the Tee K.O. lesson is that recombination (my drawing + your caption) creates the comedy, and the prompt can be loose ("draw a hospital mascot"). The PP10 pizza note shows that loose prompts converge on defaults unless the content is curated.

### Gaps
- No Jackbox source describes Drawful's prompt-writing rules (drawability tests, prompt length, how decoys are written). The structural template above is inferred from two published examples plus fan observation.
- No Drawful or Drawful 2 drawing-timer length was found on Jackboxpedia.
- Tee K.O.'s drawing-suggestion system (whether players get prompts) is not documented on Jackboxpedia.

---

## 4. Common failure modes of party-game prompts

### Takeaway
The documented failures are: overload (too much setup), vagueness (no launch point), a single obvious answer (jinx bait, or everyone draws pizza), niche knowledge (alienates 1-2 people), punching down or mean-spirited premises, monotony of structure, and finales that don't feel like the core game.

### Cited Findings
- Overloaded: "way too much info to process." Vague: a generic prompt is weaker than a targeted one. — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- Niche references alienate: "If you're alienating even 1-2 people, the game is a lot less fun." — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- Monotony: "Don't just write fill-in-the blanks." — [Jackbox blog, Ham](https://www.jackboxgames.com/blog/how-to-write-a-good-quiplash-prompt)
- Default convergence in drawings: "NO MORE PIZZA DRAWINGS." — [Jackbox blog, PP10](https://jackboxgames.com/blog/behind-the-scenes-of-pp10-directing)
- Punching down: Jackbox runs sensitivity reviews so content is "never trying to punch down or have anything that is intentionally mean-spirited." — [Shacknews](https://www.shacknews.com/article/141077/jackbox-naughty-pack-m-rated-interview)
- Improv parallel: making the "first unusual thing TOO unusual" breaks the scene, the improv version of an overloaded prompt. — [Hoopla Impro](https://www.hooplaimpro.com/quick-guide-game-of-scene)
- Finale complaints: a Steam commenter argued Quiplash 2's three Last Lash formats are each "not particularly like Quiplash" (search-surfaced Steam discussion, anecdotal) — [Steam PP7 discussion](https://steamcommunity.com/app/1211630/discussions/0/2952628643855845863). Steam review mining lists a "disappointing Final Lash" as a recurring complaint about Q2 InterLASHional — [Vaporlens](https://vaporlens.app/app/1111940/quiplash_2_inter_las_hional/stats/details) (cited in the earlier report).
- The prompt itself can be the problem when its premise is already the punchline. In a Naughty Pack interview, the interviewer got a prompt so funny they spent "most of my time ... laughing instead" of drawing. That's fine for Drawful, where the drawing is the second beat, but in Quiplash it leaves nothing for the answer. — [Shacknews](https://www.shacknews.com/article/141077/jackbox-naughty-pack-m-rated-interview) (the interpretation is an inference)

### Inferences
- **Failure-mode checklist for iatrome prompt review** (each item maps to a finding above):
  1. *Template fatigue:* the same frame ("X's dating profile") appears more than twice per pack.
  2. *Obvious-answer gravity:* two writers' first answers match (jinx test).
  3. *Premise-is-the-joke:* the prompt is funnier than any answer you can write.
  4. *Knowledge gate:* needs a specialty eponym, drug name or board fact to answer.
  5. *Patient as target:* the butt of the joke is a patient group (obese, noncompliant, substance use). Retarget to the system, the clinician or the paperwork (see `Party humor design research.md` on medical punching down).
  6. *Read-aloud length:* can't be read in one breath. As a heuristic (not a Jackbox number), keep prompts to roughly 12-15 words.
  7. *Flat noun* (drawing modes): a single object with one canonical depiction.
  8. *Undrawable abstraction:* the main subject is a feeling or concept.
- The finale lesson is that a finale gets criticized when its writing task differs too much from the core loop (acronyms and word insertion are constrained wordplay, not open joke-writing). An iatrome finale should keep the core "open gap" writing and change the *structure* (more answers, all-play voting), not the type of skill being tested.

### Gaps
- No published Jackbox data on prompt-level failure rates (for example, jinx frequency by prompt) was found.

---

## 5. Exact Quiplash finale mechanics

### Takeaway
There are three finale designs. **Q1/XL Last Lash:** everyone answers one prompt; each player has 3 stackable votes; a 3,000-point pool is split by vote share; answers are revealed from fewest votes to most. **Q2/InterLASHional Last Lash:** one of three constrained-wordplay formats; every player awards gold/silver/bronze to three different answers (gold and silver only with 3-4 players); medal point values are undocumented. **Q3 Thriplash:** head-to-head duels where each player writes three answers to one prompt; there is no safety quip; points are tripled (max 6,000 per prompt); Schmitty fills the odd seat.

### Cited Findings
**Quiplash 1 / XL: The Last Lash**
- All players "write out a quip for one singular prompt"; "all of them are then shown on-screen." — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash)
- Voting: players "select three of their favorite [answers], of which they can choose three separate answers or clump them up together on the same answer." — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash)
- Audience: Jackboxpedia says audience members "cast three individual votes", and "a majority of the Audience votes received will be given to their respective players." — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash). **Conflict:** the Fandom series page (via the earlier report and a search snippet) says each audience member has only **one** vote. — [Fandom: Quiplash series](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Points: players share "the 3,000 point pool" ([Jackboxpedia](https://jackbox.wiki/wiki/Quiplash)), with the formula "1% of those who voted = 30 points" ([Fandom](https://jackboxgames.fandom.com/wiki/Quiplash_(series)), via search snippet).
- Reveal: results are shown "with the least amount of votes first and the most, last." — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash)
- Trophy "He Who Lashes Last..." requires 70%+ of the votes in the Last Lash. — [Exophase](https://www.exophase.com/game/quiplash-ps4/trophies/); [PSNProfiles](https://psnprofiles.com/trophies/3665-quiplash)

**Quiplash 2 / InterLASHional: The Last Lash**
- "One of three special rounds will be selected to play": **Acro-Lash** (three letters on screen; build a name or answer for the prompt using those letters), **Word-Lash** (a random word appears and must be worked into the answer), **Comic-Lash** (an unfinished comic, usually a character asking a question; fill the blank speech bubble). — [Jackboxpedia: Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2)
- Voting: all answers are shown, then "every player will then award a gold, silver, and bronze medal respectively to three separate answers" (no stacking). — [Jackboxpedia: Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2). With 3-4 players, only gold and silver are awarded. — [Fandom](https://jackboxgames.fandom.com/wiki/Quiplash_(series)) (via search snippet)
- Audience gets 1 vote in the final (per the earlier report's Fandom citation); Jackboxpedia's Q2 page does not mention audience in the Last Lash. — [Fandom](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Custom episodes can't replace the Last Lash: it "will always be one of the three above-mentioned prompt types." — [Fandom](https://jackboxgames.fandom.com/wiki/Quiplash_(series)) (via earlier report)
- InterLASHional achievement "Those Who Lash Last" requires playing every final-round question type (100 XP), which confirms the three-format rotation carried into InterLASHional. — [Epic Games achievements](https://store.epicgames.com/achievements/quiplash-2-interlashional-3c3888)
- Medal point values (gold/silver/bronze), any pool size, and the reveal order are **not documented** in any source found.

**Quiplash 3: Thriplash**
- "The final round is a Thriplash"; players "have to fill in three separate responses." — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- Scoring is vote share with points tripled: "The maximum amount of points players can receive in this round for each prompt is 6,000 for 100% of the votes." (The earlier report flags this as internally inconsistent with 1,000/2,000 maxima in R1/R2.) — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- "Unlike the previous two rounds, the safety quip is unavailable." — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- Odd counts: "Schmitty will go against the lowest scoring player at the end of the second round, with his answers always appearing on the left side of the screen." — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- Voters vote on the better *set* of three, and answers are revealed in sequence (per the earlier report's synthesis of Fandom and Jackboxpedia). Jackboxpedia's current page does not describe reveal order. — [Fandom](https://jackboxgames.fandom.com/wiki/Quiplash_(series)); [Jackboxpedia Q3](https://jackbox.wiki/wiki/Quiplash_3)

### Inferences
- **Design logic across versions.** Q1's stackable votes let one answer take the whole pool and make the reveal (lowest to highest) a countdown to a single champion. Q2's forced three-way medals spread points and guarantee more players get on the board, but constrained-wordplay formats test a different skill. Q3 goes back to the duel and raises the stakes by quantity (three jokes) rather than changing the joke type.
- **Options for an iatrome finale:**
  - *Thriplash-style "Triage" round:* a duel with 3 answers each to one list-shaped prompt, revealed alternating A1/B1/A2/B2/A3/B3 or side by side line by line, then one vote for the better set. Use the host as the odd-seat opponent. No safety quip, or a reduced-value one.
  - *Q1-style all-play "Grand Rounds":* everyone answers one prompt, everyone gets 3 stackable votes (can't vote for yourself), the pool is split by share, and the reveal goes from fewest votes to most so the final card lands as the winner. This works best at 3-6 players; at 8 players, 8 answers on one screen get crowded.
  - *Acro/Word/Comic variants:* medicine's abbreviation culture makes a three-letter "Acro" round a natural fit (as the earlier report noted). Given the community complaint that these formats are "not particularly like Quiplash", use them as an occasional variant, not the only finale.
- **Medals vs stacked votes:** medals (3 distinct answers) reduce kingmaking and increase the number of scorers. Stacking (3 votes on one answer) rewards a decisive best answer. With a lecture-hall audience, a single audience vote that is capped as a block (see the earlier report) avoids audience domination in either system.

### Gaps
- Quiplash 2 medal point values, the existence of a pool, and the reveal order are undocumented in the sources reached. Verifying them would need gameplay footage or in-game observation.
- The audience vote count in the Q1 Last Lash conflicts between sources (3 vs 1).
- Thriplash reveal choreography (alternating vs simultaneous, whether the host reads each line) is not documented in text sources. It would need gameplay video to confirm.
- Fandom wiki pages could not be fetched directly (HTTP 402), so the Fandom-sourced claims come from search snippets and the earlier report.

---

## 6. Pacing: timer lengths and reveal timings

### Takeaway
Jackbox publishes no timer lengths for writing, voting or drawing, or for finale reveals. The only documented anchors are total runtimes (Quiplash ~15 min; Drawful 2 ~25 min; Tee K.O. ~30 min), the Extended Timers option, and Drawful 2's visual timer ("line length indicates how much time is remaining").

### Cited Findings
- Quiplash: "15 Minutes" game duration; Extended Timers listed as a feature with no values given. — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash)
- Drawful 2: ~25 minutes, 3-8 players; extended timers; "Line length indicates how much time is remaining" (drawing UI). — [Jackboxpedia: Drawful 2](https://jackbox.wiki/wiki/Drawful_2)
- Drawful (1): 15-minute duration; when there are 6 or fewer players, an extra round with different prompts is played. — [Jackboxpedia: Drawful](https://jackbox.wiki/wiki/Drawful)
- Tee K.O.: 30-minute duration, no timer values documented. — [Jackboxpedia: Tee K.O.](https://jackbox.wiki/wiki/Tee_K.O.)
- Extended timers exist for streaming delay (Drawful 2 launch post lists "extended streaming timers"). — [Jackbox blog, Drawful 2 is Here](https://www.jackboxgames.com/blog/drawful-2-is-here)
- Earlier report: the Q1 vote timer did not end early when all votes were in, which a reviewer criticized. — [Shacknews review](https://www.shacknews.com/article/90364/quiplash-review-just-add-people-and-lash-away) (via earlier report)

### Inferences
- Per-phase budget derived from a 15-minute Quiplash with ~2N duels plus a finale (not a Jackbox number): the finale should take roughly 2-3 minutes in total. For a Thriplash-style finale with N/2 duels, that leaves about 30-40 s per duel reveal (six lines read aloud, then vote and score). For an all-play finale, the reveal of N answers from lowest to highest at about 3-4 s per card plus a winner beat fits in about 45 s.
- A writing timer for 3 answers should be longer than a single-answer timer, but the phase should end early when everyone submits (consistent with the Shacknews criticism).

### Gaps
- No primary or wiki source gives actual writing, voting, drawing or reveal durations for any Quiplash or Drawful version. Measuring them from gameplay video is the only route.
