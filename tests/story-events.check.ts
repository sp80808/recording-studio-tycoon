import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACT1_MIN_QUALITY,
  EMERGENT_SUBPLOTS,
  SUBPLOT_COOLDOWN_DAYS,
  canAffordSubplotOption,
  describeRequirements,
  evaluateStorylineTick,
  generateCampaignTree,
  genreMatchesFocus,
  getAct1GenreFocus,
  getEligibleSubplots,
  getObjectiveRequirements,
  getPendingSubplotEvent,
  getStorylineNode,
  getStorylineObjectiveProgress,
  initializeStorylineState,
  resolveSubplotChoice,
} from '../src/narrative/branchingStorylineEngine';
import { getRivalForNode } from '../src/narrative/rivalCast';
import { ERA_DEFINITIONS } from '../src/utils/eraProgression';
import { getEraGigPool } from '../src/data/gigTemplates';
import { gradeQuality } from '../src/rpg/rankChase';
import type { GameState } from '../src/types/game';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as object)) deepFreeze(nested);
  }
  return value;
};

const ERA_IDS = ['analog60s', 'digital80s', 'internet2000s', 'streaming2020s'] as const;

const baseState = (over: Partial<GameState> & Record<string, unknown> = {}): GameState =>
  initializeStorylineState({
    money: 6000,
    reputation: 40,
    currentDay: 30,
    currentEra: 'analog60s',
    selectedEra: 'analog60s',
    creativeCapital: 0,
    playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0, level: 1 },
    financials: { income: 0, expenses: 0, profit: 0, reports: [] },
    studioRooms: [{ unlocked: true }],
    hiredStaff: [{ id: 'crew-1' }],
    ...over,
  } as unknown as GameState);

describe('subplot catalog', () => {
  it('has unique subplot ids, story flags and option ids', () => {
    const ids = new Set<string>();
    const flags = new Set<string>();
    const optionIds = new Set<string>();
    for (const s of EMERGENT_SUBPLOTS) {
      assert.ok(!ids.has(s.id), `duplicate subplot id ${s.id}`);
      ids.add(s.id);
      assert.equal(s.stages.length, 2, `${s.id} has two beats`);
      assert.equal(s.stages[0].stageNumber, 1);
      assert.equal(s.stages[1].stageNumber, 2);
      for (const stage of s.stages) {
        assert.ok(stage.options.length >= 2, `${s.id} stage ${stage.stageNumber} offers a real choice`);
        for (const o of stage.options) {
          assert.ok(!flags.has(o.storyFlag), `duplicate story flag ${o.storyFlag}`);
          assert.ok(!optionIds.has(o.id), `duplicate option id ${o.id}`);
          flags.add(o.storyFlag);
          optionIds.add(o.id);
          assert.ok(o.consequences.narrativeOutcome.length > 10, `${o.id} has an outcome line`);
        }
      }
    }
    assert.ok(EMERGENT_SUBPLOTS.length >= 12, 'catalog is substantial');
  });

  it('gives every era its own story beats', () => {
    for (const era of ERA_IDS) {
      const state = baseState({ currentEra: era, selectedEra: era, currentDay: 60, reputation: 60, money: 9000 });
      const eraNative = getEligibleSubplots(state, []).filter((s) => s.eras?.includes(era));
      assert.ok(eraNative.length >= 2, `${era} has at least two era-native subplots (got ${eraNative.length})`);
    }
  });

  it('never offers another era’s subplot', () => {
    const state = baseState({ currentEra: 'streaming2020s', selectedEra: 'streaming2020s', currentDay: 90, reputation: 90 });
    for (const s of getEligibleSubplots(state, [])) {
      assert.ok(!s.eras || s.eras.includes('streaming2020s'), `${s.id} leaked into 2020s`);
    }
  });
});

