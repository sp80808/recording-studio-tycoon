import assert from 'node:assert/strict';
import { generateBoxLoot } from '@/features/boxDrops/lootGenerator';
import { generateGear, gearCatalogue, generateDailyClassifieds, generateCrateGear, resaleValue } from '@/features/usedGear/generation';
import { applyGearAction, maintenanceQuote, refreshGearForDay, asEquipmentInstance } from '@/features/usedGear/economy';
import { conditionBand, clampCondition, wearPerSession } from '@/features/usedGear/condition';
import { awardProjectCrate, recordGearUse, gearForecastReasons } from '@/features/usedGear/session';
import { resolveSessionEquipment, getEquipmentBonuses } from '@/utils/gameUtils';
import { migrateAndInitializeGameState } from '@/utils/gameStateUtils';
import { initializeSkillsPlayer } from '@/utils/skillUtils';
import { createDefaultStudioRooms } from '@/utils/studioRoomUtils';
import { advanceSimulation, PASSIVE_WORK_SESSION_MS } from '@/simulation/simulationClock';
import { ProjectService, applyReportToState } from '@/game-mechanics/ProjectService';
import { generateProjectReview } from '@/utils/projectReviewUtils';
import { evaluateProjectSynergies } from '@/utils/synergyUtils';
import { STUDIO_SYNERGIES } from '@/data/synergies';
import { ProjectManager } from '@/services/ProjectManager';
import type { GameState, Project, ProjectReport, StaffMember } from '@/types/game';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const template = gearCatalogue(2024).find(item => item.category === 'interface')!;
const gear = generateGear(template, { saveSeed: 7, day: 2, year: 2024, source: 'retail', index: 99 });
const project = (): Project => ({
  id: 'session-1', title: 'Studio take', genre: 'Rock', clientType: 'Indie', difficulty: 1,
  durationDaysTotal: 1, payoutBase: 600, repGainBase: 10, requiredSkills: { tracking: 1 },
  stages: [{ stageName: 'Tracking', focusAreas: ['soundCapture'], workUnitsBase: 1000, workUnitsCompleted: 0, completed: false }],
  matchRating: 'Good', accumulatedCPoints: 0, accumulatedTPoints: 0, currentStageIndex: 0,
  completedStages: [], workSessionCount: 0, focusAllocation: { performance: 33, soundCapture: 34, layering: 33 }, bookingRoomId: 'studio-a',
});
const state = (): GameState => ({
  saveSeed: 7, money: 10000, currentDay: 2, currentYear: 2024, selectedEra: 'modern', currentEra: 'modern', eraStartYear: 2024, equipmentMultiplier: 1,
  reputation: 10, influence: 0, creativeCapital: 0, ownedEquipment: [clone(gear)], ownedUpgrades: [],
  equipmentPlacements: [{ equipmentId: gear.id, slotId: 'inventory' }], studioRooms: createDefaultStudioRooms(),
  playerData: { xp: 0, level: 1, xpToNextLevel: 180, perkPoints: 0, dailyWorkCapacity: 5, reputation: 10,
    attributes: { focusMastery: 1, technicalAptitude: 1, creativeIntuition: 1, businessAcumen: 1 }, skills: initializeSkillsPlayer() },
  studioSkills: {}, availableProjects: [], activeProject: project(), activeProjects: [], maxConcurrentProjects: 1,
  financials: { income: 0, expenses: 0, profit: 0, reports: [] }, hiredStaff: [], availableCandidates: [], lastSalaryDay: 0,
  notifications: [], bands: [], playerBands: [], availableSessionMusicians: [], activeOriginalTrack: null, researchedMods: [], activeMinigame: null,
});
const engineer = (): StaffMember => ({
  id: 'sam', name: 'Sam', role: 'Engineer', primaryStats: { creativity: 20, technical: 20, speed: 20 }, xpInRole: 0, levelInRole: 1,
  genreAffinity: null, energy: 100, mood: 100, salary: 25, status: 'Working', assignedProjectId: 'session-1', skills: initializeSkillsPlayer(),
});
const check = (name: string, fn: () => void) => { fn(); console.log(`PASS: ${name}`); };

