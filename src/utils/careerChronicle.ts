/**
 * Career chronicle derivations (#259, slice 1) — pure, deterministic, read-only.
 *
 * Everything here is computed from existing GameState. Nothing is persisted, so legacy saves with sparse history
 * degrade to empty lists / generic copy instead of needing a migration.
 */
import type { GameState } from '@/types/game';
import { formatMoney } from '@/rpg/cities';
import { getPremisesDef, getPremisesTier } from '@/rpg/premises';
import { getActiveCampaignNode, getCampaignTreeForState, getStorylineObjectiveProgress, hasPendingStorylineBranch } from '@/narrative/branchingStorylineEngine';

type IdentityState = Pick<GameState, 'playerData' | 'financials'> &
  Partial<Pick<GameState, 'clientRelationships' | 'premisesTier' | 'hiredStaff' | 'studioRooms' | 'chartRun' | 'firstChart' | 'reputation' | 'storylineState' | 'cityId' | 'currentEra'>>;

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
  const chart = state.firstChart ?? state.chartRun?.[0];
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

// ---- Slice 2: chapters, pinned defining moments, branch consequences (#259) ----

export interface CareerChapter {
  id: string;
  title: string;
  blurb: string;
}

/** Ordered chapters. A run reaches the highest one whose trigger holds; earlier ones are always "behind" the player. */
export const CAREER_CHAPTERS: readonly CareerChapter[] = [
  { id: 'bedroom', title: 'The Bedroom Years', blurb: 'One console, a borrowed room, and something to prove.' },
  { id: 'first-clients', title: 'First Paying Clients', blurb: 'Real money changed hands. People trust you with their songs.' },
  { id: 'sound', title: 'Finding Your Sound', blurb: 'The records start to sound like you.' },
  { id: 'real-studio', title: 'First Real Studio', blurb: 'You moved out of the borrowed room.' },
  { id: 'breakthrough', title: 'Breaking Through', blurb: 'The scene is starting to notice the studio.' },
  { id: 'facility', title: 'Running a Facility', blurb: 'Rooms, crew and payroll. The studio is bigger than you.' },
  { id: 'legacy', title: 'Legacy', blurb: 'The story is written. What the studio stands for is settled.' },
];

/** Chapter each milestone belongs to, so the story can be grouped. Unknown ids fall back to the current chapter. */
const MILESTONE_CHAPTER: Record<string, string> = {
  'first-paid-session': 'first-clients',
  'first-repeat-client': 'first-clients',
  'first-poor-session': 'first-clients',
  'first-loyal-client': 'sound',
  'first-story-choice': 'sound',
  'first-staff-hire': 'facility',
  'first-room-added': 'facility',
  'first-premises-move': 'real-studio',
  'first-charting-release': 'breakthrough',
};

type ChapterState = IdentityState;

/** Index into CAREER_CHAPTERS of the chapter the career is in now. Pure and monotone in the evidence. */
export const resolveChapterIndex = (state: ChapterState): number => {
  const reports = state.financials?.reports ?? [];
  const tier = state.premisesTier ?? 0;
  const rooms = (state.studioRooms ?? []).filter((r) => r.unlocked).length;
  const staff = state.hiredStaff?.length ?? 0;
  const done = Boolean(state.storylineState?.campaignCompleted);
  if (done || tier >= 3) return 6;
  if (tier >= 2 || (staff >= 2 && rooms >= 2)) return 5;
  if (state.firstChart || (state.chartRun?.length ?? 0) > 0) return 4;
  if (tier >= 1) return 3;
  if (reports.length >= 5 && (loyalClients(state).length > 0 || strongestSkill({ playerData: state.playerData }))) return 2;
  if (reports.some((r) => (r.moneyGained ?? 0) > 0)) return 1;
  return 0;
};

export const resolveCareerChapter = (state: ChapterState): CareerChapter => CAREER_CHAPTERS[resolveChapterIndex(state)];

export interface ChapterGroup {
  chapter: CareerChapter;
  current: boolean;
  milestones: CareerMilestone[];
}

