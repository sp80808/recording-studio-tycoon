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
import { useGameState } from '@/hooks/useGameState';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import { useProjectManagement } from '@/hooks/useProjectManagement';
import { usePlayerProgression } from '@/hooks/usePlayerProgression';
import { useStageWork } from '@/hooks/useStageWork';

const MusicStudioTycoon = () => {
  const { gameState, setGameState, focusAllocation, setFocusAllocation } = useGameState();
  
  const { levelUpPlayer, spendPerkPoint } = usePlayerProgression(gameState, setGameState);
  const { hireStaff, assignStaffToProject, unassignStaffFromProject, toggleStaffRest, addStaffXP, openTrainingModal } = useStaffManagement(gameState, setGameState);
  const { startProject, completeProject } = useProjectManagement(gameState, setGameState);

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<any>(null);

  const advanceDay = () => {
    const newDay = gameState.currentDay + 1;
    console.log(`Advancing to day ${newDay}`);
    
    // Process training completions
    const completedTraining: string[] = [];
    const updatedStaff = gameState.hiredStaff.map(staff => {
      if (staff.status === 'Training' && staff.trainingEndDay && newDay >= staff.trainingEndDay) {
        const course = availableTrainingCourses.find(c => c.id === staff.trainingCourse);
        if (course) {
          completedTraining.push(`${staff.name} completed ${course.name}!`);
          
          const updatedStats = { ...staff.primaryStats };
          if (course.effects.statBoosts) {
            updatedStats.creativity += course.effects.statBoosts.creativity || 0;
            updatedStats.technical += course.effects.statBoosts.technical || 0;
            updatedStats.speed += course.effects.statBoosts.speed || 0;
          }
          
          return {
            ...staff,
            status: 'Idle' as const,
            primaryStats: updatedStats,
            trainingEndDay: undefined,
            trainingCourse: undefined,
            energy: 100
          };
        }
      }
      return staff;
    });

    let newGameState = { 
      ...gameState, 
      currentDay: newDay,
      hiredStaff: updatedStaff.map(s => 
        s.status === 'Resting' 
          ? { ...s, energy: Math.min(100, s.energy + 20) }
          : s
      )
    };

    completedTraining.forEach(message => {
      newGameState = addNotification(newGameState, message, 'success', 4000);
    });
    
    setGameState(newGameState);
    
    // Process salary payments every 7 days
    if (newDay % 7 === 0 && newDay > gameState.lastSalaryDay) {
      const totalSalaries = gameState.hiredStaff.reduce((total, staff) => total + staff.salary, 0);
      
      if (gameState.money >= totalSalaries) {
        setGameState(prev => ({
          ...prev,
          money: prev.money - totalSalaries,
          lastSalaryDay: newDay
        }));
        
        toast({
          title: "Salaries Paid",
          description: `Paid $${totalSalaries} in weekly salaries.`,
        });
      } else {
        toast({
          title: "Cannot Pay Salaries!",
          description: `Need $${totalSalaries} for weekly salaries. Staff morale will suffer.`,
          variant: "destructive"
        });
      }
    }

    if (newDay % 5 === 0) {
      setGameState(prev => ({
        ...prev,
        availableCandidates: generateCandidates(3)
      }));
    }
  };

  const { performDailyWork, orbContainerRef } = useStageWork(gameState, setGameState, focusAllocation, completeProject, addStaffXP, advanceDay);

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

    console.log(`Found equipment: ${equipment.name} - $${equipment.price}`);

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

    console.log('Purchase checks passed, processing purchase...');
    console.log(`Money before: $${gameState.money}`);

    // Apply equipment effects and update state
    let updatedGameState = applyEquipmentEffects(equipment, gameState);
    
    // Deduct money and add equipment
    updatedGameState = {
      ...updatedGameState,
      money: updatedGameState.money - equipment.price,
      ownedEquipment: [...updatedGameState.ownedEquipment, equipment]
    };

    console.log(`Money after: $${updatedGameState.money}`);
    console.log('Equipment added to owned equipment');

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

    console.log('PLAY_SOUND: equipment_purchase');
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

    console.log('PLAY_SOUND: attribute_upgrade');
  };

  // Add CSS styles dynamically
  useEffect(() => {
    const styleId = 'orb-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .orb {
          position: absolute;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          pointer-events: none;
          z-index: 1000;
        }
        
        .orb.creativity {
          background: linear-gradient(45deg, #3b82f6, #60a5fa);
          color: white;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
        
        .orb.technical {
          background: linear-gradient(45deg, #10b981, #34d399);
          color: white;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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

  // Enhanced purchase equipment with feedback
  const enhancedPurchaseEquipment = (equipmentId: string) => {
    const equipment = availableEquipment.find(e => e.id === equipmentId);
    if (!equipment) return;

    purchaseEquipment(equipmentId);
    
    // Add money orb effect
    const orbId = `money-${Date.now()}`;
    setFloatingOrbs(prev => [...prev, {
      id: orbId,
      amount: equipment.price,
      type: 'money'
    }]);

    setTimeout(() => {
      setFloatingOrbs(prev => prev.filter(orb => orb.id !== orbId));
    }, 2500);
  };

  // Enhanced daily work with XP feedback
  const handleEnhancedDailyWork = () => {
    console.log('=== ENHANCED DAILY WORK ===');
    const result = performDailyWork();
    
    if (result?.isComplete && result.review) {
      console.log('Project completed with review:', result.review);
      setLastReview(result.review);
      setShowReviewModal(true);
      
      // Add XP orb for completion
      const orbId = `completion-${Date.now()}`;
      setFloatingOrbs(prev => [...prev, {
        id: orbId,
        amount: result.review.xpGain,
        type: 'xp'
      }]);

      setTimeout(() => {
        setFloatingOrbs(prev => prev.filter(orb => orb.id !== orbId));
      }, 2500);
      
      if (gameState.playerData.xp + result.review.xpGain >= gameState.playerData.xpToNextLevel) {
        // Delay level up for better UX
        setTimeout(() => {
          handleLevelUp();
        }, 1000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-blue-500/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-green-500/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <EnhancedGameHeader 
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
            performDailyWork={handleEnhancedDailyWork}
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
            purchaseEquipment={enhancedPurchaseEquipment}
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
