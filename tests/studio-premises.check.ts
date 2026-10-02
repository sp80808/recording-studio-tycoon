/** Premises milestones (#70): eligibility, optional move, preservation, capacity, rent, migration. */
import {
  getPremisesOffer, applyPremisesMove, premisesStaffCap, premisesDailyRent,
  premisesCandidateCount, premisesRoomAllowanceBonus, PROJECT_STUDIO_DEPOSIT, COMMERCIAL_STUDIO_DEPOSIT,
} from '../src/rpg/premises';
import { createDefaultStudioRooms } from '../src/utils/studioRoomUtils';

const assert = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); };
const base: any = {
  money: 10000,
  financials: { reports: new Array(5).fill({}) },
  clientRelationships: { c1: { sessionsCompleted: 2 } },
  studioRooms: createDefaultStudioRooms(),
  hiredStaff: [{ id: 'a' }],
  ownedEquipment: [{ id: 'g' }],
  studioKnowHow: { available: 7 },
  playerData: { dailyWorkCapacity: 5, level: 3 },
};

assert(getPremisesOffer(base)!.eligible, 'eligible with sessions, repeat client, cash');
assert(!getPremisesOffer({ ...base, money: 2000 })!.eligible, 'cash gate (deposit plus cushion)');
assert(!getPremisesOffer({ ...base, financials: { reports: [] } })!.eligible, 'paid-session gate');
assert(!getPremisesOffer({ ...base, clientRelationships: {} })!.eligible, 'repeat-client gate');

// Never automatic: the state is unchanged until applyPremisesMove is called.
assert(base.premisesTier === undefined && premisesStaffCap(base) === 3 && premisesDailyRent(base) === 0, 'legacy/tier 0 defaults');
assert(applyPremisesMove({ ...base, money: 100 }).premisesTier === undefined, 'ineligible move is a no-op');

const moved: any = applyPremisesMove(base);
assert(moved.premisesTier === 1 && moved.money === 10000 - PROJECT_STUDIO_DEPOSIT, 'deposit charged');
assert(moved.playerData.dailyWorkCapacity === 0 && moved.playerData.level === 3, 'move costs the day (1-day downtime) but keeps the rest of player data');
assert(moved.hiredStaff === base.hiredStaff && moved.ownedEquipment === base.ownedEquipment && moved.studioKnowHow === base.studioKnowHow && moved.clientRelationships === base.clientRelationships, 'staff, gear, know-how, clients preserved');
assert(moved.studioRooms.find((r: any) => r.id === 'vocal-suite').unlocked, 'real room unlocked');
assert(premisesStaffCap(moved) === 6 && premisesRoomAllowanceBonus(moved) === 1 && premisesDailyRent(moved) > 0 && premisesCandidateCount(moved) === 5, 'capacity, rent, recruiting');
assert(getPremisesOffer(moved)!.tier === 2 && applyPremisesMove(moved) === moved, 'next offer is Tier 2 and an ineligible studio cannot repeat or skip the move');
assert(moved.money > 0, 'premature-ish move is not instant bankruptcy');
const reloaded = JSON.parse(JSON.stringify(moved));
assert(applyPremisesMove(reloaded) === reloaded && reloaded.money === moved.money, 'reload cannot double-charge');

// ---- Tier 2: Commercial Studio ----
const ready: any = {
  ...moved,
  money: COMMERCIAL_STUDIO_DEPOSIT + 3000,
  reputation: 100,
  financials: { reports: new Array(25).fill({}) },
  hiredStaff: [{ id: 'a', levelInRole: 3 }],
};
const offer2 = getPremisesOffer(ready)!;
assert(offer2.tier === 2 && offer2.eligible && offer2.deposit === COMMERCIAL_STUDIO_DEPOSIT && offer2.dailyRent > premisesDailyRent(moved), 'Tier 2 offer is eligible with sessions, rep, specialist and cash');
assert(!getPremisesOffer({ ...ready, money: COMMERCIAL_STUDIO_DEPOSIT })!.eligible, 'Tier 2 keeps a rent reserve after the deposit');
assert(!getPremisesOffer({ ...ready, reputation: 99 })!.eligible, 'Tier 2 reputation gate');
assert(!getPremisesOffer({ ...ready, financials: { reports: new Array(24).fill({}) } })!.eligible, 'Tier 2 paid-session gate');
assert(!getPremisesOffer({ ...ready, hiredStaff: [{ id: 'a', levelInRole: 2 }] })!.eligible, 'Tier 2 specialist gate');
assert(getPremisesOffer({ ...ready, premisesTier: 0 })!.tier === 1, 'cannot skip Tier 1');

const moved2: any = applyPremisesMove(ready);
assert(moved2.premisesTier === 2 && moved2.money === 3000, 'Tier 2 deposit charged, rent reserve left');
assert(moved2.hiredStaff === ready.hiredStaff && moved2.ownedEquipment === ready.ownedEquipment && moved2.clientRelationships === ready.clientRelationships, 'Tier 2 move preserves staff, gear, clients');
assert(moved2.playerData.dailyWorkCapacity === 0, 'Tier 2 move also costs the day');
assert(moved2.studioRooms.find((r: any) => r.id === 'live-room').unlocked && moved2.studioRooms.find((r: any) => r.id === 'vocal-suite').unlocked, 'Live Room unlocked, Vocal Suite kept');
assert(premisesStaffCap(moved2) === 10 && premisesRoomAllowanceBonus(moved2) === 2 && premisesCandidateCount(moved2) === 7, 'Tier 2 capacity and recruiting');
assert(getPremisesOffer(moved2) === null && applyPremisesMove(moved2) === moved2, 'no move beyond Tier 2');
const reloaded2 = JSON.parse(JSON.stringify(moved2));
assert(applyPremisesMove(reloaded2) === reloaded2 && reloaded2.money === moved2.money, 'Tier 2 reload cannot double-charge');

console.log('studio-premises.check passed');
