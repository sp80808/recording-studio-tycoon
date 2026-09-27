import { useCallback } from 'react';
import { GameState, Project, ProjectReport } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';
import { applyReportToState } from '@/game-mechanics/ProjectService';
import { withDailyTracking } from '@/utils/dailyChallenges';
import { gameAudio } from '@/utils/audioSystem';
import { triggerScreenShake } from '@/utils/screenShake';
import { applyCompletedSessionToRelationship, createClientRelationshipFromProject } from '@/utils/clientRelationshipUtils';
import { findAvailableStudioRoom } from '@/utils/studioRoomUtils';

export const useProjectManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const startProject = useCallback((project: Project) => {
    if (gameState.activeProject) {
      gameAudio.playUISound('staffUnavailable');
      toast({
        title: "🎵 Session Already Active",
        description: "Finish or move the current session before booking another into this workflow.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    const room = findAvailableStudioRoom(gameState, project);
    if (!room) {
      toast({
        title: "🏢 Studio Fully Booked",
        description: "No unlocked studio suite is currently free for this session.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      activeProject: {
        ...project,
        currentStageIndex: 0,
        completedStages: [],
        bookingRoomId: room.id,
        stages: project.stages.map(s => ({
          ...s,
          workUnitsCompleted: 0
        }))
      },
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
    }));

    toast({
      title: "🚀 Session Booked!",
      description: `Booked "${project.title}" into ${room.name}.`,
      className: "bg-gray-800 border-gray-600 text-white",
    });
    return true;
  }, [gameState, setGameState]);

  const completeProject = useCallback((projectReport: ProjectReport): ProjectReport => {
    const projectId = projectReport.projectId;

    setGameState(prev => {
      const settled = applyReportToState(prev, projectReport);

      const involvedStaffIds = new Set(
        prev.hiredStaff
          .filter(staff => staff.assignedProjectId === projectId)
          .map(staff => staff.id)
      );

      let updatedHiredStaff = [...settled.hiredStaff];

      const completedProject =
        prev.activeProject?.id === projectId
          ? prev.activeProject
          : prev.activeProjects?.find(project => project.id === projectId);

      const updatedClientRelationships = { ...(prev.clientRelationships || {}) };

      if (completedProject?.clientId && completedProject.clientName) {
        const existingRelationship =
          updatedClientRelationships[completedProject.clientId] ||
          createClientRelationshipFromProject(completedProject, prev.currentDay);

        if (existingRelationship) {
          updatedClientRelationships[completedProject.clientId] =
            applyCompletedSessionToRelationship(
              existingRelationship,
              projectReport.overallQualityScore,
              prev.currentDay
            );
        }

        updatedHiredStaff = updatedHiredStaff.map(staff => {
          if (!involvedStaffIds.has(staff.id)) return staff;

          const familiarity = { ...(staff.clientFamiliarity || {}) };
          familiarity[completedProject.clientId!] =
            (familiarity[completedProject.clientId!] || 0) + 1;

          return {
            ...staff,
            clientFamiliarity: familiarity
          };
        });
      }

      const nextEnquiries = generateNewProjects(
        1,
        settled.playerData.level,
        prev.currentEra,
        Object.values(updatedClientRelationships)
      );

      return withDailyTracking({
        ...settled,
        activeProject: null,
        activeProjects: (settled.activeProjects || []).filter(p => p.id !== projectId),
        availableProjects: [...settled.availableProjects, ...nextEnquiries],
        clientRelationships: updatedClientRelationships,
        hiredStaff: updatedHiredStaff,
      }, { earned: projectReport.moneyGained, projects: 1 });
    });

    // Game-feel punctuation (goj.3): fanfare + a solid screen shake on delivery.
    gameAudio.playUISound('projectComplete');
    triggerScreenShake('heavy');

    return projectReport;
  }, [setGameState]);

  return {
    startProject,
    completeProject
  };
};
