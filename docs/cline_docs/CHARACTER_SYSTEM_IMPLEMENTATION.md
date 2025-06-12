# Character System Technical Implementation Guide

## 1. Character Creation Implementation

### Required Components

1. **CharacterCreationModal Component**
```typescript
// src/components/modals/CharacterCreationModal.tsx
interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (playerData: PlayerData) => void;
}

const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [name, setName] = useState('');
  const [attributes, setAttributes] = useState<PlayerAttributes>({
    focusMastery: 1,
    creativeIntuition: 1,
    technicalAptitude: 1,
    businessAcumen: 1
  });
  const [remainingPoints, setRemainingPoints] = useState(20);

  // Implementation details...
};
```

2. **Attribute Allocation Hook**
```typescript
// src/hooks/useAttributeAllocation.ts
interface UseAttributeAllocationProps {
  initialPoints: number;
  minValue: number;
  maxValue: number;
}

const useAttributeAllocation = ({
  initialPoints,
  minValue,
  maxValue
}: UseAttributeAllocationProps) => {
  const [points, setPoints] = useState(initialPoints);
  const [attributes, setAttributes] = useState<PlayerAttributes>({
    focusMastery: minValue,
    creativeIntuition: minValue,
    technicalAptitude: minValue,
    businessAcumen: minValue
  });

  const calculateCost = (currentValue: number, targetValue: number): number => {
    let cost = 0;
    for (let i = currentValue; i < targetValue; i++) {
      cost += Math.floor(i * 1.5) + 1;
    }
    return cost;
  };

  const canIncreaseAttribute = (
    attribute: keyof PlayerAttributes,
    amount: number = 1
  ): boolean => {
    const currentValue = attributes[attribute];
    const targetValue = currentValue + amount;
    if (targetValue > maxValue) return false;
    
    const cost = calculateCost(currentValue, targetValue);
    return points >= cost;
  };

  const increaseAttribute = (
    attribute: keyof PlayerAttributes,
    amount: number = 1
  ): boolean => {
    if (!canIncreaseAttribute(attribute, amount)) return false;

    const currentValue = attributes[attribute];
    const targetValue = currentValue + amount;
    const cost = calculateCost(currentValue, targetValue);

    setPoints(prev => prev - cost);
    setAttributes(prev => ({
      ...prev,
      [attribute]: targetValue
    }));

    return true;
  };

  const decreaseAttribute = (
    attribute: keyof PlayerAttributes,
    amount: number = 1
  ): boolean => {
    const currentValue = attributes[attribute];
    const targetValue = currentValue - amount;
    if (targetValue < minValue) return false;

    const refund = calculateCost(targetValue, currentValue);
    setPoints(prev => prev + refund);
    setAttributes(prev => ({
      ...prev,
      [attribute]: targetValue
    }));

    return true;
  };

  const resetAttributes = () => {
    setPoints(initialPoints);
    setAttributes({
      focusMastery: minValue,
      creativeIntuition: minValue,
      technicalAptitude: minValue,
      businessAcumen: minValue
    });
  };

  return {
    points,
    attributes,
    canIncreaseAttribute,
    increaseAttribute,
    decreaseAttribute,
    resetAttributes
  };
};
```

### Implementation Steps

1. **First Launch Detection**
```typescript
// src/hooks/useGameState.ts
const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    return {
      hasCompletedSetup: false,
      // ... other initial state
    };
  });
};
```

2. **Attribute Point System**
```typescript
// src/utils/attributeUtils.ts
export const calculateAttributeCost = (
  currentValue: number,
  targetValue: number
): number => {
  // Implementation details...
};

export const validateAttributeAllocation = (
  attributes: PlayerAttributes,
  remainingPoints: number
): boolean => {
  // Implementation details...
};
```

## 2. Player Data Structure Implementation

### Type Definitions

1. **Extended PlayerData Interface**
```typescript
// src/types/game.ts
export interface PlayerData {
  // ... existing properties
  trainingHistory: {
    courseId: string;
    completionDate: number;
    statGains: Partial<PlayerAttributes>;
  }[];
  minigameHistory: {
    minigameId: string;
    completionDate: number;
    statGains: Partial<PlayerAttributes>;
  }[];
  lastTrainingDate?: number;
  trainingCooldown: number;
}
```

