
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { GameState, FocusAllocation, PlayerAttributes, StaffMember, TrainingCourse } from '@/types/game';
import { generateNewProjects, generateCandidates } from '@/utils/projectUtils';
import { availableTrainingCourses } from '@/data/training';
import { calculateStudioSkillBonus, getEquipmentBonuses, canPurchaseEquipment, addNotification } from '@/utils/gameUtils';
import { GameHeader } from '@/components/GameHeader';
import { ProjectList } from '@/components/ProjectList';
import { ActiveProject } from '@/components/ActiveProject';
import { RightPanel } from '@/components/RightPanel';
import { NotificationSystem } from '@/components/NotificationSystem';
import { TrainingModal } from '@/components/modals/TrainingModal';

const MusicStudioTycoon = () => {
  const [gameState, setGameState] = useState<GameState>({
    money: 2000,
    reputation: 10,
    currentDay: 2,
    playerData: {
      xp: 0,
      level: 1,
      xpToNextLevel: 100,
      perkPoints: 0,
      attributes: {
        focusMastery: 1,
        creativeIntuition: 1,
        technicalAptitude: 1,
        businessAcumen: 1
      }
    },
    studioSkills: {
      Rock: { name: 'Rock', level: 1, xp: 0, xpToNext: 20 },
      Pop: { name: 'Pop', level: 1, xp: 0, xpToNext: 20 },
      Electronic: { name: 'Electronic', level: 1, xp: 0, xpToNext: 20 },
      Hiphop: { name: 'Hip-hop', level: 1, xp: 0, xpToNext: 20 },
      Acoustic: { name: 'Acoustic', level: 1, xp: 0, xpToNext: 20 }
    },
    ownedUpgrades: [],
    ownedEquipment: [
      {
        id: 'basic_mic',
        name: 'Basic USB Mic',
        category: 'microphone',
        price: 0,
        description: 'Standard starter microphone',
        bonuses: { qualityBonus: 0 },
        icon: '🎤'
      },
      {
        id: 'basic_monitors',
        name: 'Basic Speakers',
        category: 'monitor',
        price: 0,
        description: 'Standard studio monitors',
        bonuses: { qualityBonus: 0 },
        icon: '🔊'
      }
    ],
    availableProjects: [],
    activeProject: null,
    hiredStaff: [],
    availableCandidates: [],
    lastSalaryDay: 0,
    notifications: []
  });

  const [focusAllocation, setFocusAllocation] = useState<FocusAllocation>({
    performance: 50,
    soundCapture: 50,
    layering: 50
  });

  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [selectedStaffForTraining, setSelectedStaffForTraining] = useState<StaffMember | null>(null);
  const [lastReview, setLastReview] = useState<any>(null);
  const orbContainerRef = useRef<HTMLDivElement>(null);

  // Initialize game
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    const initialProjects = generateNewProjects(3);
    const initialCandidates = generateCandidates(3);
    setGameState(prev => ({
      ...prev,
      availableProjects: initialProjects,
      availableCandidates: initialCandidates
    }));
  };

  const hireStaff = (candidateIndex: number): boolean => {
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
  };

  const assignStaffToProject = (staffId: string) => {
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

    // Check if role slot is available (max 1 of each role per project)
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
  };

  const unassignStaffFromProject = (staffId: string) => {
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
  };

  const toggleStaffRest = (staffId: string) => {
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
  };

  const addStaffXP = (staffId: string, amount: number) => {
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => {
        if (s.id === staffId) {
          const newXP = s.xpInRole + amount;
          const xpForNextLevel = s.levelInRole * 50; // Scaling XP requirement
          
          if (newXP >= xpForNextLevel) {
            // Level up!
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
  };

  const startProject = (project: any) => {
    if (gameState.activeProject) {
      toast({
        title: "Project Already Active",
        description: "Complete your current project before starting another.",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      activeProject: { ...project, currentStageIndex: 0 },
      availableProjects: prev.availableProjects.filter(p => p.id !== project.id)
    }));

    toast({
      title: "Project Started!",
      description: `Now working on: ${project.title}`,
    });
  };

  const createOrb = (type: 'creativity' | 'technical', amount: number) => {
    if (!orbContainerRef.current) return;

    const orb = document.createElement('div');
    orb.className = `orb ${type}`;
    orb.textContent = `+${amount}`;
    
    const startX = Math.random() * 200;
    const startY = Math.random() * 100;
    orb.style.left = `${startX}px`;
    orb.style.top = `${startY}px`;

    orbContainerRef.current.appendChild(orb);

    setTimeout(() => {
      const targetElement = document.getElementById(type === 'creativity' ? 'creativity-points' : 'technical-points');
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const containerRect = orbContainerRef.current!.getBoundingClientRect();
        const targetX = rect.left - containerRect.left;
        const targetY = rect.top - containerRect.top;
        
        orb.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px)`;
        orb.style.opacity = '0';
      }
    }, 100);

    setTimeout(() => {
      if (orb.parentNode) {
        orb.parentNode.removeChild(orb);
      }
    }, 1500);
  };

  const processStageWork = () => {
    if (!gameState.activeProject) return;

    const project = gameState.activeProject;
    const currentStage = project.stages[project.currentStageIndex];
    
    // Check if stage is already completed to prevent double completion
    if (currentStage.completed) {
      toast({
        title: "Stage Already Complete",
        description: "This stage has already been completed.",
        variant: "destructive"
      });
      return;
    }

    // Calculate base points from player attributes
    let creativityGain = Math.floor(
      (focusAllocation.performance / 100) * 5 * gameState.playerData.attributes.creativeIntuition
    );
    let technicalGain = Math.floor(
      (focusAllocation.soundCapture / 100) * 5 * gameState.playerData.attributes.technicalAptitude
    );

    // Apply studio skill bonuses for the project's genre
    const genreSkill = gameState.studioSkills[project.genre];
    if (genreSkill) {
      const creativityBonus = calculateStudioSkillBonus(genreSkill, 'creativity');
      const technicalBonus = calculateStudioSkillBonus(genreSkill, 'technical');
      
      creativityGain += Math.floor(creativityGain * (creativityBonus / 100));
      technicalGain += Math.floor(technicalGain * (technicalBonus / 100));
    }

    // Apply equipment bonuses
    const equipmentBonuses = getEquipmentBonuses(gameState.ownedEquipment, project.genre);
    creativityGain += Math.floor(creativityGain * (equipmentBonuses.creativity / 100));
    technicalGain += Math.floor(technicalGain * (equipmentBonuses.technical / 100));

    // Add staff contributions
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
    
    assignedStaff.forEach(staff => {
      if (staff.energy < 20) {
        // Low energy penalty
        const penalty = 0.3;
        creativityGain += Math.floor(staff.primaryStats.creativity * 0.1 * penalty);
        technicalGain += Math.floor(staff.primaryStats.technical * 0.1 * penalty);
      } else {
        // Normal contribution
        let staffCreativity = Math.floor(staff.primaryStats.creativity * 0.15);
        let staffTechnical = Math.floor(staff.primaryStats.technical * 0.15);
        
        // Genre affinity bonus
        if (staff.genreAffinity && staff.genreAffinity.genre === project.genre) {
          const bonus = staff.genreAffinity.bonus / 100;
          staffCreativity += Math.floor(staffCreativity * bonus);
          staffTechnical += Math.floor(staffTechnical * bonus);
        }
        
        creativityGain += staffCreativity;
        technicalGain += staffTechnical;
      }
    });

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // Calculate work progress (staff speed affects this)
    let workProgress = 2;
    assignedStaff.forEach(staff => {
      if (staff.energy >= 20) {
        workProgress += Math.floor(staff.primaryStats.speed * 0.05);
      }
    });

    // Mark stage as completed and update project progress
    const updatedProject = {
      ...project,
      accumulatedCPoints: project.accumulatedCPoints + creativityGain,
      accumulatedTPoints: project.accumulatedTPoints + technicalGain,
      stages: project.stages.map((stage, index) => 
        index === project.currentStageIndex 
          ? { 
              ...stage, 
              workUnitsCompleted: stage.workUnitsBase,
              completed: true
            }
          : stage
      ),
      completedStages: [...(project.completedStages || []), project.currentStageIndex]
    };

    setGameState(prev => ({ ...prev, activeProject: updatedProject }));

    // Deplete staff energy
    setGameState(prev => ({
      ...prev,
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id && s.status === 'Working'
          ? { ...s, energy: Math.max(0, s.energy - 15) }
          : s
      )
    }));

    // Check if moving to next stage or completing project
    if (project.currentStageIndex + 1 >= project.stages.length) {
      completeProject(updatedProject);
    } else {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          activeProject: prev.activeProject ? {
            ...prev.activeProject,
            currentStageIndex: prev.activeProject.currentStageIndex + 1
          } : null
        }));
        toast({
          title: "Stage Complete!",
          description: `Moving to: ${project.stages[project.currentStageIndex + 1].stageName}`,
        });
      }, 1000);
    }
  };

  const completeProject = (project: any) => {
    const qualityScore = (project.accumulatedCPoints + project.accumulatedTPoints) / 20;
    const payout = Math.floor(project.payoutBase * (0.8 + qualityScore * 0.4));
    const repGain = Math.floor(project.repGainBase * (0.8 + qualityScore * 0.4));
    const xpGain = 25 + Math.floor(qualityScore * 10);

    const review = {
      projectTitle: project.title,
      qualityScore: Math.min(100, Math.floor(qualityScore * 10)),
      payout,
      repGain,
      xpGain,
      creativityPoints: project.accumulatedCPoints,
      technicalPoints: project.accumulatedTPoints
    };

    setLastReview(review);
    setShowReviewModal(true);

    // Give XP to assigned staff
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
    assignedStaff.forEach(staff => {
      addStaffXP(staff.id, 20 + Math.floor(qualityScore * 5));
    });

    // Unassign staff from completed project
    setGameState(prev => ({
      ...prev,
      money: prev.money + payout,
      reputation: prev.reputation + repGain,
      activeProject: null,
      availableProjects: [...prev.availableProjects, ...generateNewProjects(1)],
      playerData: {
        ...prev.playerData,
        xp: prev.playerData.xp + xpGain
      },
      hiredStaff: prev.hiredStaff.map(s => 
        s.assignedProjectId === project.id 
          ? { ...s, status: 'Idle' as const, assignedProjectId: null }
          : s
      )
    }));

    if (gameState.playerData.xp + xpGain >= gameState.playerData.xpToNextLevel) {
      levelUpPlayer();
    }
  };

  const levelUpPlayer = () => {
    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        level: prev.playerData.level + 1,
        perkPoints: prev.playerData.perkPoints + 1,
        xpToNextLevel: prev.playerData.xpToNextLevel + 50
      }
    }));

    toast({
      title: "Level Up!",
      description: `You are now level ${gameState.playerData.level + 1}! You gained a perk point.`,
    });
  };

  const spendPerkPoint = (attribute: keyof PlayerAttributes) => {
    if (gameState.playerData.perkPoints <= 0) return;

    setGameState(prev => ({
      ...prev,
      playerData: {
        ...prev.playerData,
        perkPoints: prev.playerData.perkPoints - 1,
        attributes: {
          ...prev.playerData.attributes,
          [attribute]: prev.playerData.attributes[attribute] + 1
        }
      }
    }));

    toast({
      title: "Attribute Upgraded!",
      description: `${attribute} increased to ${gameState.playerData.attributes[attribute] + 1}`,
    });
  };

  const advanceDay = () => {
    const newDay = gameState.currentDay + 1;
    
    // Process training completions
    const completedTraining: string[] = [];
    const updatedStaff = gameState.hiredStaff.map(staff => {
      if (staff.status === 'Training' && staff.trainingEndDay && newDay >= staff.trainingEndDay) {
        const course = availableTrainingCourses.find(c => c.id === staff.trainingCourse);
        if (course) {
          completedTraining.push(`${staff.name} completed ${course.name}!`);
          
          // Apply training benefits
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
            energy: 100 // Full energy after training
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

    // Add training completion notifications
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
    
    // Process active project if exists
    if (gameState.activeProject) {
      processStageWork();
    }

    // Refresh candidates occasionally
    if (newDay % 5 === 0) {
      setGameState(prev => ({
        ...prev,
        availableCandidates: generateCandidates(3)
      }));
    }
  };

  const purchaseEquipment = (equipmentId: string) => {
    const { availableEquipment } = require('@/data/equipment');
    const equipment = availableEquipment.find((e: any) => e.id === equipmentId);
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

    setGameState(prev => ({
      ...prev,
      money: prev.money - equipment.price,
      ownedEquipment: [...prev.ownedEquipment, equipment]
    }));

    toast({
      title: "Equipment Purchased!",
      description: `${equipment.name} added to your studio.`,
    });
  };

  // Add notification removal function
  const removeNotification = (id: string) => {
    setGameState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  // Add training functions
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

  const openTrainingModal = (staff: StaffMember) => {
    if (gameState.playerData.level < 3) {
      toast({
        title: "Training Locked",
        description: "Reach player level 3 to unlock staff training!",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedStaffForTraining(staff);
    setShowTrainingModal(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 text-white">
      {/* Top Bar */}
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
        openTrainingModal={openTrainingModal}
      />

      {/* Mobile-optimized layout */}
      <div className="p-2 sm:p-4 space-y-4 sm:space-y-0 sm:flex sm:gap-4 sm:h-[calc(100vh-80px)]">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        
        {/* Projects Panel - Full width on mobile, left panel on desktop */}
        <div className="w-full sm:w-80 lg:w-96">
          <ProjectList 
            gameState={gameState}
            setGameState={setGameState}
            startProject={startProject}
          />
        </div>

        {/* Central Area - Active Project */}
        <div className="flex-1 relative min-h-[400px] sm:min-h-0">
          <ActiveProject 
            gameState={gameState}
            focusAllocation={focusAllocation}
            setFocusAllocation={setFocusAllocation}
            processStageWork={processStageWork}
          />
          
          {/* Orb Animation Container */}
          <div ref={orbContainerRef} className="absolute inset-0 pointer-events-none z-10"></div>
        </div>

        {/* Right Panel - Hidden on mobile, shown on larger screens */}
        <div className="w-full sm:w-80 lg:w-96">
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
      </div>

      {/* Training Modal */}
      {selectedStaffForTraining && (
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
      )}

      {/* Notification System */}
      <NotificationSystem
        notifications={gameState.notifications}
        removeNotification={removeNotification}
      />

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="bg-gray-900 border-gray-600 text-white mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Project Complete! 🎉</DialogTitle>
          </DialogHeader>
          {lastReview && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{lastReview.projectTitle}</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl mb-2">💙</div>
                  <div className="font-bold text-white">{lastReview.creativityPoints}</div>
                  <div className="text-sm text-gray-400">Creativity</div>
                </div>
                <div>
                  <div className="text-2xl mb-2">💚</div>
                  <div className="font-bold text-white">{lastReview.technicalPoints}</div>
                  <div className="text-sm text-gray-400">Technical</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-xl font-bold text-white">Quality Score: {lastReview.qualityScore}%</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Payment:</span>
                  <span className="text-green-400 font-bold">${lastReview.payout}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Reputation:</span>
                  <span className="text-blue-400 font-bold">+{lastReview.repGain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Experience:</span>
                  <span className="text-purple-400 font-bold">+{lastReview.xpGain} XP</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MusicStudioTycoon;
