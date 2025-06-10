// Game type definitions
import { Chart, ArtistContact, MarketTrend } from './charts';

export interface PlayerAttributes {
  creativity: number;
  technical: number;
  business: number;
  charisma: number;
  creativeIntuition: number;
  technicalAptitude: number;
}

export interface PlayerData {
  level: number;
  xp: number;
  xpToNextLevel: number;
  money: number;
  reputation: number;
  perkPoints: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number;
  lastMinigameType?: string; // Track last completed minigame to prevent repetition
  playTime: number; // Total play time in milliseconds
}

export interface StudioSkill {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export type StudioSkillName = 'recording' | 'mixing' | 'mastering';

export interface ProjectStage {
  id: string;
  name: string;
  type: string;
  progress: number;
  isCompleted: boolean;
  workUnitsBase: number;
  workUnitsCompleted: number;
  workUnitsRequired: number; // Added this line
  assignedStaff: string[]; // Added for staff assignment
}

export interface Project {
  id: string;
  title: string;
  currentStage: number;
  stages: ProjectStage[];
  genre: string;
  isCompleted?: boolean; // Added
  endDate?: number;      // Added
  payoutBase?: number;   // Added
  repGainBase?: number;  // Added
  workSessionCount?: number; // Added
  accumulatedCPoints?: number; // Added
  accumulatedTPoints?: number; // Added
  clientType?: string; // Added based on usage in ActiveProject
  difficulty?: number; // Added based on usage in ActiveProject
  durationDaysTotal?: number; // Added based on usage in ActiveProject
  qualityScore?: number;
  efficiencyScore?: number;
  [key: string]: unknown;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  experience: number;
  status: 'idle' | 'working' | 'resting';
  mood: number;
  assignedProject?: string;
  skills: {
    [key: string]: {
      level: number;
      xp: number;
      xpToNextLevel: number;
    };
  };
  salary: number;
  primaryStats: {
    creativity: number;
    technical: number;
    speed: number;
  };
  genreAffinity?: {
    genre: string;
    bonus: number;
  };
  specialization?: string[]; // Added to match StaffMember for compatibility
  [key: string]: unknown; // Changed any to unknown
}

export interface Band {
  id: string;
  name: string;
  genre: string;
  popularity: number;
  members: number;
  experience: number;
}

export interface EquipmentBonuses {
  qualityBonus?: number;
  technicalBonus?: number;
  creativityBonus?: number;
  speedBonus?: number;
  genreBonus?: {
    [genre: string]: number;
  };
  [key: string]: number | { [genre: string]: number } | undefined;
}

export interface Equipment {
  id: string;
  name: string;
  category: string; // Renamed from type
  price: number;    // Renamed from cost
  description: string;
  icon: string;
  skillRequirement?: {
    skill: StudioSkillName; // Changed from string
    level: number;
  };
  bonuses: EquipmentBonuses; // Renamed from effects and typed
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

import { Band as BandImport, SessionMusician, OriginalTrackProject } from './bands';

export interface GameState {
  player: {
    era: 'analog' | 'digital' | 'internet' | 'streaming';
    skills: {
      type: string;
      level: number;
    }[];
  };
  ownedEquipment: Equipment[];
  currentProject?: Project;
  projects: Project[];
  currentDay: number;
  playerData: PlayerData;
  studioSkills: {
    recording: StudioSkill; // Ensure StudioSkill type is used
    mixing: StudioSkill;    // Ensure StudioSkill type is used
    mastering: StudioSkill; // Ensure StudioSkill type is used
  };
  bands: Band[];
  activeProject: Project | null;
  staff: Staff[];
  currentEra: string; // Current Era ID
  currentYear: number; // Current year in the game world
  selectedEra: string; // Era ID that was selected at game start
  eraStartYear: number; // Year when the current era started
  equipmentMultiplier: number; // Price multiplier for equipment in this era
  ownedUpgrades: string[];
  availableProjects: Project[];
  availableCandidates: Staff[];
  lastSalaryDay: number;
  notifications: Notification[];
  playerBands: BandImport[];
  availableSessionMusicians: SessionMusician[];
  activeOriginalTrack: OriginalTrackProject | null;
  // Charts system data
  chartsData?: {
    charts: Chart[];
    contactedArtists: ArtistContact[];
    marketTrends: MarketTrend[];
    discoveredArtists: ArtistContact[]; // Artists found in charts
    lastChartUpdate: number; // Day when charts were last updated
  };
  completedProjects: Project[];
  studioLevel: number;
  studioReputation: number;
  studioSpecialization: string[];
  studioChallenges: string[];
  studioAchievements: string[];
  events: GameEvent[];
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

export interface StageTemplate {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  requiredSkills?: Record<string, number>;
  stageBonuses?: Record<string, number>;
  minigameTriggerId?: string; // Added minigameTriggerId
  specialEvents?: StageEvent[]; // Added specialEvents
}

export interface ProjectTemplate {
  id: string;
  titlePattern: string;
  genre: string;
  clientType: string;
  difficulty: number;
  durationDaysTotal: number;
  payoutBase: number;
  repGainBase: number;
  era: string;
  stages: StageTemplate[];
}

export interface WorkUnit {
  type: 'creativity' | 'technical';
  value: number;
  source: 'player' | 'staff';
  sourceId?: string;
  timestamp: number;
}

export interface StageEvent {
  id: string;
  type: 'milestone' | 'challenge' | 'opportunity';
  title: string;
  description: string;
  choices: {
    text: string;
    outcome: string;
    effects: {
      type: 'quality' | 'efficiency' | 'reputation' | 'money';
      value: number;
    }[];
  }[];
  active: boolean;
  triggerCondition: (stage: ProjectStage) => boolean;
}

export type MinigameType = 
  | 'rhythm'
  | 'mixing'
  | 'waveform'
  | 'beatmaking'
  | 'vocal'
  | 'mastering'
  | 'effectchain'
  | 'acoustic'
  | 'layering'
  | 'tape_splicing'
  | 'four_track_recording'
  | 'midi_programming'
  | 'digital_mixing'
  | 'sample_editing'
  | 'sound_design'
  | 'audio_restoration'
  | 'analog_console'; // Added

export interface MinigameTrigger {
  type: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  id: string; // Added id
  reward: { // Added reward structure
    type: 'quality' | 'speed' | 'xp';
    [key: string]: unknown; // Allow other reward properties
  };
  [key: string]: unknown; // Keep for now for other potential dynamic properties
}

export interface MinigameTriggerDefinition {
  minigameType: MinigameType;
  triggerReason: string;
  priority: number;
  era: 'analog' | 'digital' | 'internet' | 'streaming';
  equipmentRequired?: string[];
  stageRequired?: string[];
  focusThreshold?: { type: keyof FocusAllocation; min: number };
  skillRequired?: { type: string; level: number };
}

export interface BaseMinigameProps {
  type: MinigameType;
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export interface MinigameManagerProps {
  isOpen: boolean;
  gameType: MinigameType;
  onReward: (creativityBonus: number, technicalBonus: number, xpBonus: number) => void;
  onClose: () => void;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  duration: number;
}

export interface StaffMember {
  id: string;
  name: string;
  skills: { // Changed to match Staff.skills structure
    [key: string]: {
      level: number;
      xp: number;
      xpToNextLevel: number;
    };
  };
  salary: number;
  specialization?: string[]; // Made optional to match Staff interface
}

export interface MinigameReward {
  type: 'experience' | 'money' | 'reputation' | 'skill' | 'equipment';
  amount: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'production' | 'business' | 'special';
  requirements: {
    type: string;
    value: number;
  }[];
  rewards: MinigameReward[];
  unlocked: boolean;
  progress: number;
}

export interface PlayerProgress {
  level: number;
  experience: number;
  skills: {
    technical: number;
    creative: number;
    business: number;
  };
  achievements: Achievement[];
  unlockedFeatures: string[];
  reputation: {
    local: number;
    regional: number;
    national: number;
    global: number;
  };
}

export interface GameEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface GameAction {
  type: string;
  payload: Record<string, unknown>;
}
