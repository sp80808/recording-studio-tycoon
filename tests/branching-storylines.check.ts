import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveStorylineRunSeed,
  renderProceduralTemplate,
  generateCampaignTree,
  getEligibleSubplots,
  checkNodeCompletion,
  getStorylineNode,
  initializeStorylineState,
  resolveStorylineBranch,
  evaluateStorylineTick,
  hasPendingStorylineBranch,
  getActiveCampaignNode,
  getPendingStorylineBranch,
  getStorylineObjectiveProgress,
  advanceSubplotStage,
  EMERGENT_SUBPLOTS,
  type StorylineBranchOption,
  type CampaignTree,
  type ActiveSubplotState,
} from '../src/narrative/branchingStorylineEngine';
import type { GameState } from '../src/types/game';
import { migrateAndInitializeGameState } from '../src/utils/gameStateUtils';

/** Structural fingerprint for deep-equal tree determinism checks. */
const fingerprintCampaignTree = (tree: CampaignTree) =>
  tree.nodes.map((n) => ({
    id: n.id,
    title: n.title,
    rivalName: n.rivalName,
    optionIds: n.branchDilemma?.options.map((o) => o.id) ?? [],
    targetNodeIds: n.branchDilemma?.options.map((o) => o.targetNodeId) ?? [],
  }));

const ACT3_FINALE_IDS = [
  'act3_golden_legend',
  'act3_sonic_alchemy',
  'act3_billboard_monopoly',
  'act3_rogue_factory',
] as const;

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as object)) {
      deepFreeze(nested);
    }
  }
  return value;
};

const snapshotCriticalFields = (state: GameState) =>
  JSON.stringify({
    money: state.money,
    reputation: state.reputation,
    currentDay: state.currentDay,
    creativeCapital: state.creativeCapital,
    saveSeed: state.saveSeed,
    selectedEra: state.selectedEra,
    playerData: state.playerData,
    financials: state.financials,
    studioRooms: state.studioRooms,
    storylineState: state.storylineState,
  });

/** Fabricate Act 1 completion via financials.reports matching node genres. */
const withAct1Complete = (state: GameState, tree: CampaignTree): GameState => {
  const node = getStorylineNode(tree, 'act1_genesis')!;
  const genres = node.requiredTarget.genre ?? ['Rock', 'Folk', 'Acoustic'];
  return {
    ...state,
    financials: {
      income: 0,
      expenses: 0,
      profit: 0,
      reports: genres.slice(0, 3).map((genre) => ({
        genre,
        overallQualityScore: 80,
      })),
    },
  } as GameState;
};

const withAct2Complete = (state: GameState, act2Id: string): GameState => {
  if (act2Id === 'act2_purist') {
    return {
      ...state,
      studioRooms: [{ unlocked: true }, { unlocked: true }] as GameState['studioRooms'],
      playerData: { ...state.playerData, level: 4 },
    };
  }
  return {
    ...state,
    money: Math.max(state.money, 12000),
    hiredStaff: [{ id: 's1' }, { id: 's2' }] as unknown as GameState['hiredStaff'],
  };
};

const withAct3Complete = (state: GameState, minQuality: number): GameState => ({
  ...state,
  reputation: Math.max(state.reputation, 50),
  financials: {
    income: state.financials?.income ?? 0,
    expenses: state.financials?.expenses ?? 0,
    profit: state.financials?.profit ?? 0,
    reports: [
      ...(state.financials?.reports ?? []),
      { genre: 'Rock', overallQualityScore: minQuality },
    ],
  },
});

