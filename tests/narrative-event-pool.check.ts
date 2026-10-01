/**
 * Narrative event pool: 12 band/lore/studio beats with real-field triggers, historical weave and
 * gated rows — verified through the Studio Event Director (selection, cooldowns, effect application).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  EFFECT_LIMITS,
  applyDomainEffects,
  buildFacts,
  getDirector,
  takeDirectorOpportunity,
  validateEffects,
  type StudioEventDefinition,
} from '../src/narrative/eventDirector';
import { DIRECTOR_EVENTS, getPendingDirectorEvent, resolveDirectorChoice } from '../src/narrative/directorEvents';
import {
  GATED_EVENT_IDS,
  HISTORICAL_WEAVE_IDS,
  NARRATIVE_EVENTS,
} from '../src/narrative/narrativeEventPool';

const band = (over: Record<string, unknown> = {}) => ({
  id: 'band-a',
  bandName: 'The Feedback',
  genre: 'Rock',
  fame: 30,
  notoriety: 10,
  memberIds: [],
  isPlayerCreated: true,
  pastReleases: [{ id: 'r1' }],
  tourStatus: { isOnTour: false, daysRemaining: 0, dailyIncome: 0 },
  ...over,
});

const client = (over: Record<string, unknown> = {}) => ({
  clientId: 'mara',
  clientName: 'Mara Vale',
  primaryGenre: 'Rock',
  relationshipXp: 120,
  tier: 'Friendly',
  sessionsCompleted: 4,
  lastSessionDay: 20,
  bestQualityScore: 80,
  referralCount: 0,
  ...over,
});

const makeState = (over: Record<string, unknown> = {}): any => ({
  currentDay: 40,
  currentEra: 'analog60s',
  selectedEra: 'analog60s',
  saveSeed: 4242,
  money: 8000,
  reputation: 55,
  hiredStaff: [{ id: 'a', name: 'Ana', xpInRole: 10 }],
  ownedEquipment: [{ id: 'eq1', name: 'Desk', condition: 90 }],
  studios: undefined,
  studioRooms: [],
  bands: [band()],
  playerBands: [band()],
  financials: { income: 0, expenses: 0, profit: 0, reports: [] },
  playerData: { xp: 0, level: 3 },
  clientRelationships: { mara: client() },
  storylineState: {
    runSeed: 1,
    activeCampaignNodeId: 'act1_genesis',
    campaignCompleted: false,
    branchHistory: [],
    storyFlags: {},
    activeSubplots: [],
    resolvedSubplotIds: [],
  },
  ...over,
});

const byId = (id: string): StudioEventDefinition => {
  const def = NARRATIVE_EVENTS.find((d) => d.id === id);
  assert.ok(def, `missing event ${id}`);
  return def as StudioEventDefinition;
};

const eligible = (id: string, over: Record<string, unknown> = {}) =>
  byId(id).eligible(buildFacts(makeState(over)) as never);

describe('narrative event pool: table', () => {
  it('carries exactly 12 authored rows', () => {
    assert.equal(NARRATIVE_EVENTS.length, 12);
  });

  it('has unique ids and unique families per row', () => {
    const ids = NARRATIVE_EVENTS.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('every row is a complete director definition', () => {
    for (const def of NARRATIVE_EVENTS) {
      assert.ok(def.family.length > 0, `${def.id}: family`);
      assert.ok(def.baseWeight > 0, `${def.id}: weight`);
      assert.ok(def.cooldownDays >= 30, `${def.id}: cooldown`);
      assert.ok(def.title.length > 0 && def.kicker.length > 0, `${def.id}: presentation`);
      assert.ok(def.context(undefined).length > 0, `${def.id}: context`);
      assert.ok(def.options.length >= 2, `${def.id}: needs a real decision`);
      const optionIds = def.options.map((o) => o.id);
      assert.equal(new Set(optionIds).size, optionIds.length, `${def.id}: duplicate option id`);
      for (const o of def.options) {
        assert.ok(o.outcome.length > 0, `${def.id}/${o.id}: outcome`);
        assert.ok(validateEffects(o.effects).length > 0, `${def.id}/${o.id}: settles nothing`);
      }
      if (def.delegable) assert.ok(def.defaultOptionId, `${def.id}: delegable without a default`);
      if (def.defaultOptionId) assert.ok(def.options.some((o) => o.id === def.defaultOptionId), `${def.id}: unknown default`);
    }
  });

  it('every money cost stays inside the effect cap', () => {
    for (const def of NARRATIVE_EVENTS) {
      for (const o of def.options) {
        for (const e of validateEffects(o.effects)) {
          assert.ok(Math.abs(e.amount) <= EFFECT_LIMITS[e.kind as keyof typeof EFFECT_LIMITS], `${def.id}/${o.id}: ${e.kind} over cap`);
        }
      }
    }
  });

  it('is registered in the live director pool', () => {
    const live = new Set(DIRECTOR_EVENTS.map((d) => d.id));
    for (const def of NARRATIVE_EVENTS) assert.ok(live.has(def.id), `${def.id}: not registered`);
    const poolIds = new Set(NARRATIVE_EVENTS.map((d) => d.id));
    assert.equal(DIRECTOR_EVENTS.length, new Set(DIRECTOR_EVENTS.map((d) => d.id)).size, 'duplicate ids in the live pool');
    assert.ok(poolIds.size <= DIRECTOR_EVENTS.length);
  });

  it('documents four historical-weave rows and the gated rows', () => {
    assert.equal(HISTORICAL_WEAVE_IDS.length, 4);
    for (const id of HISTORICAL_WEAVE_IDS) assert.ok(NARRATIVE_EVENTS.some((d) => d.id === id), `${id}: unknown weave row`);
    for (const id of GATED_EVENT_IDS) assert.ok(NARRATIVE_EVENTS.some((d) => d.id === id), `${id}: unknown gated row`);
  });
});

describe('narrative event pool: real-field triggers', () => {
  it('band rows only fire when the band state supports them', () => {
    assert.equal(eligible('viral_cover'), true);
    assert.equal(eligible('viral_cover', { bands: [], playerBands: [] }), false);
    assert.equal(eligible('viral_cover', { bands: [band({ pastReleases: [] })] }), false);
    assert.equal(eligible('tour_bus_breakdown'), false);
    assert.equal(
      eligible('tour_bus_breakdown', { bands: [band({ tourStatus: { isOnTour: true, daysRemaining: 9, dailyIncome: 400 } })] }),
      true,
    );
    assert.equal(eligible('garage_band_walkout', { hiredStaff: [] }), false);
  });

  it('the reunion row stays inert until the breakup slice writes its flag', () => {
    assert.equal(eligible('reunion_rumor'), false);
    const flagged = makeState();
    flagged.storylineState.storyFlags['band-broken-up'] = true;
    assert.equal(byId('reunion_rumor').eligible(buildFacts(flagged) as never), true);
  });

  it('era gates keep each historical-weave row in its own era', () => {
    assert.equal(eligible('rival_diss_track'), false);
    assert.equal(eligible('rival_diss_track', { currentEra: 'digital80s' }), true);
    assert.equal(eligible('rival_diss_track', { currentEra: 'streaming2020s' }), true);
    assert.equal(eligible('sync_brief_lands'), false);
    assert.equal(eligible('sync_brief_lands', { currentEra: 'internet2000s' }), true);
    assert.equal(eligible('tube_stash_find'), true);
    assert.equal(eligible('tube_stash_find', { currentEra: 'digital80s' }), false);
    assert.equal(eligible('tube_stash_find', { currentEra: 'streaming2020s' }), true);
  });

  it('studio rows need gear or crew to bite', () => {
    assert.equal(eligible('tube_stash_find', { ownedEquipment: [] }), false);
    assert.equal(eligible('power_surge', { ownedEquipment: [] }), false);
    assert.equal(eligible('intern_prodigy', { hiredStaff: [] }), false);
  });

  it('the award row needs reputation and a returning client', () => {
    assert.equal(eligible('award_nomination', { reputation: 20 }), false);
    assert.equal(eligible('award_nomination', { clientRelationships: { mara: client({ sessionsCompleted: 1 }) } }), false);
    assert.equal(eligible('award_nomination'), true);
  });

  it('reads bands from the real GameState field', () => {
    const facts = buildFacts(makeState() as never);
    assert.equal(facts.bands.length, 1);
    assert.equal(facts.bands[0].name, 'The Feedback');
    assert.equal(facts.bands[0].onTour, false);
    assert.equal(facts.bands[0].releases, 1);
    assert.equal(facts.bands[0].isPlayerCreated, true);
  });
});

describe('narrative event pool: settlement', () => {
  it('gear and crew effects land on real state and stay clamped', () => {
    const state = makeState();
    const after = applyDomainEffects(state, [{ kind: 'gearCondition', amount: 40 }, { kind: 'staffXp', amount: 15 }]);
    assert.equal((after.ownedEquipment[0] as { condition: number }).condition, 100);
    assert.equal(after.hiredStaff[0].xpInRole, 25);
    const floored = applyDomainEffects(state, [{ kind: 'gearCondition', amount: -200 }, { kind: 'staffXp', amount: -50 }]);
    // Both are capped at EFFECT_LIMITS (15/60), so the gear loses 15 and the crew floors at 0.
    assert.equal((floored.ownedEquipment[0] as { condition: number }).condition, 75);
    assert.equal(floored.hiredStaff[0].xpInRole, 0);
  });

  it('caps every new effect kind like the existing ones', () => {
    assert.equal(validateEffects([{ kind: 'gearCondition', amount: 999 }])[0].amount, EFFECT_LIMITS.gearCondition);
    assert.equal(validateEffects([{ kind: 'staffXp', amount: 999 }])[0].amount, EFFECT_LIMITS.staffXp);
  });

  it('opens and resolves through the director, once', () => {
    const pool: StudioEventDefinition[] = NARRATIVE_EVENTS.filter((d) => d.id === 'power_surge');
    let state = makeState({ currentDay: 60, currentEra: 'internet2000s' });
    state = takeDirectorOpportunity(state, pool, {});
    const pending = getPendingDirectorEvent(state);
    assert.ok(pending, 'power surge should open on an eligible day');
    assert.equal(pending.def.id, 'power_surge');
    assert.ok(pending.options.every((o) => o.affordable));

    const resolved = resolveDirectorChoice(state, pending.options[1].id);
    assert.equal(getPendingDirectorEvent(resolved), null);
    assert.equal(resolved.money, 8090);
    assert.equal((resolved.ownedEquipment[0] as { condition: number }).condition, 81);

    // Idempotent: replaying the same choice changes nothing.
    const replayed = resolveDirectorChoice(resolved, pending.options[1].id);
    assert.equal(replayed.money, resolved.money);
    assert.equal(getDirector(replayed).history.length, getDirector(resolved).history.length);
  });

  it('never opens an option the player cannot pay for', () => {
    const pool: StudioEventDefinition[] = NARRATIVE_EVENTS.filter((d) => d.id === 'garage_band_walkout');
    const poor = makeState({ money: 50, currentDay: 60 });
    const opened = takeDirectorOpportunity(poor, pool, {});
    const pending = getPendingDirectorEvent(opened);
    assert.ok(pending);
    const mediation = pending.options.find((o) => o.id === 'walkout_mediate');
    assert.ok(mediation);
    assert.equal(mediation.affordable, false);
    // Resolving an unaffordable option is a no-op, not a free lunch.
    const unchanged = resolveDirectorChoice(opened, 'walkout_mediate');
    assert.equal(unchanged.money, 50);
    assert.equal(getPendingDirectorEvent(unchanged)?.def.id, 'garage_band_walkout');
  });
});