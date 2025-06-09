
import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { Band } from '@/types/bands';
import { toast } from '@/hooks/use-toast';

export const useBandManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const createBand = useCallback((bandName: string, memberIds: string[]) => {
    console.log('Creating band:', bandName, 'with members:', memberIds);
    
    if (!bandName.trim() || memberIds.length === 0) {
      toast({
        title: "Invalid Band Creation",
        description: "Band name and at least one member are required.",
        variant: "destructive"
      });
      return;
    }

    // Check if all selected staff members exist and are available
    const selectedStaff = gameState.hiredStaff.filter(staff => memberIds.includes(staff.id));
    if (selectedStaff.length !== memberIds.length) {
      toast({
        title: "Invalid Staff Selection",
        description: "Some selected staff members are not available.",
        variant: "destructive"
      });
      return;
    }

    // Determine the most common genre among band members
    const genreMap: Record<string, number> = {};
    selectedStaff.forEach(staff => {
      // Use staff's highest skill as their preferred genre
      const skills = staff.primaryStats;
      const topSkill = Math.max(skills.creativity, skills.technical);
      const genre = topSkill === skills.creativity ? 'Rock' : 'Pop'; // Simple mapping
      genreMap[genre] = (genreMap[genre] || 0) + 1;
    });
    
    const bandGenre = Object.entries(genreMap).reduce((a, b) => 
      genreMap[a[0]] > genreMap[b[0]] ? a : b
    )[0] || 'Rock';

    const newBand: Band = {
      id: `band_${Date.now()}`,
      bandName: bandName.trim(),
      genre: bandGenre,
      memberIds: memberIds,
      fame: 0,
      notoriety: 0,
      pastReleases: [],
      isPlayerCreated: true,
      tourStatus: {
        isOnTour: false,
        daysRemaining: 0,
        dailyIncome: 0
      }
    };

    setGameState(prev => ({
      ...prev,
      playerBands: [...prev.playerBands, newBand]
    }));

    toast({
      title: "🎸 Band Created!",
      description: `${bandName} is ready to make music!`,
      duration: 3000
    });

    console.log('Band created successfully:', newBand);
  }, [gameState.hiredStaff, setGameState]);

  const startTour = useCallback((bandId: string) => {
    console.log('Starting tour for band:', bandId);
    
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) {
      toast({
        title: "Band Not Found",
        description: "Cannot start tour for unknown band.",
        variant: "destructive"
      });
      return;
    }

    if (band.fame < 50) {
      toast({
        title: "Not Enough Fame",
        description: "Your band needs at least 50 fame to go on tour.",
        variant: "destructive"
      });
      return;
    }

    if (band.tourStatus.isOnTour) {
      toast({
        title: "Already on Tour",
        description: "This band is already touring.",
        variant: "destructive"
      });
      return;
    }

    const dailyIncome = band.fame * 100;

    setGameState(prev => ({
      ...prev,
      playerBands: prev.playerBands.map(b =>
        b.id === bandId
          ? {
              ...b,
              tourStatus: {
                isOnTour: true,
                daysRemaining: 5,
                dailyIncome: dailyIncome
              }
            }
          : b
      ),
      hiredStaff: prev.hiredStaff.map(staff =>
        band.memberIds.includes(staff.id)
          ? { ...staff, status: 'Idle' as const } // Changed from 'On Tour' to valid status
          : staff
      )
    }));

    toast({
      title: "🚌 Tour Started!",
      description: `${band.bandName} is on tour, earning $${dailyIncome} per day!`,
      duration: 3000
    });
  }, [gameState.playerBands, setGameState]);

  const createOriginalTrack = useCallback((bandId: string) => {
    console.log('Creating original track for band:', bandId);
    
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) {
      toast({
        title: "Band Not Found",
        description: "Cannot create track for unknown band.",
        variant: "destructive"
      });
      return;
    }

    if (gameState.activeProject) {
      toast({
        title: "Studio Busy",
        description: "Complete your current project first.",
        variant: "destructive"
      });
      return;
    }

    // Create a simplified original track project
    const originalTrack = {
      id: `original_${Date.now()}`,
      title: `${band.bandName} - New Track`,
      bandId: bandId,
      trackTitle: `${band.bandName} - New Track`,
      genre: band.genre,
      startDate: gameState.currentDay,
      estimatedDays: 7,
      stage: 'writing' as const,
      sessionMusicianIds: [],
      mode: 'original' as const,
      stages: [],
      currentStageIndex: 0,
      daysElapsed: 0,
      workSessionCount: 0,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0
    };

    setGameState(prev => ({
      ...prev,
      activeOriginalTrack: originalTrack
    }));

    toast({
      title: "🎵 Original Track Started!",
      description: `${band.bandName} is working on a new track!`,
      duration: 3000
    });
  }, [gameState.playerBands, gameState.activeProject, gameState.currentDay, setGameState]);

  const processTourIncome = useCallback(() => {
    let totalIncome = 0;
    
    setGameState(prev => {
      const updatedBands = prev.playerBands.map(band => {
        if (band.tourStatus.isOnTour && band.tourStatus.daysRemaining > 0) {
          totalIncome += band.tourStatus.dailyIncome;
          const newDaysRemaining = band.tourStatus.daysRemaining - 1;
          
          if (newDaysRemaining === 0) {
            // Tour complete, set staff to resting
            return {
              ...band,
              tourStatus: {
                isOnTour: false,
                daysRemaining: 0,
                dailyIncome: 0
              }
            };
          } else {
            return {
              ...band,
              tourStatus: {
                ...band.tourStatus,
                daysRemaining: newDaysRemaining
              }
            };
          }
        }
        return band;
      });

      return {
        ...prev,
        playerBands: updatedBands,
        money: prev.money + totalIncome
      };
    });

    if (totalIncome > 0) {
      toast({
        title: "🎤 Tour Income",
        description: `Earned $${totalIncome} from touring bands!`,
        duration: 2000
      });
    }
  }, [setGameState]);

  return {
    createBand,
    startTour,
    createOriginalTrack,
    processTourIncome
  };
};
