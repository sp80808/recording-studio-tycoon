
import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { Band, BandRelease, OriginalTrackProject } from '@/types/bands';
import { calculateReviewScore, calculateTotalSales, updateBandStats } from '@/utils/bandUtils';
import { toast } from '@/hooks/use-toast';

export const useBandManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  
  const createBand = useCallback((bandName: string, memberIds: string[]) => {
    const newBand: Band = {
      id: `player_band_${Date.now()}`,
      bandName,
      genre: 'Original', // Could be determined by member genres later
      fame: 0,
      notoriety: 0,
      memberIds,
      isPlayerCreated: true,
      pastReleases: [],
      tourStatus: {
        isOnTour: false,
        daysRemaining: 0,
        dailyIncome: 0
      }
    };

    setGameState(prev => ({
      ...prev,
      playerBands: [...prev.playerBands, newBand],
      bands: [...prev.bands, newBand]
    }));

    toast({
      title: "🎸 Band Created!",
      description: `${bandName} is ready to make music!`,
    });
  }, [setGameState]);

  const startTour = useCallback((bandId: string) => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band || band.fame < 50) return;

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
                dailyIncome
              }
            }
          : b
      ),
      hiredStaff: prev.hiredStaff.map(staff => 
        band.memberIds.includes(staff.id)
          ? { ...staff, status: 'Training' as const } // Using 'Training' as 'On Tour' status
          : staff
      )
    }));

    toast({
      title: "🚌 Tour Started!",
      description: `${band.bandName} is going on tour for 5 days, earning $${dailyIncome} per day!`,
    });
  }, [gameState.playerBands, setGameState]);

  const createOriginalTrack = useCallback((bandId: string) => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) return;

    const newProject: OriginalTrackProject = {
      id: `original_${Date.now()}`,
      title: `New ${band.bandName} Track`,
      bandId,
      sessionMusicianIds: [],
      mode: 'band',
      stages: [
        {
          stageName: 'Songwriting',
          focusAreas: ['performance', 'layering'],
          workUnitsBase: 8,
          workUnitsCompleted: 0,
          completed: false
        },
        {
          stageName: 'Recording',
          focusAreas: ['soundCapture', 'performance'],
          workUnitsBase: 12,
          workUnitsCompleted: 0,
          completed: false
        },
        {
          stageName: 'Mixing & Mastering',
          focusAreas: ['layering', 'soundCapture'],
          workUnitsBase: 10,
          workUnitsCompleted: 0,
          completed: false
        }
      ],
      currentStageIndex: 0,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      workSessionCount: 0
    };

    setGameState(prev => ({
      ...prev,
      activeOriginalTrack: newProject
    }));

    toast({
      title: "🎵 Original Track Started!",
      description: `${band.bandName} is working on a new track!`,
    });
  }, [gameState.playerBands, setGameState]);

  const processTourIncome = useCallback(() => {
    setGameState(prev => {
      let totalTourIncome = 0;
      
      const updatedBands = prev.playerBands.map(band => {
        if (band.tourStatus.isOnTour) {
          totalTourIncome += band.tourStatus.dailyIncome;
          
          const newDaysRemaining = band.tourStatus.daysRemaining - 1;
          
          if (newDaysRemaining <= 0) {
            // Tour ended, staff become resting
            return {
              ...band,
              tourStatus: {
                isOnTour: false,
                daysRemaining: 0,
                dailyIncome: 0
              }
            };
          }
          
          return {
            ...band,
            tourStatus: {
              ...band.tourStatus,
              daysRemaining: newDaysRemaining
            }
          };
        }
        return band;
      });

      return {
        ...prev,
        money: prev.money + totalTourIncome,
        playerBands: updatedBands,
        hiredStaff: prev.hiredStaff.map(staff => {
          const isOnEndedTour = updatedBands.some(band => 
            band.memberIds.includes(staff.id) && 
            !band.tourStatus.isOnTour &&
            prev.playerBands.find(pb => pb.id === band.id)?.tourStatus.isOnTour
          );
          
          if (isOnEndedTour) {
            return { ...staff, status: 'Resting' as const, energy: 50 };
          }
          return staff;
        })
      };
    });
  }, [setGameState]);

  return {
    createBand,
    startTour,
    createOriginalTrack,
    processTourIncome
  };
};