describe('subplot lifecycle', () => {
  const spawned = () => evaluateStorylineTick(baseState());

  it('spawns one seeded subplot, deterministically', () => {
    const a = spawned();
    const b = spawned();
    assert.equal(a.storylineState!.activeSubplots.length, 1);
    assert.equal(a.storylineState!.activeSubplots[0].subplotId, b.storylineState!.activeSubplots[0].subplotId);
    assert.equal(a.storylineState!.activeSubplots[0].currentStage, 1);
  });

  it('surfaces stage 1 immediately and stage 2 only when due', () => {
    const state = spawned();
    const pending1 = getPendingSubplotEvent(state);
    assert.ok(pending1, 'stage 1 is pending at spawn');
    assert.equal(pending1!.active.currentStage, 1);

    const opt = pending1!.stage.options.find((o) => canAffordSubplotOption(state, o))!;
    const after1 = resolveSubplotChoice(state, opt.id);
    assert.equal(after1.storylineState!.activeSubplots[0].currentStage, 2);
    assert.equal(getPendingSubplotEvent(after1), null, 'stage 2 waits for its delay');

    const due = { ...after1, currentDay: after1.currentDay + pending1!.subplot.daysBetweenStages };
    const pending2 = getPendingSubplotEvent(due);
    assert.ok(pending2, 'stage 2 pending once the delay passes');
    assert.equal(pending2!.active.currentStage, 2);
  });

  it('applies consequences, resolves, stamps the cooldown and writes the chronicle', () => {
    let state = spawned();
    const startMoney = state.money;
    const startRep = state.reputation;
    const first = getPendingSubplotEvent(state)!;
    const o1 = first.stage.options.find((o) => canAffordSubplotOption(state, o))!;
    state = resolveSubplotChoice(state, o1.id);
    state = { ...state, currentDay: state.currentDay + first.subplot.daysBetweenStages };
    const second = getPendingSubplotEvent(state)!;
    const o2 = second.stage.options.find((o) => canAffordSubplotOption(state, o))!;
    const moneyBefore2 = state.money;
    state = resolveSubplotChoice(state, o2.id);

    const story = state.storylineState!;
    assert.equal(story.activeSubplots.length, 0);
    assert.ok(story.resolvedSubplotIds.includes(first.subplot.id));
    assert.equal(story.lastSubplotEndDay, state.currentDay);
    assert.equal(story.storyFlags[o1.storyFlag], true);
    assert.equal(story.storyFlags[o2.storyFlag], true);
    assert.equal(story.chronicle!.length, 2);
    assert.equal(story.chronicle![1].kind, 'subplot');
    assert.equal(state.money, Math.max(0, moneyBefore2 + o2.consequences.moneyDelta));
    assert.equal(
      state.reputation,
      Math.max(0, Math.max(0, startRep + o1.consequences.repDelta) + o2.consequences.repDelta),
    );
    assert.ok(state.money >= 0 && startMoney >= 0);
  });

  it('respects the spawn cooldown, then resumes', () => {
    let state = spawned();
    const first = getPendingSubplotEvent(state)!;
    state = resolveSubplotChoice(state, first.stage.options.find((o) => canAffordSubplotOption(state, o))!.id);
    state = { ...state, currentDay: state.currentDay + first.subplot.daysBetweenStages };
    const second = getPendingSubplotEvent(state)!;
    state = resolveSubplotChoice(state, second.stage.options.find((o) => canAffordSubplotOption(state, o))!.id);

    const tooSoon = evaluateStorylineTick(state);
    assert.equal(tooSoon.storylineState!.activeSubplots.length, 0, 'cooldown holds the next subplot back');

    const later = evaluateStorylineTick({ ...state, currentDay: state.currentDay + SUBPLOT_COOLDOWN_DAYS });
    assert.equal(later.storylineState!.activeSubplots.length, 1, 'a new subplot starts after the cooldown');
    assert.notEqual(later.storylineState!.activeSubplots[0].subplotId, first.subplot.id, 'never repeats a resolved subplot');
  });

  it('refuses unaffordable or unknown choices without changing state', () => {
    const state = evaluateStorylineTick(baseState({ money: 100 }));
    const pending = getPendingSubplotEvent(state);
    if (!pending) return; // no affordable-trigger subplot for this fixture is fine
    const expensive = pending.stage.options.find((o) => o.consequences.moneyDelta < -100);
    if (expensive) {
      assert.equal(canAffordSubplotOption(state, expensive), false);
      assert.equal(resolveSubplotChoice(state, expensive.id), state);
    }
    assert.equal(resolveSubplotChoice(state, 'not-a-real-option'), state);
  });

  it('is pure: frozen input state is never mutated', () => {
    const frozen = deepFreeze(spawned());
    const pending = getPendingSubplotEvent(frozen)!;
    const opt = pending.stage.options.find((o) => canAffordSubplotOption(frozen, o))!;
    assert.doesNotThrow(() => resolveSubplotChoice(frozen, opt.id));
    assert.doesNotThrow(() => evaluateStorylineTick(frozen));
  });

  it('keeps subplots flowing after the campaign ends', () => {
    const done = baseState();
    const finished = {
      ...done,
      storylineState: { ...done.storylineState!, campaignCompleted: true },
    } as GameState;
    const ticked = evaluateStorylineTick(finished);
    assert.equal(ticked.storylineState!.campaignCompleted, true);
    assert.equal(ticked.storylineState!.activeSubplots.length, 1);
  });

  it('never stacks a subplot on top of a waiting campaign choice', () => {
    const state = baseState();
    const waiting = {
      ...state,
      storylineState: { ...state.storylineState!, storyFlags: { pending_branch_choice: 'dilemma_act1' } },
    } as GameState;
    assert.equal(evaluateStorylineTick(waiting).storylineState!.activeSubplots.length, 0);
    const withActive = evaluateStorylineTick(state);
    const both = {
      ...withActive,
      storylineState: { ...withActive.storylineState!, storyFlags: { pending_branch_choice: 'dilemma_act1' } },
    } as GameState;
    assert.equal(getPendingSubplotEvent(both), null, 'branch choice has priority');
  });

  it('drops stale subplot ids instead of blocking the story forever', () => {
    const state = baseState();
    const stale = {
      ...state,
      storylineState: {
        ...state.storylineState!,
        activeSubplots: [{ subplotId: 'subplot_deleted_in_a_patch', currentStage: 1, startedDay: 1 }],
      },
    } as GameState;
    const ticked = evaluateStorylineTick(stale);
    assert.ok(ticked.storylineState!.activeSubplots.every((a) => a.subplotId !== 'subplot_deleted_in_a_patch'));
  });
});

