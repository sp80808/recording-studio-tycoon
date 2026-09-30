/**
 * Career "what should I do next?" resolver — pure, shared by CareerHub and tests.
 *
 * History: CareerHub once read `gameState.completedProjects.length`, a field the
 * real GameState never had, which crashed the whole app whenever the Career tab
 * opened with no active session. The test suite hid it because it asserted
 * against a hand-copied version of this logic. Keep the single implementation
 * here and test *this*.
 */
import type { GameState } from '@/types/game';

export type CareerActionType = 'awaitingReview' | 'rest' | 'continue' | 'book';

export interface CareerNextAction {
  type: CareerActionType;
  label: string;
  subtext: string;
}

/** Number of delivered sessions, from the settlement ledger. Safe on legacy / sparse saves. */
export const countDeliveredSessions = (state: Pick<GameState, 'financials'>): number =>
  state.financials?.reports?.length ?? 0;

export const resolveCareerNextAction = (
  state: Pick<GameState, 'activeProject' | 'playerData' | 'financials'>,
  dailyCostsLabel = '',
): CareerNextAction => {
  const project = state.activeProject;

  if (project?.awaitingReview) {
    return {
      type: 'awaitingReview',
      label: 'Review & release',
      subtext: 'Master complete · Ready to review and release',
    };
  }
  if ((state.playerData?.dailyWorkCapacity ?? 0) <= 0) {
    return {
      type: 'rest',
      label: 'Rest & advance day',
      subtext: `Rest restores sessions${dailyCostsLabel}`,
    };
  }
  if (project) {
    return { type: 'continue', label: 'Continue session', subtext: project.title };
  }
  return {
    type: 'book',
    label: countDeliveredSessions(state) === 0 ? 'Book your first session' : 'Find a gig',
    subtext: 'Your next record starts with a booking.',
  };
};
