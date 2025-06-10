import { GameState, PlayerAttributes, Project, ProjectCompletionResult, StudioSkill, STUDIO_SKILLS, MilestoneReward } from '@/types/game';

export interface Perk {
  id: string;
  name: string;
  description: string;
  cost: number;
  requirements?: Partial<PlayerAttributes>;
  effects: {
    attributes?: Partial<PlayerAttributes>;
    bonuses?: {
      projectQuality?: number;
      projectSpeed?: number;
      moneyGain?: number;
      xpGain?: number;
      clientSatisfaction?: number;
    };
  };
}

export const PERKS: Perk[] = [
  {
    id: "studio_efficiency",
    name: "Studio Efficiency",
    description: "Improve overall studio performance",
    cost: 1,
    effects: {
      bonuses: {
        projectSpeed: 0.1,
        projectQuality: 0.05
      }
    }
  },
  {
    id: "business_network",
    name: "Business Network",
    description: "Better client relationships and negotiations",
    cost: 1,
    requirements: {
      businessAcumen: 10
    },
    effects: {
      bonuses: {
        moneyGain: 0.15,
        clientSatisfaction: 0.1
      }
    }
  },
  {
    id: "technical_mastery",
    name: "Technical Mastery",
    description: "Enhanced technical capabilities",
    cost: 2,
    requirements: {
      technicalAptitude: 15
    },
    effects: {
      attributes: {
        technicalAptitude: 5
      },
      bonuses: {
        projectQuality: 0.1
      }
    }
  },
  {
    id: "creative_genius",
    name: "Creative Genius",
    description: "Boost creative output",
    cost: 2,
    requirements: {
      creativeIntuition: 15
    },
    effects: {
      attributes: {
        creativeIntuition: 5
      },
      bonuses: {
        projectQuality: 0.15
      }
    }
  }
];

// Attribute effect calculations
// Skill effect calculation functions
export const calculateSkillEffect = (value: number, type: 'attribute' | 'project' | 'equipment'): number => {
  switch (type) {
    case 'attribute':
      return value * 0.01; // 1% per point
    case 'project':
      return 1 + (value * 0.015); // 1.5% per point
    case 'equipment':
      return 1 + (value * 0.02); // 2% per point
    default:
      return 1;
  }
};

export const calculateAttributeEffects = (attributes: PlayerAttributes): {
  projectQualityMod: number;
  projectSpeedMod: number;
  moneyMod: number;
  xpMod: number;
  clientSatisfactionMod: number;
  equipmentEfficiencyMod: number;
  criticalSuccessChance: number;
} => {
  // Calculate base effects using the skill effect system
  const creativityEffect = calculateSkillEffect(attributes.creativity, 'project');
  const technicalEffect = calculateSkillEffect(attributes.technical, 'project');
  const businessEffect = calculateSkillEffect(attributes.business, 'attribute');
  const charismaEffect = calculateSkillEffect(attributes.charisma, 'attribute');
  const luckEffect = calculateSkillEffect(attributes.luck, 'attribute');

  // Calculate specialized effects
  const focusMasteryEffect = calculateSkillEffect(attributes.focusMastery, 'project');
  const creativeIntuitionEffect = calculateSkillEffect(attributes.creativeIntuition, 'project');
  const technicalAptitudeEffect = calculateSkillEffect(attributes.technicalAptitude, 'equipment');
  const businessAcumenEffect = calculateSkillEffect(attributes.businessAcumen, 'attribute');

  return {
    projectQualityMod: creativityEffect + technicalEffect + creativeIntuitionEffect,
    projectSpeedMod: technicalEffect + focusMasteryEffect,
    moneyMod: businessEffect + businessAcumenEffect,
    xpMod: 1 + (technicalEffect * 0.5) + (charismaEffect * 0.5) + focusMasteryEffect,
    clientSatisfactionMod: charismaEffect + (businessEffect * 0.5) + creativeIntuitionEffect,
    equipmentEfficiencyMod: technicalEffect + technicalAptitudeEffect,
    criticalSuccessChance: luckEffect * 5 // 5% chance per luck point
  };
};

// Apply attribute effects to project outcomes
export const applyAttributesToProject = (project: Project, attributes: PlayerAttributes): Project => {
  const effects = calculateAttributeEffects(attributes);
  
  return {
    ...project,
    payoutBase: Math.floor(project.payoutBase * effects.moneyMod),
    stages: project.stages.map(stage => ({
      ...stage,
      workUnitsBase: Math.floor(stage.workUnitsBase / effects.projectSpeedMod)
    }))
  };
};

// Studio skill XP thresholds
const BASE_SKILL_XP = 100;
const SKILL_XP_MULTIPLIER = 1.5;

export const calculateSkillXpRequirement = (level: number): number => {
  return Math.floor(BASE_SKILL_XP * Math.pow(SKILL_XP_MULTIPLIER, level));
};

export const initializeStudioSkill = (skillId: string): StudioSkill => {
  const template = STUDIO_SKILLS[skillId];
  return {
    ...template,
    level: 1,
    xp: 0,
    xpToNext: calculateSkillXpRequirement(1)
  };
};

