import { GameState, Project, StaffMember } from '@/types/game';
import {
  applyEquipmentBonusesToWorkPoints,
  applyFocusAndMultipliers,
  applyStudioSkillBonusesToWorkPoints,
  calculateBaseWorkPoints,
  calculateStaffWorkContribution,
  WorkPoints
} from '@/utils/projectUtils';
import {
  getCreativityMultiplier,
  getFocusEffectiveness,
  getMoodEffectiveness,
  getTechnicalMultiplier
} from '@/utils/playerUtils';
import { getBookedStudioRoom } from '@/utils/studioRoomUtils';

export const PASSIVE_WORK_SESSION_MS = 5 * 60 * 1000;
export const DEFAULT_MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
const PASSIVE_STAFF_ENERGY_COST_PER_SESSION = 8;
const PASSIVE_STAFF_MOOD_COST_PER_SESSION = 1;

export interface SimulationSummary {
  rawElapsedMs: number;
  creditedMs: number;
  productiveMs: number;
  wasCapped: boolean;
  workUnitsAdded: number;
  creativityPointsAdded: number;
  technicalPointsAdded: number;
  stagesCompleted: string[];
  projectsReadyForReview: Array<{ projectId: string; title: string }>;
  staffEnergySpent: number;
}

export interface SimulationResult {
  state: GameState;
  summary: SimulationSummary;
}

export interface AdvanceSimulationOptions {
  maxElapsedMs?: number;
}

const cloneProject = (project: Project): Project => ({
  ...project,
  currentStageIndex: Number.isFinite(project.currentStageIndex) ? project.currentStageIndex : 0,
  accumulatedCPoints: Number.isFinite(project.accumulatedCPoints) ? project.accumulatedCPoints : 0,
  accumulatedTPoints: Number.isFinite(project.accumulatedTPoints) ? project.accumulatedTPoints : 0,
  workSessionCount: Number.isFinite(project.workSessionCount) ? project.workSessionCount : 0,
  stages: (project.stages || []).map(stage => ({ ...stage })),
  completedStages: [...(project.completedStages || [])],
  focusAllocation: project.focusAllocation
    ? { ...project.focusAllocation }
    : { performance: 33, soundCapture: 33, layering: 34 }
});

const calculatePassiveSessionOutput = (
  state: GameState,
  project: Project,
  assignedStaff: StaffMember[],
  includePlayer: boolean
): { workUnits: number; creativity: number; technical: number } => {
  let workPoints: WorkPoints = includePlayer
    ? calculateBaseWorkPoints(
        Math.max(state.playerData.dailyWorkCapacity, 1),
        state.playerData.attributes
      )
    : { creativity: 0, technical: 0 };

  if (includePlayer) {
    workPoints = applyFocusAndMultipliers(
      workPoints,
      project.focusAllocation,
      getCreativityMultiplier(state),
      getTechnicalMultiplier(state),
      getFocusEffectiveness(state)
    );

    workPoints = applyStudioSkillBonusesToWorkPoints(
      workPoints,
      project.genre,
      state.studioSkills
    );

    workPoints = applyEquipmentBonusesToWorkPoints(
      workPoints,
      state.ownedEquipment,
      project.genre
    );
  }

  if (assignedStaff.length > 0) {
    workPoints = calculateStaffWorkContribution(
      workPoints,
      assignedStaff,
      project.genre,
      getMoodEffectiveness
    );
  }

  const totalPointsGenerated = workPoints.creativity + workPoints.technical;
  if (totalPointsGenerated <= 0) {
    return { workUnits: 0, creativity: 0, technical: 0 };
  }

  const currentStage = project.stages[project.currentStageIndex];
  const stageEfficiencyBonus = currentStage
    ? Math.floor(currentStage.workUnitsBase / 10)
    : 0;
  const baseWorkUnits = Math.floor(totalPointsGenerated / 3);
  const room = getBookedStudioRoom(state, project);
  const roomSpeedMultiplier = 1 + ((room?.speedBonus || 0) / 100);
  const workUnits = Math.max(1, (baseWorkUnits + stageEfficiencyBonus) * roomSpeedMultiplier);

  return {
    workUnits,
    creativity: workPoints.creativity,
    technical: workPoints.technical
  };
};

const applyWorkToProject = (
  project: Project,
  workUnitsToApply: number
): { project: Project; applied: number; completedStageNames: string[]; readyForReview: boolean } => {
  let remaining = Math.max(0, workUnitsToApply);
  let applied = 0;
  const completedStageNames: string[] = [];
  const nextProject = cloneProject(project);

  while (remaining > 0 && !nextProject.awaitingReview) {
    const stage = nextProject.stages[nextProject.currentStageIndex];
    if (!stage) break;

    if (stage.completed || stage.workUnitsCompleted >= stage.workUnitsBase) {
      if (!stage.completed) {
        stage.completed = true;
        completedStageNames.push(stage.stageName);
      }
      if (!nextProject.completedStages.includes(nextProject.currentStageIndex)) {
        nextProject.completedStages.push(nextProject.currentStageIndex);
      }

      if (nextProject.currentStageIndex >= nextProject.stages.length - 1) {
        nextProject.awaitingReview = true;
        break;
      }

      nextProject.currentStageIndex += 1;
      continue;
    }

    const stageRemaining = Math.max(0, stage.workUnitsBase - stage.workUnitsCompleted);
    const chunk = Math.min(stageRemaining, remaining);
    stage.workUnitsCompleted += chunk;
    remaining -= chunk;
    applied += chunk;

    if (stage.workUnitsCompleted >= stage.workUnitsBase) {
      stage.workUnitsCompleted = stage.workUnitsBase;
      stage.completed = true;
      if (!nextProject.completedStages.includes(nextProject.currentStageIndex)) {
        nextProject.completedStages.push(nextProject.currentStageIndex);
      }
      completedStageNames.push(stage.stageName);

      if (nextProject.currentStageIndex >= nextProject.stages.length - 1) {
        nextProject.awaitingReview = true;
      } else {
        nextProject.currentStageIndex += 1;
      }
    }
  }

  return {
    project: nextProject,
    applied,
    completedStageNames,
    readyForReview: !!nextProject.awaitingReview
  };
};

