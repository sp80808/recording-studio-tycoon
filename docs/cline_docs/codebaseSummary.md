# Codebase Summary

## Key Components and Their Interactions

### Core Systems
- **Game Loop**: Managed by `useGameState` and `useStageWork`
- **Project Management**: Handled by `useProjectManagement` with template-based generation
- **Staff System**: `useStaffManagement` handles hiring, training, and minigames
- **Progression**: `usePlayerProgression` manages leveling and milestones

### Phase 2 Advanced Systems (New - 16/06/2025)
- **Relationship Management (`src/services/relationshipService.ts`)**:
    - Manages relationship scores (trust, respect) with clients and record labels.
    - Handles relationship changes based on project outcomes (quality, timeliness, original music success).
    - Includes logic for blacklisting entities based on severely negative relationships.
    - Placeholder functions for player-initiated "favors" and a PR event system.
    - Associated types in `src/types/relationships.ts` (e.g., `RelationshipStats`, `PREvent`).
- **Tiered Contract Generation (`src/utils/projectUtils.ts`)**:
    - `generateNewProjects` function updated to accept `GameState`.
    - Initial logic to source contract providers (Clients, RecordLabels) from `GameState` instead of random generation.
    - Modifies contract payouts/reputation based on relationship scores with the chosen provider.
    - `GameState` in `src/types/game.ts` updated to include `clients` and `recordLabels` arrays.
- **Studio Perks & Specializations (`src/services/studioUpgradeService.ts`)**:
    - Manages unlocking and applying effects of studio perks.
    - `applyAllPerkEffects` calculates and stores aggregated modifiers in `GameState.aggregatedPerkModifiers`.
    - Associated types in `src/types/studioPerks.ts` and `src/types/game.ts` (`AggregatedPerkModifiers`).
    - UI conceptualization documented in `docs/cline_docs/perkSystemUI.md`.

### Progression System
Located in `progressionUtils.ts`, `featureUtils.ts`, and `milestones.ts`
- Attribute effects (creativity, technical, charisma, business, luck)
- Milestone rewards and unlocks
- Critical success mechanics
- Feature prerequisites
- Integration with projects, equipment, and staff

### UI Components
- **Main Views**:
  - `Index.tsx`: Core application container
  - `GameHeader.tsx`: Displays key game info
  - `ProjectList.tsx`: Project selection (template-based)
  - `ActiveProject.tsx`: Current project work (being enhanced)
  - `RightPanel.tsx`: Equipment/skills/attributes view
  - `ChartsPanel.tsx`: Billboard-style music industry charts with audio preview and artist contact.
  - `src/components/EquipmentDetailModal.tsx`: Displays detailed equipment specifications and graphs.
  - `src/components/EraTransitionAnimation.tsx`, `src/components/ProjectCompletionCelebration.tsx`: Components for advanced animations.
- **Project Management UI**:
  - `StaffAssignmentSection.tsx`: Component for assigning staff to projects, includes filtering.
  - `StaffCard.tsx`: Displays individual staff member details for assignment.

### Store Interface (Completed 16/06/2025)
- **`src/components/EquipmentList.tsx`**: Manages display and purchase of studio equipment.
  - *Recent Change*: Complete overhaul with advanced filtering, sorting, era-awareness, and rich visual feedback.
  - *Interaction*: Works with `useGameState` for player money, owned equipment, and current year. Utilizes `src/data/equipment.ts` for equipment data.
  - *Key Features*:
    - Tabbed category view
    - Search functionality
    - Sorting by price, name, category, year, quality
    - Era-aware equipment availability and vintage pricing logic
    - Badges for vintage, premium, modern, and pro equipment
    - Color-coded pricing based on affordability
    - Detailed equipment cards with stats, bonuses, and skill requirements

### Minigames
- **Core Minigames**: Beat Making, Mixing Board, Mastering, Vocal Recording, Rhythm Timing.
- **Advanced Minigames**:
  - `EffectChainGame.tsx`: For building audio processing chains.
  - `AcousticTreatmentGame.tsx`: For room optimization.
  - `InstrumentLayeringGame.tsx`: For advanced arrangement challenges.
  - `LyricFocusGame.tsx`: For selecting keywords to refine lyrical themes.

### Custom Hooks
- **Game State**:
  - `useGameState`: Manages global game state and focus allocation
  - `useStageWork`: Handles project work logic (`performDailyWork`)
- **Project Management**:
  - `useProjectManagement`: Creates/completes projects (template-based)
- **Staff System**:
  - `useStaffManagement`: Handles hiring, training, minigames
- **Progression**:
  - `usePlayerProgression`: Manages leveling, perks, milestones
- **Audio**:
  - `useBackgroundMusic.tsx`: Manages background music playback.
  - `useSound.ts`: Handles various sound effects.
  - `useChartAudio.ts`: Manages audio playback for chart song previews.
- **Charts**:
  - `useChartPanelData.ts`: Manages data and state for the Charts Panel.

### Utility Functions
- **Game Logic**:
  - `gameUtils.ts`: Equipment checks and effects
  - `minigameUtils.ts`: Staff training minigames data and trigger system.
  - `audioSystem.ts`: Manages audio playback for charts and other features.
- **Staff Assignment**:
  - `staffAssignmentUtils.ts`: Utilities for staff-project matching, optimal assignments, and outcome prediction.
