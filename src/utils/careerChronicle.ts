/**
 * Career chronicle derivations (#259, slice 1) — pure, deterministic, read-only.
 *
 * Everything here is computed from existing GameState. Nothing is persisted, so legacy saves with sparse history
 * degrade to empty lists / generic copy instead of needing a migration.
 */
import type { GameState } from '@/types/game';
import { getPremisesDef, getPremisesTier } from '@/rpg/premises';
import { getActiveCampaignNode, getStorylineObjectiveProgress, hasPendingStorylineBranch } from '@/narrative/branchingStorylineEngine';

type IdentityState = Pick<GameState, 'playerData' | 'financials'> &
  Partial<Pick<GameState, 'clientRelationships' | 'premisesTier' | 'hiredStaff' | 'studioRooms' | 'chartRun' | 'reputation' | 'storylineState'>>;

const SKILL_LABEL: Record<string, string> = {
  songwriting: 'songwriting',
  rhythm: 'rhythm work',
  tracking: 'tracking',
  mixing: 'mixing',
  mastering: 'mastering',
  tapeSplicing: 'tape splicing',
  vocalComping: 'vocal comping',
  soundDesign: 'sound design',
  sampleWarping: 'sample warping',
  management: 'studio management',
};

const PLAYSTYLE_PATH: Record<string, string> = {
  purist: 'Analog Craft path',
  'hit-maker': 'Commercial Scale path',
  underground: 'Underground Scene path',
  'sound-lab': 'Sound Lab path',
};

export const careerTitle = (level: number): string =>
  level >= 12 ? 'Industry legend' : level >= 8 ? 'Studio visionary' : level >= 5 ? 'Hitmaker' : level >= 3 ? 'Rising producer' : 'Independent producer';

