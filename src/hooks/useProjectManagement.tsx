import { applyLabelOutcome } from '@/rpg/labelAccounts';
import { depositFor } from '@/rpg/serviceQuote';
import { earn } from '@/economy/ledger';
import { useCallback } from 'react';
import { GameState, Project, ProjectReport } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';
import { toast } from '@/hooks/use-toast';
import { applyReportToState } from '@/game-mechanics/ProjectService';
import { withDailyTracking } from '@/utils/dailyChallenges';
import { gameAudio } from '@/utils/audioSystem';
import { triggerScreenShake } from '@/utils/screenShake';
import { applyCompletedSessionToRelationship, createClientRelationshipFromProject } from '@/utils/clientRelationshipUtils';
import { findAvailableStudioRoom, getOccupiedRoomIds, getOperationalStudioRooms } from '@/utils/studioRoomUtils';
import { advanceStory } from '@/narrative/storyProgression';
import { getOriginEffects } from '@/narrative/originPerks';
import { recordSeasonDelivery } from '@/rpg/studioSeasons';

export const useProjectManagement = (gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) => {
  const startProject = useCallback((project: Project) => {
    if (gameState.activeProject) {
      gameAudio.playUISound('staffUnavailable');
      toast({
        title: "🎵 Session Already Active",
        description: "Finish or move the current session before booking another into this workflow.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    // Honour a room the player picked while reading the forecast (#55) if it is still free.
    const preferred = project.bookingRoomId
      ? getOperationalStudioRooms(gameState).find(r => r.id === project.bookingRoomId && !getOccupiedRoomIds(gameState).has(r.id))
      : undefined;
    const room = preferred ?? findAvailableStudioRoom(gameState, project);
    if (!room) {
      toast({
        title: "🏢 Studio Fully Booked",
        description: "No unlocked studio suite is currently free for this session.",
        className: "bg-stone-800 border-stone-600 text-white",
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => {
      // Deposit (#51): cash timing only. It is banked now and taken off the payout at settlement.
      const deposit = depositFor(prev, project).amount;
      const banked = deposit > 0
        ? earn(prev, deposit, { category: 'deposit-income', projectId: project.id, sourceId: `deposit-${project.id}`, memo: project.title })
        : prev;
      return {
      ...banked,
      activeProject: {
        ...project,
        depositPaid: banked === prev ? undefined : deposit,
        currentStageIndex: 0,
        completedStages: [],
        bookingRoomId: room.id,
        bookedDay: prev.currentDay,
        stages: project.stages.map(s => ({
          ...s,
          workUnitsCompleted: 0
        }))
      },
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
      };
    });

    toast({
      title: "🚀 Session Booked!",
      description: `Booked "${project.title}" into ${room.name}.${depositFor(gameState, project).amount > 0 ? ` Deposit of $${depositFor(gameState, project).amount} banked.` : ""}`,
      className: "bg-stone-800 border-stone-600 text-white",
    });
    return true;
  }, [gameState, setGameState]);

  const completeProject = useCallback((projectReport: ProjectReport): ProjectReport => {
    const projectId = projectReport.projectId;

    setGameState(prev => {
      const settled = applyReportToState(prev, projectReport);
      if (settled === prev) return prev;

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
              prev.currentDay,
              getOriginEffects(prev).relationshipXpMultiplier
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
        Object.values(updatedClientRelationships),
        getOriginEffects(prev).repeatClientPremium,
        settled.reputation,
        prev.cityId,
      );

      const prevRelationship = completedProject?.clientId
        ? prev.clientRelationships?.[completedProject.clientId]
        : undefined;
      const nextRelationship = completedProject?.clientId
        ? updatedClientRelationships[completedProject.clientId]
        : undefined;
      const withSeasonLedger = recordSeasonDelivery(
        { ...settled, clientRelationships: updatedClientRelationships },
        {
          projectId,
          title: projectReport.projectTitle,
          clientKey: completedProject?.clientId,
          clientName: completedProject?.clientName,
          genre: completedProject?.genre,
          quality: projectReport.overallQualityScore,
          revenue: projectReport.moneyGained,
          sessionsBefore: prevRelationship?.sessionsCompleted ?? 0,
          sessionsAfter: nextRelationship?.sessionsCompleted ?? 0,
          tierBefore: prevRelationship?.tier,
          tierAfter: nextRelationship?.tier,
          staffName: projectReport.assignedPerson.type === 'staff' ? projectReport.assignedPerson.name : undefined,
          day: prev.currentDay,
        },
      );

      // Label contracts (#50): late or short delivery trims the fee and a little interest; a clean one earns a bonus.
      const withLabelOutcome = applyLabelOutcome(withSeasonLedger, completedProject, projectReport.overallQualityScore, projectReport.moneyGained);

      return advanceStory(
        withDailyTracking({
          ...withLabelOutcome,
          activeProject: null,
          activeProjects: (settled.activeProjects || []).filter(p => p.id !== projectId),
          availableProjects: [...settled.availableProjects, ...nextEnquiries],
          clientRelationships: updatedClientRelationships,
          hiredStaff: updatedHiredStaff,
        }, { earned: projectReport.moneyGained, projects: 1 }),
      );
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
