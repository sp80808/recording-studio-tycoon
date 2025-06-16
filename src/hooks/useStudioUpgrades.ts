// React Hook for Studio Perks & Specializations System
import { useState, useEffect, useCallback } from 'react';
import { studioUpgradeService } from '../services/studioUpgradeService';
import { 
  StudioPerk, 
  PerkTree, 
  StudioSpecialization, 
  StudioUpgradeState,
  IndustryPrestige,
  PerkEffects,
  StudioMilestone
} from '../types/studioPerks';
import { useGameState } from './useGameState';

export interface UseStudioUpgradesReturn {
  // Current upgrade state
  perkTrees: PerkTree[];
  upgradeState: StudioUpgradeState;
  industryPrestige: IndustryPrestige;
  currentSpecialization: StudioSpecialization | null;
  
  // Perk management
  availablePerkPoints: number;
  unlockedPerks: string[];
  canUnlockPerk: (perkId: string) => boolean;
  unlockPerk: (perkId: string) => boolean;
  getPerkById: (perkId: string) => StudioPerk | null;
  
  // Bonuses and effects
  totalBonuses: PerkEffects;
  getGenreBonus: (genre: string) => number;
  getQualityBonus: () => number;
  getSpeedBonus: () => number;
  getStaffHappinessBonus: () => number;
  
  // Specializations
  availableSpecializations: StudioSpecialization[];
  canSpecialize: (specializationId: string) => boolean;
  activateSpecialization: (specializationId: string) => boolean;
  
  // Milestones and achievements
  completedMilestones: StudioMilestone[];
  availableMilestones: StudioMilestone[];
  checkMilestoneProgress: (milestoneId: string) => number;
  
  // Industry prestige
  prestigeLevel: number;
  prestigeTier: string;
  prestigeBenefits: any;
  