2. **Training State Interface**
```typescript
// src/types/training.ts
export interface TrainingState {
  activeTraining?: {
    courseId: string;
    startDate: number;
    endDate: number;
  };
  activeMinigame?: {
    minigameId: string;
    startDate: number;
    endDate: number;
  };
}
```

## 3. Staff Attribute System Implementation

### Staff Generation

1. **Attribute Generation Function**
```typescript
// src/utils/staffUtils.ts
export const generateStaffAttributes = (
  role: StaffMember['role']
): StaffMember['primaryStats'] => {
  // Implementation details...
};

export const calculateStaffValue = (
  staff: StaffMember
): number => {
  // Implementation details...
};
```

2. **Staff Type Specializations**
```typescript
// src/constants/staffConstants.ts
export const STAFF_ROLE_SPECIALIZATIONS = {
  Engineer: {
    primaryStats: ['technical', 'soundDesign', 'techKnowledge'],
    weightMultiplier: 1.5
  },
  Producer: {
    primaryStats: ['creativity', 'technical', 'mixing'],
    weightMultiplier: 1.2
  },
  Songwriter: {
    primaryStats: ['creativity', 'songwriting', 'arrangement'],
    weightMultiplier: 1.3
  }
};
```

## 4. Training System Implementation

### Training Course Management

1. **Course Definition**
```typescript
// src/data/training.ts
export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'basic_mixing',
    name: 'Basic Mixing Techniques',
    description: 'Learn fundamental mixing skills',
    cost: 1000,
    duration: 3,
    effects: {
      statBoosts: {
        mixing: 2,
        technical: 1
      }
    },
    prerequisites: {
      technical: 3
    }
  },
  // ... more courses
];
```

2. **Training Effect Application**
```typescript
// src/utils/trainingUtils.ts
export const applyTrainingEffects = (
  entity: PlayerData | StaffMember,
  course: TrainingCourse
): PlayerData | StaffMember => {
  const isPlayer = 'attributePoints' in entity;
  const baseStats = isPlayer ? entity.attributes : entity.primaryStats;
  
  // Calculate base stat gains
  const statGains: Partial<PlayerAttributes> = {};
  Object.entries(course.effects.statBoosts).forEach(([stat, boost]) => {
    const currentValue = baseStats[stat as keyof typeof baseStats] || 0;
    const gain = Math.min(
      boost,
      isPlayer ? 5 : 3 // Players can gain more stats per training
    );
    statGains[stat as keyof PlayerAttributes] = gain;
  });

  // Apply role-specific bonuses for staff
  if (!isPlayer) {
    const roleSpec = STAFF_ROLE_SPECIALIZATIONS[entity.role];
    if (roleSpec) {
      Object.entries(statGains).forEach(([stat, gain]) => {
        if (roleSpec.primaryStats.includes(stat)) {
          statGains[stat as keyof PlayerAttributes] = Math.floor(
            gain * roleSpec.weightMultiplier
          );
        }
      });
    }
  }

  // Apply experience gain
  const xpGain = Math.floor(
    course.duration * (isPlayer ? 100 : 50) * 
    (1 + (entity.level - 1) * 0.1)
  );

  // Update entity stats
  const updatedEntity = { ...entity };
  if (isPlayer) {
    updatedEntity.attributes = {
      ...updatedEntity.attributes,
      ...statGains
    };
    updatedEntity.experience += xpGain;
    
    // Add to training history
    updatedEntity.trainingHistory.push({
      courseId: course.id,
      completionDate: Date.now(),
      statGains
    });
  } else {
    updatedEntity.primaryStats = {
      ...updatedEntity.primaryStats,
      ...statGains
    };
    updatedEntity.experience += xpGain;
  }

  // Check for level up
  const newLevel = Math.floor(
    Math.sqrt(updatedEntity.experience / 1000)
  ) + 1;
  
  if (newLevel > entity.level) {
    updatedEntity.level = newLevel;
    if (isPlayer) {
      updatedEntity.attributePoints += 2;
    }
  }

  return updatedEntity;
};
```