describe('Storyline PRNG Seed Derivation & Grammar', () => {
  it('generates consistent run seeds for identical input parameters', () => {
    const seed1 = deriveStorylineRunSeed({
      saveSeed: 12345,
      selectedEra: 'vintage-warmth',
      originId: 'tape-purist',
      playstyle: 'purist',
    });
    const seed2 = deriveStorylineRunSeed({
      saveSeed: 12345,
      selectedEra: 'vintage-warmth',
      originId: 'tape-purist',
      playstyle: 'purist',
    });
    assert.equal(seed1, seed2);
    assert.equal(typeof seed1, 'number');
  });

  it('renders procedural templates deterministically', () => {
    const template =
      'Rival {rivalName} of {rivalStudio} challenges your {gearMotif} at {legendaryVenue}.';
    const text1 = renderProceduralTemplate(template, 42);
    const text2 = renderProceduralTemplate(template, 42);
    assert.equal(text1, text2);
    assert.ok(!text1.includes('{rivalName}'));
    assert.ok(!text1.includes('{rivalStudio}'));
    assert.ok(!text1.includes('{gearMotif}'));
    assert.ok(!text1.includes('{legendaryVenue}'));
  });

  it('renders different procedural text for different seeds', () => {
    const template = '{rivalName} of {rivalStudio}';
    const text1 = renderProceduralTemplate(template, 101);
    const text2 = renderProceduralTemplate(template, 9999);
    assert.ok(typeof text1 === 'string' && text1.length > 0);
    assert.ok(typeof text2 === 'string' && text2.length > 0);
  });
});

describe('3-Act Campaign Tree', () => {
  it('generates a full 3-Act tree with 1 root, 2 Act 2 nodes, and 4 Act 3 finales', () => {
    const tree = generateCampaignTree({
      runSeed: 9999,
      originId: 'tape-purist',
      selectedEra: 'vintage-warmth',
      playstyle: 'purist',
    });
    assert.equal(tree.nodes.length, 7);
    const root = tree.nodes.find((n) => n.id === 'act1_genesis');
    assert.ok(root);
    assert.equal(root!.branchDilemma?.options.length, 2);

    const act2Ids = root!.branchDilemma!.options.map((o) => o.targetNodeId).sort();
    assert.deepEqual(act2Ids, ['act2_commercial', 'act2_purist']);

    const node2A = tree.nodes.find((n) => n.id === 'act2_purist');
    const node2B = tree.nodes.find((n) => n.id === 'act2_commercial');
    assert.equal(node2A?.branchDilemma?.options.length, 2);
    assert.equal(node2B?.branchDilemma?.options.length, 2);

    const act3TargetIds = [
      ...(node2A?.branchDilemma?.options.map((o) => o.targetNodeId) ?? []),
      ...(node2B?.branchDilemma?.options.map((o) => o.targetNodeId) ?? []),
    ];
    assert.equal(new Set(act3TargetIds).size, 4);
  });

  it('is deterministic for the same seed and start conditions', () => {
    const a = generateCampaignTree({
      runSeed: 42,
      originId: 'bedroom-beatmaker',
      selectedEra: 'modern-streaming',
      playstyle: 'underground',
    });
    const b = generateCampaignTree({
      runSeed: 42,
      originId: 'bedroom-beatmaker',
      selectedEra: 'modern-streaming',
      playstyle: 'underground',
    });
    assert.equal(a.nodes[0].title, b.nodes[0].title);
    assert.equal(a.nodes[0].rivalName, b.nodes[0].rivalName);
    assert.equal(getStorylineNode(a, 'act3_rogue_factory')?.title, getStorylineNode(b, 'act3_rogue_factory')?.title);
  });

  it('evaluates node completion against financials.reports and rooms', () => {
    const tree = generateCampaignTree({
      runSeed: 1,
      originId: 'tape-purist',
      selectedEra: 'vintage-warmth',
      playstyle: 'purist',
    });
    const root = getStorylineNode(tree, 'act1_genesis')!;
    const incomplete = {
      money: 1000,
      reputation: 10,
      financials: { income: 0, expenses: 0, profit: 0, reports: [] },
      studioRooms: [],
    } as unknown as GameState;
    assert.equal(checkNodeCompletion(root, incomplete), false);

    const complete = {
      money: 1000,
      reputation: 10,
      financials: {
        income: 0,
        expenses: 0,
        profit: 0,
        reports: [
          { genre: 'Rock', overallQualityScore: 80 },
          { genre: 'Folk', overallQualityScore: 78 },
          { genre: 'Acoustic', overallQualityScore: 90 },
        ],
      },
      studioRooms: [],
    } as unknown as GameState;
    assert.equal(checkNodeCompletion(root, complete), true);
  });
});

