import { hashSeed, createSeededRandom, RandomSource, pickWithRandom } from '@/simulation/seededRandom';
import type { GameState } from '@/types/game';

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

export interface CampaignTree {
  runSeed: number;
  nodes: StorylineNode[];
}

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

export const deriveStorylineRunSeed = (ctx: RunSeedContext): number => {
  return hashSeed(`${ctx.saveSeed}:${ctx.selectedEra}:${ctx.originId}:${ctx.playstyle}`);
};

export const createNodeRng = (runSeed: number, nodeId: string, stepIndex = 0): RandomSource => {
  return createSeededRandom(hashSeed(`${runSeed}:${nodeId}:${stepIndex}`));
};

const RIVAL_NAMES = [
  'Silas Vance',
  'Chad Sterling',
  'Roxy Riot',
  'Dr. Vance Thorne',
  'Felix Belmont',
  'Victoria Chase',
] as const;

const RIVAL_STUDIOS = [
  'Black Wax Vault',
  'Apex Velocity',
  'The Anarchy Soundboard',
  'Neon Synthworks',
  'Velvet Static Collective',
] as const;

const GEAR_MOTIFS = [
  'discrete analog desk',
  'custom tube preamp',
  'vintage 2-inch tape reel',
  'analog plate reverb',
  'mastering limiter',
] as const;

const VENUES = [
  'The Marquee Cellar',
  'Warehouse 9',
  'The Electric Ballroom',
  'The Gold Coast Pavilion',
] as const;

export const renderProceduralTemplate = (template: string, seed: number): string => {
  const rng = createSeededRandom(seed);
  return template
    .replace(/\{rivalName\}/g, () => pickWithRandom(rng, RIVAL_NAMES))
    .replace(/\{rivalStudio\}/g, () => pickWithRandom(rng, RIVAL_STUDIOS))
    .replace(/\{gearMotif\}/g, () => pickWithRandom(rng, GEAR_MOTIFS))
    .replace(/\{legendaryVenue\}/g, () => pickWithRandom(rng, VENUES));
};

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
    loreBrief: renderProceduralTemplate(
      '{rivalName} claims your studio lacks acoustic depth. Establish your sonic footprint.',
      runSeed + 1,
    ),
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
      context:
        'Your initial sessions attract underground acclaim and commercial label attention. Choose your studio trajectory:',
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
    loreBrief: renderProceduralTemplate(
      '{rivalName} challenges your acoustic isolation at {legendaryVenue}.',
      runSeed + 10,
    ),
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
    loreBrief: renderProceduralTemplate(
      'The final showdown at {legendaryVenue}. All eyes are on your master.',
      runSeed + 30,
    ),
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

  const act3GoldenLegend = makeAct3Finale(
    'act3_golden_legend',
    'Act III: The Golden Reel Legend',
    'Master of the Vacuum Tube',
    90,
  );
  const act3SonicAlchemy = makeAct3Finale(
    'act3_sonic_alchemy',
    'Act III: The Sonic Alchemist Finale',
    'Acoustic Architect',
    88,
  );
  const act3Billboard = makeAct3Finale(
    'act3_billboard_monopoly',
    'Act III: The Billboard Monopoly',
    'Platinum Cartel Head',
    85,
  );
  const act3Rogue = makeAct3Finale(
    'act3_rogue_factory',
    'Act III: The Rogue Hit Factory',
    'Rebel Audio Kingpin',
    86,
  );

  return {
    runSeed,
    nodes: [act1, act2Purist, act2Commercial, act3GoldenLegend, act3SonicAlchemy, act3Billboard, act3Rogue],
  };
};

export const getStorylineNode = (tree: CampaignTree, nodeId: string): StorylineNode | undefined =>
  tree.nodes.find((n) => n.id === nodeId);

