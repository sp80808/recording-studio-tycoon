# GitHub Issue Triage & Orchestration Map

_Last reconciled: 2026-09-29 (session: gamepad 49i.2 + issue reconciliation)_

**Product backlog:** GitHub Issues (`gh issue list`) — the "what/why" source of truth.
**Execution tracker:** Beads (`bd ready`, `bd show <id>`) — every implementation task must
exist as a bead before work starts (`AGENTS.md`). This file maps the two and defines the
execution order so future sessions do not re-triage.

## 1. Reconciled this session (verified delivered → closed on GitHub)

| GH | Title | Evidence |
|----|-------|----------|
| #54 | Sidebars/center view unscrollable when windowed | Layout rebuilt around `studio-play.css` full-bleed floor + contextual `studio-activity-panel` dialogs; height media queries at 768/600/500px; primary action dock + command dock always on-screen. Live-verified at 1440×900 and 1366×768 (bead `zel.5`). |
| #9 | Desktop idle loop MVP | PRs #11/#21/#22 merged (beads `8ig.2/3/4`): enquiries feed, passive sessions, interventions all live in the studio floor. |
| #12 | Deterministic clock + offline catch-up + Welcome Back | PR #21 merged; `src/simulation/simulationClock.ts`, `WelcomeBackSummaryModal.tsx`, wired in `Index.tsx`. |
| #13 | Optional intervention scheduler + staff auto-resolution | PR #22 merged; intervention flow in `ActiveProject.tsx` / `useStageWork.tsx`. |
| #16 | Living Studio Scene spike | Pixi v8 isometric room shipped (`WebGLCanvas.tsx`, `StudioRoom.tsx`) with staff, gear activity, day/night, hotspots. |
| #20 | First paid session onboarding | Bead `g5i` closed; state-inferred `FirstSessionGuide` (non-blocking) + `tests/first-session-guide.check.ts` in `pnpm test`. |

## 2. Open GitHub issues already tracked in Beads (execute via `bd ready`)

| GH | Bead(s) | State |
|----|---------|-------|
| #40 merge train | `8ig` epic — `.6` (PR #53 supersedes #23) and `.7` (PR #24 staff fit) **blocked on merge decisions** | 5/7 merged |
| #41 Studio OS V2 | `goj` epic (closed) + `zel` epic (closed) — delivered via studio-play/dock/panel overhaul | done in code; close candidate |
| #45 Kairosoft R&D | `sd3` RPG slices (3/5 done; `.3` retention, `.4` economy in progress) | in progress |
| #8 release plan / #19 balance harness / #43 repo cleanup | `z2f.6`, `mhk`, `p33`, `o8t`, `6zi` | in progress / open |

## 3. Not yet in Beads — new backlog (#48–#64). Recommended build order

Dependency-aware sequence (do not start later items before earlier ones land):

1. **#59 telemetry + replay traces** — measurement substrate; feeds #57/#56/#63.
2. **#57 Balance Lab (Tweakpane sweeps)** — extends existing `src/dev/balance` harness; tunes everything else.
3. **#55 explainable outcome forecasts** — player-facing clarity; reuses balance math.
4. **#56 event director (memories/cooldowns/storylets)** — needs #59 traces to tune; big narrative leap.
5. **#48 creative briefs → #51 service mix → #50 label accounts → #49 artist careers → #52 market trends** — coherent gameplay chain; briefs/recipes unlock the rest.
6. **#61 booking calendar** — depends on #14 capacity model (PR #53) landing first.
7. **#62 maintenance/reliability** — pairs with #17 used-gear depth (still unbuilt).
8. **#63 Studio Seasons** — depends on #59 + career arc (#49).
9. **#64 Content Workbench** — depends on schemas stabilising (#48/#56).
10. **#58 CC0 placeholder kit** — independent; parallelizable any time.

## 4. Decisions needed (raise with owner before executing)

- **Merge PR #53** (physical rooms, supersedes #23) and **PR #24** (staff specialization fit):
  both conflict with the years of UI overhaul on `main`; needs a rebase plan or explicit
  "re-implement on main" decision. Unblocks beads `8ig.6`/`8ig.7` and GH #14/#15.
- **Default branch**: `origin/HEAD` still points at `feature/polished-pre-overhaul`; all work
  since the merge train has landed on `main`. Flip default to `main` to finish #43.
- **#19 remainder**: harness has 3 strategy bots + invariants + JSON export; missing
  reputation/repeat-client bots, CSV, and early/mid/late snapshot scenarios (`k6e` scope).
- **R&D spikes #26–#39**: decide adopt/close individually. Already adopted: #29 Tone.js.
  Not adopted (custom check harness instead of fast-check/Vitest #31; no Comlink #37 etc.).

## 5. Legacy 2025 backlog (#3–#6)

Flea market (#3), box drops (#4), agent system (#5), social media minigame (#6) — pre-overhaul
ideas; re-scope against current systems before implementation. #8 stays the long-range umbrella.
