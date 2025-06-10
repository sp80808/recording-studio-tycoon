
export interface GameState {
  currentDay: number;
  currentEra: string;
  eraStartYear: number;
  currentYear: number;
  money: number;
  reputation: number;
  playerData: PlayerData;
  staff: StaffMember[];
  hiredStaff: StaffMember[];
  staffCandidates: StaffMember[];
  availableProjects: Project[];
  activeProject: Project | null;
  projects: Project[];
  equipment: string[];
  studioLevel: number;
  notifications: Notification[];
  availableCandidates: StaffMember[];
  equipmentMultiplier: number;
  playerBands: Band[];
  originalTracks: number;
  activeOriginalTrack: any;
  chartsData: ChartsData | null;
  ownedEquipment: Equipment[];
  availableEras: Era[];
  autoTriggeredMinigame: AutoTriggeredMinigame | null;
  studioSkills: StudioSkills;
  studioRooms: StudioRoom[];
  studioUpgrades: StudioUpgrade[];
}

export interface StudioSkills {
  recording: number;
  mixing: number;
  mastering: number;
  production: number;
}

export interface StudioRoom {
  id: string;
  name: string;
  type: 'recording' | 'control' | 'live' | 'vocal_booth' | 'isolation';
  level: number;
  equipment: Equipment[];
  capacity: number;
  acousticRating: number;
  maintenanceLevel: number;
  isUpgrading: boolean;
  upgradeDaysRemaining?: number;
}

export interface StudioUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  requirements: {
    studioLevel?: number;
    reputation?: number;
    completedProjects?: number;
  };
  effects: {
    studioSkillBonus?: Partial<StudioSkills>;
    equipmentSlots?: number;
    prestigeBonus?: number;
  };
}

export interface AutoTriggeredMinigame {
  type: string;
  reason: string;
}

export interface ChartsData {
  currentChart: ChartEntry[];
  discoveredArtists: Artist[];
  contactedArtists: ArtistContact[];
  charts: ChartEntry[];
  marketTrends: MarketTrend[];
}

export interface MarketTrend {
  genre: string;
  popularity: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface ArtistContact {
  artistId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestDate: Date;
  opportunityId: string;
  negotiationPhase: string;
}

export interface ChartEntry {
  position: number;
  artist: string;
  title: string;
  weeksOnChart: number;
  peakPosition: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  demandLevel: number;
  priceRange: {
    min: number;
    max: number;
  };
  stats: {
    vocals: number;
    instrumentation: number;
    composition: number;
    stagePresence: number;
  };
  availability: 'available' | 'negotiating' | 'unavailable';
}

export interface Era {
  id: string;
  name: string;
  description: string;
  startYear: number;
  endYear: number;
  requiredLevel: number;
  requiredReputation: number;
  requiredProjects: number;
  availableEquipment: string[];
  features?: string[];
  colors?: {
    gradient: string;
  };
  icon?: string;
}

export interface PlayerData {
  level: number;
  xp: number;
  perkPoints: number;
  attributes: PlayerAttributes;
  completedProjects: number;
  lastMinigameType?: string;
  dailyWorkCapacity: number;
  reputation: number;
}

export interface PlayerAttributes {
  creativity: number;
  technical: number;
  focusMastery: number;
  charisma: number;
  creativeIntuition: number;
  technicalAptitude: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  salary: number;
  skills?: StaffSkills;
  primaryStats: PrimaryStats;
  isAvailable: boolean;
  isResting?: boolean;
  energy: number;
  projectId?: string | null;
  assignedProjectId?: string | null;
  trainingCourse?: string;
  trainingEndDay?: number;
  status: 'Idle' | 'Working' | 'Training' | 'Resting';
  levelInRole: number;
  xpInRole: number;
  genreAffinity: string[];
}

export interface StaffSkills {
  creativity?: number;
  technical?: number;
  speed?: number;
}

export interface PrimaryStats {
  creativity: number;
  technical: number;
  speed: number;
}

export interface Project {
  id: string;
  title: string;
  genre: string;
  difficulty: number;
  description: string;
  payoutBase: number;
  creativityRequired: number;
  technicalRequired: number;
  accumulatedCPoints: number;
  accumulatedTPoints: number;
  isComplete: boolean;
  clientName: string;
  eraRequirement?: string;
  daysRemaining?: number;
  workSessionCount?: number;
  currentStage?: number;
  projectId?: string | null;
  stages?: ProjectStage[];
  currentStageIndex?: number;
  repGainBase?: number;
  durationDaysTotal?: number;
  requiredSkills?: Record<string, number>;
  matchRating?: 'Poor' | 'Good' | 'Excellent';
  completedStages?: ProjectStage[];
  associatedBandId?: string;
  clientType?: string;
  requiredCPoints?: number;
  requiredTPoints?: number;
}

export interface ProjectStage {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  workUnitsCompleted: number;
  completed: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  era: string;
  price: number;
  description: string;
  bonuses: {
    creativity?: number;
    technical?: number;
    speed?: number;
    qualityBonus?: number;
    technicalBonus?: number;
    creativityBonus?: number;
    speedBonus?: number;
    genreBonus?: Record<string, number>;
  };
  maintenanceCost: number;
  failureRate: number;
  failureSeverity: string;
  category: string;
  icon: string;
  skillRequirement?: number;
}

export interface EraAvailableEquipment {
  id: string;
  name: string;
  type: string;
  era: string;
  price: number;
  description: string;
  bonuses: {
    creativity?: number;
    technical?: number;
    speed?: number;
    qualityBonus?: number;
    technicalBonus?: number;
    creativityBonus?: number;
    speedBonus?: number;
    genreBonus?: Record<string, number>;
  };
  maintenanceCost: number;
  failureRate: number;
  failureSeverity: string;
  category: string;
  icon: string;
  skillRequirement?: number;
}

export interface FocusAllocation {
  performance: number;
  soundCapture: number;
  layering: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  duration?: number;
}

export interface GameNotification extends Notification {}

export interface StudioSkill {
  id: string;
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  xpToNext: number;
}

export interface Band {
  id: string;
  name: string;
  members: string[];
  genre: string;
  popularity: number;
  bandName: string;
  fame: number;
  notoriety: number;
  memberIds: string[];
  tourStatus: string;
  pastReleases: any[];
}

export const initialGameState: GameState = {
  currentDay: 1,
  currentEra: 'analog60s',
  eraStartYear: 1960,
  currentYear: 1960,
  money: 5000,
  reputation: 50,
  playerData: {
    level: 1,
    xp: 0,
    perkPoints: 0,
    attributes: {
      creativity: 5,
      technical: 5,
      focusMastery: 5,
      charisma: 5,
      creativeIntuition: 5,
      technicalAptitude: 5,
    },
    completedProjects: 0,
    dailyWorkCapacity: 8,
    reputation: 50
  },
  staff: [],
  hiredStaff: [],
  staffCandidates: [],
  availableProjects: [],
  activeProject: null,
  projects: [],
  equipment: [],
  studioLevel: 1,
  notifications: [],
  availableCandidates: [],
  equipmentMultiplier: 1,
  playerBands: [],
  originalTracks: 0,
  activeOriginalTrack: null,
  chartsData: null,
  ownedEquipment: [],
  availableEras: [],
  autoTriggeredMinigame: null,
  studioSkills: {
    recording: 1,
    mixing: 1,
    mastering: 1,
    production: 1
  },
  studioRooms: [],
  studioUpgrades: []
};

export type GameDispatch = React.Dispatch<Partial<GameState>>;
