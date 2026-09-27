# Recording Studio Tycoon — Desktop Idle Core Loop

> **Shipped status (2026-09-27):** the Phase A–C first slice is merged (train #7, #11, #21, #22, #42 into `feature/polished-pre-overhaul`): Artist Enquiries / Book Session inbox + compact `StudioStrip`, passive `advanceSimulation` (live tick + 8h-capped offline catch-up, stops at review-ready, never pays out), `WelcomeBackSummaryModal` catch-up summary, optional Intervene / Delegate / Skip interventions, and seeded-RNG review/intervention determinism. This doc remains the design vision; for shipped behavior see README "Desktop-idle core" and `docs/current/CURRENT_STATUS.md`.

## Product direction

Recording Studio Tycoon remains the same game and name, but its moment-to-moment structure shifts toward a compact, persistent recording studio that can live along the bottom of the desktop.

The studio should feel alive even when the player is not constantly clicking:
- artists arrive with enquiries,
- booked sessions progress,
- staff visibly work,
- money and reputation accumulate,
- equipment and rooms visibly improve,
- occasional decisions create meaningful upside or risk.

The key design rule is **idle by default, interesting to intervene in**.

The player should never be punished for letting a competent studio run, but active attention should create opportunities for better outcomes, faster growth, stronger artist relationships, rarer gear, and memorable stories.

---

## Core fantasy

Start with a tiny room, cheap interface, one microphone, yourself, and barely enough money for rent.

Over time the strip at the bottom of the desktop physically grows into a busy professional facility:
1. bedroom / rehearsal-room setup,
2. one-room project studio,
3. separate booth and control room,
4. multi-room commercial studio,
5. premium rooms with specialist staff and high-profile clients.

Progress should be readable visually without opening a stats page.

A player returning after twenty minutes should immediately notice:
- somebody is recording,
- another artist is waiting,
- an engineer is mixing,
- a piece of gear is being repaired,
- a payment landed,
- the studio looks slightly better than before.

---

# The layered gameplay loops

## 1. Ten-second loop — Observe, choose, collect

Every few seconds there should be something lightweight to notice:

- artist enters or sends an enquiry,
- session milestone completes,
- payment orb / reputation event appears,
- staff member requests a decision,
- equipment lights up when actively contributing,
- a small opportunity appears: rare take, rush fee, upsell, referral.

The player can ignore most of these.

Active interaction should be one-click or two-click:
- Accept,
- Decline,
- Assign,
- Intervene,
- Upgrade,
- Take the risk.

The desktop strip must not become a notification-management game.

---

## 2. One-to-five-minute loop — Artist enquiry → booked session

This replaces the emotionally flat "Available Projects" framing.

An enquiry should feel like a person wanting studio time.

Each enquiry exposes:
- artist / act identity,
- genre,
- session type,
- payout,
- estimated time,
- difficulty,
- relationship potential,
- studio fit,
- optional special condition.

Example:

> Mara Vale
> Alt-pop vocalist
> Vocal recording + comp
> £240 · ~18 min
> Good studio fit
> "Needs this finished tonight" — +35% fee, fatigue risk

The decision is not merely "take highest payout".

Interesting trade-offs:
- cash vs reputation,
- safe client vs difficult high-upside artist,
- familiar genre vs skill-building unfamiliar genre,
- short filler job vs room-blocking premium session,
- repeat client vs new networking opportunity,
- rush fee vs staff fatigue,
- prestige work vs low-margin reliable work.

Rejected work should occasionally return later at a different studio reputation level.

---

## 3. Session loop — passive progress with intervention windows

Once booked, a session proceeds automatically.

Suggested session states:

1. Arrival
2. Setup
3. Tracking / production
4. Edit
5. Mix
6. Master / delivery
7. Payment + relationship outcome

Existing RST stages can power this.

### Passive outcome

If the player does nothing, outcome uses:
- assigned staff skill,
- equipment,
- room bonuses,
- artist compatibility,
- fatigue,
- studio reputation,
- modest randomness.

A properly configured studio should reliably complete jobs unattended.

### Intervention opportunities

Occasionally offer an optional 10–30 second intervention:

- **Perfect Take** — timing/rhythm microchallenge for quality.
- **Feedback Problem** — quickly identify source or let engineer handle it.
- **Client Wants More Bass** — choose safe revision or bold creative choice.
- **Vocal Comp** — select best takes.
- **Mix Check** — adjust a few obvious balances.
- **Plugin Crash / Tape Jam** — quick technical response.
- **Artist Block** — choose encouragement, break, rewrite, or push through.

Ignoring it triggers an automatic staff decision.

Playing well gives a meaningful but bounded bonus.

This preserves all the existing minigame investment without forcing minigames into every project.

---

# 4. Completion loop — the dopamine hit

The existing Project Review system is valuable and should become faster and more tactile.

Target completion sequence: **3–6 seconds**, skippable.

Show:
- quality score,
- payout,
- reputation,
- artist relationship change,
- strongest contributing gear/staff,
- skill gains,
- notable event,
- possible referral / follow-on booking.

Example:

**SESSION DELIVERED**
- Quality 84
- £310 paid
- +4 reputation
- Mara Vale: Friendly → Loyal
- Engineer Sam Chen gained Mixing XP
- Your used compressor was the standout gear
- Referral unlocked: Mara's drummer needs a mix tomorrow

The result should immediately seed another decision.

This creates:
**finish → reward → new opportunity → book again**.

---

# 5. Artist relationship loop

Repeat clients are one of the strongest low-content ways to make generated projects feel meaningful.

Add relationship tiers:

- Unknown
- Acquaintance
- Friendly
- Regular
- Loyal
- Advocate

Artist relationship affects:
- chance of repeat bookings,
- willingness to pay deposits,
- tolerance for delays,
- referral chance,
- access to larger projects,
- special requests,
- chance they bring bandmates/collaborators,
- prestige if they later become successful.

Artists should develop lightweight history:

- sessions completed,
- favourite room,
- favourite engineer,
- preferred gear / workflow,
- genres,
- traits,
- best project score,
- memorable incidents.

This converts procedurally generated work into ongoing stories without authored narrative campaigns.

---

# 6. Staff loop — hire → specialise → trust → automate

Staff should not simply be stat multipliers.

Every staff member needs a recognisable production identity.

Examples:
- fast tracking engineer,
- obsessive mixer,
- vocal specialist,
- analogue fanatic,
- electronic producer,
- cheap generalist,
- talented but temperamental engineer.

Staff gain:
- role XP,
- production skills,
- genre affinity,
- artist affinity,
- equipment familiarity,
- traits.

### Equipment familiarity

Repeated use of the same item unlocks a small familiarity bonus.

Example:
Sam + "Blue Rack Compressor"
- Familiarity 0 → 5
- faster setup,
- slightly better quality,
- lower breakdown risk.

This gives ordinary equipment emotional value and makes replacing it a real decision.

### Automation progression

Early:
- player does nearly everything.

Mid:
- assign staff and let sessions run.

Late:
- define policies.

Examples:
- auto-accept jobs over 70% margin,
- prioritise loyal clients,
- never book engineer below 25 energy,
- reserve Booth A for vocal work,
- automatically use premium chain for prestige clients.

The reward for progression is **less clicking but more strategic control**.

---

# 7. Gear loop — useful objects, not stat sticks

Equipment should have five layers:

1. base stats,
2. condition,
3. character / quirks,
4. familiarity,
5. resale / collection value.

Example:

**Old Valve Compressor**
- +6 vocal quality
- +3 soul / rock affinity
- warm character
- 68% condition
- familiar to Sam (+4% efficiency)
- occasional overheating

A technically worse piece of gear may remain worth keeping because:
- an artist likes it,
- a staff member knows it,
- it works brilliantly in one genre,
- it has a rare modifier,
- it has collector value.

This makes flea-market and yard-sale systems much more valuable.

---

# 8. Used gear / loot loop

Existing marketplace and yard-sale ideas should become a major retention system.

Sources:
- flea market,
- closing studio sale,
- estate sale,
- artist trade-in,
- online marketplace,
- pawn shop,
- mystery storage box.

Gear can roll:
- condition,
- cosmetic wear,
- hidden fault,
- unusual mod,
- provenance,
- rare finish,
- serial rarity,
- famous previous studio story (fictional).

Player choices:
- use it,
- repair it,
- modify it,
- flip it,
- collect it.

This creates a satisfying second economy beside sessions.

A player might make money by becoming:
- a great studio,
- a gear flipper,
- an equipment collector,
- or some mix of all three.

---

# 9. Studio layout loop

The bottom strip must visibly communicate growth.

Rooms have limited slots.

Early example:
- 1 room
- 1 recording position
- 4 gear slots
- 1 waiting chair

Upgrade choices:
- vocal booth,
- larger control room,
- second recording room,
- machine room,
- lounge,
- repair bench,
- writing room,
- live room.

Rooms unlock additional simultaneous session capacity rather than just passive buffs.

This gives studio expansion direct mechanical meaning.

---

# 10. Capacity pressure

The addictive tension should come from **too many good opportunities**, not arbitrary timers.

At low reputation:
- not enough clients,
- player wants growth.

At medium reputation:
- more enquiries than slots,
- player has to choose.

At high reputation:
- queue management,
- staff specialisation,
- room allocation,
- VIP clients,
- maintenance,
- multiple overlapping deadlines.

The game should naturally transform from:
**make music**
into
**run the machine you built**.

---

# 11. Streaks without manipulative daily-login design

Use in-session streaks rather than FOMO.

Examples:
- 3 sessions delivered above 80 quality,
- 5 clients served without a late delivery,
- 4 vocal sessions in a row,
- one profitable week,
- no equipment breakdowns for 10 sessions.

Benefits should be modest:
- temporary word-of-mouth bonus,
- extra enquiries,
- staff morale,
- small fee multiplier.

Missing a day in real life should never reset anything.

---

# 12. Dynamic studio events

Events make an idle screen entertaining to watch.

Low-cost event examples:
- artist arrives early,
- artist is late,
- cable fails,
- neighbour complains,
- courier delivers gear,
- staff makes coffee,
- engineer discovers a faster workflow,
- musician brings a friend,
- client asks for revision,
- old client walks in,
- label scout visits,
- gear listing expires,
- rare used item appears,
- staff member gets a reputation boost.

Most events should be flavour plus a tiny systemic consequence.

---

# 13. Collections and discovery

Collection pages add long-term goals cheaply.

Track:
- artists recorded,
- genres mastered,
- equipment discovered,
- rare equipment variants,
- staff hired,
- session types,
- studio rooms,
- historical technologies,
- awards / milestones.

Avoid filling the collection through arbitrary grinding.

Discovery should come naturally through ordinary studio play.

---

# 14. Prestige / reset layer — optional, much later

Do not build this before the core loop works.

Possible prestige:
sell the studio and start a new facility with:
- industry contacts retained,
- permanent founder perks,
- unlocked aesthetics,
- one legacy staff member,
- one iconic piece of gear.

This gives very long-term replayability without invalidating the first playthrough.

---

# Desktop presentation

## Collapsed mode

Approximate height: 120–180 px.

Shows:
- the studio rooms,
- characters,
- session progress,
- incoming enquiry indicator,
- money/reputation,
- one compact action queue.

No giant panels.

## Expanded mode

Clicking the strip expands to a management surface containing:
- enquiry inbox,
- session details,
- staff,
- gear,
- room upgrades,
- finances.

Closing it returns to the living studio strip.

## Full game mode

Traditional full-window view remains available.

The desktop strip is a presentation mode, not a separate game.

---

# Economy principles

## Money sinks

- staff salary,
- rent / room expansion,
- gear,
- repair,
- utilities,
- training,
- freelance/session musicians,
- marketing,
- rush outsourcing.

## Revenue

Primary:
- studio sessions.

Secondary:
- mixing/mastering work,
- equipment resale,
- royalties on select deals,
- production points / backend deals,
- room rental.

Do not introduce ten currencies.

Core resources:
1. Cash
2. Reputation
3. Relationships
4. Time / capacity

Skills and XP are progression, not spendable currencies.

---

# Anti-boredom rules

1. Do not require the same minigame every session.
2. Never make the player manually collect dozens of tiny coins.
3. Do not require constant attention to avoid failure.
4. Every upgrade should change appearance or behaviour, preferably both.
5. Generate decisions from combinations of systems, not piles of scripted content.
6. A returning player should understand what happened while they were gone.
7. Interesting mistakes are better than opaque punishment.
8. Keep session outcomes legible.
9. Preserve favourite staff, clients and gear long enough for attachment to form.
10. Let automation be a reward.

---

# MVP implementation slice

## Phase A — reframe current project loop

Use existing systems first.

- Rename "Available Projects" presentation to **Artist Enquiries**.
- Rename "Start Project" to **Book Session**.
- Show project fit prominently.
- Add a compact risk/reward descriptor.
- Remove manual "Refresh" as the primary fantasy; new enquiries should arrive through time/completions.
- Preserve the existing Project type and completion pipeline initially.

## Phase B — optional interventions

- Existing minigames no longer block progress.
- Sessions can always auto-resolve.
- Minigame success applies a capped quality / XP bonus.
- Staff skill determines auto-resolution quality.

## Phase C — relationships

Add persistent artist/client relationship records keyed by generated identity.

Minimum fields:
- relationship XP/tier,
- sessions completed,
- last session,
- favourite engineer,
- best quality score,
- referral count.

## Phase D — desktop strip

Create a compact StudioStrip presentation using current game state.

First version can show:
- one control room,
- one booth,
- active project,
- assigned staff,
- next enquiry,
- money,
- reputation,
- progress.

Do not build complex room simulation before this is enjoyable.

---

# First retention target

A new player should want to do the following without tutorial pressure:

1. finish the first cheap session,
2. buy one visibly better piece of gear,
3. see that gear affect the next session,
4. meet a client they want to retain,
5. hire their first staff member,
6. experience the studio continuing to function without direct control.

If this sequence feels good, the game has a viable core.
