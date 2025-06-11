
import { useCallback } from 'react';
import { GameState, Project, ProjectReport, PlayerData, StaffMember, Skill } from '@/types/game'; // Added ProjectReport, PlayerData, StaffMember, Skill
import { generateNewProjects } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';
import { grantSkillXp } from '@/utils/skillUtils'; // Import grantSkillXp

export const useProjectManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const startProject = useCallback((project: Project) => {
    if (gameState.activeProject) {
      toast({
        title: "🎵 Project Already Active",
        description: "Complete your current project before starting another.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      activeProject: { ...project, currentStageIndex: 0 },
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
    }));

    toast({
      title: "🎵 Project Started!",
      description: `Now working on: ${project.title}`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
    return true;
  }, [gameState.activeProject, setGameState]);

  const completeProject = useCallback((projectReport: ProjectReport) => {
    // Rewards and overall XP are taken directly from the projectReport
    const { 
      moneyGained, 
      reputationGained, 
      playerManagementXpGained, 
      skillBreakdown, 
      assignedPerson,
      projectId 
    } = projectReport;

    // Calculate overall player XP gain from the sum of skill XP if player worked, or management XP if staff worked
    let totalPlayerXpFromSkills = 0;
    if (assignedPerson.type === 'player') {
      skillBreakdown.forEach(skillDetail => {
        totalPlayerXpFromSkills += skillDetail.xpGained; // Or a portion, TBD how overall player XP relates to skill XP
      });
    }
    // For now, let's use a simpler overall XP gain, can be refined.
    // The `xpGain` previously calculated can be considered as the base overall player XP.
    // Let's assume `generateProjectReview` provides a reasonable overall XP for the player.
    // For simplicity, we'll use a placeholder value or derive it.
    // The original `xpGain` was: 25 + Math.floor(qualityScore * 10);
    // Let's use overallQualityScore from report for a similar calculation for player's direct XP.
    const overallPlayerXpGain = assignedPerson.type === 'player' 
        ? (25 + Math.floor(projectReport.overallQualityScore / 10)) 
        : playerManagementXpGained;


    setGameState(prev => {
      let updatedPlayerData = { ...prev.playerData };
      let updatedHiredStaff = [...prev.hiredStaff];

      // Update player skills and overall XP if player worked
      if (assignedPerson.type === 'player' && assignedPerson.id === 'player') { // Assuming player ID is 'player'
        const newSkills = { ...updatedPlayerData.skills };
        skillBreakdown.forEach(skillDetail => {
          const skillName = skillDetail.skillName as keyof PlayerData['skills'];
          if (newSkills[skillName]) {
            newSkills[skillName] = {
              ...newSkills[skillName],
              xp: skillDetail.finalXp,
              level: skillDetail.finalLevel,
              xpToNextLevel: skillDetail.xpToNextLevelAfter,
            };
          }
        });
        updatedPlayerData = {
          ...updatedPlayerData,
          skills: newSkills,
          xp: updatedPlayerData.xp + overallPlayerXpGain, // Add overall XP
        };
      } else if (assignedPerson.type === 'staff') {
        // Update staff skills
        updatedHiredStaff = updatedHiredStaff.map(staff => {
          if (staff.id === assignedPerson.id) {
            const newSkills = { ...staff.skills } as StaffMember['skills']; // Type assertion
            skillBreakdown.forEach(skillDetail => {
              const skillName = skillDetail.skillName as keyof StaffMember['skills'];
               if (newSkills[skillName]) {
                newSkills[skillName] = {
                  ...newSkills[skillName],
                  xp: skillDetail.finalXp,
                  level: skillDetail.finalLevel,
                  xpToNextLevel: skillDetail.xpToNextLevelAfter,
                };
              }
            });
            // Also grant general role XP to staff (original logic: 20 + Math.floor(qualityScore * 5))
            const staffRoleXpGain = 20 + Math.floor(projectReport.overallQualityScore / 2); // Adjusted from qualityScore
            return { 
              ...staff, 
              skills: newSkills, 
              xpInRole: staff.xpInRole + staffRoleXpGain,
              status: 'Idle' as const, 
              assignedProjectId: null 
            };
          }
          return staff;
        });
        // Grant management XP to player if staff worked
        if (playerManagementXpGained > 0) {
            const managementSkill = updatedPlayerData.skills.management;
            const { updatedSkill: updatedManagementSkill } = grantSkillXp(managementSkill, playerManagementXpGained);
            updatedPlayerData = {
                ...updatedPlayerData,
                skills: {
                    ...updatedPlayerData.skills,
                    management: updatedManagementSkill,
                }
            };
        }
      }

      // Unassign any other staff that might have been on this project (if multi-staff per project is later supported)
      updatedHiredStaff = updatedHiredStaff.map(s => 
        s.assignedProjectId === projectId 
          ? { ...s, status: 'Idle' as const, assignedProjectId: null }
          : s
      );
      
      return {
        ...prev,
        money: prev.money + moneyGained,
        reputation: prev.reputation + reputationGained,
        activeProject: null, // Assuming single active project for now, will adapt if multi-project
        availableProjects: [...prev.availableProjects, ...generateNewProjects(1, updatedPlayerData.level, prev.currentEra)],
        playerData: updatedPlayerData,
        hiredStaff: updatedHiredStaff,
      };
    });

    // The function now implicitly returns void, or you can return the projectReport if needed elsewhere
    // For consistency with original, let's return a simplified review object or the report itself.
    // The original returned: { projectTitle, qualityScore, payout, repGain, xpGain, creativityPoints, technicalPoints }
    // We can construct something similar from projectReport if necessary, or just return projectReport.
    // For now, let's return the projectReport as it contains all info.
    return projectReport; 
  }, [setGameState]); // Removed gameState.hiredStaff from dependencies as it's read via prev in setGameState

  return {
    startProject,
    completeProject
  };
};
