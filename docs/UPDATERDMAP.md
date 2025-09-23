# Update Roadmap for Recording Studio Tycoon

This document collects prioritized feature ideas for upcoming updates. Each entry includes a concise description, a suggested priority, and an estimated implementation complexity for the existing React + TypeScript codebase.

> Assumption: Core entities (`Artist`, `Song`, `RecordingEquipment`, `StudioRoom`, `Financials`) and their state logic exist and features should extend or interact with those systems.

## I. Core Systems & Quality of Life (QoL)

- **Feature:** Advanced Production Queue
  - **Description:** Allow players to queue multiple studio tasks (recording sessions, editing, mixing, mastering) for each `StudioRoom`. Engineers and artists will automatically work through the queue in order, with task durations, priority overrides, and batching options. Includes UI for reordering, pausing, and saving named queues.
  - **Priority:** High
  - **Complexity:** Medium

- **Feature:** Batch Release Scheduler
  - **Description:** Provide a calendar-style scheduler where players can plan releases, marketing campaigns, and tours. The scheduler supports bulk actions (delay/release multiple songs), auto-adjusting marketing budgets by date, and conflict warnings (two releases too close together). Ties into `Financials` for forecasting revenue spikes.
  - **Priority:** High
  - **Complexity:** Medium

- **Feature:** Quick Assign Presets
  - **Description:** Let players create and apply staff/engineer/room assignment presets (e.g., "Standard Vocal Session", "Full Band Tracking"). One-click apply populates task slots and equipment presets, reducing repetitive clicks during the mid-to-late game.
  - **Priority:** Medium
  - **Complexity:** Small

- **Feature:** Enhanced Tooltip & Contextual Guidance
  - **Description:** Contextual tooltips and inline help that adapt to the player's progress and state (e.g., show tips for `RecordingEquipment` maintenance when degradation is high). Includes a toggleable tutorial overlay for complex screens and a searchable help panel.
  - **Priority:** High
  - **Complexity:** Small

- **Feature:** Action History & Undo
  - **Description:** Maintain a short action history allowing the player to undo the last 1-3 non-destructive actions (e.g., reassign a session, cancel a release, revert equipment trade). Useful for correcting misclicks and reducing friction.
  - **Priority:** Medium
  - **Complexity:** Medium

## II. Gameplay Deepening & Expansion

- **Feature:** Artist Personality & Relationship System
  - **Description:** Expand `Artist` with personality traits, preferred genres, ego level, and relationship meters (with the player, engineers, and other artists). Traits affect performance, collaboration, and negotiation; relationships unlock unique events and branching dialogue.
  - **Priority:** High
  - **Complexity:** Large

- **Feature:** Equipment Aging & Maintenance
  - **Description:** Add wear-and-tear mechanics to `RecordingEquipment` (tape machines, preamps, mics). Equipment performance decays over time and requires maintenance or calibration. New UI shows predicted failure windows and maintenance costs which impact `Financials` and scheduling.
  - **Priority:** Medium
  - **Complexity:** Medium

- **Feature:** Staff Skill Trees & Specializations
  - **Description:** Introduce skill progression trees for engineers, producers, and session musicians (mixing, mastering, arrangement, genre specialization). Skill choices yield passive bonuses (faster sessions, higher quality mixes) and unlock advanced actions.
  - **Priority:** High
  - **Complexity:** Medium

- **Feature:** Advanced Contract Negotiations
  - **Description:** Replace simple flat contracts with negotiation mini-systems: royalty splits, advances, territorial rights, exclusivity, and success-based milestones. Contracts now influence long-term revenue and artist loyalty.
  - **Priority:** High
  - **Complexity:** Large

- **Feature:** Sub-Genre & Trend System
  - **Description:** Implement drifting music trends and micro-genres that evolve over time. `Song` metadata includes sub-genre tags that interact with market demand. Trend-aware marketing and production choices increase hit chance.
  - **Priority:** Medium
  - **Complexity:** Medium

## III. Mid-to-Late Game Content

- **Feature:** Record Label Management & Roster
  - **Description:** Allow players to found or acquire a label, sign multiple artists with tiered deals, and manage label-level decisions (A&R hires, distribution partners, sync divisions). Adds higher-level financials (label overhead, royalties, and licensing income).
  - **Priority:** High
  - **Complexity:** Large

- **Feature:** Touring & Live Production System
  - **Description:** Create a tour planning and execution subsystem: book venues, manage logistics (crew, transport, equipment), and handle live performance quality (which impacts merchandise sales, reputation, and streaming numbers). Tours can be regional or global and introduce per-show risk/reward mechanics.
  - **Priority:** Medium
  - **Complexity:** Large

