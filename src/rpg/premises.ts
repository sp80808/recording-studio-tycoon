/**
 * Studio premises milestones (#70), first slice: Tier 0 (borrowed room) →
 * Tier 1 (project studio). A premises tier is a content/capacity selection
 * over existing systems (rooms, staff, recruiting), not a second simulation.
 * Pure + deterministic; the move is optional and never automatic.
 */
import type { GameState, StaffMember } from '@/types/game';
import { getStaffCareer, SENIORITY_ORDER } from '@/rpg/staffCareer';

export type PremisesTier = 0 | 1 | 2 | 3;

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
  2: { tier: 2, name: 'Commercial Studio', staffCap: 10, roomAllowanceBonus: 2, dailyRent: 140, extraCandidates: 4, grantsRoomId: 'live-room' },
  3: { tier: 3, name: 'Multi-room Facility', staffCap: 14, roomAllowanceBonus: 3, dailyRent: 320, extraCandidates: 6, grantsRoomId: 'mix-suite' },
};

export const PROJECT_STUDIO_DEPOSIT = 2500;
export const COMMERCIAL_STUDIO_DEPOSIT = 14000;
const MIN_PAID_SESSIONS = 5;
/** Cash reserve left after paying the deposit, so a premature move isn't instant bankruptcy. */
const MIN_RESERVE_AFTER_DEPOSIT = 500;
const COMMERCIAL_PAID_SESSIONS = 25;
const COMMERCIAL_REPUTATION = 100;
const COMMERCIAL_SPECIALIST_LEVEL = 3;
/** The commercial unit's rent is real: keep a few weeks of it in the bank, not just the deposit. */
const COMMERCIAL_RESERVE_AFTER_DEPOSIT = 3000;
export const FACILITY_DEPOSIT = 40000;
const FACILITY_PAID_SESSIONS = 60;
const FACILITY_REPUTATION = 250;
const FACILITY_SENIOR_STAFF = 2;
const FACILITY_ANCHOR_CLIENT_SESSIONS = 5;
/** A facility's rent is steep: keep about a month of it in the bank after the deposit. */
const FACILITY_RESERVE_AFTER_DEPOSIT = 10000;

type PremisesState = Pick<GameState, 'money' | 'financials' | 'clientRelationships' | 'studioRooms'> & {
  playerData?: GameState['playerData'];
  premisesTier?: PremisesTier;
  reputation?: number;
  hiredStaff?: Partial<StaffMember>[];
};

export const getPremisesTier = (s: { premisesTier?: number }): PremisesTier => (s.premisesTier === 3 ? 3 : s.premisesTier === 2 ? 2 : s.premisesTier === 1 ? 1 : 0);
export const getPremisesDef = (s: { premisesTier?: number }): PremisesTierDef => PREMISES_TIERS[getPremisesTier(s)];

export interface PremisesCondition { label: string; met: boolean }
export interface PremisesOffer {
  /** The tier this move would take you to. */
  tier: 1 | 2 | 3;
  name: string;
  eligible: boolean;
  conditions: PremisesCondition[];
  deposit: number;
  dailyRent: number;
  capacity: string;
  unlocks: string[];
}

const capacityLine = (from: PremisesTier, to: PremisesTier): string => {
  const a = PREMISES_TIERS[from];
  const b = PREMISES_TIERS[to];
  return `Staff cap ${a.staffCap} → ${b.staffCap}, +${b.roomAllowanceBonus - a.roomAllowanceBonus} room allowance`;
};

