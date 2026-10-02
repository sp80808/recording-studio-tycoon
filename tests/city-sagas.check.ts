/** City sagas: 18 chained director events, one 3-beat chain per city, gated on the home city and memories. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CITIES } from '../src/rpg/cities';
import { CITY_SAGA_EVENTS, SAGA_CITY_BY_EVENT } from '../src/narrative/citySagas';
import { cityForEvent } from '../src/narrative/cityEventCity';
import { DIRECTOR_EVENTS, resolveDirectorChoice } from '../src/narrative/directorEvents';
import { EFFECT_LIMITS, getDirector, takeDirectorOpportunity, validateEffects } from '../src/narrative/eventDirector';

const state = (cityId?: string, over: Record<string, unknown> = {}): any => ({
  currentDay: 40, currentEra: 'analog60s', selectedEra: 'analog60s', saveSeed: 7, money: 9000, reputation: 40, cityId,
  hiredStaff: [], ownedEquipment: [{ id: 'e', name: 'Desk', condition: 90 }], studioRooms: [], bands: [], playerBands: [],
  financials: { income: 0, expenses: 0, profit: 0, reports: [] }, playerData: { xp: 0, level: 3 }, clientRelationships: {},
  storylineState: { runSeed: 1, activeCampaignNodeId: 'a', campaignCompleted: false, branchHistory: [], storyFlags: {}, activeSubplots: [], resolvedSubplotIds: [] },
  ...over,
});

describe('city sagas', () => {
  it('has 18 valid, registered, capped events (3 per city)', () => {
    assert.equal(CITY_SAGA_EVENTS.length, 18);
    const live = new Set(DIRECTOR_EVENTS.map((d) => d.id));
    for (const e of CITY_SAGA_EVENTS) {
      assert.ok(live.has(e.id));
      assert.equal(e.maxOccurrences, 1);
      assert.ok(e.options.some((o) => o.id === e.defaultOptionId));
      for (const o of e.options) {
        assert.ok(o.memories?.length, `${o.id} writes a memory`);
        for (const x of validateEffects(o.effects)) assert.ok(Math.abs(x.amount) <= EFFECT_LIMITS[x.kind as keyof typeof EFFECT_LIMITS]);
      }
    }
    for (const c of CITIES) assert.equal(CITY_SAGA_EVENTS.filter((e) => SAGA_CITY_BY_EVENT[e.id] === c.id).length, 3, c.id);
  });

  it('maps events to scene cities', () => {
    assert.equal(cityForEvent('saga_tokyo_2'), 'tokyo');
    assert.equal(cityForEvent('tokyo_karaoke_night'), 'tokyo');
    assert.equal(cityForEvent('la_heatwave_blackout'), 'los-angeles');
    assert.equal(cityForEvent('studio_press_inquiry'), undefined);
  });

  it('plays each saga in order, only in its own city', () => {
    for (const c of CITIES) {
      const defs = CITY_SAGA_EVENTS.filter((e) => SAGA_CITY_BY_EVENT[e.id] === c.id);
      const other = CITIES.find((x) => x.id !== c.id)!.id;
      assert.equal(getDirector(takeDirectorOpportunity(state(other), defs)).pending, undefined, `${c.id} leaks`);
      assert.equal(getDirector(takeDirectorOpportunity(state(undefined), defs)).pending, undefined, 'legacy save');
      let s = state(c.id);
      for (let n = 1; n <= 3; n++) {
        s = takeDirectorOpportunity({ ...s, currentDay: s.currentDay + 60 }, defs);
        assert.equal(getDirector(s).pending?.eventId, defs[n - 1].id, `${c.id} beat ${n}`);
        s = resolveDirectorChoice(s, defs[n - 1].options[0].id);
      }
      const after = takeDirectorOpportunity({ ...s, currentDay: s.currentDay + 200 }, defs);
      assert.equal(getDirector(after).pending, undefined, `${c.id} saga repeats`);
    }
  });

  it('needs reputation to open', () => {
    const defs = CITY_SAGA_EVENTS.filter((e) => SAGA_CITY_BY_EVENT[e.id] === 'rio');
    assert.equal(getDirector(takeDirectorOpportunity(state('rio', { reputation: 2 }), defs)).pending, undefined);
  });
});