- **Feature:** Awards & Industry Recognition (e.g., "The Grammys")
  - **Description:** Seasonal award events where nominated songs and artists compete. Awards provide reputation boosts, unlocks (legendary collaborations, festival invites), and one-time revenue spikes. Nomination criteria tie into song performance metrics and campaign investments.
  - **Priority:** Medium
  - **Complexity:** Medium

- **Feature:** Legendary Artist Events & Historical Milestones
  - **Description:** Time-gated special events that introduce legendary artists, historical industry shifts (the rise of MTV, streaming boom), and scenario-based challenges. These events alter market trends temporarily and offer unique rewards.
  - **Priority:** Low
  - **Complexity:** Medium

- **Feature:** Licensing, Sync Placements & Media Deals
  - **Description:** Add a system for pitching songs for use in films, TV, ads, and games. Sync placements generate lump-sum payouts and recurring royalties and require matching song mood/tags to briefs. Successful placements increase artist visibility.
  - **Priority:** Medium
  - **Complexity:** Medium

---

## Implementation Notes & Next Steps

- Start by scoping one QoL + one Gameplay Deepening feature as a minimal viable iteration (e.g., `Advanced Production Queue` + `Equipment Aging & Maintenance`) to maximize early player-facing impact.
- Prefer small, testable UI improvements (tooltips, presets) first to reduce player friction while larger systems (labels, tours) are designed.
- Where possible, implement features as modular Zustand slices and reusable React components so they can plug into existing entities (`Artist`, `Song`, `RecordingEquipment`, `StudioRoom`, `Financials`).

## Appendix: Example Mapping to Existing Systems

- `Artist` — personality, contracts, awards, tours, sync placements.
- `Song` — sub-genre tags, release scheduling, chart performance, sync metadata.
- `RecordingEquipment` — aging state, maintenance actions, sound quality modifiers.
- `StudioRoom` — production queues, booked sessions, equipment assignments.
- `Financials` — projected revenue from scheduler, label overhead, sync payouts.

---

This document is a starting point—each feature should be broken down into tasks and acceptance criteria in the issue tracker before implementation.

## IV. Additional Feature Candidates (expanded)

- **Feature:** Analytics Dashboard & Live Metrics
  - **Description:** A developer- and player-facing dashboard that surfaces KPIs: current cash runway, weekly revenue, top-performing songs, room utilization, equipment failure risk, and artist satisfaction trends. Useful for balancing and for an optional "pro mode" planning screen.
  - **Priority:** Medium
  - **Complexity:** Medium

- **Feature:** Modular Event/Scenario System
  - **Description:** A reusable event engine for one-off scenarios (label offers, equipment recalls, artist scandals) with branching outcomes. Implement as data-driven JSON scenarios so designers can author events without code.
  - **Priority:** Medium
  - **Complexity:** Medium

- **Feature:** Dynamic Pricing & Marketplace
  - **Description:** Allow buying/selling used equipment in a marketplace that fluctuates by era and demand. Includes auction mechanics and dealer relationships that provide discounts or rare gear.
  - **Priority:** Low
  - **Complexity:** Medium

- **Feature:** Collaboration & Co-Writing Sessions
  - **Description:** Let multiple signed artists collaborate on projects. Collaboration can yield higher-quality songs but introduces scheduling and ego-management complexity. Works with the `Artist` relationship system.
  - **Priority:** Medium
  - **Complexity:** Medium

## V. MVP Recommendations

To maximize player satisfaction and reduce development risk, I recommend tackling features in this order for an MVP-oriented release:

1. High-impact QoL: `Advanced Production Queue` (Medium) and `Quick Assign Presets` (Small)
2. Production reliability: `Equipment Aging & Maintenance` (Medium)
3. Player guidance: `Enhanced Tooltip & Contextual Guidance` (Small)
4. Core deepening: `Staff Skill Trees & Specializations` (Medium)
5. Release tooling: `Batch Release Scheduler` (Medium)

Estimated combined effort for a tight MVP: 8–14 developer-weeks (assuming a small cross-functional team: 1–2 frontend devs, 1 designer, 1 QA). These are conservative estimates intended for initial planning; break into 1–2 week tasks.

## VI. Estimates & Implementation Sizing Guidance

Mapping the Complexity labels to rough implementation effort (team of experienced React/TS devs):

- Small: 1–2 developer-weeks (UI, state slice, 2–4 tests)
- Medium: 3–6 developer-weeks (state, UI, integration with at least 2 entities, 5–10 tests, basic analytics)
- Large: 8–16+ developer-weeks (new systems touching many entities, persistent storage changes, cross-cutting features, many tests)

