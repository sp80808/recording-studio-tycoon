import type { GameState } from '@/types/game';

export type FirstSessionGuideStep = 'book' | 'work' | 'deliver' | 'reinvest' | 'complete';

const hasSessionProgress = (state: GameState): boolean =>
  !!state.activeProject?.stages.some(stage => stage.workUnitsCompleted > 0 || stage.completed);

const hasFirstUpgrade = (state: GameState): boolean =>
  state.ownedEquipment.some(item => !['basic_mic', 'basic_monitors'].includes(item.id)) || state.hiredStaff.length > 0 || state.ownedUpgrades.length > 0;

export const getFirstSessionGuideStep = (state: GameState): FirstSessionGuideStep => {
  const hasPayout = state.financials.reports.length > 0;

  if (hasPayout && hasFirstUpgrade(state)) return 'complete';
  if (hasPayout) return 'reinvest';
  if (state.activeProject?.awaitingReview) return 'deliver';
  if (state.activeProject && hasSessionProgress(state)) return 'deliver';
  if (state.activeProject) return 'work';
  return 'book';
};

