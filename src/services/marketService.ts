import { GameState } from '@/types/game';
import { MarketTrend, SubGenre, MusicGenre, TrendDirection, TrendEvent } from '@/types/charts';
import { Project } from '@/types/game';
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import { subGenres as importedSubGenres, getSubGenreById as getImportedSubGenreById } from '@/data/subGenreData';

// In-memory store for market trends
let currentMarketTrends: MarketTrend[] = [];
// Use subgenres from the dedicated data file
const allSubGenres: ReadonlyArray<SubGenre> = [...importedSubGenres];

// Helper to initialize some basic trends if needed for development
const initializeMockData = (roll: RandomSource = createSeededRandom('market:initial')) => {
  // allSubGenres is already initialized from the import.
  // We only need to initialize currentMarketTrends if empty.
  if (currentMarketTrends.length === 0) {
    const genres: MusicGenre[] = ['pop', 'rock', 'hip-hop', 'electronic', 'country', 'jazz'];
    const directions: TrendDirection[] = ['rising', 'stable', 'falling', 'emerging'];
    
    genres.forEach((genre, index) => {
      // Try to find a subgenre for this main genre from our imported list
      const relevantSubGenre = allSubGenres.find(sg => sg.parentGenre === genre);

      currentMarketTrends.push({
        id: `trend-${genre}-${index}`,
        genreId: genre,
        subGenreId: relevantSubGenre ? relevantSubGenre.id : undefined,
        popularity: randomInt(roll, 30, 99),
        trendDirection: directions[randomInt(roll, 0, directions.length - 1)],
        growthRate: roll() * 10 - 5,
        lastUpdated: 0,
        growth: roll() * 100 - 50,
        events: [],
        duration: 30, 
        startDay: 1, 
      });
    });
  }
};

initializeMockData(); 

/** Reset the store to the seeded starting trends (new game / tests). */
export const resetMarketTrends = (seed: string | number = 'initial'): void => {
  currentMarketTrends = [];
  initializeMockData(createSeededRandom(`market:${seed}`));
};

const MAX_REPLAY_DAYS = 3650;

/**
 * The market on a given day of a given save, derived (never stored): replay the seeded updates from the
 * seeded start. Same seed and day always give the same trends, and the shared store is left untouched.
 */
export const marketTrendsAt = (seed: string | number, day: number): MarketTrend[] => {
  const saved = currentMarketTrends;
  try {
    resetMarketTrends(seed);
    let trends = [...currentMarketTrends];
    for (let d = 1; d <= Math.min(MAX_REPLAY_DAYS, Math.max(0, Math.floor(day))); d++) {
      trends = marketService.updateAllMarketTrends({ saveSeed: seed, currentDay: d } as GameState);
    }
    return trends;
  } finally {
    currentMarketTrends = saved;
  }
};

export const marketService = {
  updateAllMarketTrends: (
    gameState: GameState,
    playerProjectsCompletedSinceLastUpdate: (Project & { qualityScore?: number })[] = [],
    globalEventsHappenedSinceLastUpdate: TrendEvent[] = []
  ): MarketTrend[] => {
    // Deterministic: the swing comes from the save seed and the in-game day, never from the wall clock.
    const roll = createSeededRandom(`${gameState.saveSeed ?? 'market'}:market:${gameState.currentDay}`);
    currentMarketTrends = currentMarketTrends.map(trend => {
      let newPopularity = trend.popularity;
      let newGrowthRate = trend.growthRate;
      let newTrendDirection = trend.trendDirection;

      newPopularity += trend.growthRate * (roll() * 0.5 + 0.75); 
      newGrowthRate += (roll() * 2 - 1) * 0.5; 

      playerProjectsCompletedSinceLastUpdate.forEach(project => {
        if (project.genre === trend.genreId && project.qualityScore && project.qualityScore > 70) {
          newPopularity += project.qualityScore / 20; 
          newGrowthRate += project.qualityScore / 100;  
        }
      });

      globalEventsHappenedSinceLastUpdate.forEach(event => {
        if (event.affectedGenres.includes(trend.genreId)) {
          newPopularity += event.impact / 2; 
          newGrowthRate += event.impact / 10;
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
        lastUpdated: gameState.currentDay,
        growth: Math.round(newGrowthRate * 10), 
      };
    });
    
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
    return [...importedSubGenres];
  },

  getSubGenreById: (subGenreId: string): SubGenre | undefined => {
    return getImportedSubGenreById(subGenreId);
  },
};
