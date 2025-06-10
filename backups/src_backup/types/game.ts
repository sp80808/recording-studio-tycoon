import { MiniGameType } from './miniGame';

// ... existing content

export interface ProjectStage {
  name: string;
  description: string;
  workUnitsRequired: number;
  workUnitsCompleted: number;
  minigameTriggerId?: string; // ID of the minigame to trigger on completion of this stage
  stageName: string;
  workUnitsBase: number;
  completed: boolean;
  focusAreas: Array<{ name: string; value: number; creativityWeight: number; technicalWeight: number }>;
}

export const STUDIO_SKILLS: Record<string, Omit<StudioSkill, 'level' | 'xp' | 'xpToNext'>> = {
  // Genre Skills
  'rock': {
    name: 'Rock Production',
    category: 'genre',
    description: 'Expertise in recording and producing rock music',
    bonuses: { projectQuality: 0.05, clientSatisfaction: 0.03 }
  },
  'pop': {
    name: 'Pop Production',
    category: 'genre',
    description: 'Specialization in modern pop music production',
    bonuses: { projectQuality: 0.05, clientSatisfaction: 0.03 }
  },
  'electronic': {
    name: 'Electronic Production',
    category: 'genre',
    description: 'Mastery of electronic music production',
    bonuses: { projectQuality: 0.05, workSpeed: 0.02 }
  },
  // Technical Skills
  'mixing': {
    name: 'Mixing',
    category: 'technical',
    description: 'Expertise in mixing techniques',
    bonuses: { projectQuality: 0.08, equipmentEfficiency: 0.05 }
  },
  'mastering': {
    name: 'Mastering',
    category: 'technical',
    description: 'Professional audio mastering capabilities',
    bonuses: { projectQuality: 0.1, equipmentEfficiency: 0.05 }
  },
  'recording': {
    name: 'Recording',
    category: 'technical',
    description: 'Advanced recording techniques',
    bonuses: { projectQuality: 0.05, workSpeed: 0.05 }
  },
  'soundDesign': {
    name: 'Sound Design',
    category: 'technical',
    description: 'Expertise in sound design and synthesis',
    bonuses: { projectQuality: 0.08, trainingEfficiency: 0.05 }
  }
};

export interface StudioSkill {
  name: string;
  category: string;
  description: string;
  level: number;
  xp: number;
  xpToNext: number;
  bonuses: {
    projectQuality?: number;
    clientSatisfaction?: number;
    workSpeed?: number;
    equipmentEfficiency?: number;
    trainingEfficiency?: number;
  };
}

export interface FocusAllocation {
  performance: number;
  soundCapture: number;
  layering: number;
}

export interface PlayerAttributes {
  creativity: number;
  technical: number;
  business: number;
  charisma: number;
}

export interface PlayerData {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  money: number;
  reputation: number;
  attributes: PlayerAttributes;
  dailyWorkCapacity: number;
  attributePoints: number;
  initialAttributePoints: number;
  perkPoints: number;
  unlockedPerks: string[];
  characterCreated: boolean;
  trainingHistory: { courseId: string; completionDate: number; statGains: Partial<PlayerAttributes>; }[];
  minigameHistory: { minigameId: string; completionDate: number; statGains: Partial<PlayerAttributes>; }[];
  trainingCooldown: number;
}

export interface MilestoneProgress {
  lastMilestoneLevel: number;
  nextMilestoneLevel: number;
}

export interface GameState {
  money: number;
  reputation: number;
  currentDay: number;
  playerData: PlayerData;
  studioSkills: Record<string, StudioSkill>;
  ownedUpgrades: string[];
  ownedEquipment: Equipment[];
  availableProjects: Project[];
  activeProject: Project | null;
  hiredStaff: StaffMember[];
  availableCandidates: StaffMember[];
  lastSalaryDay: number;
  notifications: Notification[];
  unlockedFeatures: string[];
  availableTechniques: string[];
  availableTraining: string[];
  milestoneProgress: MilestoneProgress;
  completedProjects: Project[];
  bands: Band[];
}

export interface Equipment {
  id: string;
  name: string;
  category: 'microphone' | 'monitor' | 'processor' | 'interface' | 'instrument';
  icon: string;
  price: number;
  description: string;
  bonuses: {
    qualityBonus?: number;
    creativityBonus?: number;
    technicalBonus?: number;
    speedBonus?: number;
    genreBonus?: Record<string, number>;
  };
}

export interface Project {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  quality: number;
  assignedStaff: string[];
  stages: Array<{
    name: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedStaff: string[];
  }>;
}

export interface ProjectCompletionResult {
  success: boolean;
  review: {
    rating: number;
    feedback: string;
    bonus?: number;
  };
  xpGain: number;
  moneyGain: number;
  reputationGain: number;
}

export interface MinigameTrigger {
  id: string;
  type: MiniGameType;
  difficulty: number;
  rewards: {
    xp: number;
    money?: number;
    reputation?: number;
  };
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  levelInRole: number;
  xpToNextLevelInRole: number;
  salary: number;
  skills: Record<string, number>;
  status: 'Idle' | 'Working' | 'Resting' | 'Training';
  energy: number;
  trainingEndDay?: number;
  assignedProjectId: string | null;
  primaryStats: { creativity: number; technical: number; speed: number };
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface Band {
  id: string;
  name: string;
  genre: string;
  popularity: number;
  members: number;
  experience: number;
}

// ... existing content
