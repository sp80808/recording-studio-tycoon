# Current Task: Core Gameplay Loop Completion + Daily Tick & Random Events

## Objective
Implement bead `ruc.3` of the Core Gameplay Loop epic: connect random events and daily
financials (staff salaries and equipment upkeep) into `advanceDay`, and verify the entire
core gameplay loop end-to-end.

## Completed This Session
- **Random Events Cooldown & Mechanics**:
  - Fixed `random-events.ts` cooldown logic: changed `getTimeSinceLastTrigger` to diff game days (`currentTime - lastTrigger.date`) rather than wall-clock `Date.now()`, preventing immediate expiration and retrigger loops.
  - Replaced mutating stubs in `RandomEventService` with pure functions.
  - Created `eventIntegration.ts` with singleton service management (`getRandomEventService`), pure rolling (`rollDailyEvents`), and immutable event effect folding (`applyEventToState`, `applyEventsToState`).
  - Mapped event effects (`StudioReputation`, `StaffMood`, `EquipmentEfficiency`, `OperatingCosts`) cleanly into `GameState`, and surfaced unmapped effects as narrative items.
- **Daily Tick & Financials Integration**:
  - Implemented `calculateEquipmentUpkeep` (0.1% daily maintenance per item, minimum $2/item).
  - Wired daily staff salaries and equipment upkeep into `advanceDay` in `src/hooks/useGameActions.tsx`.
  - Updated `gameState.financials` (`expenses` and `profit`) on every tick.
  - Added staff morale penalty when salaries cannot be afforded.
  - Generated `GameNotification`s and UI toast alerts for daily expense payouts, unpaid salary warnings, and triggered random events.
- **Minigame & Quality Loop Wiring (`ifx.2`)**:
  - Tied minigame performance (`rawScore`) into `project.minigamePoints` and factored it into `generateProjectReview`.
  - Integrated stage-specific games: `EQMatchGame` for mixing, `FaderRideGame` for mastering, and `PunchInGame` for tracking.
- **Verification & Bead Tracking**:
  - Validated build passes (`npm run build`).
  - Tested upkeep and event integration execution via unit tests in tsx.
  - Closed beads `recording-studio-tycoon-ruc.2`, `ruc.3`, and epic `ruc`. Closed `1yf` epic.

## Next Steps
1. Next ready tasks from beads:
   - `recording-studio-tycoon-goj.2`: Replace RightPanel tabs with contextual inspector popups.
   - `recording-studio-tycoon-goj.3`: Remove web affordances and add game transitions.
   - `recording-studio-tycoon-ifx.3`: Milestone rewards that visibly upgrade the studio room.


