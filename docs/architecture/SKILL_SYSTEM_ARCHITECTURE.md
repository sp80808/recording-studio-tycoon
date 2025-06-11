r# Skill System Architecture
*Recording Studio Tycoon - Technical Architecture Documentation*
*Version: 1.0 | Updated: June 11, 2025*

## 🏗 System Overview

The Skill System represents a fundamental evolution of the game's progression mechanics, introducing granular skill-based progression that replaces the current simple XP system with a rich, multi-dimensional advancement framework.

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SKILL SYSTEM ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   PlayerData    │    │  StaffMember    │                    │
│  │     .skills     │    │     .skills     │                    │
│  └─────────┬───────┘    └─────────┬───────┘                    │
│            │                      │                            │
│            └──────────┬───────────┘                            │
│                       │                                        │
│            ┌─────────────────────────────────┐                 │
│            │         Skill Interface         │                 │
│            │  { xp, level, xpToNextLevel }   │                 │
│            └─────────────┬───────────────────┘                 │
│                          │                                     │
│       ┌──────────────────┼──────────────────┐                  │
│       │                  │                  │                  │
│  ┌────▼────┐    ┌────────▼────────┐    ┌────▼────┐            │
│  │ Skill   │    │   Project       │    │ Animation│            │
│  │ Utils   │    │   Review        │    │ System   │            │
│  │         │    │   Utils         │    │          │            │
│  └─────────┘    └─────────────────┘    └─────────┘            │
│       │                  │                  │                  │
│       │         ┌────────▼────────┐         │                  │
│       │         │  ProjectReport  │         │                  │
│       │         │   Interface     │         │                  │
│       │         └─────────────────┘         │                  │
│       │                  │                  │                  │
│       └──────────────────┼──────────────────┘                  │
│                          │                                     │
│              ┌───────────▼───────────┐                         │
│              │ ProjectReviewModal    │                         │
│              │   (Animation UI)      │                         │
│              └───────────────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### 1. Data Layer

#### Skill Interface
```typescript
interface Skill {
  xp: number;           // Current experience points
  level: number;        // Current skill level (1-100+)
  xpToNextLevel: number; // XP needed for next level
}
```

**Design Principles:**
- **Consistent Structure:** All skills use identical interface
- **Flexible Scaling:** XP curve accommodates unlimited growth
- **Efficient Storage:** Minimal data footprint for save/load

#### Player & Staff Integration
```typescript
// Player skills include Management (staff coordination)
PlayerData.skills: {
  songwriting, rhythm, tracking, mixing, mastering,
  tapeSplicing, vocalComping, soundDesign, sampleWarping,
  management  // Player-exclusive skill
}

// Staff skills exclude Management
StaffMember.skills: {
  songwriting, rhythm, tracking, mixing, mastering,
  tapeSplicing, vocalComping, soundDesign, sampleWarping
}
```

### 2. Business Logic Layer

#### Skill Utilities (`src/utils/skillUtils.ts`)
```typescript
// Core mathematical functions
calculateXpToNextLevel(level: number): number
  → Formula: Math.floor(100 * Math.pow(level, 1.5))
  → Provides balanced progression curve

grantSkillXp(skill: Skill, amount: number): { updatedSkill: Skill, levelUps: number }
  → Handles multiple level-ups in single XP grant
  → Returns both updated skill and level-up count for UI

// Initialization functions
initializeSkillsPlayer(): PlayerData['skills']
initializeSkillsStaff(): StaffMember['skills']
  → Creates properly structured skill objects for new entities

// Project integration
getSkillsForProject(project: Project): SkillName[]
  → Maps project stages and genre to relevant skills
  → Enables dynamic skill selection for reviews
```

#### Project Review Utilities (`src/utils/projectReviewUtils.ts`)
```typescript
generateProjectReview(
  project: Project,
  assignedPerson: PersonWithSkills,
  equipmentQuality: number
): ProjectReport
  → Core business logic for project completion
  → Calculates skill scores, XP gains, and overall quality
  → Generates contextual review snippets
```

### 3. Presentation Layer

