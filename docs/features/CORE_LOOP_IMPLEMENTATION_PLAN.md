# Core Loop Implementation Plan: Skill System & Animated Project Review
*Recording Studio Tycoon - Implementation Roadmap*
*Version: 1.1 | Updated: June 11, 2025*

## 📋 Implementation Overview

This document expands on the core loop plan (`core_loop_plan.md`) to provide detailed implementation guidance for the **Skill System** and **Animated Project Review** features. This represents a major enhancement to the game's core feedback loop and progression system.

## 🎯 Implementation Priorities & Phases

### Phase 1: Foundation & Data Structures ⭐ (Priority 1)
**Estimated Duration:** 2-3 days  
**Dependencies:** None - can start immediately

#### 1.1 Core Data Structure Implementation
- [x] **Skill interface** - Already implemented in `src/types/game.ts`
- [x] **PlayerData.skills** - Already implemented
- [x] **StaffMember.skills** - Already implemented  
- [ ] **ProjectReport interfaces** - Need implementation
- [ ] **Skill utilities** - Core functions needed

#### 1.2 Utility Functions (`src/utils/skillUtils.ts`)
```typescript
// Priority functions to implement:
- calculateXpToNextLevel(currentLevel: number): number
- grantSkillXp(currentSkill: Skill, amount: number): { updatedSkill: Skill, levelUps: number }
- initializeSkillsPlayer(): PlayerData['skills']
- initializeSkillsStaff(): StaffMember['skills']
- getSkillsForProject(project: Project): string[] // Determine relevant skills
```

### Phase 2: Project Review Logic ⭐ (Priority 1) 
**Estimated Duration:** 3-4 days  
**Dependencies:** Phase 1 completion

#### 2.1 Project Review Calculation (`src/utils/projectReviewUtils.ts`)
```typescript
// Core function to implement:
generateProjectReview(
  project: Project, 
  assignedPerson: { type: 'player' | 'staff', id: string, name: string, skills: PlayerData['skills'] | StaffMember['skills'] }, 
  equipmentQuality: number
): ProjectReport
```

**Algorithm Design:**
- **Skill Relevance Mapping:** Each project stage maps to specific skills
  - Recording Stage → `tracking`, `rhythm`, `songwriting`
  - Mixing Stage → `mixing`, `soundDesign`, `vocalComping`
  - Mastering Stage → `mastering`, `tapeSplicing`
- **Score Calculation:** Base skill level + equipment bonus + randomness factor
- **XP Distribution:** Higher skill levels = more XP, with diminishing returns
- **Review Generation:** Template-based snippets based on performance scores

### Phase 3: Animation System 🎨 (Priority 2)
**Estimated Duration:** 4-5 days  
**Dependencies:** Phase 2 completion

#### 3.1 Project Review Modal (`src/components/modals/ProjectReviewModal.tsx`)
**Key Animation Components:**
```typescript
interface AnimationSequence {
  skillAnimations: SkillBarAnimation[];
  overallScoreAnimation: ScoreTickerAnimation;
  rewardsAnimation: RewardsDisplayAnimation;
  reviewTextAnimation: TypewriterAnimation;
}
```

**Animation Timing:**
- **Skill XP Bars:** 0.3-0.5s per bar fill
- **Level-up Flash:** 0.2s bright flash + sound
- **Score Tickers:** 1-2s rapid counting
- **Overall Quality:** 1.5s with progress bar
- **Rewards Display:** 0.5s per reward type
- **Review Text:** 30-50 WPM typewriter effect

### Phase 4: Integration & Testing 🔧 (Priority 2)
**Estimated Duration:** 2-3 days  
**Dependencies:** Phase 3 completion

#### 4.1 Game Logic Integration
- Update `useGameLogic.tsx` to handle new project completion flow
- Modify project completion to trigger review modal instead of immediate completion
- Ensure proper state management for modal display/dismissal

## 🏗 Detailed Technical Implementation

### Data Structures & Types

#### Core Types (Already Implemented ✅)
```typescript
// src/types/game.ts
interface Skill {
  xp: number;
  level: number;
  xpToNextLevel: number;
}

// PlayerData.skills - ✅ Implemented
// StaffMember.skills - ✅ Implemented
```