- **Project Management**:
  - `projectUtils.ts`: Project-related utilities (template-based)
  - `projectTemplates.ts`: Project/stage template definitions
- **Progression**:
  - `progressionUtils.ts`: Milestone rewards and calculations.
  - `eraProgression.ts`: Manages era-based progression.
  - `versionUtils.ts`: Handles game version tracking and save migrations.

### Tutorial System
- **Core Components**:
  - `TutorialProvider`: Manages state and progression
  - `TutorialOverlay`: Renders UI elements
  - `TutorialContext`: Provides state throughout app
  - `tutorialReducer`: Handles state updates
- **Tutorial Content**:
  - Microphone placement
  - Waveform sculpting
  - EQ matching
  - First session

### Progression System
- **Core Files**:
  - `progressionUtils.ts`: Milestone rewards and calculations
  - `ProgressionPanel.tsx`: Attributes/perks UI
  - `rewardBalancer.ts`: Reward balancing
- **Key Types**:
  - PlayerAttributes
  - MilestoneReward
  - Perk

## Data Flow

### Main Game State
1. User interactions → Game state updates via `setGameState`
2. State changes → UI re-renders
3. Project generation uses `projectTemplates.ts`

### Tutorial Flow
- State managed by `TutorialProvider`
- Steps handled by `tutorialReducer`
- UI updates through `TutorialContext`

### Progression Flow
1. Actions → XP generation
2. Level ups → Milestone checks
3. Rewards → Attribute/perk effects

## External Dependencies
### Core
- React: UI library
- TypeScript: Language
- Vite: Build tool
- bun: Runtime/package manager

### UI/Design
- Tailwind CSS: Styling
- Shadcn UI: Component library
- Lucide React: Icons
- Framer Motion: Animations
- Recharts: Charting library

### Services
- Supabase: Authentication/data storage
- Sonner: Toast notifications
- Howler.js: Web Audio API wrapper

## Recent Significant Changes

### Core Gameplay
- Refactored daily work cycle and UI state management
- Enhanced equipment purchase system
- Added staff management (hiring, training, assignment)
- Implemented project stages with work units
- Added data-driven project templates

### Tutorial System
- Implemented comprehensive tutorial system
- Added interactive minigame tutorials
- Created state management and context
- Supports multiple tutorial paths

### Progression
- Added milestone rewards system
- Developing attribute/perk effects
- Planning progression-tied content
- Building progression UI components
- **Phase 2 Advanced Systems (Foundational Work - 16/06/2025)**:
    - Implemented initial backend logic and type definitions for Dynamic Market Trends (previously noted).
    - Enhanced `RelationshipService` for original music project outcomes, player favors (placeholders), and blacklisting logic.
    - Updated `projectUtils.ts` for basic tiered contract generation from actual entities.
    - Reviewed and updated `StudioUpgradeService` for perk effect application; conceptualized Perk UI.
    - Added relevant types to `types/relationships.ts` and `types/game.ts` for these systems.


### New Features from Prototype v0.3.0
- **Charts Panel System**: Implemented Billboard-style music industry charts with audio preview, artist contact system, and market trends analysis.
- **Equipment Detail System**: Added comprehensive technical specifications for equipment, including frequency response graphs and harmonic distortion visualization.
- **Advanced Animation System**: Introduced enhanced visual feedback with era transition cinematics, particle effects, and project completion celebrations.
- **Advanced Minigames Suite**: Integrated Effect Chain Building Game, Acoustic Treatment Game, and Instrument Layering Game.
- **Enhanced Save System**: Implemented version tracking for save games.
- **Modular Architecture**: Further modularized the codebase to support progressive complexity.
- **Comprehensive Documentation System**: Established a more robust documentation system.

## User Feedback Integration
### Addressed Issues
- Fixed incorrect day advancement in work cycle
- Resolved equipment effects not applying
- Improved clarity on project stage progress

### Staff Assignment UX Improvements (Completed 16/06/2025)
- **Enhanced StaffAssignmentSection Component**: Complete redesign with advanced filtering, sorting, and visual feedback
- **Intelligent Staff Matching**: Implemented calculateStaffProjectMatch algorithm with genre affinity, skill alignment, and level considerations
- **Rich UI Features**: Added tooltips, hover states, performance prediction, and color-coded match indicators
- **Seamless Integration**: Successfully integrated into ActiveProject.tsx with proper TypeScript compatibility
- **Visual Enhancements**: Created custom CSS animations and styling for professional user experience

### Current Focus
- Verifying and refining newly integrated features from prototype v0.3.0
- Resolving Band system type conflicts (conflicting Band type definitions detected)
- Adding more project variety
- Improving progression system visibility

## Key Documentation
- [Project Roadmap](cline_docs/projectRoadmap.md): Goals and progress
- [Current Task](cline_docs/currentTask.md): Active development focus
- [Tech Stack](cline_docs/techStack.md): Technologies overview
- [Perk System UI Conceptualization](cline_docs/perkSystemUI.md): Design for the perk system UI (new - 16/06/2025)
- [Codebase Analysis 2025](cline_docs/CODEBASE_ANALYSIS_2025.md): Comprehensive system analysis (new)
- [Version History](cline_docs/VERSION_HISTORY.md): Tracks all significant changes (new)
- [Project Templates](src/data/projectTemplates.ts): Template definitions