export const addSkillXP = (skill: StudioSkill, xpAmount: number): StudioSkill => {
  const newXP = skill.xp + xpAmount;
  
  if (newXP >= skill.xpToNext) {
    // Level up
    const newLevel = skill.level + 1;
    return {
      ...skill,
      level: newLevel,
      xp: newXP - skill.xpToNext,
      xpToNext: calculateSkillXpRequirement(newLevel)
    };
  }
  
  return {
    ...skill,
    xp: newXP
  };
};

export const calculateStudioSkillEffects = (skills: Record<string, StudioSkill>): {
  projectQualityMod: number;
  workSpeedMod: number;
  clientSatisfactionMod: number;
  trainingEfficiencyMod: number;
  equipmentEfficiencyMod: number;
} => {
  const baseEffects = {
    projectQualityMod: 1,
    workSpeedMod: 1,
    clientSatisfactionMod: 1,
    trainingEfficiencyMod: 1,
    equipmentEfficiencyMod: 1
  };

  return Object.values(skills).reduce((acc, skill) => {
    const levelMultiplier = skill.level * 0.1; // 10% bonus per level
    
    return {
      projectQualityMod: acc.projectQualityMod + (skill.bonuses.projectQuality || 0) * levelMultiplier,
      workSpeedMod: acc.workSpeedMod + (skill.bonuses.workSpeed || 0) * levelMultiplier,
      clientSatisfactionMod: acc.clientSatisfactionMod + (skill.bonuses.clientSatisfaction || 0) * levelMultiplier,
      trainingEfficiencyMod: acc.trainingEfficiencyMod + (skill.bonuses.trainingEfficiency || 0) * levelMultiplier,
      equipmentEfficiencyMod: acc.equipmentEfficiencyMod + (skill.bonuses.equipmentEfficiency || 0) * levelMultiplier
    };
  }, baseEffects);
};

// Critical success calculations
export const checkCriticalSuccess = (criticalChance: number): boolean => {
  return Math.random() * 100 < criticalChance;
};

export const applyCriticalSuccess = (result: ProjectCompletionResult): ProjectCompletionResult => {
  const CRITICAL_MULTIPLIER = 1.5; // 50% bonus on critical success
  
  return {
    ...result,
    qualityScore: result.qualityScore * CRITICAL_MULTIPLIER,
    payout: Math.floor(result.payout * CRITICAL_MULTIPLIER),
    xpGain: Math.floor(result.xpGain * CRITICAL_MULTIPLIER),
    review: {
      ...result.review,
      qualityScore: result.review.qualityScore * CRITICAL_MULTIPLIER,
      payout: Math.floor(result.review.payout * CRITICAL_MULTIPLIER),
      xpGain: Math.floor(result.review.xpGain * CRITICAL_MULTIPLIER),
      creativityPoints: result.review.creativityPoints * CRITICAL_MULTIPLIER,
      technicalPoints: result.review.technicalPoints * CRITICAL_MULTIPLIER
    },
    isCriticalSuccess: true
  };
};

// Apply attribute effects to project completion
export const applyAttributesToCompletion = (
  result: ProjectCompletionResult,
  attributes: PlayerAttributes
): ProjectCompletionResult => {
  const effects = calculateAttributeEffects(attributes);
  let updatedResult = {
    ...result,
    qualityScore: result.qualityScore * effects.projectQualityMod,
    payout: Math.floor(result.payout * effects.moneyMod),
    xpGain: Math.floor(result.xpGain * effects.xpMod),
    review: {
      ...result.review,
      qualityScore: result.review.qualityScore * effects.projectQualityMod,
      payout: Math.floor(result.review.payout * effects.moneyMod),
      xpGain: Math.floor(result.review.xpGain * effects.xpMod)
    }
  };

  // Check for critical success based on luck
  if (checkCriticalSuccess(effects.criticalSuccessChance)) {
    updatedResult = applyCriticalSuccess(updatedResult);
  }

  return updatedResult;
};

// Apply milestone rewards to game state
export const applyMilestoneRewards = (gameState: GameState, milestone: MilestoneReward): GameState => {
  const updatedState = { ...gameState };

  // Add unlocked features
  if (milestone.unlockedFeatures) {
    updatedState.unlockedFeatures = [
      ...updatedState.unlockedFeatures,
      ...milestone.unlockedFeatures
    ];
  }

  // Add new equipment
  if (milestone.newEquipment) {
    // This would need to reference actual equipment data
    // For now, just storing the IDs
    updatedState.ownedUpgrades = [
      ...updatedState.ownedUpgrades,
      ...milestone.newEquipment
    ];
  }

  // Add new training courses
  if (milestone.newTrainingCourses) {
    updatedState.availableTraining = [
      ...updatedState.availableTraining,
      ...milestone.newTrainingCourses
    ];
  }

  // Update player data (attribute points and perk points)
  if (milestone.attributePoints || milestone.perkPoints) {
    updatedState.playerData = {
      ...updatedState.playerData,
      attributePoints: updatedState.playerData.attributePoints + (milestone.attributePoints || 0),
      perkPoints: updatedState.playerData.perkPoints + (milestone.perkPoints || 0)
    };
  }

  return updatedState;
};
