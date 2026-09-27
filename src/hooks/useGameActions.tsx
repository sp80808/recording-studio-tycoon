
import { useCallback } from 'react';
import { GameNotification, GameState } from '@/types/game';
import { generateCandidates, generateNewProjects } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';
import { 
  calculateYearFromDay, 
  checkEraTransitionAvailable, 
  transitionToEra,
  getEraSpecificEquipmentMultiplier 
} from '@/utils/eraProgression';
import { availableMods } from '@/data/equipmentMods';
import { applyEventsToState, rollDailyEvents } from '@/game-mechanics/eventIntegration';
import { RandomEvent } from '@/game-mechanics/random-events';
import { freshDailyTracking } from '@/utils/dailyChallenges';
import { gameAudio } from '@/utils/audioSystem';
import { triggerScreenShake } from '@/utils/screenShake';

/** Daily equipment upkeep: 0.1% of item price per day, minimum $2/item */
export const calculateEquipmentUpkeep = (equipment: GameState['ownedEquipment']): number => {
  if (!equipment || equipment.length === 0) return 0;
  return equipment.reduce((sum, item) => sum + Math.max(2, Math.round(item.price * 0.001)), 0);
};

/** Cost + cooldown for chasing new gig offers (bead goj.3). */
export const GIG_REFRESH_COST = 50;
export const GIG_REFRESH_COOLDOWN_DAYS = 3;

/** Days remaining before the gig list can be refreshed again (0 = ready). */
export const gigRefreshCooldownRemaining = (gameState: GameState): number => {
  const last = gameState.lastGigRefreshDay ?? 0;
  const elapsed = gameState.currentDay - last;
  return Math.max(0, GIG_REFRESH_COOLDOWN_DAYS - elapsed);
};

