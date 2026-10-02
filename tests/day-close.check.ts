import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DAY_CLOSE_REPEAT_DAYS, MEMORY_LINES, getDayCloseBeat, pickDayCloseBeat, withDayCloseBeat } from '../src/narrative/dayClose';
import { addMemory, getDirector } from '../src/narrative/eventDirector';
import { DIRECTOR_EVENTS } from '../src/narrative/directorEvents';
import { EMERGENT_SUBPLOTS } from '../src/narrative/branchingStorylineEngine';

const makeState = (over: any = {}): any => ({
  currentDay: 10,
  saveSeed: 99,
  money: 1000,
  reputation: 20,
  hiredStaff: [],
  storylineState: { runSeed: 1, activeCampaignNodeId: 'x', campaignCompleted: false, branchHistory: [], activeSubplots: [], resolvedSubplotIds: [], storyFlags: {} },
  ...over,
});
const advance = (s: any, money = 0, rep = 0) => ({ ...s, currentDay: s.currentDay + 1, money: s.money + money, reputation: s.reputation + rep });

describe('end-of-day beat', () => {
  it('is deterministic and stored, so a reload never re-rolls', () => {
    const prev = makeState();
    const a = withDayCloseBeat(prev, advance(prev, 300, 2));
    const b = withDayCloseBeat(prev, JSON.parse(JSON.stringify(advance(prev, 300, 2))));
    assert.deepEqual(getDayCloseBeat(a), getDayCloseBeat(b));
    assert.ok(getDayCloseBeat(a));
    const again = withDayCloseBeat(prev, a);
    assert.strictEqual(again, a, 'already has a beat for this day');
  });

  it('belongs to one day only', () => {
    const prev = makeState();
    const a = withDayCloseBeat(prev, advance(prev, 300));
    assert.ok(getDayCloseBeat(a));
    assert.equal(getDayCloseBeat({ ...a, currentDay: a.currentDay + 1 }), null);
  });

  it('reads the day: busy, lean and quiet days use different lines', () => {
    const prev = makeState();
    const busy = pickDayCloseBeat(prev, advance(prev, 500))!;
    const lean = pickDayCloseBeat(prev, advance(prev, -500))!;
    assert.equal(busy.lineId, 'fact-busy');
    assert.equal(lean.lineId, 'fact-lean');
    assert.equal(busy.tone, 'good');
    assert.equal(lean.tone, 'warn');
  });

  it('recalls a recent memory, preferring it over plain facts when possible', () => {
    const prev = makeState();
    let next: any = advance(prev, 300);
    next = addMemory(next, { scope: 'client', entityId: 'mara', key: 'rush-success', sourceEventId: 't' });
    const ids = new Set<string>();
    for (let seed = 1; seed < 60; seed++) ids.add(pickDayCloseBeat(prev, { ...next, saveSeed: seed })!.lineId);
    assert.ok(ids.has('mem-rush-success'), 'the remembered beat comes back');
    assert.ok(ids.has('fact-busy') || ids.has('fact-quiet'), 'and facts still appear');
  });

  it('old memories are not recalled', () => {
    const prev = makeState();
    let next: any = addMemory(advance(prev), { scope: 'studio', key: 'scout-toured', sourceEventId: 't' });
    next = { ...next, currentDay: next.currentDay + 20 };
    for (let seed = 1; seed < 40; seed++) assert.notEqual(pickDayCloseBeat(prev, { ...next, saveSeed: seed })!.lineId, 'mem-scout-toured');
  });

  it('does not repeat a line inside the cooldown', () => {
    let s: any = makeState();
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const next = advance(s, 300, 2);
      s = withDayCloseBeat(s, next);
      seen.push(getDayCloseBeat(s)!.lineId);
    }
    assert.equal(new Set(seen).size, seen.length, `no repeats across consecutive days: ${seen}`);
    assert.ok(getDirector(s).dayCloseLog!.length === 3);
    void DAY_CLOSE_REPEAT_DAYS;
  });

  it('never blocks: with no storyline it leaves the state untouched', () => {
    const prev: any = { ...makeState(), storylineState: undefined };
    const next = advance(prev, 10);
    assert.strictEqual(withDayCloseBeat(prev, next), next);
  });

  it('every line is one short sentence and every recalled memory can actually be written', () => {
    const written = new Set<string>();
    for (const d of DIRECTOR_EVENTS) for (const o of d.options) for (const m of o.memories ?? []) written.add(m.key);
    for (const s of EMERGENT_SUBPLOTS) for (const st of s.stages) for (const o of st.options) written.add(o.storyFlag);
    for (const [key, line] of Object.entries(MEMORY_LINES)) {
      assert.ok(written.has(key), `${key} is never written by any event or subplot`);
      assert.ok(line.text.length <= 100, `${key} too long`);
      assert.ok(['good', 'neutral', 'warn'].includes(line.tone));
    }
  });
});