  // Actions
  awardPerkPoints: (amount: number, reason: string) => void;
  processProjectCompletion: (projectId: string, quality: number) => void;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export const useStudioUpgrades = (): UseStudioUpgradesReturn => {
  const { gameState } = useGameState();
  const [perkTrees, setPerkTrees] = useState<PerkTree[]>([]);
  const [upgradeState, setUpgradeState] = useState<StudioUpgradeState | null>(null);
  const [industryPrestige, setIndustryPrestige] = useState<IndustryPrestige | null>(null);
  const [currentSpecialization, setCurrentSpecialization] = useState<StudioSpecialization | null>(null);
  const [totalBonuses, setTotalBonuses] = useState<PerkEffects | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    try {
      setIsLoading(true);
      setPerkTrees(studioUpgradeService.getPerkTrees());
      setUpgradeState(studioUpgradeService.getUpgradeState());
      setIndustryPrestige(studioUpgradeService.getIndustryPrestige());
      setCurrentSpecialization(studioUpgradeService.getCurrentSpecialization());
      setTotalBonuses(studioUpgradeService.calculateTotalBonuses());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load studio upgrade data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update when game state changes
  useEffect(() => {
    if (gameState?.playerData?.level) {
      try {
        setUpgradeState(studioUpgradeService.getUpgradeState());
        setIndustryPrestige(studioUpgradeService.getIndustryPrestige());
        setTotalBonuses(studioUpgradeService.calculateTotalBonuses());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update studio upgrades');
      }
    }
  }, [gameState?.playerData?.level]);

  const canUnlockPerk = useCallback((perkId: string): boolean => {
    if (!gameState) return false;
    return studioUpgradeService.canUnlockPerk(perkId, gameState);
  }, [gameState]);

  const unlockPerk = useCallback((perkId: string): boolean => {
    if (!gameState) return false;
    
    try {
      const success = studioUpgradeService.unlockPerk(perkId, gameState);
      if (success) {
        // Update local state
        setUpgradeState(studioUpgradeService.getUpgradeState());
        setTotalBonuses(studioUpgradeService.calculateTotalBonuses());
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock perk');
      return false;
    }
  }, [gameState]);

  const getPerkById = useCallback((perkId: string): StudioPerk | null => {
    for (const tree of perkTrees) {
      for (const tier of tree.tiers) {
        const perk = tier.perks.find(p => p.id === perkId);
        if (perk) return perk;
      }
    }
    return null;
  }, [perkTrees]);

  const getGenreBonus = useCallback((genre: string): number => {
    if (!totalBonuses?.genreSpecificBonuses) return 0;
    const bonus = totalBonuses.genreSpecificBonuses.get(genre);
    return bonus?.qualityBonus || 0;
  }, [totalBonuses]);

  const getQualityBonus = useCallback((): number => {
    return totalBonuses?.projectQualityBonus || 0;
  }, [totalBonuses]);

  const getSpeedBonus = useCallback((): number => {
    return totalBonuses?.projectSpeedBonus || 0;
  }, [totalBonuses]);

  const getStaffHappinessBonus = useCallback((): number => {
    return totalBonuses?.staffHappiness || 0;
  }, [totalBonuses]);

  const availableSpecializations = useCallback((): StudioSpecialization[] => {
    // This would be implemented to return specializations the player can unlock
    return [];
  }, []);

  const canSpecialize = useCallback((specializationId: string): boolean => {
    // Implementation would check requirements for specialization
    return false;
  }, []);

  const activateSpecialization = useCallback((specializationId: string): boolean => {
    // Implementation would activate the specialization
    return false;
  }, []);

  const completedMilestones = useCallback((): StudioMilestone[] => {
    // Return completed milestones
    return [];
  }, []);

  const availableMilestones = useCallback((): StudioMilestone[] => {
    // Return available milestones
    return [];
  }, []);

  const checkMilestoneProgress = useCallback((milestoneId: string): number => {
    // Return progress towards milestone (0-100)
    return 0;
  }, []);

  const awardPerkPoints = useCallback((amount: number, reason: string) => {
    try {
      studioUpgradeService.awardPerkPoints(amount, reason);
      setUpgradeState(studioUpgradeService.getUpgradeState());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to award perk points');
    }
  }, []);

  const processProjectCompletion = useCallback((projectId: string, quality: number) => {
    try {
      const project = gameState?.projects?.find(p => p.id === projectId);
      if (project) {
        const mockReport = {
          qualityScore: quality,
          finalScore: quality,
          earnings: 1000,
          xpGained: 50,
          completionTime: Date.now(),
          stageReports: []
        };
        
        studioUpgradeService.processProjectCompletion(project, mockReport);
        
        // Update local state
        setUpgradeState(studioUpgradeService.getUpgradeState());
        setIndustryPrestige(studioUpgradeService.getIndustryPrestige());
        setTotalBonuses(studioUpgradeService.calculateTotalBonuses());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process project completion');
    }
  }, [gameState]);

  return {
    perkTrees,
    upgradeState: upgradeState || {
      unlockedPerks: new Set(),
      availablePerkPoints: 0,
      totalPerkPoints: 0,
      perkCooldowns: new Map(),
      activeEffects: []
    },
    industryPrestige: industryPrestige || {
      level: 0,
      points: 0,
      tier: 'unknown',
      benefits: {
        contractOfferFrequency: 1.0,
        contractQualityBonus: 0,
        mediaAttentionBonus: 0,
        networkingAdvantage: 0,
        equipmentAccessBonus: [],
        staffAttractionBonus: 0
      },
      nextTierRequirement: 100
    },
    currentSpecialization,
    availablePerkPoints: upgradeState?.availablePerkPoints || 0,
    unlockedPerks: upgradeState ? Array.from(upgradeState.unlockedPerks) : [],
    canUnlockPerk,
    unlockPerk,
    getPerkById,
    totalBonuses: totalBonuses || {
      flatBonuses: new Map(),
      percentageBonuses: new Map(),
      projectQualityBonus: 0,
      projectSpeedBonus: 0,
      staffHappiness: 0,
      contractValueMultiplier: 1,
      operatingCostReduction: 0,
      equipmentDiscounts: 0,
      reputationGainMultiplier: 1
    },
    getGenreBonus,
    getQualityBonus,
    getSpeedBonus,
    getStaffHappinessBonus,
    availableSpecializations: availableSpecializations(),
    canSpecialize,
    activateSpecialization,
    completedMilestones: completedMilestones(),
    availableMilestones: availableMilestones(),
    checkMilestoneProgress,
    prestigeLevel: industryPrestige?.level || 0,
    prestigeTier: industryPrestige?.tier || 'unknown',
    prestigeBenefits: industryPrestige?.benefits || {},
    awardPerkPoints,
    processProjectCompletion,
    isLoading,
    error
  };
};