describe('campaign objectives tell the truth', () => {
  it('Act I asks for a quality a level-1 studio can reach', () => {
    assert.equal(gradeQuality(ACT1_MIN_QUALITY).rank, 'B');
    assert.ok(ACT1_MIN_QUALITY <= 60);
  });

  it('Act I focus is bookable in every era for every origin', () => {
    const origins = ['bedroom-beatmaker', 'tape-purist', 'hit-factory-mercenary', 'analog-futurist', 'soul-curator', 'unknown-origin'];
    for (const era of ERA_IDS) {
      const def = ERA_DEFINITIONS.find((e) => e.id === era)!;
      const bookable = new Set(getEraGigPool(era, 'starter', def.availableGenres).map((g) => g.template.genre));
      for (const origin of origins) {
        const focus = getAct1GenreFocus(origin, era);
        assert.ok(focus.length >= 2 && focus.length <= 4, `${origin}/${era}: focus size (${focus.join(', ')})`);
        for (const g of focus) assert.ok(bookable.has(g), `${origin}/${era}: "${g}" is offered by the era’s board`);
      }
    }
  });

  it('beatmakers get their own genres in the eras that have them', () => {
    const streaming = getAct1GenreFocus('bedroom-beatmaker', 'streaming2020s');
    assert.ok(streaming.includes('Hip-Hop') || streaming.includes('Trap') || streaming.includes('Lo-fi'));
    const eighties = getAct1GenreFocus('bedroom-beatmaker', 'digital80s');
    assert.ok(eighties.includes('Hip-Hop') || eighties.includes('Electronic'));
  });

  it('accepts every era id spelling and matches genres loosely', () => {
    assert.deepEqual(getAct1GenreFocus('tape-purist', 'vintage-warmth'), getAct1GenreFocus('tape-purist', 'analog60s'));
    assert.deepEqual(getAct1GenreFocus('tape-purist', 'classic_rock'), getAct1GenreFocus('tape-purist', 'analog60s'));
    assert.ok(genreMatchesFocus('Hip-Hop', 'Hip Hop'));
    assert.ok(genreMatchesFocus('Indie Pop', 'Indie'));
    assert.ok(!genreMatchesFocus('Jazz', 'Rock'));
  });

  it('Act II checks the level and staff it announces', () => {
    const tree = generateCampaignTree({ runSeed: 3, originId: 'tape-purist', selectedEra: 'analog60s', playstyle: 'purist' });
    const purist = getStorylineNode(tree, 'act2_purist')!;
    const commercial = getStorylineNode(tree, 'act2_commercial')!;
    assert.match(purist.objectiveDescription, /Level 4/);
    assert.match(commercial.objectiveDescription, /2 staff/);

    const lowLevel = baseState({ studioRooms: [{ unlocked: true }, { unlocked: true }], playerData: { level: 2, xp: 0 } });
    const req = getObjectiveRequirements(purist, lowLevel);
    assert.equal(req.find((r) => r.id === 'rooms')!.done, true);
    assert.equal(req.find((r) => r.id === 'level')!.done, false);
    assert.equal(getStorylineObjectiveProgress(purist, lowLevel).complete, false);

    const noStaff = baseState({ money: 20000, hiredStaff: [{ id: 'x' }] as unknown as GameState['hiredStaff'] });
    assert.equal(getObjectiveRequirements(commercial, noStaff).find((r) => r.id === 'staff')!.done, false);
    const staffed = baseState({ money: 20000, hiredStaff: [{ id: 'x' }, { id: 'y' }] as unknown as GameState['hiredStaff'] });
    assert.equal(getStorylineObjectiveProgress(commercial, staffed).complete, true);
  });

  it('describes finales by their true rank, never “S-rank” for a 85', () => {
    const tree = generateCampaignTree({ runSeed: 3, originId: 'tape-purist', selectedEra: 'analog60s', playstyle: 'purist' });
    const billboard = getStorylineNode(tree, 'act3_billboard_monopoly')!;
    assert.match(billboard.objectiveDescription, /A-rank or better/);
    const legend = getStorylineNode(tree, 'act3_golden_legend')!;
    assert.match(legend.objectiveDescription, /S-rank or better/);
    assert.equal(describeRequirements({}), 'Keep recording — the story is listening.');
  });

  it('wires every node to its lore rival with authored dialogue', () => {
    for (const playstyle of ['purist', 'hit-maker', 'underground', 'sound-lab']) {
      const tree = generateCampaignTree({ runSeed: 11, originId: 'tape-purist', selectedEra: 'analog60s', playstyle });
      for (const node of tree.nodes) {
        const rival = getRivalForNode(node.id, playstyle);
        assert.equal(node.rivalStudioId, rival.id, `${node.id}: rival id`);
        assert.equal(node.rivalName, rival.headProducer, `${node.id}: rival name`);
        assert.ok(node.rivalDialogue.startsWith('“'), `${node.id}: authored rival line`);
      }
    }
  });

  it('checklist and completion can never disagree', () => {
    const tree = generateCampaignTree({ runSeed: 5, originId: 'bedroom-beatmaker', selectedEra: 'streaming2020s', playstyle: 'underground' });
    const focusGenre = tree.nodes[0].requiredTarget.genre![0];
    for (const node of tree.nodes) {
      const empty = baseState({ currentEra: 'streaming2020s', selectedEra: 'streaming2020s', money: 0, reputation: 0, studioRooms: [], hiredStaff: [] });
      assert.equal(getStorylineObjectiveProgress(node, empty).complete, false, `${node.id} incomplete from nothing`);
    }
    const act1 = tree.nodes[0];
    const good = baseState({
      currentEra: 'streaming2020s',
      selectedEra: 'streaming2020s',
      financials: {
        income: 0,
        expenses: 0,
        profit: 0,
        reports: [1, 2, 3].map(() => ({ genre: focusGenre, overallQualityScore: ACT1_MIN_QUALITY })),
      },
    } as Partial<GameState>);
    assert.equal(getStorylineObjectiveProgress(act1, good).complete, true);
  });
});
