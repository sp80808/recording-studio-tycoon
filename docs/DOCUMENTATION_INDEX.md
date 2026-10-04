<!-- 
   File: DOCUMENTATION_INDEX.md
   Purpose: Central index for all project documentation with version tracking
   Version: 0.3.3
   Created: 2025-06-08
   Last Modified: 2026-10-04
   Status: Active
-->

# Documentation Index & Version Tracking
*Recording Studio Tycoon - Complete Documentation Overview*
*Updated: October 4, 2026 — juice & diegetic-interactions planning*

## 📚 Quick Navigation
- **[Main Documentation](./README.md)** - Start here for all documentation
- **[Current Development Status](./current/CURRENT_STATUS.md)** - What's happening now
- **[Quick Start Guide](./QUICK_START.md)** - Get up and running
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## 🎮 Current Systems (verified in code, September 2026)
| System | Source path | Purpose |
|--------|-------------|---------|
| Studio shell / hotspots | [`../src/components/StudioRoom.tsx`](../src/components/StudioRoom.tsx), [`../src/components/WebGLCanvas.tsx`](../src/components/WebGLCanvas.tsx) | Isometric PixiJS floor, 6 hotspots, roomTier 1–5 upgrades |
| Inspector popups | [`../src/components/StudioInspector.tsx`](../src/components/StudioInspector.tsx) | Contextual per-hotspot panels (phone gigs, clock challenges, TV charts, shelf gear, console project) |
| Era color grade | [`../src/components/EraGrade.tsx`](../src/components/EraGrade.tsx) | Era-palette overlay + transition flash |
| Minigame manager | [`../src/components/minigames/MinigameManager.tsx`](../src/components/minigames/MinigameManager.tsx) | 15 minigame types incl. EQ Match / Fader Ride / Punch-In |
| Minigame chrome / juice kit | [`../src/components/minigames/MinigameChrome.tsx`](../src/components/minigames/MinigameChrome.tsx), [`../src/components/minigames/minigame-juice.css`](../src/components/minigames/minigame-juice.css) | Shared frame, streak badge, CSS juice (4 of 15 games migrated) |
| Project lifecycle | [`../src/game-mechanics/ProjectService.ts`](../src/game-mechanics/ProjectService.ts) | Stage/focus/assignment/completion wiring |
| Settlement scoring | [`../src/utils/projectReviewUtils.ts`](../src/utils/projectReviewUtils.ts) | `generateProjectReview`: skills/staff/equipment/focus/market/match |
| Daily challenges | [`../src/utils/dailyChallenges.ts`](../src/utils/dailyChallenges.ts) | Deterministic seeded daily challenge + `DailyTracking` counters |
| Daily tick economy | [`../src/hooks/useGameActions.tsx`](../src/hooks/useGameActions.tsx) | `advanceDay`: salaries/upkeep, `rollDailyEvents`, gig cooldown ($50 / 3d) |
| Simulation clock (idle core) | [`../src/simulation/simulationClock.ts`](../src/simulation/simulationClock.ts) | `advanceSimulation` + `shouldShowSimulationSummary`; 5-min slices, 8h offline cap; never settles payout |
| Seeded RNG | [`../src/simulation/seededRandom.ts`](../src/simulation/seededRandom.ts) | `createSeededRandom`/`randomInt`/`pickWithRandom`; review + intervention determinism |
| Welcome-back summary | [`../src/components/modals/WelcomeBackSummaryModal.tsx`](../src/components/modals/WelcomeBackSummaryModal.tsx) | Offline catch-up summary modal (wired in `../src/pages/Index.tsx`) |
| Intervention flow | [`../src/hooks/useStageWork.tsx`](../src/hooks/useStageWork.tsx), [`../src/components/ActiveProject.tsx`](../src/components/ActiveProject.tsx) | Optional ephemeral intervention; Intervene / Delegate / Skip, never blocking |
| Enquiry inbox + studio strip | [`../src/components/ProjectList.tsx`](../src/components/ProjectList.tsx), [`../src/components/StudioStrip.tsx`](../src/components/StudioStrip.tsx) | Artist Enquiry / Book Session vocabulary, compact strip |

## 📚 Documentation Categories

### 🎯 Current Development (Active) - Updated June 11, 2025
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [README.md](./README.md) | 0.3.2 | 2025-06-11 | **NEW** | Main documentation entry point and navigation |
| [Current Status](./current/CURRENT_STATUS.md) | 0.3.2 | 2025-06-11 | Active | Current development focus and immediate tasks |
| [Documentation Organization Plan](./DOCUMENTATION_ORGANIZATION_2025-06-11.md) | 1.0.0 | 2025-06-11 | **NEW** | Documentation restructuring plan |
| [Progress](./progress.md) | 0.3.1 | 2025-06-10 | Active | Overall project progress and milestone tracking |