#### ProjectReviewModal Component System
```
ProjectReviewModal/
├── ProjectReviewModal.tsx      # Main orchestrator
├── SkillAnimationBar.tsx       # XP bar animations
├── ScoreTicker.tsx            # Number counting effects
├── RewardsDisplay.tsx         # Money/reputation display
└── TypewriterText.tsx         # Review text animation
```

## 🔄 Data Flow Architecture

### Project Completion Flow
```
1. Project Work Completion
   └─→ useStageWork detects completion
       └─→ Calls generateProjectReview()
           └─→ Returns ProjectReport object
               └─→ Triggers ProjectReviewModal
                   └─→ Animates skill progression
                       └─→ Player clicks "Continue"
                           └─→ Applies actual XP/rewards
                               └─→ Updates GameState
```

### Skill Progression Flow
```
1. Skill XP Grant
   └─→ grantSkillXp(skill, amount)
       └─→ Calculates level-ups
           └─→ Updates skill.level
               └─→ Recalculates xpToNextLevel
                   └─→ Returns levelUps count
                       └─→ Triggers level-up animations
```

## 🎨 Animation Architecture

### Animation Timing System
```typescript
interface AnimationSequence {
  phase1_skillBars: {
    duration: 400ms,      // Per skill bar fill
    stagger: 100ms,       // Between skills
    levelUpFlash: 200ms   // Level-up highlight
  },
  phase2_overallScore: {
    duration: 1500ms,     // Score counting
    updateInterval: 50ms  // Smooth counting
  },
  phase3_rewards: {
    moneyAnimation: 1000ms,
    reputationAnimation: 1000ms,
    stagger: 500ms
  },
  phase4_reviewText: {
    wordsPerMinute: 40,
    characterDelay: 150ms
  }
}
```

### Animation State Management
```typescript
interface AnimationState {
  currentPhase: 'skills' | 'score' | 'rewards' | 'review' | 'complete';
  skillAnimations: SkillAnimationState[];
  scoreAnimation: ScoreAnimationState;
  rewardsAnimation: RewardsAnimationState;
  reviewAnimation: ReviewAnimationState;
}
```

## 🔢 Mathematical Models

### XP Curve Design
```typescript
// Level 1: 100 XP
// Level 2: 282 XP
// Level 3: 547 XP
// Level 4: 900 XP
// Level 5: 1341 XP
// ...exponential growth prevents easy maxing

xpToNextLevel = Math.floor(100 * Math.pow(currentLevel, 1.5))
```

**Design Goals:**
- **Early Accessibility:** Quick initial progression
- **Long-term Engagement:** Exponential scaling prevents quick mastery
- **Meaningful Growth:** Each level represents significant improvement

### Skill Score Calculation
```typescript
skillScore = Math.max(0, Math.min(100,
  skillLevelScore    // (level * 8, max 80)
  + equipmentBonus   // (equipmentQuality * 0.15, max 15)
  + randomFactor     // (-5 to +10)
  - difficultyPenalty // (max(0, (difficulty - level) * 2))
))
```

**Balance Factors:**
- **Skill Dominance:** 80% of score from skill level
- **Equipment Impact:** 15% maximum from equipment
- **Randomness:** ±5-10% for variety
- **Difficulty Scaling:** Prevents over-leveled content trivialization

## 🔧 Integration Points

### Current System Integration

#### Work Progression System (v0.3)
```typescript
// Enhanced work calculation now provides skill XP foundation
const workUnits = Math.floor(totalPointsGenerated / 3);
const skillXp = workUnits * skillMultiplier; // New calculation
```

#### Multi-Project System (v0.3)
```typescript
// Staff skills affect assignment efficiency
const assignmentScore = calculateStaffSkillMatch(staff.skills, project.requiredSkills);
const automationEffectiveness = player.skills.management.level * 0.1;
```

#### Audio System (Current Investigation)
```typescript
// Animation timing coordinates with audio feedback
const levelUpSound = await audioSystem.playUISound('levelUp');
const xpGainSound = await audioSystem.playUISound('xpGain');
```

### Save/Load Integration
```typescript
// Skill data serialization
interface SavedSkillData {
  skills: Record<SkillName, Skill>;
  version: number; // For migration support
}

// Migration system for skill structure changes
function migrateSkillData(savedData: any, targetVersion: number): SavedSkillData {
  // Handle version compatibility
}
```