/** Genres ranked by delivered sessions, ties broken alphabetically for determinism. */
export const topGenres = (state: Pick<GameState, 'financials'>, limit = 2): string[] => {
  const counts = new Map<string, number>();
  for (const r of state.financials?.reports ?? []) {
    if (r.genre) counts.set(r.genre, (counts.get(r.genre) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([g]) => g);
};

/** The highest-level producer skill, or null while every skill is still level 1 or below. */
export const strongestSkill = (state: Pick<GameState, 'playerData'>): { key: string; label: string; level: number } | null => {
  let best: { key: string; level: number } | null = null;
  for (const [key, skill] of Object.entries(state.playerData?.skills ?? {})) {
    const level = skill?.level ?? 0;
    if (level > 1 && (!best || level > best.level)) best = { key, level };
  }
  return best ? { ...best, label: SKILL_LABEL[best.key] ?? best.key } : null;
};

const loyalClients = (state: IdentityState) =>
  Object.values(state.clientRelationships ?? {}).filter((c) => c.tier === 'Loyal' || c.tier === 'Advocate');

export interface KnownFor {
  /** Display line, e.g. "Known for: pop sessions · 3 loyal clients · Analog Craft path". */
  line: string;
  parts: string[];
}

/** "Known for" line derived from actual play (#259 §1). Always returns at least one part. */
export const deriveKnownFor = (state: IdentityState): KnownFor => {
  const parts: string[] = [];
  const genres = topGenres(state, 1);
  if (genres[0]) parts.push(`${genres[0].toLowerCase()} sessions`);
  const skill = strongestSkill(state);
  if (skill) parts.push(`${skill.label} (Lv ${skill.level})`);
  const loyal = loyalClients(state).length;
  if (loyal > 0) parts.push(`${loyal} loyal client${loyal === 1 ? '' : 's'}`);
  const charting = state.chartRun?.length ?? 0;
  if (charting > 0) parts.push(`${charting} charting release${charting === 1 ? '' : 's'}`);
  const path = PLAYSTYLE_PATH[state.playerData?.playstyle ?? ''];
  if (path) parts.push(path);
  if (parts.length === 0) parts.push('a career still being written');
  return { line: `Known for: ${parts.slice(0, 3).join(' · ')}`, parts };
};

export interface CareerMilestone {
  id: string;
  title: string;
  detail: string;
}

/**
 * Meaningful career firsts reconstructed from state, in rough career order. Routine sessions never appear.
 * Undated by design: the live state does not record when most firsts happened.
 */
export const deriveCareerMilestones = (state: IdentityState): CareerMilestone[] => {
  const out: CareerMilestone[] = [];
  const reports = state.financials?.reports ?? [];
  const paid = reports.find((r) => (r.moneyGained ?? 0) > 0);
  if (paid) out.push({ id: 'first-paid-session', title: 'First paid session', detail: `${paid.projectTitle} brought in the first real money.` });
  const rels = Object.values(state.clientRelationships ?? {});
  const repeat = rels
    .filter((c) => c.sessionsCompleted >= 2)
    .sort((a, b) => b.sessionsCompleted - a.sessionsCompleted || a.clientName.localeCompare(b.clientName))[0];
  if (repeat) out.push({ id: 'first-repeat-client', title: 'Someone came back', detail: `${repeat.clientName} booked again (${repeat.sessionsCompleted} sessions).` });
  const poor = reports.find((r) => r.overallQualityScore < 40);
  if (poor) out.push({ id: 'first-poor-session', title: 'A session that went wrong', detail: `${poor.projectTitle} missed the mark. The studio kept going.` });
  const firstHire = state.hiredStaff?.[0];
  if (firstHire) out.push({ id: 'first-staff-hire', title: 'First hire', detail: `${firstHire.name} joined the crew.` });
  if ((state.studioRooms ?? []).filter((r) => r.unlocked).length > 1) out.push({ id: 'first-room-added', title: 'A second room', detail: 'The studio grew beyond a single console.' });
  if (getPremisesTier(state) > 0) out.push({ id: 'first-premises-move', title: 'Moved out of the borrowed room', detail: `Now operating from a ${getPremisesDef(state).name}.` });
  const loyal = loyalClients(state)[0];
  if (loyal) out.push({ id: 'first-loyal-client', title: 'A loyal client', detail: `${loyal.clientName} trusts the studio with their records.` });
  const chart = state.chartRun?.[0];
  if (chart) out.push({ id: 'first-charting-release', title: 'First charting release', detail: `${chart.title} reached #${chart.peak} on ${chart.chartName}.` });
  if ((state.storylineState?.branchHistory?.length ?? 0) > 0) out.push({ id: 'first-story-choice', title: 'A defining choice', detail: 'You picked a path that shaped the studio story.' });
  return out;
};

export interface CareerTarget {
  type: 'branch' | 'campaign' | 'premises' | 'reputation';
  label: string;
  detail: string;
}

/** One medium-term ambition, separate from `resolveCareerNextAction()`'s immediate action (#259 §9). */
export const resolveCareerTarget = (state: GameState): CareerTarget => {
  if (hasPendingStorylineBranch(state)) {
    return { type: 'branch', label: 'Choose your path', detail: 'An act objective is met. The decision is waiting.' };
  }
  const node = getActiveCampaignNode(state);
  if (node && !state.storylineState?.campaignCompleted) {
    const progress = getStorylineObjectiveProgress(node, state);
    const next = progress.requirements.find((r) => !r.done);
    return {
      type: 'campaign',
      label: `Finish this act: ${node.title.replace(/^Act [IVX]+:\s*/, '')}`,
      detail: next ? next.label : node.objectiveDescription,
    };
  }
  const tier = getPremisesTier(state);
  if (tier < 3) {
    const nextDef = getPremisesDef({ premisesTier: tier + 1 });
    return { type: 'premises', label: `Move up to a ${nextDef.name}`, detail: 'More rooms and crew capacity once the studio can afford it.' };
  }
  return { type: 'reputation', label: 'Build the studio legacy', detail: `Reputation ${state.reputation ?? 0}. Keep delivering strong records.` };
};