### 🚀 Recent Updates (June 11, 2025)
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Equipment Purchase Audio Analysis](./logs_and_reports/EQUIPMENT_PURCHASE_AUDIO_ANALYSIS.md) | 1.0.0 | 2025-06-11 | **NEW** | Comprehensive dual audio system analysis |
| [UI/UX Overhaul Considerations: Viewport Resilience](./UI_UX_OVERHAUL_CONSIDERATIONS.md) | 1.0.0 | 2026-09-28 | **NEW** | Windowed scrolling, viewport height resilience & core action accessibility |
| [Pixi Presentation Audit](./pixi-presentation-audit.md) | 1.0.0 | 2026-09-29 | **NEW** | Living-studio Pixi layer stack, hotspots, perf, screenshot UX issues |
| [UX Visual Iterative Plan](./ux-visual-iterative-plan.md) | 1.0.0 | 2026-09-29 | **NEW** | P0–P2 polish plan for HUD, splash, iso room, expansions |
| [Multi-Room Blueprints](./multi-room-blueprints.md) | 1.0.0 | 2026-09-29 | **NEW** | Iso ↔ top-down facility map, adjacency/doors, cosmetics-only monetisation |
| [Studio Strip Audit & Remediation Plan](./STUDIO_STRIP_AUDIT.md) | 1.0.0 | 2026-09-28 | **NEW** | Audit of broken StudioStrip compact mode, dead-end loops, and viewport blackout |
| [Game Juice & Visual Effects Plan](./JUICE_PLAN.md) | 1.0.0 | 2026-10-04 | **NEW** | Verified installed deps (pixi-filters 6.1.5 fits Pixi 8), DOM/canvas boundary, mobile perf gates, license table. Beads `recording-studio-tycoon-yt7` |
| [Diegetic Studio Interactions Plan](./DIEGETIC_INTERACTIONS_PLAN.md) | 1.0.0 | 2026-10-04 | **NEW** | Two-family split: minigames vs diegetic interactions; 29-idea catalogue, migration-not-duplicate rule, wavesurfer/Matter/Meyda/JZZ tooling, `TactileFeedback` service. Beads `recording-studio-tycoon-1et` |
| [Documentation Update Summary](./logs_and_reports/DOCUMENTATION_UPDATE_SUMMARY_2025-06-11.md) | 1.0.0 | 2025-06-11 | **NEW** | Summary of June 11 documentation changes |
| [Work Progression Enhancement Log](./logs_and_reports/WORK_PROGRESSION_ENHANCEMENT_LOG.md) | 1.0.0 | 2025-06-11 | Updated | Work progression system implementation |

### 💾 Memory Bank (v0.3 - Updated June 11)
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Active Context](../memory-bank/activeContext.md) | 0.3 | 2025-06-11 | Updated | Current development context and tasks |
| [Progress Tracking](../memory-bank/progress.md) | 0.3 | 2025-06-11 | Updated | Project progress and milestones |
| [System Patterns](../memory-bank/systemPatterns.md) | 0.3 | 2025-06-11 | Updated | Code patterns and architecture notes |
| [Tech Context](../memory-bank/techContext.md) | 0.3 | 2025-06-11 | Updated | Technical implementation details |
| [Product Context](../memory-bank/productContext.md) | 0.3 | 2025-06-11 | Updated | Product strategy and features |

### 🎮 System Documentation (New - June 10)
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Sound System Documentation](./system_designs_and_specs/SOUND_SYSTEM_DOCUMENTATION.md) | 1.0.0 | 2025-06-10 | Active | Comprehensive audio system implementation guide |
| [Visual Polish & Animation System](./system_designs_and_specs/VISUAL_POLISH_ANIMATION_SYSTEM.md) | 1.0.0 | 2025-06-10 | Active | Animation patterns and visual feedback systems |
| [Minigame Design Patterns](./development_guidelines/MINIGAME_DESIGN_PATTERNS.md) | 1.0.0 | 2025-06-10 | Active | Minigame architecture and implementation patterns |
| [Project Management Workflow](./development_guidelines/PROJECT_MANAGEMENT_WORKFLOW.md) | 1.0.0 | 2025-06-10 | Active | Project lifecycle and workflow documentation |
| [Gameplay Enhancement Roadmap](./roadmaps_and_strategic_overviews/GAMEPLAY_ENHANCEMENT_ROADMAP.md) | 1.0.0 | 2025-06-10 | Active | Long-term enhancement strategy and timeline |

