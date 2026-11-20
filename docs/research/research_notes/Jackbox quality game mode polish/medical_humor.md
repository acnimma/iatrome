# Medical and healthcare humor for a two-audience party game (iatrome Normal + Pro)

Scope note: this goes deeper than `docs/research/reports/Party humor design research.md`, which already covers benign violation theory, the psychological distance/severity crossover (McGraw et al. 2012), the insider/outsider norm-commitment result, Jackbox prompt craft, and Wear et al. 2006 (med students joke about "fair game" patients). None of that is repeated here except where it is extended. Inventories in this file are flagged as **designer inventory (inference)** wherever they draw on general domain knowledge rather than a cited source. They are angles and situations, not finished jokes, and no source joke is reproduced as a prompt.

## 1. Shared, relatable healthcare experiences laypeople find funny

### Takeaway
Lay medical humor works best when the patient is the protagonist and the system is the antagonist. Shared, mildly humiliating, low-stakes experiences are the core material: waiting, paperwork, insurance, gowns, the dentist's questions, Dr. Google, pharmacy lines, and TV-drama expectations. There is survey data showing these experiences are near-universal, which is what makes them good prompt bait. Several have a built-in "everyone lies" or "everyone does it" angle (flossing, symptom googling) that gives players a safe confession to riff on.

