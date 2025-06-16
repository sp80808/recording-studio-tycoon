import { StudioSkill } from './game'; 
import { PerformanceHistoryEntry, PerformanceRating } from './performance';
import { MusicGenre } from '@/types/charts'; // Import MusicGenre

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
  genre: MusicGenre; 
  subGenreId?: string; 
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
    genre: string; // Consider MusicGenre
    bonus: number;
  } | null;
  mood: number; // Assuming this was intended to be added from previous steps
  salary: number;
  skills?: Record<string, StudioSkill>; // Consider Partial<Record<StudioSkillType, StudioSkill>>
  contractEndDate?: number; // Added from previous error analysis
  experience?: number; // Added from previous error analysis
}

export interface Band {
  id: string;
  bandName: string;
  genre: MusicGenre; // Use MusicGenre
  memberIds: string[]; 
  fame: number; 
  notoriety: number; 
  pastReleases: BandRelease[];
  reputation: number; 
  experience: number; 
  fans: number;
  performanceHistory: PerformanceHistoryEntry[];
  tourStatus: TourStatus; 
  trainingStatus?: {
    isTraining: boolean;
    trainingType: string;
    daysRemaining: number;
  };
  isPlayerCreated: boolean;
}

// TourVenue, TourStop, and Tour interfaces are defined in src/types/tours.ts
