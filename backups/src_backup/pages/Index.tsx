import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { StaffMember, Project, GameState, ProjectCompletionResult, PlayerAttributes } from '@/types/game';
import { generateCandidates } from '@/utils/projectUtils';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { availableEquipment } from '@/data/equipment';
import { GameHeader } from '@/components/GameHeader';
import { ProjectList } from '@/components/ProjectList';
import { ActiveProject } from '@/components/ActiveProject';
import { RightPanel } from '@/components/RightPanel';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { RecruitmentModal } from '@/components/modals/RecruitmentModal';
import { GameModals } from '@/components/GameModals';
import { useGameState } from '@/hooks/useGameState';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';
import { ProjectWorkView } from '@/components/ProjectWorkView';
import { MinigameManager } from '@/components/miniGames/MinigameManager';
import { ProjectCompletionModal } from '@/components/ProjectCompletionModal';
import { MinigameTrigger } from '@/types/game';

const MusicStudioTycoon = React.memo(() => {
  const { gameState, setGameState, focusAllocation, setFocusAllocation } = useGameState();
  
  const { addXP, spendPerkPoint, spendAttributePoint, recentXPGain } = usePlayerProgression(
    gameState,
    setGameState
  );

  const { hireStaff, assignStaffToProject, unassignStaffFromProject, toggleStaffRest, openTrainingModal } = useStaffManagement(gameState, setGameState);
  const {
    startProject,
    addWork,
    completeProject,
    activeMinigame,
    setActiveMinigame,
    handleMinigameComplete
  } = useProjectManagement({ gameState, setGameState });

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<ProjectCompletionResult['review'] | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedProject, setCompletedProject] = useState<Project | null>(null);

  const removeNotification = useCallback((notificationId: string): void => {
    setGameState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId),
    }));
  }, [setGameState]);

  const handleProjectComplete = useCallback((project: Project) => {
    setCompletedProject(project);
    setShowCompletionModal(true);
  }, []);

  const advanceDay = useCallback(() => {
    setGameState(prev => {
      const newDay = prev.currentDay + 1;
      const updatedStaff = prev.hiredStaff.map(staff => {
        if (staff.status === 'Working') {
          return { ...staff, energy: Math.max(0, staff.energy - 10) };
        }
        if (staff.status === 'Resting') {
          return { ...staff, energy: Math.min(100, staff.energy + 20) };
        }
        return staff;
      });

      const isSalaryDay = (newDay % 7 === 0 && newDay > prev.lastSalaryDay);
      const totalSalaries = updatedStaff.reduce((total, staff) => total + staff.salary, 0);

      if (isSalaryDay) {
        if (prev.money >= totalSalaries) {
          toast({
            title: "Salaries Paid",
            description: `Paid $${totalSalaries} in weekly salaries.`,
          });
          return {
            ...prev,
            currentDay: newDay,
            hiredStaff: updatedStaff,
            money: prev.money - totalSalaries,
            lastSalaryDay: newDay
          };
        } else {
          toast({
            title: "Cannot Pay Salaries!",
            description: `Need $${totalSalaries} for weekly salaries. Staff morale will suffer.`,
            variant: "destructive"
          });
        }
      }

      if (newDay % 5 === 0) {
        return {
          ...prev,
          currentDay: newDay,
          hiredStaff: updatedStaff,
          availableCandidates: [...prev.availableCandidates, ...generateCandidates(3)]
        };
      }

      return {
        ...prev,
        currentDay: newDay,
        hiredStaff: updatedStaff
      };
    });
  }, [setGameState]);

  const purchaseEquipment = useCallback((equipmentId: string) => {
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment) return;

    const purchaseCheck = canPurchaseEquipment(equipment, gameState);
    if (!purchaseCheck.canPurchase) {
      toast({
        title: "Cannot Purchase",
        description: purchaseCheck.reason,
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => {
      const updatedState = applyEquipmentEffects(equipment, prev);
      return {
        ...updatedState,
        money: updatedState.money - equipment.price,
        ownedEquipment: [...updatedState.ownedEquipment, equipment]
      };
    });

    toast({
      title: "Equipment Purchased!",
      description: `${equipment.name} added to your studio.`,
    });
  }, [gameState, setGameState]);

  const sendStaffToTraining = useCallback((staffId: string, courseId: string) => {
    const course = availableTrainingCourses.find(c => c.id === courseId);
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    
    if (!course || !staff || gameState.money < course.cost || staff.status !== 'Idle') {
      return;
    }

    setGameState(prev => {
      const updatedGameState = addNotification(
        prev,
        `${staff.name} has started ${course.name}!`,
        'info',
        3000
      );

      return {
        ...updatedGameState,
        money: prev.money - course.cost,
        hiredStaff: prev.hiredStaff.map(s => 
          s.id === staffId 
            ? { 
                ...s, 
                status: 'Training' as const, 
                trainingEndDay: prev.currentDay + course.duration,
                trainingCourse: course.id
              }
            : s
        )
      };
    });

    toast({
      title: "Training Started",
      description: `${staff.name} will complete ${course.name} in ${course.duration} days.`,
    });
  }, [gameState, setGameState]);

  const { performDailyWork, orbContainerRef } = useStageWork(
    gameState,
    setGameState,
    focusAllocation,
    useCallback((staffId, amount) => {
      setGameState(prev => ({
        ...prev,
        hiredStaff: prev.hiredStaff.map(staff => {
          if (staff.id === staffId) {
            const updatedStaff = { ...staff, xp: staff.xp + amount };
            const xpToNextLevel = updatedStaff.xpToNextLevelInRole || 100;
            if (updatedStaff.xp >= xpToNextLevel) {
              return { 
                ...updatedStaff, 
                levelInRole: updatedStaff.levelInRole + 1, 
                xp: updatedStaff.xp - xpToNextLevel, 
                xpToNextLevelInRole: Math.max(1, Math.floor(xpToNextLevel * 1.5)) 
              };
            }
            return updatedStaff;
          }
          return staff;
        })
      }));

      const leveledUpStaff = gameState.hiredStaff.find(staff => staff.id === staffId);
      if (leveledUpStaff && 
          leveledUpStaff.xp + amount >= (leveledUpStaff.xpToNextLevelInRole || 100) && 
          (leveledUpStaff.xp < (leveledUpStaff.xpToNextLevelInRole || 100))) {
        toast({
          title: "Staff Leveled Up!",
          description: `${leveledUpStaff.name} is now Level ${leveledUpStaff.levelInRole + 1} in their role!`,
          duration: 4000
        });
      }
    }, [gameState, setGameState]),
    handleProjectComplete
  );

  const handlePerformDailyWork = useCallback(() => {
    const result = performDailyWork();
    if (result) {
      setLastReview(result.review);
      setShowReviewModal(true);
      addXP(result.xpGain);
    }
  }, [performDailyWork, addXP]);

  const handleOpenTrainingModal = useCallback((staff: StaffMember): boolean => {
    if (openTrainingModal(staff)) {
      setSelectedStaffForTraining(staff);
      setShowTrainingModal(true);
      return true;
    }
    return false;
  }, [openTrainingModal]);

  const handleMinigameTrigger = useCallback((trigger: MinigameTrigger) => {
    setActiveMinigame(trigger);
  }, [setActiveMinigame]);

  const handleWorkAction = useCallback((
    type: 'creativity' | 'technical',
    value: number
  ) => {
    addWork(type, value, 'player');
  }, [addWork]);

  useEffect(() => {
    if (gameState.activeProject) {
      const currentStage = gameState.activeProject.stages[gameState.activeProject.currentStageIndex];
      if (currentStage.workUnitsCompleted >= currentStage.workUnitsRequired) {
        if (gameState.activeProject.currentStageIndex === gameState.activeProject.stages.length - 1) {
          // The project completion logic is now handled within performDailyWork
          // const result = completeProject(gameState);
          // if (result) {
          //   setCompletedProject(gameState.activeProject);
          //   setShowCompletionModal(true);
          // }
        }
      }
    }
  }, [gameState.activeProject]); // Removed completeProject from dependencies as it's no longer called here

  return (
    <>
      <div className="flex flex-col h-screen">
        <GameHeader
          gameState={gameState}
          showStudioModal={showStudioModal}
          setShowStudioModal={setShowStudioModal}
          showStaffModal={showStaffModal}
          setShowStaffModal={setShowStaffModal}
          showRecruitmentModal={showRecruitmentModal}
          setShowRecruitmentModal={setShowRecruitmentModal}
          assignStaffToProject={assignStaffToProject}
          unassignStaffFromProject={unassignStaffFromProject}
          toggleStaffRest={toggleStaffRest}
          hireStaff={hireStaff}
          openTrainingModal={handleOpenTrainingModal}
        />
        <div className="flex-1 flex">
          <ProjectList
            gameState={gameState}
            setGameState={setGameState}
            startProject={startProject}
          />
          <ActiveProject
            gameState={gameState}
            focusAllocation={focusAllocation}
            setFocusAllocation={setFocusAllocation as React.Dispatch<React.SetStateAction<typeof focusAllocation>>}
            performDailyWork={handlePerformDailyWork}
            advanceDay={advanceDay}
            setGameState={setGameState}
          />
          <RightPanel
            gameState={gameState}
            showSkillsModal={showSkillsModal}
            setShowSkillsModal={setShowSkillsModal}
            showAttributesModal={showAttributesModal}
            setShowAttributesModal={setShowAttributesModal}
            spendPerkPoint={spendPerkPoint}
            advanceDay={advanceDay}
            purchaseEquipment={purchaseEquipment}
          />
        </div>
        <NotificationSystem
          notifications={gameState.notifications}
          removeNotification={removeNotification}
        />
        <GameModals
          showReviewModal={showReviewModal}
          setShowReviewModal={setShowReviewModal}
          lastReview={lastReview}
          showProgressionModal={showProgressionModal}
          setShowProgressionModal={setShowProgressionModal}
          attributes={gameState.playerData.attributes}
          attributePoints={gameState.playerData.attributePoints}
          perkPoints={gameState.playerData.perkPoints}
          level={gameState.playerData.level}
          studioSkills={gameState.studioSkills}
          onSpendAttributePoint={spendAttributePoint}
          onSpendPerkPoint={spendPerkPoint}
        />
        {selectedStaffForTraining && (
          <TrainingModal
            isOpen={showTrainingModal}
            onClose={() => setShowTrainingModal(false)}
            staff={selectedStaffForTraining}
            gameState={gameState}
            sendStaffToTraining={sendStaffToTraining}
          />
        )}
        <RecruitmentModal
          isOpen={showRecruitmentModal}
          onClose={() => setShowRecruitmentModal(false)}
          gameState={gameState}
          hireStaff={hireStaff}
        />
        {activeMinigame && (
          <MinigameManager
            minigameType={activeMinigame.type}
            difficulty={activeMinigame.difficulty}
            onComplete={handleMinigameComplete}
            onCancel={() => setActiveMinigame(null)}
          />
        )}
        {showCompletionModal && completedProject && (
          <ProjectCompletionModal
            project={completedProject}
            onClose={() => setShowCompletionModal(false)}
          />
        )}
      </div>
    </>
  );
});

MusicStudioTycoon.displayName = 'MusicStudioTycoon';

export default MusicStudioTycoon;
