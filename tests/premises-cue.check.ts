/** Premises archetype modifiers, lead expiry and world-cue delivery (#250). */
import { applyPremisesMove, getPremisesOffer, premisesDailyRent, premisesStaffCap, PROJECT_STUDIO_DEPOSIT, COMMERCIAL_STUDIO_DEPOSIT, PREMISES_TIERS } from '../src/rpg/premises';
import { ARCHETYPE_MODIFIERS, getArchetypeModifiers, isPremisesArchetype } from '../src/rpg/premisesTraits';
import { generatePremisesOpportunities, LEAD_WINDOW_DAYS } from '../src/rpg/premisesPressure';
import { getPremisesCue, markPremisesCueDelivered, cueSoundsRespectOneShotPolicy, MIN_DAYS_LEFT_TO_ANNOUNCE } from '../src/rpg/premisesCue';
import { isKnownUISound } from '../src/utils/oneShotPolicy';
import { createDefaultStudioRooms } from '../src/utils/studioRoomUtils';
import { migrateAndInitializeGameState } from '../src/utils/gameStateUtils';

const assert = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); };
const rooms = createDefaultStudioRooms();
const unlockedIds = rooms.filter((r: any) => r.unlocked).map((r: any) => r.id);
const enquiry = (i: number, over: any = {}) => ({ id: `q${i}`, title: 't', genre: 'Pop', clientType: 'Solo Artist', ...over });
const base: any = {
  money: 10000, financials: { reports: new Array(5).fill({}) }, clientRelationships: { c1: { sessionsCompleted: 2 } },
  studioRooms: rooms, hiredStaff: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], ownedEquipment: [{ id: 'g' }],
  playerData: { dailyWorkCapacity: 5, level: 3 }, saveSeed: 'seed-cue', currentDay: 14, notifications: [],
  activeProjects: unlockedIds.map((id: string, i: number) => ({ id: `p${i}`, bookingRoomId: id })),
  availableProjects: [enquiry(1), enquiry(2), enquiry(3, { clientType: 'Rock Band' })],
};

// ---- Per-archetype modifiers ----
const legacyMove: any = applyPremisesMove(base);
assert(legacyMove.premisesArchetype === undefined && legacyMove.money === 10000 - PROJECT_STUDIO_DEPOSIT, 'no archetype keeps legacy deposit');
assert(premisesDailyRent(legacyMove) === PREMISES_TIERS[1].dailyRent && premisesStaffCap(legacyMove) === 6, 'legacy rent and cap are the band standard');

const basement: any = applyPremisesMove(base, 'basement');
assert(basement.premisesArchetype === 'basement' && basement.premisesTier === 1, 'chosen archetype is persisted inside its band');
assert(basement.money === 10000 - Math.round(PROJECT_STUDIO_DEPOSIT * 0.7), 'basement deposit is cheaper');
assert(premisesDailyRent(basement) === Math.round(40 * 0.8) && premisesStaffCap(basement) === 7, 'basement rent is lower and fits one more crew member');
const room: any = applyPremisesMove(base, 'project-room');
assert(room.money === 10000 - Math.round(PROJECT_STUDIO_DEPOSIT * 1.1) && premisesDailyRent(room) === 40, 'project room costs a fit-out premium');
assert(room.hiredStaff === base.hiredStaff && room.ownedEquipment === base.ownedEquipment && room.clientRelationships === base.clientRelationships, 'archetype move still preserves staff, gear, clients');

assert(applyPremisesMove(base, 'warehouse').premisesArchetype === undefined, 'archetype that does not fit the band is ignored, not half-applied');
assert((applyPremisesMove(base, 'bogus' as any) as any).money === legacyMove.money, 'unknown archetype falls back to legacy terms');
const tight: any = { ...base, money: PROJECT_STUDIO_DEPOSIT + 500 };
assert(applyPremisesMove(tight, 'project-room').money === 250 && applyPremisesMove(tight, 'basement').money === 3000 - 1750, 'at the minimum cash the fit-out premium eats into the cushion but never overdraws');

const t1ready: any = { ...legacyMove, money: COMMERCIAL_STUDIO_DEPOSIT + 3000, reputation: 100, financials: { reports: new Array(25).fill({}) }, hiredStaff: [{ id: 'a', levelInRole: 3 }] };
assert(getPremisesOffer(t1ready)!.eligible, 'tier 2 offer eligible');
const warehouse: any = applyPremisesMove(t1ready, 'warehouse');
assert(warehouse.money === t1ready.money - Math.round(COMMERCIAL_STUDIO_DEPOSIT * 0.8), 'warehouse deposit discount');
assert(premisesDailyRent(warehouse) === Math.round(140 * 0.7) && premisesStaffCap(warehouse) === 12, 'warehouse: low rent, big crew');
const commercial: any = applyPremisesMove(t1ready, 'commercial');
assert(premisesDailyRent(commercial) === Math.round(140 * 1.3) && premisesStaffCap(commercial) === 9, 'commercial: premium rent, tight footprint');
assert(premisesDailyRent({ premisesTier: 2, premisesArchetype: 'basement' }) === 140 && premisesStaffCap({ premisesTier: 2, premisesArchetype: 'basement' }) === 10, 'mismatched stored archetype is inert');
assert(premisesDailyRent({ premisesTier: 2, premisesArchetype: { evil: 1 } }) === 140, 'corrupt archetype is inert');
assert(Object.entries(ARCHETYPE_MODIFIERS).every(([k, m]) => isPremisesArchetype(k) && (m.depositMult !== 1 || m.rentMult !== 1 || m.staffCapDelta !== 0) && m.terms.length > 0), 'every archetype changes a real cost');
assert(getArchetypeModifiers('basement', 2) === null && getArchetypeModifiers('commercial', 3) !== null, 'tier membership');

