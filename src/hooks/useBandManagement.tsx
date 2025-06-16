import { useCallback } from 'react';
import { useGameState } from './useGameState';
import { Band, GameState } from '@/types/game'; // Import Band from game.ts
import { toast } from '@/components/ui/use-toast';

export interface BandManagement {
  createBand: (bandName: string, memberIds: string[]) => void;
  startTour: (bandId: string) => void;
  trainBand: (bandId: string) => void;
  fireBandMember: (bandId: string, memberId: string) => void;
  hireSessionMusician: (bandId: string, musicianId: string) => void;
}

export const useBandManagement = (): BandManagement => {
  const { gameState, updateGameState } = useGameState();

  const createBand = useCallback((bandName: string, memberIds: string[]): void => {
    if (gameState.playerData.level < 4) {
      toast({
        title: "Level Requirement",
        description: "You need to be level 4 to create a band.",
        variant: "destructive"
      });
      return;
    }

    if (memberIds.length === 0) {
      toast({
        title: "No Members Selected",
        description: "Please select at least one member for your band.",
        variant: "destructive"
      });
      return;
    }

    const newBand: Band = {
      id: `band_${Date.now()}`,
      bandName,
      genre: 'Rock', // Default genre
      memberIds,
      fame: 0,
      notoriety: 0,
      pastReleases: [],
      reputation: 0, // Added
      experience: 0, // Added
      fans: 0, // Added
      performanceHistory: [], // Added
      tourStatus: {
        isOnTour: false,
        daysRemaining: 0,
        dailyIncome: 0
      },
      isPlayerCreated: true
    };

    updateGameState((prev: GameState) => ({
      ...prev,
      playerBands: [...prev.playerBands, newBand]
    }));

    toast({
      title: "Band Created",
      description: `${bandName} has been formed!`,
    });
  }, [gameState.playerData.level, updateGameState]);

  const startTour = useCallback((bandId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) return;

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Already on Tour",
        description: "This band is already on tour.",
        variant: "destructive"
      });
      return;
    }

    if (band.fame < 50) {
      toast({
        title: "Not Enough Fame",
        description: "Your band needs at least 50 fame points to start a tour.",
        variant: "destructive"
      });
      return;
    }

    const tourCost = 5000; // $5000 per day
    if (gameState.playerData.money < tourCost) {
      toast({
        title: "Not Enough Money",
        description: `You need $${tourCost} to start a tour.`,
        variant: "destructive"
      });
      return;
    }

    updateGameState((prev: GameState) => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        money: prev.playerData.money - tourCost
      },
      playerBands: prev.playerBands.map((b: Band) => 
        b.id === bandId ? {
          ...b,
          tourStatus: {
            isOnTour: true,
            daysRemaining: 7, // Default 7-day tour
            dailyIncome: b.fame * 100 // $100 per fame point
          }
        } : b
      )
    }));

    toast({
      title: "Tour Started",
      description: `${band.bandName} has started their tour!`,
    });
  }, [gameState.playerBands, gameState.playerData.money, updateGameState]);

  const trainBand = useCallback((bandId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) return;

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Cannot Train",
        description: "Cannot train while the band is on tour.",
        variant: "destructive"
      });
      return;
    }

    const trainingCost = band.memberIds.length * 1000; // $1000 per member
    if (gameState.playerData.money < trainingCost) {
      toast({
        title: "Not Enough Money",
        description: `You need $${trainingCost} to train the band.`,
        variant: "destructive"
      });
      return;
    }

    updateGameState((prev: GameState) => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        money: prev.playerData.money - trainingCost
      },
      hiredStaff: prev.hiredStaff.map(staff => 
        band.memberIds.includes(staff.id) ? {
          ...staff,
          primaryStats: {
            ...staff.primaryStats,
            creativity: Math.min(100, staff.primaryStats.creativity + 5),
            technical: Math.min(100, staff.primaryStats.technical + 5)
          }
        } : staff
      )
    }));

    toast({
      title: "Training Complete",
      description: `${band.bandName}'s skills have improved!`,
    });
  }, [gameState.playerBands, gameState.playerData.money, updateGameState]);

  const fireBandMember = useCallback((bandId: string, memberId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) return;

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Cannot Fire",
        description: "Cannot fire members while the band is on tour.",
        variant: "destructive"
      });
      return;
    }

    updateGameState((prev: GameState) => ({
      ...prev,
      playerBands: prev.playerBands.map((b: Band) => 
        b.id === bandId ? {
          ...b,
          memberIds: b.memberIds.filter(id => id !== memberId)
        } : b
      )
    }));

    toast({
      title: "Member Fired",
      description: "The member has been removed from the band.",
    });
  }, [gameState.playerBands, updateGameState]);

  const hireSessionMusician = useCallback((bandId: string, musicianId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    const musician = gameState.availableSessionMusicians.find(m => m.id === musicianId);
    if (!band || !musician) return;

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Cannot Hire",
        description: "Cannot hire musicians while the band is on tour.",
        variant: "destructive"
      });
      return;
    }

    if (gameState.playerData.money < musician.dailyRate) {
      toast({
        title: "Not Enough Money",
        description: `You need $${musician.dailyRate} to hire this musician.`,
        variant: "destructive"
      });
      return;
    }

    updateGameState((prev: GameState) => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        money: prev.playerData.money - musician.dailyRate
      },
      playerBands: prev.playerBands.map((b: Band) => 
        b.id === bandId ? {
          ...b,
          memberIds: [...b.memberIds, musicianId]
        } : b
      ),
      availableSessionMusicians: prev.availableSessionMusicians.filter(m => m.id !== musicianId)
    }));

    toast({
      title: "Musician Hired",
      description: `${musician.name} has joined ${band.bandName}!`,
    });
  }, [gameState.playerBands, gameState.availableSessionMusicians, gameState.playerData.money, updateGameState]);

  return {
    createBand,
    startTour,
    trainBand,
    fireBandMember,
    hireSessionMusician
  };
};
