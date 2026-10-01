/**
 * Hiring capacity: premises space AND studio reputation both gate crew size.
 * Effective cap is the tighter of the two. Pure helpers so Crew UI and state
 * updates (and the crew-portal sibling) share one source of truth.
 */
import { getPremisesDef, premisesStaffCap } from '@/rpg/premises';
import type { GameState } from '@/types/game';

/** Reputation needed for each crew seat beyond the starter pair. */
export const REPUTATION_PER_CREW_SEAT = 25;
/** Soft ceiling so late-game rep cannot outrun content. */
export const REPUTATION_STAFF_CAP_MAX = 12;
/** Even a brand-new studio can take two people. */
export const REPUTATION_STAFF_CAP_BASE = 2;

export type HiringBlocker = 'space' | 'reputation' | null;

export interface HiringLimits {
  hired: number;
  spaceCap: number;
  reputationCap: number;
  effectiveCap: number;
  canHire: boolean;
  remaining: number;
  blocker: HiringBlocker;
  premisesName: string;
  /** Next reputation needed to unlock another seat (null if at rep soft-cap). */
  reputationForNextSeat: number | null;
}

type HiringState = Pick<GameState, 'hiredStaff' | 'reputation'> & {
  premisesTier?: number;
};

/** How many crew seats reputation alone will support. */
export const reputationStaffCap = (reputation: number): number =>
  Math.min(
    REPUTATION_STAFF_CAP_MAX,
    REPUTATION_STAFF_CAP_BASE + Math.floor(Math.max(0, reputation) / REPUTATION_PER_CREW_SEAT),
  );

export const getHiringLimits = (state: HiringState): HiringLimits => {
  const hired = state.hiredStaff?.length ?? 0;
  const spaceCap = premisesStaffCap(state);
  const reputationCap = reputationStaffCap(state.reputation ?? 0);
  const effectiveCap = Math.min(spaceCap, reputationCap);
  const canHire = hired < effectiveCap;
  let blocker: HiringBlocker = null;
  if (!canHire) {
    // Prefer naming the tighter constraint; if tied, space (premises) is the clearer fix.
    blocker = hired >= spaceCap ? 'space' : 'reputation';
  }
  const nextSeatIndex = reputationCap; // zero-based next seat above current rep cap
  const reputationForNextSeat =
    reputationCap >= REPUTATION_STAFF_CAP_MAX
      ? null
      : (nextSeatIndex - REPUTATION_STAFF_CAP_BASE + 1) * REPUTATION_PER_CREW_SEAT;

  return {
    hired,
    spaceCap,
    reputationCap,
    effectiveCap,
    canHire,
    remaining: Math.max(0, effectiveCap - hired),
    blocker,
    premisesName: getPremisesDef(state).name,
    reputationForNextSeat,
  };
};

export const canHireStaff = (state: HiringState): boolean => getHiringLimits(state).canHire;

/** Short player-facing reason when hiring is blocked. */
export const hiringBlockMessage = (limits: HiringLimits): string => {
  if (limits.canHire) return '';
  if (limits.blocker === 'space') {
    return `Your ${limits.premisesName.toLowerCase()} fits ${limits.spaceCap} people. Move to bigger premises to hire more.`;
  }
  const need = limits.reputationForNextSeat;
  return need == null
    ? `Reputation supports ${limits.reputationCap} crew. Grow the studio's name before expanding further.`
    : `Reputation supports ${limits.reputationCap} crew. Reach ${need} rep to unlock another seat.`;
};