#### New Types Needed (🔄 To Implement)
```typescript
// src/types/game.ts - Add these interfaces

export interface ProjectReportSkillEntry {
  skillName: string;
  initialXp: number;
  xpGained: number;
  finalXp: number;
  initialLevel: number;
  finalLevel: number;
  xpToNextLevelBefore: number;
  xpToNextLevelAfter: number;
  levelUps: number;
  score: number; // 0-100, skill contribution to project quality
}

export interface ProjectReport {
  projectId: string;
  projectTitle: string;
  overallQualityScore: number; // 0-100
  moneyGained: number;
  reputationGained: number;
  playerManagementXpGained: number;
  skillBreakdown: ProjectReportSkillEntry[];
  reviewSnippet: string;
  assignedPerson: {
    type: 'player' | 'staff';
    id: string;
    name: string;
  };
}
```

### Utility Functions Implementation

#### `src/utils/skillUtils.ts` (New File)
```typescript
import { Skill } from '@/types/game';

export const SKILL_NAMES = [
  'songwriting', 'rhythm', 'tracking', 'mixing', 'mastering',
  'tapeSplicing', 'vocalComping', 'soundDesign', 'sampleWarping', 'management'
] as const;

export type SkillName = typeof SKILL_NAMES[number];

/**
 * Calculate XP required for next level
 * Formula: Math.floor(100 * Math.pow(currentLevel, 1.5))
 */
export function calculateXpToNextLevel(currentLevel: number): number {
  return Math.floor(100 * Math.pow(currentLevel, 1.5));
}

/**
 * Grant XP to a skill and handle level-ups
 * Returns updated skill and number of level-ups achieved
 */
export function grantSkillXp(
  currentSkill: Skill, 
  amount: number
): { updatedSkill: Skill, levelUps: number } {
  let updatedSkill = { ...currentSkill };
  let levelUps = 0;
  let remainingXp = amount;

  while (remainingXp > 0) {
    const xpNeeded = updatedSkill.xpToNextLevel;
    
    if (remainingXp >= xpNeeded) {
      // Level up!
      remainingXp -= xpNeeded;
      updatedSkill.xp += xpNeeded;
      updatedSkill.level += 1;
      updatedSkill.xpToNextLevel = calculateXpToNextLevel(updatedSkill.level);
      levelUps += 1;
    } else {
      // Partial XP gain
      updatedSkill.xp += remainingXp;
      updatedSkill.xpToNextLevel -= remainingXp;
      remainingXp = 0;
    }
  }

  return { updatedSkill, levelUps };
}

/**
 * Initialize skills for new player
 */
export function initializeSkillsPlayer(): PlayerData['skills'] {
  const createSkill = (level = 1): Skill => ({
    xp: 0,
    level,
    xpToNextLevel: calculateXpToNextLevel(level)
  });

  return {
    songwriting: createSkill(),
    rhythm: createSkill(),
    tracking: createSkill(),
    mixing: createSkill(),
    mastering: createSkill(),
    tapeSplicing: createSkill(),
    vocalComping: createSkill(),
    soundDesign: createSkill(),
    sampleWarping: createSkill(),
    management: createSkill()
  };
}

/**
 * Initialize skills for new staff member
 */
export function initializeSkillsStaff(): StaffMember['skills'] {
  const createSkill = (level = 1): Skill => ({
    xp: 0,
    level,
    xpToNextLevel: calculateXpToNextLevel(level)
  });

  return {
    songwriting: createSkill(),
    rhythm: createSkill(),
    tracking: createSkill(),
    mixing: createSkill(),
    mastering: createSkill(),
    tapeSplicing: createSkill(),
    vocalComping: createSkill(),
    soundDesign: createSkill(),
    sampleWarping: createSkill()
  };
}

/**
 * Get relevant skills for a project based on its stages
 */
export function getSkillsForProject(project: Project): SkillName[] {
  const skills: Set<SkillName> = new Set();
  
  // Map project stages to skills
  project.stages.forEach(stage => {
    switch (stage.stageName.toLowerCase()) {
      case 'recording':
        skills.add('tracking');
        skills.add('rhythm');
        skills.add('songwriting');
        break;
      case 'mixing':
        skills.add('mixing');
        skills.add('soundDesign');
        skills.add('vocalComping');
        break;
      case 'mastering':
        skills.add('mastering');
        skills.add('tapeSplicing');
        break;
    }
  });

  // Add genre-specific skills
  switch (project.genre.toLowerCase()) {
    case 'electronic':
    case 'hip hop':
      skills.add('sampleWarping');
      skills.add('soundDesign');
      break;
    case 'folk':
    case 'country':
      skills.add('songwriting');
      break;
  }

  return Array.from(skills);
}
```

### Project Review Logic Implementation

