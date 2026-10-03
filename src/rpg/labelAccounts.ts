/**
 * Label accounts and package contracts (#50, first slice).
 *
 * A record label is a studio client, not a partner: once a label's interest (label interest, #49) crosses a
 * tier's line, it sends one deterministic 3-track package a week. The player can shape four terms with chips
 * (rush, an extra revision, open creative freedom); every term trades fee against pressure. Terms are fixed
 * when the contract is booked and ride on the project, so reloading cannot reroll them. Delivery late or under
 * target costs a bounded slice of the fee and a few points of label interest; there is no blacklist.
 *
 * Pure and deterministic. Offers are derived per label and week and never stored until booked.
 */
import type { GameState, Project } from '@/types/game';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import { GIG_TEMPLATES, type GigTemplate } from '@/data/gigTemplates';
import { createSeededRandom } from '@/simulation/seededRandom';
import { deriveBrief } from '@/rpg/projectBrief';
import { LABEL_ACCOUNTS, interestOf, labelsForGenre, type LabelAccount, type LabelTier } from '@/rpg/labelInterest';

export const LABEL_WEEK_DAYS = 7;
/** Label interest needed before a tier's account sends work. */
export const TIER_UNLOCK: Partial<Record<LabelTier, number>> = { indie: 25, regional: 50 };
const TIER_FEE_FACTOR: Partial<Record<LabelTier, number>> = { indie: 1.15, regional: 1.35 };
const TIER_DEADLINE: Partial<Record<LabelTier, number>> = { indie: 12, regional: 10 };
const TIER_TARGET: Partial<Record<LabelTier, number>> = { indie: 60, regional: 72 };

export const RUSH_DAYS = 3;
export const RUSH_FEE = 0.15;
export const REVISION_FEE = -0.08;
export const FREEDOM_FEE = -0.1;
export const FREEDOM_TARGET = -8;
export const LATE_FEE_PER_DAY = 0.1;
export const LATE_FEE_CAP = 0.3;
export const SHORTFALL_FEE = 0.1;
export const ON_TIME_BONUS = 0.1;
export const INTEREST_GAIN = 5;
export const INTEREST_LOSS = 3;
/** Late or short delivery never takes a label's interest below this. */
export const INTEREST_FLOOR = 10;

export interface LabelChoices {
  rush: boolean;
  extraRevision: boolean;
  openFreedom: boolean;
}
export const NO_CHOICES: LabelChoices = { rush: false, extraRevision: false, openFreedom: false };

export interface LabelTerms {
  labelId: string;
  labelName: string;
  tier: LabelTier;
  baseFee: number;
  baseDeadlineDays: number;
  baseTarget: number;
  baseRevisions: number;
  choices: LabelChoices;
  /** Resolved terms for the current choices. */
  fee: number;
  deadlineDays: number;
  qualityTarget: number;
  revisions: number;
}

export const isLabelContract = (p: Pick<Project, 'labelTerms'>): boolean => Boolean(p.labelTerms);

export const resolveTerms = (base: Pick<LabelTerms, 'baseFee' | 'baseDeadlineDays' | 'baseTarget' | 'baseRevisions'>, c: LabelChoices) => ({
  fee: Math.round(base.baseFee * (1 + (c.rush ? RUSH_FEE : 0) + (c.extraRevision ? REVISION_FEE : 0) + (c.openFreedom ? FREEDOM_FEE : 0))),
  deadlineDays: Math.max(3, base.baseDeadlineDays - (c.rush ? RUSH_DAYS : 0)),
  qualityTarget: Math.max(30, base.baseTarget + (c.openFreedom ? FREEDOM_TARGET : 0)),
  revisions: base.baseRevisions + (c.extraRevision ? 1 : 0),
});

/** The project as the player has negotiated it so far (fee and booking length follow the chips). */
export const withChoices = (project: Project, choices: LabelChoices): Project => {
  const t = project.labelTerms;
  if (!t) return project;
  const r = resolveTerms(t, choices);
  return { ...project, payoutBase: r.fee, durationDaysTotal: r.deadlineDays, labelTerms: { ...t, choices, ...r } };
};

type OfferState = Pick<GameState, 'currentDay' | 'currentEra' | 'saveSeed' | 'labelInterest' | 'claimedOffers'>;

const templateFor = (label: LabelAccount, eraId: string, rng: () => number): GigTemplate | undefined => {
  const eraGenres = (ERA_DEFINITIONS.find((e) => e.id === eraId) ?? ERA_DEFINITIONS[0]).availableGenres;
  const fits = (t: GigTemplate) => labelsForGenre(t.genre).some((l) => l.id === label.id);
  const native = GIG_TEMPLATES.filter((t) => eraGenres.includes(t.genre) && fits(t));
  const pool = native.length ? native : GIG_TEMPLATES.filter(fits);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : undefined;
};

