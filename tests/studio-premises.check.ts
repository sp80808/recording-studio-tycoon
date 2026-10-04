/** Premises milestones (#70): eligibility, optional move, preservation, capacity, rent, migration. */
import {
  getPremisesOffer, applyPremisesMove, premisesStaffCap, premisesDailyRent,
  premisesCandidateCount, premisesRoomAllowanceBonus, clearPremisesMoveBeat, getPremisesMoveBeat, PROJECT_STUDIO_DEPOSIT, COMMERCIAL_STUDIO_DEPOSIT, FACILITY_DEPOSIT,
} from '../src/rpg/premises';
import { createDefaultStudioRooms } from '../src/utils/studioRoomUtils';
import { deriveStudioPressure, generatePremisesOpportunities, getPremisesWorldCue } from '../src/rpg/premisesPressure';

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
assert(getPremisesOffer(moved2)!.tier === 3 && applyPremisesMove(moved2) === moved2, 'Tier 3 is offered but an ineligible studio cannot move');
const reloaded2 = JSON.parse(JSON.stringify(moved2));
assert(applyPremisesMove(reloaded2) === reloaded2 && reloaded2.money === moved2.money, 'Tier 2 reload cannot double-charge');

// ---- Tier 3: Multi-room Facility ----
const senior = (id: string) => ({ id, role: 'Engineer', levelInRole: 4, skills: {}, career: { activeDiscipline: 'mixing', experience: [], seniority: 'senior', credited: [] } });
const ready3: any = {
  ...moved2,
  money: FACILITY_DEPOSIT + 10000,
  reputation: 250,
  financials: { reports: new Array(60).fill({}) },
  clientRelationships: { c1: { sessionsCompleted: 5 } },
  hiredStaff: [senior('a'), senior('b')],
};
const offer3 = getPremisesOffer(ready3)!;
assert(offer3.tier === 3 && offer3.eligible && offer3.deposit === FACILITY_DEPOSIT && offer3.dailyRent > premisesDailyRent(moved2), 'Tier 3 offer is eligible with sessions, rep, two seniors, anchor client and cash');
assert(!getPremisesOffer({ ...ready3, money: FACILITY_DEPOSIT })!.eligible, 'Tier 3 keeps a month of rent in reserve');
assert(!getPremisesOffer({ ...ready3, hiredStaff: [senior('a'), { ...senior('b'), career: { ...senior('b').career, seniority: 'regular' } }] })!.eligible, 'Tier 3 needs two senior staff');
assert(!getPremisesOffer({ ...ready3, clientRelationships: { c1: { sessionsCompleted: 4 } } })!.eligible, 'Tier 3 needs an anchor client');
assert(!getPremisesOffer({ ...ready3, reputation: 249 })!.eligible && !getPremisesOffer({ ...ready3, financials: { reports: new Array(59).fill({}) } })!.eligible, 'Tier 3 reputation and session gates');
assert(getPremisesOffer({ ...ready3, premisesTier: 1 })!.tier === 2, 'cannot skip Tier 2');
const moved3: any = applyPremisesMove(ready3);
assert(moved3.premisesTier === 3 && moved3.money === 10000 && moved3.playerData.dailyWorkCapacity === 0, 'Tier 3 deposit charged, reserve left, costs the day');
assert(moved3.hiredStaff === ready3.hiredStaff && moved3.ownedEquipment === ready3.ownedEquipment && moved3.clientRelationships === ready3.clientRelationships, 'Tier 3 move preserves staff, gear, clients');
assert(moved3.studioRooms.find((r: any) => r.id === 'mix-suite').unlocked && moved3.studioRooms.find((r: any) => r.id === 'live-room').unlocked, 'Mix Suite unlocked, earlier rooms kept');
assert(premisesStaffCap(moved3) === 14 && premisesRoomAllowanceBonus(moved3) === 3 && premisesCandidateCount(moved3) === 9, 'Tier 3 capacity and recruiting');
assert(getPremisesOffer(moved3) === null && applyPremisesMove(moved3) === moved3, 'no move beyond Tier 3');
const reloaded3 = JSON.parse(JSON.stringify(moved3));
assert(applyPremisesMove(reloaded3) === reloaded3 && reloaded3.money === moved3.money, 'Tier 3 reload cannot double-charge');

// ---- Move-day cinematic ----
import { buildMoveInCutscene } from '../src/narrative/actCinematics';
assert(moved.premisesMoveBeat === 1 && moved2.premisesMoveBeat === 2 && moved3.premisesMoveBeat === 3, 'a move queues its move-day beat');
assert(getPremisesMoveBeat(JSON.parse(JSON.stringify(moved3))) === 3, 'the beat survives save and reload');
assert(getPremisesMoveBeat(clearPremisesMoveBeat(moved3)) === null && clearPremisesMoveBeat(moved3).premisesTier === 3, 'seeing the beat clears it and keeps the tier');
assert(getPremisesMoveBeat({}) === null && getPremisesMoveBeat({ premisesMoveBeat: 9 }) === null, 'legacy and corrupt saves show nothing');
for (const t of [1, 2, 3] as const) {
  const c = buildMoveInCutscene(t);
  assert(c.lines.length === 3 && c.stats!.length === 3 && c.finalLabel === 'Walk in' && c.title.length > 0, `tier ${t} cinematic has lines, stats and a button`);
}
assert(buildMoveInCutscene(3).stats![0].value === '14' && buildMoveInCutscene(2).stats![1].value === '$140/day', 'the cinematic quotes the real capacity and rent');

