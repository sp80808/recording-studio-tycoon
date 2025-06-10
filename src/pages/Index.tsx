import React, { useState, useEffect, useCallback } from 'react';
import { GameState, initialGameState, Project, StaffMember, PlayerAttributes, FocusAllocation } from '@/types/game';
import type { Band } from '@/types/bands';
import { useGameState } from '@/hooks/useGameState';
import { useGameplayLoop } from '@/hooks/useGameplayLoop';
import { useProgressionSystem } from '@/hooks/useProgressionSystem';
import { SplashScreen } from '@/components/SplashScreen';
import { EraSelectionModal } from '@/components/modals/EraSelectionModal';
import { TutorialModal } from '@/components/modals/TutorialModal';
import { GameHeader } from '@/components/GameHeader';
import { LeftPanel } from '@/components/LeftPanel';
import { MainGameContent } from '@/components/MainGameContent';
import { RightPanel } from '@/components/RightPanel';
import { GameModals } from '@/components/GameModals';
import { RewardFeedbackSystem } from '@/components/RewardFeedbackSystem';
import { generateInitialProjects } from '@/data/projectData';
import { generateStaffCandidates } from '@/data/staffData';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const { gameState, updateGameState, resetGameState } = useGameState();
  const { loopState, deliverMicroReward, generateVariedProjects } = useGameplayLoop(gameState, updateGameState);
  const { milestones, studioUpgrades, purchaseStudioUpgrade } = useProgressionSystem(gameState, updateGameState);
  
  const [showSplash, setShowSplash] = useState(true);
  const [showEraSelection, setShowEraSelection] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showBandModal, setShowBandModal] = useState(false);
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showEraProgressModal, setShowEraProgressModal] = useState(false);
  const [showCreateBandModal, setShowCreateBandModal] = useState(false);
  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({ 
    performance: 33, 
    soundCapture: 33, 
    layering: 34 
  });
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const { toast } = useToast();

  // Era selection
  const handleEraSelect = (era: string) => {
    updateGameState({ currentEra: era });
    setShowEraSelection(false);
    setShowTutorial(true);
  };

  // Enhanced project generation using the new system
  const generateProjects = useCallback(() => {
    const newProjects = generateVariedProjects();
    updateGameState((prev) => ({
      ...prev,
      availableProjects: [...prev.availableProjects, ...newProjects],
    }));
    deliverMicroReward('reputation', 1, 'New Projects Available!');
  }, [generateVariedProjects, updateGameState, deliverMicroReward]);

  // Start a project with micro-reward
  const startProject = (project: Project) => {
    setActiveProject(project);
    updateGameState((prev) => ({
      ...prev,
      availableProjects: prev.availableProjects.filter((p) => p.id !== project.id),
    }));
    deliverMicroReward('xp', 5, 'Project Started!');
  };

  // Work on a project
  const workOnProject = (creativityPoints: number, technicalPoints: number) => {
    if (!activeProject) return;

    const cPoints = Math.min(creativityPoints, activeProject.daysRemaining || 10);
    const tPoints = Math.min(technicalPoints, activeProject.daysRemaining || 10);

    updateGameState((prev) => {
      if (!activeProject) return prev;

      const updatedProject: Project = {
        ...activeProject,
        accumulatedCPoints: activeProject.accumulatedCPoints + cPoints,
        accumulatedTPoints: activeProject.accumulatedTPoints + tPoints,
        daysRemaining: (activeProject.daysRemaining || 10) - Math.max(cPoints, tPoints),
        workSessionCount: (activeProject.workSessionCount || 0) + 1,
      };

      setActiveProject(updatedProject);

      return {
        ...prev,
        projects: [...prev.projects, updatedProject],
      };
    });

    // Micro-reward for work sessions
    if (Math.random() > 0.7) { // 30% chance for bonus
      deliverMicroReward('xp', 2, 'Great Session!');
    }
  };

  // Complete a stage
  const completeStage = () => {
    if (!activeProject) return;

    updateGameState((prev) => {
      if (!activeProject) return prev;

      const updatedProject: Project = {
        ...activeProject,
        currentStage: (activeProject.currentStage || 0) + 1,
      };

      setActiveProject(updatedProject);

      return {
        ...prev,
        projects: [...prev.projects, updatedProject],
      };
    });

    deliverMicroReward('xp', 10, 'Stage Complete!');
  };

  // Complete a project
  const completeProject = () => {
    if (!activeProject) return;

    const baseXP = activeProject.difficulty * 25;
    const bonusXP = Math.floor(loopState.streakCount * 5);
    
    updateGameState((prev) => {
      const payout = activeProject.payoutBase + (loopState.streakCount * 50);
      const experienceGain = baseXP + bonusXP;

      return {
        ...prev,
        money: prev.money + payout,
        playerData: {
          ...prev.playerData,
          experience: (prev.playerData.experience || 0) + experienceGain,
          completedProjects: prev.playerData.completedProjects + 1,
        },
      };
    });

    deliverMicroReward('money', activeProject.payoutBase, 'Project Complete!');
    deliverMicroReward('xp', baseXP, 'Experience Gained!');
    
    setActiveProject(null);
    generateProjects();
  };

  // Trigger a minigame
  const triggerMinigame = (type: string, reason: string) => {
    updateGameState((prev) => ({
      ...prev,
      autoTriggeredMinigame: {
        type: type,
        reason: reason,
      },
    }));
  };

  // Buy equipment
  const buyEquipment = (equipmentId: string) => {
    updateGameState((prev) => ({
      ...prev,
      equipment: [...prev.equipment, equipmentId],
      money: prev.money - 1000,
    }));
  };

  // Hire staff
  const hireStaff = (candidateIndex: number): boolean => {
    const candidate = gameState.staffCandidates[candidateIndex];
    if (!candidate) {
      console.error(`No staff candidate at index ${candidateIndex}`);
      return false;
    }

    if (gameState.money < candidate.salary) {
      toast({
        title: "Insufficient Funds",
        description: `You cannot afford to hire ${candidate.name}.`,
        variant: "destructive",
      });
      return false;
    }

    updateGameState((prev) => {
      const newStaff = {
        ...candidate,
        isAvailable: true,
        isResting: false,
        skills: candidate.skills || {},
      };

      return {
        ...prev,
        staff: [...prev.staff, newStaff],
        hiredStaff: [...prev.hiredStaff, newStaff],
        staffCandidates: prev.staffCandidates.filter((_, index) => index !== candidateIndex),
        money: prev.money - candidate.salary,
      };
    });

    toast({
      title: "Staff Hired",
      description: `${candidate.name} has been hired!`,
    });

    return true;
  };

  // Train staff
  const trainStaff = (staff: StaffMember, skill: string) => {
    updateGameState((prev) => {
      const updatedStaff = prev.staff.map((s) => {
        if (s.id === staff.id) {
          return {
            ...s,
            skills: {
              ...(s.skills || {}),
              [skill]: (s.skills?.[skill] || 0) + 1,
            },
          };
        }
        return s;
      });

      return {
        ...prev,
        staff: updatedStaff,
      };
    });
  };

  // Upgrade studio
  const upgradeStudio = (studioId: string) => {
    updateGameState((prev) => ({
      ...prev,
      studioLevel: prev.studioLevel + 1,
    }));
  };

  // Refresh staff candidates
  const refreshCandidates = () => {
    const newCandidates = generateStaffCandidates(3);
    updateGameState((prev) => ({
      ...prev,
      staffCandidates: newCandidates,
    }));
  };

  // Assign staff to project
  const assignStaffToProject = (staffId: string) => {
    if (!activeProject) return;

    updateGameState((prev) => {
      const updatedStaff = prev.staff.map((s) => {
        if (s.id === staffId) {
          return {
            ...s,
            projectId: activeProject.id,
            isAvailable: false,
          };
        }
        return s;
      });

      return {
        ...prev,
        staff: updatedStaff,
      };
    });
  };

  // Unassign staff from project
  const unassignStaffFromProject = (staffId: string) => {
    updateGameState((prev) => {
      const updatedStaff = prev.staff.map((s) => {
        if (s.id === staffId) {
          return {
            ...s,
            projectId: null,
            isAvailable: true,
          };
        }
        return s;
      });

      return {
        ...prev,
        staff: updatedStaff,
      };
    });
  };

  // Toggle staff rest
  const toggleStaffRest = (staffId: string) => {
    updateGameState((prev) => {
      const updatedStaff = prev.staff.map((s) => {
        if (s.id === staffId) {
          return {
            ...s,
            isResting: !(s.isResting || false),
          };
        }
        return s;
      });

      return {
        ...prev,
        staff: updatedStaff,
      };
    });
  };

  // Open training modal
  const openTrainingModal = (staff: StaffMember): boolean => {
    setSelectedStaff(staff);
    setShowTrainingModal(true);
    return true;
  };

  // Spend perk point
  const spendPerkPoint = (attribute: keyof PlayerAttributes) => {
    updateGameState((prev) => {
      if (prev.playerData.perkPoints <= 0) {
        toast({
          title: "No Perk Points",
          description: "You don't have any perk points to spend.",
          variant: "destructive",
        });
        return prev;
      }

      const updatedPlayerData = {
        ...prev.playerData,
        attributes: {
          ...prev.playerData.attributes,
          [attribute]: prev.playerData.attributes[attribute] + 1,
        },
        perkPoints: prev.playerData.perkPoints - 1,
      };

      toast({
        title: "Perk Point Spent",
        description: `Your ${attribute} has increased!`,
      });

      return {
        ...prev,
        playerData: updatedPlayerData,
      };
    });
  };

  // Create band
  const createBand = (bandName: string, memberIds: string[]) => {
    setShowCreateBandModal(true);
  };

  // Recruit member
  const recruitMember = (band: Band, member: StaffMember) => {
    updateGameState((prev) => {
      const updatedBand = {
        ...band,
        memberIds: [...band.memberIds, member.id],
      };

      return {
        ...prev,
        bands: [...prev.bands, updatedBand],
      };
    });
  };

  // Create original track
  const createOriginalTrack = () => {
    updateGameState((prev) => ({
      ...prev,
      originalTracks: prev.originalTracks + 1,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Reward Feedback System */}
      <RewardFeedbackSystem 
        rewards={loopState.recentRewards}
        streakCount={loopState.streakCount}
      />

      {/* Splash Screen */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}

      {/* Era Selection Modal */}
      {showEraSelection && (
        <EraSelectionModal
          isOpen={showEraSelection}
          onClose={() => setShowEraSelection(false)}
          onEraSelect={handleEraSelect}
        />
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Main Game Interface */}
      {!showSplash && !showEraSelection && !showTutorial && (
        <div className="flex flex-col h-screen">
          {/* Game Header */}
          <GameHeader 
            gameState={gameState}
            onOpenSettings={() => setShowSettings(true)}
            hireStaff={hireStaff}
            refreshCandidates={refreshCandidates}
            assignStaffToProject={assignStaffToProject}
            unassignStaffFromProject={unassignStaffFromProject}
            toggleStaffRest={toggleStaffRest}
            openTrainingModal={openTrainingModal}
          />

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel */}
            <LeftPanel 
              gameState={gameState}
            />

            {/* Main Game Content */}
            <MainGameContent
              gameState={gameState}
              setGameState={updateGameState}
              focusAllocation={focusAllocation}
              setFocusAllocation={setFocusAllocation}
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              completeProject={completeProject}
              startProject={startProject}
              workOnProject={workOnProject}
              completeStage={completeStage}
              generateProjects={generateProjects}
              triggerMinigame={triggerMinigame}
              buyEquipment={buyEquipment}
              hireStaff={hireStaff}
              trainStaff={trainStaff}
              upgradeStudio={upgradeStudio}
              refreshCandidates={refreshCandidates}
              assignStaffToProject={assignStaffToProject}
              unassignStaffFromProject={unassignStaffFromProject}
              toggleStaffRest={toggleStaffRest}
              openTrainingModal={openTrainingModal}
              spendPerkPoint={spendPerkPoint}
              createBand={createBand}
              createOriginalTrack={createOriginalTrack}
            />

            {/* Right Panel */}
            <RightPanel
              gameState={gameState}
              setGameState={updateGameState}
              hireStaff={hireStaff}
              refreshCandidates={refreshCandidates}
              assignStaffToProject={assignStaffToProject}
              unassignStaffFromProject={unassignStaffFromProject}
              toggleStaffRest={toggleStaffRest}
              openTrainingModal={openTrainingModal}
              createBand={createBand}
              spendPerkPoint={spendPerkPoint}
            />
          </div>
        </div>
      )}

      {/* Game Modals */}
      <GameModals
        gameState={gameState}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showTrainingModal={showTrainingModal}
        setShowTrainingModal={setShowTrainingModal}
        selectedStaff={selectedStaff}
        trainStaff={trainStaff}
        showStaffModal={showStaffModal}
        setShowStaffModal={setShowStaffModal}
        hireStaff={hireStaff}
        refreshCandidates={refreshCandidates}
        assignStaffToProject={assignStaffToProject}
        unassignStaffFromProject={unassignStaffFromProject}
        toggleStaffRest={toggleStaffRest}
        openTrainingModal={openTrainingModal}
        showAttributesModal={showAttributesModal}
        setShowAttributesModal={setShowAttributesModal}
        spendPerkPoint={spendPerkPoint}
        showBandModal={showBandModal}
        setShowBandModal={setShowBandModal}
        createBand={createBand}
        selectedBand={selectedBand}
        setSelectedBand={setSelectedBand}
        recruitMember={recruitMember}
        showRecruitmentModal={showRecruitmentModal}
        setShowRecruitmentModal={setShowRecruitmentModal}
        showStudioModal={showStudioModal}
        setShowStudioModal={setShowStudioModal}
        upgradeStudio={upgradeStudio}
        showSkillsModal={showSkillsModal}
        setShowSkillsModal={setShowSkillsModal}
        showEraProgressModal={showEraProgressModal}
        setShowEraProgressModal={setShowEraProgressModal}
        showCreateBandModal={showCreateBandModal}
        setShowCreateBandModal={setShowCreateBandModal}
      />
    </div>
  );
}
