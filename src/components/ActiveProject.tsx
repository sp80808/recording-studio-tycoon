import { MotionButton, MotionReveal, MotionNumber } from '@/components/motion/primitives';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { GamePanel } from '@/components/ui/GamePanel';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
// GameState and FocusAllocation are imported below with Project
import { MinigameManager, MinigameType } from './minigames/MinigameManager';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { toast } from '@/hooks/use-toast';
import { playSound, gameAudio } from '@/utils/audioSystem'; // Updated import
import { triggerScreenShake } from '@/utils/screenShake';
import { REWARD_POP_EVENT, takePopTier, type RewardPopDetail } from '@/utils/rewardFx';
import { evaluateTakeAccuracy, calculateTakeEnergyCost } from '@/rpg/takeEvaluation';
import { StreakBankControl } from './StreakBankControl';
import type { BankResult } from '@/rpg/streakBank';
import { hasActiveChoreBuff, getActiveBuffMagnitude } from '@/simulation/choreEngine';
import { PocketMeter } from '@/components/console/PocketMeter';
import { StudioDutiesClipboard } from './chores/StudioDutiesClipboard';
import { ClipboardList } from 'lucide-react';
import { useGamepad } from '@/hooks/useGamepad';
import { useSettings } from '@/contexts/settings-context-types';
import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import { useUiChromeStore } from '@/stores/uiChromeStore';
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
import { hapticTick } from '@/utils/mobilePlatform';

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
  const [showDutiesClipboard, setShowDutiesClipboard] = useState(false);
  // This will store the data for the celebration screen
  const [celebrationDisplayData, setCelebrationDisplayData] = useState<{ 
    title: string;
    genre: string;
  } | null>(null);
  // This will store the full project object to pass to onProjectComplete after celebration
  const [projectDataForCompletionCall, setProjectDataForCompletionCall] = useState<Project | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [goldStreak, setGoldStreak] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSliderAudioRef = useRef(0);

  // Unlock condition for Apply Optimal Focus button
  const managementSkillLevel = gameState.playerData.skills.management?.level || 0;
  const playerLevel = gameState.playerData.level;
  const canUseOptimalFocusButton = managementSkillLevel >= 3 || playerLevel >= 5;

  const { settings } = useSettings();
  const gamepad = useGamepad({
    preferredLayout: settings?.controllerLayout,
    hapticsEnabled: settings?.gamepadHaptics,
  });

  // 🔥 Overdrive risk/reward toggle (consumed by useStageWork on the next session)
  const overdriveArmed = !!gameState.activeProject?.overdriveArmed;
  const toggleOverdrive = () => {
    if (!gameState.activeProject) return;
    if (!overdriveArmed && gameState.playerData.dailyWorkCapacity < 2) {
      toast({
        title: '⚡ Not Enough Energy',
        description: 'Overdrive burns 2 energy — advance the day to recharge.',
        variant: 'destructive',
        className: 'bg-stone-800 border-stone-600 text-white',
      });
      return;
    }
    setGameState(prev => ({
      ...prev,
      activeProject: prev.activeProject
        ? { ...prev.activeProject, overdriveArmed: !prev.activeProject.overdriveArmed }
        : null,
    }));
    playSound(overdriveArmed ? 'notification.wav' : 'ui sfx/purchase-complete.m4a', 0.5);
  };

  // 🏦 Streak Bank (k6e.5): cash out the same-day take combo for instant cash
  // + XP. Only a gold release preserves the streak; every other outcome spends
  // it (comboCount → 0), so banking trades future output for liquidity now.
  const handleStreakBank = (result: BankResult) => {
    if (!gameState.activeProject) return;
    setGameState(prev => ({
      ...prev,
      money: prev.money + result.cash,
      playerData: {
        ...prev.playerData,
        xp: prev.playerData.xp + result.xp,
      },
      activeProject: prev.activeProject
        ? {
            ...prev.activeProject,
            comboCount: result.keepsCombo ? prev.activeProject.comboCount : 0,
          }
        : null,
    }));
    toast({
      title: `🏦 ${result.label}`,
      description: `+$${result.cash} cash · +${result.xp} XP${result.keepsCombo ? ' · ⚡ streak kept!' : ''}`,
      className: 'bg-stone-800 border-stone-600 text-white',
      duration: 2600,
    });
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
        className: "bg-stone-800 border-stone-600 text-white",
        duration: 4500
      });

      playSound('notification', 0.45);
      return () => window.clearTimeout(pulseTimer);
    }
  }, [gameState.activeProject?.id, autoTriggeredMinigame, showMinigame]);

  // Hoisted above the early return: hooks must run unconditionally (Rules of Hooks).
  const showAdvancedQueue = useFeatureFlag('advanced-production-queue');
  const activeSynergies = React.useMemo(
    () => gameState.activeProject ? evaluateProjectSynergies(gameState.activeProject, gameState) : [],
    [gameState]
  );
  // Console take-loop state (hoisted for the same Rules-of-Hooks reason — these
  // were below the early return and caused the post-settlement white screen, GH-65).
  const [takeState, setTakeState] = useState<'idle' | 'tracking'>('idle');
  const [lastTakeGrade, setLastTakeGrade] = useState<{ grade: string; text: string } | null>(null);
  const setTakeCalibrationFocused = useUiChromeStore((s) => s.setTakeCalibrationFocused);
  const availableEnergy = gameState.playerData.dailyWorkCapacity;
  const isProjectComplete = !!gameState.activeProject && gameState.activeProject.stages.every(stage => stage.completed);

  // Shared chrome host: hide First Session coach while Take Calibration owns the dock.
  useEffect(() => {
    setTakeCalibrationFocused(takeState === 'tracking');
    return () => setTakeCalibrationFocused(false);
  }, [takeState, setTakeCalibrationFocused]);

  // Gamepad take shortcuts (hoisted so the hook order stays stable when a project
  // settles — Rules of Hooks, GH-65). Handlers are only reached with a live project.
  useEffect(() => {
    if (!gameState.activeProject) return;
    if (!gamepad.isConnected || takeState !== 'idle') return;

    if (gamepad.justPressed.south) {
      if (availableEnergy > 0 && !isProjectComplete) {
        handleArmTake();
        gamepad.triggerHaptic(0.2, 0.4, 60);
      }
    } else if (gamepad.justPressed.north || gamepad.justPressed.west) {
      if ((availableEnergy >= 2 || overdriveArmed) && !isProjectComplete) {
        toggleOverdrive();
        gamepad.triggerHaptic(0.2, 0.3, 50);
      }
    }
  }, [
    gameState.activeProject,
    gamepad.isConnected,
    gamepad.justPressed.south,
    gamepad.justPressed.north,
    gamepad.justPressed.west,
    takeState,
    availableEnergy,
    overdriveArmed,
    isProjectComplete,
  ]);

  if (!gameState.activeProject) {
    return (
      <div className="flex-1 space-y-4">
        {/* Studio Header */}
        <div className="bg-purple-500/[0.08] border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎵</span>
            <div>
              <h2 className="text-lg font-bold text-white">Studio Workspace</h2>
              <p className="text-sm text-stone-300">Work on your projects here</p>
            </div>
          </div>
        </div>
        
        <GamePanel className="flex-1 p-6 backdrop-blur-sm">
          <div className="text-center text-stone-400 animate-fade-in">
            <div className="text-6xl mb-4 animate-pulse">🎵</div>
            <h3 className="text-xl font-bold mb-2 text-white">Studio Ready</h3>
            <p className="mb-4 text-stone-300">Choose an artist enquiry, then bring their session into the room.</p>
            <div className="bg-stone-950/60 border border-stone-700/80 rounded-lg p-4 text-sm text-amber-200 shadow-inner">
              <p className="font-semibold mb-2">📱 Your next move:</p>
              <p>1. Browse the Artist Enquiries board</p>
              <p>2. Book a session that fits your room and crew</p>
              <p>3. Return here to run the recording session</p>
            </div>
          </div>
        </GamePanel>
      </div>
    );
  }

  const project = gameState.activeProject;
  
  // Calculate progress for current stage
  const currentStage = project.stages[project.currentStageIndex] || project.stages[0];
  const currentStageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100 : 0;

  // Stage completion flag (isProjectComplete is hoisted above the early return).
  const isCurrentStageComplete = currentStage && currentStage.workUnitsCompleted >= currentStage.workUnitsBase;

  // DERIVE projectFocus from gameState.activeProject.focusAllocation
  const projectFocus = project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 }; // Fallback if somehow undefined

  // Aggregate skills of staff assigned to this project
  const assignedStaffToThisProject = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id);
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
    playSound('start_minigame', 0.55);
    window.setTimeout(() => {
      setSelectedMinigame(autoTriggeredMinigame.type);
      setShowMinigame(true);
    }, 150);
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

    playSound('reward', 0.5);
    // Tactile action feedback communicated within short beat (~180ms)
    window.setTimeout(() => {
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
        className: "bg-stone-800 border-stone-600 text-white",
        duration: 3500
      });
    }, 180);
  };

  const handleSkipIntervention = () => {
    playSound('ui-click', 0.4);
    window.setTimeout(() => {
      clearAutoTriggeredMinigame?.();
    }, 150);
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
      className: "bg-stone-800 border-stone-600 text-white",
      duration: 3000
    });
  };

  const energySaver = hasActiveChoreBuff(gameState.choreState, 'energy_saver');
  const energyCost = calculateTakeEnergyCost(availableEnergy, overdriveArmed, energySaver);

  const handleArmTake = () => {
    if (availableEnergy <= 0 || isProjectComplete) return;
    hapticTick(14);
    playSound('ui-click', 0.5);
    if ((gameAudio as any).playGearSwitch) (gameAudio as any).playGearSwitch();
    setTakeState('tracking');
  };

  const handleLockTake = (needlePosition: number) => {
    const timingBonus = getActiveBuffMagnitude(gameState.choreState, 'timing_bonus');
    const verdict = evaluateTakeAccuracy(needlePosition, timingBonus);
    setTakeState('idle');

    // Trigger Tone.js chord synthesis + SFX
    if ((gameAudio as any).playTakeChord) (gameAudio as any).playTakeChord(project.genre, verdict.grade);
    triggerScreenShake('light');
    window.dispatchEvent(new CustomEvent<RewardPopDetail>(REWARD_POP_EVENT, {
      detail: {
        label: `${verdict.label.toUpperCase()} +${verdict.qualityBonus}Q`,
        tier: takePopTier(verdict.grade),
        tone: verdict.grade === 'Gold' ? 'gold' : verdict.grade === 'Silver' ? 'silver' : 'plain',
      },
    }));

    // Calculate expected gains for animation
    const baseCreativity = gameState.playerData.dailyWorkCapacity * gameState.playerData.attributes.creativeIntuition;
    const baseTechnical = gameState.playerData.attributes.technicalAptitude;
    const creativityGain = Math.floor((baseCreativity * (projectFocus.performance / 100) * 0.8 + baseCreativity * (projectFocus.layering / 100) * 0.6) * verdict.multiplier);
    const technicalGain = Math.floor((baseTechnical * (projectFocus.soundCapture / 100) * 0.8 + baseTechnical * (projectFocus.layering / 100) * 0.4) * verdict.multiplier);

    setLastGains({ creativity: creativityGain, technical: technicalGain });
    setShowBlobAnimation(true);

    // Execute work in useStageWork with take bonuses
    const result = performDailyWork?.({
      energyCost,
      takeGrade: verdict.grade,
      takeMultiplier: verdict.multiplier,
      qualityBonus: verdict.qualityBonus
    });

    if (result?.isComplete && result.finalProjectData) {
      playSound('project-complete', 0.8);
      const isMilestone = verdict.grade === 'Gold' || verdict.grade === 'Platinum' || (result.finalProjectData.overallQualityScore ?? 0) >= 80;
      if (isMilestone) {
        setCelebrationDisplayData({ title: result.finalProjectData.title, genre: result.finalProjectData.genre });
        setProjectDataForCompletionCall(result.finalProjectData);
        setShowCelebration(true);
      } else {
        // Reserve full-screen celebrations for actual milestones; direct settle for routine sessions (#75)
        onProjectComplete?.(result.finalProjectData);
      }
    }

    if (verdict.grade === 'Gold') {
      if (goldStreak >= 1) {
        window.dispatchEvent(new CustomEvent<RewardPopDetail>(REWARD_POP_EVENT, {
          detail: { label: `${goldStreak + 1}X COMBO!`, tier: goldStreak >= 3 ? 'jackpot' : 'big', tone: 'gold' },
        }));
      }
      setGoldStreak(prev => prev + 1);
    } else if (verdict.grade !== 'Silver') {
      setGoldStreak(0);
    }

    setLastTakeGrade({
      grade: verdict.grade,
      text: `${verdict.label}! +${verdict.qualityBonus} Quality (${Math.round((verdict.multiplier - 1) * 100)}% Boost)`
    });

    toast({
      title: verdict.grade === 'Gold' ? '🔥 IN THE POCKET! (Gold Take)' : verdict.grade === 'Silver' ? '✨ TIGHT TAKE! (Silver Take)' : '🎵 SOLID TAKE',
      description: `${verdict.label}: Advanced stage with ${energyCost} energy spent.`,
      className: verdict.grade === 'Gold' ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-800 border-stone-600 text-white',
      duration: 3000
    });
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
        className="flex-1 min-h-0 flex flex-col w-full overflow-hidden bg-stone-950 border border-stone-700/80 rounded-[2px] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.85)] relative"
      >
        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>
        <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>

        {/* Pinned Top Bar: Project Meta & LED telemetry */}
        <div className="shrink-0 mb-2.5 bg-stone-950/80 border border-stone-800/90 rounded-[2px] p-2.5 shadow-inner relative z-10">
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
              <div className="text-xs text-stone-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{project.genre} · {project.clientName || project.clientType}</span>
                <span className="text-emerald-400 font-semibold">💰 ${Math.round(project.payoutBase)}</span>
                <span className="text-amber-300">⭐ Diff {project.difficulty}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs tabular-nums">
              <div className="text-right">
                <div className="text-[11px] text-amber-300 font-semibold">{project.durationDaysTotal}d duration</div>
                <div className="text-[10px] text-stone-400">{Math.round(project.workSessionCount || 0)} sessions</div>
              </div>
              <button
                onClick={() => setShowDutiesClipboard(true)}
                className="flex items-center gap-1.5 px-2 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 rounded text-xs text-amber-200 transition-colors shadow-sm"
                title="Open Studio Maintenance Duties"
              >
                <ClipboardList size={13} className="text-amber-400" />
                <span>Duties</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-900/60 px-1 rounded">
                  {Object.values(gameState.choreState?.chores || {}).filter(c => c.completed).length}/5
                </span>
              </button>
              <div className="flex items-center gap-2 bg-stone-900/90 px-2 py-1 rounded border border-stone-700/70">
                <div id="creativity-points" data-creativity-target className="text-amber-300 font-bold flex items-center gap-1 text-xs">
                  <span>🎨</span> {Math.round(project.accumulatedCPoints || 0)}
                </div>
                <div className="w-px h-3 bg-stone-700" />
                <div id="technical-points" data-technical-target className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <span>⚙️</span> {Math.round(project.accumulatedTPoints || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Session Hardware & Maintenance Buff Chips */}
        {gameState.choreState?.activeBuffs && gameState.choreState.activeBuffs.length > 0 && (
          <div className="shrink-0 mb-2 px-2.5 py-1.5 bg-stone-900/90 border border-stone-700/60 rounded-[2px] flex items-center gap-2 overflow-x-auto select-none shadow-inner">
            <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACTIVE BUFFS:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {gameState.choreState.activeBuffs.map(buff => {
                const config = {
                  timing_bonus: { icon: '🧲', label: `+${Math.round(buff.magnitude * 100)}% Pocket Sweet Spot`, bg: 'bg-amber-950/70 border-amber-500/50 text-amber-300' },
                  tech_bonus: { icon: '🎛️', label: `+${Math.round(buff.magnitude * 100)}% Technical Gain`, bg: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' },
                  creativity_bonus: { icon: '✨', label: `+${Math.round(buff.magnitude * 100)}% Creativity Gain`, bg: 'bg-purple-950/70 border-purple-500/50 text-purple-300' },
                  energy_saver: { icon: '⚡', label: `Overdrive -${buff.magnitude}⚡ Cost`, bg: 'bg-stone-950/70 border-amber-500/50 text-amber-200' },
                  vibe_boost: { icon: '☕', label: `+${Math.round(buff.magnitude * 100)}% Client Vibe`, bg: 'bg-rose-950/70 border-rose-500/50 text-rose-300' },
                }[buff.buffType] || { icon: '🔧', label: buff.buffType, bg: 'bg-stone-800 border-stone-600 text-stone-300' };

                return (
                  <span
                    key={buff.id}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border shadow-sm shrink-0 ${config.bg}`}
                    title={`${config.label} (${buff.remainingSessions} session remaining)`}
                  >
                    <span>{config.icon}</span>
                    <span className="font-semibold">{config.label}</span>
                    <span className="opacity-70 text-[9px] bg-black/40 px-1 rounded font-sans">
                      {buff.remainingSessions}s
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

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
            <div className="p-3 bg-purple-500/[0.12] border border-purple-500/70 rounded-lg animate-scale-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-yellow-300 font-semibold text-xs mb-0.5">🎯 Optional Studio Intervention</h4>
                  <p className="text-stone-300 text-xs">{autoTriggeredMinigame.reason}</p>
                </div>
                <div className="text-xl">🎮</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <MotionButton
                  onClick={handleStartIntervention}
                  className="h-7 text-xs bg-purple-400/[0.14] ring-1 ring-inset ring-purple-400/45 hover:bg-purple-400/[0.24] text-purple-100 font-bold rounded"
                >
                  Intervene
                </MotionButton>
                <MotionButton
                  onClick={handleDelegateIntervention}
                  disabled={!bestDelegate}
                  className="h-7 text-xs border border-amber-500/50 text-stone-200 hover:bg-stone-900/30 rounded"
                  title={bestDelegate ? bestDelegate.fit.reasons.join(' · ') : 'No available staff'}
                >
                  {bestDelegate ? `Delegate: ${bestDelegate.staff.name.split(' ')[0]}` : 'Delegate'}
                </MotionButton>
                <MotionButton
                  onClick={handleSkipIntervention}
                  className="h-7 text-xs text-stone-300 hover:bg-stone-800/50 rounded"
                >
                  Skip
                </MotionButton>
              </div>
            </div>
          )}

          {/* Stage Completion Notification */}
          {isCurrentStageComplete && !isProjectComplete && (
            <div className="p-3 bg-emerald-500/[0.10] border border-green-500/70 rounded-lg animate-scale-in flex items-center justify-between">
              <div>
                <h4 className="text-green-400 font-semibold text-xs">✅ Stage Complete!</h4>
                <p className="text-stone-300 text-xs">
                  {currentStage.stageName} finished. Work next session to advance.
                </p>
              </div>
              <div className="text-xl">🎉</div>
            </div>
          )}

          {/* Active Studio Synergies (Kairosoft Combos) */}
          {activeSynergies.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1 shrink-0">
                <span>✨</span>
                <span>Active Combos ({activeSynergies.length}):</span>
              </span>
              <SynergyBadgeList synergies={activeSynergies} size="sm" />
            </div>
          )}

          {/* Dual Progress Meters */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-[2px] p-2.5">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="text-stone-400">Stage {project.currentStageIndex + 1}/{project.stages.length}:</span>
                <span className="text-amber-200 font-bold">{currentStage?.stageName}</span>
                {focusEffectiveness.effectiveness > 0.8 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🚀 Optimized
                  </span>
                )}
              </span>
              <span className="text-stone-400 text-xs tabular-nums flex items-center gap-1.5">
                <span>{Math.round(currentStage?.workUnitsCompleted || 0)} / {currentStage?.workUnitsBase || 0} units</span>
                {focusEffectiveness.effectiveness > 0.7 && (
                  <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-200">⚡ Efficient</span>
                )}
              </span>
            </div>
            <Progress 
              value={currentStageProgress} 
              className="h-2.5 mb-2 transition-all duration-300"
              aria-label={`${currentStage?.stageName || 'Current stage'} progress`}
            />

            <div className="flex justify-between items-center text-[11px] text-stone-400 mt-1">
              <span>Overall Track Progress</span>
              <span className="font-bold text-stone-300 tabular-nums">{Math.round(overallProgress)}%</span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-1.5 bg-stone-800 progress-bar transition-all duration-300"
              aria-label="Overall project progress"
            />
          </div>

          {/* Focus Allocation Console Module */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-[2px] p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
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
                }}
                disabled={!canUseOptimalFocusButton}
                size="sm"
                variant="outline"
                className={`text-[11px] h-7 px-2.5 border transition-colors ${
                  canUseOptimalFocusButton
                    ? 'bg-violet-900/40 border-violet-500/50 text-violet-200 hover:bg-violet-800/60'
                    : 'bg-stone-800/40 border-stone-700 text-stone-500 cursor-not-allowed'
                }`}
                title={canUseOptimalFocusButton ? 'Auto-align to stage target' : 'Requires Level 5+ or Management Level 3+'}
              >
                🎯 Auto-Align
              </Button>
            </div>

            {/* 3-Channel Mixing Strips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Channel 1: Performance */}
              <div className="bg-stone-900/80 border border-stone-800/90 p-2 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200 truncate">
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
                <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
                  <span>Target: {Math.max(0, optimalFocus.performance - 10)}–{Math.min(100, optimalFocus.performance + 10)}%</span>
                  <span className={Math.abs(projectFocus.performance - optimalFocus.performance) <= 10 ? 'text-emerald-400 font-semibold' : 'text-stone-500'}>
                    {Math.abs(projectFocus.performance - optimalFocus.performance) <= 10 ? '✓ Optimal' : 'Adjust'}
                  </span>
                </div>
              </div>

              {/* Channel 2: Sound Capture */}
              <div className="bg-stone-900/80 border border-stone-800/90 p-2 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200 truncate">
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
                <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
                  <span>Target: {Math.max(0, optimalFocus.soundCapture - 10)}–{Math.min(100, optimalFocus.soundCapture + 10)}%</span>
                  <span className={Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 10 ? 'text-emerald-400 font-semibold' : 'text-stone-500'}>
                    {Math.abs(projectFocus.soundCapture - optimalFocus.soundCapture) <= 10 ? '✓ Optimal' : 'Adjust'}
                  </span>
                </div>
              </div>

              {/* Channel 3: Layering */}
              <div className="bg-stone-900/80 border border-stone-800/90 p-2 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200 truncate">
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
                <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
                  <span>Target: {Math.max(0, optimalFocus.layering - 10)}–{Math.min(100, optimalFocus.layering + 10)}%</span>
                  <span className={Math.abs(projectFocus.layering - optimalFocus.layering) <= 10 ? 'text-emerald-400 font-semibold' : 'text-stone-500'}>
                    {Math.abs(projectFocus.layering - optimalFocus.layering) <= 10 ? '✓ Optimal' : 'Adjust'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Guidance Note */}
            <div className="text-[11px] text-stone-400 bg-stone-900/60 px-2.5 py-1.5 rounded border border-stone-800 flex items-center gap-1.5">
              <span className="text-amber-300">💡</span>
              <span className="text-stone-300 font-medium">{currentStage.stageName}:</span>
              <span className="truncate">{optimalFocus.reasoning}</span>
            </div>
          </div>
        </div>

        {/* Industrial Console Transport Dock */}
        <div className="shrink-0 pt-2.5 mt-2 border-t border-stone-800 bg-stone-950/95 relative z-10">
          {takeState === 'tracking' ? (
            <div className="space-y-2">
              <PocketMeter
                isArmed={true}
                onLock={handleLockTake}
                timingBonus={getActiveBuffMagnitude(gameState.choreState, 'timing_bonus')}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                {lastTakeGrade && (
                  <div className="px-2 py-1 flex-1 text-center text-xs font-mono font-bold tracking-wide text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-[2px]">
                    {lastTakeGrade.text}
                  </div>
                )}
                {goldStreak > 1 && (
                  <MotionReveal direction="up" distance={6}>
                    <div className="px-2.5 py-1 text-xs font-black tracking-wider text-stone-950 bg-amber-300 border border-amber-200 rounded-[2px] shadow-[0_0_12px_rgba(251,191,36,0.8)] flex items-center gap-1 shrink-0">
                      <span>🔥</span>
                      <span>{goldStreak}X GOLD STREAK!</span>
                    </div>
                  </MotionReveal>
                )}
              </div>

              {/* 🏦 Streak Bank (k6e.5) — combo cash-out with hold-to-amplify.
                  Mounted for the whole session: the control self-hides at idle
                  combo < 2, but must STAY mounted while its settle chip shows
                  (a spent streak is combo 0 — gating on combo would unmount the
                  chip before the player sees the payout). */}
              {!isProjectComplete && (
                <StreakBankControl
                  combo={project.comboCount ?? 0}
                  level={gameState.playerData.level}
                  onBank={handleStreakBank}
                />
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleOverdrive}
                  disabled={availableEnergy < 2 || isProjectComplete}
                  variant="outline"
                  className={`h-9 text-xs font-mono font-bold uppercase rounded-[2px] flex-1 border transition-all flex items-center justify-center gap-1.5 ${
                    overdriveArmed
                      ? 'bg-orange-400/[0.16] border-orange-400/55 text-orange-100'
                      : 'bg-stone-900 border-stone-700 text-orange-400 hover:bg-stone-800'
                  }`}
                >
                  {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                    <GamepadGlyph button="north" size="xs" />
                  )}
                  <span>
                    {overdriveArmed
                      ? `🔥 OVERDRIVE ENGAGED (${energyCost}⚡ · ${energySaver ? '⚡-1 Saver' : '+75%'})`
                      : `🔥 ARM OVERDRIVE (${energySaver ? '1⚡ with Patchbay' : '2⚡'} · +75%)`}
                  </span>
                </Button>
              </div>

              <button
                onClick={handleArmTake}
                disabled={availableEnergy <= 0 || isProjectComplete}
                aria-label="Work on Project"
                className={`w-full py-3.5 text-sm font-black uppercase tracking-wider rounded-[2px] border transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isProjectComplete
                    ? 'bg-emerald-400/[0.16] border-emerald-400/55 text-emerald-100'
                    : availableEnergy > 0
                    ? 'bg-red-400/[0.14] hover:bg-red-400/[0.24] border-red-400 text-red-100 shadow-[0_0_12px_rgba(220,38,38,0.5)] active:scale-[0.99]'
                    : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                {isProjectComplete ? (
                  '🎉 PROJECT READY FOR REVIEW!'
                ) : availableEnergy > 0 ? (
                  <>
                    {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                      <GamepadGlyph button="south" size="xs" />
                    )}
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping mr-1" />
                    <span>ARM TAKE ({energyCost}⚡ · {availableEnergy} LEFT)</span>
                  </>
                ) : (
                  '⚡ OUT OF WORK CAPACITY — ADVANCE DAY'
                )}
              </button>
            </div>
          )}
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

        <StudioDutiesClipboard
          gameState={gameState}
          setGameState={setGameState}
          isOpen={showDutiesClipboard}
          onClose={() => setShowDutiesClipboard(false)}
        />
      </div>
    </>
  );
};
