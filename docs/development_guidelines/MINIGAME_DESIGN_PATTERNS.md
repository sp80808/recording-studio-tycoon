# Minigame Design Patterns & Implementation Guide
*Last Updated: June 10, 2025*

## Overview

The Recording Studio Tycoon minigame system is designed with modularity, scalability, and engaging gameplay in mind. This document outlines the design patterns, implementation guidelines, and best practices for creating new minigames within the existing framework.

## Minigame Architecture

### Core Components

#### 1. MinigameManager (`src/components/minigames/MinigameManager.tsx`)
- **Purpose**: Central orchestrator for all minigames
- **Responsibilities**:
  - Minigame lifecycle management
  - Scoring calculation and validation
  - Reward distribution
  - UI state management
  - Sound effect coordination

#### 2. Base Minigame Pattern
All minigames follow a consistent interface pattern:
```typescript
interface BaseMinigameProps {
  onComplete: (score: { creativity: number; technical: number }) => void;
  difficulty?: number;
  gameState?: GameState;
  equipment?: Equipment[];
}
```

#### 3. Trigger System (`src/utils/minigameUtils.ts`)
- **Purpose**: Intelligent minigame triggering based on context
- **Features**:
  - Project stage analysis
  - Equipment availability checks
  - Player progression consideration
  - Focus allocation assessment

### Current Minigame Suite

#### Production Phase Minigames

##### 1. Beat Making (`BeatMakingGame.tsx`)
- **Category**: Rhythm/Timing
- **Mechanics**: Click timing to match beat patterns
- **Skills**: Performance focus, rhythm accuracy
- **Scoring**: Timing precision, combo multipliers

##### 2. Mixing Board (`MixingBoardGame.tsx`)
- **Category**: Technical Adjustment
- **Mechanics**: Adjust EQ and levels for optimal mix
- **Skills**: Sound capture, technical aptitude
- **Scoring**: Parameter accuracy, final mix quality

##### 3. Mastering (`MasteringGame.tsx`)
- **Category**: Audio Enhancement
- **Mechanics**: Apply final polish to completed tracks
- **Skills**: Technical precision, quality assessment
- **Scoring**: Enhancement effectiveness, preservation of dynamics

##### 4. Vocal Recording (`VocalRecordingGame.tsx`)
- **Category**: Performance Capture
- **Mechanics**: Timing and pitch accuracy challenges
- **Skills**: Performance focus, capture techniques
- **Scoring**: Take quality, performance consistency

##### 5. Rhythm Timing (`RhythmTimingGame.tsx`)
- **Category**: Precision Timing
- **Mechanics**: Hit targets in rhythm with music
- **Skills**: Performance timing, musical accuracy
- **Scoring**: Timing precision, sustained accuracy

#### Advanced Production Minigames

##### 6. Effect Chain Building (`EffectChainGame.tsx`)
- **Category**: Creative Processing
- **Mechanics**: Drag-and-drop effect chains with parameter adjustment
- **Skills**: Layering focus, creative processing
- **Features**:
  - Genre-specific optimal chains
  - Real-time audio preview
  - Parameter visualization
  - Efficiency scoring

##### 7. Acoustic Treatment (`AcousticTreatmentGame.tsx`)
- **Category**: Spatial Optimization
- **Mechanics**: Grid-based room treatment puzzle
- **Skills**: Technical planning, spatial reasoning
- **Features**:
  - 8x6 placement grid
  - Budget constraints
  - Treatment type variety
  - Recording type optimization

##### 8. Instrument Layering (`InstrumentLayeringGame.tsx`)
- **Category**: Arrangement Complexity
- **Mechanics**: Layer instruments while avoiding frequency conflicts
- **Skills**: Layering expertise, arrangement skills
- **Features**:
  - Frequency conflict detection
  - Multi-parameter control (timing, volume, panning)
  - Genre-specific combinations
  - Real-time mix analysis

## Design Patterns

### 1. Progressive Difficulty
```typescript
const calculateDifficulty = (playerLevel: number, equipment: Equipment[]) => {
  const baseDifficulty = Math.min(playerLevel * 0.1, 1.0);
  const equipmentBonus = equipment.reduce((bonus, item) => 
    bonus + (item.gameplayEffects?.difficultyReduction || 0), 0);
  
  return Math.max(0.1, baseDifficulty - equipmentBonus);
};
```