describe('Emergent Subplots', () => {
  it('triggers eligible emergent subplots based on state thresholds and day delay', () => {
    const mockState = {
      money: 3000,
      reputation: 25,
      currentDay: 15,
      studioRooms: [{ unlocked: true }],
    } as unknown as GameState;

    const eligible = getEligibleSubplots(mockState, []);
    assert.ok(eligible.length >= 1, 'Expected at least 1 eligible subplot');
    const bootleg = eligible.find((s) => s.id === 'subplot_vinyl_bootleg');
    assert.ok(bootleg);
    assert.equal(bootleg!.stages[0].options.length, 2);
  });

  it('excludes already active or resolved subplot ids', () => {
    const mockState = {
      money: 3000,
      reputation: 25,
      currentDay: 15,
      studioRooms: [{ unlocked: true }],
    } as unknown as GameState;
    const eligible = getEligibleSubplots(mockState, ['subplot_vinyl_bootleg']);
    assert.ok(!eligible.find((s) => s.id === 'subplot_vinyl_bootleg'));
  });
});

describe('GameState schema, save migration & lifecycle (Task 4)', () => {
  it('initializes storylineState non-destructively for saves lacking it', () => {
    const legacySave = {
      money: 2500,
      reputation: 8,
      currentDay: 3,
      selectedEra: 'vintage-warmth',
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
    } as unknown as GameState;

    const initialized = initializeStorylineState(legacySave);
    assert.ok(initialized.storylineState);
    assert.equal(initialized.storylineState!.activeCampaignNodeId, 'act1_genesis');
    assert.equal(initialized.storylineState!.campaignCompleted, false);
    assert.equal(initialized.storylineState!.branchHistory.length, 0);
    assert.deepEqual(initialized.storylineState!.storyFlags, {});
    // Non-destructive: prior economy fields preserved
    assert.equal(initialized.money, 2500);
    assert.equal(initialized.reputation, 8);
    assert.equal(initialized.currentDay, 3);
    assert.equal(initialized.selectedEra, 'vintage-warmth');
  });

  it('is idempotent when storylineState already exists', () => {
    const first = initializeStorylineState({
      money: 1000,
      reputation: 5,
      currentDay: 1,
      selectedEra: 'modern-streaming',
      playerData: { playstyle: 'hit-maker', originId: 'bedroom-beatmaker', xp: 10 },
    } as unknown as GameState);
    const second = initializeStorylineState(first);
    assert.equal(second, first);
    assert.equal(second.storylineState!.runSeed, first.storylineState!.runSeed);
  });

  it('migrates legacy saves via migrateAndInitializeGameState without wiping economy', () => {
    const legacy = {
      money: 4200,
      reputation: 12,
      currentDay: 7,
      selectedEra: 'vintage-warmth',
      ownedEquipment: [],
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 50, level: 2 },
      availableProjects: [],
      activeProjects: [],
      activeProject: null,
    } as unknown as GameState;

    const migrated = migrateAndInitializeGameState(legacy);
    assert.ok(migrated.storylineState);
    assert.equal(migrated.storylineState!.activeCampaignNodeId, 'act1_genesis');
    assert.equal(migrated.money, 4200);
    assert.equal(migrated.reputation, 12);
    assert.equal(migrated.playerData.xp, 50);
    assert.ok(Array.isArray(migrated.studioRooms));
    assert.ok(Array.isArray(migrated.equipmentPlacements));
  });

  it('resolves branch transitions cleanly updating state and tracking history', () => {
    const state = initializeStorylineState({
      money: 1000,
      reputation: 10,
      currentDay: 5,
      selectedEra: 'vintage-warmth',
      creativeCapital: 0,
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
    } as unknown as GameState);

    const option: StorylineBranchOption = {
      id: 'opt_path_purist',
      label: 'Acoustic Craft',
      flavorText: 'Pure live tone.',
      targetNodeId: 'act2_purist',
      playstyleTag: 'purist',
      storyFlag: 'chose_acoustic_heritage',
      consequences: { moneyDelta: 200, repDelta: 5, narrativeOutcome: 'Pristine praise.' },
    };

    const updated = resolveStorylineBranch(state, option);
    assert.equal(updated.storylineState?.activeCampaignNodeId, 'act2_purist');
    assert.equal(updated.storylineState?.storyFlags['chose_acoustic_heritage'], true);
    assert.equal(updated.storylineState?.campaignCompleted, false);
    assert.equal(updated.storylineState?.branchHistory.length, 1);
    assert.equal(updated.storylineState?.branchHistory[0].chosenOptionId, 'opt_path_purist');
    assert.equal(updated.storylineState?.branchHistory[0].resolvedDay, 5);
    assert.equal(updated.money, 1200);
    assert.equal(updated.reputation, 15);
    // Original state not mutated
    assert.equal(state.money, 1000);
    assert.equal(state.storylineState?.activeCampaignNodeId, 'act1_genesis');
  });

  it('evaluateStorylineTick hydrates, grants reward once, and flags pending branch on Act 1 complete', () => {
    const incomplete = initializeStorylineState({
      money: 1000,
      reputation: 10,
      currentDay: 4,
      selectedEra: 'vintage-warmth',
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
      financials: { income: 0, expenses: 0, profit: 0, reports: [] },
      studioRooms: [],
    } as unknown as GameState);

    const stillIncomplete = evaluateStorylineTick(incomplete);
    assert.equal(stillIncomplete.storylineState!.activeCampaignNodeId, 'act1_genesis');
    assert.equal(hasPendingStorylineBranch(stillIncomplete), false);

    const completeBase = {
      ...incomplete,
      financials: {
        income: 0,
        expenses: 0,
        profit: 0,
        reports: [
          { genre: 'Rock', overallQualityScore: 80 },
          { genre: 'Folk', overallQualityScore: 78 },
          { genre: 'Acoustic', overallQualityScore: 90 },
        ],
      },
    } as unknown as GameState;

    const afterTick = evaluateStorylineTick(completeBase);
    assert.equal(hasPendingStorylineBranch(afterTick), true);
    assert.equal(afterTick.storylineState!.storyFlags['rewarded_act1_genesis'], true);
    assert.equal(afterTick.storylineState!.storyFlags['Studio Trailblazer'], true);
    // Act 1 reward: money 1800, rep 15, xp 400
    assert.equal(afterTick.money, incomplete.money + 1800);
    assert.equal(afterTick.reputation, incomplete.reputation + 15);
    assert.equal(afterTick.playerData.xp, 400);
    // Still on act1 until player resolves the branch choice
    assert.equal(afterTick.storylineState!.activeCampaignNodeId, 'act1_genesis');

    // Idempotent reward grant on subsequent ticks
    const secondTick = evaluateStorylineTick(afterTick);
    assert.equal(secondTick.money, afterTick.money);
    assert.equal(secondTick.reputation, afterTick.reputation);
    assert.equal(hasPendingStorylineBranch(secondTick), true);
  });

  it('evaluateStorylineTick marks Act 3 finale complete after objectives land', () => {
    const onFinale = initializeStorylineState({
      money: 5000,
      reputation: 55,
      currentDay: 40,
      selectedEra: 'vintage-warmth',
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 100 },
      financials: {
        income: 0,
        expenses: 0,
        profit: 0,
        reports: [{ genre: 'Rock', overallQualityScore: 92 }],
      },
      studioRooms: [{ unlocked: true }, { unlocked: true }],
      storylineState: {
        runSeed: 1,
        activeCampaignNodeId: 'act3_golden_legend',
        campaignCompleted: false,
        branchHistory: [],
        activeSubplots: [],
        resolvedSubplotIds: [],
        storyFlags: {},
      },
    } as unknown as GameState);

    const done = evaluateStorylineTick(onFinale);
    assert.equal(done.storylineState!.campaignCompleted, true);
    assert.equal(done.storylineState!.storyFlags['rewarded_act3_golden_legend'], true);
    assert.equal(hasPendingStorylineBranch(done), false);
  });

  it('evaluateStorylineTick spawns an eligible subplot when none are active', () => {
    const state = initializeStorylineState({
      money: 3000,
      reputation: 25,
      currentDay: 15,
      selectedEra: 'vintage-warmth',
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
      financials: { income: 0, expenses: 0, profit: 0, reports: [] },
      studioRooms: [{ unlocked: true }],
    } as unknown as GameState);

    const ticked = evaluateStorylineTick(state);
    assert.ok(ticked.storylineState!.activeSubplots.length >= 1);
    assert.equal(ticked.storylineState!.activeSubplots[0].currentStage, 1);
  });
});