### Minigame System

1. **Minigame Definition**
```typescript
// src/data/minigames.ts
export const MINIGAMES: Minigame[] = [
  {
    id: 'ear_training',
    name: 'Ear Training Exercise',
    description: 'Practice identifying musical intervals',
    duration: 1,
    cost: 0,
    rewards: {
      ear: { min: 1, max: 3 }
    }
  },
  // ... more minigames
];
```

2. **Minigame Reward Calculation**
```typescript
// src/utils/minigameUtils.ts
export const calculateMinigameRewards = (
  minigame: Minigame,
  entity: PlayerData | StaffMember
): Partial<PlayerAttributes> => {
  // Implementation details...
};
```

## 5. Player Training Integration

### Staff Modal Modifications

1. **Player Section Component**
```typescript
// src/components/PlayerTrainingSection.tsx
interface PlayerTrainingSectionProps {
  playerData: PlayerData;
  onStartTraining: (courseId: string) => void;
  onStartMinigame: (minigameId: string) => void;
}

const PlayerTrainingSection: React.FC<PlayerTrainingSectionProps> = ({
  playerData,
  onStartTraining,
  onStartMinigame
}) => {
  // Implementation details...
};
```

2. **Training History Display**
```typescript
// src/components/TrainingHistory.tsx
interface TrainingHistoryProps {
  history: PlayerData['trainingHistory'];
  minigameHistory: PlayerData['minigameHistory'];
}

const TrainingHistory: React.FC<TrainingHistoryProps> = ({
  history,
  minigameHistory
}) => {
  // Implementation details...
};
```

## 6. State Management Implementation

### Game State Updates

1. **Training State Management**
```typescript
// src/hooks/useTrainingState.ts
interface UseTrainingStateProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

const useTrainingState = ({
  gameState,
  setGameState
}: UseTrainingStateProps) => {
  // Implementation details...
};
```

2. **Progress Tracking**
```typescript
// src/utils/progressUtils.ts
export const trackTrainingProgress = (
  entity: PlayerData | StaffMember,
  training: TrainingState
): void => {
  // Implementation details...
};
```

## Implementation Checklist

1. **Character Creation**
   - [ ] Implement CharacterCreationModal
   - [ ] Add attribute point allocation system
   - [ ] Create first launch detection
   - [ ] Add save state management

2. **Player Data**
   - [ ] Extend PlayerData interface
   - [ ] Implement training history tracking
   - [ ] Add cooldown system
   - [ ] Create progress tracking

3. **Staff System**
   - [ ] Implement attribute generation
   - [ ] Add role specializations
   - [ ] Create staff value calculation
   - [ ] Add training compatibility

4. **Training System**
   - [ ] Create training course definitions
   - [ ] Implement effect application
   - [ ] Add minigame system
   - [ ] Create reward calculation

5. **UI Integration**
   - [ ] Add player training section
   - [ ] Create training history display
   - [ ] Implement progress visualization
   - [ ] Add feedback systems

6. **State Management**
   - [ ] Implement training state
   - [ ] Add progress tracking
   - [ ] Create save/load system
   - [ ] Add validation checks

## Testing Guidelines

1. **Unit Tests**
   - Attribute allocation
   - Training effect application
   - Minigame reward calculation
   - State management

2. **Integration Tests**
   - Character creation flow
   - Training system integration
   - Staff management
   - Progress tracking

3. **UI Tests**
   - Modal interactions
   - Training selection
   - Progress display
   - Feedback systems

## Performance Considerations

1. **State Updates**
   - Batch related updates
   - Use memoization
   - Implement debouncing
   - Optimize re-renders

2. **Data Management**
   - Cache training data
   - Optimize calculations
   - Implement lazy loading
   - Use efficient data structures

3. **UI Performance**
   - Virtualize long lists
   - Optimize animations
   - Implement progressive loading
   - Use efficient rendering

## UI Implementation Update (2024-06)

- The attribute section in the Character Progression UI is now rendered **only within the Attributes tab** of the ProgressionPanel.
- All attribute upgrades and tooltips are managed in this tab.
- There is no longer any duplicate or summary attribute display outside the tabbed interface. 