export const labelOffersFor = (state: OfferState): Project[] => {
  const week = Math.floor(state.currentDay / LABEL_WEEK_DAYS);
  const out: Project[] = [];
  for (const label of LABEL_ACCOUNTS) {
    const unlock = TIER_UNLOCK[label.tier];
    if (unlock === undefined || interestOf(state.labelInterest, label.id) < unlock) continue;
    const id = `label-${label.id}-${week}`;
    if (state.claimedOffers?.includes(id)) continue;
    const rng = createSeededRandom(`label-offer:${state.saveSeed ?? 'legacy'}:${label.id}:${week}`);
    const template = templateFor(label, state.currentEra ?? 'analog60s', rng);
    if (!template) continue;
    const stages = [0, 1, 2].map((i) => template.baseStages[i % template.baseStages.length]);
    const base = {
      baseFee: Math.round(template.basePayout * (TIER_FEE_FACTOR[label.tier] ?? 1)),
      baseDeadlineDays: TIER_DEADLINE[label.tier] ?? 12,
      baseTarget: TIER_TARGET[label.tier] ?? 60,
      baseRevisions: 1,
    };
    const title = template.titleTemplates[Math.floor(rng() * template.titleTemplates.length)];
    const r = resolveTerms(base, NO_CHOICES);
    const project: Project = {
      id,
      title: `${label.name}: 3-track ${title}`,
      genre: template.genre,
      clientType: 'Record Label',
      clientId: `label-${label.id}`,
      clientName: label.name,
      difficulty: Math.min(5, template.difficulty + (label.tier === 'regional' ? 1 : 0)),
      payoutBase: r.fee,
      repGainBase: Math.round(template.baseRep * 2),
      durationDaysTotal: r.deadlineDays,
      requiredSkills: { [template.genre]: Math.max(1, Math.floor(template.difficulty / 2)) },
      matchRating: 'Good',
      stages: stages.map((s, i) => ({ stageName: `Track ${i + 1}: ${s.stageName}`, focusAreas: s.focusAreas, workUnitsBase: s.workUnitsBase, workUnitsCompleted: 0, completed: false })),
      currentStageIndex: 0,
      completedStages: [],
      stake: 'safe',
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      workSessionCount: 0,
      focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
      labelTerms: { labelId: label.id, labelName: label.name, tier: label.tier, ...base, choices: NO_CHOICES, ...r },
    };
    project.brief = deriveBrief(project);
    out.push(project);
  }
  return out;
};

export interface LabelOutcome {
  /** Fee adjustment in money (negative for a late or short delivery). */
  money: number;
  interest: number;
  onTime: boolean;
  metTarget: boolean;
  message: string;
}

/** What delivering this label contract did, from days taken and final quality. Pure; the caller applies it once. */
export const labelOutcome = (terms: LabelTerms, daysTaken: number, quality: number, fee: number): LabelOutcome => {
  const lateDays = Math.max(0, Math.floor(daysTaken) - terms.deadlineDays);
  const onTime = lateDays === 0;
  const metTarget = quality >= terms.qualityTarget;
  let cut = 0;
  if (!onTime) cut += Math.min(LATE_FEE_CAP, lateDays * LATE_FEE_PER_DAY);
  if (!metTarget && terms.revisions < 2) cut += SHORTFALL_FEE;
  const good = onTime && metTarget;
  const money = good ? Math.round(fee * ON_TIME_BONUS) : -Math.round(fee * cut);
  const interest = good ? INTEREST_GAIN : onTime && metTarget === false ? 0 : -INTEREST_LOSS;
  const message = good
    ? `${terms.labelName} is delighted: on time and on target. A ${Math.round(ON_TIME_BONUS * 100)}% bonus and a stronger account.`
    : !onTime
      ? `${terms.labelName} waited ${lateDays} extra day${lateDays === 1 ? '' : 's'}. They knocked ${Math.round(cut * 100)}% off the invoice and will remember it.`
      : terms.revisions >= 2
        ? `${terms.labelName} wanted a little more, and the extra revision round absorbed it. Full fee, no bonus.`
        : `${terms.labelName} wanted a little more than this. They trimmed ${Math.round(cut * 100)}% off the invoice.`;
  return { money, interest, onTime, metTarget, message };
};

/** Apply an outcome once: money, bounded interest change, and a note. Never below the floor, never a blacklist. */
export const applyLabelOutcome = (state: GameState, project: Project | undefined, quality: number, fee: number): GameState => {
  const terms = project?.labelTerms;
  if (!terms || !project) return state;
  const daysTaken = Math.max(1, state.currentDay - (project.bookedDay ?? state.currentDay) + 1);
  const o = labelOutcome(terms, daysTaken, quality, fee);
  const before = interestOf(state.labelInterest, terms.labelId);
  const after = o.interest < 0 ? Math.max(Math.min(before, INTEREST_FLOOR), before + o.interest) : Math.min(100, before + o.interest);
  return {
    ...state,
    money: Math.max(0, state.money + o.money),
    labelInterest: { ...(state.labelInterest ?? {}), [terms.labelId]: after },
    notifications: [...state.notifications, { id: `label-outcome-${project.id}`, message: o.message, type: o.money >= 0 ? 'success' : 'info', timestamp: Date.now(), duration: 7000 }],
  };
};
