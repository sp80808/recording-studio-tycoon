/** Studio Know-How (#66): dedupe, diminishing repeats, failure teaches, gates, migration, perk path. */
import {
  awardKnowHow, createInitialKnowHow, migrateKnowHow, spendKnowHow, meetsKnowHowGate,
  unlockCapability, domainForStage, applyKnowHowEvents, STUDIO_CAPABILITIES, type KnowHowEvent,
} from '../src/rpg/studioKnowHow';
import { StudioUpgradeService } from '../src/game-mechanics/studio-perks';
import { availableTrainingCourses } from '../src/data/training';

const assert = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); };
const session = (id: string, grade: string, key = 'pop:tracking'): KnowHowEvent =>
  ({ kind: 'session', eventId: id, domain: 'tracking', repeatKey: key, grade });

// Duplicate event ids (save/reload, double fire) never pay twice.
let kh = createInitialKnowHow();
kh = awardKnowHow(kh, session('s1', 'A')).state;
const again = awardKnowHow(kh, session('s1', 'A'));
assert(again.award === null && again.state === kh, 'duplicate event id ignored');

// Repeating the exact same trivial action diminishes to zero Know-How and zero domain xp.
let farm = createInitialKnowHow();
const gains: number[] = [];
for (let i = 0; i < 8; i++) {
  const before = farm.totalEarned;
  farm = awardKnowHow(farm, session(`f${i}`, 'B')).state;
  gains.push(farm.totalEarned - before);
}
assert(gains[0] > gains[2] && gains[2] > gains[3], `repeat gains diminish: ${gains}`);
assert(gains.slice(4).every(g => g === 0), `farming dries up: ${gains}`);
const domainAfter = farm.domains.tracking;
farm = awardKnowHow(farm, session('f99', 'B')).state;
assert(farm.domains.tracking === domainAfter, 'domain xp also dries up');

// Failure teaches, but less than success; fresh keys pay again.
const fail = awardKnowHow(createInitialKnowHow(), session('x', 'C', 'k1')).award!;
const good = awardKnowHow(createInitialKnowHow(), session('y', 'S', 'k2')).award!;
assert(fail.knowHow >= 0 && fail.domainXp > 0, 'failed session still teaches domain');
assert(fail.knowHow < good.knowHow && fail.domainXp < good.domainXp, 'failure pays less than success');

// One-shot discoveries/training/research pay once.
const disc: KnowHowEvent = { kind: 'discovery', eventId: 'synergy:a', domain: 'production', label: 'A' };
let d = awardKnowHow(createInitialKnowHow(), disc).state;
assert(d.available === 4, 'discovery pays 4');
for (let i = 0; i < 80; i++) d = awardKnowHow(d, session(`flood${i}`, 'B', `flood${i}`)).state; // roll the dedupe log over
assert(awardKnowHow(d, disc).award === null, 'discovery still pays once after the award log rolls over');
const r1 = awardKnowHow(createInitialKnowHow(), { kind: 'research', eventId: 'research:m', modId: 'm' });
assert(r1.award !== null && awardKnowHow(r1.state, { kind: 'research', eventId: 'research:m:2', modId: 'm' }).award === null, 'research mod pays once');

// Spending + gates.
assert(spendKnowHow(createInitialKnowHow(), 1) === null, 'cannot overspend');
const rich = { ...createInitialKnowHow(), available: 10, totalEarned: 10, domains: { ...createInitialKnowHow().domains, mixing: 20 } };
const mixCourse = availableTrainingCourses.find(c => c.id === 'train03')!;
assert(!!mixCourse.knowHow && meetsKnowHowGate(rich, mixCourse.knowHow), 'advanced mixing unlocks with know-how');
assert(!meetsKnowHowGate(createInitialKnowHow(), mixCourse.knowHow!), 'advanced mixing locked at start');
assert(availableTrainingCourses.filter(c => c.knowHow).length >= 3, '3 advanced courses Know-How gated');
assert(spendKnowHow(rich, 6)!.available === 4 && spendKnowHow(rich, 6)!.totalSpent === 6, 'spend moves pool');

// Capabilities unlock from play, not level.
assert(STUDIO_CAPABILITIES.length >= 3, '3+ capabilities');
assert(unlockCapability(createInitialKnowHow(), 'session-templates') === null, 'capability locked at start');
const trained = { ...rich, domains: { ...rich.domains, tracking: 25 } };
const unlocked = unlockCapability(trained, 'session-templates');
assert(!!unlocked && unlocked.discoveries.includes('capability:session-templates') && unlockCapability(unlocked!, 'session-templates') === null, 'capability unlocks once');

// Migration.
assert(migrateKnowHow(undefined).available === 0, 'legacy save -> empty');
assert(migrateKnowHow({ available: -5, totalEarned: 'x', domains: { mixing: 7 } }).domains.mixing === 7, 'partial blob repaired');
assert(migrateKnowHow(JSON.parse(JSON.stringify(unlocked))).available === unlocked!.available, 'round-trips JSON');

// Domain mapping + state glue.
assert(domainForStage('Final Mix') === 'mixing' && domainForStage('Mastering') === 'mastering' && domainForStage('Vocal Tracking') === 'tracking', 'stage domains');
const glued = applyKnowHowEvents({ studioKnowHow: undefined as any }, [session('g1', 'A'), session('g1', 'A')]);
assert(glued.awards.length === 1, 'glue dedupes within batch');

// StudioUpgradeService: researchPoints + knowHowDomain gates are live.
const svc = new StudioUpgradeService([{
  id: 'p', name: 'p', description: '', category: 'Acoustics', isUnlocked: false, isActive: false, effects: [],
  unlockConditions: [{ type: 'researchPoints', threshold: 5 }, { type: 'knowHowDomain', knowHowDomain: 'mixing', threshold: 15 }],
}]);
assert(!svc.canUnlockPerk('p', { studioKnowHow: createInitialKnowHow(), reputation: 0 } as any), 'perk locked without know-how');
assert(svc.canUnlockPerk('p', { studioKnowHow: rich, reputation: 0 } as any), 'perk unlocks with know-how');

console.log('studio-know-how.check passed');