console.log('studio-premises.check passed');

// ---- #250: studio pressure + property opportunities ----
{

  const rooms = createDefaultStudioRooms();
  const enquiry = (i: number, over: any = {}) => ({ id: `q${i}`, title: 't', genre: 'Pop', clientType: 'Solo Artist', ...over });
  const calm: any = { ...base, saveSeed: 'seed-a', currentDay: 10, studioRooms: rooms, activeProjects: [], availableProjects: [enquiry(1)], hiredStaff: [] };
  assert(generatePremisesOpportunities(calm).length === 0, 'low-demand studio is not spammed with opportunities');
  assert(getPremisesWorldCue(calm) === null, 'no world cue when coping');

  const unlockedIds = rooms.filter((r: any) => r.unlocked).map((r: any) => r.id);
  assert(unlockedIds.length >= 1, 'default rooms have an unlocked room');
  const busy: any = {
    ...base, saveSeed: 'seed-a', currentDay: 10, studioRooms: rooms,
    activeProjects: unlockedIds.map((id: string, i: number) => ({ id: `p${i}`, bookingRoomId: id })),
    availableProjects: [enquiry(1), enquiry(2), enquiry(3, { clientType: 'Rock Band' })],
    hiredStaff: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  };
  const pressure = deriveStudioPressure(busy);
  const ids = pressure.reasons.map(r => r.id);
  assert(ids.includes('rooms-full') && ids.includes('crew-crowded') && ids.includes('live-room-missing'), `three distinct pressure reasons emerge (${ids.join(',')})`);
  const opps = generatePremisesOpportunities(busy);
  assert(opps.length >= 1 && opps.length <= 2, 'busy studio gets 1-2 opportunities');
  assert(JSON.stringify(opps) === JSON.stringify(generatePremisesOpportunities(JSON.parse(JSON.stringify(busy)))), 'same state and seed give identical opportunities');
  assert(opps.every(o => o.internalTier === 1 && o.deposit === PROJECT_STUDIO_DEPOSIT && o.tradeoff.length > 0 && o.solves.length > 0 && o.cue.length > 0), 'opportunities carry real terms and a trade-off');
  assert(new Set(opps.map(o => o.archetype)).size === opps.length, 'opportunities are materially different archetypes');
  assert(getPremisesWorldCue(busy) === opps[0].cue, 'world cue comes from the first opportunity');
  assert(generatePremisesOpportunities({ ...busy, currentDay: 13 })[0].id === opps[0].id, 'stable within the same game week');

  // Different reasons favour different archetypes.
  const crowdOnly: any = { ...busy, activeProjects: [], availableProjects: [], hiredStaff: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] };
  const roomsOnly: any = { ...busy, hiredStaff: [], availableProjects: [enquiry(1), enquiry(2), enquiry(3)] };
  const seenCrowd = new Set<string>();
  const seenRooms = new Set<string>();
  for (let day = 0; day < 140; day += 7) {
    generatePremisesOpportunities({ ...crowdOnly, currentDay: day }).forEach(o => seenCrowd.add(o.archetype));
    generatePremisesOpportunities({ ...roomsOnly, currentDay: day }).forEach(o => seenRooms.add(o.archetype));
  }
  assert(seenCrowd.has('basement') && seenRooms.has('project-room'), 'pressure reasons steer archetypes');

  // Declining is free: nothing is applied until applyPremisesMove, and ignoring never changes state.
  const before = JSON.stringify(busy);
  generatePremisesOpportunities(busy);
  assert(JSON.stringify(busy) === before && applyPremisesMove({ ...busy, money: 100 }).premisesTier === undefined, 'ignoring an opportunity does not touch state');

  // Legacy save (no seed, no optional fields) stays valid; maxed premises offer nothing.
  const legacy: any = { money: 0, financials: { reports: [] }, studioRooms: rooms };
  assert(Array.isArray(generatePremisesOpportunities(legacy)) && deriveStudioPressure(legacy).score === 0, 'legacy saves stay valid');
  assert(generatePremisesOpportunities({ ...busy, premisesTier: 3 }).length === 0, 'no opportunities in the top premises');
  // Moving still preserves gear/staff/relationships via the authoritative path.
  const movedBusy: any = applyPremisesMove(busy);
  assert(movedBusy.premisesTier === 1 && movedBusy.hiredStaff === busy.hiredStaff && movedBusy.ownedEquipment === busy.ownedEquipment, 'move via opportunity preserves staff and gear');
}