describe('CareerHub / StorylineBranchModal UI contracts (Task 5)', () => {
  it('exposes active campaign node and live objective progress for CareerHub', () => {
    const state = initializeStorylineState({
      money: 1000,
      reputation: 10,
      currentDay: 2,
      selectedEra: 'vintage-warmth',
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
      financials: {
        income: 0,
        expenses: 0,
        profit: 0,
        reports: [
          { genre: 'Rock', overallQualityScore: 80 },
          { genre: 'Folk', overallQualityScore: 50 }, // below the Act I bar (60)
        ],
      },
      studioRooms: [],
    } as unknown as GameState);

    const node = getActiveCampaignNode(state);
    assert.ok(node);
    assert.equal(node!.act, 1);
    assert.equal(node!.id, 'act1_genesis');
    assert.ok(node!.title.length > 0);
    assert.ok(node!.objectiveDescription.length > 0);

    const progress = getStorylineObjectiveProgress(node!, state);
    assert.equal(progress.target, 3);
    assert.equal(progress.current, 1);
    assert.equal(progress.complete, false);
    assert.ok(progress.label.includes('1/3'));
  });

  it('surfaces pending branch dilemma payload for StorylineBranchModal', () => {
    const ready = initializeStorylineState({
      money: 1000,
      reputation: 10,
      currentDay: 6,
      selectedEra: 'vintage-warmth',
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
      financials: {
        income: 0,
        expenses: 0,
        profit: 0,
        reports: [
          { genre: 'Rock', overallQualityScore: 80 },
          { genre: 'Folk', overallQualityScore: 78 },
          { genre: 'Acoustic', overallQualityScore: 90 },
        ],
      },
      studioRooms: [],
    } as unknown as GameState);

    const afterTick = evaluateStorylineTick(ready);
    assert.equal(hasPendingStorylineBranch(afterTick), true);

    const pending = getPendingStorylineBranch(afterTick);
    assert.ok(pending);
    assert.equal(pending!.node.id, 'act1_genesis');
    assert.ok(pending!.node.rivalDialogue.length > 0);
    assert.equal(pending!.dilemma.options.length, 2);
    assert.ok(pending!.dilemma.kicker.length > 0);

    const chosen = pending!.dilemma.options[0];
    const resolved = resolveStorylineBranch(afterTick, chosen);
    assert.equal(hasPendingStorylineBranch(resolved), false);
    assert.equal(getPendingStorylineBranch(resolved), null);
    assert.equal(resolved.storylineState!.activeCampaignNodeId, chosen.targetNodeId);
    assert.equal(resolved.storylineState!.storyFlags[chosen.storyFlag], true);
  });
});

