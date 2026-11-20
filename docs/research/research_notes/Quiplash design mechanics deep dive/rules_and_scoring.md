# Quiplash Series: Rules, Round Structure, and Scoring Math (Quiplash 1 / XL / 2 / 2 InterLASHional / 3)

Source-quality note (read first): Jackbox's official game pages give only high-level facts: player counts, audience cap, settings labels, and a one-line description of the final round. Jackbox has published no official scoring formula or timer lengths that I could find. Every exact point value below comes from fan wikis: the Jackbox Games Fandom wiki (jackboxgames.fandom.com, read through its MediaWiki API because the HTML pages return HTTP 402 to automated fetches) and Jackboxpedia (jackbox.wiki). The two wikis sometimes disagree, and each conflict is flagged where it occurs. Search results also surfaced a "Quiplash Deluxe" page on dreamfiction.fandom.com with similar-looking numbers. That is a fan-fiction game, not a real Jackbox product, and it is excluded here; anyone re-checking these sources should ignore it.

Versions and release dates:
- Quiplash (standalone, $9.99): June 30, 2015
- Quiplash XL (Party Pack 2): October 13, 2015
- Quiplash 2 (Party Pack 3): October 18, 2016
- Quiplash 2 InterLASHional (standalone): April 8, 2020
- Quiplash 3 (Party Pack 7): October 15, 2020

Sources: [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series)) and [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash).

## 1. Round structure, prompt assignment, and odd player counts

### Takeaway
Every version has three rounds. In Rounds 1 and 2 each player answers 2 prompts, and each prompt goes to exactly 2 players, so every prompt becomes a head-to-head matchup that the other players and the audience vote on. This works for any player count from 3 to 8, odd or even. Only Quiplash 3's pair-based final round (Thriplash) needs a filler opponent for odd counts: Schmitty (the host) plays against the player in last place after Round 2.

