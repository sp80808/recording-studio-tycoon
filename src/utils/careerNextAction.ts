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

/**
 * True once the player has played any session, from any record of one: the
 * settlement ledger, client relationships, or progress that
 * can only come from play (level/XP) or from days passing. Some saves reach
 * Day 26 with an empty ledger, so the ledger alone must not decide "first".
 */
export const hasPlayedAnySession = (
  state: Partial<Pick<GameState, 'financials' | 'clientRelationships' | 'playerData'  | 'currentDay'>>,
): boolean => {
  if (countDeliveredSessions(state as Pick<GameState, 'financials'>) > 0) return true;
  if (Object.values(state.clientRelationships ?? {}).some(r => (r?.sessionsCompleted ?? 0) > 0)) return true;
  if ((state.playerData?.level ?? 1) > 1 || (state.playerData?.xp ?? 0) > 0) return true;
  return (state.currentDay ?? 1) > 1;
};

export const resolveCareerNextAction = (
  state: Pick<GameState, 'activeProject' | 'playerData' | 'financials'> & Partial<Pick<GameState, 'clientRelationships'  | 'currentDay'>>,
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
    label: hasPlayedAnySession(state) ? 'Find a gig' : 'Book your first session',
    subtext: 'Your next record starts with a booking.',
  };
};