/** The next move offer (Tier 0 → 1, then 1 → 2), or null once you are in the top premises. */
export const getPremisesOffer = (s: PremisesState): PremisesOffer | null => {
  const current = getPremisesTier(s);
  if (current >= 3) return null;
  const paid = s.financials?.reports?.length ?? 0;
  if (current === 2) {
    const def = PREMISES_TIERS[3];
    const seniors = (s.hiredStaff ?? []).filter(m => m.role && m.skills && SENIORITY_ORDER.indexOf(getStaffCareer(m as StaffMember).seniority) >= 2).length;
    const anchor = Object.values(s.clientRelationships ?? {}).some(r => r.sessionsCompleted >= FACILITY_ANCHOR_CLIENT_SESSIONS);
    const rep = s.reputation ?? 0;
    const conditions: PremisesCondition[] = [
      { label: `${FACILITY_PAID_SESSIONS} paid sessions (${Math.min(paid, FACILITY_PAID_SESSIONS)}/${FACILITY_PAID_SESSIONS})`, met: paid >= FACILITY_PAID_SESSIONS },
      { label: `Reputation ${FACILITY_REPUTATION} (${Math.min(Math.floor(rep), FACILITY_REPUTATION)}/${FACILITY_REPUTATION})`, met: rep >= FACILITY_REPUTATION },
      { label: `${FACILITY_SENIOR_STAFF} senior staff (${Math.min(seniors, FACILITY_SENIOR_STAFF)}/${FACILITY_SENIOR_STAFF})`, met: seniors >= FACILITY_SENIOR_STAFF },
      { label: `An anchor client with ${FACILITY_ANCHOR_CLIENT_SESSIONS} sessions`, met: anchor },
      { label: `$${(FACILITY_DEPOSIT + FACILITY_RESERVE_AFTER_DEPOSIT).toLocaleString()} cash (deposit plus about a month of rent)`, met: s.money >= FACILITY_DEPOSIT + FACILITY_RESERVE_AFTER_DEPOSIT },
    ];
    return {
      tier: 3,
      name: def.name,
      eligible: conditions.every(c => c.met),
      conditions,
      deposit: FACILITY_DEPOSIT,
      dailyRent: def.dailyRent,
      capacity: capacityLine(2, 3),
      unlocks: ['Mix Suite', 'Premium client lounge', 'Headhunter recruiting (+6 candidates)'],
    };
  }
  if (current === 1) {
    const def = PREMISES_TIERS[2];
    const specialist = (s.hiredStaff ?? []).some(m => (m.levelInRole ?? 1) >= COMMERCIAL_SPECIALIST_LEVEL);
    const rep = s.reputation ?? 0;
    const cash = s.money >= COMMERCIAL_STUDIO_DEPOSIT + COMMERCIAL_RESERVE_AFTER_DEPOSIT;
    const conditions: PremisesCondition[] = [
      { label: `${COMMERCIAL_PAID_SESSIONS} paid sessions (${Math.min(paid, COMMERCIAL_PAID_SESSIONS)}/${COMMERCIAL_PAID_SESSIONS})`, met: paid >= COMMERCIAL_PAID_SESSIONS },
      { label: `Reputation ${COMMERCIAL_REPUTATION} (${Math.min(Math.floor(rep), COMMERCIAL_REPUTATION)}/${COMMERCIAL_REPUTATION})`, met: rep >= COMMERCIAL_REPUTATION },
      { label: `A level ${COMMERCIAL_SPECIALIST_LEVEL} specialist on staff`, met: specialist },
      { label: `$${(COMMERCIAL_STUDIO_DEPOSIT + COMMERCIAL_RESERVE_AFTER_DEPOSIT).toLocaleString()} cash (deposit plus a few weeks of rent)`, met: cash },
    ];
    return {
      tier: 2,
      name: def.name,
      eligible: conditions.every(c => c.met),
      conditions,
      deposit: COMMERCIAL_STUDIO_DEPOSIT,
      dailyRent: def.dailyRent,
      capacity: capacityLine(1, 2),
      unlocks: ['Live Room', 'Reception and client lounge', 'Specialist recruiting (+4 candidates)'],
    };
  }
  const repeat = Object.values(s.clientRelationships ?? {}).some(r => r.sessionsCompleted >= 2);
  const cash = s.money >= PROJECT_STUDIO_DEPOSIT + MIN_RESERVE_AFTER_DEPOSIT;
  const conditions: PremisesCondition[] = [
    { label: `${MIN_PAID_SESSIONS} paid sessions (${Math.min(paid, MIN_PAID_SESSIONS)}/${MIN_PAID_SESSIONS})`, met: paid >= MIN_PAID_SESSIONS },
    { label: 'One repeat client', met: repeat },
    { label: `$${PROJECT_STUDIO_DEPOSIT + MIN_RESERVE_AFTER_DEPOSIT} cash (deposit plus a cushion)`, met: cash },
  ];
  const def = PREMISES_TIERS[1];
  return {
    tier: 1,
    name: def.name,
    eligible: conditions.every(c => c.met),
    conditions,
    deposit: PROJECT_STUDIO_DEPOSIT,
    dailyRent: def.dailyRent,
    capacity: capacityLine(0, 1),
    unlocks: ['Vocal Suite', 'Job-board recruiting (+2 candidates)'],
  };
};

/** Explicit, confirmed move. Keeps staff, gear, clients, Know-How and history untouched. */
export const applyPremisesMove = <S extends PremisesState>(s: S): S => {
  const offer = getPremisesOffer(s);
  if (!offer || !offer.eligible) return s;
  const def = PREMISES_TIERS[offer.tier];
  return {
    ...s,
    premisesTier: offer.tier,
    premisesMoveBeat: offer.tier,
    money: s.money - offer.deposit,
    // One day of downtime: moving day uses up today's work capacity (refills on the next day).
    ...(s.playerData ? { playerData: { ...s.playerData, dailyWorkCapacity: 0 } } : {}),
    studioRooms: s.studioRooms.map(r => (r.id === def.grantsRoomId ? { ...r, unlocked: true } : r)),
  };
};

export const premisesDailyRent = (s: { premisesTier?: number }): number => getPremisesDef(s).dailyRent;
export const premisesRoomAllowanceBonus = (s: { premisesTier?: number }): number => getPremisesDef(s).roomAllowanceBonus;
export const premisesStaffCap = (s: { premisesTier?: number }): number => getPremisesDef(s).staffCap;
export const premisesCandidateCount = (s: { premisesTier?: number }, base = 3): number => base + getPremisesDef(s).extraCandidates;

/** Mark the move-day cinematic as seen. */
export const clearPremisesMoveBeat = <S extends { premisesMoveBeat?: number }>(s: S): S => {
  if (s.premisesMoveBeat === undefined) return s;
  const { premisesMoveBeat: _seen, ...rest } = s;
  void _seen;
  return rest as S;
};

export const getPremisesMoveBeat = (s: { premisesMoveBeat?: number }): 1 | 2 | 3 | null =>
  s.premisesMoveBeat === 1 || s.premisesMoveBeat === 2 || s.premisesMoveBeat === 3 ? s.premisesMoveBeat : null;
