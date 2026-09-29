# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on Recording Studio Tycoon.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

---

## 🛠️ Build & Test Commands

Strictly use **pnpm 12+** (`devEngines` enforced; do NOT use `npm` or `npx` directly):

```bash
# Install dependencies
pnpm install

# Start local dev server (default port 8080 or 5173)
pnpm run dev

# Run automated check suites (10 regression suites)
pnpm test
# Equivalent to:
bash scripts/run-checks.sh

# Run TypeScript compilation & production build
pnpm run build

# Run Playwright end-to-end booking & settlement test
NODE_PATH=/Users/user/.local/lib/node_modules node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const fn=eval(fs.readFileSync('tests/booking-settlement.check.cjs','utf8'));const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:1440,height:900}});try{console.log(await fn(p))}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)})"
```

---

## 🏗️ Architecture Overview

Recording Studio Tycoon is an isometric simulation and management RPG:
1. **Game Shell (`src/pages/Index.tsx`)**: Mounts game state (`useGameState`), simulation loop, cutscene director, and audio unlocked state.
2. **Living Isometric Studio (`src/components/StudioRoom.tsx` / `WebGLCanvas.tsx`)**:
   - PixiJS 8 canvas rendering an isometric grid (`TILE_W=56, TILE_H=28`).
   - 5-tier console hardware progression (Tier 1 tube desk with Auratone cube & reel-to-reel tape to Tier 5 gold flagship console).
   - 6 interactive hotspots (`console`, `liveRoom`, `phone`, `clock`, `tv`, `shelf`).
3. **Industrial Console Transport Dock (`ActiveProject.tsx` / `PocketMeter.tsx`)**:
   - 60fps Lock Take button with haptic animations.
   - Analog PocketMeter timing gauge tracking take rhythm accuracy (Gold, Silver, Solid).
   - Variable energy take spending (1⚡ efficient, 2⚡ standard, 3⚡ Overdrive).
4. **Contextual Slide-Over Drawer (`MainGameContent.tsx`)**:
   - Gigs, Artist Enquiries, Gear, Crew, and Career navigation in an on-demand slide panel.
5. **Tactile Audio & Music Engine (`src/utils/audioSystem.ts`)**:
   - Tone.js polyphonic synthesis generating authentic musical chords per genre upon take completion.
   - Kenney mechanical switch clicks and rotary knob audio for all physical buttons.
   - Robust gesture-based audio context unlocking.
6. **RPG Progression Engine (`src/rpg/`)**:
   - Take evaluation, combo codex streaks, contract stakes (Safe vs. Moonshot), letter stage grades (S/A/B/C), and unified XP.
7. **Gamepad Controller Support (`src/services/gamepadService.ts` / `GamepadNavContext.tsx`)**:
   - 60fps hardware polling, dynamic SVG glyph rendering, spatial focus navigation, and radial action wheel.

---

## 📋 Conventions & Coding Standards

1. **State Immutability**: All mutations to `GameState` must be pure and immutable; avoid direct state mutations.
2. **Deterministic Seeded RNG**: Use `createSeededRandom` (`src/simulation/seededRandom.ts`) with project seeds for reviews, interventions, and daily challenges.
3. **No Flashing Placeholders**: Use Kenney assets, authentic SVG graphics, or Pixi shapes.
4. **Package Management**: Strictly `pnpm` (`packageManager: pnpm@12.3.4`).
5. **Issue Tracking**: Strictly use `bd` commands for task claiming, updating, and closing.
