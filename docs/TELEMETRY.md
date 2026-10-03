# Gameplay telemetry and traces (#59)

Development and playtest infrastructure only. Nothing is sent anywhere: events go to a bounded in-memory buffer in the browser tab.

## Contract
- `src/telemetry/gameplayEvents.ts`: event names, the `GameplayTelemetryEvent` shape, versions (`TRACE_SCHEMA_VERSION`, `SIMULATION_VERSION`, `BALANCE_VERSION`) and the per-event property allowlist.
- `src/telemetry/sink.ts`: `GameplayEventSink`, the bounded `BufferedSink` (500 events) and the `telemetry` facade. Capturing never throws; a failing adapter is dropped and the local buffer keeps recording. `onceKey` makes a capture idempotent for the run.
- `src/telemetry/instrument.ts`: call-site helpers that turn game objects into banded, allowlisted properties. Gameplay code imports these or the facade, never a vendor SDK.

Events today: `enquiry_accepted`, `enquiry_declined`, `session_booked`, `session_settled`, `intervention_intervened|delegated|skipped`, `staff_hired`, `management_panel_opened`.

## Privacy boundary
Captured: service type, fee/duration/quality/margin bands, deposit flag, rooms free, room type, staff role, minigame kind, panel name, game day, run id (random, per tab), save seed, version strings.
Never captured: player-entered text, names (player, client, staff, project titles), emails, machine or location data, file paths, narrative text, pointer movement, screenshots. `sanitizeProperties` drops any key not on the event's allowlist and any string that is not a short enum-like token, so a prose value cannot slip through.

## Export and analysis
In the browser console: `rstTelemetry.exportTrace()` returns the versioned trace (events, run id, seed, versions, balance hash); `rstTelemetry.summary()` prints the first metrics; `rstTelemetry.runId()` gives the id to write on a human playtest note. The trace holds no identity and no note text, so a note refers to the run id from outside.

```bash
bash scripts/analyze-trace.sh trace.json
```
reports: decline rate by fee band and service, the first day an enquiry met no free room, interventions played vs delegated vs skipped, repeated service choice and first hire day, share of sessions per quality band, and management panels opened before the first settled session.

A reload starts a new run id (the buffer is not persisted). The buffer is bounded, so a long session keeps only its latest 500 events.

## Deterministic replay
`replayGameplayTrace(initialState, trace)` replays the authoritative `actions` (settlements today) from a known starting state and compares a state hash after each one. On a mismatch it returns the first divergent action with the expected and actual hashes. `buildScenarioTrace` seals a scenario by running it once. `tests/fixtures/traces/duplicate-settlement.json` reproduces the duplicate-settlement bug class (settling the same report twice leaves the state unchanged); `UPDATE_FIXTURES=1 pnpm test` regenerates it after an intentional rules change. Live traces carry events only, because live state also changes through actions the trace does not record.

## Not built yet
Persisted traces (IndexedDB), the optional PostHog adapter (would live behind `GameplayEventSink`, opt-in, no autocapture or session replay), the enquiry-generated/viewed/expired events, and the world-interaction events from the #189 addenda (those need the world-action registry).
