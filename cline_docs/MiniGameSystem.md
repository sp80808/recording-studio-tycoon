# Recording Studio Tycoon - Mini-Game System Documentation

## Overview
The mini-game system provides interactive challenges that teach players about audio engineering concepts while rewarding them with XP, attributes, and reputation. The system is designed to be educational, engaging, and well-paced throughout the game's progression.

## Implementation Status

### Phase 1: Core Framework ✅
- [x] Base mini-game component system
- [x] Waveform visualization engine
- [x] Reward and progression tracking
- [x] UI/UX framework

### Phase 2: Early Game Mini-Games 🚧
- [x] Waveform Matching
- [x] Microphone Placement
- [ ] Tutorial integration
- [x] Reward balancing

### Phase 3: Mid Game Mini-Games 📝
- [x] Waveform Sculpting
- [ ] Level Balancing
- [ ] Advanced features
- [ ] Project system integration

### Phase 4: Late Game Mini-Games 📝
- [ ] Dynamic Range Control
- [ ] Sound Synthesis
- [ ] Special effects
- [ ] End-game content

## Core Components

### 1. Mini-Game Framework
```typescript
interface MiniGame {
  id: string;
  name: string;
  description: string;
  type: 'sound' | 'recording' | 'mixing' | 'mastering';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  unlockLevel: number;
  rewards: MiniGameReward;
  maxAttempts: number;
  cooldown: number; // in minutes
}

interface MiniGameReward {
  xp: number;
  attributes: Partial<PlayerAttributes>;
  unlocks?: string[];
  reputation?: number;
}

interface MiniGameProgress {
  level: number;
  highScore: number;
  completionCount: number;
  unlockedFeatures: string[];
  lastAttempt: number;
}
```

### 2. Waveform Visualization Engine
```typescript
interface WaveformProps {
  type: 'sine' | 'square' | 'triangle' | 'custom';
  frequency: number;
  amplitude: number;
  phase: number;
  onMatch?: (accuracy: number) => void;
}

interface WaveformState {
  currentShape: WaveformProps;
  targetShape: WaveformProps;
  matchAccuracy: number;
}
```

### 3. Progression Integration
```typescript
interface MiniGameProgression {
  unlockedGames: string[];
  completedGames: string[];
  currentLevel: number;
  totalScore: number;
  achievements: string[];
}
```

## Implemented Features

### 1. Waveform Matching Mini-Game
- Real-time waveform visualization
- Interactive controls for frequency, amplitude, and phase
- Accuracy-based scoring system
- Time-based challenges
- Progressive difficulty

### 2. Microphone Placement Mini-Game
- Interactive microphone positioning
- Multiple instrument scenarios
- Real-time accuracy feedback
- Optimal placement detection
- Multiple microphone types

### 3. EQ Matching (Mid Game)
- **Status**: Implemented
- **Description**: Players match target EQ settings by adjusting frequency bands
- **Features**:
  - Real-time frequency response visualization
  - Multiple EQ band types (peak, notch, shelf)
  - Parameter controls for frequency, gain, and Q
  - Target vs. current response comparison
  - Real-time audio processing with Web Audio API
  - Dynamic filter chain management
  - Loop playback with instant parameter updates

### 4. Reward Balancing System
- Difficulty-based multipliers
- Score-based rewards
- Level progression scaling
- Consecutive win bonuses
- Dynamic cooldown system

### 5. Mini-Game Registry
- Centralized game data management
- Level-based unlocking system
- Reward balancing
- Cooldown management

### 6. Waveform Sculpting Mini-Game
- Multi-layer waveform visualization
- Real-time sound synthesis
- Target sound matching
- Layer-based parameter control
- Dynamic accuracy calculation

## Technical Implementation

### 1. Core Components
- React components for mini-game UI
- Canvas-based waveform rendering
- State management for game progress
- Sound engine integration

### 2. Game Mechanics
- Input handling
- Score calculation
- Progress tracking
- Reward distribution

### 3. Integration Points
- Project system
- Training system
- Achievement system
- Tutorial system

### 4. Waveform Sculpting
- Components:
  - `ComplexWaveformVisualizer`: Renders multiple waveform layers with real-time updates
  - `WaveformSculpting`: Main game component managing state and user interactions
- Features:
  - Canvas-based waveform rendering
  - Layer management system
  - Real-time parameter adjustment
  - Accuracy calculation based on multiple parameters
  - Target sound presets with varying complexity

### 5. Reward Balancing
- Components:
  - `RewardBalancer`: Calculates rewards based on performance and difficulty
  - `DifficultyManager`: Handles game progression and difficulty scaling