### 2. Context-Aware Scoring
```typescript
const calculateScore = (performance: number, context: GameContext) => {
  const baseScore = performance * 100;
  const genreMultiplier = getGenreMultiplier(context.genre);
  const equipmentBonus = getEquipmentBonus(context.equipment);
  
  return {
    creativity: Math.floor(baseScore * genreMultiplier.creativity + equipmentBonus.creativity),
    technical: Math.floor(baseScore * genreMultiplier.technical + equipmentBonus.technical)
  };
};
```

### 3. Adaptive Triggers
```typescript
const shouldTriggerMinigame = (project: Project, gameState: GameState) => {
  const stageRelevance = getStageRelevance(project.currentStage);
  const equipmentAvailability = checkEquipmentRequirements(gameState.equipment);
  const playerReadiness = assessPlayerReadiness(gameState.playerData);
  
  return stageRelevance && equipmentAvailability && playerReadiness;
};
```

## Implementation Guidelines

### Creating New Minigames

#### Step 1: Define Minigame Concept
- **Core Mechanic**: What is the primary interaction?
- **Skill Focus**: Which player attributes does it develop?
- **Context Relevance**: When should it trigger in the production workflow?
- **Difficulty Scaling**: How does it adapt to player progression?

#### Step 2: Component Structure
```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { playSound } from '@/utils/soundUtils';

interface NewMinigameProps {
  onComplete: (score: { creativity: number; technical: number }) => void;
  difficulty?: number;
  gameState?: GameState;
}

export const NewMinigame: React.FC<NewMinigameProps> = ({
  onComplete,
  difficulty = 0.5,
  gameState
}) => {
  const [gameScore, setGameScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleMinigameComplete = () => {
    const finalScore = calculateFinalScore(gameScore, difficulty);
    playSound('success.wav', 0.7);
    onComplete(finalScore);
  };

  return (
    <Card className="p-6 bg-gray-800/90 border-gray-600">
      {/* Minigame UI */}
    </Card>
  );
};
```

#### Step 3: Register in MinigameManager
```typescript
// Add to MinigameType union
export type MinigameType = 'rhythm' | 'mixing' | 'mastering' | 'vocal' | 'timing' | 'effectchain' | 'acoustic' | 'layering' | 'newgame';

// Add to component mapping
const minigameComponents: Record<MinigameType, React.ComponentType<any>> = {
  // ...existing mappings
  newgame: NewMinigame,
};

// Add to scoring configuration
const minigameScoring: Record<MinigameType, ScoringConfig> = {
  // ...existing configurations
  newgame: {
    creativityWeight: 0.6,
    technicalWeight: 0.4,
    maxCreativity: 15,
    maxTechnical: 10
  }
};
```

#### Step 4: Add Trigger Logic
```typescript
// In minigameUtils.ts
export const shouldAutoTriggerMinigame = (project: Project, gameState: GameState, focusAllocation: FocusAllocation) => {
  // ...existing logic
  
  // New minigame trigger condition
  if (project.currentStage.stageName.includes('NewStage') && 
      focusAllocation.layering >= 50 && 
      gameState.playerData.level >= 3) {
    return {
      minigameType: 'newgame' as MinigameType,
      triggerReason: 'New production technique available!'
    };
  }
  
  return null;
};
```

### Best Practices

#### User Experience
1. **Clear Instructions**: Provide intuitive UI and helpful tooltips
2. **Immediate Feedback**: Visual and audio response to player actions
3. **Progressive Learning**: Start simple, gradually introduce complexity
4. **Satisfying Completion**: Rewarding animations and sound effects

#### Technical Implementation
1. **Performance**: Optimize for smooth 60fps gameplay
2. **Accessibility**: Support keyboard navigation and screen readers
3. **Responsive Design**: Work on various screen sizes
4. **Error Handling**: Graceful degradation for edge cases

