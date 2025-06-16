// Studio Perks & Specializations System
import { MusicGenre } from './charts';
import { StaffRole } from './game';

export type PerkCategory = 'acoustics' | 'talent-acquisition' | 'marketing' | 'equipment' | 'workflow' | 'reputation' | 'networking' | 'innovation';

export interface StudioPerk {
  id: string;
  name: string;
  description: string;
  category: PerkCategory;
  tier: number; // 1-5, higher tiers are more powerful
  unlockConditions: UnlockConditions;
  effects: PerkEffects;
  prerequisites?: string[]; // other perk IDs required first
  mutuallyExclusive?: string[]; // perk IDs that can't be taken with this one
  cost: PerkCost;
  iconName?: string; // for UI display
}

export interface UnlockConditions {
  studioReputationThreshold?: number;
  completedProjectsTotal?: number;
  completedProjectsInGenre?: {
    genre: MusicGenre;
    count: number;
  };
  staffSkillSum?: {
    skill: string;
    totalLevel: number;
  };
  equipmentValue?: number; // total value of owned equipment
  playerLevel?: number;
  chartSuccesses?: number; // number of chart hits
  industryConnections?: number; // relationship system integration
  specificAchievements?: string[]; // specific milestone IDs
}

export interface PerkEffects {
  // Flat bonuses (added to base values)
  flatBonuses?: Map<string, number>;
  
  // Percentage bonuses (multiplied with base values)
  percentageBonuses?: Map<string, number>;
  
  // Special abilities
  specialAbilities?: SpecialAbility[];
  
  // Equipment bonuses
  equipmentEfficiency?: number; // 0-1, reduces equipment degradation
  equipmentBonusMultiplier?: number; // multiplies equipment bonuses
  
  // Staff bonuses
  staffHappiness?: number; // flat bonus to all staff mood
  staffTrainingSpeed?: number; // percentage faster training
  staffCapacity?: number; // additional staff slots
  
  // Project bonuses
  projectQualityBonus?: number; // flat bonus to project quality
  projectSpeedBonus?: number; // percentage faster project completion
  genreSpecificBonuses?: Map<MusicGenre, ProjectBonus>;
  
  // Economic bonuses
  contractValueMultiplier?: number; // multiplies contract payouts
  operatingCostReduction?: number; // percentage reduction in daily costs
  equipmentDiscounts?: number; // percentage discount on equipment purchases
  
  // Reputation bonuses
  reputationGainMultiplier?: number; // multiplies reputation gains
  relationshipBonuses?: Map<string, number>; // bonuses with specific entity types
  
  // Unlock new features
  unlockedFeatures?: string[]; // new game features/systems available
  unlockedEquipment?: string[]; // equipment categories now available
  unlockedStaffRoles?: StaffRole[]; // new staff types can be hired
}

export interface SpecialAbility {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'triggered';
  trigger?: AbilityTrigger;
  effect: AbilityEffect;
  cooldown?: number; // days before can be used again (for active abilities)
  uses?: number; // limited uses per time period
}

export interface AbilityTrigger {
  condition: 'project-start' | 'project-complete' | 'staff-hire' | 'equipment-purchase' | 'chart-success' | 'manual';
  parameters?: Record<string, string | number>;
}

export interface AbilityEffect {
  type: 'bonus' | 'event' | 'unlock' | 'modify';
  target: string; // what the effect applies to
  value: number | string;
  duration?: number; // temporary effects duration in days
}

export interface ProjectBonus {
  qualityBonus: number;
  speedBonus: number;
  costReduction: number;
  specialEffects?: string[]; // e.g., "guaranteed_minigame_bonus", "double_xp"
}

export interface PerkCost {
  money?: number;
  perkPoints: number; // earned through progression
  timeToImplement?: number; // days to apply the perk
  requiredResources?: {
    equipmentCategories?: string[]; // must own equipment in these categories
    staffMinimum?: number; // minimum staff count
    studioSize?: number; // minimum studio level/size
  };
}

