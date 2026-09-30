import { hashSeed, createSeededRandom, RandomSource, pickWithRandom } from '@/simulation/seededRandom';
import type { GameState } from '@/types/game';
import { gradeQuality } from '@/rpg/rankChase';
import { getEraGigPool } from '@/data/gigTemplates';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import { PRODUCER_ORIGINS } from '@/narrative/characterOrigins';
import { getRivalForNode, getRivalLines, toGameEraId } from '@/narrative/rivalCast';
import { ERA_SUBPLOTS } from '@/narrative/subplotCatalog';
import { CALLBACK_SUBPLOTS } from '@/narrative/callbackSubplots';

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
    /** Producer level (playerData.level). */
    minLevel?: number;
    /** Hired staff headcount. */
    minStaff?: number;
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

export type ChronicleKind = 'campaign' | 'subplot' | 'ending';

/** One line of the studio's story so far — shown in CareerHub's chronicle. */
export interface ChronicleEntry {
  day: number;
  kind: ChronicleKind;
  title: string;
  outcome: string;
}

export interface StorylineState {
  runSeed: number;
  activeCampaignNodeId: string;
  campaignCompleted: boolean;
  branchHistory: StorylineBranchRecord[];
  activeSubplots: ActiveSubplotState[];
  resolvedSubplotIds: string[];
  storyFlags: Record<string, boolean | number | string>;
  /** Player-facing log of resolved beats (newest last). Absent on older saves. */
  chronicle?: ChronicleEntry[];
  /** Day the last subplot ended — drives the spawn cooldown. */
  lastSubplotEndDay?: number;
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
      creativeCapitalDelta?: number;
      xpDelta?: number;
      narrativeOutcome: string;
    };
  }>;
}

