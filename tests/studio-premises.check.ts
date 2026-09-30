/** Premises milestones (#70): eligibility, optional move, preservation, capacity, rent, migration. */
import {
  getPremisesOffer, applyPremisesMove, premisesStaffCap, premisesDailyRent,
  premisesCandidateCount, premisesRoomAllowanceBonus, PROJECT_STUDIO_DEPOSIT,
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
assert(moved.hiredStaff === base.hiredStaff && moved.ownedEquipment === base.ownedEquipment && moved.studioKnowHow === base.studioKnowHow && moved.clientRelationships === base.clientRelationships, 'staff, gear, know-how, clients preserved');
assert(moved.studioRooms.find((r: any) => r.id === 'vocal-suite').unlocked, 'real room unlocked');
assert(premisesStaffCap(moved) === 6 && premisesRoomAllowanceBonus(moved) === 1 && premisesDailyRent(moved) > 0 && premisesCandidateCount(moved) === 5, 'capacity, rent, recruiting');
assert(getPremisesOffer(moved) === null && applyPremisesMove(moved) === moved, 'cannot move twice');
assert(moved.money > 0, 'premature-ish move is not instant bankruptcy');
const reloaded = JSON.parse(JSON.stringify(moved));
assert(applyPremisesMove(reloaded) === reloaded && reloaded.money === moved.money, 'reload cannot double-charge');

console.log('studio-premises.check passed');
