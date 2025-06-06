
import { useCallback } from 'react';
import { GameState } from '@/types/game';
import { generateCandidates } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';

export const useGameActions = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const advanceDay = useCallback(() => {
    const newDay = gameState.currentDay + 1;
    console.log(`Advancing to day ${newDay}`);
    
    // Process training completions
    const completedTraining: string[] = [];
    const updatedStaff = gameState.hiredStaff.map(staff => {
      if (staff.status === 'Training' && staff.trainingEndDay && newDay >= staff.trainingEndDay) {
        completedTraining.push(`${staff.name} completed training!`);
        return {
          ...staff,
          status: 'Idle' as const,
          trainingEndDay: undefined,
          trainingCourse: undefined,
          energy: 100
        };
      }
      return staff;
    });

    // Calculate total salaries
    const totalSalaries = gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0);
    
    setGameState(prev => ({ 
      ...prev, 
      currentDay: newDay,
      money: prev.money - totalSalaries, // Deduct salaries
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
    
    // Process salary payments
    if (totalSalaries > 0) {
      if (gameState.money >= totalSalaries) {
        toast({
          title: "Salaries Paid",
          description: `Paid $${totalSalaries} in daily salaries.`,
        });
      } else {
        toast({
          title: "Cannot Pay Salaries!",
          description: `Need $${totalSalaries} for daily salaries. Staff morale will suffer.`,
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
        title: "Training Complete",
        description: message,
      });
    });
  }, [gameState, setGameState]);

  const refreshCandidates = useCallback(() => {
    const cost = 50;
    if (gameState.money < cost) {
      toast({
        title: "Insufficient Funds",
        description: `Need $${cost} to refresh candidate list.`,
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
      title: "New Candidates Found",
      description: "Fresh talent is now available for hire!",
    });
  }, [gameState.money, setGameState]);

  return {
    advanceDay,
    refreshCandidates
  };
};
