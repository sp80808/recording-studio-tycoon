# Recording Studio Tycoon
*A comprehensive music industry simulation game built with React, TypeScript, and modern web technologies*

## 🎯 Project Overview
Recording Studio Tycoon is a music industry simulation game: run a recording studio from the 1960s onward — hire staff, buy gear, take gigs, work project stages, play production minigames, and settle completed projects for money, reputation, and charts.

**Current Version:** 0.3.1
**Development Status:** Active Development
**Last Updated:** September 27, 2026

**Game shell:** `src/pages/Index.tsx` mounts the full game. The home screen is an isometric PixiJS studio floor (`src/components/StudioRoom.tsx` / `src/components/WebGLCanvas.tsx`) with 6 clickable hotspots — console, live room, phone, clock, TV, shelf — each opening a contextual popup (`src/components/StudioInspector.tsx`). The 5-tab management panel lives in a collapsed on-demand drawer (`MainGameContent`).

## 🚀 Quick Start

### For Developers
- **[Quick Start Guide](./docs/QUICK_START.md)** - Get the project running locally
- **[Documentation Index](./docs/DOCUMENTATION_INDEX.md)** - Complete documentation overview
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

### For Contributors  
- **[Main Documentation](./docs/README.md)** - Complete documentation entry point
- **[Current Development Status](./docs/current/CURRENT_STATUS.md)** - What we're working on now
- **[Bug Fix & Polish Plan](./docs/bugfix_and_polish_plan.md)** - Current critical fixes

## 📚 Core Documentation

### 🏗️ Architecture & Systems
- **[Skill System Architecture](./docs/architecture/SKILL_SYSTEM_ARCHITECTURE.md)** - Player progression and skill mechanics
- **[Skill System Implementation](./docs/skill_system_readme.md)** - Detailed skill system guide
- **[Core Loop Implementation](./docs/core_loop_plan.md)** - Game loop and project management

### 🎵 Game Features
- **[Core Loop Plan](./docs/features/CORE_LOOP_IMPLEMENTATION_PLAN.md)** - Game loop implementation details
- **[Feature Documentation](./docs/features/)** - Detailed feature specifications
- **[Multi-Project System](./docs/MULTI_PROJECT_AUTOMATION_PLAN.md)** - Concurrent project management
- **[Progress Tracking](./docs/progress.md)** - Development milestones and progress

### 🔧 Development Resources
- **[Development Guidelines](./docs/development_guidelines/)** - Coding standards and practices
- **[Implementation Plans](./docs/active_implementation_plans/)** - Current development plans
- **[System Designs](./docs/system_designs_and_specs/)** - Technical specifications

## 🎯 Implementation Status

### ✅ Complete systems
- **Isometric studio floor** — PixiJS room (`StudioRoom`/`WebGLCanvas`) with 6 hotspots + `StudioInspector` popups; room tier 1–5 from progression milestones drives visible upgrades (Home Studio → Bedroom+ → Project Studio → Studio A → Hit Factory); era color grade overlay (`EraGrade`).
- **15 minigames via `MinigameManager`** — incl. EQ Match, Fader Ride, Punch-In; shared `MinigameChrome` + CSS juice kit (`minigame-juice.css`); combo streak + Overdrive (2 energy, +75%, burnout risk); scores feed project quality via `minigamePoints` (0–10).
- **Real project settlement** — `generateProjectReview` scores skills, staff contribution, equipment, studio quality, focus effectiveness, artist match, and market multiplier; results land in financials (`income`/`expenses`/`profit`/`reports`).
- **Deterministic daily challenges** (`src/utils/dailyChallenges.ts`) — one seeded challenge per day, shown in the clock inspector; gig refresh costs $50 with a 3-day cooldown; random events roll on every daily tick; salaries + equipment upkeep deducted on `advanceDay`.

### 🚧 Open P2s
- **MinigameChrome rollout** — 4 of 15 games use the shared chrome/juice kit; 11 legacy games still need migration.
- **Audio unlock** — Web Audio still requires a user gesture before background playback starts.

## 🎨 Design Principles

### Player-Centric Design
- **Progressive Complexity**: Advanced features don't overwhelm new players
- **Clear Feedback**: Visual and audio cues for all player actions
- **Meaningful Choices**: Decisions with long-term strategic impact
- **Accessibility First**: Designed for players of all skill levels

### Technical Excellence
- **Modular Architecture**: Clean separation of concerns and easy feature addition
- **Performance Optimization**: Smooth experience across devices
- **Maintainable Code**: Well-documented and structured codebase
- **Modern Technologies**: Built with React, TypeScript, and Vite

### Authentic Experience
- **Music Industry Accuracy**: Realistic studio operations and workflows
- **Historical Context**: Authentic equipment and industry evolution
- **Educational Value**: Learn real recording and business concepts
- **Cultural Appreciation**: Celebrate music history and creativity

## 💻 Technologies Used

This project is built with modern web technologies:

- **Framework**: React with TypeScript
- **Build Tool**: Vite 5 for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context
- **2D Rendering**: PixiJS 8 (`pixi.js` + `@pixi/react`) for the isometric studio floor
- **Audio**: Web Audio API and HTML5 audio elements
- **Package Manager**: pnpm 12 (`packageManager: pnpm@12.3.4`, `devEngines` enforced)
- **Issue Tracking**: beads (`.beads/`) — see Development Setup
- **Deployment**: Vercel with automatic CI/CD

## 🔗 External Resources

- **[Lovable Project](https://lovable.dev/projects/fb4096d3-b98e-4381-9c20-873902a5af5d)** - Live development environment
- **[Deployment Guide](./docs/VERCEL_DEPLOYMENT.md)** - How to deploy the project
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

---

## 📝 Development Setup

### Prerequisites
- Node.js 18+ and pnpm 12+ (install with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), then `corepack enable` or `npm i -g pnpm`)
- Git for version control

### Local Development
```bash
# Navigate to project directory
cd recording-studio-tycoon

# Install dependencies (pnpm only — packageManager + devEngines enforced)
pnpm install

# Start development server
pnpm run dev
```

### Available Scripts
- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint

### Issue Tracking (beads)
```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

## 🤝 Contributing

We welcome contributions! Please check our documentation for guidelines:

- **[Development Standards](./docs/development_guidelines/DEVELOPMENT_STANDARDS.md)** - Code quality and standards
- **[Current Development Status](./docs/current/CURRENT_STATUS.md)** - What needs to be done
- **[Project Management Workflow](./docs/development_guidelines/PROJECT_MANAGEMENT_WORKFLOW.md)** - Development process
- **[Minigame Design Patterns](./docs/development_guidelines/MINIGAME_DESIGN_PATTERNS.md)** - Game design patterns

## 📋 Current Priorities

1. **MinigameChrome rollout** - Migrate the 11 legacy minigames to the shared chrome/juice kit
2. **Audio unlock** - Resolve user-gesture gating for Web Audio background playback
3. **Multi-project polish** - Harden concurrent project workflows and settlement reports

For task-level tracking, see beads (`bd ready`) and the **[Current Development Status](./docs/current/CURRENT_STATUS.md)**.

---

## Screenshots
<!-- ORCHESTRATOR: screenshot gallery embedded here -->

---

*Recording Studio Tycoon - Building the future of music industry simulation gaming*