/** Milestones grouped by chapter, only chapters that already started and have something to show. Newest chapter first. */
export const groupMilestonesByChapter = (state: ChapterState): ChapterGroup[] => {
  const idx = resolveChapterIndex(state);
  const groups: ChapterGroup[] = CAREER_CHAPTERS.slice(0, idx + 1).map((chapter, i) => ({ chapter, current: i === idx, milestones: [] }));
  for (const m of deriveCareerMilestones(state)) {
    const target = Math.min(idx, CAREER_CHAPTERS.findIndex((c) => c.id === (MILESTONE_CHAPTER[m.id] ?? CAREER_CHAPTERS[idx].id)));
    groups[Math.max(0, target)].milestones.push(m);
  }
  return groups.filter((g) => g.current || g.milestones.length > 0).reverse();
};

export const MAX_PINNED_MOMENTS = 3;

/** Pinned moments that still resolve to a real milestone, in pin order. Stale ids (e.g. a vanished milestone) drop silently. */
export const resolvePinnedMoments = (state: ChapterState & Partial<Pick<GameState, 'pinnedMoments'>>): CareerMilestone[] => {
  const all = deriveCareerMilestones(state);
  return (state.pinnedMoments ?? []).map((id) => all.find((m) => m.id === id)).filter((m): m is CareerMilestone => Boolean(m)).slice(0, MAX_PINNED_MOMENTS);
};

/** Immutable pin toggle. Pinning beyond the cap evicts the oldest pin so the click always does something. */
export const togglePinnedMoment = <T extends Partial<Pick<GameState, 'pinnedMoments'>>>(state: T, id: string): T => {
  const cur = state.pinnedMoments ?? [];
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-MAX_PINNED_MOMENTS);
  return { ...state, pinnedMoments: next };
};

export interface BranchConsequence {
  nodeId: string;
  day: number;
  headline: string;
  outcome: string;
}

/** Lasting consequence of each major storyline decision, read from the deterministic campaign tree. */
export const deriveBranchConsequences = (state: GameState): BranchConsequence[] => {
  const history = state.storylineState?.branchHistory ?? [];
  if (history.length === 0) return [];
  let nodes: ReturnType<typeof getCampaignTreeForState>['nodes'] = [];
  try {
    nodes = getCampaignTreeForState(state).nodes;
  } catch {
    return [];
  }
  const out: BranchConsequence[] = [];
  for (const rec of history) {
    const opt = nodes.find((n) => n.id === rec.nodeId)?.branchDilemma?.options.find((o) => o.id === rec.chosenOptionId);
    if (!opt) continue;
    out.push({ nodeId: rec.nodeId, day: rec.resolvedDay, headline: `You chose: ${opt.label}`, outcome: opt.consequences.narrativeOutcome });
  }
  return out;
};

// ---- Slice 3: cast of your career + selected credits (#259 §7, §8) ----

export interface CastMember {
  id: 'longest-client' | 'loyal-artist' | 'referrer' | 'key-staff';
  role: string;
  name: string;
  detail: string;
}

const TIER_RANK: Record<string, number> = { Unknown: 0, Acquaintance: 1, Friendly: 2, Regular: 3, Loyal: 4, Advocate: 5 };

/**
 * A short "cast of your career" summary. Deliberately a handful of lines, not the Artists or Crew screens.
 * Ties break on name so the result is deterministic. Legacy/sparse saves return an empty list.
 */
