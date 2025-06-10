import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { GameState, FocusAllocation, MinigameType } from '@/types/game';
import { MinigameManager } from './minigames/MinigameManager';
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { StaffAssignmentSection } from './ProjectManagement/StaffAssignmentSection'; // Import StaffAssignmentSection
import { StaffMember } from '@/types/game'; // Import StaffMember

interface WorkResult {
  isComplete: boolean;
  review?: unknown; // Replace 'unknown' with a more specific type if available
}

interface ActiveProjectProps {
  gameState: GameState;
  focusAllocation: FocusAllocation;
  setFocusAllocation: (allocation: FocusAllocation) => void;
  performDailyWork: () => WorkResult | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  focusAllocation,
  setFocusAllocation,
  performDailyWork,
  onMinigameReward,
  onProjectComplete
}) => {
  const [showMinigame, setShowMinigame] = useState(false);
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythm');
  const [lastGains, setLastGains] = useState<{ creativity: number; technical: number }>({ creativity: 0, technical: 0 });
  const [showBlobAnimation, setShowBlobAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<{
    type: MinigameType;
    reason: string;
  } | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [completedMinigamesForStage, setCompletedMinigamesForStage] = useState<Set<string>>(new Set());

  // Placeholder staff data for StaffAssignmentSection
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<StaffMember[]>([]);

  // Populate placeholder staff data (example)
  useEffect(() => {
    if (gameState.staff && gameState.activeProject) {
      // This is a simplified example. Real logic would filter based on project assignment.
      const allStaff = gameState.staff;
      const currentlyAssignedToThisProject = allStaff.filter(s => 
        gameState.activeProject?.stages.some(stage => stage.assignedStaff.includes(s.id))
      );
      const notAssignedToThisProject = allStaff.filter(s => 
        !gameState.activeProject?.stages.some(stage => stage.assignedStaff.includes(s.id))
      );
      
      setAvailableStaff(notAssignedToThisProject);
      setAssignedStaff(currentlyAssignedToThisProject);
    } else {
      setAvailableStaff(gameState.staff || []);
      setAssignedStaff([]);
    }
  }, [gameState.staff, gameState.activeProject]);


  const handleAssignStaff = (staffId: string) => {
    // Placeholder: Implement actual assignment logic
    console.log(`Assigning staff ${staffId} to project ${project?.id}`);
    setAvailableStaff(prev => prev.filter(s => s.id !== staffId));
    const staffToAssign = gameState.staff.find(s => s.id === staffId);
    if (staffToAssign) {
      setAssignedStaff(prev => [...prev, staffToAssign]);
    }
    // This should also update gameState.activeProject.stages[...].assignedStaff
    // and potentially gameState.staff if their status changes.
  };

  const handleUnassignStaff = (staffId: string) => {
    // Placeholder: Implement actual unassignment logic
    console.log(`Unassigning staff ${staffId} from project ${project?.id}`);
    setAssignedStaff(prev => prev.filter(s => s.id !== staffId));
    const staffToUnassign = gameState.staff.find(s => s.id === staffId);
    if (staffToUnassign) {
      setAvailableStaff(prev => [...prev, staffToUnassign]);
    }
    // This should also update gameState.activeProject.stages[...].assignedStaff
  };

  const handleAutoOptimizeStaff = () => {
    // Placeholder: Implement auto-optimization logic
    console.log(`Auto-optimizing staff for project ${project?.id}`);
    toast({ title: "Auto-Optimize Clicked", description: "Logic not yet implemented." });
  };

  // Clear auto-triggered minigame when project changes or stage advances
  useEffect(() => {
    if (gameState.activeProject) {
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStage}`;
      const previousStageKey = Array.from(completedMinigamesForStage).find(key => 
        key.startsWith(`${gameState.activeProject!.id}-`) && key !== currentStageKey
      );
      
      // If we've moved to a new stage, clear the auto-triggered minigame
      if (previousStageKey && !completedMinigamesForStage.has(currentStageKey)) {
        setAutoTriggeredMinigame(null);
        setPulseAnimation(false);
      }
    }
  }, [gameState.activeProject, completedMinigamesForStage]);

  // Auto-trigger minigames based on project stage and equipment
  useEffect(() => {
    if (gameState.activeProject && !showMinigame && !autoTriggeredMinigame) {
      const workCount = gameState.activeProject.workSessionCount || 0;
      const currentStageKey = `${gameState.activeProject.id}-${gameState.activeProject.currentStage}`;
      
      // Don't trigger if we've already completed a minigame for this stage
      if (completedMinigamesForStage.has(currentStageKey)) {
        return;
      }

      const triggerResult = shouldAutoTriggerMinigame(gameState.activeProject, gameState, focusAllocation, workCount);
      
      if (triggerResult) {
        const currentStage = gameState.activeProject.stages[gameState.activeProject.currentStage];
        const isLastStage = gameState.activeProject.currentStage >= gameState.activeProject.stages.length - 2;
        const stageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) : 0;
        
        // Auto-trigger on final stages or when stage is 75%+ complete
        if (isLastStage || stageProgress >= 0.75) {
          setAutoTriggeredMinigame({
            type: triggerResult.type as MinigameType,
            reason: triggerResult.reason
          });
          
          setPulseAnimation(true);
          setTimeout(() => setPulseAnimation(false), 3000);
          
          toast({
            title: "🎯 Production Opportunity!",
            description: triggerResult.reason,
            duration: 5000
          });
        }
      }
    }
  }, [gameState, focusAllocation, showMinigame, autoTriggeredMinigame, completedMinigamesForStage]);

  if (!gameState.activeProject) {
    return (
      <Card className="flex-1 bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm">
        <div className="text-center text-gray-400 animate-fade-in">
          <div className="text-6xl mb-4 animate-pulse">🎵</div>
          <h3 className="text-xl font-bold mb-2">No Active Project</h3>
          <p>Select a project from the left panel to start working</p>
        </div>
      </Card>
    );
  }

  const project = gameState.activeProject;
  
  // Calculate progress for current stage
  const currentStage = project.stages[project.currentStage] || project.stages[0];
  const currentStageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100 : 0;
  
  // Calculate overall project progress
  const totalWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsCompleted, 0);
  const overallProgress = totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0;

  const handleMinigameReward = (creativityBonus: number, technicalBonus: number, xpBonus: number) => {
    console.log('🎮 Minigame rewards received:', { creativityBonus, technicalBonus, xpBonus, minigameType: selectedMinigame });
    
    if (onMinigameReward) {
      onMinigameReward(creativityBonus, technicalBonus, xpBonus, selectedMinigame);
    }
    
    // Mark this stage as having completed a minigame
    const currentStageKey = `${project.id}-${project.currentStage}`;
    setCompletedMinigamesForStage(prev => new Set([...prev, currentStageKey]));
    
    // Close minigame and clear auto-trigger
    setShowMinigame(false);
    setAutoTriggeredMinigame(null);
    setPulseAnimation(false);
    
    // Show rewarding toast
    toast({
      title: "🎉 Production Challenge Complete!",
      description: `+${creativityBonus} creativity, +${technicalBonus} technical, +${xpBonus} XP`,
      duration: 3000
    });

    // Trigger a work session automatically after minigame completion
    console.log('🔄 Auto-triggering work session after minigame completion...');
    setTimeout(() => {
      performDailyWork();
    }, 1000);
  };

  const handleWork = () => {
    // Check for auto-triggered minigame opportunity
    if (autoTriggeredMinigame) {
      console.log('🎮 Starting auto-triggered minigame:', autoTriggeredMinigame.type);
      setSelectedMinigame(autoTriggeredMinigame.type);
      setShowMinigame(true);
      return;
    }

    // Store expected gains for animation (simplified calculation)
    const baseCreativity = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnical = gameState.playerData.attributes.technicalAptitude;
    
    const creativityGain = Math.floor(
      baseCreativity * (focusAllocation.performance / 100) * 0.8 + 
      baseCreativity * (focusAllocation.layering / 100) * 0.6
    );
    const technicalGain = Math.floor(
      baseTechnical * (focusAllocation.soundCapture / 100) * 0.8 + 
      baseTechnical * (focusAllocation.layering / 100) * 0.4
    );

    console.log('🎯 Setting last gains for animation:', { creativityGain, technicalGain });
    setLastGains({ creativity: creativityGain, technical: technicalGain });
    setShowBlobAnimation(true);
    
    // Call actual work function
    const result = performDailyWork();
    
    if (result?.isComplete) {
      console.log('🎉 Project completed! Triggering celebration...');
      setShowCelebration(true);
      setTimeout(() => {
        if (onProjectComplete) {
          onProjectComplete();
        }
      }, 1500);
    }
  };

  // Check if current stage is complete and ready to advance
  const isCurrentStageComplete = currentStage && currentStage.workUnitsCompleted >= currentStage.workUnitsBase;
  const isProjectComplete = project.stages.every(stage => stage.isCompleted); // Corrected to isCompleted

  const totalAllocation = focusAllocation.performance + focusAllocation.soundCapture + focusAllocation.layering;

  return (
    <>
      <OrbAnimationStyles />
      <div className="flex-1 space-y-4 relative">
        <Card className="bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm animate-scale-in">
          <div className="flex justify-between items-start mb-4">
            <div className="animate-fade-in">
              <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
              <p className="text-gray-300 text-sm mb-2">{project.genre} • {project.clientType}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400 animate-pulse">💰 ${project.payoutBase}</span>
                <span className="text-blue-400">🎵 {project.genre}</span>
                <span className="text-purple-400">⭐ {project.difficulty}</span>
              </div>
            </div>
            <div className="text-right animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-yellow-400 font-bold">{project.durationDaysTotal} days total</div>
              <div className="text-gray-400 text-sm">Work sessions: {project.workSessionCount || 0}</div>
              <div className="mt-2 space-y-1">
                <div id="creativity-points" data-creativity-target className="text-blue-400 text-sm">
                  🎨 {project.accumulatedCPoints} creativity
                </div>
                <div id="technical-points" data-technical-target className="text-green-400 text-sm">
                  ⚙️ {project.accumulatedTPoints} technical
                </div>
              </div>
            </div>
          </div>

          {/* Auto-triggered Minigame Notification */}
          {autoTriggeredMinigame && (
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500 rounded-lg animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-yellow-400 font-semibold mb-1">🎯 Production Opportunity Ready!</h4>
                  <p className="text-gray-300 text-sm">{autoTriggeredMinigame.reason}</p>
                </div>
                <div className="text-2xl animate-bounce">🎮</div>
              </div>
            </div>
          )}

          {/* Stage Completion Notification */}
          {isCurrentStageComplete && !isProjectComplete && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500 rounded-lg animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-green-400 font-semibold mb-1">✅ Stage Complete!</h4>
                  <p className="text-gray-300 text-sm">
                    {currentStage.name} finished! Continue working to advance to the next stage.
                  </p>
                </div>
                <div className="text-2xl animate-bounce">🎉</div>
              </div>
            </div>
          )}

          {/* Current Stage Progress */}
          <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">
                Current Stage: {currentStage?.name || 'Unknown'}
              </span>
              <span className="text-gray-400">
                {currentStage?.workUnitsCompleted || 0}/{currentStage?.workUnitsBase || 0}
              </span>
            </div>
            <Progress value={currentStageProgress} className="h-3 mb-2 transition-all duration-500" />
            {currentStage?.isCompleted && ( // Corrected to isCompleted
              <div className="text-green-400 text-sm animate-scale-in">✓ Stage Complete!</div>
            )}
          </div>

          {/* Overall Project Progress */}
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-semibold">Overall Progress</span>
              <span className="text-gray-400">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 progress-bar transition-all duration-500" />
          </div>

          {/* Focus Allocation Sliders */}
          <div className="space-y-6 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h4 className="text-white font-semibold">Focus Allocation</h4>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent content="Adjust focus areas to optimize project quality and efficiency" />
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Total:</span>
                <span className={`text-sm font-medium ${
                  totalAllocation > 100 ? 'text-red-400 animate-slider-shake' : 
                  totalAllocation === 100 ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {totalAllocation}%
                </span>
              </div>
            </div>
            
            <div className="space-y-6">
              {Object.entries(focusAllocation).map(([key, value]) => {
                const typedKey = key as keyof FocusAllocation;
                const label = {
                  performance: '🎭 Performance',
                  soundCapture: '🎤 Sound Capture',
                  layering: '🎚️ Layering'
                }[typedKey];
                
                const tooltip = {
                  performance: 'Focus on artist performance and musical quality',
                  soundCapture: 'Focus on technical recording quality and clarity',
                  layering: 'Focus on arrangement and track layering'
                }[typedKey];

                const otherValues = Object.entries(focusAllocation)
                  .filter(([k]) => k !== key)
                  .reduce((sum, [_, v]: [string, number]) => sum + v, 0);

                const isMaxed = value + otherValues >= 100;
                const isOptimal = totalAllocation === 100;

                return (
                  <motion.div
                    key={key}
                    className="hover-scale group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * Object.keys(focusAllocation).indexOf(key) }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <label className="text-gray-300 group-hover:text-white transition-colors duration-200 cursor-help">
                              {label}
                            </label>
                          </TooltipTrigger>
                          <TooltipContent content={tooltip} />
                        </Tooltip>
                        {isOptimal && value > 0 && (
                          <span className="text-xs text-green-400 animate-slider-pulse">✓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${
                          isMaxed ? 'text-red-400' :
                          isOptimal ? 'text-green-400' :
                          'text-gray-400 group-hover:text-gray-300'
                        } transition-colors duration-200`}>
                          {value}%
                        </span>
                        {value > 0 && (
                          <motion.div
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [1, 0.8, 1]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={(newValue) => {
                        const updatedValue = newValue[0];
                        if (updatedValue + otherValues <= 100) {
                          setFocusAllocation({...focusAllocation, [key]: updatedValue});
                        }
                      }}
                      max={100}
                      step={5}
                      className={`w-full transition-all duration-200 ${
                        isMaxed ? 'opacity-50' : 'opacity-100'
                      }`}
                    />
                    <AnimatePresence>
                      {isMaxed && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-red-400 text-xs mt-1"
                        >
                          Cannot exceed 100% total allocation
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Allocation Status */}
            <AnimatePresence>
              {totalAllocation !== 100 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-sm ${
                    totalAllocation > 100 ? 'text-red-400' :
                    totalAllocation < 100 ? 'text-yellow-400' :
                    'text-green-400'
                  }`}
                >
                  {totalAllocation > 100 ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-slider-shake">⚠️</span>
                      Total allocation exceeds 100%
                    </span>
                  ) : totalAllocation < 100 ? (
                    <span className="flex items-center gap-2">
                      <span>ℹ️</span>
                      {100 - totalAllocation}% allocation remaining
                    </span>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button 
            onClick={handleWork}
            disabled={gameState.playerData.dailyWorkCapacity <= 0 || isProjectComplete}
            className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 text-lg font-bold game-button transition-all duration-300 ${
              pulseAnimation ? 'animate-pulse ring-4 ring-yellow-400/50' : ''
            } ${autoTriggeredMinigame ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
          >
            {isProjectComplete ? (
              '🎉 Project Complete!'
            ) : autoTriggeredMinigame ? (
              <>🎮 Start Production Challenge!</>
            ) : gameState.playerData.dailyWorkCapacity > 0 ? (
              `🎵 Work on Project (${gameState.playerData.dailyWorkCapacity} energy left)`
            ) : (
              '😴 No Energy Left (Advance Day to Restore)'
            )}
          </Button>
        </Card>

        {/* Staff Assignment Section */}
        {project && (
          <Card className="bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm animate-fade-in">
            <StaffAssignmentSection
              project={project}
              availableStaff={availableStaff}
              assignedStaff={assignedStaff}
              onAssign={handleAssignStaff}
              onUnassign={handleUnassignStaff}
              onAutoOptimize={handleAutoOptimizeStaff}
            />
          </Card>
        )}

        <MinigameManager
          isOpen={showMinigame}
          onClose={() => {
            setShowMinigame(false);
            setAutoTriggeredMinigame(null);
            setPulseAnimation(false);
          }}
          gameType={selectedMinigame}
          onReward={handleMinigameReward}
        />

        {/* Enhanced Animation Container */}
        {showBlobAnimation && (
          <AnimatedStatBlobs
            creativityGain={lastGains.creativity}
            technicalGain={lastGains.technical}
            onComplete={() => setShowBlobAnimation(false)}
            containerRef={{ current: document.querySelector('.relative') as HTMLDivElement }}
          />
        )}

        {/* Project Completion Celebration */}
        {showCelebration && gameState.activeProject && (
          <ProjectCompletionCelebration 
            isVisible={showCelebration}
            projectTitle={gameState.activeProject.title}
            genre={gameState.activeProject.genre}
            onComplete={() => setShowCelebration(false)}
          />
        )}
      </div>
    </>
  );
};