// Offers quote the modified terms and match what the move charges.
for (const day of [14, 21, 28, 35, 42, 49]) {
  for (const o of generatePremisesOpportunities({ ...base, currentDay: day })) {
    const mod = ARCHETYPE_MODIFIERS[o.archetype];
    assert(o.deposit === Math.round(PROJECT_STUDIO_DEPOSIT * mod.depositMult) && o.dailyRent === Math.round(40 * mod.rentMult) && o.staffCap === 6 + mod.staffCapDelta, `offer for ${o.archetype} quotes its modified terms`);
    const moved: any = applyPremisesMove({ ...base, currentDay: day }, o.archetype);
    assert(base.money - moved.money === o.deposit && premisesDailyRent(moved) === o.dailyRent && premisesStaffCap(moved) === o.staffCap, `quoted terms equal charged terms for ${o.archetype}`);
    assert(o.terms.length > 0, 'offer carries the cost shape');
  }
}

// ---- Migration ----
const migrated: any = migrateAndInitializeGameState({ ...base, premisesTier: 1, premisesArchetype: 'warehouse', premisesCueSeen: 5 } as any);
assert(migrated.premisesArchetype === undefined && migrated.premisesCueSeen === undefined, 'corrupt optional fields are dropped');
const migratedOk: any = migrateAndInitializeGameState({ ...base, premisesTier: 1, premisesArchetype: 'basement', premisesCueSeen: 'x' } as any);
assert(migratedOk.premisesArchetype === 'basement' && migratedOk.premisesCueSeen === 'x', 'valid optional fields survive');
const legacyLoad: any = migrateAndInitializeGameState({ ...base } as any);
assert(legacyLoad.premisesTier === 0 && legacyLoad.premisesArchetype === undefined, 'legacy save with only premisesTier stays valid');

// ---- Expiry and replacement ----
const wk = (d: number) => generatePremisesOpportunities({ ...base, currentDay: d });
const w2 = wk(14);
assert(w2.length >= 1, 'busy studio has a lead');
assert(w2.every(o => o.expiresDay === 21 && o.daysLeft === 7), 'lead expires at the end of its week window');
assert(wk(17)[0].daysLeft === 4 && wk(17)[0].id === w2[0].id, 'same lead, fewer days left');
assert(wk(20)[0].daysLeft === 1 && wk(20)[0].expiresDay === 21, 'last day is at least 1');
assert(wk(21)[0].id !== w2[0].id && wk(21)[0].expiresDay === 28, 'next window deterministically replaces the lead');
assert(JSON.stringify(wk(21)) === JSON.stringify(generatePremisesOpportunities(JSON.parse(JSON.stringify({ ...base, currentDay: 21 })))), 'replacement is deterministic');
assert(LEAD_WINDOW_DAYS === 7, 'window constant');
// Ignoring a lead never blocks progression.
assert((applyPremisesMove({ ...base, currentDay: 28 }, 'project-room') as any).premisesTier === 1, 'a lead ignored for weeks does not block the move');

// ---- Cue delivery ----
assert(getPremisesCue({ ...base, availableProjects: [], activeProjects: [], hiredStaff: [] }) === null, 'no cue when the studio is coping');
const cue = getPremisesCue(base)!;
assert(!!cue && cue.leadId === w2[0].id && cue.line === w2[0].cue, 'cue carries the lead line');
assert((cue.channel === 'door' ? w2[0].source === 'landlord' : w2[0].source !== 'landlord') && cue.hotspot === cue.channel, 'landlord knocks, others phone');
assert(cue.sounds.length >= 2 && cue.sounds.every(s => isKnownUISound(s.sound)) && cueSoundsRespectOneShotPolicy(cue.sounds), 'cue uses known one-shot sounds spaced past the cooldown');
assert(!cueSoundsRespectOneShotPolicy([{ sound: 'notification', delayMs: 0 }, { sound: 'notification', delayMs: 40 }]), 'policy check rejects stacked identical sounds');
const delivered: any = markPremisesCueDelivered(base, cue, 1);
assert(delivered.premisesCueSeen === cue.leadId && delivered.notifications.length === 1 && delivered.notifications[0].message === cue.line, 'delivery marks the lead and adds one notification');
assert(markPremisesCueDelivered(delivered, cue, 2) === delivered && getPremisesCue(delivered) === null, 'a lead rings once');
assert(getPremisesCue(JSON.parse(JSON.stringify(delivered))) === null, 'reload does not re-ring');
assert(getPremisesCue({ ...delivered, currentDay: 21 }) !== null, 'the replacement lead rings again');
const lateDay = 14 + 7 - MIN_DAYS_LEFT_TO_ANNOUNCE + 1;
assert(getPremisesCue({ ...base, currentDay: lateDay }) === null, 'a lead about to expire is not announced');
const seen = new Map<string, string>();
const roomsOnly = { ...base, hiredStaff: [], availableProjects: [enquiry(1), enquiry(2), enquiry(3)] };
for (const st of [base, roomsOnly]) {
  for (let d = 0; d < 400; d += 7) {
    const lead = generatePremisesOpportunities({ ...st, currentDay: d })[0];
    const c = getPremisesCue({ ...st, currentDay: d });
    if (lead && c) seen.set(lead.source, c.channel);
  }
}
assert(seen.get('landlord') === 'door' && seen.get('referral') === 'phone', 'both a door knock and a phone ring occur across weeks');

console.log('premises-cue.check passed');