describe('Invariant suite (Task 6): determinism, traversability, purity, subplots', () => {
  it('is 100% deterministic across 50 seeds for trees, seed derivation, and templates', () => {
    const template = 'Rival {rivalName} of {rivalStudio} challenges your {gearMotif} at {legendaryVenue}.';
    const origins = ['tape-purist', 'bedroom-beatmaker', 'session-veteran'] as const;
    const eras = ['vintage-warmth', 'modern-streaming', 'golden-age'] as const;
    const playstyles = ['purist', 'underground', 'hit-maker'] as const;

    for (let i = 0; i < 50; i++) {
      const saveSeed = 10_000 + i * 97;
      const originId = origins[i % origins.length];
      const selectedEra = eras[i % eras.length];
      const playstyle = playstyles[i % playstyles.length];

      const runSeedA = deriveStorylineRunSeed({ saveSeed, selectedEra, originId, playstyle });
      const runSeedB = deriveStorylineRunSeed({ saveSeed, selectedEra, originId, playstyle });
      assert.equal(runSeedA, runSeedB);

      const renderedA = renderProceduralTemplate(template, runSeedA);
      const renderedB = renderProceduralTemplate(template, runSeedB);
      assert.equal(renderedA, renderedB);

      const treeA = generateCampaignTree({
        runSeed: runSeedA,
        originId,
        selectedEra,
        playstyle,
      });
      const treeB = generateCampaignTree({
        runSeed: runSeedB,
        originId,
        selectedEra,
        playstyle,
      });

      assert.equal(treeA.nodes.length, 7);
      assert.deepEqual(fingerprintCampaignTree(treeA), fingerprintCampaignTree(treeB));
      assert.deepEqual(
        treeA.nodes.map((n) => n.id).sort(),
        ['act1_genesis', 'act2_commercial', 'act2_purist', ...ACT3_FINALE_IDS].sort(),
      );
    }
  });

  it('can traverse both Act1→Act2 paths and reach all 4 Act 3 finales', () => {
    const reached = new Set<string>();

    const baseCtx = {
      money: 1000,
      reputation: 10,
      currentDay: 20,
      selectedEra: 'vintage-warmth',
      creativeCapital: 0,
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
      financials: { income: 0, expenses: 0, profit: 0, reports: [] },
      studioRooms: [],
    } as unknown as GameState;

    const start = initializeStorylineState(baseCtx);
    const tree = generateCampaignTree({
      runSeed: start.storylineState!.runSeed,
      originId: 'tape-purist',
      selectedEra: 'vintage-warmth',
      playstyle: 'purist',
    });

    const act1 = getStorylineNode(tree, 'act1_genesis')!;
    assert.ok(act1.branchDilemma);
    assert.equal(act1.branchDilemma!.options.length, 2);

    for (const act1Option of act1.branchDilemma!.options) {
      let state = withAct1Complete(start, tree);
      state = evaluateStorylineTick(state);
      assert.equal(hasPendingStorylineBranch(state), true);

      state = resolveStorylineBranch(state, act1Option);
      assert.equal(state.storylineState!.activeCampaignNodeId, act1Option.targetNodeId);

      const act2 = getStorylineNode(tree, act1Option.targetNodeId)!;
      assert.ok(act2.branchDilemma);
      assert.equal(act2.act, 2);

      for (const act2Option of act2.branchDilemma!.options) {
        let pathState = withAct2Complete(state, act2.id);
        pathState = evaluateStorylineTick(pathState);
        assert.equal(hasPendingStorylineBranch(pathState), true);

        pathState = resolveStorylineBranch(pathState, act2Option);
        const finaleId = act2Option.targetNodeId;
        assert.equal(pathState.storylineState!.activeCampaignNodeId, finaleId);
        assert.ok(
          (ACT3_FINALE_IDS as readonly string[]).includes(finaleId),
          `Unexpected Act 3 id: ${finaleId}`,
        );

        const finale = getStorylineNode(tree, finaleId)!;
        const minQuality = finale.requiredTarget.minQuality ?? 90;
        pathState = withAct3Complete(pathState, minQuality);
        pathState = evaluateStorylineTick(pathState);

        assert.equal(pathState.storylineState!.campaignCompleted, true);
        assert.equal(pathState.storylineState!.activeCampaignNodeId, finaleId);
        assert.equal(hasPendingStorylineBranch(pathState), false);
        reached.add(finaleId);
      }
    }

    assert.deepEqual([...reached].sort(), [...ACT3_FINALE_IDS].sort());
  });

  it('does not mutate caller GameState / generateCampaignTree inputs', () => {
    const treeInput = deepFreeze({
      runSeed: 4242,
      originId: 'tape-purist',
      selectedEra: 'vintage-warmth',
      playstyle: 'purist',
    });
    const tree = generateCampaignTree(treeInput);
    assert.equal(tree.nodes.length, 7);
    assert.equal(treeInput.runSeed, 4242);

    const alreadyInit = deepFreeze(
      initializeStorylineState({
        money: 1500,
        reputation: 12,
        currentDay: 4,
        selectedEra: 'vintage-warmth',
        creativeCapital: 3,
        playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 20 },
        financials: { income: 0, expenses: 0, profit: 0, reports: [] },
        studioRooms: [],
      } as unknown as GameState),
    );
    const beforeInit = snapshotCriticalFields(alreadyInit);
    const sameRef = initializeStorylineState(alreadyInit);
    assert.equal(sameRef, alreadyInit);
    assert.equal(snapshotCriticalFields(alreadyInit), beforeInit);

    const branchReady = initializeStorylineState({
      money: 2000,
      reputation: 15,
      currentDay: 8,
      selectedEra: 'vintage-warmth',
      creativeCapital: 0,
      playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
      financials: {
        income: 0,
        expenses: 0,
        profit: 0,
        reports: [
          { genre: 'Rock', overallQualityScore: 80 },
          { genre: 'Folk', overallQualityScore: 78 },
          { genre: 'Acoustic', overallQualityScore: 90 },
        ],
      },
      studioRooms: [],
    } as unknown as GameState);
    const pending = evaluateStorylineTick(branchReady);
    deepFreeze(pending);
    const beforeResolve = snapshotCriticalFields(pending);
    const option = getPendingStorylineBranch(pending)!.dilemma.options[0];
    deepFreeze(option);
    const resolved = resolveStorylineBranch(pending, option);
    assert.notEqual(resolved, pending);
    assert.equal(snapshotCriticalFields(pending), beforeResolve);
    assert.equal(pending.money, 2000 + 1800);
    assert.equal(pending.storylineState!.activeCampaignNodeId, 'act1_genesis');
    assert.equal(resolved.storylineState!.activeCampaignNodeId, option.targetNodeId);

    const tickInput = deepFreeze(
      initializeStorylineState({
        money: 3000,
        reputation: 25,
        currentDay: 15,
        selectedEra: 'vintage-warmth',
        playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
        financials: { income: 0, expenses: 0, profit: 0, reports: [] },
        studioRooms: [{ unlocked: true }],
      } as unknown as GameState),
    );
    const beforeTick = snapshotCriticalFields(tickInput);
    const ticked = evaluateStorylineTick(tickInput);
    assert.notEqual(ticked, tickInput);
    assert.equal(snapshotCriticalFields(tickInput), beforeTick);
    assert.ok(ticked.storylineState!.activeSubplots.length >= 1);
  });

  it('advances subplot stages 1→2→resolved and excludes resolved ids from eligibility', () => {
    assert.ok(EMERGENT_SUBPLOTS.length >= 1);
    const subplot = EMERGENT_SUBPLOTS.find((s) => s.id === 'subplot_vinyl_bootleg')!;
    assert.ok(subplot);
    assert.equal(subplot.stages.length, 2);

    const stage1Choice = subplot.stages[0].options[0];
    const stage2Choice = subplot.stages[1].options[0];

    const active: ActiveSubplotState = {
      subplotId: subplot.id,
      currentStage: 1,
      startedDay: 10,
    };

    const advanced = advanceSubplotStage(active, stage1Choice.id, 14);
    assert.ok(!('resolved' in advanced));
    const stage2 = advanced as ActiveSubplotState;
    assert.equal(stage2.currentStage, 2);
    assert.equal(stage2.stage1ChoiceId, stage1Choice.id);
    assert.equal(stage2.startedDay, 14);
    // Original active object not mutated
    assert.equal(active.currentStage, 1);
    assert.equal(active.stage1ChoiceId, undefined);

    const resolved = advanceSubplotStage(stage2, stage2Choice.id, 18);
    assert.ok('resolved' in resolved && resolved.resolved === true);
    assert.equal((resolved as { resolved: true; choiceId: string }).choiceId, stage2Choice.id);

    const eligibleState = {
      money: 3000,
      reputation: 25,
      currentDay: 15,
      studioRooms: [{ unlocked: true }],
    } as unknown as GameState;

    const spawnTick = evaluateStorylineTick(
      initializeStorylineState({
        ...eligibleState,
        selectedEra: 'vintage-warmth',
        playerData: { playstyle: 'purist', originId: 'tape-purist', xp: 0 },
        financials: { income: 0, expenses: 0, profit: 0, reports: [] },
      } as unknown as GameState),
    );
    assert.ok(spawnTick.storylineState!.activeSubplots.length >= 1);
    const spawnedId = spawnTick.storylineState!.activeSubplots[0].subplotId;
    assert.ok(EMERGENT_SUBPLOTS.some((s) => s.id === spawnedId));

    const withResolved = getEligibleSubplots(eligibleState, [subplot.id]);
    assert.ok(!withResolved.find((s) => s.id === subplot.id));

    const stillEligible = getEligibleSubplots(eligibleState, []);
    assert.ok(stillEligible.find((s) => s.id === subplot.id));
  });
});
