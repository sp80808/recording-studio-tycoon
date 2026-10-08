import { RECORDING_INTENTS, matchesRecordingIntent } from '@/session/recordingIntent';
import { isProjectReadyForReview, traceReviewFlow } from '@/utils/projectReviewFlow';
import { StatIcon } from '@/components/icons/GameIcons';
import { trackIntervention, trackInterventionOffered, trackFeatureUsed } from '@/telemetry/instrument';
import { money } from '@/utils/displayMoney';
import { emitTakeFeedback } from '@/utils/takeFeedback';
import { ProducerSprite } from '@/components/ProducerSprite';
import { MotionButton, MotionReveal, MotionNumber } from '@/components/motion/primitives';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { GamePanel } from '@/components/ui/GamePanel';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
// GameState and FocusAllocation are imported below with Project
import { MinigameManager, MinigameType } from './minigames/MinigameManager';
import { WorldInteraction } from './minigames/WorldInteraction';
import { worldTargetForIntervention } from '@/session/worldSessionActions';
import { AnimatedStatBlobs } from './AnimatedStatBlobs';
import { OrbAnimationStyles } from './OrbAnimationStyles';

const DIEGETIC_MINIGAMES = new Set<string>(['gain-stage', 'phase-check']);
import { ProjectCompletionCelebration } from './ProjectCompletionCelebration';
import { EnhancedAnimationStyles } from './EnhancedAnimationStyles';
import { toast } from '@/hooks/use-toast';
import { playSound, gameAudio } from '@/utils/audioSystem'; // Updated import
import { triggerScreenShake } from '@/utils/screenShake';
import { REWARD_POP_EVENT, takePopTier, type RewardPopDetail } from '@/utils/rewardFx';
import { evaluateTakeAccuracy, calculateTakeEnergyCost } from '@/rpg/takeEvaluation';
import { StreakBankControl } from './StreakBankControl';
import type { BankResult } from '@/rpg/streakBank';
import { resolveProducerFeatureUnlocks, nextFeatureReveal, acknowledgeFeatureReveal, type ProducerFeature } from '@/rpg/featureUnlocks';
import { FeatureRevealBanner } from './FeatureRevealBanner';
import { hasActiveChoreBuff, getActiveBuffMagnitude } from '@/simulation/choreEngine';
import { IdleConsole } from '@/components/console/IdleConsole';
import { PocketMeter, type TakeLockSource } from '@/components/console/PocketMeter';

/** Inter-take dock pacing — keep calibration a quick console check, not a chapter. */
export const TAKE_SESSION_PACING = {
  /** Brief beat after a lock so grade juice lands before the next needle arm. */
  postTakeRearmMs: 320,
  /** Take result toast — short so it does not outlast the next arm. */
  takeToastMs: 1400,
} as const;
import { StudioDutiesClipboard } from './chores/StudioDutiesClipboard';
import { StudioStampChip, type StudioStampTone } from './StudioStampChip';
import { ChoreHotspotButton } from './chores/ChoreHotspotButton';
import RiderPanel from '@/components/RiderPanel';
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

import { earn } from '@/economy/ledger';
import { GameState, FocusAllocation, Project, PlayerData, SessionIntervention } from '@/types/game';
import { useFeatureFlag } from '@/stores/featureFlagStore';
import ProductionQueuePanel from '@/components/ProductionQueue/ProductionQueuePanel';
import { rankStaffForProject } from '@/utils/staffFitUtils';
import { evaluateProjectSynergies } from '@/utils/synergyUtils';
import { SynergyBadgeList } from '@/components/synergy/SynergyBadgeList';
import { hapticTick } from '@/utils/mobilePlatform';
import { usePhoneSession } from '@/hooks/usePhoneSession';
import { MobileSessionStatusStrip } from '@/components/console/MobileSessionStatusStrip';
import { MobileFocusMixer } from '@/components/console/MobileFocusMixer';

import { OutsideHelpCard } from '@/components/OutsideHelpCard';
import { debugLog } from '@/utils/debugLog';

interface ActiveProjectProps {
  gameState: GameState;
  presentation?: 'panel' | 'world';
  controlsEnabled?: boolean;
  interventionOnly?: boolean;
  onCloseConsole?: () => void;
  onRest?: () => void;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void; // Made non-optional as it's crucial for updating project focus
  // focusAllocation prop is removed, as it will be derived from gameState.activeProject.focusAllocation
  // setFocusAllocation prop is removed, will be handled by a new specific updater function if manual adjustment is kept, or via setGameState
  performDailyWork?: (options?: import('@/hooks/useStageWork').PerformDailyWorkOptions) => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string, rawScore?: number, opportunityId?: string) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  /** Idle console: book an enquiry straight from the console. */
  onBookEnquiry?: (project: Project) => void;
  /** Idle console: open the full enquiries board. */
  onOpenBookings?: () => void;
  autoTriggeredMinigame?: SessionIntervention | null;
  clearAutoTriggeredMinigame?: () => void;
  onLockHotspot?: (id: import('@/components/WebGLCanvas').StudioHotspotId | null) => void;
}

