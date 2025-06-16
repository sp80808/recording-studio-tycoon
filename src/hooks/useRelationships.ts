// React Hook for Reputation & Relationship Management System
import { useState, useEffect, useCallback } from 'react';
import { relationshipService } from '../services/relationshipService';
import { 
  Client, 
  RecordLabel, 
  ContractHistory, 
  RelationshipBonus,
  EntityType,
  RelationshipEvent,
  ReputationScore
} from '../types/relationships';
import { MusicGenre } from '../types/charts';
import { useGameState } from './useGameState';

export interface UseRelationshipsReturn {
  // Current relationship state
  allEntities: ReputableEntity[];
  relationshipManager: RelationshipManager | null;
  
  // Utility functions
  getEntityById: (entityId: string) => ReputableEntity | null;
  getRelationshipScore: (entityId: string) => number;
  getRelationshipLevel: (entityId: string) => string;
  getRelationshipBonuses: (entityId: string) => RelationshipBonuses;
  getEntitiesByType: (type: EntityType) => ReputableEntity[];
  getTopRelationships: (limit?: number) => ReputableEntity[];
  
  // Contract and preference utilities
  getPreferredGenres: (entityId: string) => MusicGenre[];
  getPreferredMoods: (entityId: string) => Mood[];
  calculateContractValueModifier: (entityId: string, projectGenre: MusicGenre, projectMood: Mood) => number;
  getAvailableContracts: (entityType?: EntityType) => any[]; // Would return proper contract type
  
  // Actions
  updateRelationship: (entityId: string, amount: number, reason: string) => void;
  recordContractCompletion: (entityId: string, success: boolean, quality: number) => void;
  blacklistEntity: (entityId: string, reason: string) => void;
  
