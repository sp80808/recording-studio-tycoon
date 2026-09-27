
import { useCallback } from 'react';
import { GameNotification, GameState } from '@/types/game';
import { generateCandidates } from '@/utils/projectUtils';
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

/** Daily equipment upkeep: 0.1% of item price per day, minimum $2/item */
export const calculateEquipmentUpkeep = (equipment: GameState['ownedEquipment']): number => {
  if (!equipment || equipment.length === 0) return 0;
  return equipment.reduce((sum, item) => sum + Math.max(2, Math.round(item.price * 0.001)), 0);
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

        newNotifications.push({
          id: `random-event-${ev.id}-${newDay}`,
          message: `${ev.title}: ${summaryText}`,
          type: ev.type === 'opportunity' ? 'success' : ev.type === 'crisis' ? 'error' : 'info',
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
        toast({
          title: "💰 Daily Expenses Paid",
          description: `Paid $${totalSalaries} in salaries and $${equipmentUpkeep} in equipment upkeep.`,
          className: "bg-gray-800 border-gray-600 text-white",
        });
      } else {
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
      toast({
        title: `🎲 ${ev.title}`,
        description: ev.description,
        className: ev.type === 'crisis' ? "bg-red-950 border-red-700 text-white" : "bg-purple-950 border-purple-700 text-white",
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
      toast({
        title: "🎓 Training Complete!",
        description: message,
        className: "bg-gray-800 border-gray-600 text-white",
      });
    });

    completedResearch.forEach(message => {
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

    toast({
      title: "👥 New Candidates Found",
      description: "Fresh talent is now available for hire!",
      className: "bg-gray-800 border-gray-600 text-white",
    });
  }, [gameState.money, setGameState]);

  const triggerEraTransition = useCallback(() => {
    const availableTransition = checkEraTransitionAvailable(gameState);
    
    if (!availableTransition) {
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
    triggerEraTransition
  };
};
