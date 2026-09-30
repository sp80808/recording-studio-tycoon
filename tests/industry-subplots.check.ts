import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_SUBPLOTS } from '../src/narrative/industrySubplots';
import { EMERGENT_SUBPLOTS, getEligibleSubplots } from '../src/narrative/branchingStorylineEngine';

const ERAS = ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'];
const state = (era: string, over: any = {}): any => ({
  currentDay: 80,
  currentEra: era,
  selectedEra: era,
  money: 30000,
  reputation: 90,
  hiredStaff: [],
  studioRooms: [],
  storylineState: { storyFlags: {}, activeSubplots: [], resolvedSubplotIds: [] },
  ...over,
});

describe('industry subplots', () => {
  it('are registered, unique and two-beat with real trade-offs', () => {
    const ids = EMERGENT_SUBPLOTS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, 'unique ids across all subplots');
    assert.ok(INDUSTRY_SUBPLOTS.length >= 10);
    for (const s of INDUSTRY_SUBPLOTS) {
      assert.ok(ids.includes(s.id), s.id);
      assert.equal(s.stages.length, 2);
      assert.ok(s.eras && s.eras.length > 0 && s.eras.every((e) => ERAS.includes(e)), `${s.id} era`);
      for (const st of s.stages) {
        assert.equal(st.options.length, 2);
        const [a, b] = st.options;
        assert.notEqual(a.storyFlag, b.storyFlag);
        // never strictly dominant: one option must cost money or reputation relative to the other
        const aBetter = a.consequences.moneyDelta >= b.consequences.moneyDelta && a.consequences.repDelta >= b.consequences.repDelta;
        const bBetter = b.consequences.moneyDelta >= a.consequences.moneyDelta && b.consequences.repDelta >= a.consequences.repDelta;
        assert.ok(!(aBetter || bBetter), `${s.id}/${st.title}: one option strictly dominates`);
        for (const o of st.options) {
          assert.ok(o.label && o.flavorText && o.consequences.narrativeOutcome);
          assert.ok(o.consequences.moneyDelta >= -1500, `${o.id} too expensive`);
        }
      }
    }
  });

  it('flags are unique across the whole catalogue', () => {
    const flags = EMERGENT_SUBPLOTS.flatMap((s) => s.stages.flatMap((st) => st.options.map((o) => o.storyFlag)));
    const dupes = flags.filter((f, i) => flags.indexOf(f) !== i);
    assert.deepEqual([...new Set(dupes)], []);
  });

  it('each one can spawn in its own era and only there', () => {
    for (const s of INDUSTRY_SUBPLOTS) {
      for (const era of ERAS) {
        const eligible = getEligibleSubplots(state(era), []).some((e) => e.id === s.id);
        assert.equal(eligible, s.eras!.includes(era), `${s.id} in ${era}`);
      }
    }
  });

  it('every era has at least three industry subplots', () => {
    for (const era of ERAS) assert.ok(INDUSTRY_SUBPLOTS.filter((s) => s.eras!.includes(era)).length >= 3, era);
  });

  it('text avoids real brand and personal names', () => {
    const banned = /\b(Spotify|Apple|Napster|TikTok|MTV|YouTube|Beatles|Phil Collins|Spector|Auto-Tune|Live Aid|Idol|Linn|Kate Bush|Fleetwood)\b/i;
    for (const s of INDUSTRY_SUBPLOTS) {
      const text = JSON.stringify({ t: s.title, k: s.kicker, st: s.stages });
      assert.ok(!banned.test(text), `${s.id} mentions a real name`);
    }
  });
});
