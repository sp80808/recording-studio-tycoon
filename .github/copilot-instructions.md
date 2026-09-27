# Copilot Instructions - Recording Studio Tycoon

## Project Overview
Recording Studio Tycoon is a music industry simulation game built with React 18, TypeScript, and Vite. The project is a comprehensive web application (~19,000 lines of TypeScript/TSX code across 216 files) that simulates running a recording studio with era-based progression from the 1960s to present day.

**Key Technologies:**
- **Framework:** React 18.3.1 with TypeScript 5.5.3
- **Build Tool:** Vite 5.4.1 (fast HMR and production builds)
- **Styling:** Tailwind CSS 3.4.11 with shadcn/ui components
- **State Management:** React hooks, Context API, and Zustand 5.0.8
- **Audio:** Web Audio API and HTML5 audio elements
- **Deployment:** Vercel with automatic CI/CD
- **Runtime:** Node.js 20.19.5+, npm 10.8.2+

## Build & Validation Commands

### Installation & Setup
**ALWAYS run npm install first** when starting work or after pulling changes:
```bash
npm install  # Takes ~22 seconds, required before any other command
```

### Development Server
```bash
npm run dev
# - Starts Vite dev server on port 8080 (configured in vite.config.ts)
# - Hot Module Reload (HMR) enabled
# - Access at http://localhost:8080
# - Known issue: SaveSystemContext may occasionally return 500 error during HMR, restart server if this occurs
```

### Linting
```bash
npm run lint
# - Runs ESLint with TypeScript support
# - Current state: ~108 errors, ~37 warnings (mostly @typescript-eslint/no-explicit-any and react-hooks issues)
# - These pre-existing errors should NOT be introduced in new code
# - Linter uses eslint.config.js with TypeScript-ESLint
# - @typescript-eslint/no-unused-vars is disabled in config
# - Does NOT fail the build - warnings and errors are informational
```

### Building for Production
```bash
npm run build
# - Takes 6-7 seconds to complete
# - Outputs to dist/ directory (ignored in .gitignore)
# - Creates ~966KB main bundle (index-*.js) - this is expected
# - Warning about large bundle size is expected and can be ignored
# - Also shows Browserslist warning (safe to ignore)
# - Build MUST succeed before committing changes
# - Always run after making code changes to verify no build errors
```

### Preview Production Build
```bash
npm run preview
# - Serves the production build from dist/
# - Use to test production behavior locally
# - Requires npm run build to be run first
```

### Alternative: Bun Support
The project supports Bun as an alternative to npm:
```bash
bun install  # Instead of npm install
bun dev      # Instead of npm run dev
bun run build # Instead of npm run build
```

## Critical Build Requirements

