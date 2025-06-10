# Codebase Summary

## Key Components and Their Interactions

### Core Systems
- **Game Loop**: Managed by `useGameState` and `useStageWork`
- **Project Management**: Handled by `useProjectManagement` with template-based generation
- **Staff System**: `useStaffManagement` handles hiring, training, and minigames
- **Progression**: `usePlayerProgression` manages leveling and milestones

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
### Utility Functions
- **Game Logic**:
  - `gameUtils.ts`: Equipment checks and effects
  - `minigames.ts`: Staff training minigames data
- **Project Management**:
  - `projectUtils.ts`: Project-related utilities (template-based)
  - `projectTemplates.ts`: Project/stage template definitions

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

### Progression System (In Development)
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

### Services
- Supabase: Authentication/data storage
- Sonner: Toast notifications

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

## User Feedback Integration
### Addressed Issues
- Fixed incorrect day advancement in work cycle
- Resolved equipment effects not applying
- Improved clarity on project stage progress

### Current Focus
- Enhancing staff assignment UX (direct project window integration)
- Adding more project variety
- Improving progression system visibility

## Key Documentation
- [Project Roadmap](cline_docs/projectRoadmap.md): Goals and progress
- [Current Task](cline_docs/currentTask.md): Active development focus
- [Tech Stack](cline_docs/techStack.md): Technologies overview
- [Project Templates](cline_docs/projectTemplates.ts): Template definitions