#### `src/utils/projectReviewUtils.ts` (New File)
```typescript
import { Project, ProjectReport, ProjectReportSkillEntry, PlayerData, StaffMember } from '@/types/game';
import { getSkillsForProject, SkillName } from './skillUtils';

/**
 * Generate comprehensive project review with skill breakdown
 */
export function generateProjectReview(
  project: Project,
  assignedPerson: {
    type: 'player' | 'staff';
    id: string;
    name: string;
    skills: PlayerData['skills'] | StaffMember['skills'];
  },
  equipmentQuality: number
): ProjectReport {
  const relevantSkills = getSkillsForProject(project);
  const skillBreakdown: ProjectReportSkillEntry[] = [];
  
  let totalScore = 0;
  let maxPossibleScore = 0;

  // Calculate skill scores and XP gains
  relevantSkills.forEach(skillName => {
    const skill = assignedPerson.skills[skillName];
    const skillEntry = calculateSkillContribution(
      skillName,
      skill,
      project,
      equipmentQuality
    );
    
    skillBreakdown.push(skillEntry);
    totalScore += skillEntry.score;
    maxPossibleScore += 100;
  });

  // Calculate overall quality score (0-100)
  const overallQualityScore = maxPossibleScore > 0 
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 50;

  // Calculate rewards based on quality
  const qualityMultiplier = overallQualityScore / 100;
  const moneyGained = Math.round(project.payoutBase * qualityMultiplier);
  const reputationGained = Math.round(project.repGainBase * qualityMultiplier);
  
  // Management XP for player if staff worked on project
  const playerManagementXpGained = assignedPerson.type === 'staff' 
    ? Math.round(10 + (overallQualityScore / 10))
    : 0;

  // Generate review snippet
  const reviewSnippet = generateReviewSnippet(
    project,
    overallQualityScore,
    skillBreakdown
  );

  return {
    projectId: project.id,
    projectTitle: project.title,
    overallQualityScore,
    moneyGained,
    reputationGained,
    playerManagementXpGained,
    skillBreakdown,
    reviewSnippet,
    assignedPerson
  };
}

/**
 * Calculate individual skill contribution to project
 */
function calculateSkillContribution(
  skillName: SkillName,
  skill: Skill,
  project: Project,
  equipmentQuality: number
): ProjectReportSkillEntry {
  // Base score from skill level (0-80)
  const skillLevelScore = Math.min(skill.level * 8, 80);
  
  // Equipment bonus (0-15)
  const equipmentBonus = Math.round(equipmentQuality * 0.15);
  
  // Random factor (-5 to +10)
  const randomFactor = Math.random() * 15 - 5;
  
  // Project difficulty modifier
  const difficultyPenalty = Math.max(0, (project.difficulty - skill.level) * 2);
  
  // Final score (0-100)
  const score = Math.max(0, Math.min(100, 
    skillLevelScore + equipmentBonus + randomFactor - difficultyPenalty
  ));

  // XP gained based on performance and difficulty
  const baseXpGain = 5 + Math.round(project.difficulty * 2);
  const performanceBonus = Math.round((score / 100) * baseXpGain);
  const xpGained = baseXpGain + performanceBonus;

  return {
    skillName,
    initialXp: skill.xp,
    xpGained,
    finalXp: skill.xp + xpGained,
    initialLevel: skill.level,
    finalLevel: skill.level, // Will be updated by grantSkillXp
    xpToNextLevelBefore: skill.xpToNextLevel,
    xpToNextLevelAfter: skill.xpToNextLevel - xpGained, // Approximation
    levelUps: 0, // Will be updated by grantSkillXp
    score
  };
}

/**
 * Generate contextual review snippet based on performance
 */
function generateReviewSnippet(
  project: Project,
  overallScore: number,
  skillBreakdown: ProjectReportSkillEntry[]
): string {
  const templates = getReviewTemplates(project.genre);
  
  if (overallScore >= 85) {
    return getRandomTemplate(templates.excellent, skillBreakdown);
  } else if (overallScore >= 65) {
    return getRandomTemplate(templates.good, skillBreakdown);
  } else {
    return getRandomTemplate(templates.poor, skillBreakdown);
  }
}

// Review template system for contextual feedback
function getReviewTemplates(genre: string) {
  // Expandable template system for different genres and scores
  return {
    excellent: [
      "Exceptional work across all aspects of production.",
      "Professional quality that exceeds industry standards.",
      "Outstanding technical execution with creative flair."
    ],
    good: [
      "Solid production with room for minor improvements.",
      "Good technical foundation with creative moments.",
      "Well-executed project that meets client expectations."
    ],
    poor: [
      "Technical issues detract from the overall quality.",
      "Creative vision not fully realized in execution.",
      "Needs significant improvement in key areas."
    ]
  };
}

function getRandomTemplate(templates: string[], skillBreakdown: ProjectReportSkillEntry[]): string {
  // Simple random selection - can be enhanced with skill-specific context
  return templates[Math.floor(Math.random() * templates.length)];
}
```

