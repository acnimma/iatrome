# Design lessons for iatrome's other modes: trivia elimination, team trivia, would-you-rather/predict-the-room, draw-and-guess

Research date: 2026-11-20. Scope: Survive the Shift (elimination trivia), Didactics Mode (team trivia), Pick Your Poison (would-you-rather plus majority prediction plus minority defence), Sketch (live draw-and-guess).

**What our code does now** (read from `packages/game/src/constants.ts` and `packages/game/src/games/*.ts`, so this is a local fact, not web research):
- **Survive:** 2 coffees each. A wrong or missing answer costs 1 coffee. If every survivor misses the same question, nobody loses a coffee ("mercy"). A correct answer scores 100 plus up to 100 for speed. Ghosts score ×0.5, and 3 right answers in a row as a ghost revives you with 1 coffee, once per game. 15s questions, up to 20 questions, 2–20 players. Final standings rank survivors first, then how long each player lasted.
- **Didactics:** 4–40 players, 12 questions of 20s each. Each team splits a pool of 1,000 points by the share of its members who answered right. Players get one change of heart after seeing how their team split. Standings show every 3 questions, the last 3 questions are worth double, and there is an individual MVP.
- **Poison:** 8 rounds of 20s each. Pick a side and predict the majority: 100 points for a correct prediction. A minority player may volunteer a 15s typed defence, worth 50 points plus 50 per majority player who taps "Convinced".
- **Sketch:** 3–10 players and 80s of drawing. Guesses score 500 down to 100 with time, and the drawer earns 0.5× of each correct guess. Hint letters appear at 45% and 70% of the time. The drawer picks a word from a few choices that each carry a difficulty value.

Source quality caveat: the Jackbox fandom wiki, TV Tropes and Kahoot's support site blocked automated fetches (HTTP 402/403). Facts about them come from search-result summaries of those pages or from the Wikipedia Jackbox article, and are marked as such. I found no primary Jackbox designer interview about Trivia Murder Party question writing.

## 1. Trivia Murder Party 1/2/3: elimination, comebacks, killing floor, final chase, keeping the dead engaged

### Takeaway
Trivia Murder Party (TMP) is tense because a wrong answer does not kill you directly. It sends you to a random, short, non-trivia "Killing Floor" minigame where death is possible but not certain, and the dead are never out because the final race keeps them eligible to win. Our Survive the Shift has the "dead keep playing" part, but it has no dread step between a mistake and its result, no ghost win condition, and no climax. Elimination is a quiet arithmetic step, not a scene.

