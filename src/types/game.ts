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
}

export interface AutoTriggeredMinigame {
  type: string;
  reason: string;
}

export interface ChartsData {
  currentChart: ChartEntry[];
  discoveredArtists: Artist[];
  contactedArtists: ArtistContact[];
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
}

export interface PlayerData {
  level: number;
  xp: number;
  perkPoints: number;
  attributes: PlayerAttributes;
  completedProjects: number;
  lastMinigameType?: string;
  dailyWorkCapacity: number;
}

export interface PlayerAttributes {
  creativity: number;
  technical: number;
  focusMastery: number;
  charisma: number;
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
  trainingCourse?: string;
  trainingEndDay?: number;
  status: 'Idle' | 'Working' | 'Training' | 'Resting';
}

export interface StaffSkills {
  creativity?: number;
  technical?: number;
  speed?: number;
}

export interface PrimaryStats {
  creativity: number;
  technical: number;
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
  };
  maintenanceCost: number;
  failureRate: number;
  failureSeverity: string;
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
    },
    completedProjects: 0,
    dailyWorkCapacity: 8
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
  autoTriggeredMinigame: null
};

export type GameDispatch = React.Dispatch<Partial<GameState>>;
