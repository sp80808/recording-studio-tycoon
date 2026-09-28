import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
// GameState and FocusAllocation are imported below with Project
import { MinigameManager, MinigameType } from './minigames/MinigameManager';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { toast } from '@/hooks/use-toast';
import { playSound } from '@/utils/audioSystem'; // Updated import
import { 
  getStageFocusLabels, 
  getStageOptimalFocus, 
  calculateFocusEffectiveness,
  getStageFocusRecommendations 
} from '@/utils/stageUtils';

import { GameState, FocusAllocation, Project, PlayerData } from '@/types/game';
import { useFeatureFlag } from '@/stores/featureFlagStore';
import ProductionQueuePanel from '@/components/ProductionQueue/ProductionQueuePanel';
import { rankStaffForProject } from '@/utils/staffFitUtils';
import { evaluateProjectSynergies } from '@/utils/synergyUtils';
import { SynergyBadgeList } from '@/components/synergy/SynergyBadgeList';

interface ActiveProjectProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void; // Made non-optional as it's crucial for updating project focus
  // focusAllocation prop is removed, as it will be derived from gameState.activeProject.focusAllocation
  // setFocusAllocation prop is removed, will be handled by a new specific updater function if manual adjustment is kept, or via setGameState
  performDailyWork?: () => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string, rawScore?: number) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame?: () => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  setGameState, // Now non-optional
  performDailyWork,
  onMinigameReward,
  onProjectComplete,
  onProjectSelect,
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame
}) => {
  const [showMinigame, setShowMinigame] = useState(false);
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythm');
  const [lastGains, setLastGains] = useState<{ creativity: number; technical: number }>({ creativity: 0, technical: 0 });
  const [showBlobAnimation, setShowBlobAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  // This will store the data for the celebration screen
  const [celebrationDisplayData, setCelebrationDisplayData] = useState<{ 
    title: string;
    genre: string;
  } | null>(null);
  // This will store the full project object to pass to onProjectComplete after celebration
  const [projectDataForCompletionCall, setProjectDataForCompletionCall] = useState<Project | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSliderAudioRef = useRef(0);

  // Unlock condition for Apply Optimal Focus button
  const managementSkillLevel = gameState.playerData.skills.management?.level || 0;
  const playerLevel = gameState.playerData.level;
  const canUseOptimalFocusButton = managementSkillLevel >= 3 || playerLevel >= 5;

  // 🔥 Overdrive risk/reward toggle (consumed by useStageWork on the next session)
  const overdriveArmed = !!gameState.activeProject?.overdriveArmed;
  const toggleOverdrive = () => {
    if (!gameState.activeProject) return;
    if (!overdriveArmed && gameState.playerData.dailyWorkCapacity < 2) {
      toast({
        title: '⚡ Not Enough Energy',
        description: 'Overdrive burns 2 energy — advance the day to recharge.',
        variant: 'destructive',
        className: 'bg-gray-800 border-gray-600 text-white',
      });
      return;
    }
    setGameState(prev => ({
      ...prev,
      activeProject: prev.activeProject
        ? { ...prev.activeProject, overdriveArmed: !prev.activeProject.overdriveArmed }
        : null,
    }));
    playSound(overdriveArmed ? 'notification.wav' : 'ui sfx/purchase-complete.mp3', 0.5);
  };

  // Present an intervention as an optional opportunity. It never opens itself
  // and never pauses ordinary session progress.
  useEffect(() => {
    if (gameState.activeProject && !showMinigame && autoTriggeredMinigame) {
      setPulseAnimation(true);
      const pulseTimer = window.setTimeout(() => setPulseAnimation(false), 3000);

      toast({
        title: "🎯 Optional Studio Intervention",
        description: autoTriggeredMinigame.reason,
        className: "bg-gray-800 border-gray-600 text-white",
        duration: 4500
      });

      playSound('notification', 0.45);
      return () => window.clearTimeout(pulseTimer);
    }
  }, [gameState.activeProject?.id, autoTriggeredMinigame, showMinigame]);

  // Hoisted above the early return: hooks must run unconditionally (Rules of Hooks).
  const showAdvancedQueue = useFeatureFlag('advanced-production-queue');

  if (!gameState.activeProject) {
    return (
      <div className="flex-1 space-y-4">
        {/* Studio Header */}
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <div>
              <h2 className="text-lg font-bold text-white">Studio Workspace</h2>
              <p className="text-sm text-gray-300">Work on your projects here</p>
            </div>
          </div>
        </div>
        
        <Card className="flex-1 bg-gray-800/90 border-gray-600 p-6 backdrop-blur-sm">
          <div className="text-center text-gray-400 animate-fade-in">
            <div className="text-6xl mb-4 animate-pulse">🎵</div>
            <h3 className="text-xl font-bold mb-2 text-white">Studio Ready</h3>
            <p className="mb-4">Choose an artist enquiry, then bring their session into the room.</p>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
              <p className="font-semibold mb-2">📱 Your next move:</p>
              <p>1. Browse the Artist Enquiries board</p>
              <p>2. Book a session that fits your room and crew</p>
              <p>3. Return here to run the recording session</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const project = gameState.activeProject;
  
  // Calculate progress for current stage
  const currentStage = project.stages[project.currentStageIndex] || project.stages[0];
  const currentStageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100 : 0;

  // DERIVE projectFocus from gameState.activeProject.focusAllocation
  const projectFocus = project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 }; // Fallback if somehow undefined

  // Aggregate skills of staff assigned to this project
  const assignedStaffToThisProject = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
  const activeSynergies = React.useMemo(() => {
    return evaluateProjectSynergies(project, gameState);
  }, [project, gameState]);

  const rankedDelegates = rankStaffForProject(
    assignedStaffToThisProject.filter(staff => staff.status === 'Working' && staff.energy > 0),
    project
  );
  const bestDelegate = rankedDelegates[0];

  const aggregatedSkills: { creativity?: number; technical?: number; arrangement?: number } = {
    creativity: 0,
    technical: 0,
    arrangement: 0,
  };

  if (assignedStaffToThisProject.length > 0) {
    let totalCreativity = 0;
    let totalTechnical = 0;
    let totalArrangementScore = 0;
    let staffWithArrangementSkills = 0;

    assignedStaffToThisProject.forEach(staff => {
      totalCreativity += staff.primaryStats.creativity || 0;
      totalTechnical += staff.primaryStats.technical || 0;
      
      const mixingSkill = staff.skills.mixing?.level || 0;
      const songwritingSkill = staff.skills.songwriting?.level || 0;
      if (mixingSkill > 0 || songwritingSkill > 0) {
        totalArrangementScore += (mixingSkill + songwritingSkill) / 2;
        staffWithArrangementSkills++;
      }
    });

    aggregatedSkills.creativity = totalCreativity / assignedStaffToThisProject.length;
    aggregatedSkills.technical = totalTechnical / assignedStaffToThisProject.length;
    aggregatedSkills.arrangement = staffWithArrangementSkills > 0 ? totalArrangementScore / staffWithArrangementSkills : 0;
  }

  const handleStartIntervention = () => {
    if (!autoTriggeredMinigame) return;
    setSelectedMinigame(autoTriggeredMinigame.type);
    setShowMinigame(true);
    playSound('start_minigame', 0.55);
  };

  const handleDelegateIntervention = () => {
    if (!autoTriggeredMinigame || !bestDelegate) return;

    const { staff, fit } = bestDelegate;
    const baseBonus = Math.max(1, Math.min(8, Math.round(fit.score / 12)));
    const creativityLeaning = new Set<MinigameType>([
      'rhythm',
      'beatmaking',
      'vocal',
      'layering'
    ]).has(autoTriggeredMinigame.type);

    const creativityBonus = creativityLeaning ? baseBonus : Math.max(1, Math.floor(baseBonus * 0.6));
    const technicalBonus = creativityLeaning ? Math.max(1, Math.floor(baseBonus * 0.6)) : baseBonus;
    const xpBonus = Math.max(1, Math.min(3, Math.floor(baseBonus / 2)));

    onMinigameReward?.(
      creativityBonus,
      technicalBonus,
      xpBonus,
      autoTriggeredMinigame.type
    );
    clearAutoTriggeredMinigame?.();

    toast({
      title: "👥 Intervention Delegated",
      description: `${staff.name} handled it · ${fit.reasons.slice(0, 3).join(' · ')} · +${creativityBonus} C / +${technicalBonus} T`,
      className: "bg-gray-800 border-gray-600 text-white",
      duration: 3500
    });
  };

  const handleSkipIntervention = () => {
    clearAutoTriggeredMinigame?.();
    toast({
      title: "Studio kept moving",
      description: "The normal workflow continued with no bonus or penalty.",
      className: "bg-gray-800 border-gray-600 text-white",
      duration: 2200
    });
  };
  // Get stage-specific focus labels and guidance, now considering staff skills for optimalFocus
  const stageFocusLabels = getStageFocusLabels(currentStage);
  const optimalFocus = getStageOptimalFocus(currentStage, project.genre, aggregatedSkills); // Pass aggregatedSkills
  const focusEffectiveness = calculateFocusEffectiveness(projectFocus, optimalFocus); // Use projectFocus
  const stageRecommendations = getStageFocusRecommendations(currentStage);
  
  // Calculate overall project progress
  const totalWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsCompleted, 0);
  const overallProgress = totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0;

  const handleMinigameReward = (
    creativityBonus: number,
    technicalBonus: number,
    xpBonus: number,
    _minigameType?: MinigameType,
    rawScore?: number
  ) => {
    const cappedCreativity = Math.min(12, Math.max(0, creativityBonus));
    const cappedTechnical = Math.min(12, Math.max(0, technicalBonus));
    const cappedXp = Math.min(5, Math.max(0, xpBonus));

    console.log('🎮 Intervention rewards received:', {
      creativityBonus: cappedCreativity,
      technicalBonus: cappedTechnical,
      xpBonus: cappedXp,
      minigameType: selectedMinigame,
      rawScore
    });

    playSound('success', 0.7);
    if (onMinigameReward) {
      onMinigameReward(cappedCreativity, cappedTechnical, cappedXp, selectedMinigame, rawScore);
    }

    const currentStageKey = `${project.id}-${project.currentStageIndex}`;
    setCompletedMinigamesForStage(prev => new Set([...prev, currentStageKey]));

    setShowMinigame(false);
    clearAutoTriggeredMinigame?.();
    setPulseAnimation(false);

    toast({
      title: "🎉 Intervention Complete",
      description: `+${cappedCreativity} creativity, +${cappedTechnical} technical, +${cappedXp} XP`,
      className: "bg-gray-800 border-gray-600 text-white",
      duration: 3000
    });
  };

  const handleWork = () => {
    // Play work button click sound
    playSound('ui-click', 0.5);
    

    // Store expected gains for animation (simplified calculation)
    const baseCreativity = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnical = gameState.playerData.attributes.technicalAptitude;
    
    // Use projectFocus for calculating gains
    const creativityGain = Math.floor(
      baseCreativity * (projectFocus.performance / 100) * 0.8 + 
      baseCreativity * (projectFocus.layering / 100) * 0.6
    );
    const technicalGain = Math.floor(
      baseTechnical * (projectFocus.soundCapture / 100) * 0.8 + 
      baseTechnical * (projectFocus.layering / 100) * 0.4
    );

    console.log('🎯 Setting last gains for animation:', { creativityGain, technicalGain });
    setLastGains({ creativity: creativityGain, technical: technicalGain });
    setShowBlobAnimation(true);
    
    // Call actual work function
    const result = performDailyWork(); // Now returns { isComplete: boolean, finalProjectData?: Project }
    
    if (result?.isComplete && result.finalProjectData) {
      console.log('🎉 Project work units complete! Triggering celebration for:', result.finalProjectData.title);
      playSound('project-complete', 0.8);
      
      // Set data for the celebration display
      setCelebrationDisplayData({
        title: result.finalProjectData.title,
        genre: result.finalProjectData.genre
      });
      // Store the full project data to be used when the celebration is over
      setProjectDataForCompletionCall(result.finalProjectData);
      setShowCelebration(true);
    }
    // If not complete, or if somehow isComplete is true but no finalProjectData, do nothing further here.
  };

  const handleProjectCelebrationComplete = () => {
    console.log('🎊 Celebration complete. Calling onProjectComplete with stored project data.');
    if (onProjectComplete && projectDataForCompletionCall) {
      onProjectComplete(projectDataForCompletionCall);
    }
    setShowCelebration(false);
    setCelebrationDisplayData(null);
    setProjectDataForCompletionCall(null); // Clear the stored project data
  };

  // Check if current stage is complete and ready to advance
  const isCurrentStageComplete = currentStage && currentStage.workUnitsCompleted >= currentStage.workUnitsBase;
  const isProjectComplete = project.stages.every(stage => stage.completed);

  const playSliderSoundThrottled = () => {
    const now = Date.now();
    if (now - lastSliderAudioRef.current > 80) {
      playSound('slider.wav', 0.25);
      lastSliderAudioRef.current = now;
    }
  };

  const handleFocusChange = (key: keyof FocusAllocation, value: number) => {
    playSliderSoundThrottled();
    const newFocus = { ...projectFocus, [key]: value };
    setGameState(prev => ({
      ...prev,
      activeProject: prev.activeProject ? { ...prev.activeProject, focusAllocation: newFocus } : null,
      activeProjects: prev.activeProjects.map(p => 
        p.id === project.id ? { ...p, focusAllocation: newFocus } : p
      ),
    }));
  };

  return (
    <>
      <OrbAnimationStyles />
      <EnhancedAnimationStyles />
      
      {/* Animated Stat Blobs */}
      {showBlobAnimation && containerRef.current && (
        <AnimatedStatBlobs
          creativityGain={lastGains.creativity}
          technicalGain={lastGains.technical}
          onComplete={() => {
            console.log('🎨 Blob animation complete.');
            setShowBlobAnimation(false);
            setLastGains({ creativity: 0, technical: 0 });
          }}
          containerRef={containerRef}
        />
      )}
      
      {/* Project Completion Celebration */}
      {showCelebration && celebrationDisplayData && (
        <ProjectCompletionCelebration
          isVisible={showCelebration}
          projectTitle={celebrationDisplayData.title}
          genre={celebrationDisplayData.genre}
          onComplete={handleProjectCelebrationComplete}
        />
      )}
      
      {/* Studio Workspace Card: Scaled DAW / Console Layout */}
      <div 
        ref={containerRef} 
        className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md"
      >
        {/* Pinned Top Bar: Project Meta & LED telemetry */}
        <div className="shrink-0 mb-2.5 bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 border border-slate-800/90 rounded-lg p-2.5 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  ● REC
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-1.5">
                  {project.title}
                </h3>
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{project.genre} · {project.clientName || project.clientType}</span>
                <span className="text-emerald-400 font-semibold">💰 ${Math.round(project.payoutBase)}</span>
                <span className="text-amber-300">⭐ Diff {project.difficulty}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs tabular-nums">
              <div className="text-right">
                <div className="text-[11px] text-amber-300 font-semibold">{project.durationDaysTotal}d duration</div>
                <div className="text-[10px] text-slate-400">{Math.round(project.workSessionCount || 0)} sessions</div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/90 px-2 py-1 rounded border border-slate-700/70">
                <div id="creativity-points" data-creativity-target className="text-sky-400 font-bold flex items-center gap-1 text-xs">
                  <span>🎨</span> {Math.round(project.accumulatedCPoints || 0)}
                </div>
                <div className="w-px h-3 bg-slate-700" />
                <div id="technical-points" data-technical-target className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <span>⚙️</span> {Math.round(project.accumulatedTPoints || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Center Body: Meters, Sliders, Stage info */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
          {/* Production Queue Panel (feature-flagged) */}
          {showAdvancedQueue && (
            <div>
              <ProductionQueuePanel roomId={project.bookingRoomId || project.id} />
            </div>
          )}

          {/* Optional intervention opportunity */}
          {autoTriggeredMinigame && (
            <div className="p-3 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/70 rounded-lg animate-scale-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-yellow-300 font-semibold text-xs mb-0.5">🎯 Optional Studio Intervention</h4>
                  <p className="text-gray-300 text-xs">{autoTriggeredMinigame.reason}</p>
                </div>
                <div className="text-xl">🎮</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  onClick={handleStartIntervention}
                  size="sm"
                  className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                >
                  Intervene
                </Button>
                <Button
                  onClick={handleDelegateIntervention}
                  size="sm"
                  variant="outline"
                  disabled={!bestDelegate}
                  className="h-7 text-xs border-blue-500/50 text-blue-200"
                  title={bestDelegate ? bestDelegate.fit.reasons.join(' · ') : 'No available staff'}
                >
                  {bestDelegate ? `Delegate: ${bestDelegate.staff.name.split(' ')[0]}` : 'Delegate'}
                </Button>
                <Button
                  onClick={handleSkipIntervention}
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-gray-300"
                >
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* Stage Completion Notification */}
          {isCurrentStageComplete && !isProjectComplete && (
            <div className="p-3 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/70 rounded-lg animate-scale-in flex items-center justify-between">
              <div>
                <h4 className="text-green-400 font-semibold text-xs">✅ Stage Complete!</h4>
                <p className="text-gray-300 text-xs">
                  {currentStage.stageName} finished. Work next session to advance.
                </p>
              </div>
              <div className="text-xl animate-bounce">🎉</div>
            </div>
          )}

          {/* Active Studio Synergies (Kairosoft Combos) */}
          {activeSynergies.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900/60 border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1 shrink-0">
                <span>✨</span>
                <span>Active Combos ({activeSynergies.length}):</span>
              </span>
              <SynergyBadgeList synergies={activeSynergies} size="sm" />
            </div>
          )}

          {/* Dual Progress Meters */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="text-slate-400">Stage {project.currentStageIndex + 1}/{project.stages.length}:</span>
                <span className="text-sky-300 font-bold">{currentStage?.stageName}</span>
                {focusEffectiveness.effectiveness > 0.8 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🚀 Optimized
                  </span>
                )}
              </span>
              <span className="text-slate-400 text-xs tabular-nums flex items-center gap-1.5">
                <span>{Math.round(currentStage?.workUnitsCompleted || 0)} / {currentStage?.workUnitsBase || 0} units</span>
                {focusEffectiveness.effectiveness > 0.7 && (
                  <span className="text-[10px] px-1 rounded bg-sky-500/20 text-sky-300">⚡ Efficient</span>
                )}
              </span>
            </div>
            <Progress 
              value={currentStageProgress} 
              className="h-2.5 mb-2 transition-all duration-300"
              aria-label={`${currentStage?.stageName || 'Current stage'} progress`}
            />

            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>Overall Track Progress</span>
              <span className="font-bold text-slate-300 tabular-nums">{Math.round(overallProgress)}%</span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-1.5 bg-slate-800 progress-bar transition-all duration-300"
              aria-label="Overall project progress"
            />
          </div>

          {/* Focus Allocation Console Module */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  🎛️ Session Focus Allocation
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  focusEffectiveness.effectiveness > 0.8 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                  focusEffectiveness.effectiveness > 0.6 ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                  'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}>
                  {Math.round(focusEffectiveness.effectiveness * 100)}% Match
                </span>
              </div>
              
              <Button
                onClick={() => {
                  const newFocus = {
                    performance: optimalFocus.performance,
                    soundCapture: optimalFocus.soundCapture,
                    layering: optimalFocus.layering,
                  };
                  setGameState(prev => ({
                    ...prev,
                    activeProject: prev.activeProject ? { ...prev.activeProject, focusAllocation: newFocus } : null,
                    activeProjects: prev.activeProjects.map(p => 
                      p.id === project.id ? { ...p, focusAllocation: newFocus } : p
                    ),
                  }));
                  playSound('notification.wav', 0.4);
                  toast({
                    title: "🎯 Focus Aligned",
                    description: `Target focus applied for ${currentStage.stageName}`,
                    className: "bg-gray-800 border-gray-600 text-white",
                  });
                }}
                disabled={!canUseOptimalFocusButton}
                size="sm"
                variant="outline"
                className={`text-[11px] h-7 px-2.5 border transition-colors ${
                  canUseOptimalFocusButton
                    ? 'bg-indigo-900/40 border-indigo-500/50 text-indigo-200 hover:bg-indigo-800/60'
                    : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
                title={canUseOptimalFocusButton ? 'Auto-align to stage target' : 'Requires Level 5+ or Management Level 3+'}
              >
                🎯 Auto-Align
              </Button>
            </div>

            {/* 3-Channel Mixing Strips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Channel 1: Performance */}
              <div className="bg-slate-900/80 border border-slate-800/90 p-2 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {stageFocusLabels.performance.label}
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    Math.abs(projectFocus.performance - optimalFocus.performance) <= 10 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                      : Math.abs(projectFocus.performance - optimalFocus.performance) <= 25
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}>
                    {projectFocus.performance}%
                  </span>
                </div>
                <Slider
                  value={[projectFocus.performance]}
                  onValueChange={(value) => handleFocusChange('performance', value[0])}
                  max={100}
                  step={5}
                  className={`w-full ${
                    Math.abs(projectFocus.performance - optimalFocus.performance) <= 10 
                      ? 'slider-optimal' 
                      : Math.abs(projectFocus.performance - optimalFocus.performance) <= 25
                        ? 'slider-good'
                        : 'slider-default'
                  }`}
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Target: {Math.max(0, optimalFocus.performance - 10)}–{Math.min(100, optimalFocus.performance + 10)}%</span>
                  <span className={Math.abs(projectFocus.performance - optimalFocus.performance) <= 10 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {Math.abs(projectFocus.performance - optimalFocus.performance) <= 10 ? '✓ Optimal' : 'Adjust'}
                  </span>
                </div>
              </div>

              {/* Channel 2: Sound Capture */}
              <div className="bg-slate-900/80 border border-slate-800/90 p-2 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {stageFocusLabels.soundCapture.label}
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 10 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                      : Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 25
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}>
                    {projectFocus.soundCapture}%
                  </span>
                </div>
                <Slider
                  value={[projectFocus.soundCapture]}
                  onValueChange={(value) => handleFocusChange('soundCapture', value[0])}
                  max={100}
                  step={5}
                  className={`w-full ${
                    Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 10 
                      ? 'slider-optimal' 
                      : Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 25
                        ? 'slider-good'
                        : 'slider-default'
                  }`}
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Target: {Math.max(0, optimalFocus.soundCapture - 10)}–{Math.min(100, optimalFocus.soundCapture + 10)}%</span>
                  <span className={Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 10 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 10 ? '✓ Optimal' : 'Adjust'}
                  </span>
                </div>
              </div>

              {/* Channel 3: Layering */}
              <div className="bg-slate-900/80 border border-slate-800/90 p-2 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {stageFocusLabels.layering.label}
                  </span>
                  <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    Math.abs(projectFocus.layering - optimalFocus.layering) <= 10 
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                      : Math.abs(projectFocus.layering - optimalFocus.layering) <= 25
                        ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}>
                    {projectFocus.layering}%
                  </span>
                </div>
                <Slider
                  value={[projectFocus.layering]}
                  onValueChange={(value) => handleFocusChange('layering', value[0])}
                  max={100}
                  step={5}
                  className={`w-full ${
                    Math.abs(projectFocus.layering - optimalFocus.layering) <= 10 
                      ? 'slider-optimal' 
                      : Math.abs(projectFocus.layering - optimalFocus.layering) <= 25
                        ? 'slider-good'
                        : 'slider-default'
                  }`}
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Target: {Math.max(0, optimalFocus.layering - 10)}–{Math.min(100, optimalFocus.layering + 10)}%</span>
                  <span className={Math.abs(projectFocus.layering - optimalFocus.layering) <= 10 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                    {Math.abs(projectFocus.layering - optimalFocus.layering) <= 10 ? '✓ Optimal' : 'Adjust'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Guidance Note */}
            <div className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded border border-slate-800 flex items-center gap-1.5">
              <span className="text-sky-400">💡</span>
              <span className="text-slate-300 font-medium">{currentStage.stageName}:</span>
              <span className="truncate">{optimalFocus.reasoning}</span>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Action Dock: ALWAYS VISIBLE */}
        <div className="shrink-0 pt-2 mt-2 border-t border-slate-700/60 bg-slate-950/90 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            {(project.comboCount || 0) > 1 && (
              <div className="px-2.5 py-1 text-center text-xs font-black tracking-wide text-amber-300 bg-amber-950/80 border border-amber-500/50 rounded animate-pulse">
                ⚡ x{project.comboCount} COMBO (+{Math.min(50, (project.comboCount! - 1) * 10)}%)
              </div>
            )}
            <Button
              onClick={toggleOverdrive}
              disabled={gameState.playerData.dailyWorkCapacity < 2 || isProjectComplete}
              variant="outline"
              size="sm"
              className={`h-8 text-xs font-semibold flex-1 transition-all ${
                overdriveArmed
                  ? 'bg-orange-600 hover:bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-950/50'
                  : 'bg-slate-900/80 border-orange-700/50 text-orange-300 hover:bg-orange-950/40'
              }`}
            >
              {overdriveArmed
                ? '🔥 Overdrive Armed (2 Energy · +75%)'
                : '🔥 Arm Overdrive (2 Energy · +75%)'}
            </Button>
          </div>

          <Button 
            onClick={handleWork}
            disabled={gameState.playerData.dailyWorkCapacity <= 0 || isProjectComplete}
            className={`w-full py-2.5 h-11 text-base font-black tracking-wide game-button transition-all duration-200 shadow-lg ${
              isProjectComplete
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : gameState.playerData.dailyWorkCapacity > 0
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-indigo-950/50'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
            } ${pulseAnimation ? 'ring-2 ring-yellow-400/80' : ''}`}
          >
            {isProjectComplete ? (
              '🎉 Project Ready For Review!'
            ) : gameState.playerData.dailyWorkCapacity > 0 ? (
              `🎵 Work on Project (${gameState.playerData.dailyWorkCapacity} energy left)`
            ) : (
              '😴 Studio Exhausted (Advance Day to Restore)'
            )}
          </Button>
        </div>

        <MinigameManager
          isOpen={showMinigame}
          onClose={() => {
            setShowMinigame(false);
            if (clearAutoTriggeredMinigame) {
              clearAutoTriggeredMinigame();
            }
            setPulseAnimation(false);
            playSound('close_modal.wav', 0.4);
          }}
          gameType={selectedMinigame}
          onReward={handleMinigameReward}
        />
      </div>
    </>
  );
};
