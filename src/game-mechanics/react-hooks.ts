// React Hooks for Game Mechanics Integration
// These hooks provide easy access to game mechanics services and state

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MarketTrend,
  StaffMemberWellbeing,
  StudioPerk,
  AdvancedContract,
  RandomEvent,
  Client,
  RecordLabel,
  ContractNegotiationPoint,
  StaffId,
  EntityId,
  ProjectId,
  GenreId,
  MarketService,
  RelationshipService,
  StudioUpgradeService,
  StaffWellbeingService,
  AdvancedContractService,
  RandomEventService
} from './index';

// Assuming singleton service instances are available
// In a real implementation, these would be provided via Context or dependency injection
declare const gameServices: {
  marketService: MarketService;
  relationshipService: RelationshipService;
  studioUpgradeService: StudioUpgradeService;
  staffWellbeingService: StaffWellbeingService;
  advancedContractService: AdvancedContractService;
  randomEventService: RandomEventService;
};

// Hook for Market Trends
export function useMarketTrends(autoRefresh = true) {
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allTrends = gameServices.marketService.getAllMarketTrends();
      setTrends(allTrends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market trends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTrends();
    
    if (autoRefresh) {
      const interval = setInterval(refreshTrends, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [refreshTrends, autoRefresh]);

  const getGenrePopularity = useCallback((genreId: GenreId, subGenreId?: string) => {
    return gameServices.marketService.getPopularity(genreId, subGenreId);
  }, []);

  const getTrendingGenres = useMemo(() => {
    return trends
      .filter(t => t.trendDirection === 'rising' && t.popularity > 60)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }, [trends]);

  return {
    trends,
    loading,
    error,
    refreshTrends,
    getGenrePopularity,
    trendingGenres: getTrendingGenres
  };
}

// Hook for Staff Wellbeing
export function useStaffWellbeing(staffId?: StaffId) {
  const [wellbeingData, setWellbeingData] = useState<StaffMemberWellbeing | StaffMemberWellbeing[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWellbeing = useCallback(() => {
    setLoading(true);
    try {
      if (staffId) {
        const data = gameServices.staffWellbeingService.getStaffWellbeing(staffId);
        setWellbeingData(data || null);
      } else {
        const allData = gameServices.staffWellbeingService.getAllStaffWellbeing();
        setWellbeingData(allData);
      }
    } catch (error) {
      console.error('Failed to load staff wellbeing data:', error);
      setWellbeingData(null);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    refreshWellbeing();
    // Could subscribe to wellbeing service events here
  }, [refreshWellbeing]);

  const getStaffMoodSummary = useMemo(() => {
    if (!wellbeingData || Array.isArray(wellbeingData)) {
      const allStaff = wellbeingData as StaffMemberWellbeing[] || [];
      const moodCounts = allStaff.reduce((acc, staff) => {
        acc[staff.currentMood] = (acc[staff.currentMood] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const averageMood = allStaff.length > 0 
        ? allStaff.reduce((sum, staff) => sum + staff.moodScore, 0) / allStaff.length 
        : 0;
      
      const highBurnoutCount = allStaff.filter(staff => staff.burnoutLevel > 70).length;
      
      return { moodCounts, averageMood, highBurnoutCount, totalStaff: allStaff.length };
    }
    return null;
  }, [wellbeingData]);

  return {
    wellbeingData,
    loading,
    refreshWellbeing,
    staffMoodSummary: getStaffMoodSummary
  };
}

// Hook for Studio Perks
export function useStudioPerks() {
  const [allPerks, setAllPerks] = useState<StudioPerk[]>([]);
  const [unlockedPerks, setUnlockedPerks] = useState<StudioPerk[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPerks = useCallback(() => {
    setLoading(true);
    try {
      const all = gameServices.studioUpgradeService.getAllPerks();
      const unlocked = gameServices.studioUpgradeService.getActivePerks();
      setAllPerks(all);
      setUnlockedPerks(unlocked);
    } catch (error) {
      console.error('Failed to load studio perks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPerks();
  }, [refreshPerks]);

  const attemptUnlockPerk = useCallback(async (perkId: string): Promise<boolean> => {
    try {
      // In a real implementation, this would get current game state
      const gameState: any = {}; // getCurrentGameState();
      const success = gameServices.studioUpgradeService.unlockPerk(perkId, gameState);
      if (success) {
        refreshPerks();
      }
      return success;
    } catch (error) {
      console.error('Failed to unlock perk:', error);
      return false;
    }
  }, [refreshPerks]);

  const getUnlockablePerks = useMemo(() => {
    // In a real implementation, this would check unlock conditions against current game state
    return allPerks.filter(perk => !perk.isUnlocked /* && canUnlockPerk(perk) */);
  }, [allPerks]);

  const getPerksByCategory = useMemo(() => {
    return allPerks.reduce((acc, perk) => {
      if (!acc[perk.category]) {
        acc[perk.category] = [];
      }
      acc[perk.category].push(perk);
      return acc;
    }, {} as Record<string, StudioPerk[]>);
  }, [allPerks]);

  return {
    allPerks,
    unlockedPerks,
    loading,
    refreshPerks,
    attemptUnlockPerk,
    unlockablePerks: getUnlockablePerks,
    perksByCategory: getPerksByCategory
  };
}

// Hook for Relationship Management
export function useRelationships() {
  const [clients, setClients] = useState<Client[]>([]);
  const [labels, setLabels] = useState<RecordLabel[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRelationships = useCallback(() => {
    setLoading(true);
    try {
      // In a real implementation, these would be proper service methods
      // const clientData = gameServices.relationshipService.getAllClients();
      // const labelData = gameServices.relationshipService.getAllLabels();
      // setClients(clientData);
      // setLabels(labelData);
    } catch (error) {
      console.error('Failed to load relationship data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRelationships();
  }, [refreshRelationships]);

  const getRelationshipScore = useCallback((entityId: EntityId): number | undefined => {
    return gameServices.relationshipService.getRelationshipScore(entityId);
  }, []);

  const getRelationshipSummary = useMemo(() => {
    const allEntities = [...clients, ...labels];
    const highRelationships = allEntities.filter(e => e.relationshipScore >= 70).length;
    const lowRelationships = allEntities.filter(e => e.relationshipScore <= 30).length;
    const blacklisted = allEntities.filter(e => e.isBlacklisted).length;
    const averageScore = allEntities.length > 0 
      ? allEntities.reduce((sum, e) => sum + e.relationshipScore, 0) / allEntities.length 
      : 0;

    return {
      total: allEntities.length,
      highRelationships,
      lowRelationships,
      blacklisted,
      averageScore
    };
  }, [clients, labels]);

  return {
    clients,
    labels,
    loading,
    refreshRelationships,
    getRelationshipScore,
    relationshipSummary: getRelationshipSummary
  };
}

// Hook for Advanced Contracts
export function useAdvancedContracts() {
  const [availableContracts, setAvailableContracts] = useState<AdvancedContract[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshContracts = useCallback(() => {
    setLoading(true);
    try {
      const contracts = gameServices.advancedContractService.getAvailableContracts();
      setAvailableContracts(contracts);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshContracts();
  }, [refreshContracts]);

  const negotiateContract = useCallback(async (
    contractId: ProjectId, 
    offers: Array<{ point: ContractNegotiationPoint; value: number }>
  ) => {
    try {
      const result = gameServices.advancedContractService.negotiateContract(contractId, offers);
      refreshContracts(); // Refresh to show updated contract state
      return result;
    } catch (error) {
      console.error('Contract negotiation failed:', error);
      return { status: 'rejected', message: 'Negotiation failed due to error' };
    }
  }, [refreshContracts]);

  const acceptContract = useCallback(async (contractId: ProjectId): Promise<boolean> => {
    try {
      const success = gameServices.advancedContractService.acceptContract(contractId);
      if (success) {
        refreshContracts();
      }
      return success;
    } catch (error) {
      console.error('Failed to accept contract:', error);
      return false;
    }
  }, [refreshContracts]);

  const getContractsByType = useMemo(() => {
    return availableContracts.reduce((acc, contract) => {
      if (!acc[contract.type]) {
        acc[contract.type] = [];
      }
      acc[contract.type].push(contract);
      return acc;
    }, {} as Record<string, AdvancedContract[]>);
  }, [availableContracts]);

  const getHighValueContracts = useMemo(() => {
    return availableContracts
      .filter(contract => {
        const budgetTerm = contract.negotiationPoints.find(p => p.point === ContractNegotiationPoint.BUDGET);
        return budgetTerm && budgetTerm.clientValue > 50000;
      })
      .sort((a, b) => {
        const aBudget = a.negotiationPoints.find(p => p.point === ContractNegotiationPoint.BUDGET)?.clientValue || 0;
        const bBudget = b.negotiationPoints.find(p => p.point === ContractNegotiationPoint.BUDGET)?.clientValue || 0;
        return bBudget - aBudget;
      });
  }, [availableContracts]);

  return {
    availableContracts,
    loading,
    refreshContracts,
    negotiateContract,
    acceptContract,
    contractsByType: getContractsByType,
    highValueContracts: getHighValueContracts
  };
}

// Hook for Random Events
export function useRandomEvents() {
  const [activeEvents, setActiveEvents] = useState<RandomEvent[]>([]);
  const [eventHistory, setEventHistory] = useState<Array<{ eventId: string; date: number; playerChoice?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const refreshEvents = useCallback(() => {
    setLoading(true);
    try {
      const active = gameServices.randomEventService.getActiveEvents();
      const history = gameServices.randomEventService.getEventHistory();
      setActiveEvents(active);
      setEventHistory(history);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEvents();
    // Could set up real-time event listeners here
  }, [refreshEvents]);

  const makeEventChoice = useCallback(async (eventId: string, choiceId: string): Promise<boolean> => {
    try {
      const currentTime = Date.now(); // In a real implementation, this would be game time
      const success = gameServices.randomEventService.makeEventChoice(eventId, choiceId, currentTime);
      if (success) {
        refreshEvents();
      }
      return success;
    } catch (error) {
      console.error('Failed to make event choice:', error);
      return false;
    }
  }, [refreshEvents]);

  const getRecentEvents = useMemo(() => {
    return eventHistory
      .sort((a, b) => b.date - a.date)
      .slice(0, 10); // Get 10 most recent events
  }, [eventHistory]);

  const getEventsRequiringChoice = useMemo(() => {
    return activeEvents.filter(event => event.playerChoices && event.playerChoices.length > 0);
  }, [activeEvents]);

  return {
    activeEvents,
    eventHistory,
    loading,
    refreshEvents,
    makeEventChoice,
    recentEvents: getRecentEvents,
    eventsRequiringChoice: getEventsRequiringChoice
  };
}

// Composite hook for dashboard overview
export function useGameDashboard() {
  const { trends, trendingGenres } = useMarketTrends();
  const { staffMoodSummary } = useStaffWellbeing();
  const { relationshipSummary } = useRelationships();
  const { unlockedPerks } = useStudioPerks();
  const { availableContracts, highValueContracts } = useAdvancedContracts();
  const { activeEvents, eventsRequiringChoice } = useRandomEvents();

  const dashboardSummary = useMemo(() => ({
    marketTrends: {
      totalTrends: trends.length,
      trendingGenres: trendingGenres.slice(0, 3)
    },
    staffStatus: {
      totalStaff: staffMoodSummary?.totalStaff || 0,
      averageMood: staffMoodSummary?.averageMood || 0,
      burnoutRisk: staffMoodSummary?.highBurnoutCount || 0
    },
    relationships: {
      averageScore: relationshipSummary.averageScore,
      highRelationships: relationshipSummary.highRelationships,
      warnings: relationshipSummary.blacklisted + relationshipSummary.lowRelationships
    },
    studio: {
      activePerks: unlockedPerks.length,
      totalPerks: unlockedPerks.length // This would be total available in real implementation
    },
    contracts: {
      available: availableContracts.length,
      highValue: highValueContracts.length
    },
    events: {
      active: activeEvents.length,
      requiresAttention: eventsRequiringChoice.length
    }
  }), [
    trends.length, 
    trendingGenres, 
    staffMoodSummary, 
    relationshipSummary, 
    unlockedPerks.length, 
    availableContracts.length, 
    highValueContracts.length, 
    activeEvents.length, 
    eventsRequiringChoice.length
  ]);

  return dashboardSummary;
}

// Utility hook for notifications and alerts
export function useGameNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: number;
    acknowledged: boolean;
  }>>([]);

  // This would typically be populated by game events
  const addNotification = useCallback((
    type: 'info' | 'warning' | 'error' | 'success',
    title: string,
    message: string
  ) => {
    const notification = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
      timestamp: Date.now(),
      acknowledged: false
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep only 50 most recent
  }, []);

  const acknowledgeNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, acknowledged: true } : n)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unacknowledgedCount = useMemo(() => {
    return notifications.filter(n => !n.acknowledged).length;
  }, [notifications]);

  return {
    notifications,
    addNotification,
    acknowledgeNotification,
    clearAllNotifications,
    unacknowledgedCount
  };
}