/** Uses financials.reports (ProjectReport) — not a fictional history array. */
export const checkNodeCompletion = (node: StorylineNode, state: GameState): boolean => {
  const req = node.requiredTarget;
  const reports = state.financials?.reports ?? [];

  if (req.minQuality && req.genre && req.sessionCount) {
    const matching = reports.filter(
      (h) =>
        req.genre!.some((g) => (h.genre || '').toLowerCase().includes(g.toLowerCase())) &&
        h.overallQualityScore >= req.minQuality!,
    ).length;
    if (matching < req.sessionCount) return false;
  } else if (req.minQuality) {
    const hasQuality = reports.some((h) => h.overallQualityScore >= req.minQuality!);
    if (!hasQuality) return false;
  }

  if (req.unlockedRooms) {
    const rooms = state.studioRooms?.filter((r) => r.unlocked).length ?? 0;
    if (rooms < req.unlockedRooms) return false;
  }

  if (req.moneyTarget && state.money < req.moneyTarget) return false;
  if (req.reputationTarget && state.reputation < req.reputationTarget) return false;

  return true;
};

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
        context:
          'Uncredited white-label test pressings of your studio sessions are circulating in indie record shops.',
        options: [
          {
            id: 'bootleg_seize',
            label: 'Issue Cease & Desist: Seize Remaining Copies',
            flavorText: 'Protect your clients intellectual property legally.',
            storyFlag: 'seized_bootleg_wax',
            consequences: {
              moneyDelta: -200,
              repDelta: 8,
              narrativeOutcome: 'Artists thank you for guarding their masters.',
            },
          },
          {
            id: 'bootleg_embrace',
            label: 'Partner with the Pirate Distributor',
            flavorText: 'Cut a clandestine deal for a cut of the underground pressing royalties.',
            storyFlag: 'partnered_with_bootlegger',
            consequences: {
              moneyDelta: 1500,
              repDelta: -4,
              narrativeOutcome: 'A steady stream of cash flows in from grey market wax.',
            },
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
            consequences: {
              moneyDelta: 800,
              repDelta: 12,
              narrativeOutcome: 'The remaster becomes an underground collector staple.',
            },
          },
          {
            id: 'bootleg_radio_interview',
            label: 'Give Mystery Producer Interview',
            flavorText: 'Fuel the mythos without revealing full studio financials.',
            storyFlag: 'mystery_producer_lore',
            consequences: {
              moneyDelta: 0,
              repDelta: 15,
              narrativeOutcome: 'Your studio becomes a legendary word-of-mouth haven.',
            },
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
            consequences: {
              moneyDelta: 6000,
              repDelta: -5,
              narrativeOutcome: 'Your bank account swells, but your name is erased.',
            },
          },
          {
            id: 'ghost_decline',
            label: 'Reject the Buyout: "Credits or No Deal"',
            flavorText: 'Kick the scout out of the control room.',
            storyFlag: 'refused_ghost_contract',
            consequences: {
              moneyDelta: 0,
              repDelta: 10,
              narrativeOutcome: 'Your reputation for dignity spreads across local bands.',
            },
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
            consequences: {
              moneyDelta: 500,
              repDelta: 15,
              narrativeOutcome: 'Online sleuths verify your work, sparking major buzz.',
            },
          },
          {
            id: 'ghost_honor_nda',
            label: 'Honor the NDA Professionally',
            flavorText: 'Major labels appreciate a partner who never breaks silence.',
            storyFlag: 'trusted_corporate_partner',
            consequences: {
              moneyDelta: 2000,
              repDelta: 5,
              narrativeOutcome: 'More confidential high-paying work arrives.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'subplot_demolition_salvage',
    title: 'The Demolition Salvage Bid',
    minDay: 10,
    daysBetweenStages: 3,
    triggerCondition: (state) => (state.studioRooms?.filter((r) => r.unlocked).length ?? 0) >= 1,
    stages: [
      {
        stageNumber: 1,
        title: 'Wrecking Crew Next Door',
        context: 'A neighbouring vintage studio is being demolished. Salvage rights go to the highest bidder.',
        options: [
          {
            id: 'salvage_bid_high',
            label: 'Outbid Everyone for the Isolation Booth',
            flavorText: 'Spend cash to rescue a legendary vocal booth before the wrecking ball.',
            storyFlag: 'salvaged_isolation_booth',
            consequences: {
              moneyDelta: -1800,
              repDelta: 6,
              narrativeOutcome: 'Your booth now carries decades of vocal ghosts.',
            },
          },
          {
            id: 'salvage_pass',
            label: 'Pass — Protect the Operating Budget',
            flavorText: 'Let the wreckers take the wood; keep payroll solvent.',
            storyFlag: 'passed_salvage_bid',
            consequences: {
              moneyDelta: 0,
              repDelta: 0,
              narrativeOutcome: 'Purists mutter, but your books stay clean.',
            },
          },
        ],
      },
      {
        stageNumber: 2,
        title: 'Salvage Aftermath',
        context: 'Either the booth arrives on a flatbed, or scavengers flip leftover gear on the grey market.',
        options: [
          {
            id: 'salvage_install',
            label: 'Install & Commission the Booth',
            flavorText: 'Spend a weekend wiring the rescued room into your floor plan.',
            storyFlag: 'commissioned_salvage_booth',
            consequences: {
              moneyDelta: -400,
              repDelta: 10,
              narrativeOutcome: 'Session singers book you just to stand in that booth.',
            },
          },
          {
            id: 'salvage_flip',
            label: 'Flip Residual Parts for Cash',
            flavorText: 'Sell leftover panels and patchbays to boutique builders.',
            storyFlag: 'flipped_salvage_parts',
            consequences: {
              moneyDelta: 900,
              repDelta: 2,
              narrativeOutcome: 'A tidy profit and a story for the lobby.',
            },
          },
        ],
      },
    ],
  },
] as const;

export const getEligibleSubplots = (
  state: GameState,
  activeOrResolvedIds: readonly string[],
): EmergentSubplot[] => {
  return EMERGENT_SUBPLOTS.filter((s) => {
    if (activeOrResolvedIds.includes(s.id)) return false;
    if (state.currentDay < s.minDay) return false;
    return s.triggerCondition(state);
  });
};

export const advanceSubplotStage = (
  active: ActiveSubplotState,
  choiceId: string,
  currentDay: number,
): ActiveSubplotState | { resolved: true; choiceId: string } => {
  if (active.currentStage === 1) {
    return {
      ...active,
      currentStage: 2,
      stage1ChoiceId: choiceId,
      startedDay: currentDay,
    };
  }
  return { resolved: true, choiceId };
};

const PENDING_BRANCH_FLAG = 'pending_branch_choice';

/** Resolve seed/origin/playstyle inputs with legacy-safe defaults. */
export const resolveStorylineContext = (state: GameState): {
  saveSeed: number | string;
  selectedEra: string;
  originId: string;
  playstyle: string;
} => ({
  saveSeed: state.saveSeed ?? 4242,
  selectedEra: state.selectedEra || 'vintage-warmth',
  originId: state.playerData?.originId || 'tape-purist',
  playstyle: state.playerData?.playstyle || 'purist',
});

/**
 * Non-destructive storyline hydration for legacy saves.
 * Idempotent: existing storylineState is returned unchanged.
 */
export const initializeStorylineState = (state: GameState): GameState => {
  if (state.storylineState) return state;

  const ctx = resolveStorylineContext(state);
  const runSeed = deriveStorylineRunSeed(ctx);
  const tree = generateCampaignTree({
    runSeed,
    originId: ctx.originId,
    selectedEra: ctx.selectedEra,
    playstyle: ctx.playstyle,
  });

  return {
    ...state,
    saveSeed: state.saveSeed ?? ctx.saveSeed,
    storylineState: {
      runSeed,
      activeCampaignNodeId: tree.nodes[0]?.id ?? 'act1_genesis',
      campaignCompleted: false,
      branchHistory: [],
      activeSubplots: [],
      resolvedSubplotIds: [],
      storyFlags: {},
    },
  };
};

/**
 * Apply a campaign branch choice: advances the active node, records history,
 * and applies option consequences. Does NOT mark the campaign complete —
 * Act 3 finales complete via evaluateStorylineTick after objectives land.
 */
export const resolveStorylineBranch = (
  state: GameState,
  option: StorylineBranchOption,
): GameState => {
  if (!state.storylineState) return state;
  const current = state.storylineState;
  const nextHistory: StorylineBranchRecord = {
    nodeId: current.activeCampaignNodeId,
    chosenOptionId: option.id,
    resolvedDay: state.currentDay,
    storyFlagGranted: option.storyFlag,
  };

  const nextFlags = { ...current.storyFlags, [option.storyFlag]: true };
  delete nextFlags[PENDING_BRANCH_FLAG];

  const creativeDelta = option.consequences.creativeCapitalDelta ?? 0;

  return {
    ...state,
    money: Math.max(0, state.money + option.consequences.moneyDelta),
    reputation: Math.max(0, state.reputation + option.consequences.repDelta),
    creativeCapital: Math.max(0, (state.creativeCapital ?? 0) + creativeDelta),
    storylineState: {
      ...current,
      activeCampaignNodeId: option.targetNodeId,
      campaignCompleted: false,
      branchHistory: [...current.branchHistory, nextHistory],
      storyFlags: nextFlags,
    },
  };
};

const grantNodeRewardOnce = (state: GameState, node: StorylineNode): GameState => {
  if (!state.storylineState) return state;
  const rewardedKey = `rewarded_${node.id}`;
  if (state.storylineState.storyFlags[rewardedKey]) return state;

  return {
    ...state,
    money: state.money + node.completionReward.money,
    reputation: state.reputation + node.completionReward.reputation,
    playerData: {
      ...state.playerData,
      xp: (state.playerData?.xp ?? 0) + node.completionReward.xp,
    },
    storylineState: {
      ...state.storylineState,
      storyFlags: {
        ...state.storylineState.storyFlags,
        [rewardedKey]: true,
        [node.completionReward.titleOrPerk]: true,
      },
    },
  };
};

/**
 * Daily / settlement lifecycle: hydrate if needed, spawn one eligible subplot,
 * and detect campaign-node completion (pending branch choice or Act 3 finale).
 */
export const evaluateStorylineTick = (state: GameState): GameState => {
  let next = initializeStorylineState(state);
  const story = next.storylineState;
  if (!story || story.campaignCompleted) return next;

  const ctx = resolveStorylineContext(next);
  const tree = generateCampaignTree({
    runSeed: story.runSeed,
    originId: ctx.originId,
    selectedEra: ctx.selectedEra,
    playstyle: ctx.playstyle,
  });

  // Spawn at most one new subplot when none are active.
  if (story.activeSubplots.length === 0) {
    const blocked = [...story.resolvedSubplotIds];
    const eligible = getEligibleSubplots(next, blocked);
    if (eligible.length > 0) {
      const pick = eligible[0];
      next = {
        ...next,
        storylineState: {
          ...story,
          activeSubplots: [
            {
              subplotId: pick.id,
              currentStage: 1,
              startedDay: next.currentDay,
            },
          ],
        },
      };
    }
  }

  const activeStory = next.storylineState!;
  const node = getStorylineNode(tree, activeStory.activeCampaignNodeId);
  if (!node || !checkNodeCompletion(node, next)) return next;

  next = grantNodeRewardOnce(next, node);
  const afterReward = next.storylineState!;

  if (node.branchDilemma) {
    return {
      ...next,
      storylineState: {
        ...afterReward,
        storyFlags: {
          ...afterReward.storyFlags,
          [PENDING_BRANCH_FLAG]: node.branchDilemma.id,
        },
      },
    };
  }

  // Act 3 finales have no dilemma — completing the objective ends the campaign.
  if (node.act === 3) {
    const cleared = { ...afterReward.storyFlags };
    delete cleared[PENDING_BRANCH_FLAG];
    return {
      ...next,
      storylineState: {
        ...afterReward,
        campaignCompleted: true,
        storyFlags: cleared,
      },
    };
  }

  return next;
};

/** Whether CareerHub / modal should surface a branch choice. */
export const hasPendingStorylineBranch = (state: GameState): boolean =>
  typeof state.storylineState?.storyFlags?.[PENDING_BRANCH_FLAG] === 'string';

/** Rebuild the campaign tree for the player's current storyline context. */
export const getCampaignTreeForState = (state: GameState): CampaignTree => {
  const hydrated = initializeStorylineState(state);
  const story = hydrated.storylineState!;
  const ctx = resolveStorylineContext(hydrated);
  return generateCampaignTree({
    runSeed: story.runSeed,
    originId: ctx.originId,
    selectedEra: ctx.selectedEra,
    playstyle: ctx.playstyle,
  });
};

/** Active campaign node for CareerHub / modal presentation. */
export const getActiveCampaignNode = (state: GameState): StorylineNode | null => {
  const hydrated = initializeStorylineState(state);
  const nodeId = hydrated.storylineState?.activeCampaignNodeId;
  if (!nodeId) return null;
  return getStorylineNode(getCampaignTreeForState(hydrated), nodeId) ?? null;
};

export interface PendingStorylineBranch {
  node: StorylineNode;
  dilemma: NonNullable<StorylineNode['branchDilemma']>;
}

/** Pending Act branch dilemma when `hasPendingStorylineBranch` is true. */
export const getPendingStorylineBranch = (state: GameState): PendingStorylineBranch | null => {
  if (!hasPendingStorylineBranch(state)) return null;
  const node = getActiveCampaignNode(state);
  if (!node?.branchDilemma) return null;
  return { node, dilemma: node.branchDilemma };
};

export interface StorylineObjectiveProgress {
  current: number;
  target: number;
  complete: boolean;
  label: string;
}

/**
 * Live objective fraction for CareerHub (mirrors checkNodeCompletion counters).
 * Prefer session/quality progress when present; otherwise rooms / money / rep.
 */
export const getStorylineObjectiveProgress = (
  node: StorylineNode,
  state: GameState,
): StorylineObjectiveProgress => {
  const req = node.requiredTarget;
  const reports = state.financials?.reports ?? [];
  const complete = checkNodeCompletion(node, state);

  if (req.minQuality && req.genre && req.sessionCount) {
    const matching = reports.filter(
      (h) =>
        req.genre!.some((g) => (h.genre || '').toLowerCase().includes(g.toLowerCase())) &&
        h.overallQualityScore >= req.minQuality!,
    ).length;
    return {
      current: Math.min(matching, req.sessionCount),
      target: req.sessionCount,
      complete,
      label: `${matching}/${req.sessionCount} sessions ≥ ${req.minQuality}`,
    };
  }

  if (req.unlockedRooms) {
    const rooms = state.studioRooms?.filter((r) => r.unlocked).length ?? 0;
    return {
      current: Math.min(rooms, req.unlockedRooms),
      target: req.unlockedRooms,
      complete,
      label: `${rooms}/${req.unlockedRooms} rooms`,
    };
  }

  if (req.moneyTarget) {
    const money = Math.max(0, state.money);
    return {
      current: Math.min(money, req.moneyTarget),
      target: req.moneyTarget,
      complete,
      label: `$${money.toLocaleString()} / $${req.moneyTarget.toLocaleString()}`,
    };
  }

  if (req.minQuality || req.reputationTarget) {
    const qualityHit = req.minQuality
      ? reports.some((h) => h.overallQualityScore >= req.minQuality!)
      : true;
    const repHit = req.reputationTarget ? state.reputation >= req.reputationTarget : true;
    const parts: string[] = [];
    let current = 0;
    let target = 0;
    if (req.minQuality) {
      target += 1;
      if (qualityHit) current += 1;
      const best = reports.reduce((m, h) => Math.max(m, h.overallQualityScore ?? 0), 0);
      parts.push(`Q ${best}/${req.minQuality}`);
    }
    if (req.reputationTarget) {
      target += 1;
      if (repHit) current += 1;
      parts.push(`Rep ${state.reputation}/${req.reputationTarget}`);
    }
    return {
      current,
      target: Math.max(1, target),
      complete,
      label: parts.join(' · ') || node.objectiveDescription,
    };
  }

  return {
    current: complete ? 1 : 0,
    target: 1,
    complete,
    label: node.objectiveDescription,
  };
};