export interface StudioSpecialization {
  id: string;
  name: string;
  description: string;
  focusGenres: MusicGenre[]; // primary genres for this specialization
  requiredPerks: string[]; // perk IDs needed to unlock this specialization
  benefits: SpecializationBenefits;
  drawbacks?: SpecializationDrawbacks; // trade-offs for specializing
  prestigeLevel: number; // 0-10, how prestigious this specialization is
}

export interface SpecializationBenefits {
  genreMastery: Map<MusicGenre, number>; // massive bonuses for focus genres
  exclusiveContracts: string[]; // contract types only available to this specialization
  industryRecognition: number; // reputation bonus in relevant circles
  specialEquipment: string[]; // unique equipment available
  marketInfluence: number; // ability to influence genre trends
  mediaAttention: number; // increased visibility in industry
}

export interface SpecializationDrawbacks {
  penalizedGenres?: Map<MusicGenre, number>; // reduced effectiveness in other genres
  increasedCosts?: number; // percentage increase in operating costs
  limitedFlexibility?: boolean; // harder to change direction later
  competitorAttention?: number; // increased scrutiny from competitors
}

export interface PerkTree {
  category: PerkCategory;
  name: string;
  description: string;
  tiers: PerkTreeTier[];
  masterUnlock?: StudioSpecialization; // unlocked when tree is completed
}

export interface PerkTreeTier {
  tier: number;
  perks: StudioPerk[];
  tierRequirement: {
    perksFromPreviousTier: number; // how many perks from previous tier needed
    additionalRequirements?: UnlockConditions;
  };
}

export interface StudioUpgradeState {
  unlockedPerks: Set<string>; // perk IDs
  activeSpecialization?: string; // specialization ID
  availablePerkPoints: number;
  totalPerkPoints: number;
  perkCooldowns: Map<string, number>; // perk ID -> days remaining
  activeEffects: ActiveEffect[]; // temporary effects from perks
}

export interface ActiveEffect {
  id: string;
  name: string;
  sourceType: 'perk' | 'specialization' | 'equipment';
  sourceId: string;
  effect: PerkEffects;
  duration?: number; // remaining days, undefined for permanent
  stackable: boolean;
}

export interface PerkSynergy {
  id: string;
  name: string;
  description: string;
  requiredPerks: string[]; // all these perks must be active
  bonusEffect: PerkEffects; // additional effect when synergy is active
  prestigeBonus?: number; // reputation bonus for achieving this synergy
}

export interface StudioMilestone {
  id: string;
  name: string;
  description: string;
  category: 'projects' | 'reputation' | 'equipment' | 'staff' | 'innovation' | 'industry';
  requirement: MilestoneRequirement;
  reward: MilestoneReward;
  isRepeatable: boolean;
  prestigeValue: number; // how much this contributes to studio prestige
}

export interface MilestoneRequirement {
  type: 'count' | 'threshold' | 'streak' | 'combo' | 'achievement';
  target: string; // what to count/measure
  value: number; // required amount
  timeframe?: number; // days within which to achieve (for streaks/combos)
  additionalConditions?: Record<string, string | number>;
}

export interface MilestoneReward {
  perkPoints?: number;
  money?: number;
  reputation?: number;
  unlockPerk?: string; // specific perk ID
  unlockSpecialization?: string; // specific specialization ID
  unlockFeature?: string; // game feature ID
  specialBonus?: PerkEffects; // unique one-time bonus
}

export interface IndustryPrestige {
  level: number; // 0-100
  points: number; // accumulated prestige points
  tier: 'unknown' | 'local' | 'regional' | 'national' | 'international' | 'legendary';
  benefits: PrestigeBenefits;
  nextTierRequirement: number; // prestige points needed for next tier
}

export interface PrestigeBenefits {
  contractOfferFrequency: number; // multiplier for how often offers come in
  contractQualityBonus: number; // better quality contracts offered
  mediaAttentionBonus: number; // increased industry visibility
  networkingAdvantage: number; // easier to build relationships
  equipmentAccessBonus: string[]; // exclusive equipment categories
  staffAttractionBonus: number; // higher quality staff candidates
}
