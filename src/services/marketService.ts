import { GameState } from '@/types/game';
import { MarketTrend, SubGenre, MusicGenre, TrendDirection, TrendEvent } from '@/types/charts';
import { Project } from '@/types/game';
import { subGenres as importedSubGenres, getSubGenreById as getImportedSubGenreById } from '@/data/subGenreData';

let currentMarketTrends: MarketTrend[] = [];
const allSubGenres: ReadonlyArray<SubGenre> = [...importedSubGenres];

const initializeMockData = () => {
  if (currentMarketTrends.length === 0) {
    const genres: MusicGenre[] = ['pop', 'rock', 'hip-hop', 'electronic', 'country', 'jazz', 'r&b', 'folk', 'classical', 'alternative', 'acoustic'];
    const directions: TrendDirection[] = ['rising', 'stable', 'falling', 'emerging', 'fading'];
    
    genres.forEach((genre, index) => {
      const relevantSubGenre = allSubGenres.find(sg => sg.parentGenre === genre);
      const initialPopularity = Math.floor(Math.random() * 60) + 20; // 20-80
      const initialGrowthRate = Math.random() * 6 - 3; // -3% to +3%

      currentMarketTrends.push({
        id: `trend-${genre}-${Date.now()}-${index}`,
        genreId: genre,
        subGenreId: relevantSubGenre ? relevantSubGenre.id : undefined,
        popularity: initialPopularity,
        trendDirection: directions[Math.floor(Math.random() * directions.length)], // Initial direction can be random
        growthRate: parseFloat(initialGrowthRate.toFixed(2)),
        lastUpdated: Date.now(), // Consider using game days
        // Compatibility fields, can be derived or phased out
        growth: Math.round(initialGrowthRate * 10), 
        events: [],
        duration: 90, // Default duration for a trend phase
        startDay: 1, 
        projectedDuration: 90,
        seasonality: Array(12).fill(1.0), // Neutral seasonality
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
    console.log('MarketService: Updating all market trends for game day:', gameState.currentDay);
    
    const MAX_POPULARITY = 100;
    const MIN_POPULARITY = 5;
    const MAX_GROWTH_RATE = 7.5; // Max % change per update period
    const MIN_GROWTH_RATE = -7.5;

    currentMarketTrends = currentMarketTrends.map(trend => {
      let newPopularity = trend.popularity;
      let newGrowthRate = trend.growthRate;
      
      // 1. Apply current growth rate to popularity
      // Assuming this function is called, e.g., weekly (7 game days)
      // The growthRate is per update period.
      newPopularity += newGrowthRate;

      // 2. Adjust growth rate (inertia + small random fluctuation + regression to mean)
      // Random nudge
      newGrowthRate += (Math.random() * 1 - 0.5); // Smaller random change: -0.5 to +0.5
      // Regression towards 0 (trends don't grow/fall indefinitely without external factors)
      newGrowthRate *= 0.95; // Dampening factor

      // 3. Impact of player's successful releases
      playerProjectsCompletedSinceLastUpdate.forEach(project => {
        if (project.genre === trend.genreId && project.qualityScore && project.qualityScore > 70) {
          const qualityImpact = project.qualityScore / 100; // 0 to 1
          newPopularity += qualityImpact * 5; // Max +5 for a 100 quality score project
          newGrowthRate += qualityImpact * 0.5;  // Max +0.5 to growth rate
          console.log(`Player project '${project.title}' (Quality: ${project.qualityScore}) boosted ${trend.genreId}`);
        }
      });

      // 4. Impact of global events
      globalEventsHappenedSinceLastUpdate.forEach(event => {
        if (event.affectedGenres.includes(trend.genreId)) {
          // Apply event impact more directly to popularity and growth rate
          newPopularity += event.impact * 0.2; // Event impact spread (e.g. 20% of raw impact value)
          newGrowthRate += event.impact * 0.05; 
          console.log(`Global event '${event.name}' impacted ${trend.genreId}`);
        }
      });
      
      // 5. Clamp popularity and growthRate
      newPopularity = Math.max(MIN_POPULARITY, Math.min(MAX_POPULARITY, newPopularity));
      newGrowthRate = Math.max(MIN_GROWTH_RATE, Math.min(MAX_GROWTH_RATE, newGrowthRate));

      // 6. Determine new trendDirection based on current state
      let newTrendDirection: TrendDirection = 'stable';
      if (newGrowthRate > 1.5 && newPopularity < 90) newTrendDirection = 'rising';
      else if (newGrowthRate < -1.5 && newPopularity > 10) newTrendDirection = 'falling';
      else if (newPopularity < 25 && newGrowthRate > 0.5) newTrendDirection = 'emerging';
      else if (newPopularity < 15 && newGrowthRate <= 0) newTrendDirection = 'fading';
      else if (newPopularity >= 85) newTrendDirection = 'stable'; // Peaked
      
      return {
        ...trend,
        popularity: Math.round(newPopularity),
        growthRate: parseFloat(newGrowthRate.toFixed(2)),
        trendDirection: newTrendDirection,
        lastUpdated: gameState.currentDay, // Use game day
        growth: Math.round(newGrowthRate * 10), // For compatibility if needed
      };
    });
    
    // TODO: Logic for new trends emerging or old ones dying out completely.
    // TODO: Consider sub-genre specific evolution linked to parent genre.

    console.log('MarketService: Market trends updated.');
    return [...currentMarketTrends];
  },

  getCurrentPopularity: (genreId: MusicGenre, subGenreId?: string): number => {
    let relevantTrend: MarketTrend | undefined;
    if (subGenreId) {
      relevantTrend = currentMarketTrends.find(t => t.genreId === genreId && t.subGenreId === subGenreId);
    }
    if (!relevantTrend) {
      relevantTrend = currentMarketTrends.find(t => t.genreId === genreId && !t.subGenreId);
    }
    return relevantTrend?.popularity || 50; // Default popularity
  },

  getAllTrends: (): MarketTrend[] => {
    return [...currentMarketTrends]; 
  },

  getAllSubGenres: (): SubGenre[] => {
    return [...importedSubGenres];
  },

  getSubGenreById: (subGenreId: string): SubGenre | undefined => {
    return getImportedSubGenreById(subGenreId);
  },
};