When creating issues, include an estimate (in developer-days or story points) and break large features into vertical slices delivering incremental player value.

## VII. 12-Week Gantt-like Timeline (Sprint View)

Legend: S = Sprint (2 weeks). We target 6 sprints (12 weeks) for an MVP + polish. Each sprint row shows which features should be actively developed or in review.

Weeks:  01-02 03-04 05-06 07-08 09-10 11-12
Sprints:  S1    S2    S3    S4    S5    S6

Core QoL
- Advanced Production Queue:    ████ ████ █      
- Quick Assign Presets:         ███               
- Enhanced Tooltips:            ██                
- Action History & Undo:            ██ █          

Gameplay Deepening
- Equipment Aging & Maintenance:   ███ ███         
- Staff Skill Trees:                   ███ ███     
- Artist Personality System:           ██ ███ ███  
- Sub-Genre & Trend System:         ███ ███        

Mid-to-Late Content (scoped small MVP pieces)
- Batch Release Scheduler:        ██ ███           
- Analytics Dashboard & Metrics:     ██ ███        
- Licensing & Sync Placements:         ███ ███     

Notes:
- S1: Foundation — wire up Zustand slice patterns, common UI components, and data mocks. Deliver `Quick Assign Presets` and `Enhanced Tooltips` as fast wins.
- S2–S3: Core systems — build `Advanced Production Queue`, `Equipment Aging`, and scheduler integration with `Financials`.
- S4: Deepening — staff skill trees, artist personality base, and trend system prototypes.
- S5: Polishing — analytics dashboard, undo history, and QA-driven polish; begin integrations for licensing and tours.
- S6: Stabilize — performance tuning, localization strings, balance passes, and final QA.

## VIII. Risk, Edge Cases & Mitigations

Edge cases to plan for when implementing features:

- Empty/Null State: Ensure UI gracefully handles no artists/empty queues/zero cash. Provide onboarding messages and safe defaults.
- Conflicting Schedules: When two features try to book the same `StudioRoom`, use a consistent conflict resolution policy (priority by player action timestamp, or allow soft-overbooking warnings).
- Large Data Sets: Ensure UI virtualization for long lists (artist rosters, catalogues) and lazy-loading for history/analytics to avoid slow render times.
- Concurrency & Save State: If using asynchronous flows (timers, background production), ensure save/load is consistent; persist deterministic seeds for time-based systems.
- Financial Exploits: Test for edge cases where players can infinitely exploit royalties/advances; add guardrails like diminishing returns and cooldowns.

Mitigations:
- Write unit tests for state transitions (Zustand slices) and integration tests for key flows (release -> royalties -> ledger update).
- Add feature flags for complex systems (labels, tours) to roll out gradually and toggle during playtests.

## IX. Tests & Acceptance Criteria (example for two features)

- Advanced Production Queue
  - Acceptance: Players can add, reorder, pause, and remove tasks from a room queue. Tasks auto-progress and emit completion events. Reordering preserves task metadata and expected durations.
  - Tests: unit tests for queue operations, integration test that a queued recording produces a `Song` entity after completion, e2e test for UI reorder.

- Equipment Aging & Maintenance
  - Acceptance: Equipment has a degradation value that decreases based on use and time; maintenance restores value at a cost and affects sound quality modifier. Equipment failure events occur if degradation drops below threshold.
  - Tests: unit tests for degradation calculation, integration tests for maintenance transaction affecting `Financials`, and simulated long-running test for failure triggers.

## X. Breaking Down Work into Issues (example templates)

- Issue: "Zustand slice: productionQueue"
  - Description: Create `productionQueue` slice with actions: `enqueue`, `dequeue`, `reorder`, `pause`, `resume`, `savePreset`.
  - Acceptance: slice exported with TypeScript types, unit tests covering core actions.
  - Estimate: 3 dev-days

- Issue: "UI: Production Queue panel"
  - Description: Implement queue panel component, drag-and-drop reorder, pause/resume, and presets modal.
  - Acceptance: Component renders in `StudioRoom`, accessibility checks, e2e reorder test.
  - Estimate: 5 dev-days

## XI. Next Operational Steps

1. Convert high-priority roadmap items into issues with the estimate and acceptance criteria above.
2. Create a small prototype branch for the `Advanced Production Queue` and assign 1 FE + 1 Designer for a 2-week spike (S1).
3. Run closed playtests with internal stakeholders after S3 and S5, iterate on balance and UX.

---

If you'd like, I can now:
- Scaffold the `productionQueue` Zustand slice and a minimal React component to demonstrate the queue UI (includes unit tests).
- Generate GitHub issues for the MVP items with estimates and acceptance criteria.

Which of the two would you like me to do next? 