### 🏗️ Architecture & Development
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Implementation Roadmap](./roadmaps_and_strategic_overviews/IMPLEMENTATION_ROADMAP.md) | 0.3.0 | 2025-06-08 | Active | Development timeline and technical architecture |
| [Development Standards](./development_guidelines/DEVELOPMENT_STANDARDS.md) | 0.3.0 | 2025-06-08 | Active | Code quality and documentation standards |
| [Version History](./logs_and_reports/VERSION_HISTORY.md) | 0.3.0 | 2025-06-08 | Active | Complete changelog and version tracking |
| [Codebase Analysis](./logs_and_reports/CODEBASE_ANALYSIS_2025.md) | 0.3.0 | 2025-06-08 | Active | Comprehensive system analysis and status |

### 🎮 Game Systems Documentation
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Game Overview](./roadmaps_and_strategic_overviews/GAME_OVERVIEW.md) | 0.2.0 | 2025-06-06 | Active | Master game design documentation |
| [Charts System Implementation](./active_implementation_plans/CHARTS_SYSTEM_IMPLEMENTATION.md) | 0.3.0 | 2025-06-08 | Active | Charts and industry integration guide |
| [Music Industry Charts](./system_designs_and_specs/MUSIC_INDUSTRY_CHARTS.md) | 0.3.0 | 2025-06-08 | Active | Charts system design and implementation |
| [Era Based Progression Detailed](./system_designs_and_specs/ERA_BASED_PROGRESSION_DETAILED.md) | 0.1.0 | 2025-06-05 | Active | Historical timeline and progression system |

### 📋 Integration & Testing
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Integration Testing Report](./logs_and_reports/INTEGRATION_TESTING_REPORT.md) | 0.3.0 | 2025-06-08 | Active | System integration testing results |
| [Music Timing Fix](./completed_implementation_plans/MUSIC_TIMING_FIX.md) | 0.3.0 | 2025-06-08 | Active | Background music timing optimization documentation |

### 📋 Current Status & Planning
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Current Task](./current_task_and_summaries/CURRENT_TASK.md) | 0.3.0 | 2025-06-08 | Active | Current development focus and immediate tasks |
| [Progress](./progress.md) | 0.3.0 | 2025-06-08 | Active | Overall project progress and milestone tracking |
| [Enhancement Implementation Log](./logs_and_reports/ENHANCEMENT_IMPLEMENTATION_LOG.md) | 0.3.0 | 2025-06-08 | Active | Detailed implementation progress tracking |

### 🎵 Feature Design Documents
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Track Release Plan](./active_implementation_plans/TRACK_RELEASE_PLAN.md) | 0.1.0 | 2025-06-05 | Draft | Track release and promotion system |
| [A&R Department System](./system_designs_and_specs/AR_DEPARTMENT_SYSTEM.md) | 0.1.0 | 2025-06-05 | Draft | Artist development and talent scouting |
| [Design Notes Original Tracks](./system_designs_and_specs/DESIGN_NOTES_ORIGINAL_TRACKS.md) | 0.1.0 | 2025-06-05 | Draft | Band creation and original music systems |
| [EPK Communication System](./active_implementation_plans/EPK_COMMUNICATION_SYSTEM.md) | 0.1.0 | 2025-06-05 | Draft | Electronic press kit and communication tools |
| [Advanced Progression Plan](./active_implementation_plans/ADVANCED_PROGRESSION_PLAN.md) | 0.2.0 | 2025-06-07 | Draft | Advanced game progression mechanics |

### 🔧 Technical Specifications
| Document | Version | Last Updated | Status | Purpose |
|----------|---------|--------------|--------|---------|
| [Chart Track Audio Implementation Plan](./active_implementation_plans/CHART_TRACK_AUDIO_IMPLEMENTATION_PLAN.md) | 0.3.0 | 2025-06-08 | Active | Audio system implementation guide |
| [Chart Track Audio Prompts](./logs_and_reports/CHART_TRACK_AUDIO_PROMPTS.md) | 0.3.0 | 2025-06-08 | Active | Audio generation prompts and templates |
| [Charts Music Generation Plan](./active_implementation_plans/CHARTS_MUSIC_GENERATION_PLAN.md) | 0.3.0 | 2025-06-08 | Active | Music generation system design |
| [Era Mechanics Implementation Plan](./active_implementation_plans/ERA_MECHANICS_IMPLEMENTATION_PLAN.md) | 0.1.0 | 2025-06-05 | Draft | Era-specific mechanics implementation |
| [Suno API Integration Plan](./active_implementation_plans/SUNO_API_INTEGRATION_PLAN.md) | 0.2.0 | 2025-06-07 | Draft | AI music generation integration |

