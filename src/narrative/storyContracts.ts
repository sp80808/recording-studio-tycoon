/**
 * Story contracts — one authored, rival-backed showpiece gig per active campaign node.
 *
 * The campaign used to be a checklist the player passively satisfied. A story contract puts the rival
 * *on the booking board*: pinned to the top, locked to a stake that matches the act (safe → ambitious →
 * moonshot), paying more the harder the bar. Failing costs reputation only (never cash), and up to
 * MAX_STORY_CONTRACT_OFFERS are offered per node so the story can't be farmed.
 *
 * Pure: deterministic from the run seed, no clocks.
 */
import type { GameState, GameNotification, Project, ProjectStage } from '@/types/game';
import type { ContractStake } from '@/rpg/contractStakes';
import { pickWithRandom } from '@/simulation/seededRandom';
import { getEraGigPool, type GigTemplate } from '@/data/gigTemplates';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import {
  createNodeRng,
  getAct1GenreFocus,
  getCampaignTreeForState,
  getStorylineNode,
  hasPendingStorylineBranch,
  resolveStorylineContext,
  type StorylineNode,
} from './branchingStorylineEngine';
import { getRivalForNode, toGameEraId } from './rivalCast';

export const MAX_STORY_CONTRACT_OFFERS = 3;

interface ActTerms {
  stake: ContractStake;
  difficulty: number;
  payoutMult: number;
  repMult: number;
  days: number;
}

export const STORY_ACT_TERMS: Record<1 | 2 | 3, ActTerms> = {
  1: { stake: 'safe', difficulty: 3, payoutMult: 1.3, repMult: 2, days: 4 },
  2: { stake: 'ambitious', difficulty: 5, payoutMult: 1.5, repMult: 3, days: 6 },
  3: { stake: 'moonshot', difficulty: 7, payoutMult: 2.0, repMult: 4, days: 8 },
};

const TITLES: Record<1 | 2 | 3, readonly string[]> = {
  1: ['The Dare', 'Open-Door Session', 'Prove-It Sides'],
  2: ['The Challenge Cut', 'Rivals in the Live Room', 'Line in the Sand'],
  3: ['The Final Master', 'One Reel, One Take', 'Last Word'],
};

export const isStoryContractFor = (project: Project, nodeId: string): boolean =>
  Boolean(project.isStoryContract) && project.storyNodeId === nodeId;

export const hasStoryContract = (state: GameState, nodeId: string): boolean =>
  [...(state.availableProjects ?? []), ...(state.activeProjects ?? []), ...(state.activeProject ? [state.activeProject] : [])].some(
    (p) => isStoryContractFor(p, nodeId),
  );

const offerFlag = (nodeId: string) => `contract_offered_${nodeId}`;

const pickTemplate = (genre: string, eraId: string, tier: 'starter' | 'advanced'): GigTemplate => {
  const era = ERA_DEFINITIONS.find((e) => e.id === eraId) ?? ERA_DEFINITIONS[0];
  const pool = getEraGigPool(eraId, tier, era.availableGenres);
  const match = pool.find((g) => g.template.genre === genre);
  return (match ?? pool.reduce((best, g) => (g.template.difficulty > best.template.difficulty ? g : best))).template;
};

/** Build the (deterministic) story contract for a node. */
export const buildStoryContract = (state: GameState, node: StorylineNode, offerIndex: number): Project => {
  const story = state.storylineState!;
  const ctx = resolveStorylineContext(state);
  const eraId = toGameEraId(state.currentEra || ctx.selectedEra);
  const terms = STORY_ACT_TERMS[node.act];
  const rival = getRivalForNode(node.id, ctx.playstyle);
  const rng = createNodeRng(story.runSeed, `contract:${node.id}`, offerIndex);

  const focus = node.requiredTarget.genre?.length ? node.requiredTarget.genre : getAct1GenreFocus(ctx.originId, eraId);
  const genre = pickWithRandom(rng, focus);
  const template = pickTemplate(genre, eraId, node.act === 1 ? 'starter' : 'advanced');
  const stages: ProjectStage[] = template.baseStages.map((s) => ({
    stageName: s.stageName,
    focusAreas: s.focusAreas,
    workUnitsBase: s.workUnitsBase,
    workUnitsCompleted: 0,
    completed: false,
  }));
  const title = `${rival.name}: ${pickWithRandom(rng, TITLES[node.act])}`;

  return {
    id: `story-${node.id}-${offerIndex}`,
    title,
    genre,
    clientType: 'Record Label',
    clientId: `rival-${rival.id}`,
    clientName: rival.name,
    difficulty: terms.difficulty,
    payoutBase: Math.round((template.basePayout * terms.payoutMult) / 10) * 10,
    repGainBase: Math.round(template.baseRep * terms.repMult),
    durationDaysTotal: terms.days,
    requiredSkills: { [genre]: Math.max(1, Math.floor(terms.difficulty / 2)) },
    matchRating: 'Good',
    stages,
    currentStageIndex: 0,
    completedStages: [],
    stake: terms.stake,
    stakeLocked: true,
    accumulatedCPoints: 0,
    accumulatedTPoints: 0,
    workSessionCount: 0,
    associatedBandId: `rival-${rival.id}`,
    focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
    isStoryContract: true,
    storyNodeId: node.id,
    rivalStudioId: rival.id,
  };
};

/**
 * Make sure the active campaign node has its story contract on the board (pinned first).
 * No-ops while a branch choice waits, after the campaign ends, while one is already offered/active,
 * or once MAX_STORY_CONTRACT_OFFERS have been made for the node.
 */
export const withStoryContract = (state: GameState): GameState => {
  const story = state.storylineState;
  if (!story || story.campaignCompleted || hasPendingStorylineBranch(state)) return state;
  // Never during the first session: the opening guide books the very first enquiry.
  if ((state.financials?.reports?.length ?? 0) < 1) return state;
  const node = getStorylineNode(getCampaignTreeForState(state), story.activeCampaignNodeId);
  if (!node || hasStoryContract(state, node.id)) return state;

  const offered = Number(story.storyFlags[offerFlag(node.id)] ?? 0);
  if (offered >= MAX_STORY_CONTRACT_OFFERS) return state;

  const contract = buildStoryContract(state, node, offered);
  const note: GameNotification = {
    id: `story-contract-${node.id}-${offered}`,
    message: `Story contract: ${contract.title} — ${node.rivalName} is watching.`,
    type: 'info',
    timestamp: state.currentDay * 86_400_000,
    priority: 'medium',
  };
  return {
    ...state,
    availableProjects: [contract, ...(state.availableProjects ?? [])],
    notifications: [...(state.notifications ?? []), note],
    storylineState: {
      ...story,
      storyFlags: { ...story.storyFlags, [offerFlag(node.id)]: offered + 1 },
    },
  };
};
