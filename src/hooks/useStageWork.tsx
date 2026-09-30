import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, FocusAllocation, Project } from '@/types/game';
import { TakeGrade, evaluateTakeAccuracy, calculateTakeEnergyCost } from '@/rpg/takeEvaluation';
// calculateStudioSkillBonus and getEquipmentBonuses are now used within projectUtils
import { getCreativityMultiplier, getTechnicalMultiplier, getFocusEffectiveness, getMoodEffectiveness } from '@/utils/playerUtils'; // Added getMoodEffectiveness
import {
  calculateBaseWorkPoints,
  applyFocusAndMultipliers,
  applyStudioSkillBonusesToWorkPoints,
  applyEquipmentBonusesToWorkPoints,
  calculateStaffWorkContribution,
  WorkPoints
} from '@/utils/projectUtils'; // Import new project utils
import { shouldAutoTriggerMinigame } from '@/utils/minigameUtils';
import { withDailyTracking } from '@/utils/dailyChallenges';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';
import { triggerScreenShake } from '@/utils/screenShake';
import { MinigameType } from '@/components/minigames/MinigameManager';
import { getBookedStudioRoom } from '@/utils/studioRoomUtils';
import { resolveSessionEquipment } from '@/utils/gameUtils';
import { createSeededRandom } from '@/simulation/seededRandom';
import { evaluateProjectSynergies, calculateSynergyBonuses, recordDiscoveredSynergies } from '@/utils/synergyUtils';
import { advanceFlow } from '@/rpg/focusFlow';
import { gradeStage, focusMatchFraction } from '@/rpg/stageGrades';
import {
  getActiveBuffMagnitude,
  consumeChoreBuffSession
} from '@/simulation/choreEngine';

interface UseStageWorkProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  // focusAllocation: FocusAllocation; // REMOVED
  // completeProject is removed from here, will be called after celebration
  addStaffXP: (staffId: string, amount: number) => void; // Still needed if staff get XP per work session or stage
  advanceDay: () => void
}

