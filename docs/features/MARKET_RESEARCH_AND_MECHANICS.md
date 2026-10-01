# Market research and mechanics shortlist

Goal: a game a layperson can enjoy in five minutes and an engineer, producer or label person can nod at after fifty hours. This note records what comparable games do, what real studio workflow offers us, and a ranked idea list. Web search was reachable, but it returns review summaries only, so the research is broad rather than deep.

## 1. What comparable games teach us

| Game | Players praise | Players criticise | Takeaway for RST |
| --- | --- | --- | --- |
| Game Dev Tycoon / Game Dev Story ([OpenCritic](https://opencritic.com/game/10286/-/reviews), [PocketGamer](https://www.pocketgamer.com/game-dev-story/review/), [AppSpy](https://www.appspy.com/game-dev-story-review)) | Approachable for newcomers, yet rewards experimenting with genre/topic combos; charming pixel look; "one more turn" hours | Gets repetitive; formula is hard to stretch | Keep combos (genre x brief x gear) discoverable, and add variety through events and mini-games so the loop never feels identical |
| Two Point Hospital ([OpenCritic](https://opencritic.com/game/6530/-/reviews?page=2)) | Sense of humour is a core selling point; addictive | (none prominent in the summaries) | Humour is a feature: short, specific, affectionate jokes beat broad parody |
| Mad Games Tycoon ([OpenCritic](https://opencritic.com/game/3308/-)) | Real resource-management challenge | No tutorial, nothing explains basic features, pushes one way of playing "antithetical to how the industry really works" | Explain as you go, and never make the game punish a legitimate studio style |
| Venture Towns ([TouchArcade](https://toucharcade.com/2011/12/29/venture-towns-review/)) | Kairosoft charm | Uncharacteristic ruthlessness makes the formula unforgivable | Stay wholesome: failure costs a little, never a game over |
| Rhythm games such as Beat Saber ([Game Informer](https://gameinformer.com/review/beat-saber/engrossing-musical-swordplay)) | One sentence of rules; hand-charted feel; instant feedback | n/a | Every mini-game should be explainable in one sentence and feel good within ten seconds |

Cross-cutting lessons: (1) approachable first, depth second; (2) humour and charm carry a management sim; (3) repetition is the main killer, so mini-game variety matters; (4) never be mean.

## 2. Studio workflow insiders will recognise

Sources: general production-workflow overviews ([Yamaha Hub](https://hub.yamaha.com/proaudio/recording/whats-the-difference-between-recording-mixing-and-mastering), [Soundbridge](https://soundbridge.io/en/real-daw-workflow-examples-for-efficient-music-production)).

- Pre-production, tracking (drums and bass first), overdubs, editing, mixing, mastering, bounce.
- Vocal sessions record a stack of takes, then **comp** the best phrase from each into one performance.
- Session hygiene: take numbers, naming, file paths, backups. Everyone has a "final_FINAL_v3" story.
- Gain staging, phase, mic placement, headphone mixes and the talkback button are all instantly recognisable textures.

Already covered in the repo: punch-ins, tape splicing, fader rides, EQ match, mastering, acoustic treatment, effect chains, flight cases. Vocal comping was not (R&D issue #32 only).

## 3. Ranked ideas

Scores are 1 to 5 (higher is better). "Confidence" is how sure we are it ships cleanly on top of the existing systems.

| # | Idea | Newcomer fun | Insider depth | Confidence | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | **Comp Session mini-game**: pick the best take for each line of a vocal. Visible waveforms for laypeople, hidden pitch/timing/emotion and flaw tags for insiders | 4 | 5 | 5 | **Built in this PR** |
| 2 | **Ambient earning**: royalties trickle while you play and a "while you were out" summary on return. Subtle, capped, flavoured as catalogue royalties | 4 | 3 | 4 | Next. Wants the economy ledger (#83) so it is not an invisible faucet |
| 3 | **Humour and charm pass**: loading tips, toasts, fax/email flavour, credits, all in one data file with a funny-check rule | 5 | 4 | 5 | Next. Tone rules below |
| 4 | Album sequencing mini-game: order tracks for flow, vinyl-side length, single placement | 4 | 4 | 3 | **Built** (`album-sequence`) |
| 5 | Session templates and signal chains (#86) | 2 | 5 | 3 | In flight |
| 6 | Studio Seasons and awards (#63) | 4 | 3 | 3 | In flight |
| 7 | Load-in Tetris for gigs (pack the van) | 5 | 2 | 3 | Backlog, pairs with live shows |
| 8 | Patchbay "what is plugged in where" puzzle | 2 | 5 | 3 | Backlog, reuses flight-case connector art |

## 4. Ambient earning (design, not yet built)

- Finished releases pay small catalogue royalties each in-game day, scaled by chart peak and era, with diminishing returns per release so it stays a garnish.
- The HUD shows nothing new. Income appears in the existing ledger line and in a once-per-session "royalty cheque arrived" postcard.
- Offline or idle time is capped (for example 8 hours of value) so nobody feels punished or pressured to return.
- Never replaces active play: active session income should stay several times higher.
- No paid acceleration (repo rule: no paid random loot in v1).

## 5. Humour and pop-culture rules

- Allusion beats name-drop. Wink at a thing (the tour-bus cough, the genius who cut the record in one take) and let insiders connect it.
- Specific beats generic: "Take 7. Take 7 was worse than take 3." works because every engineer has lived it.
- Punch up at the situation (deadlines, gear lust, the bassist's amp), never down at people or real individuals.
- No real trademarks or living artists by name. No meme-speak, no "as an AI" gags, nothing that needs a joke explained.
- One joke per surface, and let it be skippable. If a line does not earn a smile from a stranger, cut it.

## 6. Story arc seeds (feed into #56 and the existing arcs in `src/narrative`)

1. **The Bedroom Hit**: a self-produced demo finds you; the question is whether you stay small or scale up.
2. **The Sophomore Slump**: a signed artist's second record; the brief pulls one way, the label another.
3. **The Last Reel**: a legendary producer's tape vault needs restoring before the building sells. Gear-lover arc.
4. **Loudness War Truce**: a festival headliner wants it louder; the mastering choice sets the studio's reputation.

## 7. What this PR builds

The Comp Session mini-game (`vocal-comp`), wired into the auto-trigger logic for vocal and tracking stages, with a pure, seeded logic module and a check. Ideas 2 and 3 are the recommended next builds.
