/** Gear upkeep chain (#62): narrative downstream of maintenance facts, targeted, bounded, never destructive. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GEAR_UPKEEP_EVENTS } from '../src/narrative/gearUpkeep';
import { DIRECTOR_EVENTS } from '../src/narrative/directorEvents';
import {
  EFFECT_LIMITS, applyDomainEffects, getDirector, hasMemory, recordSelection, resolveDirectorOption, resolveEligibleEvents, validateEffects,
} from '../src/narrative/eventDirector';

const gear = (id: string, condition: number, over: Record<string, unknown> = {}) => ({ id, name: `Gear ${id}`, category: 'interface', condition, ...over });
const state = (items: any[], over: Record<string, unknown> = {}): any => ({
  currentDay: 40, currentEra: 'analog60s', selectedEra: 'analog60s', saveSeed: 9, money: 500, reputation: 30,
  hiredStaff: [], ownedEquipment: items, studioRooms: [], bands: [], clientRelationships: {},
  financials: { income: 0, expenses: 0, profit: 0, reports: [] }, playerData: { xp: 0, level: 3 },
  storylineState: { runSeed: 1, activeCampaignNodeId: 'a', campaignCompleted: false, branchHistory: [], storyFlags: {}, activeSubplots: [], resolvedSubplotIds: [] },
  ...over,
});
const ids = (s: any) => resolveEligibleEvents(s, GEAR_UPKEEP_EVENTS).map((e) => e.def.id);
const open = (s: any, eventId: string) => {
  const e = resolveEligibleEvents(s, GEAR_UPKEEP_EVENTS).find((x) => x.def.id === eventId)!;
  const rec = recordSelection(s, { eventId, family: e.def.family, subjectId: e.subject?.id });
  const d = getDirector(rec);
  return { ...rec, storylineState: { ...rec.storylineState, director: { ...d, pending: { eventId, openedDay: s.currentDay, subject: e.subject } } } };
};

describe('gear upkeep chain', () => {
  it('is registered, capped and has a free delegable default', () => {
    assert.equal(GEAR_UPKEEP_EVENTS.length, 3);
    const live = new Set(DIRECTOR_EVENTS.map((d) => d.id));
    for (const e of GEAR_UPKEEP_EVENTS) {
      assert.ok(live.has(e.id));
      assert.equal(e.maxOccurrences, 1);
      const def = e.options.find((o) => o.id === e.defaultOptionId)!;
      assert.ok(def && !def.effects.some((x) => x.kind === 'money' && x.amount < 0), `${e.id} default is free`);
      for (const o of e.options) for (const x of validateEffects(o.effects)) assert.ok(Math.abs(x.amount) <= EFFECT_LIMITS[x.kind as keyof typeof EFFECT_LIMITS]);
    }
  });

  it('opens only for gear that is truly in trouble', () => {
    assert.deepEqual(ids(state([gear('a', 90)])), []);
    assert.deepEqual(ids(state([gear('a', 35)])), ['gear_trouble']);
    assert.deepEqual(ids(state([gear('a', 90, { fault: { family: 'contact-noise', startedDay: 40, readyDay: 41, milestone: 2 } })])), ['gear_trouble']);
    assert.deepEqual(ids(state([gear('a', 5, { category: 'monitor' })])), [], 'gear outside the maintenance slice is ignored');
  });

  it('picks the worst piece as the subject', () => {
    const e = resolveEligibleEvents(state([gear('a', 38), gear('b', 12), gear('c', 90)]), GEAR_UPKEEP_EVENTS)[0];
    assert.equal(e.subject?.id, 'b');
  });

  it('service option fixes only that piece and costs money', () => {
    const s = open(state([gear('a', 30), gear('b', 70)]), 'gear_trouble');
    const next = resolveDirectorOption(s, GEAR_UPKEEP_EVENTS, 'gear_trouble_a');
    assert.equal(next.ownedEquipment.find((x: any) => x.id === 'a').condition, 42);
    assert.equal(next.ownedEquipment.find((x: any) => x.id === 'b').condition, 70, 'other gear untouched');
    assert.equal(next.money, 440);
    assert.ok(hasMemory(next, 'gear', 'serviced-early', 'a'));
  });

  it('a gear-wide effect still applies to everything when the subject is not gear', () => {
    const s = state([gear('a', 50), gear('b', 50)]);
    const next = applyDomainEffects(s, [{ kind: 'gearCondition', amount: -4 }], 'someone|client');
    assert.deepEqual(next.ownedEquipment.map((x: any) => x.condition), [46, 46]);
  });

  it('the free option writes a memory and later beats follow the chosen path', () => {
    const base = state([gear('a', 30)]);
    const rough = resolveDirectorOption(open(base, 'gear_trouble'), GEAR_UPKEEP_EVENTS, 'gear_trouble_b');
    assert.ok(hasMemory(rough, 'gear', 'run-rough', 'a'));
    const later = { ...rough, currentDay: 60 };
    assert.ok(ids(later).includes('gear_trouble_fallout'));
    assert.ok(!ids(later).includes('gear_trouble_payoff'));

    const fixed = resolveDirectorOption(open(base, 'gear_trouble'), GEAR_UPKEEP_EVENTS, 'gear_trouble_a');
    const later2 = { ...fixed, currentDay: 60 };
    assert.ok(ids(later2).includes('gear_trouble_payoff'));
    assert.ok(!ids(later2).includes('gear_trouble_fallout'));
  });

  it('fallout stops once the piece is healthy again', () => {
    const rough = resolveDirectorOption(open(state([gear('a', 30)]), 'gear_trouble'), GEAR_UPKEEP_EVENTS, 'gear_trouble_b');
    const healed = { ...rough, currentDay: 60, ownedEquipment: [gear('a', 85)] };
    assert.ok(!ids(healed).includes('gear_trouble_fallout'));
  });

  it('nothing is destroyed by any option', () => {
    for (const e of GEAR_UPKEEP_EVENTS) for (const o of e.options) {
      assert.ok(!o.effects.some((x) => x.kind === 'gearCondition' && x.amount < 0), `${o.id} never lowers condition`);
    }
  });
});
