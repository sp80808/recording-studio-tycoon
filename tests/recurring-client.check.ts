/** Recurring-client saga (Wren Calloway): four era-gated beats chained by memories. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RECURRING_CLIENT_EVENTS } from '../src/narrative/recurringClient';
import { DIRECTOR_EVENTS, resolveDirectorChoice } from '../src/narrative/directorEvents';
import { EFFECT_LIMITS, getDirector, takeDirectorOpportunity, validateEffects } from '../src/narrative/eventDirector';

const state = (era: string, over: Record<string, unknown> = {}): any => ({
  currentDay: 40, currentEra: era, selectedEra: era, saveSeed: 7, money: 9000, reputation: 40, cityId: 'london',
  hiredStaff: [], ownedEquipment: [{ id: 'e', name: 'Desk', condition: 90 }], studioRooms: [], bands: [], playerBands: [],
  financials: { income: 0, expenses: 0, profit: 0, reports: [] }, playerData: { xp: 0, level: 3 }, clientRelationships: {},
  storylineState: { runSeed: 1, activeCampaignNodeId: 'a', campaignCompleted: false, branchHistory: [], storyFlags: {}, activeSubplots: [], resolvedSubplotIds: [] },
  ...over,
});
const ERAS = ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'];

describe('recurring client saga', () => {
  it('has four valid, registered, capped beats', () => {
    assert.equal(RECURRING_CLIENT_EVENTS.length, 4);
    const live = new Set(DIRECTOR_EVENTS.map((d) => d.id));
    for (const e of RECURRING_CLIENT_EVENTS) {
      assert.ok(live.has(e.id));
      assert.equal(e.maxOccurrences, 1);
      assert.ok(e.options.some((o) => o.id === e.defaultOptionId));
      for (const o of e.options) {
        assert.ok(o.memories && o.memories.length >= 2, `${o.id} writes the chain memory and a choice memory`);
        for (const x of validateEffects(o.effects)) assert.ok(Math.abs(x.amount) <= EFFECT_LIMITS[x.kind as keyof typeof EFFECT_LIMITS]);
      }
    }
  });

  it('plays across all four eras in order and never repeats', () => {
    let s = state(ERAS[0]);
    for (let n = 1; n <= 4; n++) {
      s = { ...s, currentEra: ERAS[n - 1], selectedEra: ERAS[n - 1], currentDay: s.currentDay + 400 };
      s = takeDirectorOpportunity(s, RECURRING_CLIENT_EVENTS);
      assert.equal(getDirector(s).pending?.eventId, `wren_${n}`, `beat ${n}`);
      s = resolveDirectorChoice(s, RECURRING_CLIENT_EVENTS[n - 1].options[n % 2].id);
    }
    const after = takeDirectorOpportunity({ ...s, currentDay: s.currentDay + 400 }, RECURRING_CLIENT_EVENTS);
    assert.equal(getDirector(after).pending, undefined);
  });

  it('lets a career that starts in a later era join the chain, moving only forward', () => {
    let s = state('digital80s');
    s = takeDirectorOpportunity(s, RECURRING_CLIENT_EVENTS);
    assert.ok(['wren_1', 'wren_2'].includes(getDirector(s).pending!.eventId), 'an 80s start can enter');
    s = resolveDirectorChoice(s, getDirector(s).pending!.options?.[0]?.id ?? RECURRING_CLIENT_EVENTS[1].options[0].id);
    for (const era of ['internet2000s', 'streaming2020s']) {
      s = { ...s, currentEra: era, selectedEra: era, currentDay: s.currentDay + 400 };
      s = takeDirectorOpportunity(s, RECURRING_CLIENT_EVENTS);
      const id = getDirector(s).pending?.eventId;
      assert.ok(id, `${era} offers a beat`);
      const def = RECURRING_CLIENT_EVENTS.find((e) => e.id === id)!;
      s = resolveDirectorChoice(s, def.options[0].id);
    }
    const seen = getDirector(s).history.map((h) => h.eventId);
    const order = seen.map((x) => Number(x.split('_')[1]));
    assert.deepEqual([...order].sort((a, b) => a - b), order, 'beats never run backwards');
  });

  it('waits for its era and for the earlier beats', () => {
    assert.equal(getDirector(takeDirectorOpportunity(state('analog60s', { reputation: 3 }), RECURRING_CLIENT_EVENTS)).pending, undefined);
    assert.equal(getDirector(takeDirectorOpportunity(state('analog60s', { reputation: 3 }), RECURRING_CLIENT_EVENTS)).pending, undefined, 'beat 1 needs reputation');
    assert.equal(getDirector(takeDirectorOpportunity(state('analog60s'), RECURRING_CLIENT_EVENTS)).pending?.eventId, 'wren_1');
  });
});