#### Game Balance
1. **Difficulty Curve**: Match challenge to player progression
2. **Reward Balance**: Meaningful but not overpowered rewards
3. **Time Investment**: Appropriate length for game flow
4. **Skill Development**: Reinforce core game mechanics

## Future Minigame Concepts

### Planned Minigames

#### 1. Songwriting/Lyric Composition
- **Concept**: Word association and creative writing challenges
- **Mechanics**: Drag-and-drop lyrical fragments, rhyme matching
- **Skills**: Creativity focus, artistic expression
- **Triggers**: Early project stages, singer-songwriter projects

#### 2. Live Sound Engineering
- **Concept**: Real-time mixing during live performance simulation
- **Mechanics**: Dynamic level adjustments, feedback management
- **Skills**: Technical aptitude, pressure performance
- **Triggers**: Band tour management, live recording projects

#### 3. Music Video Production
- **Concept**: Visual storytelling and production management
- **Mechanics**: Budget allocation, scene selection, style matching
- **Skills**: Creative vision, project management
- **Triggers**: Post-production phase, promotional activities

#### 4. Gear Maintenance & Repair
- **Concept**: Technical troubleshooting and equipment care
- **Mechanics**: Circuit tracing, component matching, timing challenges
- **Skills**: Technical knowledge, problem-solving
- **Triggers**: Equipment breakdowns, maintenance schedules

#### 5. Artist Scouting & A&R
- **Concept**: Talent evaluation and market analysis
- **Mechanics**: Audio analysis, trend matching, decision making
- **Skills**: Market awareness, talent recognition
- **Triggers**: Industry networking, label development

### Advanced Features

#### Dynamic Difficulty Adjustment
```typescript
const adjustDifficulty = (playerPerformance: number[], currentDifficulty: number) => {
  const averagePerformance = playerPerformance.reduce((a, b) => a + b) / playerPerformance.length;
  
  if (averagePerformance > 0.8) {
    return Math.min(currentDifficulty + 0.1, 1.0);
  } else if (averagePerformance < 0.4) {
    return Math.max(currentDifficulty - 0.1, 0.1);
  }
  
  return currentDifficulty;
};
```

#### Procedural Content Generation
```typescript
const generateMinigameContent = (genre: string, difficulty: number) => {
  const genreTemplates = getGenreTemplates(genre);
  const difficultyModifiers = getDifficultyModifiers(difficulty);
  
  return combineTemplatesWithModifiers(genreTemplates, difficultyModifiers);
};
```

#### Multi-Stage Minigames
```typescript
interface MinigameStage {
  id: string;
  description: string;
  component: React.ComponentType<any>;
  completionCriteria: (score: number) => boolean;
}

const executeMultiStageMinigame = (stages: MinigameStage[]) => {
  // Implementation for complex, multi-part minigames
};
```

## Testing and Quality Assurance

### Minigame Testing Checklist
- [ ] Core mechanics function correctly
- [ ] Scoring system produces balanced results
- [ ] UI responds smoothly to all interactions
- [ ] Sound effects play at appropriate times
- [ ] Difficulty scales appropriately with player level
- [ ] Triggers activate under correct conditions
- [ ] Completion rewards integrate with main progression

### Performance Testing
- [ ] Maintains 60fps during active gameplay
- [ ] Memory usage remains stable throughout session
- [ ] Loading times are acceptable (< 500ms)
- [ ] Works smoothly on target devices and browsers

### Accessibility Testing
- [ ] Keyboard navigation works for all interactions
- [ ] Screen reader compatible with ARIA labels
- [ ] High contrast mode doesn't break visuals
- [ ] Reduced motion preferences are respected

## Maintenance and Evolution

### Version Control for Minigames
- Track minigame-specific changes separately
- Maintain backward compatibility for save games
- Document balance changes and reasoning
- Version control for scoring algorithms

### Community Feedback Integration
- Monitor player engagement metrics
- Collect feedback on difficulty and enjoyment
- Iterate on mechanics based on real usage
- A/B test new features before full deployment

### Expansion Considerations
- Plan for additional complexity layers
- Consider VR/AR adaptations for future platforms
- Design for potential multiplayer/competitive modes
- Maintain modular structure for easy extension
