// Game type definitions
import { Chart, ArtistContact, MarketTrend } from './charts';
import { MinigameType } from './miniGame'; // Import MinigameType

export interface PlayerAttributes {
  focusMastery: number;
  creativeIntuition: number;
  technicalAptitude: number;
  businessAcumen: number;
  // Adding missing attributes based on progressionUtils usage, assuming these are intended
  creativity: number; 
  technical: number; 
  business: number; 
  charisma: number; 
  luck: number;
}

export interface PlayerData {
  xp: number;
  level: number;
  xpToNextLevel: number; // Keep one
  perkPoints: number;
  attributePoints?: number; // Added based on progressionUtils usage
  attributes: PlayerAttributes;
  dailyWorkCapacity: number; // Add back
  reputation: number;
  lastMinigameType?: string; 
}

export interface StudioSkillBonus {
  projectQuality?: number;
  workSpeed?: number;
  clientSatisfaction?: number;
  trainingEfficiency?: number;
  equipmentEfficiency?: number;
  moneyGain?: number; // Added based on progressionUtils usage
}
export interface StudioSkill {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  bonuses: StudioSkillBonus; // Added based on progressionUtils usage
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StageEvent {}

export interface ProjectStage {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  workUnitsCompleted: number;
  completed: boolean;
  workUnitsRequired?: number;
  id?: string;
  specialEvents?: StageEvent[]; 
  stageBonuses?: { creativity?: number; technical?: number }; 
  requiredSkills?: Record<string, number>; // Was already there, ensure it stays
  minigameTriggerId?: MinigameType; 
  qualityMultiplier?: number; 
  timeMultiplier?: number; 
  minigameTriggers?: MinigameTrigger[]; // Added for useProjectManagement
}

export interface WorkUnit {
  type: 'creativity' | 'technical';
  value: number;
  source: 'player' | 'staff';
  sourceId?: string;
  timestamp: number;
}

// Actual definition for StageEvent
export interface StageEvent {
  id: string;
  type: 'minigame' | 'choice';
  triggerCondition: (stage: ProjectStage) => boolean; // ProjectStage is now defined
  active: boolean;
  description: string;
  choices?: {
    text: string;
    effects: { type: 'quality' | 'efficiency' | 'money' | 'reputation' | 'xp'; value: number }[];
  }[];
}

export interface MinigameTrigger {
  id: string;
  type: MinigameType; // Use existing MinigameType
  difficulty?: number; // Make optional as per projectWorkUtils errors
  rewards: { // Changed to 'rewards' (plural) to match usage in projectWorkUtils.ts
    type: 'quality' | 'speed' | 'xp' | 'efficiency' | 'reputation'; // Added other potential reward types
    value: number;
  }[]; // It's an array of rewards
  triggerReason?: string; // Optional
  lastTriggered?: number;
}


export interface Project {
  id: string;
  title: string;
  genre: string;
  clientType: string;
  difficulty: number;
  durationDaysTotal: number;
  payoutBase: number;
  repGainBase: number;
  requiredSkills: Record<string, number>;
  stages: ProjectStage[];
  matchRating: 'Poor' | 'Good' | 'Excellent';
  accumulatedCPoints: number;
  accumulatedTPoints: number;
  currentStageIndex: number;
  completedStages: number[];
  lastWorkDay?: number; 
  workSessionCount: number; 
  associatedBandId?: string;
  qualityScore?: number; 
  efficiencyScore?: number; 
  isCompleted?: boolean; 
  endDate?: number; 
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole; // Use StaffRole type
  primaryStats: StaffStats; // Use StaffStats type
  xpInRole: number;
  levelInRole: number;
  genreAffinity: GenreAffinity | null; // Use GenreAffinity type
  energy: number;
  mood: number; 
  salary: number;
  status: 'Idle' | 'Working' | 'Resting' | 'Training';
  assignedProjectId: string | null;
  trainingEndDay?: number;
  trainingCourse?: string;
  skills?: Record<string, StudioSkill>; // Make optional if not all staff have it initially
}

export type StaffRole = 'Engineer' | 'Producer' | 'Songwriter' | 'Mix Engineer' | 'Mastering Engineer' | 'Sound Designer';

export interface StaffStats {
  creativity: number;
  technical: number;
  speed: number;
}

export interface GenreAffinity {
  genre: string;
  bonus: number;
}

export type EquipmentCategory = 'microphone' | 'monitor' | 'interface' | 'outboard' | 'instrument' | 'software' | 'recorder' | 'mixer';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  price: number;
  description: string;
  bonuses: {
    genreBonus?: Record<string, number>;
    qualityBonus?: number;
    speedBonus?: number;
    creativityBonus?: number;
    technicalBonus?: number;
  };
  icon: string; // Added icon to Equipment interface
  skillRequirement?: {
    skill: string;
    level: number;
  };
  condition?: number; 
}

export interface EraAvailableEquipment extends Equipment {
  availableFrom: number; // Year when equipment becomes available
  availableUntil?: number; // Year when equipment becomes obsolete (optional)
  eraDescription?: string; // Era-specific description
  isVintage?: boolean; // If true, becomes more expensive over time
}

export interface MinigameDataReward {
  [key: string]: { min: number; max: number } | number; // Allow flexible reward types
}

export interface Minigame {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  cost: number;
  rewards: MinigameDataReward; // Use the new flexible reward type
  type?: MinigameType; // Add type property
}

