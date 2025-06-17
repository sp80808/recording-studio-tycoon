import { MusicGenre } from './charts';
import { Band } from './bands';

export interface Song {
  id: string;
  title: string;
  genre: MusicGenre;
  quality: number; // 0-100, influenced by studio, staff, minigame
  productionValue: number; // 0-100, influenced by equipment, staff skills
  releaseDate: number | null; // Game day, null if not yet released
  associatedBandId: string; // ID of the band that created the song
  initialBuzz: number; // Initial popularity/buzz upon release
  chartEntryPotential: number; // Likelihood of entering charts
  totalSales: number;
  currentChartPosition: number | null; // Null if not on charts
  performanceHistory: { day: number; sales: number; chartPosition: number | null }[];
  isReleased: boolean;
  playerProduced?: boolean; // Added to indicate if the song was produced by the player
  // Add more properties as needed, e.g., staff involved, equipment used, minigame scores
}