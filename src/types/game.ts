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
  xpToNextLevel: number;
  perkPoints: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number;
  reputation: number;
  lastMinigameType?: string; // Track last completed minigame to prevent repetition
}

export interface StudioSkill {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
}

export interface ProjectStage {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  workUnitsCompleted: number;
  completed: boolean;
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
  lastWorkDay?: number; // Track when work was last performed
  workSessionCount: number; // Track how many work sessions have been completed
  associatedBandId?: string;
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
  mood: number; // 0-100, affects work effectiveness
  salary: number;
  status: 'Idle' | 'Working' | 'Resting' | 'Training' | 'Researching';
  assignedProjectId: string | null;
  trainingEndDay?: number;
  trainingCourse?: string;
  researchingModId?: string | null;
  researchEndDay?: number;
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
  condition: number; // 0-100, where 100 is perfect condition
  appliedModId?: string | null; // ID of the currently applied mod
}

export interface EquipmentMod {
  id: string;
  name: string; 
  description: string;
  modifiesEquipmentId: string; 
  statChanges: Partial<Equipment['bonuses']>; 
  iconOverride?: string; 
  nameSuffix?: string; 
  researchRequirements: {
    engineerSkill: string; 
    engineerSkillLevel: number;
    researchTime: number; 
    cost: number;
  };
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
  currentEra: string; // Current Era ID
  reputation: number;
  currentDay: number;
  currentYear: number; // Current year in the game world
  selectedEra: string; // Era ID that was selected at game start
  eraStartYear: number; // Year when the current era started
  equipmentMultiplier: number; // Price multiplier for equipment in this era
  playerData: PlayerData;
  studioSkills: Record<string, StudioSkill>;
  ownedUpgrades
  ownedEquipment: Equipment[];
  availableProjects: Project[];
  
  // Multi-project system
  activeProjects: Project[]; // Replace single activeProject with array
  maxConcurrentProjects: number; // Based on studio level/size
  activeProject: Project | null; // Keep for backward compatibility during transition
  
  hiredStaff: StaffMember[];
  availableCandidates: StaffMember[];
  lastSalaryDay: number;
  notifications: GameNotification[];
  bands: Band[]; // All bands (AI and player-created)
  playerBands: Band[]; // Player's own bands
  availableSessionMusicians: SessionMusician[];
  activeOriginalTrack: OriginalTrackProject | null;
  // Charts system data
  chartsData?: {
    charts: Chart[];
    contactedArtists: ArtistContact[];
    marketTrends: MarketTrend[];
    discoveredArtists: any[]; // Artists found in charts
    lastChartUpdate: number; // Day when charts were last updated
  };
  researchedMods: string[]; // Array of researched mod IDs
  
  // Automation system
  automation?: {
    enabled: boolean;
    mode: AutomationMode;
    settings: AutomationSettings;
    efficiency: { [projectId: string]: number };
  };
  
  // Animation state tracking
  animations?: {
    projects: { [projectId: string]: ProjectAnimationState };
    staff: { [staffId: string]: StaffAnimationState };
    globalEffects: GlobalAnimationState;
  };
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
}

// Multi-project automation types
export type AutomationMode = 'off' | 'basic' | 'smart' | 'advanced';

export interface AutomationSettings {
  priorityMode: 'deadline' | 'profit' | 'reputation' | 'balanced';
  minStaffPerProject: number;
  maxStaffPerProject: number;
  workloadDistribution: 'even' | 'focus_one' | 'adaptive';
  pauseOnIssues: boolean;
  notifyOnMilestones: boolean;
}

export interface ProjectAnimationState {
  isActive: boolean;
  workIntensity: number; // 0-1, affects animation speed/intensity
  staffCount: number; // Number of staff working on this project
  progressPulse: boolean; // Whether to show progress bar pulse
  lastUpdate: number; // Timestamp of last animation update
}

export interface StaffAnimationState {
  currentAction: 'idle' | 'working' | 'moving' | 'focused';
  workIntensity: number; // 0-1, affects animation speed
  assignedProjects: string[]; // Project IDs staff is working on
  focusTransition: boolean; // Whether staff is transitioning between projects
  lastActionChange: number; // Timestamp of last action change
}

export interface GlobalAnimationState {
  studioActivity: number; // 0-1, overall studio activity level
  projectTransitions: { [projectId: string]: boolean }; // Projects undergoing transitions
  automationPulse: boolean; // Whether to show automation system activity
  lastGlobalUpdate: number; // Timestamp of last global animation update
}
