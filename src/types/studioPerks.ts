import { MusicGenre } from './charts'; // For genre-specific conditions/effects
import { StudioSkillType } from './game'; // For skill-based conditions/effects

// Define possible categories for studio perks
export type StudioPerkCategory = 
  | 'Acoustics'
  | 'RecordingGear'
  | 'MixingMastering'
  | 'TalentAcquisition'
  | 'StaffManagement'
  | 'MarketingPromotion'
  | 'BusinessOperations'
  | 'ResearchDevelopment'
  | 'GenreSpecialization'
  | 'Marketing'; // Added Marketing

// Define types for unlock conditions
export interface PerkUnlockCondition {
  type: 
    | 'playerLevel'
    | 'studioReputation'
    | 'completedProjects'
    | 'projectsInGenre'
    | 'staffSkillSum'
    | 'specificEquipmentOwned'
    | 'specificPerkUnlocked'
    | 'moneyEarned'
    | 'chartSuccesses';
  
  value: number;
  genre?: MusicGenre;
  skill?: StudioSkillType;
  equipmentId?: string;
  perkId?: string;
}

// Define types for perk effects
export type PerkEffect = {
  key: string; 
  value: number | string | boolean; 
  operation?: 'add' | 'multiply' | 'set'; 
  scope?: string; 
  genre?: MusicGenre; // Optional: for genre-specific effects
};

export interface StudioPerk {
  id: string; 
  name: string; 
  description: string; 
  category: StudioPerkCategory; 
  
  icon?: string; 
  tier: 1 | 2 | 3 | 4 | 5; 
  
  cost?: { 
    money?: number;
    researchPoints?: number; 
    perkPoints?: number; 
  };
  
  unlockConditions: PerkUnlockCondition[]; 
  
  effects: PerkEffect[]; 
  
  prerequisites?: string[]; 
  leadsTo?: string[]; 
  isRepeatable?: boolean; 
  maxRepeats?: number; 
}

// Example of how a perk might look:
/*
const examplePerk: StudioPerk = {
  id: 'masterMixerI',
  name: 'Master Mixer I',
  description: 'Improves overall mixing quality by 5% and slightly reduces mixing time.',
  category: 'MixingMastering',
  tier: 1,
  cost: { money: 10000, researchPoints: 50 },
  unlockConditions: [
    { type: 'playerLevel', value: 5 },
    { type: 'staffSkillSum', skill: 'mixing', value: 20 }
  ],
  effects: [
    { key: 'globalMixingQualityModifier', value: 0.05, operation: 'multiply' }, // +5%
    { key: 'globalMixingTimeModifier', value: -0.03, operation: 'multiply' } // -3% time
  ],
  leadsTo: ['masterMixerII']
};
*/
