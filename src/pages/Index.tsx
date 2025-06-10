
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, initialGameState, Project, StaffMember, PlayerAttributes, FocusAllocation } from '@/types/game';
import type { Band } from '@/types/bands';
import { useGameState } from '@/hooks/useGameState';
import { useGameplayLoop } from '@/hooks/useGameplayLoop';
import { useProgressionSystem } from '@/hooks/useProgressionSystem';
import { SplashScreen } from '@/components/SplashScreen';
import { EraSelectionModal } from '@/components/modals/EraSelectionModal';
import { TutorialModal } from '@/components/modals/TutorialModal';
import { GameModals } from '@/components/GameModals';
import { RewardFeedbackSystem } from '@/components/RewardFeedbackSystem';
import { generateInitialProjects } from '@/data/projectData';
import { generateStaffCandidates } from '@/data/staffData';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectList } from '@/components/ProjectList';
import { EnhancedActiveProject } from '@/components/EnhancedActiveProject';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { EquipmentList } from '@/components/EquipmentList';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { EraProgress } from '@/components/EraProgress';

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
      activeProject: project
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
        activeProject: updatedProject,
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
        activeProject: updatedProject,
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
        activeProject: null,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + experienceGain,
          completedProjects: prev.playerData.completedProjects + 1,
        },
      };
    });

    deliverMicroReward('money', activeProject.payoutBase, 'Project Complete!');
    deliverMicroReward('xp', baseXP, 'Experience Gained!');
    
    setActiveProject(null);
    generateProjects();
  };

  // Handle minigame reward
  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number, type: string) => {
    if (gameState.activeProject) {
      updateGameState(prev => ({
        ...prev,
        activeProject: prev.activeProject ? {
          ...prev.activeProject,
          accumulatedCPoints: prev.activeProject.accumulatedCPoints + creativityBonus,
          accumulatedTPoints: prev.activeProject.accumulatedTPoints + technicalBonus
        } : null,
        playerData: {
          ...prev.playerData,
          xp: prev.playerData.xp + xpBonus
        }
      }));
    }
  };

  // Staff management functions
  const hireStaff = (candidateIndex: number): boolean => {
    const candidate = gameState.staffCandidates[candidateIndex];
    if (!candidate) return false;

    if (gameState.money < candidate.salary) {
      toast({
        title: "Insufficient Funds",
        description: `You cannot afford to hire ${candidate.name}.`,
        variant: "destructive",
      });
      return false;
    }

    updateGameState((prev) => ({
      ...prev,
      staff: [...prev.staff, candidate],
      hiredStaff: [...prev.hiredStaff, candidate],
      staffCandidates: prev.staffCandidates.filter((_, index) => index !== candidateIndex),
      money: prev.money - candidate.salary,
    }));

    return true;
  };

  const refreshCandidates = () => {
    const newCandidates = generateStaffCandidates(3);
    updateGameState((prev) => ({
      ...prev,
      staffCandidates: newCandidates,
    }));
  };

  const assignStaffToProject = (staffId: string) => {
    if (!activeProject) return;
    updateGameState((prev) => ({
      ...prev,
      staff: prev.staff.map(s => s.id === staffId ? { ...s, projectId: activeProject.id, isAvailable: false } : s)
    }));
  };

  const unassignStaffFromProject = (staffId: string) => {
    updateGameState((prev) => ({
      ...prev,
      staff: prev.staff.map(s => s.id === staffId ? { ...s, projectId: null, isAvailable: true } : s)
    }));
  };

  const toggleStaffRest = (staffId: string) => {
    updateGameState((prev) => ({
      ...prev,
      staff: prev.staff.map(s => s.id === staffId ? { ...s, isResting: !s.isResting } : s)
    }));
  };

  const openTrainingModal = (staff: StaffMember): boolean => {
    setSelectedStaff(staff);
    setShowTrainingModal(true);
    return true;
  };

  const trainStaff = (staff: StaffMember, skill: string) => {
    updateGameState((prev) => ({
      ...prev,
      staff: prev.staff.map(s => s.id === staff.id ? {
        ...s,
        skills: { ...(s.skills || {}), [skill]: (s.skills?.[skill] || 0) + 1 }
      } : s)
    }));
  };

  const spendPerkPoint = (attribute: keyof PlayerAttributes) => {
    updateGameState((prev) => {
      if (prev.playerData.perkPoints <= 0) return prev;
      return {
        ...prev,
        playerData: {
          ...prev.playerData,
          attributes: { ...prev.playerData.attributes, [attribute]: prev.playerData.attributes[attribute] + 1 },
          perkPoints: prev.playerData.perkPoints - 1,
        },
      };
    });
  };

  const createBand = (bandName: string, memberIds: string[]) => {
    setShowCreateBandModal(true);
  };

  const recruitMember = (band: Band, member: StaffMember) => {
    updateGameState((prev) => ({
      ...prev,
      playerBands: [...prev.playerBands, { ...band, members: [...band.members, member.id] }],
    }));
  };

  const createOriginalTrack = () => {
    updateGameState((prev) => ({
      ...prev,
      originalTracks: prev.originalTracks + 1,
    }));
  };

  const buyEquipment = (equipmentId: string) => {
    updateGameState((prev) => ({
      ...prev,
      equipment: [...prev.equipment, equipmentId],
      money: prev.money - 1000,
    }));
  };

  const upgradeStudio = (studioId: string) => {
    updateGameState((prev) => ({
      ...prev,
      studioLevel: prev.studioLevel + 1,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
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

      {/* Main Game Interface - THREE COLUMN LAYOUT */}
      {!showSplash && !showEraSelection && !showTutorial && (
        <div className="flex flex-col h-screen">
          {/* Top Bar - Full Game Stats */}
          <div className="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 text-white p-4 shadow-lg">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎵</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Recording Studio Tycoon</h1>
                    <div className="text-sm opacity-90">Professional Studio</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="text-white hover:bg-orange-500/20">
                      📅 Day {gameState.currentDay} ({gameState.currentYear})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-orange-50 border-orange-200">
                    <EraProgress 
                      gameState={gameState}
                      triggerEraTransition={() => {}}
                    />
                  </DialogContent>
                </Dialog>

                <div className="flex items-center gap-2 bg-green-600/20 rounded-lg px-3 py-2">
                  <span>💰</span>
                  <span className="font-bold">${gameState.money.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 bg-purple-600/20 rounded-lg px-3 py-2">
                  <span>⭐</span>
                  <span className="font-bold">{gameState.reputation} Rep</span>
                </div>

                <div className="flex items-center gap-2 bg-blue-600/20 rounded-lg px-3 py-2">
                  <span>💡</span>
                  <span className="font-bold">Level {gameState.playerData.level}</span>
                </div>

                <div className="flex items-center gap-2 bg-yellow-600/20 rounded-lg px-3 py-2">
                  <span>👥</span>
                  <span className="font-bold">{gameState.hiredStaff.length} Staff</span>
                </div>

                <div className="flex items-center gap-2 bg-orange-600/20 rounded-lg px-3 py-2">
                  <span>⚡</span>
                  <span className="font-bold">{gameState.playerData.perkPoints} Points</span>
                </div>
              </div>
            </div>
          </div>

          {/* Three Column Layout */}
          <div className="flex-1 flex">
            {/* LEFT COLUMN - Available Projects */}
            <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-orange-200 p-4">
              <ProjectList
                gameState={gameState}
                setGameState={updateGameState}
                startProject={startProject}
              />
            </div>

            {/* CENTER COLUMN - Active Project or Placeholder */}
            <div className="flex-1 bg-gradient-to-br from-orange-50/50 to-yellow-50/50 p-6">
              {gameState.activeProject ? (
                <EnhancedActiveProject
                  gameState={gameState}
                  focusAllocation={focusAllocation}
                  setFocusAllocation={setFocusAllocation}
                  performDailyWork={() => workOnProject(10, 10)}
                  onMinigameReward={handleMinigameReward}
                />
              ) : (
                <Card className="h-full bg-white/80 border-orange-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎤</div>
                    <h2 className="text-2xl font-bold text-orange-700 mb-2">No Active Project</h2>
                    <p className="text-orange-600">Select a project from the left panel to start recording!</p>
                  </div>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN - Player Status & Actions */}
            <div className="w-80 bg-white/90 backdrop-blur-sm border-l border-orange-200 p-4 space-y-4">
              {/* Your Progress Widget */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                  ⭐ Your Progress
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-blue-600">Level {gameState.playerData.level}</span>
                      <span className="text-sm text-blue-600">{gameState.playerData.xp} XP</span>
                    </div>
                    <Progress value={gameState.playerData.xp % 100} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowSkillsModal(true)} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      🎯 Skills
                    </Button>
                    <Button onClick={() => setShowAttributesModal(true)} size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                      💪 Attributes
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Daily Actions Widget */}
              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
                  📅 Daily Actions
                </h3>
                <Button 
                  onClick={() => updateGameState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }))}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 transition-all duration-200 hover:scale-105 active:scale-98"
                >
                  ⏰ Next Day
                </Button>
              </Card>

              {/* Equipment Shop Widget */}
              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <h3 className="text-lg font-bold text-yellow-700 mb-3 flex items-center gap-2">
                  🛒 Equipment Shop
                </h3>
                <div className="space-y-2 mb-3">
                  <div className="text-sm text-yellow-600">Featured Items:</div>
                  <div className="text-xs text-yellow-600">• Vintage Microphone - $1,200</div>
                  <div className="text-xs text-yellow-600">• Audio Interface - $800</div>
                  <div className="text-xs text-yellow-600">• Studio Monitors - $1,500</div>
                </div>
                <Button 
                  onClick={() => {}} 
                  variant="outline" 
                  className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                >
                  View All Equipment
                </Button>
              </Card>

              {/* Staff Management Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => setShowStaffModal(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white transition-all duration-200 hover:scale-105 active:scale-98"
                >
                  👥 My Staff ({gameState.hiredStaff.length})
                </Button>
                <Button
                  onClick={() => setShowRecruitmentModal(true)}
                  variant="outline"
                  className="w-full border-orange-400 text-orange-700 hover:bg-orange-100"
                >
                  🔍 Recruitment Center
                </Button>
              </div>
            </div>
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
