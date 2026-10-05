/** Per-premises world affordance, Studio B-ready ids and the move-day beat (#250). */
import { applyPremisesMove } from '../src/rpg/premises';
import { ARCHETYPE_MODIFIERS, type PremisesArchetype } from '../src/rpg/premisesTraits';
import {
  ARCHETYPE_AFFORDANCES, archetypePropId, buildMoveDayBeat, getPremisesAffordance, MAX_MOVE_CASES, moveDayStage, premisesPropertyId,
} from '../src/rpg/premisesAffordance';
import { buildMoveInCutscene } from '../src/narrative/actCinematics';
import { getPremisesProps } from '../src/components/studio/studioPremisesDecor';
import { createDefaultStudioRooms } from '../src/utils/studioRoomUtils';

const assert = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); };
const archetypes = Object.keys(ARCHETYPE_MODIFIERS) as PremisesArchetype[];

// Every archetype has one affordance, and each is distinct (no meaningless reskins).
assert(archetypes.every(a => ARCHETYPE_AFFORDANCES[a]), 'every archetype has an affordance');
assert(new Set(archetypes.map(a => ARCHETYPE_AFFORDANCES[a].propId)).size === archetypes.length, 'affordance props are distinct');
assert(archetypes.every(a => ARCHETYPE_AFFORDANCES[a].verb.length > 10), 'every affordance names a verb');

// Affordance resolves per tier; borrowed room has none; mismatched archetype falls back to the band.
assert(getPremisesAffordance({}) === null && getPremisesAffordance({ premisesTier: 0 }) === null, 'borrowed room has no affordance');
assert(getPremisesAffordance({ premisesTier: 1 })?.propId === 'clientBench', 'legacy tier 1 shows the band affordance');
assert(getPremisesAffordance({ premisesTier: 2, premisesArchetype: 'warehouse' })?.propId === 'drumRiser', 'warehouse shows the rehearsal riser');
assert(getPremisesAffordance({ premisesTier: 1, premisesArchetype: 'warehouse' })?.propId === 'clientBench', 'archetype outside its band is ignored');
assert(getPremisesAffordance({ premisesTier: 2, premisesArchetype: 'bogus' })?.propId === 'reception', 'corrupt archetype falls back to the band');

// Stable Studio B-ready property ids.
assert(premisesPropertyId({}) === null, 'no property id for the borrowed room');
assert(premisesPropertyId({ premisesTier: 2, premisesArchetype: 'warehouse' }) === 'prop:warehouse:2', 'property id carries archetype and band');
assert(premisesPropertyId({ premisesTier: 3 }) === 'prop:band:3', 'legacy property id uses the band');
assert(premisesPropertyId({ premisesTier: 2, premisesArchetype: 'warehouse' }) === premisesPropertyId({ premisesTier: 2, premisesArchetype: 'warehouse' }), 'property id is deterministic');
assert(archetypePropId('basement', 1) === 'gearBench' && archetypePropId('basement', 2) === null && archetypePropId(undefined, 1) === null, 'archetype prop id respects the band');

// The world actually shows the prop: band furniture stays, one extra prop appears.
const plain = getPremisesProps(2);
const wh = getPremisesProps(2, 'warehouse');
assert(wh.length === plain.length + 1 && wh.some(p => p.id === 'drumRiser'), 'warehouse adds the riser prop on top of band furniture');
assert(plain.every(p => wh.some(w => w.id === p.id)), 'band furniture is preserved');
assert(getPremisesProps(1, 'warehouse').length === getPremisesProps(1).length, 'mismatched archetype adds nothing');
for (const a of archetypes) {
  const tier = ARCHETYPE_MODIFIERS[a].tiers[0];
  assert(getPremisesProps(tier, a).some(p => p.id === ARCHETYPE_AFFORDANCES[a].propId), `${a} prop is registered in the decor`);
}

// Move-day beat: continuity counts come from state, nothing is lost.
const rooms = createDefaultStudioRooms();
const base: any = {
  money: 20000, financials: { reports: new Array(5).fill({}) }, clientRelationships: { c1: { sessionsCompleted: 2 } },
  studioRooms: rooms, hiredStaff: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], ownedEquipment: new Array(5).fill({ id: 'g' }),
  playerData: { dailyWorkCapacity: 5, level: 3 },
};
const moved: any = applyPremisesMove(base, 'basement');
assert(moved.premisesMoveBeat === 1 && moved.hiredStaff.length === 3 && moved.ownedEquipment.length === 5, 'move keeps crew and gear');
const beat = buildMoveDayBeat(moved)!;
assert(beat.gearCount === 5 && beat.crewCount === 3 && beat.cases === 4, 'beat reports the real carried-over counts');
assert(beat.affordance.propId === 'gearBench', 'beat highlights the selected premises affordance');
assert(buildMoveDayBeat({ premisesTier: 0 }) === null, 'no beat for the borrowed room');
assert(buildMoveDayBeat({ premisesTier: 1, ownedEquipment: new Array(60).fill(0) })!.cases === MAX_MOVE_CASES, 'case count is capped');
assert(buildMoveDayBeat({ premisesTier: 1 })!.cases === 2, 'an empty save still shows a couple of cases');
assert(moveDayStage(0) === 'pack' && moveDayStage(1) === 'empty' && moveDayStage(2) === 'arrive' && moveDayStage(9) === 'arrive', 'stages follow the cutscene lines');

// Cutscene payload carries the beat; without context it is the legacy payload.
const cut = buildMoveInCutscene(1, undefined, moved);
assert(cut.moveDay?.cases === 4 && cut.moveDay.affordanceLabel === 'Gear bench', 'cutscene carries the move-day visual data');
assert(cut.stats!.some(s => s.label === 'Carried over' && s.value === '5 gear · 3 crew') && cut.stats!.some(s => s.label === 'New here' && s.value === 'Gear bench'), 'cutscene stats show continuity and the new affordance');
const legacy = buildMoveInCutscene(2);
assert(legacy.moveDay === undefined && legacy.stats!.length === 3, 'no context keeps the legacy cutscene');

console.log('premises-affordance checks passed');
