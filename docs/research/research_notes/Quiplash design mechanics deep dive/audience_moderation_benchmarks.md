# Quiplash: Audience Mode, Moderation/Anti-Griefing, Player Sentiment, Session Benchmarks, and Free Browser Alternatives

Research date: 2026-11-19. Sources fetched directly unless noted. Fandom (jackboxgames.fandom.com) returned HTTP 402 and the Jackbox support center returned HTTP 403 to automated fetches, so a few claims rely on search-result snippets of those pages. Those are flagged "(snippet)".

## 1. Audience mode: joining, vote weighting, limits, and effect on streams

### Takeaway
Quiplash was built for streaming. Since the original 2015 release, 3–8 "core" players compete and an audience of up to 10,000 joins at jackbox.tv with the same room code and votes. Most audience members get one vote, and in Quiplash 2 they can optionally submit one collective answer per round. Jackbox publishes no rule for how audience votes are weighted against player votes, and the two fan wikis disagree, so treat any "audience counts as a fixed block" claim as unverified.

### Cited Findings
- **Scale and joining (original Quiplash, 2015):** "Up to 10,000 people can play in a single round, and only one person needs to own the game." Players go to jackbox.tv on any internet-connected device and enter the code shown on the host's screen. Three to eight core players compete, and everyone else is the voting audience. Earlier Jackbox games capped the audience at 100. Launch price was $10. — [Engadget, 2015-06-30](https://www.engadget.com/2015-06-30-quiplash-10000-players-twitch.html)
- Streamers share the code on stream and invite Twitch viewers. Audience votes decide head-to-head winners: more votes means a higher score, and winning every available vote earns a "Quiplash." — [Engadget](https://www.engadget.com/2015-06-30-quiplash-10000-players-twitch.html)
- **Audience setting:** under SETTINGS > GAMEPLAY, "AUDIENCE: Turn ON to allow non-contestants to join and affect the game." — [Jackbox blog, "So You Want To Stream Jackbox"](https://www.jackboxgames.com/blog/so-you-want-to-stream-jackbox)
- **Official per-game audience matrix:** In Quiplash, Quiplash 2, Quiplash 2 InterLASHional and Quiplash 3, the audience can vote on player content. In none of them can the audience award "likes." Audience text submission is "No" in Quiplash 1 and Quiplash 3, and "Yes*" in Quiplash 2 and InterLASHional, where "*Audience Play-Along can be enabled." Jackbox: "Your overflow friends can still play along as members of the audience," and "most of our games are suitable for 3-8 players." — [Jackbox, "How Audience Play-Along Differs In Each Jackbox Game"](https://www.jackboxgames.com/how-audience-play-along-differs-in-each-jackbox-game)
- **Quiplash 2 Audience Play-Along:** when on, "Audience members collectively write responses to one prompt during the first and second round writing stages." The audience also votes in head-to-heads. — [Jackboxpedia, Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2)
- **Scoring is share-of-vote, not per-vote (Quiplash 3):** Round 1 awards points by the percentage of voters who chose an answer, up to 1,000 per prompt at 100%. Round 2 doubles that (max 2,000). Thriplash triples it (max 6,000 per prompt). A Safety Quip is "worth half of the received points." — [Jackboxpedia, Quiplash 3](https://jackbox.wiki/wiki/Quiplash_3)
- **Quiplash 2 scoring:** the winner earns points equal to the percentage of total votes received. A sweep ("Quiplash") adds a bonus of 100 in Round 1 or 200 in Round 2. A "Jinx" (identical answers) scores 0. — [Jackboxpedia, Quiplash 2](https://jackbox.wiki/wiki/Quiplash_2)
- **Audience and the Quiplash bonus (original):** a Quiplash needs all players *and more than half of the audience*. Some versions award a "Super Quiplash" when more than 90% of the audience votes for an answer. — Fandom Quiplash (series) page (snippet), via search; [Jackboxpedia, Quiplash](https://jackbox.wiki/wiki/Quiplash)
- **Final-round vote allocation (original Last Lash):** "the first 8 participating players get three votes and the audience all only get one." Points come from a 3,000-point pool where "1% of those who voted = 30 points." — Fandom (snippet). **Contradicted by** [Jackboxpedia, Quiplash](https://jackbox.wiki/wiki/Quiplash), which says audience members also cast three individual votes.
- One blog says audience votes "do not factor into which player has the most points." This conflicts with the wikis and with Engadget's description, so it is likely wrong or applies only to some modes. — search result from [mechanicsofmagic.com](https://mechanicsofmagic.com/?p=7218) (snippet)
- **Streams:** Jackbox recommends Extended Timers "to compensate for possible stream delays." Timers can be changed mid-game, but player count cannot. — [Jackbox, Party Pack 8 streaming features (2021-09-22)](https://www.jackboxgames.com/streaming-moderation-accessibility-features-jackbox-party-pack-eight/)

### Inferences
- Scoring is a percentage of all votes cast, and the audience can be thousands of people while players are at most 8. So when an audience is present, audience preference effectively decides the scores on stream unless the game normalizes audience votes in a way not documented here. For our game, an explicit, published rule (for example, "audience = 1 block worth X% of the pot," or audience scores tracked separately) would be clearer and harder to manipulate than Jackbox's opaque approach.
- Audience text submission, as in Quiplash 2's single collective prompt, is rare in later Jackbox titles. Quiplash 3 dropped it, probably because unmoderated text from thousands of people is a moderation burden. This is my inference, not something Jackbox stated.
- The same join flow for players and audience (one URL plus a 4-letter code) is a core reason Quiplash spread on Twitch.

### Gaps
- No official Jackbox document states how audience votes are weighted against player votes in Quiplash 2 or 3 (raw count, normalized block, or capped share). The fan wikis conflict, and the "audience counted as a block worth a fixed share" model from the brief could not be verified.
- The 10,000 limit is confirmed for the 2015 original. I found no current official per-title figure for Quiplash 3 or the Party Starter versions.
- No data on what share of real sessions use an audience.

## 2. Moderation, safety, and anti-griefing

### Takeaway
Jackbox's safety stack grew in layers. Over 2017–2022 it added manual censoring by the VIP or host, Twitch-login requirement, room locking, passworded rooms, and room-code hiding. In 2020 (Quiplash 3 / Party Pack 7) it added pre-display moderation at mod.jackbox.tv and an automatic word filter. Kicking players came in 2022 (Party Pack 9). Jackbox itself says these tools are imperfect, and a public script shows that 4-character room codes can be brute-forced to find open, passwordless rooms.

### Cited Findings
- **June 4, 2020 announcement (Evan Jacover):** Quiplash 3 gets "full content moderation that will allow streamers and/or mods to reject content _before_ it is ever seen by anyone else." Moderators work from a separate view without joining as players. Party Pack 7 adds automatic filtering: "certain words or phrases will automatically get rejected," which the developers say won't catch everything. Previously shipped measures: manual censoring, Twitch login, and room locking. Admissions: "We've heard from too many streamers who have flat-out quit playing Jackbox Games" over racist, sexist, homophobic and other toxic content, and it is still "far too easy to inject hateful messages into a game, especially on streaming platforms." — [Jackbox, "Combating Hateful Speech and Harassment"](https://jackboxgames.com/combating-hateful-speech-and-harassment-in-jackbox-games)
- **Current settings list (Nov 29, 2022, Luca Barranco):**
  - Profanity Filter (None / Moderate / Strict), which "Prevents offensive user-generated content from being inputted"
  - Moderation (manual review of UGC) in Party Pack 7–10, Party Starter, Naughty Pack, Survey Scramble
  - Kick Players in Party Pack 9, 10, Naughty Pack, Survey Scramble
  - Family-Friendly Filter, which removes suggestive *in-game* content but does **not** filter user-generated content
  - Require Twitch Login
  - Passworded Rooms (a unique password on top of the room code)
  - Room Code Hiding
  - Start Game from Controller
  - Player Limits

  It also warns that sharing a room code "allows for **anyone** to join." — [Jackbox blog, "Safety and Moderation: Streaming Jackbox Games"](https://www.jackboxgames.com/blog/safety-and-moderation-streaming-jackbox-games)
- **Kick feature (announced Aug 25, 2022; shipped with Party Pack 9 on Oct 20, 2022):**
  - Moderators kick through mod.jackbox.tv plus the room code.
  - In the lobby, anyone can be kicked, including the VIP, and a new VIP is assigned.
  - Mid-game, kicks are allowed only while the player count stays above the game's minimum. Kicked players stay visible but are disconnected and can't rejoin or submit.
  - Kicks are per-room only: a new room lets the player back.
  - Pairing with Require Twitch Login blocks a kicked Twitch user from rejoining that room.
  - Also returning: a "U.S.-Centric Content Filter."

  — [Jackbox, "The Ability To Kick Players…"](https://www.jackboxgames.com/the-ability-to-kick-players-and-other-new-features-coming-to-party-pack-9/)
- **Moderator workflow:**
  - Turn on under SETTINGS > CONTENT CONTROL ("Allow moderators to approve or reject input").
  - The MODERATION password changes each time moderation is toggled, but stays the same across a pack's games while it is on.
  - Moderators approve or deny each submission at mod.jackbox.tv and kick with a red "KICK?" button.
  - Too many kicks may force a restart to meet the minimum player count.
  - Jackbox recommends that public streams turn on FAMILY-FRIENDLY and MODERATION and set PROFANITY FILTER to STRICT.

  — [Jackbox blog, "So You Want To Stream Jackbox"](https://www.jackboxgames.com/blog/so-you-want-to-stream-jackbox)
- **Party Pack 8 (2021):**
  - Room code hiding in all five games
  - Extended Timers in all games; No Timer mode in Job Job ("All players must submit answers and votes to move on")
  - Profanity filter "Prevent[s] users from submitting words that include profanity or hate-speech"
  - Require Twitch "for extra verification"
  - Passworded Game, Start Game from Controller Only, Max Players

  — [Jackbox, PP8 features](https://www.jackboxgames.com/streaming-moderation-accessibility-features-jackbox-party-pack-eight/)
- **Manual censor (older games):** Party Pack 5's guide describes letting players "censor and remove objectionable content." A Steam discussion says the VIP can censor player-entered answers in some titles. — [Jackbox PP5 Streamer's Guide](https://jackboxgames.com/the-jackbox-party-pack-5-streamers-guide/) (snippet); [Steam discussion](https://steamcommunity.com/app/442070/discussions/0/358415206096190417) (snippet)
- **Twitch login trade-off:** requiring Twitch login "eliminates anonymity," and the server prevents a kicked Twitch user from rejoining that room. — Jackbox support "How does Moderation work" / "What if I encounter trolls" (snippets; [support link](https://support.jackboxgames.com/hc/en-us/articles/15794773430295-How-does-Moderation-work), [trolls article](https://support.jackboxgames.com/hc/en-us/articles/15794764378519-What-if-I-encounter-trolls-while-playing-Jackbox-Games-titles))
- **Room-code brute force ("room sniping"):** a public GitHub gist (`jackboxjoiner.py`, zmarffy) sends GET requests to `https://ecast.jackboxgames.com/room/<code>`. It joins any room whose JSON has `joinAs: "player"` and `requiresPassword: false`, using Selenium, as "A GHOST." It loops over 4-character codes with a 1-second delay and does not try passworded rooms. — [GitHub gist](https://gist.github.com/zmarffy/259fcd0b096c55cdcc525bd54615908c)
- **Critic feedback (2015):** Windows Central's original review argued the game "badly needs proper moderation features for Twitch broadcasting." — [Windows Central](https://www.windowscentral.com/quiplash-review) (snippet; page body would not load)

### Inferences
- **Code space is small (my arithmetic):** Jackbox describes room codes as four letters, so 26^4 = 456,976 codes. The gist's 36-character alphabet gives about 1.68M. Either way, a public room lookup API plus short codes lets a griefer find live, passwordless lobbies without ever seeing the stream. Defenses for our game: rate-limit the lookup endpoint, don't expose "is joinable / requires password" to anonymous callers, use longer or expiring codes, and lock rooms to players at game start.
- **Moderation is opt-in and staffed by humans.** Jackbox's best tool (pre-display approval) needs a human moderator per stream, which suits big streamers but not casual groups. The Family-Friendly filter covers only *authored* content, never player text. A medical-humor game will see lots of edgy player content, so:
  - Default to profanity filtering on, at a "moderate" level.
  - Run filtering server-side on answers **and player names**.
  - Offer a host "hide answer / hide name" tap.
- Kicks that only last for the room, plus anonymous joins, make re-entry easy. An identity requirement (Twitch login) is Jackbox's only durable ban mechanism.

### Gaps
- No official confirmation that Jackbox filters *player names* specifically. Sources describe the profanity filter as applying to "user-generated content" in general.
- I could not access support.jackboxgames.com directly (403) to confirm room-lock behavior after start (for example, whether late joiners become audience automatically), or whether the trolls article has more mitigations.
- No official statement on rate-limiting of ecast room lookups or on "Jackbox bombing" incidents. Evidence is limited to Jackbox's general admission and the public brute-force script.
- No Jackbox moderation feature is documented as "Moderation Mode" by that exact name. The feature is called "Moderation" in settings.

## 3. Player reviews and sentiment

### Takeaway
Players and critics consistently praise how simple, funny and stream-friendly Quiplash is, and how cheaply it scales through phones. Steam ratings run about 89–92% positive. Recurring complaints:
- It needs a group, with no matchmaking.
- Prompts and rounds feel repetitive or stale on replay.
- Final rounds are disappointing (Last Lash / Final Lash).
- Custom prompts are lacking (InterLASHional), plus translation issues and crashes.
- Moderation was weak, early on.

By Quiplash 3, some critics called it the weakest, safest game in its pack.

### Cited Findings
- **Quiplash 2 InterLASHional (Steam):** "Very Positive," 92% of 336 user reviews. — [Steam store](https://store.steampowered.com/app/1111940/)
- **Vaporlens analysis of InterLASHional Steam reviews:**
  - 354/388 positive (91.2%)
  - Positive themes: "Fun with friends and family, best party game"; "Funny, entertaining, and great for streaming"; "entertaining for hours"
  - Negative themes: "Spanish translation issues and lack of custom prompts"; "Game crashes and technical issues"; "Repetitive rounds and disappointing Final Lash"
  - Players with 0–2h playtime were the least positive (80%). Mid-game players (2–10h) were about 95% positive. Positive reviewers averaged about 11.5h playtime.

  — [Vaporlens, InterLASHional](https://vaporlens.app/app/1111940/quiplash_2_inter_las_hional/stats/details) (third-party aggregation; bucket numbers partly garbled at source)
- **Original Quiplash (Steam):** SteamDB shows about 89.6% positive from about 1,979 reviews. Vaporlens flags "requires multiple friends," "repetitive content," and server/connection problems. A user review says prompts get stale because "most people know what to say in these situation if they got a banger response." — [SteamDB](https://steamdb.info/app/351510/charts), [Vaporlens Quiplash](https://vaporlens.app/app/351510/quiplash/stats/analysis) (snippets via search)
- **No matchmaking / needs a group:** the most cited structural complaint. — [Vaporlens Quiplash](https://vaporlens.app/app/351510/quiplash.md) (snippet)
- **Group-dependent humor:** reviewers say the experience depends on who is playing ("with the right group of people, it's also hilarious"). — [God is a Geek review](https://godisageek.com/reviews/quiplash-review/) (snippet)
- **Quiplash 3 critic split (Party Pack 7, 2020):**
  - Screen Rant: "easily the worst of the bunch"
  - Fullsync: "still ends up being the weakest game on offer"
  - Bonus Stage: "the most over-the-plate, don't rock the boat addition to the series"
  - Shacknews: "an easy winner," because it adds to a successful formula
  - Geek Outpost: Thriplash makes it "the best iteration of the game yet"

  — [Screen Rant](https://screenrant.com/jackbox-party-pack-7-game-review/), [Fullsync](https://fullsync.co.uk/?p=26304), [Bonus Stage](https://www.bonusstage.co.uk/archives/177996), [Shacknews](https://shacknews.com/article/120987/the-jackbox-party-pack-7-review-more-exclusive-shindig), [Geek Outpost](https://geekoutpost.com/jackbox-party-pack-7-review/) (search snippets)
- **Last Lash formats (Quiplash 2):** Acro-Lash (fill an acronym), Word-Lash, Comic-Lash. Quiplash 3 replaced these with Thriplash (three answers per prompt, no Safety Quip). — [Jackboxpedia Q2](https://jackbox.wiki/wiki/Quiplash_2), [Jackboxpedia Q3](https://jackbox.wiki/wiki/Quiplash_3)
- **Jackbox writer philosophy (2019):** use funny words and absurd premises, mine painful personal memories, tailor prompts to events to create inside jokes, include prompts that spark real discussion, lean into crude humor, and ask questions the writers genuinely want answered. — [Jackbox, "The Science of Creating a Quiplash Prompt"](https://www.jackboxgames.com/blog/the-science-of-creating-a-quiplash-prompt)

### Inferences
- **What players love:**
  - Near-zero onboarding (phone plus code)
  - Short, punchy head-to-heads
  - Audience/stream spectacle
  - Humor that comes from your friends, not from the game

  **What goes stale:** the prompt pool (repeat sessions surface known prompts), formulaic "banger" answers, and final rounds that feel like a gimmick. The Vaporlens playtime pattern (first-session players least positive) suggests first-session friction, such as technical issues or a small group, hurts more than long-term repetition.
- **Inside-joke dependency cuts both ways for a medical theme.** Medical party card games are reviewed as funnier "for those in the medical field" (see section 5). Prompts should work for laypeople while rewarding clinicians.

### Gaps
- No direct Reddit r/jackboxgames thread data was fetched. Sentiment comes from Steam aggregators and critics.
- No Metacritic numeric scores captured for Quiplash 2 or 3 individually.
- No IGN, Polygon or PC Gamer Quiplash reviews surfaced in searches.

## 4. Benchmarks: session length, prompt counts, repetition, episodes, player count

### Takeaway
A Quiplash game is about 15 minutes for 3–8 players, with an audience optional. Each player answers 2 prompts in each of Rounds 1 and 2, then a final round. Official total prompt counts per version are not published in accessible sources. The only firm figures are "over 100 brand-new prompts" (Quiplash XL) and "100 NEW prompts in each language" (InterLASHional, 400 total). Quiplash 2's user-made Episodes allowed 64 prompts per episode and 120 characters per prompt.

### Cited Findings
- **Players and length:** 3–8 players, "15 Minutes" game duration, for both Quiplash 2 and Quiplash 3. — [Jackboxpedia Q2](https://jackbox.wiki/wiki/Quiplash_2), [Jackboxpedia Q3](https://jackbox.wiki/wiki/Quiplash_3)
- **Round structure:** Rounds 1 and 2 give each player 2 prompts, each paired against another player's answer to the same prompt. In Thriplash (Q3 final) every player writes 3 answers to one prompt. With an odd player count, the host character Schmitty fills in against the lowest scorer. — [Jackboxpedia Q3](https://jackbox.wiki/wiki/Quiplash_3)
- **Prompt counts:**
  - Quiplash XL "includes everything in Quiplash, Quip Pack 1, AND over 100 brand-new prompts"
  - Quiplash 2 InterLASHional added "100 NEW prompts in each language" (FR/IT/DE/ES), on top of Quiplash 2's English set
  - A Jackbox forum user reported Quiplash 2 does not repeat prompts from Quiplash XL

  — search results citing [Apple App Store, Party Pack 2](https://apps.apple.com/au/app/the-jackbox-party-pack-2/id1034034328?mt=12) and [Steam, InterLASHional](https://store.steampowered.com/app/1111940/)
- **Episodes (user-generated prompt packs, Quiplash 2):** a developer post set limits of 64 prompts per custom episode and 120 characters per prompt, and mentioned "50+ prompts on each episode" for official episodes. — search snippet referencing [Steam community, Party Pack 3 discussions](https://steamcommunity.com/app/434170/discussions/0/305509857561889566/)
- **Official episodes:** Jackbox released at least 11 official episodes as codes over social media: Halloween, Double Fine Quiplash, Travis McElroy Quips, Fourth of July, Back 2 School, Pumpkin Spice, TV Quiplash, Thanksgiving, Winter Episode, Valentine's Day, Bachelorette Party. — [Jackboxpedia Q2](https://jackbox.wiki/wiki/Quiplash_2)
- **Community episodes:** these still circulate on Steam Workshop-style guides (for example, "Quiplash 2 Custom Episode – Cliché Clash"). — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3178067118)
- **Critics on custom prompts:** InterLASHional Steam reviewers complained about "lack of custom prompts." Screen Rant, on Quiplash 3's lack of a custom question mode, said the group "may as well just use pen and paper." — [Vaporlens](https://vaporlens.app/app/1111940/quiplash_2_inter_las_hional/stats/details); [Screen Rant](https://screenrant.com/jackbox-party-pack-7-game-review/) (snippet)

### Inferences
- **Prompt consumption (my arithmetic):** an 8-player game uses about 8 head-to-head prompts in each of R1 and R2 (each prompt is shared by 2 players), plus 1 final, so about 17 prompts per game. With a pool of about 1,000 prompts, a group would start seeing repeats after a few dozen games if prompts are drawn without memory. Pools of only a few hundred go stale within 10–20 sessions. Estimate only.
- A ~15-minute game is a natural "one more round" unit. Sessions likely run several games, but I found no measured data on total session length or games per session.
- Custom/episode content is a strong demand signal (complaints when absent), and a cheap replayability lever for a niche theme like medicine (specialty packs: ER, surgery, nursing, med school).

### Gaps
- No authoritative total prompt count for Quiplash 1, 2, or 3. The "Quiplash 2 has over 1,000 prompts" figure from the brief is unverified.
- No official description of Jackbox's anti-repeat logic (for example, whether used prompts are tracked per device or install). The forum report of no XL/Q2 overlap is anecdotal.
- No data on how popular Episodes were (download counts) or why Quiplash 3 dropped them.
- No measured average session length or games-per-session telemetry.

## 5. Free-to-play browser alternatives and medical-themed party games

### Takeaway
The free browser party-game field (Gartic Phone, skribbl.io) is ad-funded, with no paywall. These games rely on shareable links or room codes, private rooms, and crowd moderation such as vote-kick. Several hobby open-source Quiplash clones and phone-controller frameworks exist, mostly unmaintained. Medical-humor party games exist only as physical card games, rated well by clinicians, and reviewers note the jokes don't land with outsiders. I found no digital, phone-controller medical party game.

### Cited Findings
- **Gartic Phone:** "free, with ads," on iOS, Android, and desktop. A roughly 30-second ad played before a round, and "the rest of the game ran ad-free after that." The App Store lists © Onrizon, seller Gartic Publicidade Digital LTDA (Brazil). A third-party estimate for Gartic.io puts revenue at "<$10K monthly," 100% ads, 0% IAP; this is an estimate for a sibling app. — [WhistleOut review](https://www.whistleout.com/CellPhones/Apps/gartic-phone-app-review), [App Store Gartic.io](https://apps.apple.com/app/id1270393677), [Apptopia](https://apptopia.com/ios/app/6476137674/about) (snippets)
- **Ad network:** AdinPlay markets ad inventory "across leading browser game titles such as paper.io, Gartic Phone & skribbl.io" (vendor marketing claim). — [AdinPlay](https://adinplay.com)
- **Gartic Phone room size:** a guide says up to 30 players per room, minimum 4. Another recommends 8–16 as best. A moderation toggle in Custom Settings generates a new invite link, per one unofficial guide (unverified). — search snippets ([lilachbullock.com](https://www.lilachbullock.com/online-multiplayer-party-games/), [gadgethacks](https://smartphones.gadgethacks.com/news/gartic-phone-halloween-party-game-how-to-set-up-a-round/))
- **skribbl.io:**
  - Free, with private rooms for friends and public rooms with strangers
  - Moderation is crowd-based: propose a kick in chat and "everyone can vote the person out"
  - The private-lobby host can set "Max Online Players" (value unverified)
  - An academic critical-play analysis argues the lack of robust moderation in open rooms lets negative behavior go unchecked

  — [CrazyGames listing](https://www.crazygames.com/game/skribblio), [protocol gist](https://gist.github.com/MrDiamond64/b2081f2cb4ca6d11e848edaeb5ae1814), [Mechanics of Magic critical play (PDF)](https://mechanicsofmagic.com/wp-content/uploads/2024/04/Skribbl-1.pdf) (snippets)
- **Open-source clones and frameworks:**
  - [simondiep/quiplash-js](https://www.github.com/simondiep/quiplash-js): JS recreation for 3–8 players
  - [khayyamsaleem/quiplash-clone](https://awesome.ecosyste.ms/projects/github.com%2Fkhayyamsaleem%2Fquiplash-clone): MongoDB-based, last push 2023
  - hunter-atk/Quiplash-Clone: D3 + WebSockets, 2018
  - [yodigi7 quiplash-clone](https://yodigi7.github.io/projects/quiplash-clone): Java Spring backend
  - Open Party Lab (Hartwich): an authoritative Socket.IO server, a Phaser host screen, and a React phone controller
  - [shone/phoneparty](https://github.com/shone/phoneparty): Go framework where each player joins via their phone browser, with a shared host screen
  - [happyfuntimes](https://www.npmjs.com/package/happyfuntimes) (npm): a phone-as-controller library

  Licenses and maintenance status are unverified, and most are stale. — sources as linked
- **Medical-themed party games:**
  - **DiagnosTHIS:** match diagnosis cards to symptom cards, dark humor, 4+ players, ages 17+. 4.3/5 from 24 reviews on Target; bought as nurse graduation gifts. — [Target](https://www.target.com/p/diagnos-this-card-game/-/A-94769181), [Pick Me Up Game blog](https://pickmeupgame.com/blogs/pick-me-up-blog/diagnos-this-the-ultimate-party-game-for-medical-mystery-lovers)
  - **What Do You Meme? Nurses Edition:** 300 caption cards and 75 photo cards, aimed at people who have been through nursing school. One reviewer's non-medical husband "didn't get the jokes." — [Lattes & Literature listing](https://lattesandliterature.com/products/what-do-you-meme-career-series-nurses)
  - **Quack in the Box:** medical-malpractice card game with "a lot of dark humor"; "really funny for those in the medical field more than for outsiders." — [GeekDad](https://geekdad.com/2011/04/quack-in-the-box-makes-medical-malpractice-into-a-game/)
  - **Code Brown:** billed as the first card game for nurses; now sold out/discontinued. — [Trusted Health](https://www.trustedhealth.com/code-brown)
  - **Doctors Against Tragedies:** a CAH-style medical deck releasing a sexual-health edition. — [The Gateway](https://www.thegatewayonline.ca/?p=61309)
  - **Trust Me, I'm a Doctor** (medieval quack cures, Red Flags/Superfight style), plus indie titles Dictation Errors and Hex-Ray on The Game Crafter (no reviews yet). — [Hobbyco](https://www.hobbyco.com.au/products/trust-me-im-a-doctor), [Game Crafter Dictation Errors](https://thegamecrafter.com/games/dictation-errors), [Game Crafter Hex-Ray](https://www.thegamecrafter.com/games/hex-ray)

### Inferences
- **Monetization norm:** browser competitors are ad-supported (a pre-round interstitial) with no paywall, and Jackbox's paid packs are the premium tier. A free medical-humor game would probably follow the pre-round-ad or sponsor model. Our niche could also support institutional or educational sponsorship (med schools, residency programs), but that is speculative.
- **Moderation norm in free games:** crowd vote-kick plus private rooms, and little pre-moderation. Jackbox's host- or moderator-driven tools are more mature. Combining both, with vote-kick for casual rooms and host approval for streamed rooms, covers both use cases.
- **Open market gap:** medical humor sells as physical gift-oriented card decks for clinicians and nursing grads. I found no browser or phone-controller medical party game, which suggests an open niche, but also an audience-breadth risk: outsiders don't get the jokes.

### Gaps
- No official developer statements on Gartic Phone or skribbl.io revenue, moderation policy, word filters, or exact room caps.
- Kahoot-style apps (Kahoot!, Blooket, etc.) weren't researched in depth. No pricing or room-cap figures captured.
- No sales figures for any medical party card game, and no digital med-school party or trivia game with reviews surfaced.