export const useGameActions = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const advanceDay = useCallback(() => {
    const newDay = gameState.currentDay + 1;
    console.log(`Advancing to day ${newDay}`);
    
    // Calculate new year based on era progression
    const newYear = calculateYearFromDay(newDay, gameState.eraStartYear, gameState.currentEra);
    
    // Check for era transition opportunity
    const availableTransition = checkEraTransitionAvailable(gameState);
    
    // Process training and research completions
    const completedTraining: string[] = [];
    const completedResearch: string[] = [];
    const newResearchedMods = [...gameState.researchedMods];

    // Staff salary + equipment upkeep expenses (bead ruc.3)
    const totalSalaries = gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0);
    const equipmentUpkeep = calculateEquipmentUpkeep(gameState.ownedEquipment);
    const totalDailyExpenses = totalSalaries + equipmentUpkeep;

    // Unpaid salaries penalty check
    const canAffordSalaries = gameState.money >= totalSalaries;

    const updatedStaff = gameState.hiredStaff.map(staff => {
      let updatedStaffMember = { ...staff };
      if (staff.status === 'Training' && staff.trainingEndDay && newDay >= staff.trainingEndDay) {
        completedTraining.push(`${staff.name} completed training for ${staff.trainingCourse}!`); // Assuming trainingCourse stores the name or ID
        updatedStaffMember = {
          ...updatedStaffMember,
          status: 'Idle' as const,
          trainingEndDay: undefined,
          trainingCourse: undefined,
          energy: 100 // Restore energy after training
        };
      }
      if (staff.status === 'Researching' && staff.researchEndDay && staff.researchingModId && newDay >= staff.researchEndDay) {
        const mod = availableMods.find(m => m.id === staff.researchingModId);
        if (mod) {
          completedResearch.push(`${staff.name} completed research for ${mod.name}!`);
          if (!newResearchedMods.includes(mod.id)) {
            newResearchedMods.push(mod.id);
          }
        }
        updatedStaffMember = {
          ...updatedStaffMember,
          status: 'Idle' as const,
          researchingModId: null,
          researchEndDay: undefined,
          energy: Math.max(20, staff.energy - 20) // Research consumes some energy
        };
      }
      // If salaries could not be paid, staff morale suffers
      if (!canAffordSalaries) {
        updatedStaffMember = {
          ...updatedStaffMember,
          mood: Math.max(0, updatedStaffMember.mood - 10)
        };
      }
      return updatedStaffMember;
    });

    // Roll random events for the new day (bead ruc.3)
    const stateForEvaluation: GameState = {
      ...gameState,
      currentDay: newDay,
      currentYear: newYear,
      hiredStaff: updatedStaff
    };
    const triggeredEvents: RandomEvent[] = rollDailyEvents(stateForEvaluation);

    // Update equipment multiplier based on year progression
    const updatedEquipmentMultiplier = getEraSpecificEquipmentMultiplier(
      gameState.currentEra, 
      gameState.eraStartYear, 
      newYear
    );
    
    setGameState(prev => {
      const newExpenses = prev.financials.expenses + totalDailyExpenses;
      const baseUpdatedState: GameState = {
        ...prev, 
        currentDay: newDay,
        currentYear: newYear,
        lastSalaryDay: newDay,
        equipmentMultiplier: updatedEquipmentMultiplier,
        money: prev.money - totalDailyExpenses,
        financials: {
          ...prev.financials,
          expenses: newExpenses,
          profit: prev.financials.income - newExpenses,
        },
        researchedMods: newResearchedMods,
        dailyTracking: freshDailyTracking(newDay), // New day, new challenge
        hiredStaff: updatedStaff.map(s => 
          s.status === 'Resting' 
            ? { ...s, energy: Math.min(100, s.energy + 20) }
            : s
        ),
        playerData: {
          ...prev.playerData,
          dailyWorkCapacity: prev.playerData.attributes.focusMastery + 3 + prev.playerData.level - 1
        }
      };

      if (triggeredEvents.length === 0) {
        return baseUpdatedState;
      }

      const { state: postEventsState, results } = applyEventsToState(baseUpdatedState, triggeredEvents);
      const newNotifications: GameNotification[] = [];

      results.forEach((res, idx) => {
        const ev = triggeredEvents[idx];
        const effectSummaries = res.applied.map(a => a.summary).concat(res.narrative);
        const summaryText = effectSummaries.length > 0 ? effectSummaries.join(', ') : ev.description;
        const netMagnitude = ev.effects.reduce((sum, eff) => sum + eff.magnitude, 0);
        const tone: GameNotification['type'] =
          netMagnitude < 0 ? 'error' : netMagnitude > 0 ? 'success' : 'info';

        newNotifications.push({
          id: `random-event-${ev.id}-${newDay}`,
          message: `${ev.name}: ${summaryText}`,
          type: tone,
          timestamp: Date.now(),
          duration: 6000
        });
      });

      return {
        ...postEventsState,
        notifications: [...postEventsState.notifications, ...newNotifications]
      };
    });
    
    // Show era transition notification if available
    if (availableTransition) {
      toast({
        title: "🎵 Era Transition Available!",
        description: `You can now advance to ${availableTransition.name}. Check the Studio tab for transition options.`,
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 6000
      });
    }
    
    // Show year progression notifications at key milestones
    if (newDay % 90 === 0) { // Every ~year
      toast({
        title: `📅 Year ${newYear}`,
        description: `Your studio has been operating for ${Math.floor(newDay / 90)} years. Keep pushing forward!`,
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 4000
      });
    }
    
    // Process salary & upkeep notifications
    if (totalDailyExpenses > 0) {
      if (canAffordSalaries) {
        gameAudio.playUISound('cashRegister');
        toast({
          title: "💰 Daily Expenses Paid",
          description: `Paid $${totalSalaries} in salaries and $${equipmentUpkeep} in equipment upkeep.`,
          className: "bg-gray-800 border-gray-600 text-white",
        });
      } else {
        gameAudio.playUISound('staffUnavailable');
        triggerScreenShake('light');
        toast({
          title: "❌ Cannot Pay Salaries!",
          description: `Need $${totalSalaries} for daily salaries. Staff morale has dropped!`,
          className: "bg-gray-800 border-gray-600 text-white",
          variant: "destructive"
        });
      }
    }

    // Trigger toast for random events
    triggeredEvents.forEach(ev => {
      const isNegative = ev.effects.reduce((sum, eff) => sum + eff.magnitude, 0) < 0;
      gameAudio.playUISound(isNegative ? 'notice' : 'notification');
      toast({
        title: `🎲 ${ev.name}`,
        description: ev.description,
        className: isNegative ? "bg-red-950 border-red-700 text-white" : "bg-purple-950 border-purple-700 text-white",
        duration: 5000
      });
    });

    // Generate new candidates every few days
    if (newDay % 3 === 0) {
      setGameState(prev => ({
        ...prev,
        availableCandidates: generateCandidates(3)
      }));
    }

    completedTraining.forEach(message => {
      gameAudio.playUISound('trainingComplete');
      toast({
        title: "🎓 Training Complete!",
        description: message,
        className: "bg-gray-800 border-gray-600 text-white",
      });
    });

    completedResearch.forEach(message => {
      gameAudio.playUISound('notification');
      toast({
        title: "🔬 Research Complete!",
        description: message,
        className: "bg-gray-800 border-gray-600 text-white",
      });
    });
  }, [gameState, setGameState]);

  const refreshCandidates = useCallback(() => {
    const cost = 50;
    if (gameState.money < cost) {
      gameAudio.playUISound('unavailable');
      toast({
        title: "💰 Insufficient Funds",
        description: `Need $${cost} to refresh candidate list.`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - cost,
      availableCandidates: generateCandidates(3)
    }));

    gameAudio.playUISound('notice');
    toast({
      title: "👥 New Candidates Found",
      description: "Fresh talent is now available for hire!",
      className: "bg-gray-800 border-gray-600 text-white",
    });
  }, [gameState.money, setGameState]);

  /**
   * Chase fresh gig offers (bead goj.3): costs $50 and has a 3-day cooldown so
   * the gig list can't be rerolled instantly. Returns true when new gigs land.
   */
  const refreshProjects = useCallback(() => {
    const daysLeft = gigRefreshCooldownRemaining(gameState);
    if (daysLeft > 0) {
      gameAudio.playUISound('unavailable');
      toast({
        title: "📵 No New Leads Yet",
        description: `The labels are tapped out — try again in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (advance the day or work sessions).`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive",
      });
      return false;
    }

    if (gameState.money < GIG_REFRESH_COST) {
      gameAudio.playUISound('unavailable');
      toast({
        title: "💰 Insufficient Funds",
        description: `Need $${GIG_REFRESH_COST} to chase new gigs.`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive",
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - GIG_REFRESH_COST,
      lastGigRefreshDay: prev.currentDay,
      availableProjects: [
        ...prev.availableProjects,
        ...generateNewProjects(1, prev.playerData.level, prev.currentEra),
      ],
    }));

    gameAudio.playUISound('notice');
    toast({
      title: "📞 New Leads",
      description: `Paid $${GIG_REFRESH_COST} — a fresh gig landed on your desk.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
    return true;
  }, [gameState, setGameState]);

  const triggerEraTransition = useCallback(() => {
    const availableTransition = checkEraTransitionAvailable(gameState);
    
    if (!availableTransition) {
      gameAudio.playUISound('unavailable');
      toast({
        title: "❌ Era Transition Not Available",
        description: "You need more reputation, level, or completed projects to advance to the next era.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    const fromEra = gameState.currentEra;
    const toEra = availableTransition.id;

    const newGameState = transitionToEra(gameState, availableTransition);
    setGameState(newGameState);

    gameAudio.playUISound('projectComplete');
    triggerScreenShake('medium');
    toast({
      title: "🎉 Era Transition Complete!",
      description: `Welcome to ${availableTransition.name}! New equipment and opportunities await.`,
      className: "bg-gray-800 border-gray-600 text-white",
      duration: 6000
    });

    // Return transition info for animation
    return {
      fromEra,
      toEra
    };
  }, [gameState, setGameState]);

  return {
    advanceDay,
    refreshCandidates,
    refreshProjects,
    triggerEraTransition
  };
};
