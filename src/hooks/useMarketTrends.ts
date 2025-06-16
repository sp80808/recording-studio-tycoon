import { useState, useEffect, useCallback } from 'react';
import { marketService } from '@/services/marketService'; 
import { MusicGenre, MarketTrend, TrendDirection, TrendEvent, SubGenre } from '@/types/charts'; 
import { useGameState } from './useGameState'; // To get live game state
import { GameState, Project } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export interface UseMarketTrendsReturn {
  allTrends: MarketTrend[];
  getCurrentPopularity: (genre: MusicGenre, subGenreId?: string) => number;
  getTrendForGenre: (genre: MusicGenre, subGenreId?: string) => MarketTrend | undefined;
  triggerMarketUpdate: (playerProjects?: Project[], globalEvents?: TrendEvent[]) => void;
  isLoading: boolean;
  error: string | null;
}

export const useMarketTrends = (
  // This hook now relies on the global GameState provided by useGameState hook
  // and an updater function for that global state.
  // No need to pass initialGameState if useGameState provides the live one.
  updateGameState: (updater: (prevState: GameState) => GameState) => void
): UseMarketTrendsReturn => {
  const { gameState: liveGameState } = useGameState(); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive allTrends directly from the live game state
  const allTrends = liveGameState.marketTrends?.currentTrends || [];

  const triggerMarketUpdate = useCallback((
    playerProjectsCompletedSinceLastUpdate: Project[] = [],
    globalEventsHappenedSinceLastUpdate: TrendEvent[] = []
  ) => {
    setIsLoading(true);
    try {
      // marketService.updateAllMarketTrends updates its internal state and returns the new trends
      // This returned value should be used to update the global GameState
      const updatedTrendsFromService = marketService.updateAllMarketTrends(
        liveGameState, 
        playerProjectsCompletedSinceLastUpdate,
        globalEventsHappenedSinceLastUpdate
      );

      updateGameState(prev => ({
        ...prev,
        marketTrends: {
          ...(prev.marketTrends || { currentTrends: [], historicalTrends: [] }), 
          currentTrends: updatedTrendsFromService,
          // Note: Historical trends management might also need to be handled here or in marketService
        },
      }));
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update market trends';
      setError(errorMessage);
      toast({ title: "Market Update Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [liveGameState, updateGameState]);
  
  // Example: Periodic update trigger (could be tied to game day advancement in a central game loop)
  useEffect(() => {
    // This is a placeholder. In a real game loop, you'd call triggerMarketUpdate
    // based on game time progression (e.g., every 7 game days).
    // For instance, if a game day advances, a central manager could decide to call this.
    // Example: if (liveGameState.currentDay % 7 === 0 && liveGameState.currentDay !== 0) {
    //   console.log("useMarketTrends: Triggering weekly market update for day", liveGameState.currentDay);
    //   triggerMarketUpdate(); 
    // }
  }, [liveGameState.currentDay, triggerMarketUpdate]);


  const getCurrentPopularity = useCallback((genre: MusicGenre, subGenreId?: string) => {
    // This now uses the marketService which reads from its internal (potentially stale) state
    // or the liveGameState if marketService is refactored to take gameState.
    // For consistency, it's better if marketService's methods take gameState or if this hook
    // calculates based on its `allTrends` (derived from liveGameState).
    const trend = getTrendForGenre(genre, subGenreId);
    return trend?.popularity || 50; // Default if no specific trend found
  }, [allTrends]); // Changed dependency to allTrends

  const getTrendForGenre = useCallback((genre: MusicGenre, subGenreId?: string): MarketTrend | undefined => {
    let relevantTrend: MarketTrend | undefined;
    if (subGenreId) {
      relevantTrend = allTrends.find(t => t.genreId === genre && t.subGenreId === subGenreId);
    }
    if (!relevantTrend) {
      relevantTrend = allTrends.find(t => t.genreId === genre && !t.subGenreId);
    }
    return relevantTrend;
  }, [allTrends]);

  return {
    allTrends,
    getCurrentPopularity,
    getTrendForGenre,
    triggerMarketUpdate,
    isLoading,
    error,
  };
};
