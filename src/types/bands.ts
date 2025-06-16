import { StudioSkill } from './game'; // Assuming StudioSkill is correctly in game.ts or will be
import { PerformanceHistoryEntry, PerformanceRating } from './performance';

export interface BandRelease {
  id: string;
  trackTitle: string;
  reviewScore: number; // 1-10
  totalSales: number;
  releaseDate: number; // Game day
  isActive: boolean; // Still generating sales
  dailySales: number;
  daysRemaining: number;
}

export interface TourStatus {
  isOnTour: boolean;
  daysRemaining: number;
  dailyIncome: number;
}

export interface SessionMusician {
  id: string;
  name: string;
  role: 'Session Guitarist' | 'Session Drummer' | 'Session Bassist' | 'Session Keyboardist' | 'Session Vocalist';
  creativity: number;
  technical: number;
  hireCost: number;
}

export interface OriginalTrackProject {
  id: string;
  title: string;
  bandId?: string;
  sessionMusicianIds: string[];
  mode: 'band' | 'producer';
  stages: {
    name: string;
    progress: number;
    requiredProgress: number;
  }[];
  currentStageIndex: number;
  accumulatedCPoints: number;
  accumulatedTPoints: number;
  workSessionCount: number;
}

export interface OriginalTrackStage {
  stageName: string;
  focusAreas: string[];
  workUnitsBase: number;
  workUnitsCompleted: number;
  completed: boolean;
}

// StaffStats and StaffMember might be better in a general staff.ts or game.ts
export interface StaffStats {
  creativity: number;
  technical: number;
  speed: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  primaryStats: StaffStats;
  status: 'Idle' | 'Working' | 'Resting' | 'Training' | 'On Tour';
  xpInRole: number;
  levelInRole: number;
  genreAffinity: {
    genre: string;
    bonus: number;
  } | null;
  mood: number;
  salary: number;
  skills?: Record<string, StudioSkill>;
}

export interface Band {
  id: string;
  bandName: string;
  genre: string;
  memberIds: string[];
  fame: number;
  notoriety: number;
  pastReleases: BandRelease[]; // Uses the re-added BandRelease
  reputation: number;
  experience: number;
  fans: number;
  performanceHistory: PerformanceHistoryEntry[];
  tourStatus: TourStatus; // Uses the defined TourStatus interface
  trainingStatus?: {
    isTraining: boolean;
    trainingType: string;
    daysRemaining: number;
  };
  isPlayerCreated: boolean;
}

// TourVenue and TourStop are defined in src/types/tours.ts
// Tour is defined in src/types/tours.ts