/**
 * Advances idle studio work using bounded, deterministic time slices.
 *
 * This deliberately does not settle money/reputation rewards. A completed
 * project's existing review/completion pipeline remains the only authority
 * allowed to pay out a session, which prevents offline double-settlement.
 */
export const advanceSimulation = (
  initialState: GameState,
  elapsedMs: number,
  options: AdvanceSimulationOptions = {}
): SimulationResult => {
  const rawElapsedMs = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const maxElapsedMs = Math.max(0, options.maxElapsedMs ?? DEFAULT_MAX_OFFLINE_MS);
  const creditedMs = Math.min(rawElapsedMs, maxElapsedMs);

  const summary: SimulationSummary = {
    rawElapsedMs,
    creditedMs,
    productiveMs: 0,
    wasCapped: rawElapsedMs > creditedMs,
    workUnitsAdded: 0,
    creativityPointsAdded: 0,
    technicalPointsAdded: 0,
    stagesCompleted: [],
    projectsReadyForReview: [],
    staffEnergySpent: 0
  };

  if (creditedMs <= 0 || !initialState.activeProject) {
    return { state: initialState, summary };
  }

  let state: GameState = {
    ...initialState,
    activeProject: cloneProject(initialState.activeProject),
    hiredStaff: initialState.hiredStaff.map(staff => ({ ...staff }))
  };

  let remainingMs = creditedMs;

  while (remainingMs > 0 && state.activeProject && !state.activeProject.awaitingReview) {
    const stepMs = Math.min(PASSIVE_WORK_SESSION_MS, remainingMs);
    const sessionFraction = stepMs / PASSIVE_WORK_SESSION_MS;
    const project = state.activeProject;
    const assignedStaff = state.hiredStaff.filter(
      staff =>
        staff.assignedProjectId === project.id &&
        staff.status === 'Working' &&
        staff.energy > 0
    );

    const output = calculatePassiveSessionOutput(
      state,
      project,
      assignedStaff,
      true
    );

    if (output.workUnits <= 0) break;

    const requestedWorkUnits = output.workUnits * sessionFraction;
    const workResult = applyWorkToProject(project, requestedWorkUnits);
    const appliedRatio = requestedWorkUnits > 0
      ? Math.min(1, workResult.applied / requestedWorkUnits)
      : 0;

    const creativityAdded = output.creativity * sessionFraction * appliedRatio;
    const technicalAdded = output.technical * sessionFraction * appliedRatio;

    const updatedProject: Project = {
      ...workResult.project,
      accumulatedCPoints: (workResult.project.accumulatedCPoints || 0) + creativityAdded,
      accumulatedTPoints: (workResult.project.accumulatedTPoints || 0) + technicalAdded,
      workSessionCount: (workResult.project.workSessionCount || 0) + sessionFraction
    };

    const energyCost = PASSIVE_STAFF_ENERGY_COST_PER_SESSION * sessionFraction * appliedRatio;
    const moodCost = PASSIVE_STAFF_MOOD_COST_PER_SESSION * sessionFraction * appliedRatio;

    state = {
      ...state,
      activeProject: updatedProject,
      hiredStaff: state.hiredStaff.map(staff => {
        if (!assignedStaff.some(assigned => assigned.id === staff.id)) return staff;
        const before = staff.energy;
        const after = Math.max(0, before - energyCost);
        summary.staffEnergySpent += before - after;
        return {
          ...staff,
          energy: after,
          mood: Math.max(0, staff.mood - moodCost)
        };
      })
    };

    summary.productiveMs += stepMs * appliedRatio;
    summary.workUnitsAdded += workResult.applied;
    summary.creativityPointsAdded += creativityAdded;
    summary.technicalPointsAdded += technicalAdded;
    summary.stagesCompleted.push(...workResult.completedStageNames);

    if (workResult.readyForReview) {
      summary.projectsReadyForReview.push({
        projectId: updatedProject.id,
        title: updatedProject.title
      });
      break;
    }

    remainingMs -= stepMs;
  }

  return { state, summary };
};

export const shouldShowSimulationSummary = (summary: SimulationSummary): boolean =>
  summary.creditedMs >= 60_000 &&
  (
    summary.workUnitsAdded > 0 ||
    summary.stagesCompleted.length > 0 ||
    summary.projectsReadyForReview.length > 0 ||
    summary.wasCapped
  );
