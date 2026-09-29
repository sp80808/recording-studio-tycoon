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
