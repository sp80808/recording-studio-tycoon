
import { useCallback } from 'react';
import { GameState, StaffMember, EquipmentMod } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { availableTrainingCourses } from '@/data/training';
import { availableMods } from '@/data/equipmentMods';
import { getMoodEffectiveness } from '@/utils/playerUtils'; // Import from playerUtils

export const useStaffManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const hireStaff = useCallback((candidateIndex: number): boolean => {
    const candidate = gameState.availableCandidates[candidateIndex];
    if (!candidate) return false;

    const signingFee = candidate.salary * 3; // 3x daily salary as signing fee
    if (gameState.money < signingFee) {
      toast({
        title: "💰 Insufficient Funds",
        description: `Need $${signingFee} to hire ${candidate.name} (3x daily salary signing fee)`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    const newStaff = {
      ...candidate,
      id: `staff_${Date.now()}_${Math.random()}`,
      mood: 75 // Start with good mood
    };

    setGameState(prev => ({
      ...prev,
      money: prev.money - signingFee,
      hiredStaff: [...prev.hiredStaff, newStaff],
      availableCandidates: prev.availableCandidates.filter((_, index) => index !== candidateIndex)
    }));

    toast({
      title: "👥 Staff Hired!",
      description: `${candidate.name} has joined your studio as a ${candidate.role}.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });

    return true;
  }, [gameState.availableCandidates, gameState.money, setGameState]);

  const assignStaffToProject = useCallback((staffId: string) => {
    if (!gameState.activeProject) {
      toast({
        title: "❌ No Active Project",
        description: "Start a project before assigning staff.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff || staff.status !== 'Idle') return;

    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, status: 'Working' as const, assignedProjectId: prev.activeProject?.id || null }
          : s
      )
    }));

    toast({
      title: "📋 Staff Assigned",
      description: `${staff.name} is now working on the project.`,
      className: "bg-gray-800 border-gray-600 text-white",
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
      title: "📤 Staff Unassigned",
      description: `${staff?.name} is now idle.`,
      className: "bg-gray-800 border-gray-600 text-white",
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

    toast({
      title: staff.status === 'Idle' ? "😴 Staff Resting" : "💪 Staff Back to Work",
      description: `${staff.name} is now ${newStatus.toLowerCase()}.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
  }, [gameState.hiredStaff, setGameState]);

  const giveBonusToStaff = useCallback((staffId: string) => {
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    if (!staff) return;

    const bonusAmount = staff.salary * 2; // 2x daily salary as bonus
    if (gameState.money < bonusAmount) {
      toast({
        title: "💰 Insufficient Funds",
        description: `Need $${bonusAmount} to give ${staff.name} a bonus.`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - bonusAmount,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { ...s, mood: Math.min(100, s.mood + 30) }
          : s
      )
    }));

    toast({
      title: "💰 Bonus Given!",
      description: `${staff.name} received a $${bonusAmount} bonus and mood boost!`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
  }, [gameState.hiredStaff, gameState.money, setGameState]);

  const sendStaffToTraining = useCallback((staffId: string, courseId: string) => {
    const course = availableTrainingCourses.find(c => c.id === courseId);
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    
    if (!course || !staff || gameState.money < course.cost || staff.status !== 'Idle') {
      return;
    }

    if (staff.levelInRole < course.requiredLevel) {
      toast({
        title: "📈 Level Requirement Not Met",
        description: `${staff.name} needs to be level ${course.requiredLevel} to take this course.`,
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - course.cost,
      hiredStaff: prev.hiredStaff.map(s => 
        s.id === staffId 
          ? { 
              ...s, 
              status: 'Training' as const, 
              trainingEndDay: prev.currentDay + course.duration,
              trainingCourse: course.id,
              mood: Math.min(100, s.mood + 10) // Training boosts mood
            }
          : s
      )
    }));

    toast({
      title: "📚 Training Started",
      description: `${staff.name} will complete ${course.name} in ${course.duration} days.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
  }, [gameState, setGameState]);

  const addStaffXP = useCallback((staffId: string, amount: number) => {
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => {
        if (s.id === staffId) {
          const newXP = s.xpInRole + amount;
          const xpForNextLevel = s.levelInRole * 50;
          
          if (newXP >= xpForNextLevel) {
            const newLevel = s.levelInRole + 1;
            const statIncrease = 3;
            
            toast({
              title: "⭐ Staff Level Up!",
              description: `${s.name} reached level ${newLevel} in ${s.role}!`,
              className: "bg-gray-800 border-gray-600 text-white",
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
        title: "🔒 Training Locked",
        description: "Reach player level 3 to unlock staff training!",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return false;
    }
    return true;
  }, [gameState.playerData.level]);

  const getMoodEmoji = useCallback((mood: number) => {
    if (mood > 75) return '😊';
    if (mood >= 40) return '😐';
    return '😞';
  }, []);

  // getMoodEffectiveness is now imported from playerUtils

  const startResearchMod = useCallback((staffId: string, modId: string): boolean => {
    const staffMember = gameState.hiredStaff.find(s => s.id === staffId);
    const modToResearch = availableMods.find(m => m.id === modId);

    if (!staffMember) {
      toast({ title: "❌ Error", description: "Staff member not found.", className: "bg-gray-800 border-gray-600 text-white", variant: "destructive" });
      return false;
    }
    if (staffMember.role !== 'Engineer') {
      toast({ title: "⚙️ Invalid Role", description: `${staffMember.name} is not an Engineer and cannot research mods.`, className: "bg-gray-800 border-gray-600 text-white", variant: "destructive" });
      return false;
    }
    if (!modToResearch) {
      toast({ title: "❌ Error", description: "Selected mod not found.", className: "bg-gray-800 border-gray-600 text-white", variant: "destructive" });
      return false;
    }
    if (staffMember.status !== 'Idle') {
      toast({ title: "⏰ Staff Busy", description: `${staffMember.name} is currently ${staffMember.status.toLowerCase()}.`, className: "bg-gray-800 border-gray-600 text-white", variant: "destructive" });
      return false;
    }
    if (gameState.money < modToResearch.researchRequirements.cost) {
      toast({ title: "💰 Insufficient Funds", description: `Need $${modToResearch.researchRequirements.cost} to start research for ${modToResearch.name}.`, className: "bg-gray-800 border-gray-600 text-white", variant: "destructive" });
      return false;
    }

    // Check engineer skill level
    const requiredSkillName = modToResearch.researchRequirements.engineerSkill;
    const requiredSkillLevel = modToResearch.researchRequirements.engineerSkillLevel;
    const engineerSkillValue = staffMember.skills?.[requiredSkillName] || 0;

    if (engineerSkillValue < requiredSkillLevel) {
      toast({ 
        title: "📊 Skill Too Low", 
        description: `${staffMember.name} needs ${requiredSkillName} skill of ${requiredSkillLevel} (has ${engineerSkillValue}).`, 
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive" 
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - modToResearch.researchRequirements.cost,
      hiredStaff: prev.hiredStaff.map(s =>
        s.id === staffId
          ? {
              ...s,
              status: 'Researching' as const,
              researchingModId: modId,
              researchEndDay: prev.currentDay + modToResearch.researchRequirements.researchTime,
            }
          : s
      ),
    }));

    toast({
      title: "🔬 Research Started",
      description: `${staffMember.name} has started researching ${modToResearch.name}. It will take ${modToResearch.researchRequirements.researchTime} days.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
    return true;
  }, [gameState, setGameState]);

  return {
    hireStaff,
    assignStaffToProject,
    unassignStaffFromProject,
    toggleStaffRest,
    addStaffXP,
    openTrainingModal,
    sendStaffToTraining,
    giveBonusToStaff,
    getMoodEmoji,
    getMoodEffectiveness,
    startResearchMod
  };
};