### Cited Findings
- In Rounds 1 and 2, "players must give an answer to two prompts in the allotted time." When both answers to a prompt are shown, "players and audience members choose one of the two answers, or they may not choose at all." The winner is "the player with the highest number of points (including any ties for the highest number) after three rounds." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Quiplash 1: "Each player receives two prompts on their device. Each prompt is also given to one other player." Round 2 uses different prompts and "double the points." — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash)
- Quiplash 2: Rounds 1 and 2 give every player "two prompts on their device to answer… with another player getting the same prompt as well." If the audience setting is on, the audience "will all collectively get one prompt of which they can write out whatever responses they want." — [Jackboxpedia: Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2)
- Quiplash 3: Rounds 1 and 2 are "a normal round of Quiplash: Players get two prompts on their device." The final round is the Thriplash. "When there's an odd number of players, Schmitty will go against the lowest scoring player at the end of the second round, with his answers always appearing on the left side of the screen." — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- In odd-numbered games, the player ranked last after Round 2 is "chosen to quip against Schmitty himself (with Schmitty simply answering with a pre-written response, even on player-made prompts)." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Schmitty "will appear as any of the 16 avatars that aren't currently being used by a player, with an added beard and moustache." — [Fandom: Schmitty](https://jackboxgames.fandom.com/wiki/Schmitty)
- All versions: 3-8 players, plus an audience. — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series)); [Jackbox: Quiplash 3](https://www.jackboxgames.com/games/quiplash-3)
- Listed play time is 15 minutes (official). — [Jackbox: Quiplash 3](https://www.jackboxgames.com/games/quiplash-3); [Jackbox: Quiplash 2 InterLASHional](https://jackboxgames.com/quiplash-two-interlashional)

### Inferences
- The counting follows from the rules. With N players, each answering 2 prompts and each prompt shared by 2 players, there are 2N ÷ 2 = N prompts, and therefore N matchups, per round. A ring assignment produces this for any N ≥ 3: arrange the players in a circle, and prompt i goes to players i and i+1 (mod N). Each player then meets two different opponents per round. Jackbox has not published its algorithm; the ring is simply the minimal structure that satisfies the stated rules.
- That same arithmetic is why odd counts need no special handling in Rounds 1 and 2, and why only the pair-based Thriplash (N/2 matchups) needs Schmitty when N is odd.
- Nobody votes on their own matchup: the voters for each matchup are the N−2 players who are not in it, plus the audience. This fits the wiki wording "the other players and the audience." So a 3-player game has only 1 player voter per matchup, which makes a sweep (Quiplash) trivial. That is probably why the sweep achievements specify 5+ players (see Section 3).
- For an adaptation, Rounds 1 and 2 total N matchups × 2 rounds = 2N reveal/vote cycles. With 8 players that is 16 matchups before the final.

### Gaps
- Jackbox has not published how it assigns prompts or opponents (random ring or something else, and whether it avoids repeat pairings between rounds). No source found.
- How Quiplash 3 pairs players for the Thriplash (by score, randomly, or otherwise) is not documented, apart from the odd-count Schmitty rule.
- No source states whether the audience's single collective prompt (Quiplash 2) earns points or shows up in the main game.

## 2. Final round formats across versions and how final-round voting works

### Takeaway
- Quiplash 1 and XL ("The Last Lash"): every player answers one shared prompt. Each player then has 3 votes to give out (they can be stacked on one answer); each audience member has 1 vote. A pool of 3,000 points is split by vote share.
- Quiplash 2 and InterLASHional ("The Last Lash"): the prompt is one of three special types: Acro-Lash, Comic-Lash, or Word-Lash. Players vote by giving gold, silver, and bronze medals to 3 different answers (only gold and silver in 3-4 player games); the audience gets 1 vote each.
- Quiplash 3 ("Thriplash"): the shared final prompt is replaced by head-to-head pairs. Each player writes 3 answers to one prompt, and voters pick the better set of three. Points are worth more than in Rounds 1 and 2.

### Cited Findings
- Quiplash 1 and XL: "in the final round, all players answer the same prompt. Then each player gives three of their votes (you can give them both for one option, distribute them or a combination of both); each audience member has only one vote. After that, all players divide 3000 points according to the formula '1% of those who voted = 30 points'." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Jackboxpedia's description of the Quiplash 1 Last Lash also says players "can give three separate answers or group them on the same answer." It says the 3,000-point pool "is distributed as a percentage to every player." It also gives a reveal order: "Answers with the fewest votes are shown first, and those with the most are shown last." It conflicts with Fandom on the audience: Jackboxpedia says "Each Audience member casts three individual votes," while Fandom says one. — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash); compare [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- A Quiplash 1 achievement, "He Who Lashes Last...," is earned by getting "70% or more of the votes in the Last Lash." This confirms that Last Lash results are measured as a percentage of votes. — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Quiplash 2 Last Lash types:
  - Acro Lash: "Come up with an acronym for a series of three letters."
  - Comic Lash: "Finish a comic strip."
  - Word Lash: "Come up with a clever sentence that includes a certain word."

  "Players must choose the three best answers, awarding a gold, silver and bronze medal respectively; in 3 or 4 player games, you only have to award gold and silver. Audience members only have one vote. All players then receive points based on the voting results." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Jackboxpedia gives more detail on the formats:
  - Acro-Lash: three letters plus a prompt asking players to "create a name… using those letters."
  - Word-Lash: "A random word appears on screen, and players must insert it into the sentence or prompt given."
  - Comic-Lash: "An unfinished comic appears, usually with a character asking a question. Players fill in the blank speech bubble."

  It also says each player awards "a gold, silver, and bronze medal respectively to three separate answers." — [Jackboxpedia: Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2)
- In Quiplash 2's user-generated-prompt mode, custom prompts "do[] not apply for The Last Lash, which as usual will always be one of the three above-mentioned prompt types." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- InterLASHional achievement "Those Who Lash Last": "Play every Final Round question type." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Quiplash 3 (official): "Thriplash" prompts "ask players to enter three responses instead of one." — [Jackbox: Quiplash 3](https://www.jackboxgames.com/games/quiplash-3)
- Quiplash 3: "rather than everyone answering one prompt, players are given a prompt that they must give three answers to. As usual, the other players and the audience must decide which set of three are the funniest." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- In the Thriplash, "the safety quip is unavailable." — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- Quiplash 3 achievements confirm that Quiplash and Super Quiplash results exist in the final round: "Schmitty Schmackdown" (get a Quiplash against Schmitty in the Final Round) and "The Best for Last" (get a Super Quiplash in the final round). — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Player-written guide (low authority; the Steam guide was later removed for a guidelines violation): Thriplash answers are revealed in order, so writers build up, with the 3rd answer as the punchline. — [Steam guide: The Art of Being Funny in Quiplash 3](https://steamcommunity.com/sharedfiles/filedetails/?id=3735560271)

### Inferences
- "No self-voting" in the final round is not stated explicitly for the Quiplash 1 or Quiplash 2 Last Lash. It is very likely, because voting everywhere else excludes a player's own answer, but treat it as unconfirmed.
- In the Quiplash 2 Last Lash, medals must go to 3 *different* answers. This contrasts with Quiplash 1 and XL, where all 3 votes can be stacked on one answer. That is a real design difference: stacking lets one answer get an overwhelming share; medals force a ranking.
- In Quiplash 3, the Thriplash appears to be the only final round, replacing the shared Last Lash. So "everyone answers one prompt and players distribute multiple votes" applies to Quiplash 1, XL, 2, and InterLASHional, but not to Quiplash 3.

### Gaps
- No source found gives medal point values for gold, silver, and bronze in Quiplash 2, or the Last Lash point pool for Quiplash 2.
- How the Quiplash 2 audience's single vote converts to points is not documented.
- Whether the Thriplash is judged as one vote on the whole set of three (wiki wording: "which set of three are the funniest") or one vote per answer is not explicit. The wording suggests one vote per matchup on the whole set.

## 3. Scoring: points per vote, multipliers, Quiplash bonus, Jinx, winner bonus, scoreboard

### Takeaway
- Points come from each answer's percentage of the votes cast in its matchup, not from raw vote counts. Because of that, scores stay on the same scale whether there are 3 voters or 10,000 audience members.
- Round 1: the Fandom wiki's formula is "1% of votes = 10 points," plus a 100-point bonus for winning the matchup (Quiplash 3 wiki: max 1,000 per prompt).
- Round 2: doubled (2,000 maximum).
- Final round: Quiplash 1 and XL split a 3,000-point pool at 30 points per 1%. The Quiplash 3 Thriplash has a reported maximum of 6,000 per prompt.
- A sweep is a "Quiplash" (bonus). A sweep with more than 90% of the audience is a "Super Quiplash."
- Identical answers are a "JINX": nobody scores.
- An answer that is missing or censored gives the opponent all the points.

### Cited Findings
- Fandom series page (applies to the series generally; the version is not specified):
  - "In the first round, points are awarded according to the formula '1% of those who voted = 10 points' + a bonus of 100 points for winning. In the second round, these values are doubled."
  - "A player will get a 'Quiplash' if all the players and more than half of the audience voted for their quip. The reward is an additional 250 points instead of 100. If more than 90% of the audience votes for the quip, then it's a 'Super Quiplash'."
  - "If both players wrote exactly the same answer, the prompt is declared a 'JINX' and neither of the players get points."
  - "If a player does not give an answer to the prompt in time, or their answer got censored by moderation or manually, then their opponent will get all the points by default."

  — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Quiplash 1 (Jackboxpedia), a different description:
  - "The player with more votes receives a larger percentage of the round's point pool, plus a winner bonus worth 10% of that pool."
  - "A tie splits the points."
  - A Quiplash happens "when a player sweeps all votes," and the player receives "a large majority or all of the points, plus a 25% bonus."

  — [Jackboxpedia: Quiplash](https://jackbox.wiki/wiki/Quiplash)
  - These figures fit the Fandom numbers if the pool is 1,000 per prompt: a 10% winner bonus is 100, and a 25% Quiplash bonus is 250. The two wikis agree on that reading.
- Quiplash 2 (Jackboxpedia):
  - The winner "earns a percentage of points equal to the total amount of votes they received on their answer."
  - A sweep "earn[s] a Quiplash and keeps all the points to themselves, plus a 100- (in Round 1) or 200-point (in Round 2) bonus."
  - "In the case of a jinx… neither player earns any points."

  — [Jackboxpedia: Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2)
  - Conflict: Jackboxpedia gives the Quiplash bonus as 100 (Round 1) and 200 (Round 2), while Fandom gives 250 (in place of the normal 100 winner bonus). Jackboxpedia's 100/200 may actually describe the ordinary winner bonus. Unresolved.
- Quiplash 3 (Jackboxpedia):
  - "Points are based on the percentage of voters who likes your answers. The maximum of points players can receive in this round for each prompt is 1,000 for 100% of the votes."
  - Round 2: "the points are doubled… 2,000 for 100% of the votes."
  - Thriplash: "The points are tripled in this round… The maximum amount… for each prompt is 6,000 for 100% of the votes."

  — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
  - Internal inconsistency: 6,000 is 3× the Round 2 maximum, or 6× the Round 1 maximum, so "tripled" most likely means relative to Round 2. Also, the 1,000 "maximum" leaves out the Fandom wiki's +100 winner bonus or +250 Quiplash bonus. Either Quiplash 3 folds the bonuses into the 1,000, or the wiki is imprecise. Unresolved.
- Quiplash 1 and XL final round: a 3,000-point pool at "1% of those who voted = 30 points," which is 3× the Round 1 rate. — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- When a Quiplash counts:
  - Quiplash XL achievement "Quip Tease": "Get a Quiplash (sweep votes in a 5+-player game)."
  - InterLASHional "Quip It Good": "Get a Super Quiplash! (all player votes and 90% audience votes in a 5+ player game)."
  - Quiplash 3 "Domination": "Get a Quiplash on every answer in Rounds One, Two and Three."

  — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Quiplash 3 has a dedicated graphic for when nobody votes in a matchup ("Red, Blue, and Coffin when nobody votes"). — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Secondary sources agree that points come from vote share, double in Round 2, and triple in Round 3, with bonuses for a majority and a bigger bonus for a unanimous "Quiplash." They give no exact values. — [Windows Central review](https://www.windowscentral.com/quiplash-review); [Mechanics of Magic: Judging Game: Quiplash](https://mechanicsofmagic.com/2022/04/22/judging-game-quiplash/)
- Original-game review: the vote timer "doesn't automatically zero out once all the votes are cast." — [Shacknews review](https://www.shacknews.com/article/90364/quiplash-review-just-add-people-and-lash-away)

### Inferences
- Worked example under the Fandom formula, for a Round 1 matchup with 10 voters split 7-3:
  - The winner gets 70% × 10 = 700, plus the 100 winner bonus, for 800.
  - The loser gets 300.
  - If it is 10-0 (with the audience majority condition met), it is a Quiplash: 1,000 + 250 = 1,250.
  - In Round 2, all of these values double.
- How player and audience counts scale: because points come from vote *percentage*, a 3-player game (1 voter per matchup) and a game with 10,000 audience members produce scores of the same size. This also explains why sweeps in very small games are trivially easy, which the achievements address by requiring 5+ players. The Quiplash condition ("all the players and more than half of the audience") lets a few votes from a large audience fail to block a sweep without ignoring the audience entirely.
- Fandom's description ("all the players and more than half of the audience") suggests player votes and audience votes are weighed as separate blocs for the Quiplash test. Whether they are also weighted differently in the percentage calculation is unknown. One secondary source suggests audience votes count for fewer points (see Gaps).
- A tie at 50/50 presumably gives no winner bonus ("A tie splits the points"), so each player gets 500.
- Scoreboard: no source describes exactly how the scoreboard is shown. From the round structure, scores are shown between rounds, and the Quiplash 3 "Worst to First" achievement refers to the standings "at the end of either the First or Second Rounds." This is inferred, not documented.

### Gaps
- No official Jackbox source publishes any scoring formula.
- The audience's exact weight in the percentage is unconfirmed. A secondary source summary said audience votes "don't decide which player's quip wins, but they still give… a smaller number of points"; I could not verify this against a primary page. — [Mechanics of Magic](https://mechanicsofmagic.com/2022/04/22/judging-game-quiplash/) (unverified)
- The exact Quiplash and Super Quiplash bonus values per version are unresolved. Fandom says +250 in place of +100. Jackboxpedia's Quiplash 2 page says +100 or +200 by round. No source gives a separate Super Quiplash value.
- Medal values in the Quiplash 2 Last Lash, and the Quiplash 2 final-round pool, are not found.
- The Thriplash's 6,000 maximum and the bonus handling are not independently confirmed.

## 4. Safety quips

### Takeaway
Safety quips were added in Quiplash 2: the game fills in a canned answer, which scores half points. In Quiplash 3 the canned answer is related to the prompt. Safety quips cannot be used in the Quiplash 3 final round. Quiplash 1 and XL have no safety quip.

### Cited Findings
- "Introduced in Quiplash 2 is a Safety Quip option, which provides half points and inserts a random submission as the answer." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- In Quiplash 3, "the Safety Quip was reworked in this game to answer with something decently related to the prompt. However, half points still apply." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Quiplash 3: "a safety quip is worth half of the received points"; in the Thriplash "the safety quip is unavailable." — [Jackboxpedia: Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- A player guide likewise says it gives a free answer that will "only give you half the points." — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3735560271)
- A safety quip can still win, and can even sweep:
  - InterLASHional achievement "Safety Dance": "Win a battle with a Safety Quip."
  - Quiplash 3 "Safety Net": "Got a Quiplash with a safety quip."

  — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))

### Inferences
- Half points most likely means the safety-quip answer's vote-share points (and probably its bonuses) are halved. The opponent's points appear unaffected.
- Safety quips are clearly a per-prompt button. No source gives a per-game limit.

### Gaps
- How many safety quips are allowed per game or per round is not documented. No source states a limit.
- No source says whether a timeout automatically submits a safety quip. Fandom says no answer in time means "their opponent will get all the points by default," which implies there is no automatic safety quip.

## 5. Timers and timeout behavior

### Takeaway
No source states exact answer or vote timer lengths for any version. What is documented:
- An "extend the timer" option has existed since Party Pack 2.
- Each Round 1 and 2 writing phase gives a single "allotted time" for both of a player's prompts.
- Failing to answer (or being censored) gives the opponent all the points.

### Cited Findings
- Rounds 1 and 2: players answer "two prompts in the allotted time. Once all the players give their answers o[r] after the response timer runs out, the players' 'quips' are revealed." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Timeout or censorship: "If a player does not give an answer to the prompt in time, or their answer got censored by moderation or manually, then their opponent will get all the points by default." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Party Pack 2 (Quiplash XL) introduced "The ability to extend the timer" and the Family Friendly setting. — [Fandom: The Jackbox Party Pack 2](https://jackboxgames.fandom.com/wiki/The_Jackbox_Party_Pack_2)
- Original Quiplash: the vote timer does not end early when all votes are in. — [Shacknews review](https://www.shacknews.com/article/90364/quiplash-review-just-add-people-and-lash-away)

### Inferences
- The writing timer appears to cover the whole round, not each prompt: one "allotted time" for both prompts, and reveals start when everyone is done or time runs out.

### Gaps
- Exact seconds for the answer phase, the voting phase, and the extended-timer multiplier are not confirmed by any official or wiki source. A low-authority blog's "about 60 seconds" is not trustworthy and is excluded. Measuring these would need gameplay video timing.

## 6. Player limits, audience, settings and options

### Takeaway
- Players: 3 to 8 in all versions.
- Audience: up to 10,000 since Party Pack 3 (Quiplash 2). Quiplash XL in Party Pack 2 allowed 200.
- Settings by version:
  - Family Friendly and extended timers: Party Pack 2 onward.
  - Manual censoring: Party Pack 3.
  - "Make Your Own" user-generated prompt episodes, with shareable 7-digit codes: Quiplash 2.
  - Content moderation through mod.jackbox.tv, a profanity and hate-speech filter, and character selection: Quiplash 3.
- InterLASHional adds French, Italian, German, and Spanish, with 100 extra prompts each.

### Cited Findings
- "3 to 8 players can join the game and 10,000 players can join the audience." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Official pages for Quiplash 3 and InterLASHional: 3-8 players, audience 10,000, 15 minutes, ESRB M, and settings labelled "Family Friendly Setting" and "Moderation Settings." — [Jackbox: Quiplash 3](https://www.jackboxgames.com/games/quiplash-3); [Jackbox: Quiplash 2 InterLASHional](https://jackboxgames.com/quiplash-two-interlashional)
- Party Pack 2 (Quiplash XL): "Up to 200 people can join the audience"; it "is the first Party Pack to include audiences and the Family Friendly setting." — [Fandom: The Jackbox Party Pack 2](https://jackboxgames.fandom.com/wiki/The_Jackbox_Party_Pack_2)
- Party Pack 3 (Quiplash 2): "Up to 10,000 people can join the audience if permitted," "The option for manual censoring," and "Twitch Log-in." It was the first pack with the 10,000 cap. The official blurb mentions "the new Make Your Own mode." — [Fandom: The Jackbox Party Pack 3](https://jackboxgames.fandom.com/wiki/The_Jackbox_Party_Pack_3)
- Quiplash 2 custom games: "Once all players are in the game, they will then come up with their own prompts for other people to answer." "Custom games can be saved to the user's system and played again later, and even generate a unique 7-digit code so that other people can access it." There are also official bonus episodes playable by code; for example, the Fourth of July episode code is CEH-LGQH. — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series)); [Jackboxpedia: Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2)
- Party Pack 7 (Quiplash 3):
  - "All games have the function of reading the room code."
  - "Moderators who know a special 5-digit code can visit the site https://mod.jackbox.tv/ and view the text… sent by the players."
  - It was the first pack with moderation that "allows moderators to check and deny player responses before their reveal."
  - Quiplash 3 also has "security, moderation and the character selection feature," with 16 avatars.

  — [Fandom: The Jackbox Party Pack 7](https://jackboxgames.fandom.com/wiki/The_Jackbox_Party_Pack_7); [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Official, Quiplash 3: "an optional filter" blocks profanity and hateful speech before responses reach moderation. — [Jackbox: Quiplash 3](https://www.jackboxgames.com/games/quiplash-3)
- InterLASHional is "quintilingual" (EN-US, FR, DE, IT, ES), adding 100 extra prompts each in French, Italian, German, and Spanish. — [Jackbox: Quiplash 2 InterLASHional](https://jackboxgames.com/quiplash-two-interlashional); [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Quiplash XL is the same game as Quiplash but "contains more prompts, including Quip Pack 1 by default." — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))
- Newer releases:
  - Party Pack 11 (October 23, 2025) has five new games and no sequels; there is no Quiplash 4. — [FinalBoss.io](https://finalboss.io/jackbox-party-pack-11-locks-in-october-date); [Game Developer](https://www.gamedeveloper.com/press-release/jackbox-games-launches-the-jackbox-party-pack-11)
  - Party Pack 12 (announced for October 15, 2026) contains We Forgot a Card, MegaPals, Idol Factions, Debate & Switch, and Hyperface; there is no Quiplash. — [Jackbox blog](https://www.jackboxgames.com/blog/here-are-all-5-games-in-the-jackbox-party-pack-12); [Stevivor](https://stevivor.com/news/jackbox-party-pack-12-games-detailedwe-forgot-a-card-megapals-idol-factions-debate-and-switch-hyperface/)
  - The Fandom wiki also notes Quiplash 3 being offered as the first title in The Jackbox Party Starter. — [Fandom: Quiplash (series)](https://jackboxgames.fandom.com/wiki/Quiplash_(series))

### Inferences
- As of November 2026, Quiplash 3 (2020) remains the latest mainline Quiplash; I found no Quiplash 4 or new variant.
- For a medical-humor adaptation, the Quiplash 3 combination is a useful baseline for safety with user-generated content: an optional automatic filter, then a human moderator queue, then a host's manual censor. A censored answer forfeits the matchup to the opponent.

### Gaps
- Whether "hide room code" is a named setting in Quiplash specifically is not confirmed. The Party Pack 7 note says only that games can read the room code aloud.
- The full in-game settings lists for each version, with exact names (for example audience on/off, the US-centric prompts filter, and the extended-timer value), were not retrievable from accessible sources.
