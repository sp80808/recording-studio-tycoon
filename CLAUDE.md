# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

### Core Technologies
- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **Tailwind CSS** with shadcn/ui components
- **React Router** for navigation
- **TanStack Query** for data fetching
- **Zustand-like state management** through custom hooks

### Application Structure

**Main Game Loop**: The app is a music industry tycoon simulation game centered around a recording studio business spanning multiple historical eras (1960s-present).

**State Management Architecture**:
- `useGameState()` - Core game state (money, reputation, day progression, equipment, staff)
- Context providers for settings and save system management
- Custom hooks for specific game systems (bands, projects, staff, progression)

**Key Game Systems**:
1. **Project Management**: Recording projects with multi-stage completion workflows
2. **Staff System**: Hire engineers, producers, songwriters with skills and training
3. **Equipment System**: Era-appropriate gear with bonuses and historical accuracy
4. **Minigame Suite**: 9 different skill-based minigames for project work
5. **Era Progression**: Historical timeline from 1960s analog to modern digital
6. **Charts System**: Industry charts with artist networking and communication
7. **Band Management**: Create bands and manage original track projects

### Code Organization

**Component Structure**:
- `/components/` - Main UI components organized by function
- `/components/minigames/` - Interactive skill-based games (9 different types)
- `/components/modals/` - Dialog-based interfaces for complex interactions
- `/components/charts/` - Music industry charts and market analysis
- `/hooks/` - Game logic and state management
- `/utils/` - Pure functions for calculations and game mechanics
- `/types/` - TypeScript definitions for game entities
- `/data/` - Static game data (equipment, training courses, charts)

**State Flow Pattern**:
All game state flows through `useGameState()` which provides the main `GameState` object. Individual systems use specialized hooks that accept and update this state:
- `useGameLogic()` - Core game mechanics and day progression
- `useProjectManagement()` - Project lifecycle and completion
- `useStaffManagement()` - Staff hiring, training, and assignment
- `useBandManagement()` - Band creation and original music projects

### Audio System

The game includes comprehensive audio features:
- Background music system with era-appropriate tracks (`/src/audio/music/`)
- Chart preview system with track snippets (`/src/audio/chart_clips/`)
- UI sound effects for interactions (`/src/audio/ui sfx/`)
- Audio utilities in `audioSystem.ts` for playback management

### Data Architecture

**Game Entities**:
- `Project` - Recording projects with stages, requirements, and rewards
- `StaffMember` - Employees with skills, training, and energy systems
- `Equipment` - Gear with historical accuracy and genre-specific bonuses
- `Band` - Player-created or AI bands for original music projects
- `Chart` - Industry music charts with artist contact systems

**Era System**: Historical progression from 1960s to present with:
- Era-specific equipment availability and pricing
- Historical events and cultural context
- Technology progression affecting gameplay mechanics

### Development Standards

**Component Patterns**:
- Use functional components with hooks
- Implement proper TypeScript typing for all props and state
- Follow the existing modal pattern for complex interactions
- Use the established audio preview pattern for music features

**State Updates**:
- Always use the `setGameState()` pattern for state modifications
- Implement proper loading states for async operations
- Use toast notifications for user feedback
- Maintain save compatibility when adding new features

**Testing Integration**:
- The game includes comprehensive minigames that should be tested interactively
- Focus allocation system affects minigame triggering (performance/soundCapture/layering)
- Equipment bonuses should affect project outcomes
- Staff training and energy systems need verification

### Current Development Focus

The project is in Phase 2B focusing on:
- Charts system integration and artist networking
- Advanced minigame implementation (9 different games)
- Era-based progression mechanics
- Communication layer foundation (EPK system planning)

When making changes, always consider historical accuracy, game balance, and the educational aspects of music industry simulation.