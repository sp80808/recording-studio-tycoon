/**
 * Studio premises milestones (#70), first slice: Tier 0 (borrowed room) →
 * Tier 1 (project studio). A premises tier is a content/capacity selection
 * over existing systems (rooms, staff, recruiting), not a second simulation.
 * Pure + deterministic; the move is optional and never automatic.
 */
import type { GameState } from '@/types/game';

export type PremisesTier = 0 | 1;

export interface PremisesTierDef {
  tier: PremisesTier;
  name: string;
  staffCap: number;
  /** Extra room allowance on top of the producer-level allowance. */
  roomAllowanceBonus: number;
  dailyRent: number;
  /** Extra candidates in each recruitment batch (job-board recruiting). */
  extraCandidates: number;
  /** Existing room unlocked for free by moving in. */
  grantsRoomId?: string;
}

export const PREMISES_TIERS: Record<PremisesTier, PremisesTierDef> = {
  0: { tier: 0, name: 'Borrowed Room', staffCap: 3, roomAllowanceBonus: 0, dailyRent: 0, extraCandidates: 0 },
  1: { tier: 1, name: 'Project Studio', staffCap: 6, roomAllowanceBonus: 1, dailyRent: 40, extraCandidates: 2, grantsRoomId: 'vocal-suite' },
};

export const PROJECT_STUDIO_DEPOSIT = 2500;
const MIN_PAID_SESSIONS = 5;
/** Cash reserve left after paying the deposit, so a premature move isn't instant bankruptcy. */
const MIN_RESERVE_AFTER_DEPOSIT = 500;

type PremisesState = Pick<GameState, 'money' | 'financials' | 'clientRelationships' | 'studioRooms'> & {
  premisesTier?: PremisesTier;
};

export const getPremisesTier = (s: { premisesTier?: number }): PremisesTier => (s.premisesTier === 1 ? 1 : 0);
export const getPremisesDef = (s: { premisesTier?: number }): PremisesTierDef => PREMISES_TIERS[getPremisesTier(s)];

export interface PremisesCondition { label: string; met: boolean }
export interface PremisesOffer {
  eligible: boolean;
  conditions: PremisesCondition[];
  deposit: number;
  dailyRent: number;
  capacity: string;
  unlocks: string[];
}

/** The Tier 1 move offer, or null once you are already there. */
export const getPremisesOffer = (s: PremisesState): PremisesOffer | null => {
  if (getPremisesTier(s) >= 1) return null;
  const paid = s.financials?.reports?.length ?? 0;
  const repeat = Object.values(s.clientRelationships ?? {}).some(r => r.sessionsCompleted >= 2);
  const cash = s.money >= PROJECT_STUDIO_DEPOSIT + MIN_RESERVE_AFTER_DEPOSIT;
  const conditions: PremisesCondition[] = [
    { label: `${MIN_PAID_SESSIONS} paid sessions (${Math.min(paid, MIN_PAID_SESSIONS)}/${MIN_PAID_SESSIONS})`, met: paid >= MIN_PAID_SESSIONS },
    { label: 'One repeat client', met: repeat },
    { label: `$${PROJECT_STUDIO_DEPOSIT + MIN_RESERVE_AFTER_DEPOSIT} cash (deposit plus a cushion)`, met: cash },
  ];
  const def = PREMISES_TIERS[1];
  return {
    eligible: conditions.every(c => c.met),
    conditions,
    deposit: PROJECT_STUDIO_DEPOSIT,
    dailyRent: def.dailyRent,
    capacity: `Staff cap ${PREMISES_TIERS[0].staffCap} → ${def.staffCap}, +${def.roomAllowanceBonus} room allowance`,
    unlocks: ['Vocal Suite', 'Job-board recruiting (+2 candidates)'],
  };
};

/** Explicit, confirmed move. Keeps staff, gear, clients, Know-How and history untouched. */
export const applyPremisesMove = <S extends PremisesState>(s: S): S => {
  const offer = getPremisesOffer(s);
  if (!offer || !offer.eligible) return s;
  const def = PREMISES_TIERS[1];
  return {
    ...s,
    premisesTier: 1,
    money: s.money - offer.deposit,
    studioRooms: s.studioRooms.map(r => (r.id === def.grantsRoomId ? { ...r, unlocked: true } : r)),
  };
};

export const premisesDailyRent = (s: { premisesTier?: number }): number => getPremisesDef(s).dailyRent;
export const premisesRoomAllowanceBonus = (s: { premisesTier?: number }): number => getPremisesDef(s).roomAllowanceBonus;
export const premisesStaffCap = (s: { premisesTier?: number }): number => getPremisesDef(s).staffCap;
export const premisesCandidateCount = (s: { premisesTier?: number }, base = 3): number => base + getPremisesDef(s).extraCandidates;
