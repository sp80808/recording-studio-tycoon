
import { useCallback } from 'react';
import { GameState, StaffMember } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const useStaffManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const hireStaff = useCallback((candidateIndex: number): boolean => {
    const candidate = gameState.availableCandidates[candidateIndex];
    if (!candidate) return false;

    const signingFee = candidate.salary * 2;
    if (gameState.money < signingFee) {
      toast({
        title: "Insufficient Funds",
        description: `Need $${signingFee} to hire ${candidate.name} (2x salary signing fee)`,
        variant: "destructive"
      });
      return false;
    }

    const newStaff = {
      ...candidate,
      id: `staff_${Date.now()}_${Math.random()}`
    };

    setGameState(prev => ({
      ...prev,
      money: prev.money - signingFee,
      hiredStaff: [...prev.hiredStaff, newStaff],
      availableCandidates: prev.availableCandidates.filter((_, index) => index !== candidateIndex)
    }));

    toast({
      title: "Staff Hired!",
      description: `${candidate.name} has joined your studio as a ${candidate.role}.`,
    });

    return true;
  }, [gameState.availableCandidates, gameState.money, setGameState]);

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
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: 'Idle' as const, assignedProjectId: null }
          : s
      )
    }));

    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    toast({
      title: "Staff Unassigned",
      description: `${staff?.name} is now idle.`,
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

  return {
    hireStaff,
    assignStaffToProject,
    unassignStaffFromProject,
    toggleStaffRest,
    addStaffXP,
    openTrainingModal
  };
};