### Cited Findings
- About 27% of US adults admitted lying to their dentist about how often they floss (2015 American Academy of Periodontology survey). Periodontists' reaction was that the figure seemed low; the AAP president's response was "Is that all?" — [NPR](https://www.npr.org/sections/health-shots/2015/06/24/417184367/are-you-flossing-or-just-lying-about-flossing-the-dentist-knows); [Scientific American](https://www.scientificamerican.com/article/one-fourth-of-americans-lie-to-dentists-about-flossing/)
- In the same survey, more than a third of people would rather do an unpleasant chore than floss daily, and 14% would rather clean the toilet — [NPR](https://www.npr.org/sections/health-shots/2015/06/24/417184367/are-you-flossing-or-just-lying-about-flossing-the-dentist-knows)
- Self-diagnosis online is common, though figures vary by survey: Pew found about 35% of US adults had gone online to figure out a medical condition, and nearly a third of those never sought a professional opinion. Commercial surveys report higher figures: 44% would rather self-diagnose online (Tinker Law Firm, n=3,000), 15% reported "cyberchondria" anxiety, and 65% had tried diagnosing themselves on Google with 74% of those saying it stressed them out (LetsGetChecked, n=2,140). The commercial surveys have conflicts of interest and unpublished methodology — [Becker's Hospital Review](https://www.beckershospitalreview.com/quality/survey-44-of-americans-self-diagnose-online-instead-of-visiting-medical-professional/); [Big Think](https://bigthink.com/health/googling-medical-symptoms/)
- Patient medical malapropisms are a long-running, well-documented humor genre that clinicians collect, for example "smiling mighty Jesus" for spinal meningitis, "very close veins" for varicose veins, "old-timer's disease" for Alzheimer's, "fireballs" for fibroids. Linguists Davis and Kenyon categorized them and stressed they happen regardless of education and can signal anxiety about a diagnosis. These specific examples are widely circulated and should not be reused verbatim — [Visual Thesaurus](https://www.visualthesaurus.com/cm/wordroutes/medical-misapprehensions); [The Hospitalist](https://the-hospitalist.org/hospitalist/article/123190/piece-eddie/2); [Harvard Medicine magazine](https://magazine.hms.harvard.edu/articles/speaking-terms)
- Retail pharmacy has its own comedy ecosystem built on the gap between what customers think happens ("why isn't it ready?") and the real steps (typing, insurance adjudication, labeling, verification). Pharmacy Times runs a recurring "sassy vs. polite pharmacist" format and "pet peeves" columns about drive-thru customers who treat staff as personal shoppers or ask for store items at the window — [Pharmacy Times: sassy pharmacist](https://www.pharmacytimes.com/view/sassy-pharmacist-and-polite-pharmacist-tackle-common-questions); [Pharmacy Times: drive-thru debacles](https://www.pharmacytimes.com/view/top-5-pharmacy-drive-thru-debacles); [Pharmacy Times pet peeves](https://www.pharmacytimes.com/view/pet-peeves-december-2020)
- Retail pharmacists describe the job as fast-food paced — [Mental Floss](https://www.mentalfloss.com/article/79615/12-behind-scenes-secrets-pharmacists)
- Patients are receptive to humor in clinical settings: a University of Stirling study found patients were about twice as likely as nurses to start and to return humor (reported secondhand) — [Chortle](https://www.chortle.co.uk/news/2014/01/16/19417/how_nurses_dont_get_humour)
- TV medical dramas are a shared reference point that clinicians publicly grade for realism. ER clinicians praised The Pitt (HBO Max, 2025 to 2026) for crowded waiting rooms, boarding, and staff emotional toll, and noted the classic TV omission: physician charting, which takes much of a real ER doctor's day. Season 2 made charting backlog a plotline — [Jewish Chronicle](https://jewishchronicle.timesofisrael.com/local-er-doctors-agree-the-pitt-gets-it-right-from-overcrowding-to-empathy/); [NPR](https://npr.org/2026/01/08/nx-s1-5671156/pitt-season-2-tv-show-medicine); [Penn Today](https://penntoday.upenn.edu/news/how-pitt-lands-penn-emergency-department-nurse); [WFAE](https://www.wfae.org/health/2026-04-13/9-things-the-pitt-gets-right-according-to-north-carolina-er-workers)
- The BMJ Christmas issue (since 1982) is the institutional model for "serious method, silly question" humor: rigorously done papers on topics like reindeer nose capillaries (Rudolph), sword-swallower injuries, champagne cork injuries, dropping chocolate bars to explain bone structure, Peppa Pig's Dr. Brown Bear setting unrealistic expectations, and a "number needed to dress" for doctor attire. It receives 100+ submissions a year and accepts a handful; editors describe the aim as "strangeness" — [NPR](https://www.npr.org/2023/12/25/1198908975/christmas-bmj-health-research); [Smithsonian](https://www.smithsonianmag.com/smart-news/the-best-of-the-british-medical-journals-goofy-christmas-papers-180948177/); [McGill OSS](https://www.mcgill.ca/oss/node/9769)

### Inferences
- The lay sweet spot is **the patient as underdog against the machine**. The jokes that work for families are about the waiting, the forms, the bill, the gown that ties in the back, the receptionist and the hold music. The patient's body is never the punchline. This matches the house rule and Flanary's "patients are at the bottom" test (see Q3).
- **"Universal small lies"** (flossing, "I drink socially", "I exercise sometimes", "I finished the antibiotics") are excellent because the player confesses or invents on their own behalf, so nobody is mocked. Prompts can invite the lie rather than shame it.
- **BMJ Christmas framing** is a great fit for the deadpan voice in trivia and fake-headline modes: real-sounding study methodology applied to a domestic absurdity (for example "a randomized trial of whether the waiting room clock moves slower"). It also fits the earlier report's finding that distance and hypothetical framing make things more benign.
- **Malapropisms** as a format should be about medical *jargon* being absurd (the system's language is the target), not about patients being dumb. Safest framing: "Invent a medical term that sounds like a pastry" or "What the doctor's Latin actually means", not "what a confused patient called it".

**Designer inventory (inference): lay situations and objects with comic potential**

*Booking and access*
- Phone tree with nine options, none of them yours; "please listen carefully as our menu options have changed" (they never have)
- Next available appointment is in 7 months; by then the symptom has retired
- Patient portal password rules stricter than a bank's; the portal message that says "you have a new message" and the message is that you have a message
- "Arrive 15 minutes early" then wait 50
- Being asked your date of birth by six different people in one visit
- Online check-in that still requires a clipboard
- Telehealth: doctor frozen mid-sentence; "can you see my rash?" camera angles; cat walks in
- Urgent care vs ER vs "nurse line says go to ER" decision tree

*Waiting room*
- The magazines (2019 golf magazine, a single page of a recipe)
- The TV stuck on a daytime channel nobody can change
- The person who coughs without covering and the silent seat rearrangement
- The fish tank; the kids' corner bead maze that adults secretly play with
- Being called by mispronounced name, or by a name close to yours
- "The doctor will be right with you" as a unit of time

*Exam room*
- The paper on the exam table that crinkles at full volume with every breath
- The gown: ties in back, two openings, no instructions, "is the opening front or back?"
- The second wait, alone, in the gown, in the cold room, reading the ear diagram poster
- Blood pressure taken right after you speed-walked from parking
- The scale: removing shoes, belt, earrings, emotional baggage
- "Any chance you could be pregnant?" asked to everyone including the 80-year-old
- The pain scale 1 to 10 with cartoon faces; nobody knows what a 7 looks like
- "Turn your head and cough"; the reflex hammer; "say ahh"
- Stirrups, the speculum warmed or not
- The doctor typing while you talk, facing the computer

*Dentist*
- Questions asked while hands and instruments are in your mouth
- The flossing interrogation and the bleeding gums snitching on you
- The suction straw that steals your tongue
- Novocaine face: drinking coffee afterwards, talking like a ventriloquist
- The tiny mirror, the bib chain, the "slight pressure" lie
- Dentist small talk about vacations while drilling
- The goody bag toothbrush; the sticker for adults
- Dental X-ray bite wing stabbing your gums; the lead apron as a weighted blanket

*Pharmacy*
- The drive-thru line that moves slower than walking in
- "It's not ready yet" / "Insurance hasn't approved it" / "We need to call your doctor"
- The receipt longer than your arm with the side effects list
- Side effects that include the symptom you're treating
- The pill bottle cap: childproof, adultproof, arthritis-proof
- Generic vs brand name; names that sound like Star Wars planets or Scandinavian furniture
- "Take with food", "do not take with food", "take with half a food"
- Pharmacist knowing your full medical history from your prescriptions

*Insurance and billing*
- Explanation of Benefits that explains nothing; "THIS IS NOT A BILL" followed by a bill
- Out-of-network surprises; the anesthesiologist who was out of network while you were unconscious
- Itemized charges: $40 for an aspirin, $12 for a tissue, charged for the gown
- Prior authorization: insurer deciding if your doctor is right
- Deductibles resetting January 1; the end-of-year rush to use benefits
- Hold music; "your call is important to us"
- Coding: the ICD-10 codes for being struck by a turtle, injured at an opera house (famous real codes; fine as trivia)

*Hospital stay*
- Being woken at 4 a.m. for vitals, then told to get some rest
- The IV pump alarm beeping for no reason
- Hospital food: jello, mystery broth, the tray cover reveal
- Visiting hours; the parking garage costing more than the hotel
- The whiteboard with your nurse's name and a smiley face
- The bed that inflates and deflates on its own; the call button that is also the TV remote
- Discharge taking 9 hours after "you can go home today"
- Hospital socks with grip treads (people keep them)
- The cafeteria at 2 a.m.; the gift shop balloons and stuffed animals

*Self-diagnosis and health culture*
- Googling a headache and landing on rare tropical disease
- Symptom checker results ranging from "drink water" to "you have days"
- Wellness influencers; supplements; detoxes; "my chiropractor said"
- Smartwatch telling you you're stressed, which stresses you
- Family group chat medical advice; grandma's remedies (Vicks for everything)
- Bringing printouts to appointments
- Doctor's handwriting (classic, slightly dated since e-prescribing; works as nostalgia)

*Kids and family*
- The pediatrician's sticker and lollipop bargaining
- Shots, and the parent who is more scared than the kid
- The "big boy band-aid"; band-aids as a cure for all injury
- Ear infections; lice notes from school; the thermometer wars

*TV medicine*
- Defibrillating a flatline (TV classic); everyone dating everyone in the on-call room
- Surgeons who also do the CT, the lab work and the diagnosis
- Dramatic monologues during CPR; the diagnosis always being the rare one
- "Clear!"; the "we're losing him" line; the slow-motion hallway walk

### Gaps
- No peer-reviewed study found that ranks which healthcare experiences laypeople find funniest. The inventory above is designer synthesis from the cited themes plus domain knowledge, not tested data.
- The Pew self-diagnosis figure is older; I did not locate the original Pew report in this pass. Commercial survey numbers should be treated as weak.
- No source on cafeteria or hospital food humor specifically, though it is a staple in inventory.

## 2. Insider humor clinicians share

### Takeaway
The strongest current insider comedy (Dr. Glaucomflecken is the field's defining example) runs on three engines: **specialty stereotypes** (ortho bro, alarmist derm, aloof ER doc, eager med student), **the system as villain** (insurance reps, prior auth, administrators, PBMs), and **the absurd tasks of the job** (charting, pages, EHR, waiting on consults). All three target clinicians themselves or institutions, never patients, and they also explain enough for lay viewers to follow. Night shift, caffeine, bladder-holding, the "Q word", and med students on rounds are the most-memed nursing and residency staples.

### Cited Findings
- Will Flanary (Dr. Glaucomflecken, ophthalmologist) built his following on insurance sketches: "It really did kick off with the insurance problems." He targets "institutions preying on people who are less powerful than them," medical education, journals and residency, and his own field (well-paid, under-worked ophthalmologists). His recurring format is a reasonable person confronting an absurd system in about 90 seconds — [STAT](https://www.statnews.com/2022/03/25/dr-glaucomflecken-will-flanary-profile/)
- His cast is built on specialty stereotypes: ER doctor always in cycling gear, studious pediatrician, alarmist dermatologist, meatheaded orthopedic surgeon, loyal scribe, psychiatrist who analyzes everyone; plus non-clinician villains: insurance rep "Jimothy", hospital administrator, pharmacy benefits manager. He says "there are very strong personality stereotypes in medicine that have existed throughout time" — [STAT](https://www.statnews.com/2022/03/25/dr-glaucomflecken-will-flanary-profile/); [AAOS Now](https://aaos.org/aaosnow/2025/feb/outofoffice/outofoffice01); [Texas Medicine](https://www.texmed.org/GoingViral/)
- Freakonomics describes the characters as highly specific stereotypes that draw on idiosyncrasies most laypeople may never have heard about, yet the work has a broad audience; a commentator called it "a very clever combination of explaining some complex things clearly and humorously" — [Freakonomics](https://freakonomics.com/podcast/the-comedian-ophthalmologist-will-see-you-now); [STAT](https://www.statnews.com/2022/03/25/dr-glaucomflecken-will-flanary-profile/)
- Fan-wiki reporting (weaker source) says his satire shifted from interpersonal specialty conflict toward the insurance system and for-profit medicine after his own cardiac arrest — [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Trivia/DrGlaucomflecken)
- Adam Kay's *This Is Going to Hurt* (2017) is gallows humor that crossed over to the general public: over two million copies sold and a Sunday Times No.1 bestseller for over a year, later a BBC/AMC series. Reviewers credit "a staccato series of wry anecdotes and punch lines" and note that it exposes a dysfunctional system that strains junior doctors — [Wikipedia](https://en.wikipedia.org/wiki/This_Is_Going_to_Hurt); [Irish Times](https://www.irishtimes.com/culture/books/this-is-going-to-hurt-by-adam-kay-1.3537331); [Chortle](https://www.chortle.co.uk/books/2017/09/07/37826)
- GomerBlog (founded 2013) is the main medical satire site, writing fake news about the profession in an Onion style (sample headline style: the CDC kicking America out of its practice) — [Media Bias/Fact Check](https://mediabiasfactcheck.com/gomer-blog). Note: the name "Gomer" is itself derogatory slang for a patient ("Get Out of My Emergency Room"); see Q3.
- Night-shift nursing humor staples in meme compilations: coffee as survival and running out treated as an emergency, ghost stories told to new nurses, "what day is it" night-shift brain, the "graveyard shift" pun, and a social life out of sync with daylight people — [Elite Learning](https://www.elitelearning.com/?p=289627); [Nurse.org](https://nurse.org/articles/best-nurse-jokes); [Nurseslabs](https://nurseslabs.com/nurse-memes/)
- Paramedics' dark humor tends to target "the events around the periphery" of a call rather than the harm itself, plus waiting and helplessness — [Paramedic qualitative study, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11610543/)
- The Pitt's realism praise from ER staff centers on systemic absurdities (crowding, boarding, charting burden), suggesting that 2025 to 2026 insider humor is again system-focused — [NPR](https://npr.org/2026/01/08/nx-s1-5671156/pitt-season-2-tv-show-medicine); [Chief Healthcare Executive](https://www.chiefhealthcareexecutive.com/view/the-pitt-remains-strikingly-authentic-as-second-season-nears-end)
- Pharmacist insider humor centers on prior auths, phone interruptions, drive-thru absurdity and staffing; a columnist says pharmacists face the same challenges after 40 years — [Drug Topics](https://www.drugtopics.com/view/pharmacists-face-same-challenges-after-40-years); [Drug Topics opinion](https://drugtopics.com/view/opinion-staffing-phone-lines-and-drive-throughs)

### Inferences
- **Specialty stereotypes are the richest Pro-mode vein**, because they punch at clinicians (equal-opportunity, self-deprecating) and produce identity-based answers (the derm player defends derm). Use them for "which specialty would..." prompts, would-you-rathers, and drawing prompts ("an orthopod doing delicate work").
- **Kay's crossover** suggests insider material lands with laypeople when it is (a) an anecdote with a clear setup, (b) about the clinician's suffering or the system's absurdity, and (c) needs no jargon to get the punchline. That is the test for whether a Pro prompt can be promoted to Normal.
- **System villains generalize across both modes.** Insurance reps and prior auth are hated by patients and clinicians alike, so they are the best "shared enemy" material for mixed tables.
- **Avoid GomerBlog-style naming** and patient slang (gomer, frequent flyer, train wreck, "status dramaticus") in game content. Even when insiders find them funny, they target patients.

**Designer inventory (inference): insider situations by discipline**

*Universal hospital life*
- The "Q word" (quiet) said aloud on shift; superstitions (don't eat before the shift, the full moon, "it comes in threes")
- Pagers in 2026 (still), the overhead page nobody can understand, the secure chat app that is less secure than a pager
- EHR: Best Practice Alerts on every click, the "are you sure?" pop-up for Tylenol, 47 clicks to order water, copy-forward notes, the note bloat, the login timeout mid-sentence, Epic vs Cerner tribalism, the "sign all" button
- Charting: "if it wasn't documented it didn't happen", charting at home, "pajama time", the inbox
- Mandatory annual modules (fire safety, hand hygiene, the same quiz again), badge readers that don't read badges, the Pyxis drawer
- Hospital administration: the new initiative with an acronym, the pizza party for morale, the wellness email ("have you tried yoga?") sent during a staffing crisis, "Press Ganey" scores, the consultant with a lanyard
- Hand sanitizer foam stations, the broken printer, the fax machine that is still the backbone of healthcare
- The cafeteria: closes when night shift arrives; the vending machine as dinner; drug-rep lunches; leftover cake in the break room as a currency
- Scrubs: color-coded by role and nobody remembers the code; scrub pockets with 14 pens, trauma shears, a tourniquet and a granola bar; the ceil blue vs navy debate; Figs
- Caffeine and bladder: not drinking water for 12 hours, not peeing for 12 hours
- Badge reels as personality; the stethoscope as status symbol
- Codes and huddles; "can we get a time-out?"
- The family member who is a "nurse" (worked as a CNA in 1996) or "does their own research"

*Physicians and residency*
- Specialty stereotypes: ortho (strong, loud, protein shakes), derm (hours, money, sunscreen), ophtho (light hours), ER (adrenaline, shift work), gen surg (sleep is weakness), IM (long notes, "consider"), family med (does everything), peds (stickers, kind), psych (reads the room), anesthesia (sits, crossword, "the patient is asleep and so am I" joke style), radiology (dark room, "clinical correlation recommended"), pathology (patients who never complain), neurology (localizes lesion, no treatment), rads vs ER over "wet reads"
- "Consider clinical correlation"; consult wars ("this is not a surgical issue"); the dump; the turf; "admit to medicine"
- Pimping on rounds; the attending's favorite obscure question; the med student who presents the full ROS
- Med students on rounds: short white coat, pockets full of pocket guides, trying to be useful, asked to "go see if the patient pooped"
- Residency: 80-hour work week "rules", the Match, ERAS, Step scores, call rooms, 28-hour calls, sign-out at 7 a.m., the night float, the pager going off as you lie down
- Moonlighting, loans, "you're a doctor, you must be rich" at 32 with $300k debt
- Research: p-hacking jokes, "more research is needed", the poster session, reviewer 2
- CME at a beach resort; conference swag; drug rep pens (nostalgia)

*Nursing*
- Night shift: 3 a.m. slump, "what day is it", coffee, ghost stories, the room that always calls
- Report/handoff: SBAR, the day shift that left everything, "it was a quiet night" (jinx)
- Call lights and bed alarms; "Can I get some ice chips?"; the warm blanket as universal treatment
- Charting by exception, flowsheets, the 2-hour turns
- Floating to another unit; mandatory overtime; the "we're short again" text
- Nurse-doctor dynamics: the order that makes no sense, calling the resident at 3 a.m., "the doctor said" vs "the nurse knew"
- Travel nurses, agency rates; nurse educators and the mandatory skills fair
- Nursing school: care plans, NCLEX "select all that apply", "what would you do first?" questions, preceptors who eat their young (frame as the culture, not individuals)
- CNAs and techs as the real heroes; the unit clerk who knows everything

*Pharmacy*
- "Is it ready?" phone calls; drive-thru shopping requests; the prior auth fax that never arrives
- Counting by fives; the spatula and tray; the vial of shame
- Doctors writing for drugs that don't exist or at doses meant for horses; calling the prescriber's office and getting voicemail
- Insurance rejection codes; the "refill too soon"; the coupon card
- PBMs as villains; DIR fees; DM visits; metrics
- Hospital pharmacists vs retail; clinical pharmacist on rounds correcting doses
- Generic names that sound like spells, Pokémon or Scandinavian furniture (this is a fun trivia/guessing mode in both modes)

*Dentistry*
- Patients who floss only the day before; asking questions with hands in the mouth (dentists know it's absurd)
- "Are you a real doctor?" jokes; dental school competition; boards with real patients you must find yourself
- Insurance that covers two cleanings and nothing else; the treatment plan sticker shock
- Dental hygienists vs dentists dynamics; the suction being the assistant's whole personality
- Children's dentistry: the prize box negotiations

*Students and trainees (all disciplines)*
- Mnemonics (many are crude; write new deadpan ones)
- Flashcard apps (Anki review count "due today: 1,400"); First Aid; UWorld percentages
- OSCEs with standardized patients; shadowing; the white coat ceremony
- Clinical rotations: lost in the hospital, wrong scrubs color, standing for 6 hours in surgery with an itchy nose

### Gaps
- Direct fetching of r/medicine, r/nursing, r/Residency, r/pharmacy and r/dentistry threads was not done in this pass (search returned meme aggregators instead). The insider inventory is designer synthesis from cited themes and domain knowledge; a playtest with clinicians should validate it.
- No reliable popularity data for GomerBlog articles was found.
- No source specifically on dental school humor; inventory is inferred.

## 3. Ethics and guardrails: gallows humor and keeping jokes punching up

### Takeaway
Clinicians widely use and value dark humor among themselves (79% of 710 mental health staff called it beneficial; about 90% of paramedics admit using it), but the literature consistently draws the line at **audience** (outsiders, patients, families, overhearing) and **target** (patients, their religion, culture, families, conditions seen as self-inflicted). The best working rule for a mixed-audience game comes from Flanary: make the object of ridicule clear, ridicule only things you believe deserve it, and never be perceived as making fun of patients because "patients are at the bottom."

### Cited Findings
- Survey of 710 New Zealand mental health and addiction staff: 79.4% said black humour is beneficial (nurses 86.8%, doctors 81.0%, allied health 76.5%, others 69.2%). Lower among Māori and Pasifika staff (66.0%) and those without English as a first language (67.7% vs 81.3%). Staff uncomfortable with colleagues' black humour were less likely to see benefit (72.3% vs 81.8%) — [Mental health black humour survey, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC10809729/)
- The same study's respondents saw harm when humour trivializes distress, is sarcastic or at a patient's expense, has sexist or racist undertones, or targets patients' religion, ethnicity, culture or family matters. Colleagues without the experience "of where the humour is coming from" may read venting as insensitive. Conclusion: beneficial "when used mindfully, sensitively and in context." The study did not include patients or relatives — [PMC10809729](https://pmc.ncbi.nlm.nih.gov/articles/PMC10809729/)
- Paramedics (n=10, one UK university): humor is "appropriately inappropriate for the correct audience"; "you have to be in the situation once or twice to appreciate the joke"; it is "not funny for non-medical professionals." Harms: detachment, empathy fatigue, avoiding emotional processing, spillover into family life. Newer students were more easily offended — [PMC11610543](https://pmc.ncbi.nlm.nih.gov/articles/PMC11610543/)
- A 2005 paramedic survey found nearly 90% admitted using dark humor; a 2012 Mayo Clinic Proceedings survey of 633 palliative care providers found about 72% had heard darkly humorous comments (both reported via search summary; not verified against originals) — [Search summary citing Psychology Today / Becker's](https://www.beckersasc.com/asc-news/does-dark-humor-have-a-place-amongst-healthcare-workers.html)
- Katherine Watson (Hastings Center Report, 2011) argues gallows humor's meaning shifts with power dynamics; patients who make clinicians feel helpless (difficult, noncompliant) become targets; she judged an ER team's joke about a dead pizza driver "ethical" because no direct harm was done to the patient. A commentator adds that joking in front of patients or families would be different (secondhand account) — [Psychology Today](https://www.psychologytoday.com/au/blog/culture-shrink/201502/should-health-care-providers-joke-about-patients)
- Wear et al. 2009 (Medical Education 43(1):34-41), the follow-up to the 2006 student study, ran focus groups with 49 residents and 21 attendings; motives were relieving frustration, stress and anger. An accompanying editorial (Ronald Berk) framed derogatory humor about patients as verbal abuse, disrespect and dehumanization — [ShockMD summary](https://www.shockmd.com/2009/01/06/cynical-humor-directed-towards-patients-it-is-mostly-about-the-culture/); [Berk editorial PDF](https://www.ronberk.com/articles/2009_derogatory.pdf)
- A 2020 COVID-era commentary warns gallows humor can portray a clinical picture as grimmer than it is and worry an overhearing patient unnecessarily, while also building camaraderie — [PMC7294528](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7294528/)
- Positive humor styles (affiliative, self-enhancing) correlate with fewer psychological symptoms among healthcare professionals (cross-sectional, 2025) — [PMC11767706](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11767706/)
- Flanary: "I always make sure that the object of ridicule is clear"; "patients are at the bottom," so "I should never be perceived as making fun of patients"; test: "Do I believe that my ridicule of something is justified?" — [STAT](https://www.statnews.com/2022/03/25/dr-glaucomflecken-will-flanary-profile/)

### Inferences
- **A party game is an "outsider audience" by definition**, even in Pro mode (partners, roommates, mixed-discipline groups, students who are "more easily offended"). So the game's own content should stay at the safe end of insider humor (self, specialty, system, absurd tasks) and leave darker gallows humor to what players choose to type. This is consistent with the earlier report's conclusion that the game's prompts shouldn't push.
- **Target checklist for every prompt** (derived from the cited harms):
  1. Who is the butt? Allowed: institutions, insurers, administrators, EHR vendors, the clinician's ego, specialties, training culture, TV medicine, inanimate objects (gowns, pumps, pagers), the absurdity of bodies in general. Not allowed: patients as a class, specific conditions, disabilities, weight, addiction, mental illness, "noncompliance", age, religion, culture, families.
  2. Does the prompt make the player choose a victim? If a prompt like "the most annoying type of patient" invites mocking a group, rewrite it so the target is the system ("the most annoying thing the EHR asks about a patient").
  3. Is a death, cancer or severe outcome the subject? If yes, cut it, or move it to distant/historical framing (old-timey medicine, leeches, Victorian quackery) per the earlier distance research.
  4. Would it be fine read aloud in a waiting room? That is the Normal-mode bar. Pro-mode bar: would it be fine read in the break room with a patient's family walking past?
- **Watson's power-dynamics point** implies: "difficult patient" humor is the most common insider type and also the riskiest. Flip it to clinician helplessness at the system rather than at the patient.
- **Inclusion note**: lower benefit perceptions among Māori/Pasifika and non-native English speaking staff suggest culturally loaded or wordplay-heavy dark humor excludes some players. Keep prompts plain-language and away from cultural or religious targets.

### Gaps
- No study found on how **laypeople react to clinician humor** directly; the closest is staff speculating about overhearing. This remains the key evidence gap for Normal mode.
- The 2005 paramedic and 2012 Mayo figures came through a search summary, not the original papers.
- No primary access to the full Wear 2009 paper's categories in this pass.

## 4. Formats that generate the widest range of player answers

### Takeaway
No peer-reviewed or Jackbox-published data compares medical prompt formats directly. Cited material supports several format families that already exist in medical humor culture: "serious method, silly question" (BMJ Christmas), the reasonable person vs absurd system in a short scene (Glaucomflecken), confession of a universal small lie (flossing), invented jargon (malapropism genre), and dual explainers (sassy vs polite pharmacist). Combined with the earlier report's one-absurd-constraint rule, these suggest the formats below. Each is open-ended and grounded in a shared object or moment.

### Cited Findings
- The "sassy vs polite pharmacist" format answers the same customer question two ways, a built-in two-answer comedy structure — [Pharmacy Times](https://www.pharmacytimes.com/view/sassy-pharmacist-and-polite-pharmacist-tackle-common-questions)
- Glaucomflecken's sketches use a ~90-second format of a reasonable person confronting an absurd system — [STAT](https://www.statnews.com/2022/03/25/dr-glaucomflecken-will-flanary-profile/)
- BMJ Christmas papers apply rigorous research methods to whimsical questions, editors aim for "strangeness" — [NPR](https://www.npr.org/2023/12/25/1198908975/christmas-bmj-health-research); [Smithsonian](https://www.smithsonianmag.com/smart-news/the-best-of-the-british-medical-journals-goofy-christmas-papers-180948177/)
- Medical malapropisms are a recognized genre that clinicians collect and categorize (Davis and Kenyon) — [Visual Thesaurus](https://www.visualthesaurus.com/cm/wordroutes/medical-misapprehensions)
- (From the earlier report, for continuity, not repeated in detail): one specific absurd constraint beats vague or over-stacked prompts; writers should check they can think of several answers; mix prompt structures — [Jackbox blog](https://www.jackboxgames.com/how-to-write-a-good-quiplash-prompt)

### Inferences
**Format families, ranked by expected answer range (designer judgment, untested):**

1. **Object or moment + one absurd twist (highest range).** Pick a shared object from the inventory and add one constraint. Examples of structure (not finished copy): "The 11th option on the phone tree", "A side effect that would actually make people read the leaflet", "What the exam table paper is thinking". Works in both modes; swap the object for Pro ("What the Pyxis says when it locks you out").
2. **Worst / best thing to hear or see when...** ("...the anesthesiologist is counting backwards", "...your dentist has hands in your mouth", "...on the EHR at 3 a.m."). High range because it invites any sentence. Guardrail: the worst thing should be the system or clinician being absurd, not a grim diagnosis. Keep away from "worst thing a surgeon could say" leading to death.
3. **Fake products, services and specialties.** A new insurance plan name, a hospital gift shop item nobody needs, a wellness app feature, a new specialty that should exist ("Department of Parking"), a drug name for a mundane problem (Normal: "a prescription for Monday mornings"; Pro: brand name for an EHR that apologizes). Strong for the deadpan voice and for drawing.
4. **Fill-in official text.** Deadpan bureaucratic forms: "Reason for visit: ___", a discharge instruction, an Explanation of Benefits line item, a hospital policy memo, a Best Practice Alert, a patient portal auto-reply, a BMJ Christmas paper title ("A randomized trial of ___"). The house voice is strongest here because officialese is inherently dry.
5. **Translations / decoders.** "What 'slight pressure' actually means", "What 'clinical correlation recommended' means" (Pro), "What the receptionist means by 'shortly'". Medical euphemism is a big shared joke; this is the malapropism genre aimed at the system's language.
6. **Specialty / role "which one would..." (Pro).** "Which specialty would bring a protein shake to a code?" Good for voting rounds because players argue identity.
7. **Universal small confessions.** "The thing you tell the dentist instead of the truth", "What you actually did with the leftover antibiotics" (careful: do not encourage dangerous behavior; keep it about the lie being transparent). Answers become self-deprecating, which is very benign.
8. **Would-you-rather with two system evils.** "Wait 6 hours in the ER or 6 weeks for a callback", "Code with a pager or chart with a fax" (Pro), "Wear the hospital gown to a wedding or the lead apron to the gym". Both options should be bureaucratic or absurd, not health outcomes for patients.
9. **Drawing prompts: compound absurd scenes.** "A gown that ties in 40 places", "An orthopedic surgeon doing calligraphy", "The pharmacy drive-thru on a horse", "A pager trying to sleep", "Medieval doctor using a smartwatch". Concrete nouns, one incongruous verb or setting. Avoid anatomy-test prompts in Normal mode.
10. **Trivia with joke distractors.** Real absurd medical facts (ICD-10 codes like being bitten by an orca or injured at an opera house; BMJ Christmas findings; history of quackery like tobacco smoke enemas) with deadpan wrong answers. Distance framing (historical medicine) keeps grim facts benign.

**Prompt-writing principles distilled for iatrome's voice (inference):**
- Grounding: every prompt needs a concrete object, place or moment from the inventory. "Healthcare is bad" is too vague; "the hold music for prior authorization" is a prompt.
- The system talks in dry officialese; the player gets to write the human reaction, or the reverse.
- Pro mode should never just be Normal mode with jargon. It should reference the insider *experience* (charting at home, consult wars), which also lets Pro players' partners laugh at the gist.
- Promotion test for Pro to Normal: can a non-clinician get the joke from the prompt alone? If yes, it's usable in both modes.
- No corny puns: avoid "humerus/humorous", "patients/patience", "organ-ized". Deadpan beats wordplay. Puns can appear as an answer players choose, not in the prompt.
- Severity budget: no prompts about death, cancer, specific diseases, addiction, weight, disability or mental illness. Bodily mishaps that everyone has (hiccups, sneezes, stubbed toes, brain freeze) are fine and close-framed.
- Avoid patient-slang (gomer, frequent flyer, drug-seeker, "status dramaticus", "FTD") in game content.

### Gaps
- No empirical data compares answer diversity across medical prompt formats. These rankings need playtesting (count distinct answers per prompt and laugh/vote spread).
- No source on misheard medical terms as a *game* format (versus a collected genre).
- No source on "worst thing to hear" format performance; it is a widely used party format but evidence is anecdotal.
