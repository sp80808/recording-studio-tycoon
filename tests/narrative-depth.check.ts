/**
 * Narrative depth: era-gated campaign copy, choice-aware subplot presentation,
 * creed → storyFlags, and band-culture lore hooks.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  EMERGENT_SUBPLOTS,
  generateCampaignTree,
  getEligibleSubplots,
  resolveSubplotChoice,
} from '../src/narrative/branchingStorylineEngine';
import {
  getAct1DilemmaCopy,
  getAct2CommercialDilemmaCopy,
  getAct2PuristDilemmaCopy,
} from '../src/narrative/eraBranchCopy';
import { resolveSubplotStagePresentation } from '../src/narrative/subplotPresentation';
import {
  BAND_ATTITUDES,
  STUDIO_HISTORIES,
  getActiveBandAttitudes,
  getUnlockedStudioHistory,
} from '../src/narrative/bandCulture';
import {
  CREED_FLAGS,
  creedFlagForChoice,
} from '../src/components/cutscenes/careerCutscenes';

const makeState = (flags: Record<string, boolean>, era = 'analog60s', day = 40): any => ({
  currentDay: day,
  currentEra: era,
  selectedEra: era,
  money: 20000,
  reputation: 50,
  hiredStaff: [{ id: 'a' }],
  studioRooms: [],
  storylineState: {
    runSeed: 1,
    activeCampaignNodeId: 'act1_genesis',
    campaignCompleted: false,
    branchHistory: [],
    storyFlags: flags,
    activeSubplots: [],
    resolvedSubplotIds: [],
  },
});

const subplotById = (id: string) => EMERGENT_SUBPLOTS.find((s) => s.id === id);

describe('era-aware campaign branch copy', () => {
  it('keeps stable option ids across eras while changing framing', () => {
    const eras = ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'] as const;
    const trees = eras.map((era) =>
      generateCampaignTree({
        runSeed: 99,
        originId: 'tape-purist',
        selectedEra: era,
        playstyle: 'purist',
      }),
    );
    for (const tree of trees) {
      const act1 = tree.nodes.find((n) => n.id === 'act1_genesis')!;
      assert.deepEqual(
        act1.branchDilemma!.options.map((o) => o.id),
        ['opt_path_purist', 'opt_path_commercial'],
      );
      assert.deepEqual(
        act1.branchDilemma!.options.map((o) => o.storyFlag),
        ['chose_acoustic_heritage', 'chose_commercial_scale'],
      );
      assert.deepEqual(
        act1.branchDilemma!.options.map((o) => o.targetNodeId),
        ['act2_purist', 'act2_commercial'],
      );
    }
    const kickers = new Set(trees.map((t) => t.nodes[0].branchDilemma!.kicker));
    assert.ok(kickers.size >= 3, 'Act I kickers should vary by era');
    const contexts = new Set(trees.map((t) => t.nodes[0].branchDilemma!.context));
    assert.ok(contexts.size >= 3, 'Act I contexts should vary by era');
  });

  it('exposes distinct era copy helpers for each act dilemma', () => {
    const a60 = getAct1DilemmaCopy('analog60s');
    const s20 = getAct1DilemmaCopy('streaming2020s');
    assert.notEqual(a60.context, s20.context);
    assert.match(a60.context, /tape|radio|folk|reel/i);
    assert.match(s20.context, /playlist|stream|algorithm/i);

    const purist80 = getAct2PuristDilemmaCopy('digital80s');
    const commercial00 = getAct2CommercialDilemmaCopy('internet2000s');
    assert.ok(purist80.context.length > 20);
    assert.ok(commercial00.options.pathA.label.length > 5);
  });
});

describe('choice-aware subplot presentation', () => {
  it('rewrites stage 2 context and option labels from stage 1 flags', () => {
    const stereo = subplotById('subplot_stereo_panic')!;
    const stage2 = stereo.stages[1];
    const asStereo = resolveSubplotStagePresentation(stage2, makeState({ went_stereo: true }));
    const asMono = resolveSubplotStagePresentation(stage2, makeState({ defended_mono: true }));
    assert.notEqual(asStereo.context, asMono.context);
    assert.match(asStereo.context, /stereo/i);
    assert.match(asMono.context, /mono/i);
    const boastStereo = asStereo.options.find((o) => o.id === 'stereo_press_release')!;
    const boastMono = asMono.options.find((o) => o.id === 'stereo_press_release')!;
    assert.notEqual(boastStereo.label, boastMono.label);
  });

  it('applies presented narrativeOutcome when resolving a choice', () => {
    const stereo = subplotById('subplot_stereo_panic')!;
    const st = makeState({ went_stereo: true });
    st.storylineState.activeSubplots = [{ subplotId: stereo.id, currentStage: 2, startedDay: 20 }];
    const next = resolveSubplotChoice(st, 'stereo_press_release');
    const last = next.storylineState!.chronicle!.at(-1)!;
    assert.match(last.outcome, /monitors|stereo|trades/i);
  });
});

describe('creed flags and creed callback', () => {
  it('maps Rising Studio choices to stable storyFlags', () => {
    assert.equal(creedFlagForChoice('protect-the-take'), 'creed_protect_the_take');
    assert.equal(creedFlagForChoice('master-the-moment'), 'creed_master_the_moment');
    assert.equal(Object.keys(CREED_FLAGS).length, 2);
  });

  it('spawns creed callback only after a creed flag is set', () => {
    const without = getEligibleSubplots(makeState({}), []).map((s) => s.id);
    assert.ok(!without.includes('subplot_creed_tested'));
    const withCreed = getEligibleSubplots(makeState({ creed_protect_the_take: true }), []).map((s) => s.id);
    assert.ok(withCreed.includes('subplot_creed_tested'));
  });

  it('spawns heritage callback from campaign branch flags', () => {
    const heritage = getEligibleSubplots(makeState({ chose_acoustic_heritage: true }), []).map((s) => s.id);
    assert.ok(heritage.includes('subplot_heritage_dividend'));
    const commercial = getEligibleSubplots(
      makeState({ chose_commercial_scale: true }, 'digital80s'),
      [],
    ).map((s) => s.id);
    assert.ok(commercial.includes('subplot_heritage_dividend'));
    const streamingOnly = getEligibleSubplots(
      makeState({ chose_acoustic_heritage: true }, 'streaming2020s'),
      [],
    ).map((s) => s.id);
    assert.ok(!streamingOnly.includes('subplot_heritage_dividend'));
  });
});

describe('band culture lore hooks', () => {
  it('ships studio histories and band attitudes with shared flag vocabulary', () => {
    assert.ok(STUDIO_HISTORIES.length >= 4);
    assert.ok(BAND_ATTITUDES.length >= 5);
    const unlocked = getUnlockedStudioHistory(STUDIO_HISTORIES[0], { defended_mono: true });
    assert.ok(unlocked.deeper);
    const locked = getUnlockedStudioHistory(STUDIO_HISTORIES[0], {});
    assert.equal(locked.deeper, undefined);
    const active = getActiveBandAttitudes({ signed_union_scale: true, declined_payola: true });
    assert.ok(active.some((a) => a.id === 'attitude-session-lifers'));
    assert.ok(active.some((a) => a.id === 'attitude-stream-natives'));
  });
});