export const ActiveProject: React.FC<ActiveProjectProps> = ({
  gameState,
  presentation = 'panel',
  controlsEnabled = true,
  interventionOnly = false,
  onCloseConsole,
  onRest,
  setGameState, // Now non-optional
  performDailyWork,
  onMinigameReward,
  onProjectComplete,
  onProjectSelect,
  onBookEnquiry,
  onOpenBookings,
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame,
  onLockHotspot
}) => {
  const { t } = useTranslation();
  const [showMinigame, setShowMinigame] = useState(false);
  const minigameOpportunityRef = useRef<SessionIntervention | null>(null);
  const claimedOpportunityIdsRef = useRef(new Set<string>());
  const latestRewardOwnerRef = useRef({ controlsEnabled, projectId: gameState.activeProject?.id, stageIndex: gameState.activeProject?.currentStageIndex, opportunityId: autoTriggeredMinigame?.id });
  latestRewardOwnerRef.current = { controlsEnabled, projectId: gameState.activeProject?.id, stageIndex: gameState.activeProject?.currentStageIndex, opportunityId: autoTriggeredMinigame?.id };
  const [selectedMinigame, setSelectedMinigame] = useState<MinigameType>('rhythm');

  useEffect(() => {
    if (showMinigame && DIEGETIC_MINIGAMES.has(selectedMinigame)) {
      onLockHotspot?.(worldTargetForIntervention(selectedMinigame));
    } else {
      onLockHotspot?.(null);
    }
    // Cleanup on unmount
    return () => onLockHotspot?.(null);
  }, [showMinigame, selectedMinigame, onLockHotspot]);

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
  // Progressive unlocks (#260): hidden controls can't be reached by keyboard/gamepad either.
  const featureUnlocks = resolveProducerFeatureUnlocks(gameState);
  const overdriveUnlocked = featureUnlocks.overdrive.unlocked;
  const streakBankUnlocked = featureUnlocks['streak-bank'].unlocked;
  const pendingReveal = nextFeatureReveal(gameState);
  const acknowledgeReveal = (f: ProducerFeature) => setGameState(prev => acknowledgeFeatureReveal(prev, f));
  const overdriveArmed = overdriveUnlocked && !!gameState.activeProject?.overdriveArmed;
  const toggleOverdrive = () => {
    if (!gameState.activeProject || !overdriveUnlocked) return;
    if (!overdriveArmed && gameState.playerData.dailyWorkCapacity < 2) {
      toast({
        title: '⚡ Not Enough Energy',
        description: 'Overdrive burns 2 energy — advance the day to recharge.',
        variant: 'destructive',
        className: 'bg-stone-800 border-stone-600 text-white',
      });
      return;
    }
    if (!overdriveArmed) trackFeatureUsed(gameState.currentDay, 'overdrive');
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
    if (!gameState.activeProject || !streakBankUnlocked) return;
    trackFeatureUsed(gameState.currentDay, 'streak-bank');
    setGameState(prev => ({
      ...earn(prev, result.cash, { category: 'reward-income', projectId: prev.activeProject?.id, memo: 'Streak bank' }),
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
      description: `+${money(result.cash)} cash · +${result.xp} XP${result.keepsCombo ? ' · ⚡ streak kept!' : ''}`,
      className: 'bg-stone-800 border-stone-600 text-white',
      duration: 2600,
    });
  };

  const isProjectComplete = isProjectReadyForReview(gameState.activeProject);

  // Present an intervention as an optional opportunity. It never opens itself
  // and never pauses ordinary session progress.
  useEffect(() => {
    if (gameState.activeProject && !isProjectComplete && !showMinigame && autoTriggeredMinigame) {
      trackInterventionOffered(gameState.currentDay, autoTriggeredMinigame.type, autoTriggeredMinigame.id);
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
  }, [gameState.activeProject?.id, autoTriggeredMinigame, showMinigame, isProjectComplete]);

  // Hoisted above the early return: hooks must run unconditionally (Rules of Hooks).
  const showAdvancedQueue = useFeatureFlag('advanced-production-queue');
  // #141: phones get a zero-scroll single-viewport composition; desktop is unchanged.
  const isPhone = usePhoneSession();
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
  const rearmTimerRef = useRef<number | null>(null);

  // Active slider channel for gamepad spatial control (Performance, Sound Capture, Layering)
  const [selectedSliderChannel, setSelectedSliderChannel] = useState<'performance' | 'soundCapture' | 'layering'>('performance');
  const handleFocusChangeRef = useRef<(key: keyof FocusAllocation, value: number) => void>(() => {});
  const handleAutoAlignRef = useRef<() => void>(() => {});
  const currentFocusRef = useRef<FocusAllocation>({ performance: 33, soundCapture: 33, layering: 34 });
  currentFocusRef.current = gameState.activeProject?.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 };

  const clearTakeRearm = () => {
    if (rearmTimerRef.current !== null) {
      window.clearTimeout(rearmTimerRef.current);
      rearmTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTakeRearm(), []);

  useEffect(() => {
    if (!controlsEnabled) {
      clearTakeRearm();
      setTakeState('idle');
      setShowMinigame(false);
    }
  }, [controlsEnabled]);

  // A finished project has no live session left to operate. Stop both the
  // console calibration loop and any open intervention before review appears.
  useEffect(() => {
    if (!isProjectComplete) return;
    clearTakeRearm();
    setTakeState('idle');
    setShowMinigame(false);
    clearAutoTriggeredMinigame?.();
  }, [isProjectComplete, clearAutoTriggeredMinigame]);

  // Shared chrome host: hide First Session coach while Take Calibration owns the dock.
  useEffect(() => {
    setTakeCalibrationFocused(takeState === 'tracking');
    return () => setTakeCalibrationFocused(false);
  }, [takeState, setTakeCalibrationFocused]);

  useEffect(() => {
    useUiChromeStore.getState().setConsoleFocused(presentation === 'world' && controlsEnabled);
    return () => useUiChromeStore.getState().setConsoleFocused(false);
  }, [presentation, controlsEnabled]);

  // Gamepad take shortcuts & slider tuning (hoisted so the hook order stays stable when a project
  // settles — Rules of Hooks, GH-65). Handlers are only reached with a live project.
  useEffect(() => {
    if (!gameState.activeProject || !controlsEnabled || !gamepad.isConnected) return;

    // Channel switching: LB / RB or D-pad Up / Down
    if (gamepad.justPressed.lb) {
      setSelectedSliderChannel((prev) => (prev === 'layering' ? 'soundCapture' : prev === 'soundCapture' ? 'performance' : 'layering'));
      gamepad.triggerHaptic(0.1, 0.2, 30);
    } else if (gamepad.justPressed.rb) {
      setSelectedSliderChannel((prev) => (prev === 'performance' ? 'soundCapture' : prev === 'soundCapture' ? 'layering' : 'performance'));
      gamepad.triggerHaptic(0.1, 0.2, 30);
    } else if (gamepad.justPressed.dpadUp) {
      setSelectedSliderChannel((prev) => (prev === 'layering' ? 'soundCapture' : 'performance'));
      gamepad.triggerHaptic(0.08, 0.15, 25);
    } else if (gamepad.justPressed.dpadDown) {
      setSelectedSliderChannel((prev) => (prev === 'performance' ? 'soundCapture' : 'layering'));
      gamepad.triggerHaptic(0.08, 0.15, 25);
    }

    // Slider adjustment: D-pad Left / Right
    if (gamepad.justPressed.dpadLeft) {
      const cur = currentFocusRef.current[selectedSliderChannel] || 0;
      handleFocusChangeRef.current(selectedSliderChannel, Math.max(0, cur - 5));
      gamepad.triggerHaptic(0.08, 0.15, 25);
    } else if (gamepad.justPressed.dpadRight) {
      const cur = currentFocusRef.current[selectedSliderChannel] || 0;
      handleFocusChangeRef.current(selectedSliderChannel, Math.min(100, cur + 5));
      gamepad.triggerHaptic(0.08, 0.15, 25);
    }

    // Left Stick horizontal smooth adjustment
    const stickThreshold = 0.5;
    if (Math.abs(gamepad.leftStick.x) > stickThreshold) {
      const now = performance.now();
      if (now - lastSliderAudioRef.current > 100) {
        lastSliderAudioRef.current = now;
        const cur = currentFocusRef.current[selectedSliderChannel] || 0;
        const delta = gamepad.leftStick.x > 0 ? 5 : -5;
        handleFocusChangeRef.current(selectedSliderChannel, Math.max(0, Math.min(100, cur + delta)));
        gamepad.triggerHaptic(0.05, 0.1, 20);
      }
    }

    // Auto-Align: North (Y on Xbox, △ on PS, X on Switch)
    if (gamepad.justPressed.north) {
      if (canUseOptimalFocusButton) {
        handleAutoAlignRef.current();
        gamepad.triggerHaptic(0.2, 0.4, 50);
      }
    }

    // Overdrive: West (X on Xbox, □ on PS, Y on Switch)
    if (gamepad.justPressed.west) {
      if (overdriveUnlocked && (availableEnergy >= 2 || overdriveArmed) && !isProjectComplete) {
        toggleOverdrive();
        gamepad.triggerHaptic(0.2, 0.3, 50);
      }
    }

    // Arm take when idle: South (A / ✕)
    if (takeState === 'idle' && gamepad.justPressed.south) {
      if (isProjectComplete) {
        handleOpenProjectReview();
        gamepad.triggerHaptic(0.2, 0.4, 60);
      } else if (availableEnergy > 0) {
        handleArmTake();
        gamepad.triggerHaptic(0.2, 0.4, 60);
      }
    }
  }, [
    gameState.activeProject,
    controlsEnabled,
    gamepad.isConnected,
    gamepad.justPressed.south,
    gamepad.justPressed.north,
    gamepad.justPressed.west,
    gamepad.justPressed.lb,
    gamepad.justPressed.rb,
    gamepad.justPressed.dpadUp,
    gamepad.justPressed.dpadDown,
    gamepad.justPressed.dpadLeft,
    gamepad.justPressed.dpadRight,
    gamepad.leftStick.x,
    selectedSliderChannel,
    takeState,
    availableEnergy,
    overdriveArmed,
    isProjectComplete,
    canUseOptimalFocusButton,
  ]);

  if (!gameState.activeProject) {
    return (
      <IdleConsole gameState={gameState} onBook={onBookEnquiry} onOpenBookings={onOpenBookings} onResume={onProjectSelect} />
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

  const claimVisibleOpportunity = (opportunity: SessionIntervention): boolean => {
    const owner = latestRewardOwnerRef.current;
    if (!owner.controlsEnabled || owner.projectId !== opportunity.projectId || owner.stageIndex !== opportunity.stageIndex || owner.opportunityId !== opportunity.id || claimedOpportunityIdsRef.current.has(opportunity.id)) return false;
    claimedOpportunityIdsRef.current.add(opportunity.id);
    return true;
  };

  const handleStartIntervention = () => {
    if (!controlsEnabled || !autoTriggeredMinigame) return;
    trackIntervention('intervened', gameState.currentDay, autoTriggeredMinigame.type);
    minigameOpportunityRef.current = autoTriggeredMinigame;
    playSound('start_minigame', 0.55);
    setSelectedMinigame(autoTriggeredMinigame.type);
    setShowMinigame(true);
  };

  const handleDelegateIntervention = () => {
    if (!controlsEnabled || !autoTriggeredMinigame || !bestDelegate) return;
    trackIntervention('delegated', gameState.currentDay, autoTriggeredMinigame.type);

    if (!claimVisibleOpportunity(autoTriggeredMinigame)) return;
    const { staff, fit } = bestDelegate;
    const baseBonus = Math.max(1, Math.min(8, Math.round(fit.score / 12)));
    const creativityLeaning = new Set<MinigameType>([
      'rhythm',
      'beatmaking',
      'vocal',
      'vocal-comp',
      'album-sequence',
      'layering'
    ]).has(autoTriggeredMinigame.type);

    const creativityBonus = creativityLeaning ? baseBonus : Math.max(1, Math.floor(baseBonus * 0.6));
    const technicalBonus = creativityLeaning ? Math.max(1, Math.floor(baseBonus * 0.6)) : baseBonus;
    const xpBonus = Math.max(1, Math.min(3, Math.floor(baseBonus / 2)));

    playSound('reward', 0.5);
    // Commit the existing reward immediately; feedback must not defer authority.
    onMinigameReward?.(
      creativityBonus,
      technicalBonus,
      xpBonus,
      autoTriggeredMinigame.type,
      undefined,
      autoTriggeredMinigame.id
    );
    clearAutoTriggeredMinigame?.();

    toast({
      title: "👥 Intervention Delegated",
      description: `${staff.name} handled it · ${fit.reasons.slice(0, 3).join(' · ')} · +${creativityBonus} C / +${technicalBonus} T`,
      className: "bg-stone-800 border-stone-600 text-white",
      duration: 3500
    });
  };

  const handleSkipIntervention = () => {
    if (!controlsEnabled) return;
    if (autoTriggeredMinigame) trackIntervention('skipped', gameState.currentDay, autoTriggeredMinigame.type);
    playSound('ui-click', 0.4);
    clearAutoTriggeredMinigame?.();
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
    const opportunity = minigameOpportunityRef.current;
    if (!opportunity || !claimVisibleOpportunity(opportunity)) return;
    const cappedCreativity = Math.min(12, Math.max(0, creativityBonus));
    const cappedTechnical = Math.min(12, Math.max(0, technicalBonus));
    const cappedXp = Math.min(5, Math.max(0, xpBonus));

    debugLog('🎮 Intervention rewards received:', {
      creativityBonus: cappedCreativity,
      technicalBonus: cappedTechnical,
      xpBonus: cappedXp,
      minigameType: selectedMinigame,
      rawScore
    });

    playSound('success', 0.7);
    if (onMinigameReward) {
      onMinigameReward(cappedCreativity, cappedTechnical, cappedXp, selectedMinigame, rawScore, opportunity.id);
    }

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

  // Authoritative review transition for an already-complete project (#255).
  // Works even if the final-take callback was missed (reload, race, other path).
  const handleOpenProjectReview = () => {
    const project = gameState.activeProject;
    if (!controlsEnabled || !project || !isProjectReadyForReview(project)) return;
    traceReviewFlow('recovery-cta', project.id);
    onProjectComplete?.(project);
  };

  const handleArmTake = () => {
    if (!controlsEnabled || availableEnergy <= 0 || isProjectComplete) return;
    clearTakeRearm();
    hapticTick(14);
    void gameAudio.playGearSwitch(); // one press, one cue (#256)
    setTakeState('tracking');
  };

  const handleStandDown = () => {
    clearTakeRearm();
    setTakeState('idle');
    playSound('ui-click', 0.35);
  };

  const handleLockTake = (needlePosition: number, source: TakeLockSource = 'player') => {
    if (!controlsEnabled || availableEnergy <= 0 || isProjectComplete) return;
    const timingBonus = getActiveBuffMagnitude(gameState.choreState, 'timing_bonus');
    const verdict = evaluateTakeAccuracy(needlePosition, timingBonus, settings.pocketMeterAssistance);
    clearTakeRearm();
    setTakeState('idle');

    // Trigger Tone.js chord synthesis + SFX
    void gameAudio.playTakeChord(project.genre, verdict.grade);
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
    if (presentation === 'panel') setShowBlobAnimation(true);

    const energyBefore = availableEnergy;
    // Execute work in useStageWork with take bonuses
    const result = performDailyWork?.({
      energyCost,
      takeGrade: verdict.grade,
      takeMultiplier: verdict.multiplier,
      qualityBonus: verdict.qualityBonus
    });

    traceReviewFlow('final-take', `complete=${Boolean(result?.isComplete)} data=${Boolean(result?.finalProjectData)}`);
    if (result?.isComplete && result.finalProjectData) {
      playSound('project-complete', 0.8);
      const isMilestone = presentation === 'panel' && verdict.grade === 'Gold';
      if (isMilestone) {
        setCelebrationDisplayData({ title: result.finalProjectData.title, genre: result.finalProjectData.genre });
        setProjectDataForCompletionCall(result.finalProjectData);
        setShowCelebration(true);
        traceReviewFlow('celebration-deferred', result.finalProjectData.id);
      } else {
        traceReviewFlow('on-project-complete', result.finalProjectData.id);
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

    if (verdict.grade === 'Gold' || verdict.grade === 'Silver' || verdict.grade === 'Solid') emitTakeFeedback(verdict.grade);
    setLastTakeGrade({
      grade: verdict.grade,
      text: `${source === 'auto' ? 'Auto-locked' : 'Locked'}: ${verdict.label}! +${verdict.qualityBonus} Quality (${Math.round((verdict.multiplier - 1) * 100)}% Boost)`
    });

    toast({
      title: verdict.grade === 'Gold' ? '🔥 IN THE POCKET! (Gold Take)' : verdict.grade === 'Silver' ? '✨ TIGHT TAKE! (Silver Take)' : '🎵 SOLID TAKE',
      description: `${source === 'auto' ? 'Auto-locked' : 'You locked it'} · ${verdict.label}: Advanced stage with ${energyCost} energy spent.`,
      className: verdict.grade === 'Gold' ? 'bg-amber-950 border-amber-500 text-amber-200' : 'bg-stone-800 border-stone-600 text-white',
      duration: TAKE_SESSION_PACING.takeToastMs
    });

    // Chain the next console check immediately when energy remains — no dead
    // ARM TAKE wait between takes in the same energy burst.
    const energyAfter = energyBefore - energyCost;
    if (result && !result.isComplete && energyAfter > 0) {
      rearmTimerRef.current = window.setTimeout(() => {
        rearmTimerRef.current = null;
        setTakeState('tracking');
        void gameAudio.playGearSwitch();
      }, TAKE_SESSION_PACING.postTakeRearmMs);
    }
  };

  const handleProjectCelebrationComplete = () => {
    debugLog('🎊 Celebration complete. Calling onProjectComplete with stored project data.');
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
  handleFocusChangeRef.current = handleFocusChange;

  const handleAutoAlign = () => {
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
  };
  handleAutoAlignRef.current = handleAutoAlign;

  const stripLead = (l: string) => l.replace(/^[^\p{L}\p{N}]+/u, '');
  const FOCUS_CHANNELS: Array<'performance' | 'soundCapture' | 'layering'> = ['performance', 'soundCapture', 'layering'];

  if (presentation === 'world' && interventionOnly && autoTriggeredMinigame && !isProjectComplete) {
    const target = worldTargetForIntervention(autoTriggeredMinigame.type);
    return <>
      <section className="world-console" hidden={!controlsEnabled || showMinigame} aria-label="Session opportunity" data-rst-surface="contextual" data-rst-world-target={target}>
        <header className="world-console-header"><h2 className="text-sm font-semibold">Session opportunity</h2><button type="button" className="rst-btn rst-btn-ghost" aria-label="Close opportunity" onClick={onCloseConsole}>×</button></header>
        <p className="mb-3 text-sm">{autoTriggeredMinigame.reason}</p>
        <div className="world-console-intents">
          <button type="button" className="rst-btn rst-btn-primary" data-rst-action-id="intervention:start" onClick={handleStartIntervention}>Intervene</button>
          <button type="button" className="rst-btn" data-rst-action-id="intervention:delegate" disabled={!bestDelegate} onClick={handleDelegateIntervention}>Delegate</button>
          <button type="button" className="rst-btn rst-btn-ghost" data-rst-action-id="intervention:pass" onClick={handleSkipIntervention}>Pass</button>
        </div>
      </section>
      {DIEGETIC_MINIGAMES.has(selectedMinigame) ? (
        <WorldInteraction isOpen={controlsEnabled && showMinigame && !isProjectComplete} gameType={selectedMinigame} onReward={handleMinigameReward} onClose={() => { setShowMinigame(false); clearAutoTriggeredMinigame?.(); }} />
      ) : (
        <MinigameManager isOpen={controlsEnabled && showMinigame && !isProjectComplete} gameType={selectedMinigame} onReward={handleMinigameReward} onClose={() => { setShowMinigame(false); clearAutoTriggeredMinigame?.(); }} />
      )}
    </>;
  }

  if (presentation === 'world') {
    const chooseIntent = (focus: FocusAllocation) => {
      if (!controlsEnabled) return;
      setGameState(prev => ({ ...prev,
        activeProject: prev.activeProject?.id === project.id ? { ...prev.activeProject, focusAllocation: focus } : prev.activeProject,
        activeProjects: (prev.activeProjects ?? []).map(p => p.id === project.id ? { ...p, focusAllocation: focus } : p),
      }));
      hapticTick(12);
    };
    return (
      <section className="world-console" hidden={!controlsEnabled} aria-label="Console controls" data-rst-surface="contextual" data-rst-world-target="console">
        <header className="world-console-header">
          <div className="min-w-0">
            <p className="rst-kicker">{currentStage?.stageName ?? 'Final listen'} · {availableEnergy} energy</p>
            <h2 className="truncate text-sm font-semibold">{project.title}</h2>
          </div>
          <button type="button" className="rst-btn rst-btn-ghost" onClick={() => { handleStandDown(); onCloseConsole?.(); }} aria-label="Close console">×</button>
        </header>

        {/* 3-Channel Stage Focus Sliders with Dynamic Controller Glyphs */}
        <div className="space-y-1.5 my-2 p-2 bg-stone-900/90 border border-stone-800 rounded">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300">
            <span className="flex items-center gap-1"><StatIcon name="technical" /> Focus Allocation</span>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-300 text-[11px] font-mono tabular-nums">{Math.round(focusEffectiveness.effectiveness * 100)}% Match</span>
              <Button
                onClick={() => { handleAutoAlign(); }}
                disabled={!canUseOptimalFocusButton}
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px] bg-violet-900/30 border-violet-500/40 text-violet-200 hover:bg-violet-800/50 flex items-center gap-1"
                title={canUseOptimalFocusButton ? t('active_auto_align_title') : t('active_auto_align_locked')}
              >
                {gamepad.isConnected && <GamepadGlyph button="north" controllerType={gamepad.controllerType} size="xs" />}
                <StatIcon name="goal" /> Auto
              </Button>
            </div>
          </div>
          {FOCUS_CHANNELS.map((ch, idx) => {
            const isSelected = selectedSliderChannel === ch;
            const diff = Math.abs(projectFocus[ch] - optimalFocus[ch]);
            const isOptimal = diff <= 10;
            return (
              <div
                key={ch}
                onClick={() => setSelectedSliderChannel(ch)}
                data-focus-channel={ch}
                className={`flex items-center gap-1.5 p-1 rounded text-xs transition-colors cursor-pointer ${isSelected && gamepad.isConnected ? 'bg-amber-950/40 ring-1 ring-amber-400/50 border border-amber-400/40' : ''}`}
              >
                <span className="w-20 truncate font-semibold text-stone-200 text-[10px] flex items-center gap-1">
                  {gamepad.isConnected && (
                    <span className="shrink-0">
                      {idx === 0 && <GamepadGlyph button="lb" controllerType={gamepad.controllerType} size="xs" />}
                      {idx === 2 && <GamepadGlyph button="rb" controllerType={gamepad.controllerType} size="xs" />}
                    </span>
                  )}
                  {stripLead(stageFocusLabels[ch].label)}
                </span>
                <div className="flex-1 flex items-center gap-1">
                  {gamepad.isConnected && isSelected && (
                    <GamepadGlyph button="dpadLeft" controllerType={gamepad.controllerType} size="xs" />
                  )}
                  <Slider
                    value={[projectFocus[ch]]}
                    onValueChange={(v) => { setSelectedSliderChannel(ch); handleFocusChange(ch, v[0]); }}
                    max={100}
                    step={5}
                    aria-label={stripLead(stageFocusLabels[ch].label)}
                    className="flex-1"
                  />
                  {gamepad.isConnected && isSelected && (
                    <GamepadGlyph button="dpadRight" controllerType={gamepad.controllerType} size="xs" />
                  )}
                </div>
                <span className={`w-9 text-right font-mono text-[10px] font-bold ${isOptimal ? 'text-emerald-400' : 'text-stone-300'}`}>
                  {projectFocus[ch]}%
                </span>
              </div>
            );
          })}
          {RECORDING_INTENTS.length > 0 && (
            <div className="flex gap-1 pt-1 border-t border-stone-800" role="group" aria-label="Recording intent presets">
              {RECORDING_INTENTS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className="rst-btn flex-1 py-0.5 text-[9px]"
                  aria-pressed={matchesRecordingIntent(projectFocus, preset.focus)}
                  onClick={() => { chooseIntent(preset.focus); }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Take Calibration & Record Controls */}
        {takeState === 'tracking' ? (
          <div className="space-y-1.5">
            <PocketMeter
              isArmed
              onLock={handleLockTake}
              timingBonus={getActiveBuffMagnitude(gameState.choreState, 'timing_bonus')}
            />
            <button
              type="button"
              className="rst-btn rst-btn-ghost w-full text-xs"
              data-rst-action-id="console:stand-down"
              onClick={handleStandDown}
            >
              Stand down
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {lastTakeGrade && <p role="status" className="world-console-feedback text-center text-xs text-amber-300 font-bold">{lastTakeGrade.text}</p>}
            <button
              type="button"
              className="rst-btn rst-btn-primary world-console-record w-full flex items-center justify-center gap-1.5"
              data-rst-action-id="console:record"
              data-rst-surface="contextual"
              onClick={isProjectComplete ? handleOpenProjectReview : handleArmTake}
              disabled={!isProjectComplete && availableEnergy <= 0}
            >
              {gamepad.isConnected && <GamepadGlyph button="south" controllerType={gamepad.controllerType} size="xs" />}
              <span>●</span>
              <span>{isProjectComplete ? 'Review project' : availableEnergy <= 0 ? 'Rest to recharge' : `Record take · ${energyCost} energy`}</span>
            </button>
          </div>
        )}

        <footer className="world-console-footer mt-2 flex items-center justify-between text-xs">
          <span className="text-[var(--rst-stone)]">{Math.min(100, Math.round(overallProgress))}% complete</span>
          {availableEnergy <= 0 && !isProjectComplete ? (
            <button type="button" className="rst-btn" data-rst-action-id="clock:rest" data-rst-surface="contextual" data-rst-world-target="clock" onClick={onRest}>
              Rest & advance day
            </button>
          ) : (
            <span className="text-[var(--rst-stone)]">Dial sliders, then lock take</span>
          )}
        </footer>
        {autoTriggeredMinigame && takeState !== 'tracking' && (
          <div className="world-console-opportunity mt-2">
            <p className="text-xs">{autoTriggeredMinigame.reason}</p>
            <button type="button" className="rst-btn mt-2 w-full text-xs" data-rst-action-id="console:look-up" onClick={() => { handleStandDown(); onCloseConsole?.(); }}>
              See room opportunity
            </button>
          </div>
        )}
        {DIEGETIC_MINIGAMES.has(selectedMinigame) ? (
          <WorldInteraction isOpen={showMinigame && !isProjectComplete} gameType={selectedMinigame} onReward={handleMinigameReward} onClose={() => { setShowMinigame(false); clearAutoTriggeredMinigame?.(); }} />
        ) : (
          <MinigameManager isOpen={showMinigame && !isProjectComplete} gameType={selectedMinigame} onReward={handleMinigameReward} onClose={() => { setShowMinigame(false); clearAutoTriggeredMinigame?.(); }} />
        )}
      </section>
    );
  }

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
            debugLog('🎨 Blob animation complete.');
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
        data-session-layout={isPhone ? 'phone' : 'desktop'}
        className={`flex-1 min-h-0 flex flex-col w-full overflow-hidden bg-stone-950 border border-stone-700/80 rounded-[2px] ${isPhone ? 'p-1.5' : 'p-3'} shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.85)] relative`}
      >
        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>
        <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-stone-700 border border-stone-600 flex items-center justify-center text-[8px] text-stone-400 font-mono shadow-inner">+</div>

        {isPhone ? (
          /* #141 phone composition: status strip / centre workspace (mixer <-> PocketMeter) / transport dock. */
          <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden" data-testid="mobile-session-body">
            <MobileSessionStatusStrip
              title={project.title}
              subtitle={String(project.clientName || project.clientType || project.genre)}
              payout={project.payoutBase}
              difficulty={project.difficulty}
              stageLabel={`${project.currentStageIndex + 1}/${project.stages.length} ${currentStage?.stageName ?? ''}`}
              stageProgress={currentStageProgress}
              overallProgress={overallProgress}
              energy={availableEnergy}
              dutiesDone={Object.values(gameState.choreState?.chores || {}).filter(c => c.completed).length}
              dutiesTotal={5}
              creativityPoints={project.accumulatedCPoints || 0}
              technicalPoints={project.accumulatedTPoints || 0}
              durationDays={project.durationDaysTotal}
              sessions={project.workSessionCount || 0}
              activeBuffs={(gameState.choreState?.activeBuffs || []).map(b => `${b.buffType.replace('_', ' ')} (${b.remainingSessions}s)`)}
              synergyCount={activeSynergies.length}
              onOpenDuties={() => setShowDutiesClipboard(true)}
            />

            {autoTriggeredMinigame && takeState !== 'tracking' && (
              <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 bg-purple-500/[0.12] border border-purple-500/70 rounded">
                <span className="min-w-0 flex-1 truncate text-[11px] text-yellow-300" title={autoTriggeredMinigame.reason}><StatIcon name="goal" /> {autoTriggeredMinigame.reason}</span>
                <MotionButton onClick={handleStartIntervention} className="h-6 px-2 text-[11px] bg-purple-400/[0.14] ring-1 ring-inset ring-purple-400/45 text-purple-100 font-bold rounded">{t('active_intervene')}</MotionButton>
                <MotionButton onClick={handleDelegateIntervention} disabled={!bestDelegate} className="h-6 px-2 text-[11px] border border-amber-500/50 text-stone-200 rounded">{t('active_delegate')}</MotionButton>
                <MotionButton onClick={handleSkipIntervention} className="h-6 px-2 text-[11px] text-stone-300 rounded">{t('active_skip')}</MotionButton>
              </div>
            )}

            {isCurrentStageComplete && !isProjectComplete && takeState !== 'tracking' && (
              <div className="shrink-0 px-2 py-1 bg-emerald-500/[0.10] border border-green-500/70 rounded text-[11px] text-green-300 truncate">
                <StatIcon name="check" /> {currentStage.stageName} complete. Work next session to advance.
              </div>
            )}

            {takeState !== 'tracking' && <OutsideHelpCard compact gameState={gameState} setGameState={setGameState} />}

            <div className="flex-1 min-h-0 min-w-0 flex flex-col justify-center overflow-hidden" data-testid="mobile-session-workspace">
              {takeState === 'tracking' ? (
                <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden gap-1.5" data-testid="mobile-tracking-workspace">
                  <PocketMeter
                    isArmed={true}
                    onLock={handleLockTake}
                    timingBonus={getActiveBuffMagnitude(gameState.choreState, 'timing_bonus')}
                  />
                  <div className="bg-stone-900/90 border border-stone-800 rounded-[2px] p-1.5 space-y-1" data-testid="mobile-tracking-sliders">
                    <div className="flex items-center justify-between text-[10px] text-stone-300 font-bold mb-0.5">
                      <span className="flex items-center gap-1"><StatIcon name="technical" /> <span>STAGE FOCUS</span></span>
                      <span className="text-amber-300 tabular-nums">{Math.round(focusEffectiveness.effectiveness * 100)}% Match</span>
                    </div>
                    {FOCUS_CHANNELS.map((key, idx) => {
                      const isSelected = selectedSliderChannel === key;
                      const diff = Math.abs(projectFocus[key] - optimalFocus[key]);
                      const t = diff <= 10
                        ? { chip: 'bg-emerald-950 text-emerald-400 border-emerald-500/40', slider: 'slider-optimal' }
                        : diff <= 25
                        ? { chip: 'bg-amber-950 text-amber-400 border-amber-500/40', slider: 'slider-good' }
                        : { chip: 'bg-rose-950 text-rose-400 border-rose-500/40', slider: 'slider-default' };
                      return (
                        <div
                          key={key}
                          onClick={() => setSelectedSliderChannel(key)}
                          className={`flex items-center gap-2 p-0.5 rounded cursor-pointer ${
                            isSelected && gamepad.isConnected
                              ? 'bg-amber-950/40 ring-1 ring-amber-400/60 border border-amber-400/40'
                              : ''
                          }`}
                          data-focus-channel={key}
                        >
                          <span className="w-[84px] shrink-0 truncate text-[10px] font-semibold text-stone-200 flex items-center gap-1">
                            {gamepad.isConnected && (
                              <span className="shrink-0">
                                {idx === 0 && <GamepadGlyph button="lb" controllerType={gamepad.controllerType} size="xs" />}
                                {idx === 2 && <GamepadGlyph button="rb" controllerType={gamepad.controllerType} size="xs" />}
                              </span>
                            )}
                            <span className="truncate">{stripLead(stageFocusLabels[key].label)}</span>
                          </span>
                          <div className="flex-1 flex items-center gap-1">
                            {gamepad.isConnected && isSelected && (
                              <GamepadGlyph button="dpadLeft" controllerType={gamepad.controllerType} size="xs" />
                            )}
                            <Slider
                              value={[projectFocus[key]]}
                              onValueChange={(v) => {
                                setSelectedSliderChannel(key);
                                handleFocusChange(key, v[0]);
                              }}
                              max={100}
                              step={5}
                              aria-label={stripLead(stageFocusLabels[key].label)}
                              className={`flex-1 ${t.slider}`}
                            />
                            {gamepad.isConnected && isSelected && (
                              <GamepadGlyph button="dpadRight" controllerType={gamepad.controllerType} size="xs" />
                            )}
                          </div>
                          <span className={`w-[44px] shrink-0 text-center text-[10px] font-mono font-bold rounded border ${t.chip}`}>
                            {projectFocus[key]}%{diff <= 10 ? <StatIcon name="check" size="0.8em" /> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <MobileFocusMixer
                  focus={projectFocus}
                  optimal={optimalFocus}
                  labels={stageFocusLabels}
                  matchPct={Math.round(focusEffectiveness.effectiveness * 100)}
                  guidanceTitle={currentStage.stageName}
                  guidance={optimalFocus.reasoning}
                  canAutoAlign={canUseOptimalFocusButton}
                  onChange={(k, v) => { handleFocusChange(k, v); }}
                  onAutoAlign={() => { handleAutoAlign(); }}
                  selectedChannel={selectedSliderChannel}
                  onSelectChannel={setSelectedSliderChannel}
                  gamepadActive={gamepad.isConnected}
                  controllerType={gamepad.controllerType}
                />
              )}
            </div>
          </div>
        ) : (
        <>
        {/* Pinned Top Bar: Project Meta & LED telemetry */}
        <div className="shrink-0 mb-2 bg-stone-950/80 border border-stone-800/90 rounded-[2px] p-2 shadow-inner relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
            <ProducerSprite
              className="hidden shrink-0 rounded border border-stone-800 bg-black/40 px-1 sm:block"
              producerCustomization={gameState.producerCustomization}
              selectedEra={gameState.selectedEra}
              animationState={takeState === 'tracking' ? 'working' : 'idle'}
              scale={1.25}
            />
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
                <span className="text-emerald-400 font-semibold"><StatIcon name="cash" /> ${Math.round(project.payoutBase)}</span>
                <span className="text-amber-300">⭐ Diff {project.difficulty}</span>
              </div>
            </div>
            </div>

            <div className="flex items-center gap-3 text-xs tabular-nums">
              <div className="text-right">
                <div className="text-[11px] text-amber-300 font-semibold">{project.durationDaysTotal}d duration</div>
                <div className="text-[10px] text-stone-400">{Math.round(project.workSessionCount || 0)} sessions</div>
              </div>
              <ChoreHotspotButton
                kind="duties"
                icon={ClipboardList}
                label={t('active_duties')}
                meta={`${Object.values(gameState.choreState?.chores || {}).filter(c => c.completed).length}/5`}
                title={t('active_duties_title')}
                onClick={() => setShowDutiesClipboard(true)}
              />
              <div className="flex items-center gap-2 bg-stone-900/90 px-2 py-1 rounded border border-stone-700/70">
                <div id="creativity-points" data-creativity-target className="text-amber-300 font-bold flex items-center gap-1 text-xs">
                  <span><StatIcon name="creativity" /></span> {Math.round(project.accumulatedCPoints || 0)}
                </div>
                <div className="w-px h-3 bg-stone-700" />
                <div id="technical-points" data-technical-target className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                  <span><StatIcon name="technical" /></span> {Math.round(project.accumulatedTPoints || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Center Body: Buffs, Rider, Sliders, Meters, Stage info */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
          {/* Active Session Hardware & Maintenance Buff Chips */}
          {gameState.choreState?.activeBuffs && gameState.choreState.activeBuffs.length > 0 && (
            <div className="px-2.5 py-1.5 bg-[rgba(20,18,16,0.92)] border border-[var(--rst-line-strong)] rounded-[3px] flex items-center gap-2 overflow-x-auto select-none">
              <span className="rst-kicker shrink-0 text-[9px] tracking-[0.18em] text-[var(--rst-stone)]">
                Session buffs
              </span>
              <div className="flex items-center gap-1.5 flex-nowrap">
                {gameState.choreState.activeBuffs.map(buff => {
                  const pct = Math.round(buff.magnitude * 100);
                  const config: { label: string; tone: StudioStampTone; detail: string } = {
                    timing_bonus: {
                      label: `Pocket +${pct}%`,
                      tone: 'brass' as const,
                      detail: `+${pct}% pocket sweet-spot tolerance`,
                    },
                    tech_bonus: {
                      label: `Tech +${pct}%`,
                      tone: 'money' as const,
                      detail: `+${pct}% technical gain`,
                    },
                    creativity_bonus: {
                      label: `Creative +${pct}%`,
                      tone: 'brass' as const,
                      detail: `+${pct}% creativity gain`,
                    },
                    energy_saver: {
                      label: `Overdrive −${buff.magnitude}`,
                      tone: 'steel' as const,
                      detail: `Overdrive energy cost −${buff.magnitude}`,
                    },
                    vibe_boost: {
                      label: `Vibe +${pct}%`,
                      tone: 'warn' as const,
                      detail: `+${pct}% client vibe`,
                    },
                  }[buff.buffType] || {
                    label: buff.buffType.replace(/_/g, ' '),
                    tone: 'steel' as const,
                    detail: buff.buffType,
                  };

                  return (
                    <StudioStampChip
                      key={buff.id}
                      tone={config.tone}
                      className="shrink-0"
                      meta={`${buff.remainingSessions}s`}
                      title={`${config.detail} · ${buff.remainingSessions} session${buff.remainingSessions === 1 ? '' : 's'} remaining`}
                    >
                      {config.label}
                    </StudioStampChip>
                  );
                })}
              </div>
            </div>
          )}

          {project.rider && (
            <div className="px-0.5">
              <RiderPanel project={project} state={gameState} mode="session" />
            </div>
          )}

          {/* Session Focus Console: sliders with dynamic controller glyphs */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-[2px] p-1.5 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                  <StatIcon name="technical" /> Session Focus Allocation
                </span>
                <StudioStampChip
                  tone={
                    focusEffectiveness.effectiveness > 0.8
                      ? 'live'
                      : focusEffectiveness.effectiveness > 0.6
                        ? 'brass'
                        : 'warn'
                  }
                >
                  {Math.round(focusEffectiveness.effectiveness * 100)}% Match
                </StudioStampChip>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleAutoAlign();
                }}
                disabled={!canUseOptimalFocusButton}
                className={`rst-btn !min-h-7 !px-2.5 !text-[11px] ${
                  canUseOptimalFocusButton
                    ? 'border-violet-500/50 text-violet-200 hover:bg-violet-800/60'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={canUseOptimalFocusButton ? t('active_auto_align_title') : t('active_auto_align_locked')}
              >
                {gamepad.isConnected && (
                  <GamepadGlyph button="north" controllerType={gamepad.controllerType} size="xs" />
                )}
                <StatIcon name="goal" /> {t('active_auto_align')}
              </button>
            </div>

            {/* 3-Channel Mixing Strips with Dynamic Controller Glyphs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {FOCUS_CHANNELS.map((ch, idx) => {
                const isSelected = selectedSliderChannel === ch;
                const labelObj = stageFocusLabels[ch];
                const currentVal = projectFocus[ch];
                const targetVal = optimalFocus[ch];
                const diff = Math.abs(currentVal - targetVal);
                const isOptimal = diff <= 10;
                const isGood = diff <= 25;

                return (
                  <div
                    key={ch}
                    data-focus-channel={ch}
                    onClick={() => setSelectedSliderChannel(ch)}
                    className={`p-1.5 rounded-md border transition-all cursor-pointer relative ${
                      isSelected && gamepad.isConnected
                        ? 'bg-stone-900 border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/40'
                        : 'bg-stone-900/80 border-stone-800/90 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {gamepad.isConnected && (
                          <span className="shrink-0">
                            {idx === 0 && <GamepadGlyph button="lb" controllerType={gamepad.controllerType} size="xs" />}
                            {idx === 1 && (
                              <span className="text-[9px] font-mono px-1 rounded bg-stone-800 text-stone-300 border border-stone-700">
                                CH2
                              </span>
                            )}
                            {idx === 2 && <GamepadGlyph button="rb" controllerType={gamepad.controllerType} size="xs" />}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-stone-200 truncate">
                          {labelObj.label}
                        </span>
                      </div>
                      <span className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        isOptimal
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : isGood
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      }`}>
                        {currentVal}%
                      </span>
                    </div>

                    <div className="relative">
                      <Slider
                        value={[currentVal]}
                        onValueChange={(val) => {
                          setSelectedSliderChannel(ch);
                          handleFocusChange(ch, val[0]);
                        }}
                        max={100}
                        step={5}
                        aria-label={labelObj.label}
                        className={`w-full ${
                          isOptimal
                            ? 'slider-optimal'
                            : isGood
                              ? 'slider-good'
                              : 'slider-default'
                        }`}
                      />
                    </div>

                    {gamepad.isConnected && isSelected && (
                      <div className="flex items-center justify-center gap-2 mt-1.5 py-0.5 px-1 bg-amber-400/[0.08] border border-amber-400/30 rounded text-[10px] text-amber-200 font-mono select-none">
                        <GamepadGlyph button="dpadLeft" controllerType={gamepad.controllerType} size="xs" />
                        <span>Adjust ±5%</span>
                        <GamepadGlyph button="dpadRight" controllerType={gamepad.controllerType} size="xs" />
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1">
                      <span>{t('active_target_range', { min: Math.max(0, targetVal - 10), max: Math.min(100, targetVal + 10) })}</span>
                      <span className={isOptimal ? 'text-emerald-400 font-semibold flex items-center gap-0.5' : 'text-stone-500'}>
                        {isOptimal ? <><StatIcon name="check" /> {t('active_optimal')}</> : t('active_adjust')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {gamepad.isConnected && (
              <div className="text-[10px] font-mono text-stone-400 bg-stone-900/80 px-2.5 py-1.5 rounded border border-stone-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <GamepadGlyph button="lb" controllerType={gamepad.controllerType} size="xs" />/
                  <GamepadGlyph button="rb" controllerType={gamepad.controllerType} size="xs" /> Channel ·
                  <GamepadGlyph button="dpadLeft" controllerType={gamepad.controllerType} size="xs" />
                  <GamepadGlyph button="dpadRight" controllerType={gamepad.controllerType} size="xs" /> Adjust ±5% ·
                  <GamepadGlyph button="north" controllerType={gamepad.controllerType} size="xs" /> Auto-Align
                </span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <GamepadGlyph button="south" controllerType={gamepad.controllerType} size="xs" /> /
                  <GamepadGlyph button="rt" controllerType={gamepad.controllerType} size="xs" /> Lock Take
                </span>
              </div>
            )}

            {/* Stage Guidance Note */}
            <div className="text-[11px] text-stone-400 bg-stone-900/60 px-2.5 py-1.5 rounded border border-stone-800 flex items-center gap-1.5">
              <span className="text-amber-300"><StatIcon name="bulb" /></span>
              <span className="text-stone-300 font-medium">{currentStage.stageName}:</span>
              <span className="truncate">{optimalFocus.reasoning}</span>
            </div>
          </div>

          {/* Production Queue Panel (feature-flagged) */}
          {showAdvancedQueue && (
            <div>
              <ProductionQueuePanel roomId={project.bookingRoomId || project.id} />
            </div>
          )}

          {/* Optional intervention opportunity */}
          {autoTriggeredMinigame && (
            <div className="p-2 bg-purple-500/[0.12] border border-purple-500/70 rounded-lg animate-scale-in">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-yellow-300 font-semibold text-xs mb-0.5"><StatIcon name="goal" /> {t('active_optional_intervention')}</h4>
                  <p className="text-stone-300 text-xs">{autoTriggeredMinigame.reason}</p>
                </div>
                <div className="text-xl"><StatIcon name="pad" /></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                <MotionButton
                  data-rst-surface="contextual" data-rst-action-id="issue:intervene" data-rst-world-target="console"
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

          {isCurrentStageComplete && !isProjectComplete && (
            <div className="p-2 bg-emerald-500/[0.10] border border-green-500/70 rounded-lg animate-scale-in flex items-center justify-between">
              <div>
                <h4 className="text-green-400 font-semibold text-xs"><StatIcon name="check" /> {t('active_stage_complete')}</h4>
                <p className="text-stone-300 text-xs">
                  {currentStage.stageName} finished. Work next session to advance.
                </p>
              </div>
              <div className="text-xl"><StatIcon name="party" /></div>
            </div>
          )}

          {/* Active Studio Synergies (Kairosoft Combos) */}
          {activeSynergies.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-amber-500/[0.08] border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 flex items-center gap-1 shrink-0">
                <span><StatIcon name="sparkle" /></span>
                <span>Active Combos ({activeSynergies.length}):</span>
              </span>
              <SynergyBadgeList synergies={activeSynergies} size="sm" />
            </div>
          )}

          {/* Dual Progress Meters */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-[2px] p-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <span className="text-stone-400">Stage {project.currentStageIndex + 1}/{project.stages.length}:</span>
                <span className="text-amber-200 font-bold">{currentStage?.stageName}</span>
                {focusEffectiveness.effectiveness > 0.8 && (
                  <StudioStampChip tone="live">{t('active_optimized')}</StudioStampChip>
                )}
              </span>
              <span className="text-stone-400 text-xs tabular-nums flex items-center gap-1.5">
                <span>{Math.round(currentStage?.workUnitsCompleted || 0)} / {currentStage?.workUnitsBase || 0} units</span>
                {focusEffectiveness.effectiveness > 0.7 && (
                  <StudioStampChip tone="brass">{t('active_efficient')}</StudioStampChip>
                )}
              </span>
            </div>
            <Progress 
              value={currentStageProgress} 
              className="h-2.5 mb-1.5 transition-all duration-300"
              aria-label={`${currentStage?.stageName || 'Current stage'} progress`}
            />

            <div className="flex justify-between items-center text-[11px] text-stone-400 mt-1">
              <span>{t('active_overall_progress')}</span>
              <span className="font-bold text-stone-300 tabular-nums">{Math.round(overallProgress)}%</span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-1.5 bg-stone-800 progress-bar transition-all duration-300"
              aria-label={t('active_overall_progress_aria')}
            />
          </div>

          <OutsideHelpCard gameState={gameState} setGameState={setGameState} />
        </div>

        </>
        )}

        {/* Industrial Console Transport Dock */}
        <div className="rst-transport-dock shrink-0 pt-2.5 mt-auto border-t border-stone-800 bg-stone-950/95 relative z-10">
          {takeState === 'tracking' && isPhone ? (
            <div className="rst-take-armed py-2.5 text-center text-xs font-mono font-bold tracking-wider text-red-200 bg-red-400/[0.14] border border-red-400/60 rounded-[2px]" role="status">
              <span className="inline-block w-2 h-2 mr-2 rounded-full bg-red-400 animate-ping" />TAKE ARMED - LOCK IT ABOVE
            </div>
          ) : takeState === 'tracking' ? (
            <div className="space-y-2">
              <PocketMeter
                isArmed={true}
                onLock={handleLockTake}
                timingBonus={getActiveBuffMagnitude(gameState.choreState, 'timing_bonus')}
              />
              <button
                type="button"
                onClick={handleStandDown}
                className="w-full py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-[2px] border border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-500 hover:text-stone-100 transition-colors"
              >
                Stand down — stop take burst
              </button>
            </div>
          ) : (
            <div className="rst-transport-stack space-y-2">
              <div className="flex items-center justify-between gap-2">
                {lastTakeGrade && (
                  <div className="px-2 py-1 flex-1 text-center text-xs font-mono font-bold tracking-wide text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-[2px]">
                    {lastTakeGrade.text}
                  </div>
                )}
                {goldStreak > 1 && (
                  <MotionReveal direction="up" distance={6}>
                    <div className="px-2.5 py-1 text-xs font-black tracking-wider text-stone-950 bg-amber-300 border border-amber-200 rounded-[2px] shadow-[0_0_12px_rgba(251,191,36,0.8)] flex items-center gap-1 shrink-0">
                      <span><StatIcon name="flame" /></span>
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
                <FeatureRevealBanner feature={takeState === 'idle' ? pendingReveal : null} onAcknowledge={acknowledgeReveal} />
              )}
              {!isProjectComplete && streakBankUnlocked && (
                <StreakBankControl
                  combo={project.comboCount ?? 0}
                  level={gameState.playerData.level}
                  onBank={handleStreakBank}
                />
              )}

              {overdriveUnlocked && (!isPhone || availableEnergy >= 2 || overdriveArmed) && <div className="flex items-center gap-2">
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
                      ? <><StatIcon name="flame" /> {t('active_overdrive_engaged', { cost: energyCost, bonus: energySaver ? t('active_saver_bonus') : '+75%' })}</>
                      : <><StatIcon name="flame" /> {t('active_arm_overdrive', { cost: energySaver ? t('active_cost_patchbay') : '2' })}</>}
                  </span>
                </Button>
              </div>}

              <button
                data-rst-surface="contextual" data-rst-action-id="console:record" data-rst-world-target="console"
                onClick={isProjectComplete ? handleOpenProjectReview : availableEnergy <= 0 ? onRest : handleArmTake}
                disabled={!isProjectComplete && availableEnergy <= 0 && !onRest}
                aria-label={isProjectComplete ? 'Review project' : availableEnergy > 0 ? `${t('active_arm_take', { cost: energyCost, left: availableEnergy })} — ${t('active_work_on_project')}` : onRest ? t('rest_advance_day') : t('active_out_of_capacity')}
                className={`w-full py-3.5 text-sm font-black uppercase tracking-wider rounded-[2px] border transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isProjectComplete
                    ? 'bg-emerald-400/[0.16] border-emerald-400/55 text-emerald-100'
                    : availableEnergy > 0
                    ? 'bg-red-400/[0.14] hover:bg-red-400/[0.24] border-red-400 text-red-100 shadow-[0_0_12px_rgba(220,38,38,0.5)] active:scale-[0.99]'
                    : onRest ? 'bg-amber-400/[0.14] hover:bg-amber-400/[0.23] border-amber-400/70 text-amber-100 active:scale-[0.99]' : 'bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                {isProjectComplete ? (
                  <><StatIcon name="party" /> {t('active_project_ready')}</>
                ) : availableEnergy > 0 ? (
                  <>
                    {gamepad.isConnected && gamepad.lastInputType === 'gamepad' && (
                      <GamepadGlyph button="south" size="xs" />
                    )}
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping mr-1" />
                    <span>{t('active_arm_take', { cost: energyCost, left: availableEnergy })}</span>
                  </>
                ) : (
                  <><StatIcon name="energy" /> {onRest ? t('rest_advance_day') : t('active_out_of_capacity')}</>
                )}
              </button>
            </div>
          )}
        </div>

        {DIEGETIC_MINIGAMES.has(selectedMinigame) ? (
          <WorldInteraction
            isOpen={showMinigame && !isProjectComplete}
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
        ) : (
          <MinigameManager
            isOpen={showMinigame && !isProjectComplete}
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
        )}

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