export const deriveCareerCast = (state: IdentityState): CastMember[] => {
  const out: CastMember[] = [];
  const rels = Object.values(state.clientRelationships ?? {});
  const byName = (a: { clientName: string }, b: { clientName: string }) => a.clientName.localeCompare(b.clientName);
  const longest = [...rels].filter((c) => c.sessionsCompleted >= 2).sort((a, b) => b.sessionsCompleted - a.sessionsCompleted || byName(a, b))[0];
  if (longest) out.push({ id: 'longest-client', role: 'Longest-running client', name: longest.clientName, detail: `${longest.sessionsCompleted} sessions together.` });
  const loyal = [...rels]
    .filter((c) => (TIER_RANK[c.tier] ?? 0) >= 4)
    .sort((a, b) => (TIER_RANK[b.tier] ?? 0) - (TIER_RANK[a.tier] ?? 0) || b.relationshipXp - a.relationshipXp || byName(a, b))[0];
  if (loyal) out.push({ id: 'loyal-artist', role: 'Most loyal artist', name: loyal.clientName, detail: `${loyal.tier} client. Trusts the studio with ${loyal.primaryGenre ? loyal.primaryGenre.toLowerCase() : 'their'} records.` });
  const referrer = [...rels].filter((c) => (c.referralCount ?? 0) > 0).sort((a, b) => b.referralCount - a.referralCount || byName(a, b))[0];
  if (referrer) out.push({ id: 'referrer', role: 'Biggest referrer', name: referrer.clientName, detail: `Sent ${referrer.referralCount} new client${referrer.referralCount === 1 ? '' : 's'} your way.` });
  const staff = [...(state.hiredStaff ?? [])].sort(
    (a, b) => (b.levelInRole ?? 0) - (a.levelInRole ?? 0) || (b.xpInRole ?? 0) - (a.xpInRole ?? 0) || a.name.localeCompare(b.name),
  )[0];
  if (staff) out.push({ id: 'key-staff', role: 'Key crew member', name: staff.name, detail: `${staff.role}, level ${staff.levelInRole ?? 1}.` });
  return out;
};

export interface SelectedCredit {
  id: 'best-quality' | 'biggest-earner' | 'favourite-genre' | 'top-release' | 'premises';
  label: string;
  title: string;
  detail: string;
}

const OUTCOME_RANK: Record<string, number> = { quiet: 0, solid: 1, breakthrough: 2, prestige: 3 };

/** Compact discography highlights, derived from reports, client release history and premises. Empty on sparse saves. */
export const deriveSelectedCredits = (state: IdentityState): SelectedCredit[] => {
  const out: SelectedCredit[] = [];
  const reports = state.financials?.reports ?? [];
  // First report wins ties so the earliest strong record keeps the credit.
  const best = reports.reduce<(typeof reports)[number] | null>((b, r) => (!b || r.overallQualityScore > b.overallQualityScore ? r : b), null);
  if (best) out.push({ id: 'best-quality', label: 'Highest quality', title: best.projectTitle, detail: `Scored ${Math.round(best.overallQualityScore)}/100.` });
  const rich = reports.reduce<(typeof reports)[number] | null>((b, r) => ((r.moneyGained ?? 0) > (b?.moneyGained ?? 0) ? r : b), null);
  if (rich && (rich.moneyGained ?? 0) > 0) out.push({ id: 'biggest-earner', label: 'Biggest payday', title: rich.projectTitle, detail: `Brought in ${formatMoney(Math.round(rich.moneyGained), state.cityId, state.currentEra)}.` });
  const genre = topGenres(state, 1)[0];
  if (genre) out.push({ id: 'favourite-genre', label: 'Most-used genre', title: genre, detail: `${reports.filter((r) => r.genre === genre).length} sessions delivered.` });
  let top: { title: string; band: string; client: string; rank: number; quality: number } | null = null;
  for (const c of Object.values(state.clientRelationships ?? {}).sort((a, b) => a.clientName.localeCompare(b.clientName))) {
    for (const r of c.releases ?? []) {
      if (!r.resolved) continue;
      const rank = OUTCOME_RANK[r.outcomeBand] ?? 0;
      if (rank > 0 && (!top || rank > top.rank || (rank === top.rank && r.qualityScore > top.quality))) top = { title: r.title, band: r.outcomeBand, client: c.clientName, rank, quality: r.qualityScore };
    }
  }
  if (top) out.push({ id: 'top-release', label: 'Biggest release', title: top.title, detail: `A ${top.band} result for ${top.client}.` });
  if (getPremisesTier(state) > 0) out.push({ id: 'premises', label: 'Studio milestone', title: getPremisesDef(state).name, detail: 'Where the studio calls home now.' });
  return out;
};
