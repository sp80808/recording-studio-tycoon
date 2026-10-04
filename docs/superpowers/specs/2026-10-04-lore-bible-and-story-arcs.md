# Lore Bible & Story Arc Redesign

Companion to [branching-deterministic-storylines plan](../plans/2026-09-29-branching-deterministic-storylines.md).
Tone: **mixed, set per era** (see Era Voice). Everything below stays seed-deterministic.

## 1. Problems in the current plan

| Issue | Effect | Fix (section) |
|---|---|---|
| Rival name/studio re-rolled per node (`runSeed + 10/20/30`) | No recurring antagonist, no emotional payoff | §3 Fixed cast, seeded casting |
| 4 Act III finales built by one `makeAct3Finale` | Same text, same objective shape, only numbers differ | §5 Distinct finales |
| `storyFlag`s are written but never read | Choices have no callbacks | §6 Flag callbacks |
| Rival pools are unthemed random lists | Names clash with era and origin | §2/§4 Era voice, origin hooks |
| Objectives are only "N sessions at quality X" | Story is a number gate | §5 Arc-specific objective twists |
| No stakes, no loss state | Branches feel like pure upside | §7 Costs and a "Cost of the Path" beat |

## 2. World

**Premise.** The player's studio sits in a city whose sound is being decided by a three-way tug of war: *craft* (tape, rooms, people), *reach* (labels, algorithms, money) and *noise* (scenes, remixers, the unpolished new). Every era reshuffles who holds which power; the studio's rise is the story of which one it bends toward, and what it costs.

**Recurring places** (fixed names, so lore accrues):
- **The Marquee Cellar**: basement venue, craft heartland, Act II purist set piece.
- **Warehouse 9**: unlicensed noise-scene hub, Rogue finale venue.
- **The Gold Coast Pavilion**: label showcase hall, Billboard finale venue.
- **The Long Room**: legendary mastering suite owned by the mentor; the player's studio can only enter it late (Golden Reel finale).

**Themes** (each arc argues one): *Integrity vs. income*, *legacy vs. novelty*, *who gets credit*.

## 3. Fixed cast with seeded casting

Fixed archetypes; the seed only picks **name, studio and one quirk** from per-archetype pools. A role keeps the same person for the whole campaign.

| Role | Function | Appears | Seeded pools |
|---|---|---|---|
| **The Rival** | Primary antagonist, evolves each act | I, II, III | 6 names x 5 studios x 4 quirks |
| **The Mentor** | Veteran engineer, owns *The Long Room*; fate depends on choices | I, II, III | 4 names x 3 backstories |
| **The Protégé** | Your first regular artist; the Rival tries to poach them | I, II, III | 5 names x 4 genres (from origin) |
| **The Broker** | Label A&R, offers the Faustian deals | II, III | 4 names |

