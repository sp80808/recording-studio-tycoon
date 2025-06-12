# Character Creation and Training System Documentation

## Overview
The Recording Studio Tycoon game features a comprehensive character creation and training system that allows players to customize their studio owner's attributes and develop both their own skills and those of their staff members. This document outlines the system's components, mechanics, and implementation details.

## 1. Character Creation Flow

### Initial Setup
- **First Launch Detection**: The game checks for a `hasCompletedSetup` flag in the player's save data
- **Character Creation Modal**: Appears only on first launch, featuring:
  - Name input field
  - Attribute point allocation system
  - Initial attribute distribution visualization
  - Confirmation button

### Attribute Point System
- **Starting Points**: Players receive 20 attribute points to distribute
- **Minimum Value**: Each attribute starts at 1
- **Maximum Initial Value**: 10 points per attribute
- **Attributes Available**:
  - Focus Mastery: Affects daily work capacity and energy management
  - Creative Intuition: Influences creativity-based project outcomes
  - Technical Aptitude: Impacts technical aspects of production
  - Business Acumen: Affects financial and business-related mechanics

## 2. Player Data Structure

### Core Attributes (`PlayerData` interface)
```typescript
interface PlayerData {
  name: string;
  level: number;
  xp: number;
  money: number;
  reputation: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number;
  attributePoints: number;
  xpToNextLevel: number;
  perkPoints: number;
}
```

### Attribute System
```typescript
interface PlayerAttributes {
  focusMastery: number;
  creativeIntuition: number;
  technicalAptitude: number;
  businessAcumen: number;
}
```

### Leveling Mechanics
- **XP Requirements**: Base XP needed increases with each level
- **Attribute Points**: Gained on level up (2 points per level)
- **Perk Points**: Awarded every 5 levels
- **Daily Work Capacity**: Scales with Focus Mastery

## 3. Staff Attribute System

### Initial Generation Limits
- **Base Stats**: Randomly generated between 1-5
- **Maximum Initial Values**:
  - Creativity: 5
  - Technical: 5
  - Speed: 5
  - Specialized Skills: 3

### Staff Types and Specializations
- **Engineer**: Focus on technical skills
- **Producer**: Balanced creativity and technical
- **Songwriter**: Emphasis on creative skills

### Staff Attributes
```typescript
interface StaffMember {
  primaryStats: {
    creativity: number;
    technical: number;
    speed: number;
    songwriting?: number;
    arrangement?: number;
    ear?: number;
    soundDesign?: number;
    techKnowledge?: number;
    mixing?: number;
    mastering?: number;
  };
  // ... other properties
}
```

## 4. Training System

### Training Types
1. **Formal Training Courses**
   - Duration: 3-7 days
   - Cost: Based on course level
   - Fixed stat increases
   - Prerequisites may apply

2. **Practice Minigames**
   - Duration: 1-3 days
   - No cost
   - Random stat increases within ranges
   - No prerequisites

### Training Mechanics
- **Attribute Growth**: Can exceed initial generation limits
- **Energy System**: Training consumes energy
- **Rest Periods**: Required between training sessions
- **Genre Affinity**: Affects training effectiveness

### Training Course Structure
```typescript
interface TrainingCourse {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  effects: {
    statBoosts?: {
      creativity?: number;
      technical?: number;
      // ... other stats
    };
    skillXP?: {
      skill: string;
      amount: number;
    };
  };
  prerequisites?: {
    // ... skill requirements
  };
}
```

## 5. Player Training Integration

### Staff Modal Modifications
- **Player Section**: Dedicated area for player character
- **Training Options**: Same as staff members
- **Attribute Display**: Current values and growth potential
- **Training History**: Track completed courses and minigames

### Training Restrictions
- **Level Requirements**: Some courses require minimum player level
- **Resource Requirements**: Money and time constraints
- **Prerequisites**: Skill level requirements
- **Cooldown Periods**: Between training sessions

## 6. Implementation Details

### Key Components
1. **Character Creation Modal**
   - `src/components/modals/CharacterCreationModal.tsx`
   - Handles initial setup and attribute allocation

2. **Staff Management**
   - `src/hooks/useStaffManagement.tsx`
   - Manages training, minigames, and attribute growth

3. **Player Progression**
   - `src/hooks/usePlayerProgression.tsx`
   - Handles player-specific training and growth

4. **Training System**
   - `src/utils/trainingUtils.ts`
   - Manages training course effects and prerequisites

### State Management
- **Game State**: Tracks player and staff attributes
- **Training State**: Manages active training sessions
- **Progress Tracking**: Monitors attribute growth

## Best Practices

### Attribute Allocation
1. **Player Character**
   - Focus on core attributes first
   - Consider role specialization
   - Balance between different aspects

2. **Staff Members**
   - Match attributes to role
   - Consider team composition
   - Plan for long-term growth

### Training Strategy
1. **Early Game**
   - Focus on basic skills
   - Build foundation
   - Train staff in core competencies

2. **Mid Game**
   - Specialize staff
   - Develop player's strengths
   - Balance team capabilities

3. **Late Game**
   - Master advanced techniques
   - Optimize team composition
   - Maximize efficiency

## Future Considerations

### Planned Features
1. **Advanced Training**
   - Master classes
   - Specialized workshops
   - Industry expert sessions

2. **Attribute Synergies**
   - Combined training effects
   - Team training bonuses
   - Cross-skill benefits

3. **Progression Systems**
   - Skill trees
   - Career paths
   - Specialization tracks

### Balance Considerations
1. **Attribute Scaling**
   - Growth curves
   - Diminishing returns
   - Maximum caps

2. **Resource Management**
   - Training costs
   - Time investment
   - Energy system

3. **Progression Pacing**
   - Level requirements
   - Training availability
   - Skill prerequisites

## UI Implementation Notes (2024-06 Update)

- The Character Progression modal now displays player attributes **only within the Attributes tab** of the ProgressionPanel.
- Any previous duplicate attribute display outside the tabbed interface has been removed for clarity.
- Attribute upgrades and tooltips are managed exclusively in the Attributes tab, ensuring a single, consistent location for attribute management.
- This change improves UI clarity and maintains consistency with the rest of the game's design system. 