## 🎨 Animation System Design

### Component Structure
```
ProjectReviewModal/
├── ProjectReviewModal.tsx      # Main modal component
├── SkillAnimationBar.tsx       # Individual skill XP bar animation
├── ScoreTicker.tsx            # Number counting animation
├── RewardsDisplay.tsx         # Money/reputation animation
└── TypewriterText.tsx         # Review text typing effect
```

### Animation Timing System
```typescript
// Animation sequence configuration
export const ANIMATION_TIMING = {
  skillBar: {
    fillDuration: 400,      // 0.4s per bar fill
    levelUpFlash: 200,      // 0.2s level-up flash
    delayBetweenSkills: 100 // 0.1s between skills
  },
  scoreTicker: {
    duration: 1500,         // 1.5s for score counting
    updateInterval: 50      // Update every 50ms
  },
  rewards: {
    delayPerReward: 500,    // 0.5s between money/reputation
    countDuration: 1000     // 1s counting animation
  },
  typewriter: {
    wordsPerMinute: 40,     // Moderate typing speed
    characterDelay: 150     // 150ms between characters
  }
};
```

## 🔄 Integration Points

### Current System Integration
The skill system needs to integrate with existing systems:

1. **Work Progression System** (Recently Enhanced)
   - Enhanced work unit calculation now provides foundation for skill-based XP
   - Stage-specific focus allocation maps to skill relevance
   - Genre-aware strategies align with skill requirements

2. **Multi-Project System** (Recently Implemented)
   - Staff skill levels affect project assignment efficiency
   - Skill progression unlocks advanced automation features
   - Management skill affects automation effectiveness

3. **Audio System** (Current Investigation)
   - Animation timing needs to coordinate with audio feedback
   - Level-up sounds and XP gain audio require system integration

## 📋 Implementation Checklist

### Phase 1: Foundation ⭐
- [ ] **Create `src/utils/skillUtils.ts`** with core skill functions
- [ ] **Add ProjectReport types** to `src/types/game.ts`
- [ ] **Update game initialization** to use new skill initialization functions
- [ ] **Test skill XP calculation** and level-up logic

### Phase 2: Project Review Logic ⭐
- [ ] **Create `src/utils/projectReviewUtils.ts`** with review generation
- [ ] **Implement skill-to-project mapping** logic
- [ ] **Create review snippet system** with templates
- [ ] **Test review generation** with various scenarios

### Phase 3: Animation System 🎨
- [ ] **Create `ProjectReviewModal.tsx`** main component
- [ ] **Implement `SkillAnimationBar.tsx`** with XP fill animations
- [ ] **Create `ScoreTicker.tsx`** for number counting
- [ ] **Build `RewardsDisplay.tsx`** for money/reputation animations
- [ ] **Implement `TypewriterText.tsx`** for review text
- [ ] **Integrate audio feedback** with animations

### Phase 4: Game Logic Integration 🔧
- [ ] **Update `useGameLogic.tsx`** to handle new completion flow
- [ ] **Modify project completion** to trigger review modal
- [ ] **Ensure proper state management** for modal lifecycle
- [ ] **Test complete flow** from project completion to reward granting
- [ ] **Integrate with existing save/load system**

## 🎯 Success Metrics

### Performance Targets
- **Animation Smoothness:** 60 FPS during all animations
- **Load Time:** Modal appears within 100ms of project completion
- **User Engagement:** Complete animation sequence in 5-8 seconds
- **Audio Sync:** Perfect timing between visual and audio feedback

### Quality Targets
- **Visual Polish:** Professional-grade animations with smooth easing
- **User Experience:** Clear, rewarding progression feedback
- **Code Quality:** Maintainable, well-documented implementation
- **Integration:** Seamless integration with existing systems

## 📚 Documentation Plan

### Implementation Documentation
- [ ] **API Documentation** for all new utility functions
- [ ] **Component Documentation** for animation system
- [ ] **Integration Guide** for connecting with existing systems
- [ ] **Testing Guide** for validation procedures

### User-Facing Documentation
- [ ] **Skill System Guide** explaining progression mechanics
- [ ] **Project Review Explanation** for player understanding
- [ ] **Troubleshooting Guide** for common issues

---

*This implementation plan provides a comprehensive roadmap for the skill system and animated project review. The phased approach ensures stable development while maintaining integration with existing enhanced systems.*

**Next Steps:** Begin Phase 1 implementation with `skillUtils.ts` creation and type updates.