**Rival arc by act** (voice changes, identity doesn't):
1. **Dismissive**: "Your room is a hobby."
2. **Wary**: tries to buy, poach or sabotage; stakes personalised to the chosen path.
3. **Mirror**: a finale where the Rival reflects the path you took (a purist's rival is a sellout, a mogul's rival is an idealist).

Determinism rule: cast is resolved once into `storylineState.cast` from `runSeed`; nodes read from it and never re-roll.

## 4. Era voice & origin hooks

| Era | Tone | Voice notes |
|---|---|---|
| Vintage warmth (tape) | Nostalgic, heartfelt | Reverent, tactile language: reels, lacquer, hum |
| Neon / synth | Witty, satirical | Dry corporate-parody, buzzwords |
| Streaming age | Grounded drama | Plain, anxious, numbers-driven |

| Origin | Opening hook | Starting Protégé genre pool |
|---|---|---|
| Tape purist | Inherited a dying studio with a Mentor's old console | Rock / Acoustic / Folk |
| Bedroom beatmaker | Viral bedroom track, now needs a real room | Hip Hop / Lo-Fi / Electronic |
| Default | Cold-called by a stranger who wants a demo | Pop / Rock / RnB |

Implementation: template strings carry `{era.tag}` variants; `renderProceduralTemplate` selects a variant by `selectedEra`, never by Math.random.

## 5. Distinct finales

Each finale has its own theme, venue, antagonist stance, objective twist and reward. Same 1-2-4 graph shape, no shared builder text.

| Finale | Path | Venue | Theme | Objective twist | Perk |
|---|---|---|---|---|---|
| **Golden Reel Legend** | Heritage -> Pure analog | The Long Room | Legacy | One flawless session, no digital-flagged gear used | Master of the Vacuum Tube |
| **Sonic Alchemist** | Heritage -> Hybrid | The Marquee Cellar | Innovation | Two sessions where a new-tech rack beats a classic rack | Acoustic Architect |
| **Billboard Monopoly** | Commercial -> Conglomerate | Gold Coast Pavilion | Cost of success | Three charting hits in a row **while keeping roster burnout under cap** | Platinum Cartel Head |
| **Rogue Hit Factory** | Commercial -> Open stems | Warehouse 9 | Credit & community | A release credited to 3+ different artists | Rebel Audio Kingpin |

## 6. Flag callbacks (choices must echo)

Every `storyFlag` needs at least one consumer. Callbacks are cheap text variants plus small modifiers:

| Flag | Callback |
|---|---|
| `chose_acoustic_heritage` | Mentor praises you in Act II; Broker refuses to take your call until Act III |
| `chose_commercial_scale` | Mentor is distant in Act II; Broker offers better terms |
| `golden_reel_purity` | Epilogue: studio becomes a pilgrimage site |
| `hybrid_acoustic_patent` | Epilogue: Rival licenses your circuit |
| `major_label_syndicate` | Protégé leaves or is "managed"; epilogue loses an artist slot |
| `open_stem_revolution` | Protégé stays; epilogue has a remix-community bonus |
| `protege_poached` (new) | Set if Rival wins the Act II poach event; Act III becomes a rescue arc |
| `mentor_betrayed` (new) | Set by certain commercial options; locks the Long Room |

Rule: authors may not add a flag without a consumer (enforced by a test that scans callbacks).

## 7. Costs and the "Cost of the Path" beat

Add one **consequence vignette** between Act II and Act III, as a dilemma outcome, not a gate:
- Heritage paths: cash crunch (rent due) the player must absorb.
- Commercial paths: the Protégé confronts you about credit and creative control.
Effects stay small (moneyDelta / repDelta / one flag) so balance changes are minimal. Net rep deltas should differ in sign across at least one option per node.

## 8. Epilogue

On campaign completion, assemble a 4-line epilogue from: finale id, Rival fate, Mentor fate, Protégé fate (each picked by flags). 4 finales x 3 x 3 x 2 variants, deterministic and fully testable.

## 9. Plan impact (concrete edits to the existing plan)

1. **Task 1**: add `StorylineCast` type and `resolveCast(runSeed, originId)`; remove per-node `rivalName` re-rolls; extend `renderProceduralTemplate` with `{mentor}`, `{protege}`, `{broker}` and era variants.
2. **Task 2**: replace `makeAct3Finale` with four authored finale nodes (§5); replace `runSeed + N` rolls with `cast.rival`; add the `protege_poached` event at Act II.
3. **New task**: `resolveEpilogue(state)` and the flag-consumer test (§6, §8).
4. **State**: add `cast` and `epilogue` to `StorylineState`.
5. **Tests**: (a) same seed -> identical cast across all nodes, (b) different era -> different voice, same graph, (c) every flag has a consumer, (d) all 4 finales have unique `loreBrief`.

## 10. Open items

- Final names for Mentor/Broker pools (draft, then tune for era voice).
- Whether `protege_poached` is a hard fail state or a recoverable detour (recommended: recoverable).
