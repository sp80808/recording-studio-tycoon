export interface PerformanceRating {
  overall: number;
  technical: number;
  creativity: number;
  stagePresence: number;
  genreMatch: number;
}

export interface PerformanceHistoryEntry {
  date: number;
  rating: PerformanceRating;
  reputationGain: number;
}

export interface GenreModifier {
  technical: number;
  creativity: number;
  stagePresence: number;
} 