import { GameState } from '@/types/game';
import { MarketTrend, SubGenre, MusicGenre, TrendDirection, TrendEvent } from '@/types/charts';
import { Project } from '@/types/game';
import { subGenres as importedSubGenres, getSubGenreById as getImportedSubGenreById } from '@/data/subGenreData'; // Import subgenre data

// In-memory store for market trends
let currentMarketTrends: MarketTrend[] = [];
// Use subgenres from the dedicated data file
const allSubGenres: ReadonlyArray<SubGenre> = [...importedSubGenres];

// Helper to initialize some basic trends if needed for development
const initializeMockData = () => {
  // allSubGenres is already initialized from the import.
  // We only need to initialize currentMarketTrends if empty.
  if (currentMarketTrends.length === 0) {
    const genres: MusicGenre[] = ['pop', 'rock', 'hip-hop', 'electronic', 'country', 'jazz'];
    const directions: TrendDirection[] = ['rising', 'stable', 'falling', 'emerging'];
    
    genres.forEach((genre, index) => {
      // Try to find a subgenre for this main genre from our imported list
      const relevantSubGenre = allSubGenres.find(sg => sg.parentGenre === genre);

      currentMarketTrends.push({
        id: `trend-${genre}-${Date.now()}-${index}`, // Ensure unique ID
        genreId: genre,
        subGenreId: relevantSubGenre ? relevantSubGenre.id : undefined,
        popularity: Math.floor(Math.random() * 70) + 30, 
        trendDirection: directions[Math.floor(Math.random() * directions.length)],
        growthRate: Math.random() * 10 - 5, 
        lastUpdated: Date.now(),
        growth: Math.random() * 100 - 50,
        events: [],
        duration: 30, 
        startDay: 1, 
      });
    });
  }
};

initializeMockData(); 

export const marketService = {
  updateAllMarketTrends: (
    gameState: GameState,
    playerProjectsCompletedSinceLastUpdate: Project[] = [],
    globalEventsHappenedSinceLastUpdate: TrendEvent[] = []
  ): MarketTrend[] => {
    console.log('MarketService: Updating all market trends...');
    
    currentMarketTrends = currentMarketTrends.map(trend => {
      let newPopularity = trend.popularity;
      let newGrowthRate = trend.growthRate;
      let newTrendDirection = trend.trendDirection;

      newPopularity += trend.growthRate * (Math.random() * 0.5 + 0.75); 
      newGrowthRate += (Math.random() * 2 - 1) * 0.5; 

      playerProjectsCompletedSinceLastUpdate.forEach(project => {
        if (project.genre === trend.genreId && project.qualityScore && project.qualityScore > 70) {
          newPopularity += project.qualityScore / 20; 
          newGrowthRate += project.qualityScore / 100;  
          console.log(`Player project '${project.title}' boosted ${trend.genreId}`);
        }
      });

      globalEventsHappenedSinceLastUpdate.forEach(event => {
        if (event.affectedGenres.includes(trend.genreId)) {
          newPopularity += event.impact / 2; 
          newGrowthRate += event.impact / 10;
          console.log(`Global event '${event.name}' impacted ${trend.genreId}`);
        }
      });
      
      newPopularity = Math.max(5, Math.min(100, newPopularity)); 
      newGrowthRate = Math.max(-10, Math.min(10, newGrowthRate)); 

      if (newGrowthRate > 3) newTrendDirection = 'rising';
      else if (newGrowthRate < -3) newTrendDirection = 'falling';
      else if (newPopularity > 80 && newGrowthRate >= 0) newTrendDirection = 'stable'; 
      else if (newPopularity < 20 && newGrowthRate <= 0) newTrendDirection = 'fading';
      else if (newPopularity < 30 && newGrowthRate > 1) newTrendDirection = 'emerging';
      else newTrendDirection = 'stable';
      
      return {
        ...trend,
        popularity: Math.round(newPopularity),
        growthRate: parseFloat(newGrowthRate.toFixed(2)),
        trendDirection: newTrendDirection,
        lastUpdated: Date.now(),
        growth: Math.round(newGrowthRate * 10), 
      };
    });
    
    console.log('MarketService: Market trends updated.', currentMarketTrends);
    return [...currentMarketTrends];
  },

  getCurrentPopularity: (genreId: MusicGenre, subGenreId?: string): number => {
    let relevantTrend: MarketTrend | undefined;

    if (subGenreId) {
      relevantTrend = currentMarketTrends.find(
        trend => trend.genreId === genreId && trend.subGenreId === subGenreId
      );
    }
    if (!relevantTrend) {
      relevantTrend = currentMarketTrends.find(
        trend => trend.genreId === genreId && !trend.subGenreId 
      );
    }
    if (!relevantTrend) {
        const genericTrend = currentMarketTrends.find(trend => trend.genreId === genreId);
        return genericTrend?.popularity || 50; 
    }
    return relevantTrend.popularity;
  },

  getAllTrends: (): MarketTrend[] => {
    return [...currentMarketTrends]; 
  },

  getAllSubGenres: (): SubGenre[] => {
    return [...importedSubGenres]; // Use imported data
  },

  getSubGenreById: (subGenreId: string): SubGenre | undefined => {
    return getImportedSubGenreById(subGenreId); // Use imported function
  },
};
