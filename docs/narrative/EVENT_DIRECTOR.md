# Studio Event Director (#56)

One deterministic path decides which story beat happens next. Subplots and director events share it.

## Flow
1. `advanceStory` runs the campaign/subplot tick, then `tickDirector` takes at most one director opportunity.
2. The director builds immutable facts, asks each authored event whether it is eligible, and removes: active cooldowns, exhausted `maxOccurrences`, unmet `requiredMemories`, present `blockedMemories`, and any family that already filled the recent window (max 2 of the last 5 records inside 14 days).
3. Weights are `baseWeight` times any `memoryWeights` that apply. The pick is seeded from save seed, day, opportunity key and a per-save opportunity counter.
4. The selection is written to history and to `pending` **before** the UI shows it. Reload shows the same event; it never re-rolls.
5. Resolving is idempotent. With no pending event the call is a no-op, so a double click or reload cannot pay twice.

Silence is a valid result. A busy subplot, a pending branch, a pending event, a same-day opportunity already taken, or the 3-day gap after any story beat all yield no event, so offline catch-up can never open several modals at once.

## Persistence
`storylineState.director` holds `memories`, `history`, `opportunitySeq`, `lastEventDay`, and the `pending` event. It is optional: older saves read as an empty ledger, and the first tick creates it. Memories are compact (`scope/entity/key`, optional expiry) and capped at 200.

## Effects are validated outside the narrative
Events only describe `DomainEffect`s (`money`, `reputation`, `xp`, `clientXp`, `referral`). The director whitelists the kinds, clamps magnitudes (`EFFECT_LIMITS`), refuses options that cost money the studio does not have, and is the only code that applies them.

## Subplots on the director
- Subplot spawns use the same family anti-repeat and seeded weighted pick, and are recorded in the director history. Family = the kicker category (for example `LABOUR`).
- Every subplot choice also writes a `studio` memory named after its story flag, so director events can require or be weighted by earlier choices.
- Subplots may now have a **third beat** (`stages` of length 3). Four callbacks use it: union, crew, compromise, hero legacy.

## Authored events (9)
Recurring-client chain: `client_rush_request` -> `client_rush_payoff` / `client_rush_fallout` / `client_rush_respected` -> `client_referral_ask`. Others: `studio_label_scout`, `studio_press_inquiry`, `staff_artist_conflict`, `gear_overheated`.

The chain is carried only by memories. A rushed poor result makes the client cautious, and that memory fades after 40 days, so no branch is a trap. A declined rush stays neutral when the relationship is healthy and never unlocks the referral ask by itself.

## UI
`DirectorEventModal` reuses the subplot decision card. Resolved events appear in the career chronicle (sparkle icon) and in `getEventLog(state, clientId?)`.

## Not done
- Focus Mode: `delegateDirector` resolves a delegable event with its authored default, but nothing calls it from the Focus Mode UI yet.
- A per-client log view; only the chronicle and the helper exist.
- No Ink or json-rules-engine: eligibility is typed predicates, per the issue's fallback.
