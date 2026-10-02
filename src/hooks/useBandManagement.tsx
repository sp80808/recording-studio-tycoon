
import { money } from '@/utils/displayMoney';
import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { earn } from '@/economy/ledger';
import { Band, OriginalTrackProject } from '@/types/bands';
import { generateBandName } from '@/utils/bandUtils';
import { toast } from '@/hooks/use-toast';
import { canPlayShow, resolveShow, ShowPlan } from '@/simulation/liveShows';

export const useBandManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const createBand = useCallback((bandName: string, memberIds: string[]) => {
    console.log('Creating band:', bandName, 'with members:', memberIds);
    
    if (!bandName.trim() || memberIds.length === 0) {
      toast({
        title: "❌ Invalid Band Creation",
        description: "Band name and at least one member are required.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    // Check if all selected staff members exist and are available
    const selectedStaff = gameState.hiredStaff.filter(staff => memberIds.includes(staff.id));
    if (selectedStaff.length !== memberIds.length) {
      toast({
        title: "❌ Invalid Staff Selection",
        description: "Some selected staff members are not available.",
        className: "bg-stone-800 border-stone-600 text-white",
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
      isPlayerCreated: true,
      fame: 0,
      notoriety: 0,
      pastReleases: [],
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
      className: "bg-stone-800 border-stone-600 text-white",
      duration: 3000
    });

    console.log('Band created successfully:', newBand);
  }, [gameState.hiredStaff, setGameState]);

  const startTour = useCallback((bandId: string) => {
    console.log('Starting tour for band:', bandId);
    
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) {
      toast({
        title: "❌ Band Not Found",
        description: "Cannot start tour for unknown band.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    if (band.fame < 50) {
      toast({
        title: "⭐ Not Enough Fame",
        description: "Your band needs at least 50 fame to go on tour.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    if (band.tourStatus.isOnTour) {
      toast({
        title: "🚌 Already on Tour",
        description: "This band is already touring.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    // Tour income (sd3.4): capped so tours are a mid-game engine, not an
    // exploit — fame 50 pays $1,250/day (was $5,000).
    const dailyIncome = Math.min(1500, band.fame * 25);

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
          ? { ...staff, status: 'On Tour' as const }
          : staff
      )
    }));

    toast({
      title: "🚌 Tour Started!",
      description: `${band.bandName} is on tour, earning ${money(dailyIncome)} per day!`,
      className: "bg-stone-800 border-stone-600 text-white",
      duration: 3000
    });
  }, [gameState.playerBands, setGameState]);

  const playShow = useCallback((bandId: string, plan: ShowPlan) => {
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) return;

    const check = canPlayShow(
      { fame: band.fame, isOnTour: band.tourStatus.isOnTour, lastShowDay: band.lastShowDay },
      gameState.reputation,
      plan,
      gameState.money,
      gameState.currentDay
    );
    if (!check.ok) {
      toast({
        title: "🎤 Can't Book Show",
        description: check.reason,
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    const active = band.pastReleases.filter(r => r.isActive);
    const hitQuality = active.length
      ? active.reduce((sum, r) => sum + r.reviewScore, 0) / active.length
      : 5;
    const result = resolveShow(
      { bandId, fame: band.fame, hitQuality },
      plan,
      `${gameState.saveSeed ?? 'show'}:${bandId}:${gameState.currentDay}`
    );

    setGameState(prev => ({
      ...prev,
      money: prev.money + result.net,
      reputation: prev.reputation + result.reputationGain,
      playerData: { ...prev.playerData, xp: prev.playerData.xp + result.xpGain },
      playerBands: prev.playerBands.map(b =>
        b.id === bandId
          ? { ...b, fame: b.fame + result.fameGain, lastShowDay: prev.currentDay }
          : b
      )
    }));

    const verdictTitle = {
      flop: '😬 Empty Room',
      ok: '🎤 Decent Night',
      hit: '🔥 Great Show',
      legendary: '🌟 Sold Out & Legendary'
    }[result.verdict];
    toast({
      title: verdictTitle,
      description: `${band.bandName} drew ${result.attendance} fans. Net ${result.net >= 0 ? '+' : '-'}${money(Math.abs(result.net))}, +${result.fameGain} fame, +${result.xpGain} XP.${result.mishap ? ' A technical mishap hurt the night.' : ''}`,
      className: "bg-stone-800 border-stone-600 text-white",
      duration: 4000
    });
  }, [gameState.playerBands, gameState.reputation, gameState.money, gameState.currentDay, gameState.saveSeed, setGameState]);

  const createOriginalTrack = useCallback((bandId: string) => {
    console.log('Creating original track for band:', bandId);
    
    const band = gameState.playerBands.find(b => b.id === bandId);
    if (!band) {
      toast({
        title: "❌ Band Not Found",
        description: "Cannot create track for unknown band.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    if (gameState.activeProject || gameState.activeOriginalTrack) {
      toast({
        title: "⏳ Studio Busy",
        description: "Complete your current project first.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return;
    }

    // Create an original track project
    const originalTrack: OriginalTrackProject = {
      id: `original_${Date.now()}`,
      title: `${band.bandName} - New Track`,
      bandId,
      sessionMusicianIds: [],
      mode: 'band',
      stages: [{ stageName: 'Writing', focusAreas: ['songwriting'], workUnitsBase: 7, workUnitsCompleted: 0, completed: false }],
      currentStageIndex: 0,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      workSessionCount: 0,
    };

    setGameState(prev => ({
      ...prev,
      activeOriginalTrack: originalTrack
    }));

    toast({
      title: "🎵 Original Track Started!",
      description: `${band.bandName} is working on a new track!`,
      className: "bg-stone-800 border-stone-600 text-white",
      duration: 3000
    });
  }, [gameState.playerBands, gameState.activeProject, gameState.activeOriginalTrack, gameState.currentDay, setGameState]);

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
        ...earn(prev, totalIncome, { category: 'reward-income', memo: 'Tour income' }),
        playerBands: updatedBands,
      };
    });

    if (totalIncome > 0) {
      toast({
        title: "🎤 Tour Income",
        description: `Earned ${money(totalIncome)} from touring bands!`,
        duration: 2000
      });
    }
  }, [setGameState]);

  return {
    createBand,
    startTour,
    playShow,
    createOriginalTrack,
    processTourIncome
  };
};
