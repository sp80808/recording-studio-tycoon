import { useCallback } from 'react';
// import { useGameState } from './useGameState'; // Removed internal call
import { Band, GameState } from '@/types/game';
import { MusicGenre } from '@/types/charts';
import { toast } from '@/components/ui/use-toast';

export interface BandManagement {
  createBand: (bandName: string, memberIds: string[], genre: MusicGenre) => void;
  startTour: (bandId: string) => void;
  trainBand: (bandId: string) => void;
  fireBandMember: (bandId: string, memberId: string) => void;
  hireSessionMusician: (bandId: string, musicianId: string) => void;
  addBandMember: (bandId: string, staffId: string) => void; // Added new function
}

// Accept gameState and updateGameState as parameters
export const useBandManagement = (
  gameState: GameState,
  updateGameState: (updater: (prevState: GameState) => GameState) => void
): BandManagement => {

  const createBand = useCallback((bandName: string, memberIds: string[], genre?: MusicGenre): void => {
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

    const defaultGenre: MusicGenre = 'pop'; // Default genre for initial implementation
    const newBand: Band = {
      id: `band_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // Ensure more unique ID
      bandName,
      genre: genre || defaultGenre, // Use provided genre or default
      memberIds,
      fame: 0,
      notoriety: 0,
      pastReleases: [],
      reputation: 0,
      experience: 0,
      fans: 0,
      performanceHistory: [],
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
    if (!band) {
        toast({ title: "Error", description: "Band not found.", variant: "destructive" });
        return;
    }

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Already on Tour",
        description: `${band.bandName} is already on tour.`,
        variant: "destructive"
      });
      return;
    }

    if (band.fame < 50) { // Example threshold
      toast({
        title: "Not Enough Fame",
        description: `${band.bandName} needs at least 50 fame points to start a tour.`,
        variant: "destructive"
      });
      return;
    }

    const tourCost = 5000; // Example flat cost to start a tour
    if (gameState.playerData.money < tourCost) {
      toast({
        title: "Not Enough Money",
        description: `You need $${tourCost.toLocaleString()} to start a tour for ${band.bandName}.`,
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
            dailyIncome: b.fame * 10 // Example: $10 per fame point daily
          }
        } : b
      )
    }));

    toast({
      title: "Tour Started!",
      description: `${band.bandName} has hit the road!`,
    });
  }, [gameState.playerBands, gameState.playerData.money, updateGameState]);

  const trainBand = useCallback((bandId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) {
        toast({ title: "Error", description: "Band not found.", variant: "destructive" });
        return;
    }

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Cannot Train",
        description: `${band.bandName} cannot train while on tour.`,
        variant: "destructive"
      });
      return;
    }

    const trainingCost = band.memberIds.length * 1000; // $1000 per member
    if (gameState.playerData.money < trainingCost) {
      toast({
        title: "Not Enough Money",
        description: `You need $${trainingCost.toLocaleString()} to train ${band.bandName}.`,
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
            creativity: Math.min(100, staff.primaryStats.creativity + (5 + Math.floor(Math.random()*3))),
            technical: Math.min(100, staff.primaryStats.technical + (5 + Math.floor(Math.random()*3)))
          },
          experience: (staff.experience || 0) + 50
        } : staff
      ),
      playerBands: prev.playerBands.map(b =>
        b.id === bandId ? { ...b, experience: (b.experience || 0) + 100 } : b
      )
    }));

    toast({
      title: "Training Complete",
      description: `${band.bandName}'s skills and experience have improved!`,
    });
  }, [gameState.playerBands, gameState.playerData.money, updateGameState, gameState.hiredStaff]); // Added gameState.hiredStaff

  const fireBandMember = useCallback((bandId: string, memberId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) {
        toast({ title: "Error", description: "Band not found.", variant: "destructive" });
        return;
    }

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Cannot Fire Member",
        description: `Cannot modify ${band.bandName}'s lineup while they are on tour.`,
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
      description: `A member has been removed from ${band.bandName}.`,
    });
  }, [gameState.playerBands, updateGameState]);

  const hireSessionMusician = useCallback((bandId: string, musicianId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    const musician = gameState.availableSessionMusicians?.find(m => m.id === musicianId);

    if (!band) {
        toast({ title: "Error", description: "Band not found.", variant: "destructive" });
        return;
    }
    if (!musician) {
        toast({ title: "Error", description: "Session musician not found.", variant: "destructive" });
        return;
    }

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Cannot Hire Musician",
        description: `Cannot hire for ${band.bandName} while they are on tour.`,
        variant: "destructive"
      });
      return;
    }

    if (gameState.playerData.money < musician.dailyRate) { // Assuming dailyRate is the hiring cost
      toast({
        title: "Not Enough Money",
        description: `You need $${musician.dailyRate.toLocaleString()} to hire ${musician.name}.`,
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
      availableSessionMusicians: prev.availableSessionMusicians?.filter(m => m.id !== musicianId) || []
    }));

    toast({
      title: "Musician Hired!",
      description: `${musician.name} has joined ${band.bandName} for a session!`,
    });
  }, [gameState.playerBands, gameState.availableSessionMusicians, gameState.playerData.money, updateGameState]);

  const addBandMember = useCallback((bandId: string, staffId: string): void => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    const staffMember = gameState.hiredStaff.find(s => s.id === staffId);

    if (!band) {
      toast({ title: "Error", description: "Band not found.", variant: "destructive" });
      return;
    }
    if (!staffMember) {
      toast({ title: "Error", description: "Staff member not found.", variant: "destructive" });
      return;
    }
    if (band.memberIds.includes(staffId)) {
      toast({ title: "Already a Member", description: `${staffMember.name} is already in ${band.bandName}.`, variant: "destructive" });
      return;
    }
    if (staffMember.status !== 'Idle') {
      toast({ title: "Staff Not Idle", description: `${staffMember.name} is currently ${staffMember.status}.`, variant: "destructive" });
      return;
    }
    if (band.tourStatus.isOnTour) {
      toast({
        title: "Cannot Add Member",
        description: `Cannot modify ${band.bandName}'s lineup while they are on tour.`,
        variant: "destructive"
      });
      return;
    }

    updateGameState((prev: GameState) => ({
      ...prev,
      playerBands: prev.playerBands.map((b: Band) =>
        b.id === bandId ? {
          ...b,
          memberIds: [...b.memberIds, staffId]
        } : b
      ),
      hiredStaff: prev.hiredStaff.map(s =>
        s.id === staffId ? { ...s, status: 'On Tour' } : s // Assuming 'On Tour' or a new 'On Band' status
      )
    }));

    toast({
      title: "Member Added",
      description: `${staffMember.name} has joined ${band.bandName}!`,
    });
  }, [gameState.playerBands, gameState.hiredStaff, updateGameState]);

  return {
    createBand,
    startTour,
    trainBand,
    fireBandMember,
    hireSessionMusician,
    addBandMember // Added new function
  };
};
