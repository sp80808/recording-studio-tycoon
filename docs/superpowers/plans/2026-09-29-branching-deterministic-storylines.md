# Branching Deterministic Random Storylines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a procedural narrative graph engine that generates deterministic 3-Act branching campaign storylines and emergent subplots subtly varied by player start conditions and previous choices.

**Architecture:** A pure simulation core in `src/narrative/branchingStorylineEngine.ts` uses Mulberry32 PRNG seeded from start conditions to generate procedural grammar, dynamic objectives, rival motivations, and divergent 3-Act trees (1 root -> 2 Act 2 paths -> 4 Act 3 finales). State is tracked in `GameState.storylineState`, evaluated during daily tick and session completion, and surfaced in `CareerHub` and a dedicated `StorylineBranchModal`.

**Tech Stack:** TypeScript, React, Lucide icons, Mulberry32 PRNG (`seededRandom.ts`), Node.js `node:test` runner.

**Spec:** [docs/superpowers/specs/2026-09-29-branching-deterministic-storylines-design.md](file:///Volumes/Harry/DEV/Recording%20Studio%20Tycoon/RST%20v1.5/recording-studio-tycoon/docs/superpowers/specs/2026-09-29-branching-deterministic-storylines-design.md)

## Global Constraints

- **Pure determinism:** Identical `(seed, origin, era, playstyle, choices)` must produce 100% byte-identical campaign nodes, text, and outcomes across separate runs.
- **Append-only & save-safe:** Existing save files without `storylineState` must transparently initialize without data loss or crashes.
- **No side-effects in core generator:** All procedural node generation and outcome calculation must be pure functions with zero mutation of inputs.
- **Code style:** Concise, strict TypeScript types, no placeholders (`TODO`/`TBD`).

---

### Task 1: PRNG Seed Derivation, Procedural Grammar & Core Types

**Files:**
- Create: `src/narrative/branchingStorylineEngine.ts`
- Test: `tests/branching-storylines.check.ts`

**Interfaces:**
- Consumes: `createSeededRandom`, `hashSeed`, `pickWithRandom` from `src/simulation/seededRandom.ts`
- Produces: `deriveStorylineRunSeed`, `createNodeRng`, `renderProceduralTemplate`, `StorylineNode`, `StorylineBranchOption`, `StorylineState`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/branching-storylines.check.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveStorylineRunSeed,
  renderProceduralTemplate,
} from '../src/narrative/branchingStorylineEngine';

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
    const template = 'Rival {rivalName} of {rivalStudio} challenges your {gearMotif}.';
    const text1 = renderProceduralTemplate(template, 42);
    const text2 = renderProceduralTemplate(template, 42);
    assert.equal(text1, text2);
    assert.ok(!text1.includes('{rivalName}'));
    assert.ok(!text1.includes('{rivalStudio}'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: FAIL (Cannot find module `branchingStorylineEngine`)

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/narrative/branchingStorylineEngine.ts
import { hashSeed, createSeededRandom, RandomSource, pickWithRandom } from '@/simulation/seededRandom';

export interface RunSeedContext {
  saveSeed: number | string;
  selectedEra: string;
  originId: string;
  playstyle: string;
}

export interface StorylineBranchOption {
  id: string;
  label: string;
  flavorText: string;
  targetNodeId: string;
  playstyleTag: string;
  storyFlag: string;
  consequences: {
    moneyDelta: number;
    repDelta: number;
    creativeCapitalDelta?: number;
    narrativeOutcome: string;
  };
}

export interface StorylineNode {
  id: string;
  act: 1 | 2 | 3;
  branchPath: string;
  title: string;
  loreBrief: string;
  objectiveDescription: string;
  rivalStudioId: string;
  rivalName: string;
  rivalDialogue: string;
  requiredTarget: {
    genre?: string[];
    minQuality?: number;
    sessionCount?: number;
    moneyTarget?: number;
    reputationTarget?: number;
    unlockedRooms?: number;
  };
  completionReward: {
    money: number;
    reputation: number;
    xp: number;
    titleOrPerk: string;
  };
  branchDilemma?: {
    id: string;
    kicker: string;
    context: string;
    options: StorylineBranchOption[];
  };
}

export interface StorylineBranchRecord {
  nodeId: string;
  chosenOptionId: string;
  resolvedDay: number;
  storyFlagGranted: string;
}

export interface ActiveSubplotState {
  subplotId: string;
  currentStage: 1 | 2;
  startedDay: number;
  stage1ChoiceId?: string;
}

export interface StorylineState {
  runSeed: number;
  activeCampaignNodeId: string;
  campaignCompleted: boolean;
  branchHistory: StorylineBranchRecord[];
  activeSubplots: ActiveSubplotState[];
  resolvedSubplotIds: string[];
  storyFlags: Record<string, boolean | number | string>;
}

export const deriveStorylineRunSeed = (ctx: RunSeedContext): number => {
  return hashSeed(`${ctx.saveSeed}:${ctx.selectedEra}:${ctx.originId}:${ctx.playstyle}`);
};

export const createNodeRng = (runSeed: number, nodeId: string, stepIndex = 0): RandomSource => {
  return createSeededRandom(hashSeed(`${runSeed}:${nodeId}:${stepIndex}`));
};

const RIVAL_NAMES = ['Silas Vance', 'Chad Sterling', 'Roxy Riot', 'Dr. Vance Thorne', 'Felix Belmont', 'Victoria Chase'] as const;
const RIVAL_STUDIOS = ['Black Wax Vault', 'Apex Velocity', 'The Anarchy Soundboard', 'Neon Synthworks', 'Velvet Static Collective'] as const;
const GEAR_MOTIFS = ['discrete analog desk', 'custom tube preamp', 'vintage 2-inch tape reel', 'analog plate reverb', 'mastering limiter'] as const;
const VENUES = ['The Marquee Cellar', 'Warehouse 9', 'The Electric Ballroom', 'The Gold Coast Pavilion'] as const;

export const renderProceduralTemplate = (template: string, seed: number): string => {
  const rng = createSeededRandom(seed);
  return template
    .replace(/\{rivalName\}/g, () => pickWithRandom(rng, RIVAL_NAMES))
    .replace(/\{rivalStudio\}/g, () => pickWithRandom(rng, RIVAL_STUDIOS))
    .replace(/\{gearMotif\}/g, () => pickWithRandom(rng, GEAR_MOTIFS))
    .replace(/\{legendaryVenue\}/g, () => pickWithRandom(rng, VENUES));
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/narrative/branchingStorylineEngine.ts tests/branching-storylines.check.ts
git commit -m "feat(narrative): core deterministic PRNG engine and procedural grammar"
```

---

### Task 2: 3-Act Branching Campaign Tree & Procedural Generator

**Files:**
- Modify: `src/narrative/branchingStorylineEngine.ts`
- Modify: `tests/branching-storylines.check.ts`

**Interfaces:**
- Consumes: `renderProceduralTemplate`, `createNodeRng`, `deriveStorylineRunSeed`
- Produces: `generateCampaignTree`, `getStorylineNode`, `checkNodeCompletion`

- [ ] **Step 1: Write the failing test**

```typescript
// in tests/branching-storylines.check.ts
it('generates a full 3-Act tree with 1 root, 2 Act 2 nodes, and 4 Act 3 finales', () => {
  const tree = generateCampaignTree({
    runSeed: 9999,
    originId: 'tape-purist',
    selectedEra: 'vintage-warmth',
    playstyle: 'purist',
  });
  assert.equal(tree.nodes.length, 7);
  const root = tree.nodes.find(n => n.id === 'act1_genesis');
  assert.ok(root);
  assert.equal(root.branchDilemma?.options.length, 2);

  // Both Act 1 options point to valid Act 2 nodes
  const act2Ids = root.branchDilemma.options.map(o => o.targetNodeId);
  assert.deepEqual(act2Ids.sort(), ['act2_commercial', 'act2_purist']);

  // Each Act 2 node has 2 options pointing to Act 3 nodes
  const node2A = tree.nodes.find(n => n.id === 'act2_purist');
  const node2B = tree.nodes.find(n => n.id === 'act2_commercial');
  assert.equal(node2A?.branchDilemma?.options.length, 2);
  assert.equal(node2B?.branchDilemma?.options.length, 2);

  const act3TargetIds = [
    ...(node2A?.branchDilemma?.options.map(o => o.targetNodeId) ?? []),
    ...(node2B?.branchDilemma?.options.map(o => o.targetNodeId) ?? []),
  ];
  assert.equal(new Set(act3TargetIds).size, 4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: FAIL (`generateCampaignTree is not defined`)

- [ ] **Step 3: Write minimal implementation**

```typescript
// in src/narrative/branchingStorylineEngine.ts
import { GameState } from '@/types/game';

export interface CampaignTree {
  runSeed: number;
  nodes: StorylineNode[];
}

export const generateCampaignTree = (ctx: {
  runSeed: number;
  originId: string;
  selectedEra: string;
  playstyle: string;
}): CampaignTree => {
  const { runSeed, originId } = ctx;
  const isTapePurist = originId === 'tape-purist';
  const isBeatmaker = originId === 'bedroom-beatmaker';

  const genreFocus = isTapePurist
    ? ['Rock', 'Acoustic', 'Folk']
    : isBeatmaker
    ? ['Hip Hop', 'Lo-Fi', 'Electronic']
    : ['Pop', 'Rock', 'RnB'];

  const act1: StorylineNode = {
    id: 'act1_genesis',
    act: 1,
    branchPath: 'root',
    title: renderProceduralTemplate('Act I: The Sound of {rivalStudio}', runSeed),
    loreBrief: renderProceduralTemplate('{rivalName} claims your studio lacks acoustic depth. Establish your sonic footprint.', runSeed + 1),
    objectiveDescription: `Complete at least 3 sessions in ${genreFocus.join('/')} with Quality >= 75.`,
    rivalStudioId: 'rival_primary',
    rivalName: renderProceduralTemplate('{rivalName}', runSeed),
    rivalDialogue: renderProceduralTemplate('"Your room will never master a timeless cut." — {rivalName}', runSeed),
    requiredTarget: {
      genre: genreFocus,
      minQuality: 75,
      sessionCount: 3,
    },
    completionReward: {
      money: 1800,
      reputation: 15,
      xp: 400,
      titleOrPerk: 'Studio Trailblazer',
    },
    branchDilemma: {
      id: 'dilemma_act1',
      kicker: 'CAMPAIGN CROSSROAD // STRATEGIC DIRECTION',
      context: 'Your initial sessions attract underground acclaim and commercial label attention. Choose your studio trajectory:',
      options: [
        {
          id: 'opt_path_purist',
          label: 'Double Down on Acoustic Craft & Heritage',
          flavorText: 'Refuse corporate shortcuts. Rebuild your acoustics for pristine live tone.',
          targetNodeId: 'act2_purist',
          playstyleTag: 'purist',
          storyFlag: 'chose_acoustic_heritage',
          consequences: {
            moneyDelta: 0,
            repDelta: 10,
            narrativeOutcome: 'Artists praise your uncompromising sonic integrity.',
          },
        },
        {
          id: 'opt_path_commercial',
          label: 'Scale Up Commercial Throughput & Hits',
          flavorText: 'Expand staff, pump out chart earworms, and monetize streaming trends.',
          targetNodeId: 'act2_commercial',
          playstyleTag: 'hit-maker',
          storyFlag: 'chose_commercial_scale',
          consequences: {
            moneyDelta: 2500,
            repDelta: 2,
            narrativeOutcome: 'Streaming revenue flows into studio accounts.',
          },
        },
      ],
    },
  };

  const act2Purist: StorylineNode = {
    id: 'act2_purist',
    act: 2,
    branchPath: 'act2_purist',
    title: 'Act II: The Acoustic Sanctuary',
    loreBrief: renderProceduralTemplate('{rivalName} challenges your acoustic isolation at {legendaryVenue}.', runSeed + 10),
    objectiveDescription: 'Own at least 2 Studio Rooms and reach Producer Level 4.',
    rivalStudioId: 'rival_purist',
    rivalName: renderProceduralTemplate('{rivalName}', runSeed + 10),
    rivalDialogue: '"Let us see if your wooden walls survive real scrutiny."',
    requiredTarget: {
      unlockedRooms: 2,
    },
    completionReward: {
      money: 3200,
      reputation: 25,
      xp: 750,
      titleOrPerk: 'Tone Connoisseur',
    },
    branchDilemma: {
      id: 'dilemma_act2_purist',
      kicker: 'HERITAGE SPLIT // THE MASTERING DUEL',
      context: 'A historic vintage master tape requires a definitive production philosophy:',
      options: [
        {
          id: 'opt_purist_legend',
          label: 'The Golden Reel Legend: Pure Analog Master',
          flavorText: 'Perform live lacquer disc cut without digital compression.',
          targetNodeId: 'act3_golden_legend',
          playstyleTag: 'purist',
          storyFlag: 'golden_reel_purity',
          consequences: {
            moneyDelta: 500,
            repDelta: 15,
            narrativeOutcome: 'Audiophiles hail the release as a benchmark of fidelity.',
          },
        },
        {
          id: 'opt_purist_alchemy',
          label: 'The Sonic Alchemist: Hybrid Acoustic Innovation',
          flavorText: 'Fuse vacuum tubes with modularDSP acoustic enhancement.',
          targetNodeId: 'act3_sonic_alchemy',
          playstyleTag: 'sound-lab',
          storyFlag: 'hybrid_acoustic_patent',
          consequences: {
            moneyDelta: 1200,
            repDelta: 12,
            narrativeOutcome: 'Engineering journals feature your custom acoustic circuit.',
          },
        },
      ],
    },
  };

  const act2Commercial: StorylineNode = {
    id: 'act2_commercial',
    act: 2,
    branchPath: 'act2_commercial',
    title: 'Act II: The Billboard Syndicate',
    loreBrief: renderProceduralTemplate('{rivalStudio} tries to poach your top regular artists.', runSeed + 20),
    objectiveDescription: 'Accumulate $12,000 cash and hire at least 2 staff members.',
    rivalStudioId: 'rival_commercial',
    rivalName: renderProceduralTemplate('{rivalName}', runSeed + 20),
    rivalDialogue: '"In this business, cash talks and indie rooms fold."',
    requiredTarget: {
      moneyTarget: 12000,
    },
    completionReward: {
      money: 4500,
      reputation: 20,
      xp: 800,
      titleOrPerk: 'Commercial Machine',
    },
    branchDilemma: {
      id: 'dilemma_act2_commercial',
      kicker: 'INDUSTRY FORK // GLOBAL DISTRIBUTION',
      context: 'Major distribution bids land on your desk:',
      options: [
        {
          id: 'opt_commercial_monopoly',
          label: 'The Billboard Monopoly: Sign Conglomerate Buy-In',
          flavorText: 'Dominate playlist algorithms and take global royalty shares.',
          targetNodeId: 'act3_billboard_monopoly',
          playstyleTag: 'hit-maker',
          storyFlag: 'major_label_syndicate',
          consequences: {
            moneyDelta: 5000,
            repDelta: -5,
            narrativeOutcome: 'Unprecedented commercial reach at the cost of purist credibility.',
          },
        },
        {
          id: 'opt_commercial_rebel',
          label: 'The Rogue Hit Factory: Open-Stem Grassroots Wave',
          flavorText: 'Publish open stems for remixers while keeping full publishing.',
          targetNodeId: 'act3_rogue_factory',
          playstyleTag: 'underground',
          storyFlag: 'open_stem_revolution',
          consequences: {
            moneyDelta: 2000,
            repDelta: 20,
            narrativeOutcome: 'Viral TikTok and streaming remix movements crown your room.',
          },
        },
      ],
    },
  };

  const makeAct3Finale = (id: string, title: string, perk: string, targetQual: number): StorylineNode => ({
    id,
    act: 3,
    branchPath: id,
    title,
    loreBrief: renderProceduralTemplate('The final showdown at {legendaryVenue}. All eyes are on your master.', runSeed + 30),
    objectiveDescription: `Produce an S-Rank session with Quality >= ${targetQual} and reach Reputation >= 50.`,
    rivalStudioId: 'rival_finale',
    rivalName: renderProceduralTemplate('{rivalName}', runSeed + 30),
    rivalDialogue: '"Let the final master decide history."',
    requiredTarget: {
      minQuality: targetQual,
      reputationTarget: 50,
    },
    completionReward: {
      money: 10000,
      reputation: 60,
      xp: 2500,
      titleOrPerk: perk,
    },
  });

  const act3GoldenLegend = makeAct3Finale('act3_golden_legend', 'Act III: The Golden Reel Legend', 'Master of the Vacuum Tube', 90);
  const act3SonicAlchemy = makeAct3Finale('act3_sonic_alchemy', 'Act III: The Sonic Alchemist Finale', 'Acoustic Architect', 88);
  const act3Billboard = makeAct3Finale('act3_billboard_monopoly', 'Act III: The Billboard Monopoly', 'Platinum Cartel Head', 85);
  const act3Rogue = makeAct3Finale('act3_rogue_factory', 'Act III: The Rogue Hit Factory', 'Rebel Audio Kingpin', 86);

  return {
    runSeed,
    nodes: [act1, act2Purist, act2Commercial, act3GoldenLegend, act3SonicAlchemy, act3Billboard, act3Rogue],
  };
};

export const checkNodeCompletion = (node: StorylineNode, state: GameState): boolean => {
  const req = node.requiredTarget;
  if (req.minQuality && req.genre && req.sessionCount) {
    const matching = state.financials?.history?.filter(
      h => req.genre!.some(g => (h.genre || '').toLowerCase().includes(g.toLowerCase())) && h.quality >= req.minQuality!
    ).length ?? 0;
    if (matching < req.sessionCount) return false;
  } else if (req.minQuality) {
    const hasQuality = state.financials?.history?.some(h => h.quality >= req.minQuality!) ?? false;
    if (!hasQuality) return false;
  }

  if (req.unlockedRooms) {
    const rooms = state.studioRooms?.filter(r => r.unlocked).length ?? 0;
    if (rooms < req.unlockedRooms) return false;
  }

  if (req.moneyTarget && state.money < req.moneyTarget) return false;
  if (req.reputationTarget && state.reputation < req.reputationTarget) return false;

  return true;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/narrative/branchingStorylineEngine.ts tests/branching-storylines.check.ts
git commit -m "feat(narrative): 3-act branching campaign tree and completion checker"
```

---

### Task 3: Emergent Subplots Pool & Multi-Day Evaluation

**Files:**
- Modify: `src/narrative/branchingStorylineEngine.ts`
- Modify: `tests/branching-storylines.check.ts`

**Interfaces:**
- Consumes: `StorylineState`, `GameState`
- Produces: `EMERGENT_SUBPLOTS`, `getEligibleSubplots`, `advanceSubplotStage`

- [ ] **Step 1: Write the failing test**

```typescript
// in tests/branching-storylines.check.ts
it('triggers eligible emergent subplots based on state thresholds and day delay', () => {
  const mockState = {
    money: 3000,
    reputation: 25,
    currentDay: 15,
    studioRooms: [{ unlocked: true }],
  } as any;

  const eligible = getEligibleSubplots(mockState, []);
  assert.ok(eligible.length >= 1, 'Expected at least 1 eligible subplot');
  const bootleg = eligible.find(s => s.id === 'subplot_vinyl_bootleg');
  assert.ok(bootleg);
  assert.equal(bootleg.stages[0].options.length, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: FAIL (`getEligibleSubplots is not defined`)

- [ ] **Step 3: Write minimal implementation**

```typescript
// in src/narrative/branchingStorylineEngine.ts
export interface SubplotStage {
  stageNumber: 1 | 2;
  title: string;
  context: string;
  options: Array<{
    id: string;
    label: string;
    flavorText: string;
    storyFlag: string;
    consequences: {
      moneyDelta: number;
      repDelta: number;
      narrativeOutcome: string;
    };
  }>;
}

export interface EmergentSubplot {
  id: string;
  title: string;
  minDay: number;
  triggerCondition: (state: GameState) => boolean;
  daysBetweenStages: number;
  stages: [SubplotStage, SubplotStage];
}

export const EMERGENT_SUBPLOTS: readonly EmergentSubplot[] = [
  {
    id: 'subplot_vinyl_bootleg',
    title: 'The Bootleg Wax Pressing',
    minDay: 8,
    daysBetweenStages: 4,
    triggerCondition: (state) => state.reputation >= 20,
    stages: [
      {
        stageNumber: 1,
        title: 'Bootleg Vinyl in Record Stores',
        context: 'Uncredited white-label test pressings of your studio sessions are circulating in indie record shops.',
        options: [
          {
            id: 'bootleg_seize',
            label: 'Issue Cease & Desist: Seize Remaining Copies',
            flavorText: 'Protect your clients intellectual property legally.',
            storyFlag: 'seized_bootleg_wax',
            consequences: { moneyDelta: -200, repDelta: 8, narrativeOutcome: 'Artists thank you for guarding their masters.' },
          },
          {
            id: 'bootleg_embrace',
            label: 'Partner with the Pirate Distributor',
            flavorText: 'Cut a clandestine deal for a cut of the underground pressing royalties.',
            storyFlag: 'partnered_with_bootlegger',
            consequences: { moneyDelta: 1500, repDelta: -4, narrativeOutcome: 'A steady stream of cash flows in from grey market wax.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Bootleg Fallout: The Radio Exposure',
        context: 'Colleges and pirate radio stations begin playing the vinyl rip on heavy rotation.',
        options: [
          {
            id: 'bootleg_broadcast_license',
            label: 'Issue Official Master License',
            flavorText: 'Turn the pirate momentum into an official remastered vinyl release.',
            storyFlag: 'official_remaster_drop',
            consequences: { moneyDelta: 800, repDelta: 12, narrativeOutcome: 'The remaster becomes an underground collector staple.' },
          },
          {
            id: 'bootleg_radio_interview',
            label: 'Give Mystery Producer Interview',
            flavorText: 'Fuel the mythos without revealing full studio financials.',
            storyFlag: 'mystery_producer_lore',
            consequences: { moneyDelta: 0, repDelta: 15, narrativeOutcome: 'Your studio becomes a legendary word-of-mouth haven.' },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_ghost_producer',
    title: 'The Ghost Producer Ultimatum',
    minDay: 14,
    daysBetweenStages: 5,
    triggerCondition: (state) => state.money <= 6000,
    stages: [
      {
        stageNumber: 1,
        title: 'A Discreet Briefcase on the Console',
        context: 'A corporate scout offers $6,000 cash to produce a chart single with zero credits.',
        options: [
          {
            id: 'ghost_accept',
            label: 'Take the Cash Runway ($6,000)',
            flavorText: 'Fund your equipment overhead with secret corporate royalties.',
            storyFlag: 'ghost_producer_contract',
            consequences: { moneyDelta: 6000, repDelta: -5, narrativeOutcome: 'Your bank account swells, but your name is erased.' },
          },
          {
            id: 'ghost_decline',
            label: 'Reject the Buyout: "Credits or No Deal"',
            flavorText: 'Kick the scout out of the control room.',
            storyFlag: 'refused_ghost_contract',
            consequences: { moneyDelta: 0, repDelta: 10, narrativeOutcome: 'Your reputation for dignity spreads across local bands.' },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'The Ghost Credit Leak',
        context: 'A sound engineer spots your signature EQ curve on the charting track.',
        options: [
          {
            id: 'ghost_confirm_whispers',
            label: 'Leak Audio Stems Anonymously',
            flavorText: 'Let the forums deduce the real producer behind the hit.',
            storyFlag: 'unmasked_ghost_hit',
            consequences: { moneyDelta: 500, repDelta: 15, narrativeOutcome: 'Online sleuths verify your work, sparking major buzz.' },
          },
          {
            id: 'ghost_honor_nda',
            label: 'Honor the NDA Professionally',
            flavorText: 'Major labels appreciate a partner who never breaks silence.',
            storyFlag: 'trusted_corporate_partner',
            consequences: { moneyDelta: 2000, repDelta: 5, narrativeOutcome: 'More confidential high-paying work arrives.' },
          },
        ],
      },
    ],
  },
];

export const getEligibleSubplots = (
  state: GameState,
  activeOrResolvedIds: readonly string[]
): EmergentSubplot[] => {
  return EMERGENT_SUBPLOTS.filter(s => {
    if (activeOrResolvedIds.includes(s.id)) return false;
    if (state.currentDay < s.minDay) return false;
    return s.triggerCondition(state);
  });
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/narrative/branchingStorylineEngine.ts tests/branching-storylines.check.ts
git commit -m "feat(narrative): emergent subplots pool and multi-day eligibility evaluator"
```

---

### Task 4: GameState Schema, Save Migration & Lifecycle Hook

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/narrative/branchingStorylineEngine.ts`
- Modify: `src/hooks/useGameState.tsx`
- Modify: `src/hooks/useGameLogic.tsx`
- Test: `tests/branching-storylines.check.ts`

**Interfaces:**
- Consumes: `StorylineState`, `generateCampaignTree`
- Produces: `initializeStorylineState`, `resolveStorylineBranch`, `evaluateStorylineTick`

- [ ] **Step 1: Write the failing test**

```typescript
// in tests/branching-storylines.check.ts
it('initializes storylineState non-destructively for saves lacking it', () => {
  const legacySave = {
    selectedEra: 'vintage-warmth',
    playerData: { playstyle: 'purist' },
  } as any;

  const initialized = initializeStorylineState(legacySave);
  assert.ok(initialized.storylineState);
  assert.equal(initialized.storylineState.activeCampaignNodeId, 'act1_genesis');
  assert.equal(initialized.storylineState.campaignCompleted, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: FAIL (`initializeStorylineState is not defined`)

- [ ] **Step 3: Implement GameState extension & lifecycle methods**

In `src/types/game.ts`: Add `storylineState?: import('@/narrative/branchingStorylineEngine').StorylineState;` to `GameState`.

In `src/narrative/branchingStorylineEngine.ts`:
```typescript
export const initializeStorylineState = (state: GameState): GameState => {
  if (state.storylineState) return state;

  const runSeed = deriveStorylineRunSeed({
    saveSeed: (state as any).id || 4242,
    selectedEra: state.selectedEra || 'vintage-warmth',
    originId: (state.playerData as any)?.originId || 'tape-purist',
    playstyle: state.playerData?.playstyle || 'purist',
  });

  const tree = generateCampaignTree({
    runSeed,
    originId: (state.playerData as any)?.originId || 'tape-purist',
    selectedEra: state.selectedEra || 'vintage-warmth',
    playstyle: state.playerData?.playstyle || 'purist',
  });

  return {
    ...state,
    storylineState: {
      runSeed,
      activeCampaignNodeId: tree.nodes[0].id,
      campaignCompleted: false,
      branchHistory: [],
      activeSubplots: [],
      resolvedSubplotIds: [],
      storyFlags: {},
    },
  };
};

export const resolveStorylineBranch = (
  state: GameState,
  option: StorylineBranchOption
): GameState => {
  if (!state.storylineState) return state;
  const current = state.storylineState;
  const nextHistory: StorylineBranchRecord = {
    nodeId: current.activeCampaignNodeId,
    chosenOptionId: option.id,
    resolvedDay: state.currentDay,
    storyFlagGranted: option.storyFlag,
  };

  const isFinal = !option.targetNodeId || option.targetNodeId.startsWith('act3_');

  return {
    ...state,
    money: Math.max(0, state.money + option.consequences.moneyDelta),
    reputation: Math.max(0, state.reputation + option.consequences.repDelta),
    storylineState: {
      ...current,
      activeCampaignNodeId: option.targetNodeId,
      campaignCompleted: isFinal,
      branchHistory: [...current.branchHistory, nextHistory],
      storyFlags: {
        ...current.storyFlags,
        [option.storyFlag]: true,
      },
    },
  };
};
```

In `src/hooks/useGameState.tsx`: Call `initializeStorylineState` during save hydration.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/game.ts src/narrative/branchingStorylineEngine.ts src/hooks/useGameState.tsx tests/branching-storylines.check.ts
git commit -m "feat(narrative): gameState schema integration and save migration"
```

---

### Task 5: CareerHub Live Tracker & Storyline Branch Choice Modal UI

**Files:**
- Create: `src/components/modals/StorylineBranchModal.tsx`
- Modify: `src/components/CareerHub.tsx`
- Modify: `src/pages/Index.tsx`

**Interfaces:**
- Consumes: `StorylineNode`, `StorylineBranchOption`, `checkNodeCompletion`, `resolveStorylineBranch`
- Produces: Visual storyline card in `CareerHub`, interactive branching modal when act finishes

- [ ] **Step 1: Write component specification test**

```typescript
// in tests/branching-storylines.check.ts
it('resolves branch transitions cleanly updating state and tracking history', () => {
  const state = initializeStorylineState({
    money: 1000,
    reputation: 10,
    currentDay: 5,
    selectedEra: 'vintage-warmth',
    playerData: { playstyle: 'purist' },
  } as any);

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
  assert.equal(updated.money, 1200);
  assert.equal(updated.reputation, 15);
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `node --test tests/branching-storylines.check.ts`  
Expected: PASS

- [ ] **Step 3: Implement StorylineBranchModal & CareerHub UI**

Create `src/components/modals/StorylineBranchModal.tsx` utilizing `GamePanel` and `KenneyButton`, with crisp rival portrait/dialogue presentation and choice buttons.

Modify `src/components/CareerHub.tsx`:
- Add a Campaign Storyline strip displaying `Act N: <title>` and current objective progress.
- Include a button to inspect previous branch decisions and story flags.

In `src/pages/Index.tsx`:
- Trigger `StorylineBranchModal` when an Act completes.

- [ ] **Step 4: Verify build and runtime checks**

Run: `bash scripts/run-checks.sh`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/StorylineBranchModal.tsx src/components/CareerHub.tsx src/pages/Index.tsx tests/branching-storylines.check.ts
git commit -m "feat(ui): CareerHub storyline progress card and StorylineBranchModal"
```

---

### Task 6: Full Verification Suite & Invariant Checks

**Files:**
- Modify: `tests/branching-storylines.check.ts`
- Modify: `scripts/run-checks.sh`

**Interfaces:**
- Consumes: Complete narrative engine & game state integration
- Produces: Determinism, traversability, and non-mutation assertions in test runner

- [ ] **Step 1: Write comprehensive invariant tests**

Add tests to `tests/branching-storylines.check.ts` checking:
1. 100% Determinism across 50 simulated seeds.
2. Complete traversability of all 4 Act 3 finales.
3. No mutation of `GameState`.
4. Subplot progression and resolution.

- [ ] **Step 2: Add test suite to `scripts/run-checks.sh`**

Add `run_check tests/branching-storylines.check.ts "branching deterministic storylines"` to `scripts/run-checks.sh`.

- [ ] **Step 3: Run full validation**

Run: `bash scripts/run-checks.sh`  
Expected: All suites PASS with code 0.

- [ ] **Step 4: Commit**

```bash
git add tests/branching-storylines.check.ts scripts/run-checks.sh
git commit -m "test(narrative): complete test suite and run-checks integration for branching storylines"
```
