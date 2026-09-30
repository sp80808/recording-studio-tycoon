
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
import {
  createInitialChoreState,
  refreshDailyChores,
  processAutomaticChores,
  autoAssignAvailableChores
} from '@/simulation/choreEngine';
import { evaluateStorylineTick } from '@/narrative/branchingStorylineEngine';
import {
  NEUTRAL_ORIGIN_EFFECTS,
  applyUpkeepDiscount,
  getOriginEffects,
  gigRefreshCostFor,
  type OriginEffects,
} from '@/narrative/originPerks';

/** Daily equipment upkeep: 0.1% of item price per day, minimum $2/item */
export const calculateEquipmentUpkeep = (
  equipment: GameState['ownedEquipment'],
  effects: OriginEffects = NEUTRAL_ORIGIN_EFFECTS,
): number => {
  if (!equipment || equipment.length === 0) return 0;
  const base = equipment.reduce((sum, item) => sum + Math.max(2, Math.round(item.price * 0.001)), 0);
  return applyUpkeepDiscount(base, effects);
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
    const equipmentUpkeep = calculateEquipmentUpkeep(gameState.ownedEquipment, getOriginEffects(gameState));
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
      // Refresh studio daily chores and evaluate streak crates
      const initialChore = prev.choreState || createInitialChoreState();
      const { nextChoreState: refreshedChores, crateAwarded } = refreshDailyChores(initialChore, newDay);

      // Auto-assign any unassigned chores if staff available
      const assignedChores = autoAssignAvailableChores(refreshedChores, updatedStaff as any);

      // Automatically execute assigned chores based on staff ability & speed
      const { nextChoreState: autoProcessedChores, completedChores, staffEnergyDeltas, staffXpGained } =
        processAutomaticChores(assignedChores, updatedStaff as any);

      // Apply staff energy deltas & XP
      const staffAfterChores = updatedStaff.map(s => {
        const delta = staffEnergyDeltas[s.id] || 0;
        const xp = staffXpGained[s.id] || 0;
        return {
          ...s,
          energy: Math.max(0, s.energy + delta),
          xpInRole: (s.xpInRole || 0) + xp
        };
      });

      const updatedPendingCrates = prev.pendingCrates ? [...prev.pendingCrates] : [];
      if (crateAwarded) {
        updatedPendingCrates.push({
          id: `crate-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          era: prev.selectedEra || '1970s',
          source: 'chore_streak',
          tier: 'vintage_flight_case'
        });
      }

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
        dailyTracking: freshDailyTracking(newDay, prev.dailyTracking), // New day, new challenge (streak carried)
        hiredStaff: staffAfterChores.map(s => 
          s.status === 'Resting' 
            ? { ...s, energy: Math.min(100, s.energy + 20) }
            : s
        ),
        playerData: {
          ...prev.playerData,
          dailyWorkCapacity: prev.playerData.attributes.focusMastery + 3 + prev.playerData.level - 1
        },
        choreState: autoProcessedChores,
        pendingCrates: updatedPendingCrates
      };

      if (triggeredEvents.length === 0) {
        return evaluateStorylineTick(baseUpdatedState);
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

      return evaluateStorylineTick({
        ...postEventsState,
        notifications: [...postEventsState.notifications, ...newNotifications]
      });
    });
    
    // Show era transition notification if available
    if (availableTransition) {
      toast({
        title: "🎵 Era Transition Available!",
        description: `You can now advance to ${availableTransition.name}. Check the Studio tab for transition options.`,
        className: "bg-stone-800 border-stone-600 text-white",
        duration: 6000
      });
    }
    
    // Show year progression notifications at key milestones
    if (newDay % 90 === 0) { // Every ~year
      toast({
        title: `📅 Year ${newYear}`,
        description: `Your studio has been operating for ${Math.floor(newDay / 90)} years. Keep pushing forward!`,
        className: "bg-stone-800 border-stone-600 text-white",
        duration: 4000
      });
    }
    
    // Successful payroll is audible + visible in the money ticker — skip routine toast spam.
    if (totalDailyExpenses > 0) {
      if (canAffordSalaries) {
        gameAudio.playUISound('cashRegister');
      } else {
        gameAudio.playUISound('staffUnavailable');
        triggerScreenShake('light');
        toast({
          title: "❌ Cannot Pay Salaries!",
          description: `Need $${totalSalaries} for daily salaries. Staff morale has dropped!`,
          className: "bg-stone-800 border-stone-600 text-white",
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
        className: "bg-stone-800 border-stone-600 text-white",
      });
    });

    completedResearch.forEach(message => {
      gameAudio.playUISound('notification');
      toast({
        title: "🔬 Research Complete!",
        description: message,
        className: "bg-stone-800 border-stone-600 text-white",
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
        className: "bg-stone-800 border-stone-600 text-white",
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
      className: "bg-stone-800 border-stone-600 text-white",
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
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive",
      });
      return false;
    }

    const refreshCost = gigRefreshCostFor(GIG_REFRESH_COST, getOriginEffects(gameState));
    if (gameState.money < refreshCost) {
      gameAudio.playUISound('unavailable');
      toast({
        title: "💰 Insufficient Funds",
        description: `Need $${refreshCost} to chase new gigs.`,
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive",
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - refreshCost,
      lastGigRefreshDay: prev.currentDay,
      availableProjects: [
        ...prev.availableProjects,
        ...generateNewProjects(1, prev.playerData.level, prev.currentEra),
      ],
    }));

    gameAudio.playUISound('notice');
    toast({
      title: "📞 New Leads",
      description: refreshCost > 0 ? `Paid $${refreshCost} — a fresh gig landed on your desk.` : 'A fresh gig landed on your desk — no fee for you.',
      className: "bg-stone-800 border-stone-600 text-white",
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
        className: "bg-stone-800 border-stone-600 text-white",
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
      className: "bg-stone-800 border-stone-600 text-white",
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