export interface EmergentSubplot {
  id: string;
  title: string;
  /** Short category line shown above the title ("LEGAL // SAMPLE CLEARANCE"). */
  kicker?: string;
  /** Progression era ids this can happen in. Absent = any era. */
  eras?: readonly string[];
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

/** Quality bar for Act I sessions: a confident B-rank (B starts at 55) — reachable on a level-1 studio with good takes. */
export const ACT1_MIN_QUALITY = 60;

const normalizeGenreKey = (genre: string): string => genre.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Loose genre comparison shared by objectives and reports: "Hip Hop" ≡ "Hip-Hop", "Indie" ⊂ "Indie Pop". */
export const genreMatchesFocus = (reportGenre: string | undefined, focusGenre: string): boolean =>
  normalizeGenreKey(reportGenre || '').includes(normalizeGenreKey(focusGenre));

/**
 * Act I genre focus — the origin's signature sound, restricted to genres the era's board actually offers.
 * Falls back to the era's own genres so the objective is never impossible (a Bedroom Beatmaker who starts in
 * 1960 is asked for the era's sound, not for Trap).
 */
export const getAct1GenreFocus = (originId: string, eraId: string): string[] => {
  const gameEra = toGameEraId(eraId);
  const era = ERA_DEFINITIONS.find((e) => e.id === gameEra) ?? ERA_DEFINITIONS[0];
  const bookable = new Map<string, string>();
  for (const { template } of getEraGigPool(gameEra, 'starter', era.availableGenres)) {
    bookable.set(normalizeGenreKey(template.genre), template.genre);
  }
  const signature = PRODUCER_ORIGINS.find((o) => o.id === originId)?.signatureGenres ?? [];
  const focus: string[] = [];
  for (const genre of signature) {
    const bookableName = bookable.get(normalizeGenreKey(genre));
    if (bookableName && !focus.includes(bookableName)) focus.push(bookableName);
    if (focus.length >= 4) break;
  }
  for (const genre of era.availableGenres) {
    if (focus.length >= 3) break;
    if (!focus.includes(genre)) focus.push(genre);
  }
  return focus;
};

const rankLabel = (quality: number): string => {
  const { rank } = gradeQuality(quality);
  return rank === 'D' || rank === 'C' ? `${rank}-rank` : `${rank}-rank or better`;
};

/** Truthful, requirement-derived objective sentence (never hand-written, so it can't drift from the check). */
export const describeRequirements = (req: StorylineNode['requiredTarget']): string => {
  const parts: string[] = [];
  if (req.sessionCount && req.genre?.length && req.minQuality) {
    parts.push(
      `Complete ${req.sessionCount} sessions in ${req.genre.join('/')} at Quality ${req.minQuality}+ (${rankLabel(req.minQuality)})`,
    );
  } else if (req.minQuality) {
    parts.push(`Land a session at Quality ${req.minQuality}+ (${rankLabel(req.minQuality)})`);
  }
  if (req.unlockedRooms) parts.push(`own ${req.unlockedRooms} studio rooms`);
  if (req.minLevel) parts.push(`reach Producer Level ${req.minLevel}`);
  if (req.minStaff) parts.push(`keep ${req.minStaff} staff on the payroll`);
  if (req.moneyTarget) parts.push(`hold $${req.moneyTarget.toLocaleString()} in cash`);
  if (req.reputationTarget) parts.push(`reach Reputation ${req.reputationTarget}`);
  const [first, ...rest] = parts;
  if (!first) return 'Keep recording — the story is listening.';
  const sentence = rest.length === 0 ? first : `${first}, ${rest.slice(0, -1).join(', ')}${rest.length > 1 ? ' and ' : ''}${rest[rest.length - 1]}`;
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
};

export const generateCampaignTree = (ctx: {
  runSeed: number;
  originId: string;
  selectedEra: string;
  playstyle: string;
}): CampaignTree => {
  const { runSeed, originId, playstyle } = ctx;
  const genreFocus = getAct1GenreFocus(originId, ctx.selectedEra);

  const rivalFor = (nodeId: string) => getRivalForNode(nodeId, playstyle);
  const nodeRival = (nodeId: string) => {
    const rival = rivalFor(nodeId);
    return { rival, lines: getRivalLines(rival.id) };
  };

  const act1Rival = nodeRival('act1_genesis');
  const act1Req: StorylineNode['requiredTarget'] = {
    genre: genreFocus,
    minQuality: ACT1_MIN_QUALITY,
    sessionCount: 3,
  };
  const act1: StorylineNode = {
    id: 'act1_genesis',
    act: 1,
    branchPath: 'root',
    title: `Act I: The Sound of ${act1Rival.rival.name}`,
    loreBrief: `${act1Rival.rival.headProducer} — ${act1Rival.rival.epithet} — has heard your first sessions and is not impressed. “${act1Rival.rival.catchphrase}” Establish your sonic footprint.`,
    objectiveDescription: describeRequirements(act1Req),
    rivalStudioId: act1Rival.rival.id,
    rivalName: act1Rival.rival.headProducer,
    rivalDialogue: act1Rival.lines.taunt,
    requiredTarget: act1Req,
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

  const purist = nodeRival('act2_purist');
  const act2PuristReq: StorylineNode['requiredTarget'] = { unlockedRooms: 2, minLevel: 4 };
  const act2Purist: StorylineNode = {
    id: 'act2_purist',
    act: 2,
    branchPath: 'act2_purist',
    title: 'Act II: The Acoustic Sanctuary',
    loreBrief: renderProceduralTemplate(
      `${purist.rival.headProducer} challenges your acoustic isolation at {legendaryVenue}.`,
      runSeed + 10,
    ),
    objectiveDescription: describeRequirements(act2PuristReq),
    rivalStudioId: purist.rival.id,
    rivalName: purist.rival.headProducer,
    rivalDialogue: purist.lines.challenge,
    requiredTarget: act2PuristReq,
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
          flavorText: 'Fuse vacuum tubes with modular DSP acoustic enhancement.',
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

  const commercial = nodeRival('act2_commercial');
  const act2CommercialReq: StorylineNode['requiredTarget'] = { moneyTarget: 12000, minStaff: 2 };
  const act2Commercial: StorylineNode = {
    id: 'act2_commercial',
    act: 2,
    branchPath: 'act2_commercial',
    title: 'Act II: The Billboard Syndicate',
    loreBrief: `${commercial.rival.name} tries to poach your top regular artists. “${commercial.rival.catchphrase}”`,
    objectiveDescription: describeRequirements(act2CommercialReq),
    rivalStudioId: commercial.rival.id,
    rivalName: commercial.rival.headProducer,
    rivalDialogue: commercial.lines.challenge,
    requiredTarget: act2CommercialReq,
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

  const makeAct3Finale = (id: string, title: string, perk: string, targetQual: number): StorylineNode => {
    const { rival, lines } = nodeRival(id);
    const req: StorylineNode['requiredTarget'] = { minQuality: targetQual, reputationTarget: 50 };
    return {
      id,
      act: 3,
      branchPath: id,
      title,
      loreBrief: renderProceduralTemplate(
        `The final showdown with ${rival.headProducer} at {legendaryVenue}. All eyes are on your master.`,
        runSeed + 30,
      ),
      objectiveDescription: describeRequirements(req),
      rivalStudioId: rival.id,
      rivalName: rival.headProducer,
      rivalDialogue: lines.showdown,
      requiredTarget: req,
      completionReward: {
        money: 10000,
        reputation: 60,
        xp: 2500,
        titleOrPerk: perk,
      },
    };
  };

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

const matchingSessionCount = (req: StorylineNode['requiredTarget'], state: GameState): number => {
  const reports = state.financials?.reports ?? [];
  return reports.filter(
    (h) =>
      (req.genre ?? []).some((g) => genreMatchesFocus(h.genre, g)) &&
      h.overallQualityScore >= (req.minQuality ?? 0),
  ).length;
};

const bestQuality = (state: GameState): number =>
  (state.financials?.reports ?? []).reduce((m, h) => Math.max(m, h.overallQualityScore ?? 0), 0);

/** One line of the objective checklist — CareerHub renders these so the player sees *every* requirement. */
export interface ObjectiveRequirement {
  id: 'sessions' | 'quality' | 'rooms' | 'level' | 'staff' | 'money' | 'reputation';
  label: string;
  current: number;
  target: number;
  done: boolean;
}

/** Every requirement of a node as a checklist. Single source of truth for completion *and* progress UI. */
export const getObjectiveRequirements = (node: StorylineNode, state: GameState): ObjectiveRequirement[] => {
  const req = node.requiredTarget;
  const out: ObjectiveRequirement[] = [];
  const push = (id: ObjectiveRequirement['id'], label: string, current: number, target: number) =>
    out.push({ id, label, current: Math.min(current, target), target, done: current >= target });

  if (req.minQuality && req.genre && req.sessionCount) {
    const matching = matchingSessionCount(req, state);
    push('sessions', `${Math.min(matching, req.sessionCount)}/${req.sessionCount} sessions ≥ ${req.minQuality}`, matching, req.sessionCount);
  } else if (req.minQuality) {
    const best = bestQuality(state);
    push('quality', `Best session ${best}/${req.minQuality}`, best, req.minQuality);
  }
  if (req.unlockedRooms) {
    const rooms = state.studioRooms?.filter((r) => r.unlocked).length ?? 0;
    push('rooms', `${rooms}/${req.unlockedRooms} rooms`, rooms, req.unlockedRooms);
  }
  if (req.minLevel) {
    const level = state.playerData?.level ?? 1;
    push('level', `Level ${level}/${req.minLevel}`, level, req.minLevel);
  }
  if (req.minStaff) {
    const staff = state.hiredStaff?.length ?? 0;
    push('staff', `${staff}/${req.minStaff} staff`, staff, req.minStaff);
  }
  if (req.moneyTarget) {
    const money = Math.max(0, state.money ?? 0);
    push('money', `$${money.toLocaleString()} / $${req.moneyTarget.toLocaleString()}`, money, req.moneyTarget);
  }
  if (req.reputationTarget) {
    const rep = state.reputation ?? 0;
    push('reputation', `Rep ${rep}/${req.reputationTarget}`, rep, req.reputationTarget);
  }
  return out;
};

/** Uses financials.reports (ProjectReport) — not a fictional history array. */
export const checkNodeCompletion = (node: StorylineNode, state: GameState): boolean =>
  getObjectiveRequirements(node, state).every((r) => r.done);

const LEGACY_SUBPLOTS: readonly EmergentSubplot[] = [
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

/** Every emergent subplot: the original three plus the era-aware catalog. */
export const EMERGENT_SUBPLOTS: readonly EmergentSubplot[] = [...LEGACY_SUBPLOTS, ...ERA_SUBPLOTS, ...CALLBACK_SUBPLOTS];

/** Era the player is living in right now (progression era id). */
const currentGameEra = (state: GameState): string => toGameEraId(state.currentEra || state.selectedEra);

export const getEligibleSubplots = (
  state: GameState,
  activeOrResolvedIds: readonly string[],
): EmergentSubplot[] => {
  const era = currentGameEra(state);
  return EMERGENT_SUBPLOTS.filter((s) => {
    if (activeOrResolvedIds.includes(s.id)) return false;
    if (s.eras && !s.eras.includes(era)) return false;
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

export type SubplotOption = SubplotStage['options'][number];

export interface PendingSubplotEvent {
  subplot: EmergentSubplot;
  stage: SubplotStage;
  active: ActiveSubplotState;
}

export const getSubplotById = (id: string): EmergentSubplot | undefined =>
  EMERGENT_SUBPLOTS.find((s) => s.id === id);

/**
 * The subplot beat waiting for the player, if any. Stage 1 is due the moment a subplot spawns;
 * stage 2 is due `daysBetweenStages` after stage 1 was resolved. Never returns while a campaign branch is pending
 * so the player only ever faces one decision at a time.
 */
export const getPendingSubplotEvent = (state: GameState): PendingSubplotEvent | null => {
  const story = state.storylineState;
  if (!story || story.campaignCompleted && story.activeSubplots.length === 0) return null;
  if (typeof story.storyFlags[PENDING_BRANCH_FLAG] === 'string') return null;
  const active = story.activeSubplots[0];
  if (!active) return null;
  const subplot = getSubplotById(active.subplotId);
  if (!subplot) return null;
  const due = active.currentStage === 1 || state.currentDay >= active.startedDay + subplot.daysBetweenStages;
  if (!due) return null;
  return { subplot, stage: subplot.stages[active.currentStage - 1], active };
};

/** Cost gate for a subplot option: a negative moneyDelta must be payable in full. */
export const canAffordSubplotOption = (state: GameState, option: SubplotOption): boolean =>
  option.consequences.moneyDelta >= 0 || (state.money ?? 0) + option.consequences.moneyDelta >= 0;

/**
 * Apply a subplot choice: consequences land, flag is granted, the subplot advances to stage 2 or resolves
 * (moving to `resolvedSubplotIds`, stamping the cooldown day and writing the chronicle). Unknown or unaffordable
 * choices return the state unchanged.
 */
export const resolveSubplotChoice = (state: GameState, optionId: string): GameState => {
  const pending = getPendingSubplotEvent(state);
  if (!pending || !state.storylineState) return state;
  const option = pending.stage.options.find((o) => o.id === optionId);
  if (!option || !canAffordSubplotOption(state, option)) return state;

  const story = state.storylineState;
  const { consequences } = option;
  const advanced = advanceSubplotStage(pending.active, option.id, state.currentDay);
  const resolved = 'resolved' in advanced;

  let nextStory: StorylineState = {
    ...story,
    storyFlags: { ...story.storyFlags, [option.storyFlag]: true },
    activeSubplots: resolved ? [] : [advanced],
    resolvedSubplotIds: resolved ? [...story.resolvedSubplotIds, pending.subplot.id] : story.resolvedSubplotIds,
    lastSubplotEndDay: resolved ? state.currentDay : story.lastSubplotEndDay,
  };
  nextStory = withChronicle(nextStory, {
    day: state.currentDay,
    kind: 'subplot',
    title: `${pending.subplot.title}${resolved ? '' : ' — part 1'}`,
    outcome: consequences.narrativeOutcome,
  });

  return {
    ...state,
    money: Math.max(0, state.money + consequences.moneyDelta),
    reputation: Math.max(0, state.reputation + consequences.repDelta),
    creativeCapital: Math.max(0, (state.creativeCapital ?? 0) + (consequences.creativeCapitalDelta ?? 0)),
    playerData: consequences.xpDelta
      ? { ...state.playerData, xp: (state.playerData?.xp ?? 0) + consequences.xpDelta }
      : state.playerData,
    storylineState: nextStory,
  };
};

const PENDING_BRANCH_FLAG = 'pending_branch_choice';

/** Minimum quiet days between one subplot ending and the next beginning. */
export const SUBPLOT_COOLDOWN_DAYS = 4;
const CHRONICLE_LIMIT = 60;

const withChronicle = (story: StorylineState, entry: ChronicleEntry): StorylineState => ({
  ...story,
  chronicle: [...(story.chronicle ?? []), entry].slice(-CHRONICLE_LIMIT),
});

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
    storylineState: withChronicle(
      {
        ...current,
        activeCampaignNodeId: option.targetNodeId,
        campaignCompleted: false,
        branchHistory: [...current.branchHistory, nextHistory],
        storyFlags: nextFlags,
      },
      {
        day: state.currentDay,
        kind: 'campaign',
        title: option.label,
        outcome: option.consequences.narrativeOutcome,
      },
    ),
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
    storylineState: withChronicle(
      {
        ...state.storylineState,
        storyFlags: {
          ...state.storylineState.storyFlags,
          [rewardedKey]: true,
          [node.completionReward.titleOrPerk]: true,
        },
      },
      {
        day: state.currentDay,
        kind: 'campaign',
        title: `${node.title} — complete`,
        outcome: `Earned the title “${node.completionReward.titleOrPerk}”.`,
      },
    ),
  };
};

/**
 * Daily / settlement lifecycle: hydrate if needed, spawn one eligible subplot,
 * and detect campaign-node completion (pending branch choice or Act 3 finale).
 */
export const evaluateStorylineTick = (state: GameState): GameState => {
  let next = initializeStorylineState(state);
  if (!next.storylineState) return next;

  // Drop subplots that no longer exist in the catalog so a stale save can't block the story.
  const liveSubplots = next.storylineState.activeSubplots.filter((a) => getSubplotById(a.subplotId));
  if (liveSubplots.length !== next.storylineState.activeSubplots.length) {
    next = { ...next, storylineState: { ...next.storylineState, activeSubplots: liveSubplots } };
  }
  const story = next.storylineState!;

  // Spawn at most one new subplot when none are active, no branch choice is waiting,
  // and the last story beat has had time to breathe. The pick is seeded from the run seed and the
  // number of resolved subplots, so the same save always tells the same story.
  const branchWaiting = typeof story.storyFlags[PENDING_BRANCH_FLAG] === 'string';
  const cooledDown = next.currentDay - (story.lastSubplotEndDay ?? -SUBPLOT_COOLDOWN_DAYS) >= SUBPLOT_COOLDOWN_DAYS;
  if (story.activeSubplots.length === 0 && !branchWaiting && cooledDown) {
    const eligible = getEligibleSubplots(next, story.resolvedSubplotIds);
    if (eligible.length > 0) {
      const rng = createNodeRng(story.runSeed, 'subplot-spawn', story.resolvedSubplotIds.length);
      const pick = pickWithRandom(rng, eligible);
      next = {
        ...next,
        storylineState: {
          ...story,
          activeSubplots: [{ subplotId: pick.id, currentStage: 1, startedDay: next.currentDay }],
        },
      };
    }
  }

  // The campaign is over but the studio's life goes on: subplots keep spawning, objectives are done.
  if (story.campaignCompleted) return next;

  const ctx = resolveStorylineContext(next);
  const tree = generateCampaignTree({
    runSeed: story.runSeed,
    originId: ctx.originId,
    selectedEra: ctx.selectedEra,
    playstyle: ctx.playstyle,
  });

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
      storylineState: withChronicle(
        {
          ...afterReward,
          campaignCompleted: true,
          storyFlags: cleared,
        },
        {
          day: next.currentDay,
          kind: 'ending',
          title: 'The campaign ends',
          outcome: `${node.rivalName} concedes the room to you.`,
        },
      ),
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
  /** Full checklist (every requirement of the node). */
  requirements: ObjectiveRequirement[];
}

/**
 * Live objective fraction for CareerHub. The headline `current/target/label` describes the *first unmet*
 * requirement (or the first one when all are met); `requirements` carries the whole checklist.
 */
export const getStorylineObjectiveProgress = (
  node: StorylineNode,
  state: GameState,
): StorylineObjectiveProgress => {
  const requirements = getObjectiveRequirements(node, state);
  const complete = requirements.every((r) => r.done);
  const headline = requirements.find((r) => !r.done) ?? requirements[0];
  if (!headline) {
    return { current: complete ? 1 : 0, target: 1, complete, label: node.objectiveDescription, requirements };
  }
  return {
    current: headline.current,
    target: headline.target,
    complete,
    label: headline.label,
    requirements,
  };
};
