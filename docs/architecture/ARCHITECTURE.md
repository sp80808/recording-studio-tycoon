# Recording Studio Tycoon - Architecture Documentation

## Overview
Recording Studio Tycoon is a React-based game that simulates running a recording studio. The game features project management, staff management, equipment upgrades, and various minigames that affect project quality and progress.

## Core Components

### Game State Management
- `useGameState` hook manages the main game state
- Save/Load system using localStorage
- Auto-save functionality every 5 minutes

### Project System
- Dynamic project generation based on player level and era
- Multiple project stages with different requirements
- Quality and progress tracking
- Reward system based on project completion

### Staff System
- Staff members with different roles and skills
- Experience and leveling system
- Salary management
- Work capacity and efficiency

### Equipment System
- Era-appropriate equipment
- Equipment effects on project quality
- Upgrade paths and requirements

### Minigame System
- Multiple minigame types for different aspects of music production
- Difficulty scaling based on project requirements
- Reward system affecting project quality and progress

## File Structure

```
src/
├── components/         # React components
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
├── data/              # Game data and templates
└── styles/            # CSS and styling
```

## Key Features

### Project Management
- Dynamic project generation
- Multiple stages per project
- Quality and progress tracking
- Reward system

### Staff Management
- Hiring and firing staff
- Skill development
- Work assignment
- Salary management

### Equipment System
- Era-appropriate equipment
- Upgrade paths
- Equipment effects

### Minigame System
- Multiple minigame types
- Difficulty scaling
- Reward system

## Technical Details

### State Management
- React hooks for state management
- Local storage for persistence
- Auto-save system

### Type System
- Comprehensive TypeScript types
- Type-safe game state
- Proper error handling

### Performance
- Optimized rendering
- Efficient state updates
- Proper cleanup

## Future Improvements
- Additional minigame types
- More project templates
- Enhanced staff AI
- Advanced equipment effects
- Multiplayer features 