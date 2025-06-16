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
  | 'GenreSpecialization';

// Define types for unlock conditions
// This allows for a variety of ways a perk can be unlocked.
export interface PerkUnlockCondition {
  type: 
    | 'playerLevel'           // Player reaches a certain level
    | 'studioReputation'      // Studio reaches a certain reputation
    | 'completedProjects'     // Total number of completed projects
    | 'projectsInGenre'       // Number of completed projects in a specific genre
    | 'staffSkillSum'         // Sum of levels in a specific skill across all staff
    | 'specificEquipmentOwned'// Own a specific piece of equipment (by ID)
    | 'specificPerkUnlocked'  // Prerequisite perk (by ID)
    | 'moneyEarned'           // Total money earned
    | 'chartSuccesses';       // Number of songs reaching top 10/20/etc.
  
  value: number; // The threshold value for the condition
  genre?: MusicGenre; // Optional: for 'projectsInGenre'
  skill?: StudioSkillType; // Optional: for 'staffSkillSum'
  equipmentId?: string; // Optional: for 'specificEquipmentOwned'
  perkId?: string; // Optional: for 'specificPerkUnlocked'
}

// Define types for perk effects
// Using a flexible map for effects; keys can be specific game parameters.
// Example keys: 'mixingQualityBonus', 'staffHappiness', 'contractNegotiationBonus', 'researchSpeed'
// Values are typically numbers (e.g., percentage bonus as 0.05 for +5%, or flat value)
export type PerkEffect = {
  key: string; // e.g., "recordingSkillBonus", "projectAppeal.pop", "staffTrainingSpeed"
  value: number | string | boolean; // The effect's magnitude or setting
  operation?: 'add' | 'multiply' | 'set'; // How the value is applied (default: 'add' for numbers, 'set' for others)
  scope?: string; // Optional scope, e.g., "allStaff", "genre.pop", "equipmentType.microphone"
};

export interface StudioPerk {
  id: string; // Unique identifier for the perk, e.g., "advanced_mic_techniques"
  name: string; // Display name, e.g., "Advanced Mic Techniques"
  description: string; // In-game description of what the perk does
  category: StudioPerkCategory; // Helps organize perks in UI
  
  icon?: string; // Optional: Emoji or path to an icon image
  tier: 1 | 2 | 3 | 4 | 5; // Optional: Tier of the perk, for progression or tree structure
  
  cost?: { // Optional: Cost to unlock/purchase the perk
    money?: number;
    researchPoints?: number; // If a research system exists
    perkPoints?: number; // If player earns perk points
  };
  
  unlockConditions: PerkUnlockCondition[]; // Array of conditions, all must be met
  
  effects: PerkEffect[]; // Array of effects this perk applies
  
  prerequisites?: string[]; // Optional: Array of other perk IDs required before this can be unlocked
  leadsTo?: string[]; // Optional: Array of perk IDs this one unlocks/enables
  isRepeatable?: boolean; // Can this perk be acquired multiple times (e.g., stackable bonus)
  maxRepeats?: number; // If repeatable, how many times
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
