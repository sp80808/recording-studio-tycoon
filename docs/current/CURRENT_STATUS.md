# Current Development Status
*Recording Studio Tycoon - Updated: September 27, 2026*

## 📊 Project Overview

**Current Version:** 0.3.1
**Development Phase:** Studio-shell + settlement loop complete; minigame chrome rollout ongoing
**Last Updated:** September 27, 2026

The game shell (`src/pages/Index.tsx`) mounts the full game. The home screen is an isometric PixiJS studio floor (`src/components/StudioRoom.tsx` / `src/components/WebGLCanvas.tsx`); management UI lives in a collapsed drawer (`MainGameContent`).

## ✅ Completed systems

- **Isometric studio floor** — 6 clickable hotspots (console, liveRoom, phone, clock, tv, shelf), each opening a contextual `StudioInspector` popup.
- **Milestone room upgrades** — `roomTier` 1–5 derived from `ProgressionSystem` milestones; drives visible Pixi furniture/gear upgrades (Home Studio → Bedroom+ → Project Studio → Studio A → Hit Factory) with tier-up flash + fanfare. Extended with deterministic **daily challenges** (`src/utils/dailyChallenges.ts`), surfaced in the clock inspector.
- **15 minigames via `MinigameManager`** — incl. new EQ Match, Fader Ride, Punch-In. Shared `MinigameChrome` + `minigame-juice.css` kit; combo streak + Overdrive (2 energy, +75%, burnout risk); scores feed project quality via `minigamePoints` (0–10).
- **Real settlement** — `generateProjectReview` (`src/utils/projectReviewUtils.ts`, wired through `ProjectService`) scores skills, staff contribution, equipment, studio quality, focus effectiveness, artist match, and market multiplier.
- **Daily tick economy** — `advanceDay` deducts staff salaries + equipment upkeep into `financials` (`income`/`expenses`/`profit`/`reports`), rolls random events (`rollDailyEvents`), resets `dailyTracking`.
- **Gig pipeline** — phone-inspector gig list with $50 refresh cost and 3-day cooldown (`GIG_REFRESH_COST`, `GIG_REFRESH_COOLDOWN_DAYS` in `useGameActions`).
- **Era color grade** — `EraGrade` pointer-events-none overlay tinted from the current era palette.
- **Tooling** — pnpm 12 (`packageManager` + `devEngines` in `package.json`); beads issue tracking (`.beads/`).
- **Desktop-idle core loop (train #7/#11/#21/#22/#42 → `feature/polished-pre-overhaul`)** — enquiry → book (`src/components/ProjectList.tsx` Artist Enquiries inbox with fit/fee/rep/time + repeat-client tier; `src/components/StudioStrip.tsx` compact strip with next enquiry + `Book $` action; booking in `src/components/MainGameContent.tsx`) → passive session (`advanceSimulation` in `src/simulation/simulationClock.ts`: 5-min slices, live 5s tick + offline catch-up capped at 8h `DEFAULT_MAX_OFFLINE_MS` in `src/pages/Index.tsx`) → optional intervention (`src/hooks/useStageWork.tsx` + `src/components/ActiveProject.tsx`: Intervene / Delegate via `rankStaffForProject` / Skip, never blocking) → review/payout (`generateProjectReview` in `src/utils/projectReviewUtils.ts` remains the sole settlement authority; passive sim never pays out).
- **Welcome Back summary** — `src/components/modals/WelcomeBackSummaryModal.tsx`, gated by `shouldShowSimulationSummary` (≥60s credited plus progress); shows time credited, work added, stages completed, delivery-ready notice, staff energy, and offline-cap warning.
- **Seeded RNG determinism** — `src/simulation/seededRandom.ts` (`createSeededRandom` Mulberry32 + `randomInt`/`pickWithRandom`); review seeds (`projectReviewUtils.ts`) and intervention seeds (`useStageWork.tsx`).

## 🚧 Open P2s

1. **MinigameChrome rollout to remaining games** — only 4 of 15 minigames (MixingBoard, FaderRide, PunchIn, EQMatch) use the shared chrome/juice kit; 11 legacy games still render bespoke UI.
2. **Audio unlock** — Web Audio background playback still gated on first user gesture; no in-game unlock prompt yet.
3. **Still open (tracked drafts)** — #23/#24/#25 drafts, Studio OS V2 #41.

## 🔧 Technical Stack Status

- **React + TypeScript 5.x** ✅ Stable
- **Vite 5** ✅ Stable
- **Tailwind CSS + Radix/shadcn** ✅ Stable
- **PixiJS 8** ✅ Stable (studio floor)
- **Web Audio** 🟡 Operational, gesture-gated
- **pnpm 12 / beads** ✅ Active workflow

## 📞 Support & Resources

- **[Main README](../../README.md)** - Primary documentation entry
- **[Documentation Index](../DOCUMENTATION_INDEX.md)** - Complete documentation overview
- **[Troubleshooting](../TROUBLESHOOTING.md)** - Issue resolution
- **Task tracking**: `bd ready` / `bd show <id>` / `bd close <id>`

---

*Last updated: September 27, 2026*