- Features:
  - Multiplier system for different aspects (XP, attributes, reputation)
  - Score-based reward scaling
  - Cooldown management
  - Progressive difficulty adjustment

### 6. EQ Matching
- Components:
  - `EQVisualizer`: Frequency response visualization
  - `EQMatching`: Band management system
- Features:
  - Real-time frequency response visualization
  - Multiple band type support
  - Logarithmic frequency scale
  - Gain and Q visualization
  - Target matching logic
  - Audio playback integration

## Reward System Details

### 1. Base Rewards
- XP gains based on difficulty
- Attribute improvements
- Reputation increases
- Unlockable content

### 2. Multipliers
- Difficulty multipliers (1x - 2x)
- Score multipliers (0.8x - 1.5x)
- Level multipliers (5% per level)
- Streak multipliers (10% per win)

### 3. Cooldown System
- Base cooldown per game
- Level-based reduction
- Recent games penalty
- Minimum cooldown enforcement

## Pacing and Balance

### Early Game (Levels 1-10)
- Waveform Matching
  - Simple sine waves
  - Basic amplitude control
  - 2-3 minute sessions
  - 100-200 XP per session

- Microphone Placement
  - Single instrument scenarios
  - Basic positioning rules
  - 3-4 minute sessions
  - 150-250 XP per session

### Mid Game (Levels 11-20)
- EQ Matching
  - Multiple band types
  - Complex frequency responses
  - 4-5 minute sessions
  - 200-300 XP per session

### Late Game (Levels 26-50)
- Advanced mechanics
- Significant rewards
- Strategic timing
- Special features

## Success Metrics

### Engagement
- Completion rates
- Return frequency
- Time spent
- Feature usage

### Learning
- Concept understanding
- Skill improvement
- Tutorial completion
- Challenge success

### Balance
- Reward distribution
- Difficulty curve
- Progression speed
- Feature unlocks

## Next Steps

### Immediate Tasks
1. Implement tutorial integration for all mini-games
   - Step-by-step guides
   - Interactive tooltips
   - Visual cues and hints
   - Progressive difficulty introduction

2. Add sound effects and visual feedback
   - Success/failure sounds
   - Parameter adjustment feedback
   - Progress indicators
   - Achievement notifications

3. Polish UI/UX for all components
   - Consistent styling
   - Responsive layouts
   - Accessibility improvements
   - Mobile optimization

4. Enhance EQ Matching features
   - Preset management
   - Save/load configurations
   - A/B comparison mode
   - Spectrum analyzer integration

### Short-term Goals
1. Develop Compression mini-game
2. Create Reverb Space mini-game
3. Implement dynamic difficulty adjustment
4. Add achievement system

### Long-term Vision
1. Advanced mixing challenges
2. Multi-player competitive modes
3. Custom challenge creation
4. Integration with recording sessions

## Future Enhancements

### 1. Content
- New mini-games
- Special events
- Seasonal challenges
- Community features

### 2. Technical
- Performance optimization
- Mobile support
- Cross-platform features
- Cloud integration

### 3. Social
- Leaderboards
- Challenges
- Sharing
- Collaboration

# Minigame Overlay & Animated Stat Rewards Integration (2024-06)

## Overview

- Minigames are now triggered automatically as overlays/modals on the last stage of a project, rather than being listed in the project window.
- The '🎯 Suggested Production Activity' is presented as a visually distinct, animated overlay/modal, appearing only when required.
- On minigame completion, stat rewards are animated with floating blobs that increment the stat number on arrival, providing immediate feedback and a sense of reward.
- The 'Complete Stage' button remains accessible at all times, as minigames no longer block the main project UI.
- Redundant manual minigame launch options and lists have been removed from the project window.

## Rationale

This approach streamlines the gameplay loop, reduces UI clutter, and ensures that minigames are a focused, rewarding part of project completion. Animated stat rewards and overlays enhance player engagement and provide clear, satisfying feedback.

## Implementation Steps

1. Refactor project stage logic to detect the last stage and trigger the relevant minigame overlay/modal automatically.
2. Create a reusable modal/overlay component for minigames, ensuring it blocks the main project UI only when active.
3. Integrate animated stat rewards: on minigame completion, trigger floating blob animations and increment stat numbers.
4. Ensure the 'Complete Stage' button is always visible and accessible.
5. Remove any redundant minigame lists or manual launch buttons from the project window.
6. Playtest and iterate for clarity, fun, and reward. 