export interface TrainingCourse {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  effects: {
    statBoosts?: {
      creativity?: number;
      technical?: number;
      speed?: number;
    };
    skillXP?: {
      skill: string;
      amount: number;
    };
    specialEffects?: string[];
  };
  requiredLevel: number;
}

import { Band, SessionMusician, OriginalTrackProject } from './bands';

export interface GameState {
  money: number;
  currentEra: string; 
  reputation: number;
  currentDay: number;
  currentYear: number; 
  selectedEra: string; 
  eraStartYear: number; 
  equipmentMultiplier: number; 
  playerData: PlayerData;
  studioSkills: Record<string, StudioSkill>;
  ownedUpgrades: string[];
  ownedEquipment: Equipment[];
  availableProjects: Project[];
  activeProject: Project | null;
  hiredStaff: StaffMember[];
  availableCandidates: StaffMember[];
  lastSalaryDay: number;
  notifications: GameNotification[];
  bands: Band[]; 
  playerBands: Band[]; 
  availableSessionMusicians: SessionMusician[];
  activeOriginalTrack: OriginalTrackProject | null;
  chartsData?: {
    charts: Chart[];
    contactedArtists: ArtistContact[];
    marketTrends: MarketTrend[];
    discoveredArtists: DiscoveredArtist[]; 
    lastChartUpdate: number; 
  };
  focusAllocation: FocusAllocation; 
  completedProjects?: Project[]; 
  levelUpDetails: LevelUpDetails | null; // For Level Up Modal
  unlockedFeatures?: string[]; // Added based on progressionUtils usage
  availableTraining?: string[]; // Added based on progressionUtils usage (assuming string IDs for courses)
}

export interface GameNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'historical';
  timestamp: number;
  duration?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface FocusAllocation {
  performance: number;
  soundCapture: number;
  layering: number;
  reasoning?: string; 
}

export interface ProjectReport {
  projectTitle: string;
  qualityScore: number;
  efficiencyScore: number;
  finalScore: number;
  payout: number;
  repGain: number;
  xpGain: number;
  review: { // Made review non-optional, but its points optional
    qualityScore: number;
    payout: number;
    xpGain: number;
    creativityPoints?: number; // Optional
    technicalPoints?: number; // Optional
  };
  isCriticalSuccess?: boolean;
}

// Defining ProjectCompletionResult based on its usage in progressionUtils
export interface ProjectCompletionResult extends ProjectReport {
  // Inherits from ProjectReport, can add more specific fields if needed later
}


export interface DiscoveredArtist {
  id: string;
  name: string;
  priceRange?: {
    min: number;
    max: number;
  };
  demandLevel?: number;
  genre?: string; // Assuming MusicGenre from './charts' could be used here too
  popularity?: number;
}

// Types for Level Up Pop-up
export interface UnlockedFeatureInfo {
  id: string; // To link to a more detailed description or feature itself
  name: string;
  description: string;
  icon?: string; // Emoji or Lucide icon name
  category: 'Minigame' | 'Equipment' | 'Studio Upgrade' | 'Staff Tier' | 'Project Type' | 'Mechanic';
}

export interface PlayerAbilityChange {
  name: string; // e.g., "Daily Work Capacity", "Learning Speed"
  oldValue: string | number;
  newValue: string | number;
  unit?: string; // e.g., "%", "pts"
  description?: string; // Optional description of the ability change
}

export interface PlayerAttributeChange {
  name: keyof PlayerAttributes; // e.g., "creativeIntuition"
  oldValue: number;
  newValue: number;
}

export interface ProjectPerformanceSummary {
  projectId: string;
  projectTitle: string;
  genre: string;
  finalScore: number; // Assuming a 0-100 scale or similar
  qualityTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'; // Example tiers
}

export interface StaffProgressionHighlight {
  staffId: string;
  staffName: string;
  skillIncreased?: string; // e.g., "Mixing", "Engineering"
  newSkillLevel?: number;
  newAbilityUnlocked?: string; // e.g., "Can now mentor junior staff"
}

export interface LevelUpDetails {
  newPlayerLevel: number;
  unlockedFeatures: UnlockedFeatureInfo[];
  abilityChanges: PlayerAbilityChange[];
  attributeChanges: PlayerAttributeChange[];
  projectSummaries: ProjectPerformanceSummary[];
  staffHighlights: StaffProgressionHighlight[];
}
// End Types for Level Up Pop-up

// MilestoneReward definition based on progressionUtils usage
export interface MilestoneReward {
  level: number; // Assuming milestones are tied to player levels
  unlockedFeatures?: string[]; // IDs of features, equipment, etc.
  newEquipment?: string[]; // IDs of equipment items
  newTrainingCourses?: string[]; // IDs of training courses
  attributePoints?: number;
  perkPoints?: number;
  // Potentially other direct rewards like money, reputation, specific items
}

// Constant for initial studio skill data, if needed by progressionUtils
// This would typically live in a data file, but placing a type placeholder here for now
export type StudioSkillTemplates = Record<string, Omit<StudioSkill, 'level' | 'xp' | 'xpToNext'>>;

// Example:
// export const STUDIO_SKILLS_TEMPLATES: StudioSkillTemplates = {
//   recording: { name: 'Recording', bonuses: { projectQuality: 0.05 } },
//   mixing: { name: 'Mixing', bonuses: { projectQuality: 0.07 } },
//   mastering: { name: 'Mastering', bonuses: { projectQuality: 0.1 } },
// };
