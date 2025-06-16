import { GenreId, SubGenreId } from './common.types';

export type TrendDirection = 'rising' | 'stable' | 'falling';

export interface MarketTrend {
  genreId: GenreId;
  subGenreId?: SubGenreId; // Optional for broader genre trends
  popularity: number; // 0-100
  trendDirection: TrendDirection;
  lastUpdated: number; // Game time of last update
}

export interface SubGenre {
  id: SubGenreId;
  name: string;
  mainGenreId: GenreId;
  description: string;
  // Potential for unique characteristics, e.g., specific instruments, lyrical themes
  // characteristics?: Record<string, any>; 
}

// Example Genre definition (assuming this exists elsewhere or can be expanded)
export interface Genre {
  id: GenreId;
  name: string;
  description: string;
  // subGenres?: SubGenreId[]; // Could link subgenres here
}

/**
 * MarketService: Manages the dynamic music market trends.
 */
export class MarketService {
  private marketTrends: Map<string, MarketTrend> = new Map(); // Key: genreId or genreId_subGenreId
  private genres: Map<GenreId, Genre> = new Map(); // Load from game data
  private subGenres: Map<SubGenreId, SubGenre> = new Map(); // Load from game data

  constructor(initialGenres: Genre[], initialSubGenres: SubGenre[]) {
    initialGenres.forEach(genre => this.genres.set(genre.id, genre));
    initialSubGenres.forEach(subGenre => this.subGenres.set(subGenre.id, subGenre));
    this.initializeMarketTrends();
  }

  private initializeMarketTrends(): void {
    // Initialize trends for all genres and subgenres
    // For simplicity, let's assume some initial random values
    this.genres.forEach(genre => {
      this.getOrCreateTrend(genre.id);
    });
    this.subGenres.forEach(subGenre => {
      this.getOrCreateTrend(subGenre.mainGenreId, subGenre.id);
    });
  }

  private getTrendKey(genreId: GenreId, subGenreId?: SubGenreId): string {
    return subGenreId ? `${genreId}_${subGenreId}` : genreId;
  }

  private getOrCreateTrend(genreId: GenreId, subGenreId?: SubGenreId): MarketTrend {
    const key = this.getTrendKey(genreId, subGenreId);
    if (!this.marketTrends.has(key)) {
      this.marketTrends.set(key, {
        genreId,
        subGenreId,
        popularity: Math.floor(Math.random() * 70) + 15, // Initial popularity 15-85
        trendDirection: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)] as TrendDirection,
        lastUpdated: 0, // Assuming game time starts at 0
      });
    }
    return this.marketTrends.get(key)!;
  }

  /**
   * Updates market trends based on various factors.
   * This would be called periodically by the game loop.
   * @param currentTime - Current game time.
   * @param successfulReleases - Array of recent successful player releases.
   * @param globalEvents - Array of active global events affecting trends.
   */
  updateMarketTrends(
    currentTime: number,
    // Assuming a simplified structure for successful releases and global events
    successfulReleases?: Array<{ genreId: GenreId; subGenreId?: SubGenreId; impact: number }>,
    globalEvents?: Array<{ type: 'genre_boost' | 'genre_nerf'; genreId: GenreId; subGenreId?: SubGenreId; effect: number }>
  ): void {
    this.marketTrends.forEach(trend => {
      let popularityChange = 0;

      // 1. Time-based decay/growth (natural market fluctuation)
      if (trend.trendDirection === 'rising') {
        popularityChange += Math.random() * 2;
      } else if (trend.trendDirection === 'falling') {
        popularityChange -= Math.random() * 2;
      }
      // Small random fluctuation
      popularityChange += (Math.random() - 0.5) * 1; 

      // 2. Impact of successful player releases
      successfulReleases?.forEach(release => {
        if (release.genreId === trend.genreId && release.subGenreId === trend.subGenreId) {
          popularityChange += release.impact; // e.g., impact based on chart success
        }
      });

      // 3. Impact of global random events
      globalEvents?.forEach(event => {
        if (event.genreId === trend.genreId && event.subGenreId === trend.subGenreId) {
          popularityChange += event.effect;
        }
      });

      trend.popularity = Math.max(0, Math.min(100, trend.popularity + popularityChange));
      trend.lastUpdated = currentTime;

      // 4. Update trend direction (simplified logic)
      if (popularityChange > 1.5 && trend.popularity < 90) {
        trend.trendDirection = 'rising';
      } else if (popularityChange < -1.5 && trend.popularity > 10) {
        trend.trendDirection = 'falling';
      } else if (Math.abs(popularityChange) <= 0.5 || trend.popularity >= 90 || trend.popularity <= 10) {
        trend.trendDirection = 'stable';
      }
    });
  }

  /**
   * Gets the current popularity for a specific genre/subgenre.
   */
  getPopularity(genreId: GenreId, subGenreId?: SubGenreId): number {
    const trend = this.marketTrends.get(this.getTrendKey(genreId, subGenreId));
    return trend ? trend.popularity : 0;
  }

  /**
   * Gets the full market trend details for a specific genre/subgenre.
   */
  getMarketTrend(genreId: GenreId, subGenreId?: SubGenreId): MarketTrend | undefined {
    return this.marketTrends.get(this.getTrendKey(genreId, subGenreId));
  }

  /**
   * Gets all current market trends.
   */
  getAllMarketTrends(): MarketTrend[] {
    return Array.from(this.marketTrends.values());
  }
}