### Before Making Changes
1. **ALWAYS** run `npm install` if you haven't already
2. Run `npm run lint` to see baseline errors (don't fix unless related to your change)
3. Run `npm run build` to verify clean build state

### After Making Changes
1. Run `npm run lint` - new errors related to your changes MUST be fixed
2. Run `npm run build` - MUST succeed without errors
3. Test in dev server with `npm run dev`
4. Build time should remain ~6-7 seconds (if significantly longer, investigate)

### Common Build Issues & Solutions

**Module Not Found Errors:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**TypeScript Errors:**
- Check import paths use `@/` alias (configured in tsconfig.json and vite.config.ts)
- Ensure all React imports are present where JSX is used
- TypeScript is configured with relaxed settings (noImplicitAny: false, strictNullChecks: false)

**HMR Issues (SaveSystemContext 500 Error):**
- Known issue during development
- Solution: Hard refresh (Ctrl+Shift+R) or restart dev server
- Does not affect production builds

**Large Bundle Warning:**
- Expected behavior (966KB bundle)
- Can be ignored unless bundle grows significantly (>1.5MB)

## Project Architecture & Layout

### Directory Structure
```
recording-studio-tycoon/
├── src/                          # All source code (266MB including audio assets)
│   ├── components/              # React components (organized by feature)
│   │   ├── ui/                  # shadcn/ui components (button, dialog, etc.)
│   │   ├── modals/             # Modal dialogs
│   │   ├── minigames/          # Interactive game components
│   │   ├── equipment/          # Equipment-related components
│   │   ├── charts/             # Chart and analytics components
│   │   ├── ProductionQueue/    # Production queue system
│   │   └── layout/             # Layout components
│   ├── hooks/                   # Custom React hooks (16 files)
│   │   ├── useGameState.tsx    # Core game state management
│   │   ├── useGameLogic.tsx    # Game logic and mechanics
│   │   ├── useGameActions.tsx  # Game actions (buying, hiring, etc.)
│   │   └── useMultiProjectManagement.tsx  # Multi-project system
│   ├── contexts/               # React Context providers
│   │   ├── SettingsContext.tsx
│   │   └── SaveSystemContext.tsx
│   ├── pages/                  # Page components (Index.tsx, NotFound.tsx)
│   ├── types/                  # TypeScript type definitions (6 files)
│   ├── utils/                  # Utility functions
│   ├── data/                   # Game data and configurations
│   ├── features/               # Feature-specific modules
│   ├── stores/                 # Zustand stores
│   ├── services/               # Service layer
│   ├── audio/                  # Audio system code
│   ├── game-mechanics/         # Game mechanics implementations
│   ├── integrations/           # External integrations (Supabase)
│   ├── lib/                    # Shared libraries
│   ├── main.tsx               # Application entry point
│   ├── App.tsx                # Root component with providers
│   ├── index.css              # Global styles (12KB)
│   └── i18n.ts                # Internationalization setup
├── public/                     # Static assets
│   ├── audio/                 # Audio files (6 subdirectories)
│   ├── locales/               # Translation files
│   └── favicon.ico
├── docs/                       # Comprehensive documentation (95 .md files)
│   ├── QUICK_START.md         # Developer onboarding
│   ├── TROUBLESHOOTING.md     # Known issues and solutions
│   ├── architecture/          # System architecture docs
│   ├── features/              # Feature documentation
│   └── development_guidelines/ # Coding standards
├── package.json               # Project dependencies and scripts
├── vite.config.ts             # Vite configuration (port 8080, @/ alias)
├── tsconfig.json              # TypeScript configuration (relaxed mode)
├── eslint.config.js           # ESLint configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── components.json            # shadcn/ui configuration
└── index.html                 # HTML entry point
```

### Key Entry Points
1. **index.html** → Loads main.tsx
2. **src/main.tsx** → Initializes React, audio system, settings, i18n
3. **src/App.tsx** → Root component with providers (Query, Settings, SaveSystem, Router)
4. **src/pages/Index.tsx** → Main game page

### State Management Pattern
- **Game State:** `useGameState` hook (src/hooks/useGameState.tsx)
- **Game Logic:** `useGameLogic` hook (src/hooks/useGameLogic.tsx)
- **Settings:** `SettingsContext` (src/contexts/SettingsContext.tsx)
- **Save System:** `SaveSystemContext` (src/contexts/SaveSystemContext.tsx)
- **Production Queue:** Zustand store (src/hooks/useProductionQueue.ts)

### Import Alias Configuration
Use `@/` for all imports from src/:
```typescript
import { Button } from '@/components/ui/button';
import { useGameState } from '@/hooks/useGameState';
import type { GameState } from '@/types/game';
```

Configured in:
- `tsconfig.json`: `"@/*": ["./src/*"]`
- `vite.config.ts`: `alias: { "@": path.resolve(__dirname, "./src") }`
- `components.json`: Path aliases for shadcn/ui

## Audio System Requirements

### Critical Audio Context Issue
**The browser requires a user gesture before audio can play.** This is a Web Audio API security requirement.

**Symptoms:**
- Background music doesn't start
- Console error: "NotAllowedError: play() failed because the user didn't interact with the document first"

**Solution Already Implemented:**
- `initInteractionListener()` called in main.tsx
- User must click anywhere in the app to enable audio
- NOT a bug - this is expected browser behavior

**When Modifying Audio Code:**
- Never remove the interaction listener initialization
- Always test audio in a fresh browser session
- Check console for AudioContext state (suspended/running)

## Testing Requirements

### Current Test Infrastructure
- **Unit Tests:** One test file exists (`src/features/boxDrops/lootGenerator.test.ts`)
- **No test runner configured in package.json**
- Testing is primarily manual through development server

### Manual Testing Checklist
After making changes, test:
1. Start new game - verify era selection modal appears
2. Complete tutorial flow
3. Test save/load functionality
4. Verify audio plays after user interaction
5. Check responsive layout (desktop and mobile)
6. Test in Chrome, Firefox, and Safari if possible

### Validation Before Committing
```bash
npm run lint   # Check for new errors
npm run build  # Must succeed
npm run dev    # Manual testing in browser
```

## Known Issues & Workarounds

### SaveSystemContext 500 Error (Development Only)
- **When:** During Hot Module Reload in development
- **Impact:** Dev server returns 500, HMR fails
- **Workaround:** Hard refresh (Ctrl+Shift+R) or restart `npm run dev`
- **Not a bug in production builds**

### Browserslist Data Warning
- **Message:** "browsers data (caniuse-lite) is 12 months old"
- **Can be ignored** or fix with: `npx update-browserslist-db@latest`
- Does not affect build or runtime

### Pre-existing Lint Errors
- **~108 errors, ~37 warnings** exist in codebase
- **Do not fix unrelated errors** - focus only on your changes
- Common issues: `@typescript-eslint/no-explicit-any`, `react-hooks/exhaustive-deps`
- These are informational and don't block builds

### Large Bundle Warning
- **Expected:** Main bundle is ~966KB
- **Can be ignored** unless significantly increases
- Recommendation in warning (code splitting) is noted but not required

## Configuration Files

### vite.config.ts
- Dev server runs on port **8080** (not default 5173)
- Uses SWC for fast React compilation
- Path alias `@` → `./src`
- Lovable component tagger in development mode

### eslint.config.js
- TypeScript-ESLint configured
- Ignores dist/ directory
- React hooks and refresh plugins enabled
- `@typescript-eslint/no-unused-vars` disabled

### tsconfig.json
- References tsconfig.app.json and tsconfig.node.json
- Path alias `@/*` → `./src/*`
- Relaxed TypeScript settings:
  - `noImplicitAny: false`
  - `strictNullChecks: false`
  - `noUnusedLocals: false`
  - `noUnusedParameters: false`

### tailwind.config.ts
- Uses class-based dark mode
- Custom color schemes: sunrise-studio, neon-nights, retro-arcade
- shadcn/ui component styling with CSS variables
- Custom animations: accordion-down, accordion-up, fade-in

## Component Libraries & UI

### shadcn/ui Components
- Located in `src/components/ui/`
- Configuration in `components.json`
- Uses Radix UI primitives
- Styled with Tailwind CSS and CSS variables

### Adding New shadcn/ui Components
**Do not use npx shadcn@latest add** - components already exist
- Check `src/components/ui/` first
- If missing, can manually add following shadcn/ui patterns

## Development Workflow Best Practices

### Making Code Changes
1. **Understand existing patterns** - check similar components first
2. **Use TypeScript types** - defined in src/types/
3. **Follow React hooks rules** - no conditional hooks
4. **Use established utilities** - check src/utils/ and src/lib/
5. **Match existing code style** - no additional comments unless necessary

### When Adding New Features
1. Check if similar feature exists in src/components/ or src/features/
2. Use existing hooks (useGameState, useGameLogic) rather than creating new state
3. Follow the component organization pattern (group by feature)
4. Update types in src/types/ if adding new data structures

### When Fixing Bugs
1. Check docs/TROUBLESHOOTING.md for known issues first
2. Search for related code with: `grep -r "pattern" src/`
3. Test fix doesn't break existing functionality
4. Update TROUBLESHOOTING.md if documenting new workaround

## File Organization Patterns

### Component Files
- One component per file
- File name matches component name (PascalCase)
- Related components grouped in subdirectories
- Example: `src/components/minigames/MixingGame.tsx`

### Hook Files
- Prefix with "use" (useGameState.tsx)
- Located in src/hooks/
- Export hook function and related types

### Type Files
- Located in src/types/
- Named by domain (game.ts, bands.ts, charts.ts)
- Export interfaces and types

## Dependencies

### Do Not Update These Without Testing
- **React 18.3.1** - core framework
- **Vite 5.4.1** - critical for build process
- **TypeScript 5.5.3** - language version affects entire codebase

### Safe to Update (with testing)
- **Tailwind CSS** - styling only
- **shadcn/ui components** - individual component updates
- **ESLint plugins** - linting only

### Third-Party Integrations
- **Vercel Speed Insights** - already integrated in App.tsx
- **Supabase** - configured in src/integrations/supabase/
- **i18next** - internationalization configured in src/i18n.ts

## Performance Considerations

### Build Performance
- Clean builds take 6-7 seconds (expected)
- HMR updates are near-instant
- If build time exceeds 15 seconds, check for infinite loops or large new dependencies

### Runtime Performance
- Main bundle is ~966KB (expected)
- Lazy loading not currently implemented
- Audio files are loaded on-demand from public/audio/

### Memory Considerations
- src/ directory is 266MB (mostly audio assets in src/audio/)
- Browser should handle game in ~200-300MB of RAM
- Watch for memory leaks in long game sessions

## Documentation

### For Complex Changes, Consult
1. **docs/QUICK_START.md** - Project overview and setup
2. **docs/TROUBLESHOOTING.md** - Known issues database
3. **docs/architecture/** - System architecture details
4. **docs/features/** - Feature specifications
5. **docs/development_guidelines/** - Coding standards

### 95 Documentation Files Available
- Extensive documentation exists - search docs/ before asking
- Use `grep -r "keyword" docs/` to find relevant docs
- Recent updates as of June 2025

## Trust These Instructions

**These instructions are comprehensive and validated.** Only perform additional searches if:
- Information here is incomplete for your specific task
- You encounter behavior that contradicts these instructions
- You need feature-specific details not covered in this overview

**Common searches that are NOT needed:**
- "How to build" - covered above
- "How to start dev server" - covered above  
- "What port does Vite use" - port 8080, covered above
- "How to run linter" - covered above
- "TypeScript configuration" - covered above

Focus on implementing your task using these instructions as your primary reference.