## 🧪 Testing Architecture

### Unit Testing Strategy
```typescript
// Skill utility tests
describe('skillUtils', () => {
  test('calculateXpToNextLevel curve progression')
  test('grantSkillXp handles single level-up')
  test('grantSkillXp handles multiple level-ups')
  test('skill initialization creates valid structures')
});

// Project review tests
describe('projectReviewUtils', () => {
  test('generateProjectReview calculates correct scores')
  test('skill-to-project mapping accuracy')
  test('review snippet generation variety')
});
```

### Integration Testing
```typescript
// End-to-end project completion flow
describe('Skill System Integration', () => {
  test('complete project completion → review → XP application flow')
  test('skill progression affects future project performance')
  test('animation sequence completes without errors')
});
```

## 🚀 Performance Considerations

### Memory Optimization
- **Skill Data:** Minimal 12 bytes per skill (3 numbers)
- **Animation State:** Temporary objects, garbage collected post-animation
- **Review Calculation:** No persistent data, computed on-demand

### CPU Optimization
- **XP Calculations:** O(1) for single level-ups, O(log n) for multiple
- **Animation Updates:** RequestAnimationFrame for 60fps smoothness
- **Review Generation:** Template-based, no complex computation

### Network Optimization
- **Save Data:** Compact skill representation
- **No External Calls:** All calculations client-side
- **Asset Loading:** Pre-load animation assets for smooth experience

## 📈 Scalability Design

### Skill System Expansion
```typescript
// Easy addition of new skills
const NEW_SKILLS = ['orchestration', 'djSkills'] as const;
type ExtendedSkillName = SkillName | typeof NEW_SKILLS[number];

// Backward-compatible skill initialization
function initializeSkillsWithDefaults(existingSkills: Partial<Skills>): Skills {
  return {
    ...DEFAULT_SKILLS,
    ...existingSkills
  };
}
```

### Animation System Extension
```typescript
// Pluggable animation components
interface AnimationPlugin {
  name: string;
  component: React.ComponentType<AnimationProps>;
  duration: number;
  dependencies?: string[];
}

// Animation sequence builder
class AnimationSequenceBuilder {
  addPlugin(plugin: AnimationPlugin): this;
  build(): AnimationSequence;
}
```

## 🔒 Error Handling & Recovery

### Graceful Degradation
```typescript
// Animation failures don't break game state
try {
  await animateSkillProgression(skillData);
} catch (error) {
  console.warn('Animation failed, proceeding with instant update:', error);
  applySkillProgressionInstant(skillData);
}

// Skill calculation fallbacks
function calculateSkillScoreSafe(skill: Skill, project: Project): number {
  try {
    return calculateSkillScore(skill, project);
  } catch (error) {
    console.error('Skill calculation failed, using fallback:', error);
    return Math.max(20, skill.level * 5); // Safe fallback
  }
}
```

### Data Validation
```typescript
// Skill data integrity checks
function validateSkillData(skills: any): skills is PlayerData['skills'] {
  return skills && 
    typeof skills === 'object' &&
    SKILL_NAMES.every(name => 
      skills[name] &&
      typeof skills[name].xp === 'number' &&
      typeof skills[name].level === 'number' &&
      typeof skills[name].xpToNextLevel === 'number'
    );
}
```

## 📋 Implementation Timeline

### Week 1: Foundation
- **Day 1-2:** Skill utilities implementation and testing
- **Day 3-4:** Project review logic and calculation systems
- **Day 5:** Integration with existing game state

### Week 2: UI & Animation
- **Day 1-3:** ProjectReviewModal and animation components
- **Day 4-5:** Animation timing and audio integration

### Week 3: Integration & Polish
- **Day 1-2:** Game logic integration and flow testing
- **Day 3-4:** Performance optimization and error handling
- **Day 5:** Documentation and final testing

---

*This architecture document provides the technical foundation for implementing the skill system. The modular design ensures maintainability while the performance considerations enable smooth gameplay.*

**Next Implementation Step:** Begin with `skillUtils.ts` implementation following the detailed specifications above.