check('complete box/drop/instance determinism and unique event identities', () => {
  for (const era of ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'] as const) {
    const a = generateBoxLoot(era, 4, 1234);
    assert.deepEqual(a, generateBoxLoot(era, 4, 1234));
    assert.equal(new Set(a.map(item => item.id)).size, 4);
    assert(a.every(item => item.equipment && item.condition >= 0 && item.condition <= 100));
    assert.deepEqual(generateBoxLoot(era), generateBoxLoot(era));
  }
  assert.notEqual(generateGear(template, { saveSeed: 7, day: 2, year: 2024, source: 'classifieds', index: 1 }).id, gear.id);
  assert.notDeepEqual(generateDailyClassifieds(state()), generateDailyClassifieds({ ...state(), currentDay: 3 }));
  for (let seed = 0; seed < 100; seed++) {
    const listings = generateDailyClassifieds({ ...state(), saveSeed: seed, currentYear: 1960 });
    assert(listings.length >= 3 && listings.length <= 4);
    assert(listings[0].askingPrice <= 3500, 'New studios need an affordable workhorse');
    assert(listings.every(listing => gearCatalogue(1960).some(item => item.id === listing.equipment.templateId)));
  }
});
check('classified stock persists through buy, reopen, migration and JSON reload; latest-state purchase is atomic', () => {
  const initial = refreshGearForDay(state());
  const before = clone(initial);
  const listing = initial.dailyClassifieds!.listings[0];
  const poor = { ...initial, money: listing.askingPrice - 1 };
  assert.equal(applyGearAction(poor, { type: 'buy', listingId: listing.id }).state, poor);
  const purchased = applyGearAction(initial, { type: 'buy', listingId: listing.id });
  assert(purchased.ok);
  assert.equal(purchased.state.money, initial.money - listing.askingPrice);
  assert.equal(purchased.state.financials.expenses, listing.askingPrice);
  assert.equal(applyGearAction(purchased.state, { type: 'buy', listingId: listing.id }).state, purchased.state);
  const reloaded = migrateAndInitializeGameState(clone(purchased.state));
  assert.deepEqual(reloaded.dailyClassifieds, purchased.state.dailyClassifieds);
  assert.equal(refreshGearForDay(reloaded), reloaded);
  assert.deepEqual(initial, before, 'Input was mutated');
  const next = refreshGearForDay({ ...reloaded, currentDay: 3 });
  assert.notDeepEqual(next.dailyClassifieds, reloaded.dailyClassifieds);
  assert.equal(applyGearAction(next, { type: 'buy', listingId: listing.id }).ok, false);
});
check('identical seeds and actions match across a maintenance reload', () => {
  const initial = migrateAndInitializeGameState(state());
  const run = (reload: boolean) => {
    let current = clone(initial);
    const listing = current.dailyClassifieds!.listings[0];
    current = applyGearAction(current, { type: 'buy', listingId: listing.id }).state;
    current = applyGearAction(current, { type: 'inspect', equipmentId: listing.equipment.id }).state;
    current = applyGearAction(current, { type: 'maintain', equipmentId: listing.equipment.id, kind: 'repair' }).state;
    if (reload) current = migrateAndInitializeGameState(clone(current));
    current = refreshGearForDay({ ...current, currentDay: 4 });
    const work = recordGearUse(current, project());
    return { ...work.state, activeProject: work.project };
  };
  assert.deepEqual(run(false), run(true));
  assert.deepEqual(run(true), run(true));
});
check('condition bands, clamping and legacy metadata preserve identity/mods/placements', () => {
  assert.deepEqual([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(conditionBand), ['Critical', 'Critical', 'Poor', 'Poor', 'Worn', 'Worn', 'Good', 'Good', 'Excellent', 'Excellent']);
  assert.equal(clampCondition(-20), 0); assert.equal(clampCondition(120), 100);
  const old = state(); delete old.saveSeed;
  old.ownedEquipment = [{ id: 'legacy-interface', name: 'Old interface', category: 'interface', price: 300, condition: 123, bonuses: { technicalBonus: 5 }, icon: 'x', description: 'Legacy', appliedModId: 'keep-me' }];
  old.equipmentPlacements = [{ equipmentId: 'legacy-interface', slotId: 'studio-a:rack:1' }];
  const migrated = migrateAndInitializeGameState(clone(old));
  assert.equal(migrated.ownedEquipment[0].id, 'legacy-interface');
  assert.equal(migrated.ownedEquipment[0].condition, 100);
  assert.equal(migrated.ownedEquipment[0].appliedModId, 'keep-me');
  assert.deepEqual(migrated.equipmentPlacements, old.equipmentPlacements);
  assert.deepEqual(migrateAndInitializeGameState(clone(migrated)), migrated);
});
check('service and repair quote, cost, downtime, completion and failure guards survive save/load', () => {
  for (const kind of ['service', 'repair'] as const) {
    const initial = state(); initial.ownedEquipment[0].condition = 35;
    const quote = maintenanceQuote(initial.ownedEquipment[0], kind);
    const insufficient = { ...initial, money: quote.cost - 1 };
    assert.equal(applyGearAction(insufficient, { type: 'maintain', equipmentId: gear.id, kind }).state, insufficient);
    const started = applyGearAction(initial, { type: 'maintain', equipmentId: gear.id, kind }).state;
    assert.equal(started.money, initial.money - quote.cost);
    assert.equal(started.ownedEquipment[0].condition, 35, 'Improvement must wait until completion');
    assert.equal(resolveSessionEquipment(started).length, 0);
    assert.equal(applyGearAction(started, { type: 'maintain', equipmentId: gear.id, kind }).state, started);
    assert.equal(applyGearAction(started, { type: 'sell', equipmentId: gear.id }).state, started);
    const loaded = migrateAndInitializeGameState(clone(started));
    assert.deepEqual(loaded.ownedEquipment[0].maintenance, started.ownedEquipment[0].maintenance);
    const completed = refreshGearForDay({ ...loaded, currentDay: initial.currentDay + quote.downtimeDays });
    assert.equal(completed.ownedEquipment[0].condition, quote.conditionAfter);
    assert.equal(completed.ownedEquipment[0].maintenance, null);
    assert.equal(resolveSessionEquipment(completed).length, 1);
    assert.equal(completed.ownedEquipment[0].quirks?.length, 0);
  }
  const initial = state(); initial.ownedEquipment[0].condition = 40;
  const started = applyGearAction(initial, { type: 'maintain', equipmentId: gear.id, kind: 'service', mode: 'hands-on' }).state;
  const id = started.ownedEquipment[0].maintenance!.id;
  const waiting = migrateAndInitializeGameState(clone({ ...started, currentDay: 20 }));
  assert.equal(waiting.ownedEquipment[0].maintenance?.status, 'calibrating');
  const won = applyGearAction(waiting, { type: 'calibrate', equipmentId: gear.id, jobId: id, success: true }).state;
  assert.equal(won.playerData.xp, 35); assert.equal(won.playerData.skills.tracking.xp, 35);
  assert.equal(won.ownedEquipment[0].maintenance?.readyDay, 21);
  assert.equal(applyGearAction(won, { type: 'calibrate', equipmentId: gear.id, jobId: id, success: true }).state, won);
  const failed = applyGearAction(started, { type: 'calibrate', equipmentId: gear.id, jobId: id, success: false }).state;
  assert.equal(refreshGearForDay({ ...failed, currentDay: 3 }).ownedEquipment[0].condition, 40);
});
check('bounded flipping, no repair arbitrage, no negative price, duplicate sell/claim impossible', () => {
  for (let seed = 0; seed < 100; seed++) {
    const stock = refreshGearForDay({ ...state(), saveSeed: seed });
    let profit = 0;
    for (const listing of stock.dailyClassifieds!.listings) {
      const bought = applyGearAction(stock, { type: 'buy', listingId: listing.id }).state;
      const sold = applyGearAction(bought, { type: 'sell', equipmentId: listing.equipment.id }).state;
      const gain = sold.money - stock.money;
      profit += Math.max(0, gain);
      assert(gain <= 20);
      assert.equal(applyGearAction(sold, { type: 'sell', equipmentId: listing.equipment.id }).state, sold);
      assert.equal(applyGearAction(sold, { type: 'buy', listingId: listing.id }).state, sold);
      for (let condition = 0; condition <= 100; condition++) {
        const item = { ...listing.equipment, condition };
        for (const kind of ['service', 'repair'] as const) for (const mode of ['outsource', 'hands-on'] as const) {
          const quote = maintenanceQuote(item, kind, mode);
          assert(resaleValue({ ...item, condition: quote.conditionAfter }) - resaleValue(item) < quote.cost);
          assert(quote.cost >= 0 && quote.conditionAfter >= 0 && quote.conditionAfter <= 100);
        }
      }
    }
    assert(profit <= 80);
  }
  const stock = refreshGearForDay(state()); stock.dailyClassifieds!.listings[0].askingPrice = -100;
  assert.equal(applyGearAction(stock, { type: 'buy', listingId: stock.dailyClassifieds!.listings[0].id }).state, stock);
  const crate = { id: 'earned-1', era: 'modern', source: 'yard_sale' as const, tier: 'standard' as const, generatedDay: 2, generatedYear: 2024, generatedPriceMultiplier: 1 };
  const initial = { ...state(), pendingCrates: [crate] };
  assert.deepEqual(generateCrateGear(initial, crate), generateCrateGear({ ...initial, currentDay: 30, currentYear: 2030, equipmentMultiplier: 3 }, crate));
  for (const disposition of ['keep', 'sell'] as const) {
    const claimed = applyGearAction(initial, { type: 'claim', crateId: crate.id, disposition }).state;
    assert.equal(claimed.pendingCrates!.length, 0);
    assert.equal(applyGearAction(claimed, { type: 'claim', crateId: crate.id, disposition }).state, claimed);
  }
});
check('real use wears only available room gear; familiarity lowers wear; healthy gear never faults', () => {
  const initial = state(); initial.hiredStaff = [engineer()]; initial.ownedEquipment[0].condition = 100;
  initial.ownedEquipment[0].quirks = [];
  let work = { state: initial, project: initial.activeProject! };
  for (let session = 0; session < 5; session++) work = recordGearUse(work.state, work.project);
  assert.equal(work.state.hiredStaff[0].equipmentFamiliarity?.[gear.id], 5);
  assert(work.state.ownedEquipment[0].condition < 100);
  assert(!work.state.ownedEquipment[0].fault);
  assert(wearPerSession(gear, 5) < wearPerSession(gear));
  const serviced = applyGearAction(clone(initial), { type: 'maintain', equipmentId: gear.id, kind: 'repair' }).state;
  // Full condition gear is a no-op, so explicitly put this test item on the bench.
  serviced.ownedEquipment[0] = { ...serviced.ownedEquipment[0], maintenance: { id: 'bench', kind: 'service', mode: 'outsource', status: 'scheduled', startedDay: 2, readyDay: 3, conditionAfter: 100, costPaid: 10, clearsQuirks: true } };
  assert.deepEqual(recordGearUse(serviced, project()).state.ownedEquipment, serviced.ownedEquipment);
  const synergy = { ...STUDIO_SYNERGIES[0], criteria: { requiredEquipmentIds: [gear.templateId] } };
  assert.equal(evaluateProjectSynergies(project(), initial, [synergy]).length, 1, 'Instances retain their template synergy');
  assert.equal(evaluateProjectSynergies(project(), serviced, [synergy]).length, 0, 'Bench gear cannot grant synergies');
  const seated = { ...state(), equipmentPlacements: [{ equipmentId: gear.id, slotId: 'other-room:rack:1' }] };
  assert.deepEqual(recordGearUse(seated, project()).state.ownedEquipment, seated.ownedEquipment);
  const plain = { ...gear, traits: [], quirks: [] };
  assert.equal(getEquipmentBonuses([{ ...plain, traits: [{ id: 'sweet', name: 'Sweet', description: '', qualityBonus: 2 }] }]).quality, getEquipmentBonuses([plain]).quality + 2);
  assert(getEquipmentBonuses(Array(10).fill({ ...plain, traits: [{ id: 'sweet', name: 'Sweet', description: '', qualityBonus: 2 }] })).quality <= getEquipmentBonuses(Array(10).fill(plain)).quality + 3);
});
check('fault family is deterministic, recoverable and disclosed; fractional use cannot reroll it', () => {
  let found = false;
  for (let seed = 0; seed < 100; seed++) {
    const initial = { ...state(), saveSeed: seed }; initial.ownedEquipment[0].condition = 10; initial.ownedEquipment[0].quirks = [];
    const direct = recordGearUse(initial, project());
    const half = recordGearUse(initial, project(), 0.5);
    const split = recordGearUse(clone(half.state), half.project, 0.5);
    assert.deepEqual(direct.state.ownedEquipment, split.state.ownedEquipment);
    assert.deepEqual(direct, recordGearUse(clone(initial), project()));
    if (!direct.state.ownedEquipment[0].fault) continue;
    found = true;
    assert(gearForecastReasons(direct.state).some(reason => reason.includes('Noisy contact')));
    assert(direct.project.gearNotes!.some(note => note.includes('No permanent damage')));
    assert.equal(resolveSessionEquipment(direct.state).length, 0);
    assert.equal(resolveSessionEquipment(refreshGearForDay({ ...direct.state, currentDay: 3 })).length, 1);
    break;
  }
  assert(found, 'Expected at least one deterministic fault seed');
});
check('desktop-idle, multi-project, report facts and idempotent settlement use the same gear state', () => {
  const initial = state(); initial.ownedEquipment[0].condition = 100; initial.ownedEquipment[0].quirks = [];
  const passive = advanceSimulation(initial, PASSIVE_WORK_SESSION_MS).state;
  assert(passive.ownedEquipment[0].condition < initial.ownedEquipment[0].condition);
  assert.equal(passive.ownedEquipment[0].usageSessions, 1);
  const idleBench = applyGearAction({ ...initial, ownedEquipment: [{ ...initial.ownedEquipment[0], condition: 60 }] }, { type: 'maintain', equipmentId: gear.id, kind: 'service' }).state;
  assert.deepEqual(advanceSimulation(idleBench, PASSIVE_WORK_SESSION_MS).state.ownedEquipment, idleBench.ownedEquipment);
  const service = new ProjectService({ ...initial, activeProject: null, activeProjects: [project()], hiredStaff: [engineer()] });
  service.updateProjects();
  assert(service.getGameState().ownedEquipment[0].condition < 100);
  assert.equal(service.getGameState().hiredStaff[0].equipmentFamiliarity?.[gear.id], 1);
  const automated: GameState = { ...clone(initial), activeProject: null, activeProjects: [project()], hiredStaff: [engineer()],
    automation: { enabled: true, mode: 'basic', efficiency: {}, settings: { priorityMode: 'balanced', minStaffPerProject: 1,
      maxStaffPerProject: 1, workloadDistribution: 'even', pauseOnIssues: false, notifyOnMilestones: false } } };
  new ProjectManager(automated).executeAutomatedWork();
  assert(automated.ownedEquipment[0].condition < 100);
  assert(automated.ownedEquipment[0].usageSessions! > 0);
  const report = generateProjectReview(passive.activeProject!, { type: 'player', id: 'player', name: 'Player' }, 80, passive.playerData, []);
  assert(report.reviewSnippet.includes('Used '));
  const settlement = { ...report, overallQualityScore: 95, moneyGained: 500 } satisfies ProjectReport;
  const paid = applyReportToState(passive, settlement);
  assert.equal(applyReportToState(paid, settlement), paid);
  assert.equal(paid.money, passive.money + 500);
  let normal = 0, moonshot = 0;
  for (let seed = 0; seed < 1000; seed++) {
    normal += awardProjectCrate({ ...initial, saveSeed: seed }, project(), 95).pendingCrates?.length ?? 0;
    moonshot += awardProjectCrate({ ...initial, saveSeed: seed }, { ...project(), stake: 'moonshot' }, 95).pendingCrates?.length ?? 0;
  }
  assert(normal > 100 && normal < 200); assert(moonshot > 330 && moonshot < 470);
});

console.log('PASS: deterministic used gear vertical slice');