  // Reputation tracking
  getGenreReputation: (genre: MusicGenre) => number;
  getOverallReputation: () => number;
  getReputationHistory: () => any[]; // Would return proper history type
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export const useRelationships = (): UseRelationshipsReturn => {
  const { gameState } = useGameState();
  const [allEntities, setAllEntities] = useState<ReputableEntity[]>([]);
  const [relationshipManager, setRelationshipManager] = useState<RelationshipManager | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    try {
      setIsLoading(true);
      setAllEntities(relationshipService.getAllEntities());
      setRelationshipManager(relationshipService.getRelationshipManager());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load relationship data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update relationships when game state changes
  useEffect(() => {
    if (gameState?.playerData?.level) {
      // Trigger any periodic relationship updates
      try {
        setAllEntities(relationshipService.getAllEntities());
        setRelationshipManager(relationshipService.getRelationshipManager());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update relationships');
      }
    }
  }, [gameState?.playerData?.level]);

  const getEntityById = useCallback((entityId: string): ReputableEntity | null => {
    return relationshipService.getEntityById(entityId);
  }, []);

  const getRelationshipScore = useCallback((entityId: string): number => {
    return relationshipService.getRelationshipScore(entityId);
  }, []);

  const getRelationshipLevel = useCallback((entityId: string): string => {
    const score = relationshipService.getRelationshipScore(entityId);
    if (score >= 90) return 'Legendary';
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Poor';
    return 'Terrible';
  }, []);

  const getRelationshipBonuses = useCallback((entityId: string): RelationshipBonuses => {
    return relationshipService.calculateRelationshipBonuses(entityId);
  }, []);

  const getEntitiesByType = useCallback((type: EntityType): ReputableEntity[] => {
    return allEntities.filter(entity => entity.type === type);
  }, [allEntities]);

  const getTopRelationships = useCallback((limit: number = 5): ReputableEntity[] => {
    return [...allEntities]
      .sort((a, b) => b.relationshipScore - a.relationshipScore)
      .slice(0, limit);
  }, [allEntities]);

  const getPreferredGenres = useCallback((entityId: string): MusicGenre[] => {
    const entity = getEntityById(entityId);
    return entity?.preferredGenres || [];
  }, [getEntityById]);

  const getPreferredMoods = useCallback((entityId: string): Mood[] => {
    const entity = getEntityById(entityId);
    return entity?.preferredMoods || [];
  }, [getEntityById]);

  const calculateContractValueModifier = useCallback((
    entityId: string, 
    projectGenre: MusicGenre, 
    projectMood: Mood
  ): number => {
    const entity = getEntityById(entityId);
    if (!entity) return 1.0;

    const bonuses = getRelationshipBonuses(entityId);
    let modifier = bonuses.contractValueIncrease;

    // Genre preference bonus
    if (entity.preferredGenres.includes(projectGenre)) {
      modifier += 0.15;
    }

    // Mood preference bonus
    if (entity.preferredMoods.includes(projectMood)) {
      modifier += 0.1;
    }

    return Math.max(0.5, modifier); // Minimum 50% value
  }, [getEntityById, getRelationshipBonuses]);

  const getAvailableContracts = useCallback((entityType?: EntityType): any[] => {
    // This would integrate with the contract generation system
    // For now, return mock data based on relationships
    const entities = entityType ? getEntitiesByType(entityType) : allEntities;
    
    return entities
      .filter(entity => entity.relationshipScore > 10) // Not blacklisted
      .map(entity => ({
        entityId: entity.id,
        entityName: entity.name,
        relationshipLevel: getRelationshipLevel(entity.id),
        contractValueModifier: calculateContractValueModifier(entity.id, 'pop', 'upbeat'),
        preferredGenres: entity.preferredGenres,
        estimatedValue: Math.floor(1000 + (entity.relationshipScore * 50))
      }));
  }, [allEntities, getEntitiesByType, getRelationshipLevel, calculateContractValueModifier]);

  const updateRelationship = useCallback((entityId: string, amount: number, reason: string) => {
    try {
      if (amount > 0) {
        relationshipService.increaseRelationship(entityId, amount, reason);
      } else {
        relationshipService.decreaseRelationship(entityId, Math.abs(amount), reason);
      }
      
      // Update local state
      setAllEntities(relationshipService.getAllEntities());
      setRelationshipManager(relationshipService.getRelationshipManager());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update relationship');
    }
  }, []);

  const recordContractCompletion = useCallback((
    entityId: string, 
    success: boolean, 
    quality: number
  ) => {
    try {
      // Mock project data - in real implementation this would come from the actual project
      const mockProject = {
        id: 'temp-project',
        title: 'Contract Project',
        genre: 'pop' as MusicGenre,
        targetMood: 'upbeat' as Mood,
        type: 'contract' as const,
        clientType: 'individual' as const,
        difficulty: 5,
        durationDaysTotal: 7,
        payoutBase: 1000,
        status: 'completed' as const,
        assignedStaff: [],
        stages: [],
        progress: 100
      };

      const mockReport = {
        qualityScore: quality,
        finalScore: quality,
        earnings: 1000,
        xpGained: 50,
        completionTime: Date.now(),
        stageReports: []
      };

      relationshipService.processProjectCompletion(mockProject, mockReport);
      
      // Update local state
      setAllEntities(relationshipService.getAllEntities());
      setRelationshipManager(relationshipService.getRelationshipManager());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record contract completion');
    }
  }, []);

  const blacklistEntity = useCallback((entityId: string, reason: string) => {
    try {
      relationshipService.decreaseRelationship(entityId, 100, `Blacklisted: ${reason}`);
      
      // Update local state
      setAllEntities(relationshipService.getAllEntities());
      setRelationshipManager(relationshipService.getRelationshipManager());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to blacklist entity');
    }
  }, []);

  const getGenreReputation = useCallback((genre: MusicGenre): number => {
    const manager = relationshipService.getRelationshipManager();
    return manager.genreReputation[genre] || 0;
  }, []);

  const getOverallReputation = useCallback((): number => {
    const manager = relationshipService.getRelationshipManager();
    const genreScores = Object.values(manager.genreReputation);
    return genreScores.length > 0 
      ? genreScores.reduce((sum, score) => sum + score, 0) / genreScores.length 
      : 0;
  }, []);

  const getReputationHistory = useCallback((): any[] => {
    const manager = relationshipService.getRelationshipManager();
    return manager.reputationHistory || [];
  }, []);

  return {
    allEntities,
    relationshipManager,
    getEntityById,
    getRelationshipScore,
    getRelationshipLevel,
    getRelationshipBonuses,
    getEntitiesByType,
    getTopRelationships,
    getPreferredGenres,
    getPreferredMoods,
    calculateContractValueModifier,
    getAvailableContracts,
    updateRelationship,
    recordContractCompletion,
    blacklistEntity,
    getGenreReputation,
    getOverallReputation,
    getReputationHistory,
    isLoading,
    error
  };
};
