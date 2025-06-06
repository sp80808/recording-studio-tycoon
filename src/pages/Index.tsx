
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { StaffMember, PlayerAttributes } from '@/types/game';
import { generateCandidates } from '@/utils/projectUtils';
import { availableTrainingCourses } from '@/data/training';
import { canPurchaseEquipment, addNotification, applyEquipmentEffects } from '@/utils/gameUtils';
import { availableEquipment } from '@/data/equipment';
import { ProjectList } from '@/components/ProjectList';
import { ActiveProject } from '@/components/ActiveProject';
import { RightPanel } from '@/components/RightPanel';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';
import { GameModals } from '@/components/GameModals';
import { EnhancedGameHeader } from '@/components/EnhancedGameHeader';
import { FloatingXPOrb } from '@/components/FloatingXPOrb';
import { RecruitmentModal } from '@/components/modals/RecruitmentModal';
import { StaffManagementModal } from '@/components/modals/StaffManagementModal';
import { useGameState } from '@/hooks/useGameState';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';
import { useGameActions } from '@/hooks/useGameActions';

const MusicStudioTycoon = () => {
  const { gameState, setGameState, focusAllocation, setFocusAllocation } = useGameState();
  
  const { levelUpPlayer, spendPerkPoint } = usePlayerProgression(gameState, setGameState);
  const { hireStaff, assignStaffToProject, unassignStaffFromProject, toggleStaffRest, addStaffXP, openTrainingModal } = useStaffManagement(gameState, setGameState);
  const { startProject, completeProject } = useProjectManagement(gameState, setGameState);
  const { advanceDay, refreshCandidates } = useGameActions(gameState, setGameState);

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<any>(null);

  const { performDailyWork, orbContainerRef, autoTriggeredMinigame, clearAutoTriggeredMinigame } = useStageWork(gameState, setGameState, focusAllocation, completeProject, addStaffXP, advanceDay);

  // Handle minigame rewards by updating project points
  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    if (gameState.activeProject) {
      setGameState(prev => ({
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

      toast({
        title: "Production Bonus!",
        description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
      });
    }
  };

  const handlePerformDailyWork = () => {
    console.log('=== HANDLE PERFORM DAILY WORK ===');
    const result = performDailyWork();
    if (result?.isComplete && result.review) {
      console.log('Project completed with review:', result.review);
      setLastReview(result.review);
      setShowReviewModal(true);
      
      if (gameState.playerData.xp + result.review.xpGain >= gameState.playerData.xpToNextLevel) {
        levelUpPlayer();
      }
    }
  };

  const purchaseEquipment = (equipmentId: string) => {
    console.log(`=== PURCHASING EQUIPMENT: ${equipmentId} ===`);
    
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment) {
      console.log('Equipment not found');
      return;
    }

    const purchaseCheck = canPurchaseEquipment(equipment, gameState);
    if (!purchaseCheck.canPurchase) {
      console.log(`Purchase blocked: ${purchaseCheck.reason}`);
      toast({
        title: "Cannot Purchase",
        description: purchaseCheck.reason,
        variant: "destructive"
      });
      return;
    }

    // Apply equipment effects and update state
    let updatedGameState = applyEquipmentEffects(equipment, gameState);
    
    // Deduct money and add equipment
    updatedGameState = {
      ...updatedGameState,
      money: updatedGameState.money - equipment.price,
      ownedEquipment: [...updatedGameState.ownedEquipment, equipment]
    };

    // Add success notification
    updatedGameState = addNotification(
      updatedGameState,
      `${equipment.name} purchased and equipped!`,
      'success',
      3000
    );

    setGameState(updatedGameState);

    toast({
      title: "Equipment Purchased!",
      description: `${equipment.name} added to your studio.`,
    });
  };

  const removeNotification = (id: string) => {
    setGameState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const sendStaffToTraining = (staffId: string, courseId: string) => {
    const course = availableTrainingCourses.find(c => c.id === courseId);
    const staff = gameState.hiredStaff.find(s => s.id === staffId);
    
    if (!course || !staff || gameState.money < course.cost || staff.status !== 'Idle') {
      return;
    }

    const updatedGameState = addNotification(
      gameState,
      `${staff.name} has started ${course.name}!`,
      'info',
      3000
    );

    setGameState(prev => ({
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
    }));

    toast({
      title: "Training Started",
      description: `${staff.name} will complete ${course.name} in ${course.duration} days.`,
    });
  };

  const handleOpenTrainingModal = (staff: StaffMember) => {
    if (openTrainingModal(staff)) {
      setSelectedStaffForTraining(staff);
      setShowTrainingModal(true);
    }
  };

  // Enhanced spendPerkPoint function
  const handleSpendPerkPoint = (attribute: keyof PlayerAttributes) => {
    console.log(`Spending perk point on: ${attribute}`);
    if (gameState.playerData.perkPoints <= 0) {
      toast({
        title: "No Perk Points",
        description: "Complete projects to earn perk points!",
        variant: "destructive"
      });
      return;
    }

    const updatedGameState = spendPerkPoint(attribute);
    setGameState(updatedGameState);

    toast({
      title: "Attribute Upgraded!",
      description: `${String(attribute).replace(/([A-Z])/g, ' $1').trim()} increased!`,
    });
  };

  // Add floating orb state
  const [floatingOrbs, setFloatingOrbs] = useState<Array<{
    id: string;
    amount: number;
    type: 'xp' | 'money' | 'skill';
  }>>([]);

  // Enhanced level up with visual feedback
  const handleLevelUp = () => {
    levelUpPlayer();
    
    // Add floating XP orb
    const orbId = `xp-${Date.now()}`;
    setFloatingOrbs(prev => [...prev, {
      id: orbId,
      amount: 100,
      type: 'xp'
    }]);

    // Remove orb after animation
    setTimeout(() => {
      setFloatingOrbs(prev => prev.filter(orb => orb.id !== orbId));
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-green-500/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="bg-gradient-to-r from-black/40 via-purple-900/30 to-black/40 backdrop-blur-sm border-b border-purple-500/30">
        <div className="flex justify-between items-center p-4">
          <div className="flex gap-6 items-center">
            <div className="stat-item text-green-400 font-bold text-lg">
              <span className="text-sm text-gray-300 mr-2">💰</span>
              ${gameState.money}
            </div>
            <div className="stat-item text-blue-400 font-medium">
              <span className="text-sm text-gray-300 mr-2">⭐</span>
              {gameState.reputation} Rep
            </div>
            <div className="stat-item text-yellow-400 font-medium">
              <span className="text-sm text-gray-300 mr-2">📅</span>
              Day {gameState.currentDay}
            </div>
            <div className="stat-item text-orange-400 font-medium">
              <span className="text-sm text-gray-300 mr-2">👥</span>
              {gameState.hiredStaff.length} Staff
            </div>
            {gameState.playerData.perkPoints > 0 && (
              <div className="stat-item text-pink-400 font-bold animate-pulse">
                <span className="text-sm text-gray-300 mr-2">🎯</span>
                {gameState.playerData.perkPoints} Perk Point{gameState.playerData.perkPoints !== 1 ? 's' : ''}!
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {gameState.playerData.level >= 2 && (
              <>
                {gameState.hiredStaff.length === 0 ? (
                  <RecruitmentModal 
                    gameState={gameState}
                    showRecruitmentModal={showRecruitmentModal}
                    setShowRecruitmentModal={setShowRecruitmentModal}
                    hireStaff={hireStaff}
                    refreshCandidates={refreshCandidates}
                  />
                ) : (
                  <StaffManagementModal 
                    gameState={gameState}
                    showStaffModal={showStaffModal}
                    setShowStaffModal={setShowStaffModal}
                    assignStaffToProject={assignStaffToProject}
                    unassignStaffFromProject={unassignStaffFromProject}
                    toggleStaffRest={toggleStaffRest}
                    openTrainingModal={handleOpenTrainingModal}
                  />
                )}
              </>
            )}
            
            <div className="text-right text-sm">
              <div className="text-white font-bold">Music Studio Tycoon</div>
              <div className="text-gray-400">
                {gameState.activeProject ? `Working: ${gameState.activeProject.title}` : 'No Active Project'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4 space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:h-[calc(100vh-140px)] relative">
        <div className="w-full sm:w-80 lg:w-96 animate-fade-in">
          <ProjectList 
            gameState={gameState}
            setGameState={setGameState}
            startProject={startProject}
          />
        </div>

        <div className="flex-1 relative min-h-[400px] sm:min-h-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <ActiveProject 
            gameState={gameState}
            focusAllocation={focusAllocation}
            setFocusAllocation={setFocusAllocation}
            performDailyWork={handlePerformDailyWork}
            onMinigameReward={handleMinigameReward}
          />
          
          <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
          
          {/* Floating XP/Money orbs */}
          {floatingOrbs.map(orb => (
            <FloatingXPOrb
              key={orb.id}
              amount={orb.amount}
              type={orb.type}
              onComplete={() => {
                setFloatingOrbs(prev => prev.filter(o => o.id !== orb.id));
              }}
            />
          ))}
        </div>

        <div className="w-full sm:w-80 lg:w-96 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <RightPanel 
            gameState={gameState}
            showSkillsModal={showSkillsModal}
            setShowSkillsModal={setShowSkillsModal}
            showAttributesModal={showAttributesModal}
            setShowAttributesModal={setShowAttributesModal}
            spendPerkPoint={handleSpendPerkPoint}
            advanceDay={advanceDay}
            purchaseEquipment={purchaseEquipment}
          />
        </div>
      </div>

      <TrainingModal
        isOpen={showTrainingModal}
        onClose={() => {
          setShowTrainingModal(false);
          setSelectedStaffForTraining(null);
        }}
        staff={selectedStaffForTraining}
        gameState={gameState}
        sendStaffToTraining={sendStaffToTraining}
      />

      <NotificationSystem
        notifications={gameState.notifications}
        removeNotification={removeNotification}
      />

      <GameModals
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        lastReview={lastReview}
      />
    </div>
  );
};

export default MusicStudioTycoon;