---

## 🗂️ Archived Documentation
*Moved to `docs/old/` folder for historical reference*

- Code Citations and Legacy Documentation
- Comprehensive Gameplay Expansion (superseded by Gameplay Enhancement Roadmap)
- Strategic Gameplay Enhancements (superseded by current roadmaps)
- Game Improvement Roadmap (superseded by Gameplay Enhancement Roadmap)
- Phase 3 Plan (superseded by Implementation Roadmap)
- Optimization Plan (integrated into current development standards)
- Library Integration and Game Design (superseded by current architecture docs)

---

## 📈 Documentation Status Overview

### ✅ Current (v0.3.0)
- **20+ Active Documents** with version tracking
- **Comprehensive system coverage** from architecture to features
- **Implementation progress tracking** with detailed logs
- **Technical specifications** for all major systems

### 🔄 In Progress
- Era-specific mechanics documentation updates
- Integration testing documentation
- Performance optimization guides
- Mobile responsiveness specifications

### 📅 Planned (v0.4.0)
- Component API documentation
- Testing strategy documentation
- Deployment and build documentation
- User manual and gameplay guides

---

## 🗂️ Documentation Maintenance

### Update Schedule
- **Daily**: Current Task, Progress tracking
- **Weekly**: Implementation logs, feature documentation
- **Per Version**: Version history, codebase analysis
- **As Needed**: Technical specifications, design documents

### Quality Standards
- All documents include version headers
- Change logs maintained for all files
- Cross-references updated with changes
- Status tracking (Active/Draft/Deprecated)

### Responsibility Matrix
| Document Type | Primary Owner | Review Required |
|---------------|---------------|-----------------|
| Architecture | Lead Developer | Technical Review |
| Game Design | Game Designer | Creative Review |
| Implementation | Developer | Code Review |
| Progress | Project Manager | Stakeholder Review |

---

## 🔍 Quick Navigation

### For Developers
1. Start with [Development Standards](./development_guidelines/DEVELOPMENT_STANDARDS.md)
2. Review [Implementation Roadmap](./roadmaps_and_strategic_overviews/IMPLEMENTATION_ROADMAP.md)
3. Check [Current Task](./current_task_and_summaries/CURRENT_TASK.md) for immediate work
4. Reference [Codebase Analysis](./logs_and_reports/CODEBASE_ANALYSIS_2025.md) for system overview

### For Design Review
1. Begin with [Game Overview](./roadmaps_and_strategic_overviews/GAME_OVERVIEW.md)
2. Examine [Charts System](./system_designs_and_specs/MUSIC_INDUSTRY_CHARTS.md)
3. Study [Era Progression](./system_designs_and_specs/ERA_BASED_PROGRESSION_DETAILED.md)
4. Review [Enhancement Log](./logs_and_reports/ENHANCEMENT_IMPLEMENTATION_LOG.md)

### For Project Management
1. Monitor [Progress](./progress.md)
2. Track [Current Task](./current_task_and_summaries/CURRENT_TASK.md)
3. Review [Version History](./logs_and_reports/VERSION_HISTORY.md)
4. Plan with [Implementation Roadmap](./roadmaps_and_strategic_overviews/IMPLEMENTATION_ROADMAP.md)

---

## 📊 Documentation Metrics

### File Count by Category
- **Architecture**: 4 files
- **Game Systems**: 5 files
- **Status & Planning**: 3 files
- **Feature Design**: 4 files
- **Technical Specs**: 3 files
- **Total**: 19 active documentation files

### Version Distribution
- **v0.3.0**: 12 files (63%)
- **v0.2.0**: 3 files (16%)
- **v0.1.0**: 4 files (21%)

### Update Frequency
- **Daily Updates**: 3 files
- **Weekly Updates**: 8 files
- **Version Updates**: 8 files

---

## 🔄 Change Log
- **2026-09-27**: Idle-core train sync (o8t) — added Current Systems rows for simulationClock, seeded RNG, WelcomeBackSummaryModal, intervention flow, enquiry inbox + strip
- **2026-09-27**: Current-codebase refresh (v0.3.3) — added Current Systems table with verified src paths; fixed dead links to relocated docs; removed entries for files that no longer exist
- **2025-06-08**: Initial creation of documentation index (v0.3.0)
- **2025-06-08**: Added version tracking for all documentation files (v0.3.0)
- **2025-06-08**: Established maintenance schedule and quality standards (v0.3.0)

---

*This index serves as the central hub for all Recording Studio Tycoon documentation, ensuring version consistency and easy navigation across all project documents.*