### Cited Findings
- **TMP1 loop:** each round is a multiple-choice trivia question, and correct answers earn in-game money. The Killing Floor triggers if any living player answers wrong, or if all living players answer two in a row correctly, and the minigame can kill one or more players. — [Wikipedia, Jackbox Party Pack / Trivia Murder Party](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- **Pacing and failure state:** TMP1 runs up to nine questions, then a tiebreaker minigame. If all players die before at least three rounds have been played, the game ends with no winner. — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- **Final round (catch-up built in):** it starts when one player is left alive and at least three questions have been played. Players race down a darkening hallway. Each question offers three answers to a category, but the leader sees only two, so trailing players can catch up. The first player to reach the exit wins. — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- **TMP2 additions:**
  - New Killing Floor minigames, including one based on Quiplash, so a minigame can be a funny writing contest.
  - Special items that help or hinder survival.
  - A barrier before the exit that you must answer correctly to pass. The leader now sees a third answer at the barrier.
  - The audience counts as its own player.
  - A 2024 free update added 164 questions.
  — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- **TMP3 (2026) changes:**
  - Up to seven question rounds, down from nine plus a tiebreaker. The series is getting shorter.
  - A "Reviver Wheel" decides who comes back when all players die, and players with few or no points have no chance on it.
  - "Plot twists": opinion-based questions, jumpscares, aiming flashlights at the question.
  - Some rounds require a death: if all living players survive a minigame, the lowest-scoring living player is killed.
  — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- **Ghosts can still win.** Wiki summaries say ghosts can win through the final round, and only by stealing the life force of a living player during it. A solo survivor in TMP2 gets all three choices from the start. — via search summaries of [Jackbox fandom TMP2](https://jackboxgames.fandom.com/wiki/Trivia_Murder_Party_2) and [TV Tropes TMP](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/TriviaMurderParty) (not fetched directly; treat the details as wiki-level).
- **Items create player stories.** Reported item behaviour: a "knife" asks you to cut off a finger, which removes an answer choice for you later. One community strategy is to refuse and die instead, which takes the knife out of the game while keeping all your answer choices for the final round. A "Time Master" rewind can undo a round's deaths. — via search summary of [Jackbox fandom TMP2](https://jackboxgames.fandom.com/wiki/Trivia_Murder_Party_2) (unverified detail)
- **Tone intent:** the TMP3 art diary says stylization is the bridge between horror and comedy, and the look balances "cute and gruesome". The team pursues ideas that "earn a laugh or a gasp". — [Jackbox blog, TMP3 Dev Diary #4](https://jackboxgames.com/blog/trivia-murder-party-3-dev-diary-4)
- The original pitch was a lighthearted take on a Saw-like horror thriller. — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)

### Inferences
These are recommendations for Survive the Shift.
- **Insert a dread beat between "wrong" and "lose coffee".** TMP's tension comes from wrong answers sending you to a gamble, not from the wrong answer itself.
  - Our equivalent is a short "Code Brown" or "M&M Conference" minigame for whoever answered wrong. Examples: a 5-second "pick which of 3 vials is saline" luck pick; a "rank these by half-life" sort; a one-line Quiplash-style "excuse to the attending" that the room votes on.
  - The loser of the minigame loses the coffee; winners keep theirs.
  - This turns the coffee loss into an on-stage moment with a winner and a loser, and it gives non-medical players a non-trivia way to survive.
- **Add a final chase so ghosts can win.** Right now a clocked-out player can only revive once, via a 3-in-a-row streak, and then ranks below survivors.
  - Copy the principle: a last segment, maybe called "Sign-out", "Handoff" or "Escape the Hospital", where everyone races along a track.
  - Each prompt is "pick all that apply" from a category, for example "Which of these are beta blockers?" with 3 options.
  - The leader sees fewer options, and ghosts start further back but are allowed to win outright.
  - This is a stronger engagement promise than ×0.5 points.
- **Have a rule for when everyone dies, or nobody does.** Our "mercy" rule (nobody loses a coffee if all survivors miss) protects against a mass wipe but removes drama. TMP3 goes the other way, forcing a death when nobody dies and spinning a wheel when everyone does.
  - Consider "Last Call": if all survivors miss, the lowest scorer among them loses the coffee, so someone always pays.
  - Separately, make the revive a public event with a spin or vote, not a silent streak counter.
- **Lean shorter.** TMP went from 9 questions plus tiebreak to 7 rounds in 2026. Our maxQuestions is 20 at 15s each, plus reveals. That reads long for an elimination format, so consider about 10 to 12 questions plus a final chase.
- **Items or "consults".** One or two pickups per game would generate player stories and choices, e.g. "Call a Consult: see one wrong answer removed" or "Pass the pager: hand your next question's penalty to someone". Keep it to a few, because TMP2 used special items sparingly.
- **Keep wrong answers funny with presentation, not punishment.** TMP's deaths are stylized and cute-gruesome. We should play the coffee loss as a gag (a spilled cup animation, a deadpan Beep line), not as a red X.

### Gaps
- No primary source on TMP question-writing style, such as the length of questions or how joke distractors are written. Fandom and TV Tropes pages blocked fetches.
- No confirmed full list of TMP1/TMP2 Killing Floor minigames from a fetchable source.
- Exact final-round track lengths and the ghost life-steal rules are only wiki-level.

## 2. Kahoot / HQ Trivia / Jackbox trivia: speed scoring, streaks, reveals, big crowds, teams

### Takeaway
Speed scoring is standard, but Kahoot's current default does not pay extra points for streaks; it keeps streaks for its opt-in "Confidence" mode, where you bet on yourself. HQ's tension came from a live host, a fixed schedule, one-strike elimination with a scarce second life, and a 10s clock. For large groups, the pattern that works is short timers, a dramatic group reveal, and team scoring that is fair across team sizes. Didactics already does most of this; what it lacks is a betting or confidence layer and per-question reveal theatre.

### Cited Findings
- **Kahoot streaks:** official Kahoot support says a streak of correct answers does not give extra points in standard scoring, but speed does affect scoring. — via search summary of [Kahoot support, How points work](https://support.kahoot.com/hc/articles/115002303908) (page returned 403 to the fetch)
- **Kahoot "Confidence" experience:** a player can boost an answer. A right boosted answer earns a bonus that grows with streak level, from +50 at Level 1 to +100 at Level 3. A wrong boosted answer costs the same amount and resets the streak. — via search summary of [Kahoot support, Confidence experience](https://support.kahoot.com/hc/en-us/articles/32200674639261)
- Kahoot also has an "Accuracy experience" hosting mode, apparently one that rewards accuracy without the speed pressure. — [Kahoot support, Accuracy experience](https://support.kahoot.com/hc/articles/39818967108627) (title only seen)
- A Kahoot community request asks for an option to remove speed-scaled points, which suggests some hosts find speed scoring unfair to careful readers. — [Kahoot community post](https://support.kahoot.com/hc/en-us/community/posts/38794659972755-Add-option-to-remove-points-awarded-scaling-with-answer-speed)
- **Kahoot's earlier streak bonus:** a 2017-era Kahoot blog post describes an experiment where two correct answers in a row earned 100 bonus points, with the bonus rising and then capped. — [Inside Kahoot, Experimenting with Answer Streaks](https://medium.com/inside-kahoot/experimenting-with-answer-streaks-to-help-make-learning-awesome-3b3357e42595) (403 on fetch; whether it is still live is unconfirmed)
- **HQ Trivia mechanics:**
  - One wrong answer eliminates you, and a referral-based or bought extra life brings you back once.
  - 10-second question timer, on a fixed twice-daily schedule.
  — [Wikipedia, HQ (video game)](https://en.wikipedia.org/wiki/HQ_(video_game)); [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2018/1/16/hq-trivia-and-the-rise-of-mobile-streaming)
- **Why HQ worked, per commentary:** suspense, fear of missing out, the host (Scott Rogowsky), and live chat reinforcing "liveness" and community. — [Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2018/1/16/hq-trivia-and-the-rise-of-mobile-streaming); [Mic](https://mic.com/articles/187709/how-hq-the-trivia-app-and-cultural-phenomenon-hacks-your-brain). These are commentary, not data.

### Inferences
- **Didactics: add a confidence wager, not a streak bonus.** Kahoot moved streak value into an opt-in bet with symmetric risk. In a team mode, a team captain or team majority could "Double Down" on one question per half: gain double if right, lose the pool if wrong. That creates huddles and table-talk, the energy team trivia nights run on.
- **Didactics: per-question reveal theatre.** At 4 to 40 players the reveal is the show.
  - Show the answer distribution first, as bars filling.
  - Then reveal the right answer.
  - Then a team ticker: "Team Ortho 7/8, Team Psych 2/9".
  - Then one comic callout, e.g. "3 people picked 'leeches'".
  Our REVEAL constants suggest some choreography exists. Make sure the distribution comes before the answer.
- **Survive: borrow HQ's scarce second life.** Our once-per-game ghost revive is good. Making it visible and scarce ("2 players are on their second coffee") raises stakes.
- **Speed and reading time:** keep the READING extension for long Pro vignettes. Speed points punish careful readers on board-style stems, which is the complaint Kahoot hosts raise. Optionally use a flat bonus for answering in the first 50% of the time rather than a linear decay, so careful readers aren't punished on long vignettes.
- **Keep timers short for big rooms.** HQ used 10s; Didactics uses 20s, which is fine for team discussion. Survive's 15s is reasonable.

### Gaps
- Kahoot's exact current speed formula was not retrievable (the page returned 403).
- No primary data on optimal team size, or on how Jackbox handles crowds of 40 or more beyond the audience feature.

## 3. Would-you-rather and predict-the-room: dilemma quality, prediction scoring, minority comedy

### Takeaway
The strongest predict-the-room games score how well you read other people, not your own taste. They make being the odd one out a visible, temporary stigma that you can shed, and they make the guessing team and an opposing team both act on every round. Wavelength's opponents bet "left or right" of the guess, Herd Mentality's minority holds the Pink Cow, and Guesspionage has the others vote higher or lower. Pick Your Poison already scores prediction and gives the minority an optional defence. It likely lacks graded prediction (how big the majority was, not just which side), a lasting minority marker, and a role for the majority during the defence beyond tapping "Convinced".

### Cited Findings
- **Wavelength:**
  - The psychic gives a clue for a hidden target on a spectrum between two opposites, and their team turns the dial to their guess.
  - The opposing team predicts whether the target is left or right of that guess. If they're right, the psychic's team loses a point.
  - Points scale by closeness, and the first team to 10 points wins.
  - Critics praised its conversation-starting play; the main criticism was downtime.
  — [Wikipedia, Wavelength (game)](https://en.wikipedia.org/wiki/Wavelength_(game))
- Wavelength designer Alex Hague's Board Game Design Lab episode covers "simplicity, expectations, scoring systems, time constraints". Only the episode description was accessible, not its content. — [Board Game Design Lab ep. 193](https://boardgamedesignlab.com/designing-party-games-with-alex-hague/)
- **Herd Mentality:**
  - The odd one out gets the Pink Cow, and while you hold it you can't win, even with enough points.
  - You get rid of it when someone else becomes the odd one out.
  - Players score by matching the most common answer.
  — [George Fox University blog](https://blogs.georgefox.edu/dlgp/wp-json/wp/v2/posts/36906) (a secondary source, not the rulebook)
- **Guesspionage:** one player guesses a percentage from 0 to 100 for a poll question. Others vote whether the real figure is higher or lower. The answer data comes from Jackbox's own surveys. — [Jackbox, Guesspionage](https://jackboxgames.com/guesspionage); [What Pack Is That fan page](https://swagsteve.github.io/What-Pack-Is-That/game-pages/pack3/guesspionage.html)
- **The Jackbox Survey Scramble** (2024 standalone) continues the survey-prediction family. — [Steam page](https://store.steampowered.com/app/3257070)

### Inferences
These are recommendations for Pick Your Poison.
- **Grade the prediction.** Today a correct "which side wins" pick earns a flat 100. Add a "how lopsided?" slider in 25% buckets, or a higher/lower call on the split, so prediction has skill depth. A 51/49 split should feel different from 90/10, and close splits are the funniest reveals.
- **Give the majority a counter-move during the defence.** Wavelength keeps the non-active team engaged with the left/right call. During the defence, majority players could bet "will this convince anyone?" as well as tapping Convinced. This mirrors Wavelength's way of keeping the other team busy and cuts the downtime critics mention.
- **Make minority status a running gag.** Herd Mentality's Pink Cow works because it is persistent and stigmatized but sheddable. Our `minorityCount` already feeds end-of-game awards. Show it live: an icon that sits on the most-recent lone minority player, e.g. "The Zebra" or "Atypical Presentation", until someone else is alone. Optionally it blocks winning, or just costs bragging rights.
- **Lone dissenter bonus.** The funniest moment in these games is the single person on the other side. Consider an automatic spotlight, plus a small "Against Medical Advice" bonus, when exactly one person picks a side, and let them defend first.
- **What makes a good dilemma.** This comes from the mechanics rather than a cited style guide:
  - The split needs to be uncertain, so both options must be plausible picks.
  - Both options should be specific and equally bad or equally appealing ("Take every call on Christmas" vs "Present at M&M every week for a year").
  - Avoid options where one is obviously correct, since that makes the prediction trivial and kills the reveal.
  - Track real pick rates per dilemma and drop any that consistently split worse than about 80/20. This uses our own data the way Guesspionage uses survey data.
- **Defence format.** Typed 15s defences can be flat. Consider letting the defender pick from three escalating "excuse templates", or showing the defence big on the host screen with the defender's avatar and a reaction burst. The comedy is in the performance, so stage it.

### Gaps
- No primary source on Push the Button, or on Cards Against Humanity-style judging specifics, within budget.
- Wavelength's exact point bands and any catch-up rule were not on the fetched page.
- No primary design writing on what makes a would-you-rather dilemma good; the guidance above is inference.

## 4. Draw-and-guess: keeping drawers engaged, hints, speed scoring, word tiers, letting non-artists be funny, decoys

### Takeaway
Commercial draw games protect the drawer in three ways:
- **Pay the drawer for being understood.** Drawer points come from guessers; Pictionary pays more for harder words and faster guesses.
- **Lower the art bar.** Absurd prompts, limited tools, or decoy answers make bad drawings a feature (Drawful).
- **Escalate stakes by round.** Pictionary doubles, then triples points.

Sketch already pays the drawer 0.5× of each guess and shows hint letters. It likely lacks a payout for harder words, round multipliers, rules against writing words on the canvas, and anything that makes a terrible drawing score or get laughs.

### Cited Findings
- **Netflix Pictionary:** the drawer scores only if someone guesses, and earns more for harder words and faster guesses. Round 2 doubles points and Round 3 triples them. Guessers earn more for quicker guesses. — [Netflix Games Pictionary FAQ](https://games-netflix.helpshift.com/hc/en/43-pictionary/faq/1786-how-do-i-get-points-and-how-is-the-score-calculated-in-classic-mode)
- **skribbl.io scoring:** guessers score by speed relative to others. The drawer scores by how many people guess, and how fast. The drawer earns less than the first guesser but more than the rest. — [Mechanics of Magic, Critical Play: Scribbl.io](https://mechanicsofmagic.com/2024/04/24/critical-play-scribbl-io-2/)
- **skribbl.io hints and penalties:** letters appear as the timer runs down, and a host setting controls hints per word (0 to 5). Wrong guesses carry no penalty. — [Pro Game Guides](https://progameguides.com/skribbl/what-is-skribbl-io-how-to-play-it) (secondary)
- **skribbl.io failure modes:**
  - Drawers write words or letters on the canvas constantly, and fast guessers reward it.
  - Without moderation, chat turns mean, with insults aimed at drawings and blame on artists who couldn't get the word across.
  - The critic suggests letting guessers decide the drawer's points.
  — [Mechanics of Magic](https://mechanicsofmagic.com/2024/04/24/critical-play-scribbl-io-2/)
- **Drawful 2:** after a drawing, the other players type what they think it is. Those typed answers become the multiple-choice decoys, and everyone votes for the real prompt. — [Jackbox, Drawful](https://jackboxgames.com/drawful)
- **Drawful's tools and prompts:** reviewers credit the limited colour palette and having no eraser for much of the fun; no eraser "forces you to consider your drawing". Prompts are deliberately absurd, e.g. "creepy tiger". — [TechRaptor, Drawful 2 review](https://techraptor.net/content/drawful-2-review-much)
- Players often draw badly on purpose for laughs. — via search summary of [TV Tropes, Drawful](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Drawful)
- Jackbox's Drawful Animate page frames it as "we can't all be great artists or storytellers." — [Jackbox, Drawful Animate](https://www.jackboxgames.com/drawful-animate)

### Inferences
These are recommendations for Sketch.
- **Scale the drawer's share with difficulty.** Our terms carry a `difficulty` value. Make the payoff visible on the choice screen, e.g. "Easy ×1 / Medium ×1.5 / Hard ×2". Then picking a hard word becomes a brag-or-bust decision, not just a matter of taste. Pictionary does exactly this.
- **Round multipliers.** If each player draws more than once, apply ×2 to the last lap, as with Didactics' lightning round, to keep late comebacks possible.
- **Protect against no-text cheating.** Medical terms tempt writing ("MI" or "ECG" scrawled on the canvas). Options:
  - A "No letters" reminder on the drawer's screen.
  - A guesser-side "they wrote it" flag that zeroes the drawer's share if most guessers tap it. This is a version of the Mechanics of Magic suggestion.
- **Rescue the stuck drawer.** If nobody has guessed by the 70% hint point, the drawer could trigger a category reveal ("it's a drug" or "it's a sign") at the cost of half their share. That avoids 80 seconds of public failure, which is the humiliation case.
- **Have a "close" signal.** A server-side "close!" for guesses within an edit distance of the answer (private to that guesser) keeps guessers engaged. skribbl-style games show a similar indicator. This is from memory and not verified in my sources, so treat it as a suggestion. Our `matchGuess` could already support it.
- **Make bad art pay sometimes.** A Drawful-style variant round where guessers type fake answers and then vote is a separate mode. It may be worth a "Differential Diagnosis" round where the drawing is shown and players vote among submitted guesses, so bad drawings make funny decoys.
- **Show drawer reactions.** Let guessers send reactions during drawing, already in REACTIONS, and show them to the drawer live, so a struggling drawer gets laughs rather than silence.
- **80s is long.** skribbl's defaults are commonly 80s too, but in a 3 to 10 player room with hints at 45% and 70%, consider ending the turn once most guessers have solved. The code already ends early when all have solved.

### Gaps
- No primary source on Gartic Phone's design (the telephone chain mechanic) within budget.
- skribbl.io's exact point formula and default word-choice count (commonly 3) are not confirmed from a primary source.
- No source on drawer humiliation or embarrassment research specifically.

## 5. Across modes: session length, round count, comeback mechanics, end-of-game awards

### Takeaway
The commercial pattern is short games, with a stakes escalation near the end that makes late comebacks mathematically possible, and that escalation is often a distinct finale format rather than just more of the same. Examples:
- TMP's final chase.
- Pictionary's ×2 and ×3 rounds.
- Wavelength's race to 10.

Didactics has a lightning round and Sketch has none. Poison has no finale, and Survive's finale is just the last question.

### Cited Findings
- TMP3 cut the game from nine questions plus a tiebreaker to up to seven rounds. — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- TMP's final round handicaps the leader: they see fewer answer options. — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- Pictionary doubles points in round 2 and triples them in round 3. — [Netflix Pictionary FAQ](https://games-netflix.helpshift.com/hc/en/43-pictionary/faq/1786-how-do-i-get-points-and-how-is-the-score-calculated-in-classic-mode)
- In TMP3, players with low or no points have no chance on the Reviver Wheel. Even comeback mechanics there reward earlier play. — [Wikipedia](https://en.wikipedia.org/wiki/Trivia_Murder_Party)
- In Herd Mentality, the Pink Cow holder cannot win. This is a negative marker that only moves when someone else fails. — [George Fox blog](https://blogs.georgefox.edu/dlgp/wp-json/wp/v2/posts/36906)
- Wavelength reviews cite downtime as the main complaint. Keeping every player acting each round matters. — [Wikipedia, Wavelength](https://en.wikipedia.org/wiki/Wavelength_(game))

### Inferences
- **Target about 10 to 15 minutes per mode.** Rough math from our constants:
  - **Survive:** 20 × (15s + 6.5s) is about 7 minutes before intros and dead air. Fine if it ends earlier by elimination, but the chase finale should replace the tail.
  - **Didactics:** 12 × (20 + 7)s plus standings is about 6 to 7 minutes.
  - **Poison:** 8 rounds at up to about 60s each is about 8 minutes.
  - **Sketch:** with up to 10 drawers × (12 + 80 + 5.5)s, about 16 minutes for one lap. That is long at 10 players, so consider a cap on drawers per game or a shorter draw time when the player count is high.
- **Give every mode a finale with different rules.** Options:
  - Survive: the chase.
  - Didactics: lightning plus the Double Down wager.
  - Poison: the final dilemma, where the majority prediction is worth triple and the lone dissenter auto-defends.
  - Sketch: a last lap at ×2, or a speed-sketch round of 30s each.
- **Awards.** We already compute stats such as `minorityCount`, fastest solve and MVP. Commercial games rely on end-screen callouts that are funny rather than merit-based. Ideas:
  - Survive: "Most coffees spilled", "Lazarus", "Died on question 1".
  - Poison: "Contrarian", "Hive Mind".
  - Sketch: "Most understood artist", "Abstract Expressionist" for zero guesses.
  - Didactics: "Carried the team".
  Keep the copy deadpan.
- **Catch-up math.** Survive gives ghosts ×0.5 points, which mathematically locks them out. Pair that with a ghost path to win (the chase) or the reduction just reads as permanent second class.

### Gaps
- No published data from Jackbox or Kahoot on ideal session length or round counts. The estimates above come from our constants and the trend in commercial games, not measured retention.
- No primary source on how Jackbox chooses end-of-game award categories.
