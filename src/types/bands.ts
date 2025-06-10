
export interface Band {
  id: string;
  bandName: string;
  genre: string;
  fame: number;
  notoriety: number;
  memberIds: string[]; // Staff member IDs
  isPlayerCreated: boolean;
  pastReleases: BandRelease[];
  tourStatus: TourStatus;
}

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
  bandId?: string; // For band projects
  sessionMusicianIds: string[]; // For producer/artist mode
  mode: 'band' | 'producer';
  stages: OriginalTrackStage[];
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
