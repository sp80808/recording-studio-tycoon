
import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { generateCandidates } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';
import { 
  calculateYearFromDay, 
  checkEraTransitionAvailable, 
  transitionToEra,
  getEraSpecificEquipmentMultiplier 
} from '@/utils/eraProgression';
import { availableMods } from '@/data/equipmentMods';

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
    let newResearchedMods = [...gameState.researchedMods];

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
      return updatedStaffMember;
    });

    // Calculate total salaries
    const totalSalaries = gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0);
    
    // Update equipment multiplier based on year progression
    const updatedEquipmentMultiplier = getEraSpecificEquipmentMultiplier(
      gameState.currentEra, 
      gameState.eraStartYear, 
      newYear
    );
    
    setGameState(prev => ({ 
      ...prev, 
      currentDay: newDay,
      currentYear: newYear,
      equipmentMultiplier: updatedEquipmentMultiplier,
      money: prev.money - totalSalaries, // Deduct salaries
      researchedMods: newResearchedMods, // Update researched mods
      hiredStaff: updatedStaff.map(s => 
        s.status === 'Resting' 
          ? { ...s, energy: Math.min(100, s.energy + 20) }
          : s
      ),
      playerData: {
        ...prev.playerData,
        dailyWorkCapacity: prev.playerData.attributes.focusMastery + 3 // Reset daily capacity
      }
    }));
    
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
    
    // Process salary payments
    if (totalSalaries > 0) {
      if (gameState.money >= totalSalaries) {
        toast({
          title: "💰 Salaries Paid",
          description: `Paid $${totalSalaries} in daily salaries.`,
          className: "bg-gray-800 border-gray-600 text-white",
        });
      } else {
        toast({
          title: "❌ Cannot Pay Salaries!",
          description: `Need $${totalSalaries} for daily salaries. Staff morale will suffer.`,
          className: "bg-gray-800 border-gray-600 text-white",
          variant: "destructive"
        });
      }
    }

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
