// React Hook for Market Trends System
import { useState, useEffect, useCallback } from 'react';
import { marketService } from '../services/marketService';
import {
  MarketTrendEnhanced,
  MarketAnalysis,
  PlayerMarketImpact
} from '../types/marketTrends';
import { MusicGenre, MarketTrend as GlobalMarketTrend, TrendDirection, TrendEvent } from '../types/charts';
import { useGameState } from './useGameState';
import { GameState } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export interface UseMarketTrendsReturn {
  // Current market state
  allTrends: MarketTrendEnhanced[];
  marketAnalysis: MarketAnalysis | null;
  playerImpact: PlayerMarketImpact;

  // Utility functions
  getCurrentPopularity: (genre: MusicGenre, subGenre?: string) => number;
  getTrendDirection: (genre: MusicGenre, subGenre?: string) => string;
  getMarketInfluence: (genre: MusicGenre) => number;
  getContractValueModifier: (genre: MusicGenre, subGenre?: string) => number;
  getGenrePopularity: (genre: string) => number; // Added
  getActiveTrends: () => GlobalMarketTrend[]; // Added
  getHistoricalTrends: () => GlobalMarketTrend[]; // Added

  // Actions
  updateTrends: () => void;
  recordPlayerSuccess: (projectId: string, chartSuccess: number) => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

// This local MarketTrendsState should use the global MarketTrend type
export interface MarketTrendsState {
  currentTrends: GlobalMarketTrend[];
  historicalTrends: GlobalMarketTrend[];
}

export const useMarketTrends = (
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
): UseMarketTrendsReturn => {
  const { gameState: gameStateContext } = useGameState();
  const [allTrends, setAllTrends] = useState<MarketTrendEnhanced[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [playerImpact, setPlayerImpact] = useState<PlayerMarketImpact>({
    successfulReleases: [],
    marketInfluence: 0,
    trendSetting: [],
    genreReputation: {} as Record<MusicGenre, number>
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    try {
      setIsLoading(true);
      setAllTrends(marketService.getAllTrends());
      setMarketAnalysis(marketService.generateMarketAnalysis());
      setPlayerImpact(marketService.getPlayerImpact());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market trends');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update trends based on game week progression (using player level as proxy)
  useEffect(() => {
    if (gameStateContext?.playerData?.level) {
      updateTrends();
    }
  }, [gameStateContext?.playerData?.level]);

  const getCurrentPopularity = useCallback((genre: MusicGenre, subGenre?: string) => {
    return marketService.getCurrentPopularity(genre, subGenre as Parameters<typeof marketService.getCurrentPopularity>[1]);
  }, []);

  const getTrendDirection = useCallback((genre: MusicGenre, subGenre?: string) => {
    return marketService.getTrendDirection(genre, subGenre as Parameters<typeof marketService.getTrendDirection>[1]);
  }, []);

  const getMarketInfluence = useCallback((genre: MusicGenre) => {
    // This seems like a placeholder, ensure marketService.calculateMarketInfluence is robust
    const mockProject = { genre, id: 'temp', title: 'Mock', clientType: 'Original', difficulty: 1, durationDaysTotal: 30, payoutBase: 1000, repGainBase: 10, requiredSkills: {}, stages: [], matchRating: 'Good', accumulatedCPoints: 0, accumulatedTPoints: 0, currentStageIndex: 0, completedStages: [], workSessionCount: 0 } as const;
    return marketService.calculateMarketInfluence(mockProject as any); // Cast as any if mockProject doesn't fully match Project type
  }, []);

  const getContractValueModifier = useCallback((genre: MusicGenre, subGenre?: string) => {
    return marketService.calculateContractValueModifier(genre, subGenre as Parameters<typeof marketService.calculateContractValueModifier>[1]);
  }, []);

  const updateTrends = useCallback(() => {
    try {
      setIsLoading(true);
      const currentWeek = gameStateContext?.playerData?.level || 1; // Use level as proxy for week
      marketService.updateMarketTrends(currentWeek);
      setAllTrends(marketService.getAllTrends());
      setMarketAnalysis(marketService.generateMarketAnalysis());
      setPlayerImpact(marketService.getPlayerImpact());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update market trends');
    } finally {
      setIsLoading(false);
    }
  }, [gameStateContext?.playerData?.level]);

  const recordPlayerSuccess = useCallback((projectId: string, chartSuccess: number) => {
    try {
      // Assuming gameStateContext.completedProjects exists and is an array of Project
      const project = gameStateContext?.completedProjects?.find(p => p.id === projectId);
      if (project) {
        marketService.recordPlayerSuccess(project, chartSuccess);
        setPlayerImpact(marketService.getPlayerImpact());
        setAllTrends(marketService.getAllTrends());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record player success');
    }
  }, [gameStateContext?.completedProjects]);

  const generateNewTrend = useCallback((): GlobalMarketTrend => {
    const genres: MusicGenre[] = ['rock', 'pop', 'hip-hop', 'electronic', 'jazz', 'classical', 'country', 'r&b'];
    const randomGenre = genres[Math.floor(Math.random() * genres.length)];
    const popularity = Math.floor(Math.random() * 50) + 50; // 50-100
    const duration = Math.floor(Math.random() * 10) + 5; // 5-15 days
    const trendDirections: TrendDirection[] = ['rising', 'stable', 'falling', 'emerging', 'fading'];

    const newTrend: GlobalMarketTrend = {
      id: `trend_${Date.now()}`,
      genreId: randomGenre,
      popularity,
      duration,
      startDay: gameStateContext.currentDay,
      trendDirection: trendDirections[Math.floor(Math.random() * trendDirections.length)],
      growthRate: Math.random() * 10 - 5, 
      lastUpdated: Date.now(),
      subGenreId: undefined,
      seasonality: undefined,
      peakMonths: undefined,
      activeEvents: undefined,
      projectedDuration: duration,
      growth: Math.random() * 100 - 50, 
      events: [] as TrendEvent[],
    };
    return newTrend;
  }, [gameStateContext.currentDay]);

  const updateTrendsDaily = useCallback(() => {
    setGameState(prev => {
      const activeCurrentTrends = prev.marketTrends.currentTrends.filter(trend =>
        trend.startDay + trend.duration > prev.currentDay
      );

      let newCurrentTrends = [...activeCurrentTrends];
      if (newCurrentTrends.length < 2 && Math.random() < 0.3) {
        newCurrentTrends.push(generateNewTrend());
      }

      const newlyExpiredTrends = prev.marketTrends.currentTrends.filter(trend =>
        trend.startDay + trend.duration <= prev.currentDay
      );

      const newHistoricalTrends = [
        ...prev.marketTrends.historicalTrends,
        ...newlyExpiredTrends
      ];

      return {
        ...prev,
        marketTrends: {
          currentTrends: newCurrentTrends,
          historicalTrends: newHistoricalTrends
        }
      };
    });
  }, [setGameState, generateNewTrend]);

  useEffect(() => {
    updateTrendsDaily();
  }, [gameStateContext.currentDay, updateTrendsDaily]);

  const getGenrePopularity = useCallback((genre: string) => {
    const trend = gameStateContext.marketTrends.currentTrends.find(t => t.genreId === genre);
    return trend ? trend.popularity : 50;
  }, [gameStateContext.marketTrends.currentTrends]);

  const getActiveTrends = useCallback(() => {
    return gameStateContext.marketTrends.currentTrends;
  }, [gameStateContext.marketTrends.currentTrends]);

  const getHistoricalTrends = useCallback(() => {
    return gameStateContext.marketTrends.historicalTrends;
  }, [gameStateContext.marketTrends.historicalTrends]);

  return {
    allTrends,
    marketAnalysis,
    playerImpact,
    getCurrentPopularity,
    getTrendDirection,
    getMarketInfluence,
    getContractValueModifier,
    updateTrends,
    recordPlayerSuccess,
    isLoading,
    error,
    getGenrePopularity, 
    getActiveTrends, 
    getHistoricalTrends 
  };
};