/*
Integration with Projects & Charts:

1. OriginalMusicProject Appeal/ChartScore:
   - When calculating Appeal or ChartScore for an OriginalMusicProject:
     const marketPop = marketService.getPopularity(project.genreId, project.subGenreId);
     // Apply a multiplier based on marketPop. E.g., very popular (80+) = 1.2x, unpopular ( <20) = 0.8x
     const popularityFactor = 1 + (marketPop - 50) / 100; // Simple linear factor from 0.5 to 1.5
     finalAppeal = baseAppeal * popularityFactor;
     finalChartScore = baseChartScore * popularityFactor;

2. ContractProject Value:
   - When ContractGenerationService generates contracts:
     const marketPop = marketService.getPopularity(contractDetails.genreId, contractDetails.subGenreId);
     const popularityFactor = 1 + (marketPop - 50) / 200; // Less aggressive factor for contract values
     contractValue = baseContractValue * popularityFactor;
     // Higher popularity might also increase the chance of 'premium' contracts.
*/

/*
UI Feedback (Conceptual) - useMarketTrends Hook:

// src/hooks/useMarketTrends.ts
import { useState, useEffect } from 'react';
import { marketServiceInstance } from '../services'; // Assuming a singleton instance
import { MarketTrend } from '../game-mechanics/market-trends';

export function useMarketTrends() {
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = () => {
      setLoading(true);
      // In a real game, this might subscribe to updates from MarketService
      // or re-fetch periodically if MarketService doesn't push updates.
      setTrends(marketServiceInstance.getAllMarketTrends());
      setLoading(false);
    };

    fetchTrends();
    // Potentially set up a listener or interval for updates
    // const intervalId = setInterval(fetchTrends, 60000); // Update every minute
    // return () => clearInterval(intervalId);
  }, []);

  return { trends, loading };
}

// Example MusicIndustryReport component:
// src/components/MusicIndustryReport.tsx
import React from 'react';
import { useMarketTrends } from '../hooks/useMarketTrends';

export function MusicIndustryReport() {
  const { trends, loading } = useMarketTrends();

  if (loading) return <p>Loading market data...</p>;

  return (
    <div>
      <h2>Music Industry Report</h2>
      <ul>
        {trends.map(trend => (
          <li key={trend.genreId + (trend.subGenreId || '')}>
            Genre: {trend.genreId} {trend.subGenreId ? `(${trend.subGenreId})` : ''} -
            Popularity: {trend.popularity.toFixed(1)}% -
            Trend: {trend.trendDirection}
          </li>
        ))}
      </ul>
    </div>
  );
}
*/