export const useStageWork = ({
  gameState,
  setGameState,
  // focusAllocation, // REMOVED
  // completeProject, // Removed
  addStaffXP, // Kept for now, though project completion XP is handled by completeProject
  advanceDay
}: UseStageWorkProps) => {
  const orbContainerRef = useRef<HTMLDivElement>(null);
  const [autoTriggeredMinigame, setAutoTriggeredMinigame] = useState<{
    id: string;
    projectId: string;
    stageIndex: number;
    type: MinigameType;
    reason: string;
    priority: number;
    expiresAt: number;
  } | null>(null);
  const lastInterventionBucketRef = useRef(-1);
  const lastInterventionStageRef = useRef('');

  const clearAutoTriggeredMinigame = useCallback(() => {
    const opportunity = autoTriggeredMinigame;

    if (opportunity) {
      const stageKey = `${opportunity.projectId}-${opportunity.stageIndex}`;
      setGameState(prev => {
        const markResolved = (project: Project): Project => {
          if (project.id !== opportunity.projectId) return project;
          const resolved = new Set(project.resolvedInterventionStageKeys || []);
          resolved.add(stageKey);
          return {
            ...project,
            resolvedInterventionStageKeys: Array.from(resolved)
          };
        };

        return {
          ...prev,
          activeProject: prev.activeProject ? markResolved(prev.activeProject) : null,
          activeProjects: (prev.activeProjects || []).map(markResolved)
        };
      });
    }

    setAutoTriggeredMinigame(null);
  }, [autoTriggeredMinigame, setGameState]);

  // Passive time and manual work both increment workSessionCount. Watch those
  // milestones and convert the existing context-sensitive minigame trigger
  // rules into a single optional opportunity for the current stage.
  useEffect(() => {
    const project = gameState.activeProject;
    if (!project || project.awaitingReview || autoTriggeredMinigame) return;

    const stageKey = `${project.id}-${project.currentStageIndex}`;
    const workBucket = Math.floor(project.workSessionCount || 0);

    if (lastInterventionStageRef.current !== stageKey) {
      lastInterventionStageRef.current = stageKey;
      lastInterventionBucketRef.current = Math.max(-1, workBucket - 1);
    }

    if (workBucket <= 0 || workBucket <= lastInterventionBucketRef.current) return;
    lastInterventionBucketRef.current = workBucket;

    if ((project.resolvedInterventionStageKeys || []).includes(stageKey)) return;

    const trigger = shouldAutoTriggerMinigame(
      project,
      gameState,
      project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 },
      workBucket,
      createSeededRandom(
        `${project.id}:intervention:${project.currentStageIndex}:${workBucket}`
      )
    );

    if (!trigger) return;

    setAutoTriggeredMinigame({
      id: `intervention-${project.id}-${project.currentStageIndex}-${workBucket}`,
      projectId: project.id,
      stageIndex: project.currentStageIndex,
      type: trigger.minigameType,
      reason: trigger.triggerReason,
      priority: trigger.priority,
      expiresAt: Date.now() + 90_000
    });
  }, [gameState, autoTriggeredMinigame]);

  // If passive progress moves to another stage while an opportunity is open,
  // resolve the stale opportunity as skipped instead of carrying it forward.
  useEffect(() => {
    const project = gameState.activeProject;
    if (
      autoTriggeredMinigame &&
      (
        !project ||
        project.id !== autoTriggeredMinigame.projectId ||
        project.currentStageIndex !== autoTriggeredMinigame.stageIndex
      )
    ) {
      clearAutoTriggeredMinigame();
    }
  }, [
    gameState.activeProject?.id,
    gameState.activeProject?.currentStageIndex,
    autoTriggeredMinigame?.id,
    clearAutoTriggeredMinigame
  ]);

  // Opportunities are intentionally ephemeral. Expiry behaves like Skip:
  // the stage keeps progressing and will not immediately re-offer the same
  // intervention.
  useEffect(() => {
    if (!autoTriggeredMinigame) return;

    const delay = Math.max(0, autoTriggeredMinigame.expiresAt - Date.now());
    const timer = window.setTimeout(clearAutoTriggeredMinigame, delay);
    return () => window.clearTimeout(timer);
  }, [autoTriggeredMinigame?.id, clearAutoTriggeredMinigame]);

  const createOrb = useCallback((type: 'creativity' | 'technical', amount: number) => {
    console.log(`🎯 Creating ${type} orb with amount: ${amount}`);
    if (!orbContainerRef.current) {
      console.log('❌ No orb container found');
      return;
    }

    const orb = document.createElement('div');
    orb.className = `orb ${type}`;
    orb.textContent = `+${amount}`;
    
    const startX = Math.random() * 200 + 50;
    const startY = Math.random() * 100 + 50;
    orb.style.left = `${startX}px`;
    orb.style.top = `${startY}px`;

    orbContainerRef.current.appendChild(orb);

    setTimeout(() => {
      const targetElement = document.getElementById(type === 'creativity' ? 'creativity-points' : 'technical-points');
      if (targetElement && orbContainerRef.current && orb.isConnected) {
        const rect = targetElement.getBoundingClientRect();
        const containerRect = orbContainerRef.current.getBoundingClientRect();
        const targetX = rect.left - containerRect.left + rect.width / 2;
        const targetY = rect.top - containerRect.top + rect.height / 2;
        
        orb.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.8)`;
        orb.style.opacity = '0';
      }
    }, 100);

    setTimeout(() => {
      if (orb.parentNode) {
        orb.parentNode.removeChild(orb);
      }
    }, 1500);
  }, []);

  // getMoodEffectiveness is now imported from playerUtils

  const performDailyWork = useCallback((options?: {
    energyCost?: number;
    takeGrade?: TakeGrade;
    takeMultiplier?: number;
    qualityBonus?: number;
  }): { finalProjectData?: Project; isComplete: boolean } | undefined => {
    console.log('🚀 === PERFORMING DAILY WORK ===');
    
    if (!gameState.activeProject) {
      console.log('❌ No active project');
      return;
    }

    const energyCost = options?.energyCost ?? (gameState.activeProject.overdriveArmed ? 2 : 1);
    const takeMultiplier = options?.takeMultiplier ?? 1.0;
    const qualityBonus = options?.qualityBonus ?? 0;

    // Check available energy against energyCost
    if (gameState.playerData.dailyWorkCapacity < energyCost) {
      toast({
        title: "⚡ Insufficient Energy",
        description: `This take requires ${energyCost} energy.`,
        variant: "destructive"
      });
      return;
    }

    const project = gameState.activeProject;
    // Get project-specific focus allocation
    const currentProjectFocus = project.focusAllocation || { performance: 33, soundCapture: 33, layering: 34 }; // Fallback

    console.log(`🎵 Working on project: ${project.title}`);
    console.log(`📊 Project stages:`, project.stages.map((s, i) => `${i}: ${s.stageName} (${s.workUnitsCompleted}/${s.workUnitsBase})`));
    
    if (!project.stages || project.stages.length === 0) {
      console.log('❌ Project has no stages');
      return;
    }

    const currentStageIndex = Math.min(
      Math.max(0, project.currentStageIndex || 0),
      project.stages.length - 1
    );

    const currentStage = project.stages[currentStageIndex];
    console.log(`📍 Current stage: ${currentStage.stageName} (index: ${currentStageIndex})`);
    console.log(`📈 Stage progress: ${currentStage.workUnitsCompleted}/${currentStage.workUnitsBase}`);

    if (currentStage.completed) {
      if (project.stages.every(stage => stage.completed)) {
        // Recovery path: all work is done (e.g. finished via Advance Day) but
        // the project was never settled — route to the review flow instead of
        // stranding it with a dead-end toast.
        console.log('🎉 Project work already complete. Routing to review flow.');
        return { finalProjectData: { ...project }, isComplete: true };
      }
      console.log('✅ Current stage already completed');
      return;
    }

    const newWorkSessionCount = (project.workSessionCount || 0) + 1;
    console.log(`🔢 Work session count: ${project.workSessionCount} -> ${newWorkSessionCount}`);

    // 🔥 Overdrive: armed from the Studio UI — burns 2 energy for a big output boost
    const overdrive = !!project.overdriveArmed && gameState.playerData.dailyWorkCapacity >= 2;

    // ⚡ Combo: consecutive same-day sessions build a streak multiplier (caps at +50%)
    const sameDay = project.lastWorkDay === gameState.currentDay;
    const newCombo = sameDay ? (project.comboCount || 0) + 1 : 1;
    const comboMultiplier = 1 + Math.min(0.5, (newCombo - 1) * 0.1);
    console.log(`⚡ Combo x${newCombo} (x${comboMultiplier.toFixed(2)}) | 🔥 Overdrive: ${overdrive}`);

    // 🌊 Focus Flow (sd3.2): the top focus dial matching a stage focus area
    // extends the aura streak; 3 in a row ignites FLOW x2 up to x4 on gains.
    const focusEntries = Object.entries(currentProjectFocus) as Array<[string, number]>;
    const topFocus = focusEntries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const focusMatched = currentStage.focusAreas.includes(topFocus);
    const prevFlow = { streak: project.flowStreak ?? 0, multiplier: project.flowMultiplier ?? 1 };
    const flow = advanceFlow(prevFlow, focusMatched);
    if (flow.multiplier > prevFlow.multiplier && flow.multiplier > 1) {
      console.log(`🌊 FOCUS FLOW x${flow.multiplier} ignited!`);
      toast({
        title: `🌊 FOCUS FLOW x${flow.multiplier}!`,
        description: 'Matched focus keeps chaining — ride it for bonus output.',
        className: "bg-stone-800 border-stone-600 text-white",
      });
      void gameAudio.playComboUp(flow.multiplier - 1);
    }

    // FIXED: Improved base work calculation with better scaling
    const baseWorkCapacity = Math.max(gameState.playerData.dailyWorkCapacity, 1);
    const attributeMultiplier = 1 + (gameState.playerData.attributes.creativeIntuition - 1) * 0.5 + (gameState.playerData.attributes.technicalAptitude - 1) * 0.5;
    
    // Enhanced base points calculation
    // Calculate base work points from player stats
    let workPoints: WorkPoints = calculateBaseWorkPoints(
      gameState.playerData.dailyWorkCapacity,
      gameState.playerData.attributes
    );
    console.log(`💪 Base work points - C: ${workPoints.creativity}, T: ${workPoints.technical}`);

    // Apply player attribute multipliers and focus allocation
    const creativityMultiplier = getCreativityMultiplier(gameState);
    const technicalMultiplier = getTechnicalMultiplier(gameState);
    const focusEffectiveness = getFocusEffectiveness(gameState);
    console.log(`🔥 Multipliers - Creativity: ${creativityMultiplier.toFixed(2)}, Technical: ${technicalMultiplier.toFixed(2)}, Focus: ${focusEffectiveness.toFixed(2)}`);
    
    workPoints = applyFocusAndMultipliers(
      workPoints,
      currentProjectFocus, // Use project-specific focus
      creativityMultiplier,
      technicalMultiplier,
      focusEffectiveness
    );
    console.log(`📊 After focus & multipliers - C: ${workPoints.creativity}, T: ${workPoints.technical}`);
    
    // Apply studio skill bonuses
    workPoints = applyStudioSkillBonusesToWorkPoints(
      workPoints,
      project.genre,
      gameState.studioSkills
    );
    console.log(`🎸 After skill bonuses - C: ${workPoints.creativity}, T: ${workPoints.technical}`);

    // Apply equipment bonuses (seated room gear when racks are in use — bead 8om)
    workPoints = applyEquipmentBonusesToWorkPoints(
      workPoints,
      resolveSessionEquipment(gameState, project.bookingRoomId),
      project.genre
    );
    console.log(`🎛️ After equipment bonuses - C: ${workPoints.creativity}, T: ${workPoints.technical}`);

    // Add staff contributions
    const assignedStaff = gameState.hiredStaff.filter(s => s.assignedProjectId === project.id && s.status === 'Working');
    console.log(`👥 Assigned staff count: ${assignedStaff.length}`);
    workPoints = calculateStaffWorkContribution(
      workPoints,
      assignedStaff,
      project.genre,
      getMoodEffectiveness // Imported from playerUtils
    );
    console.log(`🎯 FINAL GAINS - C: ${workPoints.creativity}, T: ${workPoints.technical}`);
    
    // 🌟 Studio Synergies (Issues #45 & #48)
    const activeSynergies = evaluateProjectSynergies(project, gameState);
    const synergyBonuses = calculateSynergyBonuses(activeSynergies);
    const { newlyDiscovered, updatedDiscovered } = recordDiscoveredSynergies(
      gameState.discoveredSynergies,
      activeSynergies
    );

    // ⚡ Streak + 🔥 Overdrive + ✨ Synergy + 🔧 Chore multipliers applied to the final gains
    const overdriveMultiplier = overdrive ? 1.75 : 1;
    const choreCreativityMultiplier = 1 + getActiveBuffMagnitude(gameState.choreState, 'creativity_bonus');
    const choreTechnicalMultiplier = 1 + getActiveBuffMagnitude(gameState.choreState, 'tech_bonus');
    const creativityGain = Math.max(1, Math.round(workPoints.creativity * comboMultiplier * overdriveMultiplier * synergyBonuses.creativityMultiplier * flow.multiplier * choreCreativityMultiplier));
    const technicalGain = Math.max(1, Math.round(workPoints.technical * comboMultiplier * overdriveMultiplier * synergyBonuses.technicalMultiplier * flow.multiplier * choreTechnicalMultiplier));

    // Create orb animations
    createOrb('creativity', creativityGain);
    createOrb('technical', technicalGain);

    // ENHANCED: Improved work units calculation with better scaling
    const totalPointsGenerated = creativityGain + technicalGain;

    // Log values for debugging stage progression
    console.log(`🐞 DEBUG - Current Stage workUnitsBase: ${currentStage.workUnitsBase}`);
    console.log(`🐞 DEBUG - Creativity Gain: ${creativityGain} (Synergy x${synergyBonuses.creativityMultiplier})`);
    console.log(`🐞 DEBUG - Technical Gain: ${technicalGain} (Synergy x${synergyBonuses.technicalMultiplier})`);
    console.log(`🐞 DEBUG - Total Points Generated: ${totalPointsGenerated}`);
    console.log(`🐞 DEBUG - Current Stage workUnitsCompleted (before): ${currentStage.workUnitsCompleted}`);
    
    // Enhanced work unit calculation:
    // - Base conversion: points to work units (divide by 3 for faster progression)
    // - Minimum progress: Always make at least 1 work unit of progress if points > 0
    // - Stage difficulty scaling: Harder stages (more work units) get bonus efficiency
    const baseTakeUnits = Math.max(1, Math.floor(energyCost * 2));
    const minProgress = totalPointsGenerated > 0 ? 1 : 0;
    const stageEfficiencyBonus = Math.floor(currentStage.workUnitsBase / 10); // Bonus for longer stages
    
    const bookedRoom = getBookedStudioRoom(gameState, project);
    const roomSpeedMultiplier = 1 + ((bookedRoom?.speedBonus || 0) / 100);
    const workUnitsToAdd = Math.max(
      1,
      Math.floor((baseTakeUnits + stageEfficiencyBonus) * roomSpeedMultiplier * synergyBonuses.workUnitSpeedMultiplier * takeMultiplier)
    );
    // Ensure at least 1 unit of progress if energy was spent and stage is not complete
    const actualWorkUnitsToAdd = (workUnitsToAdd === 0 && !currentStage.completed && totalPointsGenerated > 0) ? 1 : workUnitsToAdd; // Ensure progress if any points generated

    const newWorkUnitsCompleted = Math.min(
      currentStage.workUnitsCompleted + actualWorkUnitsToAdd, // Use actualWorkUnitsToAdd
      currentStage.workUnitsBase
    );

    console.log(`⚡ Total points generated: ${totalPointsGenerated}`);
    console.log(`🔨 Work units to add (calculated): ${workUnitsToAdd}, (actual applied): ${actualWorkUnitsToAdd}`);
    console.log(`📈 Work units: ${currentStage.workUnitsCompleted} -> ${newWorkUnitsCompleted} (max: ${currentStage.workUnitsBase})`);

    // Check if stage is completed
    const stageCompleted = newWorkUnitsCompleted >= currentStage.workUnitsBase;
    let newCurrentStageIndex = currentStageIndex;

    // Stage-grade inputs (sd3.2): per-stage session count, par pacing,
    // best minigame take, and focus discipline.
    const prevStageSessions = [...(project.stageSessionsTaken ?? [])];
    while (prevStageSessions.length < project.stages.length) prevStageSessions.push(0);
    const newStageSessions = [...prevStageSessions];
    newStageSessions[currentStageIndex] = (newStageSessions[currentStageIndex] ?? 0) + 1;
    const parSessions = Math.max(2, Math.round(currentStage.workUnitsBase / 3));

    let completedGrade: ReturnType<typeof gradeStage> | null = null;
    if (stageCompleted && !currentStage.completed) {
      newCurrentStageIndex = Math.min(currentStageIndex + 1, project.stages.length - 1);
      console.log(`✅ Stage completed! Moving to stage index: ${newCurrentStageIndex}`);
      completedGrade = gradeStage({
        sessionsTaken: newStageSessions[currentStageIndex] ?? 1,
        parSessions,
        minigameTake: project.stageTake ?? null,
        focusMatch: focusMatchFraction(focusMatched),
      });
      console.log(`🏅 Stage grade: ${completedGrade.grade} (+${completedGrade.qualityCarry} carry${completedGrade.capsProjectAtA ? ', caps project at A' : ''})`);
    }

    // FIXED: Immutable state update for React re-rendering
    setGameState(prev => {
      console.log('🔄 Updating game state with immutable update...');
      
      // Deep copy the active project to avoid mutation
      const updatedProject = {
        ...prev.activeProject!,
        stages: prev.activeProject!.stages.map((stage, index) => {
          if (index === currentStageIndex) {
            console.log(`🔄 Updating stage ${index}: ${stage.workUnitsCompleted} -> ${newWorkUnitsCompleted}, completed: ${stageCompleted}`);
            return {
              ...stage,
              workUnitsCompleted: newWorkUnitsCompleted,
              completed: stageCompleted
            };
          }
          return stage;
        }),
        accumulatedCPoints: prev.activeProject!.accumulatedCPoints + creativityGain + qualityBonus,
        accumulatedTPoints: prev.activeProject!.accumulatedTPoints + technicalGain + qualityBonus,
        currentStageIndex: newCurrentStageIndex,
        workSessionCount: newWorkSessionCount,
        // ⚡ streak tracking + 🔥 overdrive consumed
        comboCount: newCombo,
        lastWorkDay: gameState.currentDay,
        overdriveArmed: false,
        // 🌊 Focus Flow aura + 🏅 stage grades (sd3.2)
        flowStreak: flow.streak,
        flowMultiplier: flow.multiplier,
        stageSessionsTaken: newStageSessions,
        stageGrades: completedGrade
          ? [...(prev.activeProject!.stageGrades ?? []), completedGrade.grade]
          : prev.activeProject!.stageGrades,
        // A fresh stage means a fresh take slate (skipped take caps at A).
        stageTake: newCurrentStageIndex !== currentStageIndex ? null : prev.activeProject!.stageTake ?? null
      };

      console.log(`📋 Project C points: ${prev.activeProject!.accumulatedCPoints} -> ${updatedProject.accumulatedCPoints}`);
      console.log(`📋 Project T points: ${prev.activeProject!.accumulatedTPoints} -> ${updatedProject.accumulatedTPoints}`);
      console.log(`📋 Updated stages:`, updatedProject.stages.map((s, i) => `${i}: ${s.stageName} (${s.workUnitsCompleted}/${s.workUnitsBase}) ${s.completed ? '✅' : '⏳'}`));

      const nextChoreState = stageCompleted && prev.choreState
        ? consumeChoreBuffSession(prev.choreState)
        : prev.choreState;

      const nextPendingCrates = prev.pendingCrates ? [...prev.pendingCrates] : [];
      if (stageCompleted && completedGrade?.grade === 'S' && Math.random() < 0.25) {
        nextPendingCrates.push({
          id: `crate-sgrade-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          era: prev.selectedEra || '1970s',
          source: 's_grade_take',
          tier: 'standard'
        });
      }

      const gemGain = stageCompleted && completedGrade?.grade === 'Gold' ? 2 : stageCompleted && completedGrade?.grade === 'Silver' ? 1 : 0;

      return withDailyTracking({
        ...prev,
        gems: (prev.gems ?? 0) + gemGain,
        activeProject: updatedProject,
        discoveredSynergies: updatedDiscovered,
        choreState: nextChoreState,
        pendingCrates: nextPendingCrates,
        playerData: {
          ...prev.playerData,
          dailyWorkCapacity: Math.max(0, prev.playerData.dailyWorkCapacity - energyCost)
        },
        hiredStaff: prev.hiredStaff.map(s => {
          if (s.assignedProjectId === project.id && s.status === 'Working') {
            // Decrease mood slightly after work, decrease energy
            return { 
              ...s, 
              energy: Math.max(0, s.energy - 15),
              mood: Math.max(0, s.mood - 2) // Small mood decrease from work
            };
          }
          return s;
        })
      }, { sessions: 1, combo: newCombo });
    });

    // ✨ Celebrate new synergy discoveries
    if (newlyDiscovered.length > 0) {
      newlyDiscovered.forEach(syn => {
        toast({
          title: `✨ NEW SYNERGY: ${syn.icon} ${syn.name}!`,
          description: `${syn.tagline} — unlocked in your Synergy Encyclopedia!`,
          className: 'bg-gradient-to-r from-amber-950/95 via-purple-950/95 to-stone-900 border border-amber-400 text-white shadow-2xl',
        });
      });
    }

    // 🔥 Overdrive: big payoff, small risk — the session can burn out the crew
    if (overdrive) {
      if (Math.random() < 0.25) {
        setGameState(prev => ({
          ...prev,
          hiredStaff: prev.hiredStaff.map(s =>
            s.assignedProjectId === project.id && s.status === 'Working'
              ? { ...s, mood: Math.max(0, s.mood - 6), energy: Math.max(0, s.energy - 8) }
              : s
          )
        }));
        toast({
          title: '😵 Overdrive Fatigue',
          description: 'That session ran hot — the assigned crew lost some mood.',
          variant: 'destructive',
          className: 'bg-stone-800 border-stone-600 text-white',
        });
      }
    }

    // Check if project is complete
    const allStagesComplete = project.stages.every((stage, index) => 
      index === currentStageIndex ? stageCompleted : stage.completed
    );
    
    if (allStagesComplete) {
      console.log('🎉 PROJECT WORK UNITS COMPLETE! Preparing data for celebration.');
      const finalProjectData = { // Capture all necessary details for the celebration and eventual completion call
        ...project, // This is gameState.activeProject at this point
        stages: project.stages.map((stage, index) => {
          if (index === currentStageIndex) {
            return { ...stage, workUnitsCompleted: newWorkUnitsCompleted, completed: stageCompleted };
          }
          // Ensure other stages also reflect their latest completed status if somehow missed
          return stage.completed ? stage : { ...stage, completed: stage.workUnitsCompleted >= stage.workUnitsBase };
        }),
        accumulatedCPoints: project.accumulatedCPoints + creativityGain,
        accumulatedTPoints: project.accumulatedTPoints + technicalGain,
        currentStageIndex: newCurrentStageIndex, // Should be the last stage index or project.stages.length
        workSessionCount: newWorkSessionCount,
        // Carry this tick's loop state forward so settlement sees grades/flow (sd3.2)
        flowStreak: flow.streak,
        flowMultiplier: flow.multiplier,
        stageSessionsTaken: newStageSessions,
        stageGrades: completedGrade
          ? [...(project.stageGrades ?? []), completedGrade.grade]
          : project.stageGrades,
        stageTake: newCurrentStageIndex !== currentStageIndex ? null : project.stageTake ?? null,
        stake: project.stake ?? 'safe'
      };
      // DO NOT CALL completeProject here.
      // Return the project details so the UI can display celebration BEFORE state is wiped.
      return { finalProjectData, isComplete: true };
    }

    // Show stage completion notification
    if (stageCompleted) {
      gameAudio.playUISound('stageComplete');
      triggerScreenShake('light');
      const gradeTitle = completedGrade
        ? `🏅 Stage ${completedGrade.grade}! ${currentStage.stageName} finished`
        : `🎉 Stage Complete!`;
      const gradeDetail = completedGrade
        ? `${currentStage.stageName} finished! +${completedGrade.qualityCarry} quality carry.${completedGrade.capsProjectAtA ? ' Skipped take caps this project at A.' : ''} ${newCurrentStageIndex < project.stages.length ? `Moving to: ${project.stages[newCurrentStageIndex].stageName}` : 'All stages complete!'}`
        : `${currentStage.stageName} finished! ${newCurrentStageIndex < project.stages.length ? `Moving to: ${project.stages[newCurrentStageIndex].stageName}` : 'All stages complete!'}`;
      toast({
        title: gradeTitle,
        description: gradeDetail,
        className: "bg-stone-800 border-stone-600 text-white",
        duration: 4000
      });
    }
    // Routine mid-stage progress stays on the Session Progress bar — no toast spam.
    
    return { isComplete: false }; // No review object if not complete
  }, [gameState, createOrb, setGameState, addStaffXP, advanceDay]); // Removed focusAllocation from dependencies

  return {
    performDailyWork,
    orbContainerRef,
    autoTriggeredMinigame,
    clearAutoTriggeredMinigame
  };
};
