import { useCallback } from 'react';
import { GameState, StaffMember, Minigame } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const useStaffManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const hireStaff = (staffId: string) => {
    setGameState(prev => {
      const candidateToHire = prev.availableCandidates.find(candidate => candidate.id === staffId);
      
      if (!candidateToHire) {
        console.error(`Candidate with ID ${staffId} not found.`);
        return prev; // Return previous state if candidate not found
      }

      // Deduct hiring cost (assuming hiring cost is salary * 2 for now, adjust as needed)
      const hiringCost = candidateToHire.salary * 2;
      if (prev.money < hiringCost) {
         toast({
           title: "Insufficient Funds",
           description: `Need $${hiringCost} to hire ${candidateToHire.name}.`,
           variant: "destructive"
         });
         return prev; // Return previous state if insufficient funds
      }

      toast({
        title: "Staff Hired!",
        description: `${candidateToHire.name} has joined your studio!`, // Removed \n
        duration: 4000
      });

      return {
        ...prev,
        money: prev.money - hiringCost,
        hiredStaff: [...prev.hiredStaff, { ...candidateToHire, assignedProjectId: null, status: 'Idle', xpInRole: 0, levelInRole: 1, xpToNextLevelInRole: 100 }], // Add initial XP and level properties
        availableCandidates: prev.availableCandidates.filter(candidate => candidate.id !== staffId), // Remove hired candidate
      };
    });
  };

  const assignStaffToProject = useCallback((staffId: string) => {
    if (!gameState.activeProject) {
      toast({
        title: "No Active Project",
        description: "Start a project before assigning staff.",
        variant: "destructive"
      });
      return;
    }

    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff || staff.status !== 'Idle') return;

    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id);
    const roleCount = assignedStaff.filter(s => s.role === staff.role).length;
    
    if (roleCount >= 1) {
      toast({
        title: "Role Slot Filled",
        description: `Already have a ${staff.role} assigned to this project.`,
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: 'Working' as const, assignedProjectId: prev.activeProject?.id || null }
          : s
      )
    }));

    toast({
      title: "Staff Assigned",
      description: `${staff.name} is now working on the project.`,
    });
  }, [gameState.activeProject, gameState.hiredStaff, setGameState]);

  const unassignStaffFromProject = useCallback((staffId: string) => {
    const staffName = gameState.hiredStaff.find(s => s.id === staffId)?.name;
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: 'Idle' as const, assignedProjectId: null }
          : s
      )
    }));

    toast({
      title: "Staff Unassigned",
      description: `${staffName} is now idle.`,
    });
  }, [gameState.hiredStaff, setGameState]);

  const toggleStaffRest = useCallback((staffId: string) => {
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff || staff.status === 'Working') return;

    const newStatus = staff.status === 'Idle' ? 'Resting' : 'Idle';
    
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: newStatus as 'Idle' | 'Resting' }
          : s
      )
    }));
  }, [gameState.hiredStaff, setGameState]);

  const addStaffXP = useCallback((staffId: string, amount: number) => {
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => {
        if (s.id === staffId) {
          const newXP = s.xpInRole + amount;
          const xpForNextLevel = s.levelInRole * 50;
          
          if (newXP >= xpForNextLevel) {
            const newLevel = s.levelInRole + 1;
            const statIncrease = 2;
            
            toast({
              title: "Staff Level Up!",
              description: `${s.name} reached level ${newLevel} in ${s.role}!`,
            });

            return {
              ...s,
              xpInRole: newXP - xpForNextLevel,
              levelInRole: newLevel,
              primaryStats: {
                creativity: s.primaryStats.creativity + statIncrease,
                technical: s.primaryStats.technical + statIncrease,
                speed: s.primaryStats.speed + statIncrease
              }
            };
          }
          
          return { ...s, xpInRole: newXP };
        }
        return s;
      })
    }));
  }, [setGameState]);

  const openTrainingModal = useCallback((staff: StaffMember) => {
    if (gameState.playerData.level < 3) {
      toast({
        title: "Training Locked",
        description: "Reach player level 3 to unlock staff training!",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [gameState.playerData.level]);

  const startMinigame = useCallback((staffId: string, minigame: Minigame) => {
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff || staff.status !== 'Idle') {
      toast({
        title: "Staff Busy",
        description: "Staff must be idle to start practicing.",
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { 
              ...s, 
              status: 'Practicing',
              practicingMinigame: {
                name: minigame.name,
                endDay: prev.currentDay + minigame.duration,
                rewards: Object.fromEntries(
                  Object.entries(minigame.rewards).map(([stat, range]) => {
                    const rewardRange = range as { min: number; max: number };
                    return [
                      stat,
                      Math.floor(Math.random() * (rewardRange.max - rewardRange.min + 1)) + rewardRange.min
                    ];
                  })
                )
              }
            }
          : s
      )
    }));

    toast({
      title: "Practice Started",
      description: `${staff.name} is now practicing ${minigame.name}.`,
    });
    return true;
  }, [gameState.hiredStaff, setGameState]);

  const completeMinigame = useCallback((staffId: string) => {
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff || !staff.practicingMinigame) return;

    // Apply rewards
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => {
        if (s.id === staffId) {
          const rewards = staff.practicingMinigame?.rewards || {};
          return {
            ...s,
            status: 'Idle',
            practicingMinigame: undefined,
            primaryStats: {
              ...s.primaryStats,
              ...rewards
            }
          };
        }
        return s;
      })
    }));

    toast({
      title: "Practice Complete",
      description: `${staff.name} gained skills from ${staff.practicingMinigame.name}.`,
    });
  }, [gameState.hiredStaff, setGameState]);

  const checkMinigameCompletion = useCallback(() => {
    gameState.hiredStaff.forEach(staff => {
      if (staff.status === 'Practicing' && staff.practicingMinigame && 
          gameState.currentDay >= staff.practicingMinigame.endDay) {
        completeMinigame(staff.id);
      }
    });
  }, [gameState.hiredStaff, gameState.currentDay, completeMinigame]);

  return {
    hireStaff,
    assignStaffToProject,
    unassignStaffFromProject,
    toggleStaffRest,
    addStaffXP,
    openTrainingModal,
    startMinigame,
    completeMinigame,
    checkMinigameCompletion
  };
};
