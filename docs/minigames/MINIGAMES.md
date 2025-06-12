# Minigame System Documentation

## Overview
The minigame system provides interactive challenges that help players learn and practice various aspects of music production while earning rewards and improving their skills.

## Core Components

### Minigame Types
```typescript
type MinigameType = 
  | 'mixing'
  | 'recording'
  | 'mastering'
  | 'pedalboard'
  | 'patchbay';
```

### Minigame Manager
The `MinigameManager` component handles the state and rendering of different minigames based on the type and difficulty provided.

```typescript
interface MinigameManagerProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  type: MinigameType;
  difficulty?: number;
}
```

### Base Minigame Interface
All minigames implement this base interface:

```typescript
interface BaseMinigameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: number;
}
```

## Minigames

### Mastering Minigame
The mastering minigame challenges players to match target mastering settings for different genres and styles.

#### Features
- Multiple presets for different genres and styles
- Dynamic difficulty scaling
- Real-time parameter adjustments
- Visual feedback and scoring system
- Tutorial system with mastering tips
- Audio preview functionality

#### Difficulty Levels
1. **Beginner (1)**
   - Basic volume and EQ adjustments
   - Simple presets
   - Longer time limit
   - Basic scoring system

2. **Intermediate (2)**
   - Added compression and stereo width
   - More complex presets
   - Standard time limit
   - Enhanced scoring system

3. **Advanced (3)**
   - Full parameter control
   - Complex presets
   - Shorter time limit
   - Advanced scoring with bonus points

4. **Expert (4)**
   - All parameters unlocked
   - Custom presets
   - Strict time limit
   - Expert scoring system

#### Integration
- Connects with project mastering stage
- Affects project quality and player skills
- Rewards based on accuracy and speed

### Guitar Pedal Board Minigame
The guitar pedal board minigame challenges players to create signal chains using different guitar effects pedals.

#### Features
- Drag and drop pedal arrangement
- Multiple pedal types (distortion, delay, reverb, etc.)
- Dynamic difficulty scaling
- Real-time audio preview
- Visual feedback and scoring system
- Tutorial system with pedal chain tips

#### Difficulty Levels
1. **Beginner (1)**
   - Basic pedals (distortion, delay)
   - Simple chain requirements
   - Longer time limit
   - Basic scoring system

2. **Intermediate (2)**
   - More pedal types
   - Moderate chain complexity
   - Standard time limit
   - Enhanced scoring system

3. **Advanced (3)**
   - All pedal types
   - Complex chain requirements
   - Shorter time limit
   - Advanced scoring with bonus points

4. **Expert (4)**
   - Custom pedal combinations
   - Expert chain requirements
   - Strict time limit
   - Expert scoring system

#### Integration
- Connects with guitar recording and processing
- Affects guitar tone quality
- Rewards based on chain accuracy and creativity

### Patch Bay Minigame
The patch bay minigame challenges players to create correct signal routing between different studio equipment.

#### Features
- Drag and drop patch connections
- Multiple equipment types (inputs and outputs)
- Dynamic difficulty scaling
- Real-time audio preview
- Visual feedback and scoring system
- Tutorial system with routing tips

#### Difficulty Levels
1. **Beginner (1)**
   - Basic equipment (microphone, preamp)
   - Simple routing requirements
   - Longer time limit
   - Basic scoring system

2. **Intermediate (2)**
   - More equipment types
   - Moderate routing complexity
   - Standard time limit
   - Enhanced scoring system

3. **Advanced (3)**
   - All equipment types
   - Complex routing requirements
   - Shorter time limit
   - Advanced scoring with bonus points

4. **Expert (4)**
   - Custom routing combinations
   - Expert routing requirements
   - Strict time limit
   - Expert scoring system

#### Integration
- Connects with studio setup and routing
- Affects signal flow and recording quality
- Rewards based on routing accuracy and efficiency

## Era-Specific Minigames

### 1950s-1960s
- Basic recording techniques
- Simple mixing concepts
- Early mastering approaches

### 1970s-1980s
- Advanced recording methods
- Multi-track mixing
- Analog mastering techniques

### 1990s-2000s
- Digital recording
- DAW-based mixing
- Digital mastering

### 2010s-Present
- Modern recording techniques
- Advanced mixing concepts
- Contemporary mastering approaches

## Rewards and Progression

### Skill Improvements
- Technical skills
- Creative intuition
- Equipment proficiency

### Experience Points
- Base XP for completion
- Bonus XP for high scores
- Difficulty multipliers

### Money Rewards
- Base reward for completion
- Bonus for high scores
- Difficulty multipliers

## Integration with Main Game

### Project Stages
- Recording
- Mixing
- Mastering
- Equipment setup

### Player Skills
- Technical proficiency
- Creative ability
- Equipment knowledge

### Studio Equipment
- Unlock new equipment
- Improve existing gear
- Specialized tools

## Technical Implementation

### 1. Performance Optimization
- Efficient audio processing for real-time feedback
- GPU-accelerated visual effects
- Predictive loading for seamless transitions
- Memory management for complex audio samples

### 2. Data Persistence
- Individual minigame statistics
- Skill progression tracking
- Achievement progress
- Personal best records

### 3. Accessibility Features
- Visual indicators for audio cues
- Adjustable difficulty levels
- Customizable controls
- Audio descriptions for visual elements

## Best Practices

1. **Component Structure**
   - Use `BaseMinigame` for consistent UI/logic
   - Implement game-specific logic in child components
   - Use Framer Motion for animations

2. **State Management**
   - Keep game state local to the component
   - Use React hooks for state management
   - Implement cleanup in useEffect

3. **Performance**
   - Use React.memo for static components
   - Implement proper cleanup for animations
   - Optimize re-renders with useCallback/useMemo

4. **Accessibility**
   - Include keyboard controls
   - Provide clear visual feedback
   - Support screen readers

## Future Enhancements

1. **Virtual Reality Integration**
   - Full studio environment immersion
   - Hand tracking for natural interactions
   - Spatial audio production in VR
   - Collaborative VR sessions

2. **AI-Powered Adaptation**
   - Dynamic difficulty adjustment
   - Personalized challenge generation
   - Predictive assistance timing
   - Custom training regimens

3. **Community Features**
   - Leaderboards
   - Shared challenges
   - Collaborative projects
   - Mentorship systems

## Troubleshooting

Common issues and solutions:
1. **Minigame not triggering**
   - Check trigger conditions
   - Verify equipment requirements
   - Confirm era compatibility

2. **Rewards not applying**
   - Verify reward calculation
   - Check player level and difficulty scaling
   - Confirm proper callback execution

3. **UI/UX Issues**
   - Ensure proper cleanup in useEffect
   - Check animation performance
   - Verify responsive design 