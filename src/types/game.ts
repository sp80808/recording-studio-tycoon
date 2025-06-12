// Game type definitions
import { Chart, ArtistContact, MarketTrend } from './charts';

export interface PlayerAttributes {
  focusMastery: number;
  creativeIntuition: number;
  technicalAptitude: number;
  businessAcumen: number;
}

export interface PlayerData {
  xp: number;
  level: number;
  xpToNextLevel: number; // Keep one
  perkPoints: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number; // Add back
  reputation: number;
  lastMinigameType?: string; 
}

export interface StudioSkill {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
}

// Forward declaration for StageEvent if it uses ProjectStage
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StageEvent {}

export type MinigameType = 'rhythm' | 'mixing' | 'mastering' | 'soundDesign' | 'acousticTreatment' | 'audioRestoration' | 'analogConsole' | 'microphone_placement' | 'mastering_chain' | 'sound_design_synthesis';

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
  role: 'Engineer' | 'Producer' | 'Songwriter';
  primaryStats: {
    creativity: number;
    technical: number;
    speed: number;
  };
  xpInRole: number;
  levelInRole: number;
  genreAffinity: { genre: string; bonus: number } | null;
  energy: number;
  mood: number; 
  salary: number;
  status: 'Idle' | 'Working' | 'Resting' | 'Training';
  assignedProjectId: string | null;
  trainingEndDay?: number;
  trainingCourse?: string;
  skills?: Record<string, StudioSkill>; // Make optional if not all staff have it initially
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
  icon: string;
  skillRequirement?: {
    skill: string;
    level: number;
  };
  condition?: number; // Add condition to Equipment interface
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
