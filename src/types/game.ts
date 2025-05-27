
// Game type definitions
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
  salary: number;
  status: 'Idle' | 'Working' | 'Resting';
  assignedProjectId: string | null;
}

export interface Equipment {
  id: string;
  name: string;
  category: 'microphone' | 'monitor' | 'interface' | 'processor' | 'instrument';
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
}

export interface FocusAllocation {
  performance: number;
  soundCapture: number;
  layering: number;
}
