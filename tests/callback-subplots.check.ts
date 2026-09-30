import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CALLBACK_SUBPLOTS } from '../src/narrative/callbackSubplots';
import { getCampaignEnding } from '../src/narrative/endings';
import { EMERGENT_SUBPLOTS, getEligibleSubplots, resolveSubplotChoice } from '../src/narrative/branchingStorylineEngine';


const makeState = (flags: Record<string, boolean>, era = 'analog60s', day = 60): any => ({
  currentDay: day,
  currentEra: era,
  selectedEra: era,
  money: 20000,
  reputation: 80,
  hiredStaff: [{ id: 'a' }],
  studioRooms: [],
  storylineState: { storyFlags: flags, activeSubplots: [], resolvedSubplotIds: [] },
});

describe('callback subplots', () => {
  it('are registered with unique ids and two stages each', () => {
    const ids = EMERGENT_SUBPLOTS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const s of CALLBACK_SUBPLOTS) {
      assert.ok(ids.includes(s.id), s.id);
      assert.equal(s.stages.length, 2);
      for (const st of s.stages) assert.ok(st.options.length >= 2);
    }
  });

  it('every option leaves a unique story flag', () => {
    for (const s of CALLBACK_SUBPLOTS) {
      for (const st of s.stages) for (const o of st.options) assert.ok(o.storyFlag && o.consequences.narrativeOutcome);
    }
    const flags = CALLBACK_SUBPLOTS.flatMap((s) => s.stages.flatMap((st) => st.options.map((o) => o.storyFlag)));
    assert.equal(new Set(flags).size, flags.length);
  });

  it('only spawn after the earlier choice that they call back to', () => {
    const without = getEligibleSubplots(makeState({}), []).map((s) => s.id);
    assert.ok(!without.includes('subplot_union_reckoning'));
    const signed = getEligibleSubplots(makeState({ signed_union_scale: true }), []).map((s) => s.id);
    assert.ok(signed.includes('subplot_union_reckoning'));
    const stalled = getEligibleSubplots(makeState({ stalled_union: true }), []).map((s) => s.id);
    assert.ok(stalled.includes('subplot_union_reckoning'));
  });

  it('respect era gating', () => {
    const wrongEra = getEligibleSubplots(makeState({ embraced_the_leak: true }, 'analog60s'), []).map((s) => s.id);
    assert.ok(!wrongEra.includes('subplot_leak_dividend'));
    const rightEra = getEligibleSubplots(makeState({ embraced_the_leak: true }, 'internet2000s'), []).map((s) => s.id);
    assert.ok(rightEra.includes('subplot_leak_dividend'));
  });

  it('each callback is reachable from at least one flag set by a non-callback subplot', () => {
    const prior = new Set<string>();
    const cb = new Set(CALLBACK_SUBPLOTS.map((s) => s.id));
    // Campaign node titles are written to storyFlags on completion.
    for (const t of ['Studio Trailblazer', 'Tone Connoisseur', 'Commercial Machine']) prior.add(t);
    for (const s of EMERGENT_SUBPLOTS) if (!cb.has(s.id)) for (const st of s.stages) for (const o of st.options) prior.add(o.storyFlag);
    for (const s of CALLBACK_SUBPLOTS) {
      const reachable = (s.eras ?? ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s']).some((era) =>
        [...prior].some((f) => getEligibleSubplots(makeState({ [f]: true }, era), []).some((e) => e.id === s.id)),
      );
      assert.ok(reachable, `${s.id} unreachable`);
    }
  });

  it('every becauseOf flag is one that triggers that callback', () => {
    for (const s of CALLBACK_SUBPLOTS) {
      assert.ok(s.becauseOf && Object.keys(s.becauseOf).length > 0, `${s.id} missing becauseOf`);
      for (const f of Object.keys(s.becauseOf!)) {
        const eligible = getEligibleSubplots(makeState({ [f]: true }, (s.eras ?? ['analog60s'])[0]), []).map((e) => e.id);
        assert.ok(eligible.includes(s.id), `${s.id} not triggered by ${f}`);
      }
    }
  });

  it('first chronicle beat names the choice it follows', () => {
    const st: any = makeState({ signed_union_scale: true });
    st.storylineState = { ...st.storylineState, runSeed: 1, activeCampaignNodeId: 'x', campaignCompleted: false, branchHistory: [],
      activeSubplots: [{ subplotId: 'subplot_union_reckoning', currentStage: 1, startedDay: 50 }] };
    const out = resolveSubplotChoice(st, 'reckoning_vouch');
    const last = out.storylineState!.chronicle!.slice(-1)[0];
    assert.ok(last.outcome.startsWith('Because you signed the union scale: '), last.outcome);
  });

  it('rival finale line picks up a late-game callback flag', () => {
    const base: any = makeState({});
    base.storylineState = { ...base.storylineState, campaignCompleted: true, activeCampaignNodeId: 'act3_golden_legend' };
    const plain = getCampaignEnding(base)!;
    const held = getCampaignEnding({ ...base, storylineState: { ...base.storylineState, storyFlags: { held_the_line: true } } })!;
    assert.ok(held.rivalLine.startsWith(plain.rivalLine) && held.rivalLine.length > plain.rivalLine.length);
  });
});
console.log('callback-subplots checks registered');
