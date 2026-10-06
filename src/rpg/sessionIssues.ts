/**
 * Phase-specific session events, unresolved issues and the Deliver / Polish
 * choice (issue #87). Pure and seeded: the same project, stage and studio
 * state always roll the same event, so replays and tests are stable.
 */
import { createSeededRandom } from '@/simulation/seededRandom';
import type { Project, ProjectReport, StaffMember } from '@/types/game';

export type SessionPhase = 'tracking' | 'mix' | 'qc';
export type IssueCategory = 'edit' | 'noise' | 'timing' | 'translation' | 'client-note';

export interface UnresolvedIssue {
  id: string;
  category: IssueCategory;
  /** 1 minor, 2 noticeable, 3 serious. */
  severity: 1 | 2 | 3;
  phase: SessionPhase;
  /** Why it happened, shown to the player. */
  cause: string;
  label: string;
  /** What a working engineer does to avoid this next time. Optional so older saves stay valid. */
  habit?: string;
}

export interface SessionEvent {
  id: string;
  phase: SessionPhase;
  label: string;
  /** Why this can happen; shown with the event. */
  why: string;
  /** The professional habit that prevents (or repeats) this; shown with the event. */
  habit?: string;
  /** Issue the event leaves behind, if any. */
  issue?: { category: IssueCategory; severity: 1 | 2 };
  /** Positive events polish one existing issue away. */
  clears?: boolean;
}

export const SESSION_EVENTS: SessionEvent[] = [
  { id: 'great-take', phase: 'tracking', label: 'Great take', why: 'The performer locked in and the room sounded right.', habit: "Good takes start before you hit record: warm the player up and check the level.", clears: true },
  { id: 'noisy-take', phase: 'tracking', label: 'Noisy take', why: 'Tired or worn gear let a hum into the signal.', habit: "Listen for hum during soundcheck. It is far easier to fix at the source than in the mix.", issue: { category: 'noise', severity: 1 } },
  { id: 'performer-fatigue', phase: 'tracking', label: 'Performer fatigue', why: 'A long day loosened the timing.', habit: "Do the hardest parts first and take breaks. Players get sloppy as they tire.", issue: { category: 'timing', severity: 2 } },
  { id: 'translation-issue', phase: 'mix', label: 'Translation issue', why: 'The mix sounds different off the studio monitors.', habit: "Play the mix on headphones and a small speaker before calling it done.", issue: { category: 'translation', severity: 2 } },
  { id: 'reference-mismatch', phase: 'mix', label: 'Reference mismatch', why: "The client's reference track points somewhere else.", habit: "Ask for the reference song early and flip back and forth with it at the same volume.", issue: { category: 'client-note', severity: 1 } },
  { id: 'creative-breakthrough', phase: 'mix', label: 'Creative breakthrough', why: 'A bold move landed and fixed a lingering worry.', habit: "Save a version first, then you can afford to try the bold move.", clears: true },
  { id: 'clipped-render', phase: 'qc', label: 'Clipped render', why: 'The bounce peaked over full scale.', habit: "Keep the loudest peaks below the top of the meter. Once clipped, it cannot be undone.", issue: { category: 'noise', severity: 2 } },
  { id: 'metadata-miss', phase: 'qc', label: 'Metadata miss', why: 'Titles and formats did not match the client sheet.', habit: "Check titles and file formats against the client sheet before sending.", issue: { category: 'client-note', severity: 1 } },
  { id: 'clean-approval', phase: 'qc', label: 'Clean approval', why: 'QC found nothing to flag.', habit: "A last listen with fresh ears is how clean deliveries happen.", clears: true },
];

export const MAX_OPEN_ISSUES = 5;
export const MAX_KNOW_HOW_PER_PROJECT = 3;

/** Last stage is always QC; earlier stages map by name. Unknown names are skipped. */
export function phaseForStage(stageName: string, stageIndex: number, stageCount: number): SessionPhase | null {
  if (stageIndex === stageCount - 1) return 'qc';
  const n = stageName.toLowerCase();
  if (/mix/.test(n)) return 'mix';
  if (/track|record|vocal|layer|guitar|live|take/.test(n)) return 'tracking';
  return null;
}

export interface RollContext {
  staff: Pick<StaffMember, 'primaryStats' | 'genreAffinity'>[];
  /** Lowest condition (0-100) among gear used in the session. */
  worstGearCondition: number;
  /** Brief fit score 0-100 from #48. */
  fitScore: number;
}

/**
 * Chance a stage ends with an event at all, and how much of it is bad news.
 * High technical skill and brief fit reduce bad news but never to zero.
 */
export function issueChance(ctx: RollContext): number {
  const tech = ctx.staff.length ? ctx.staff.reduce((a, s) => a + s.primaryStats.technical, 0) / ctx.staff.length : 20;
  const base = 0.5 - Math.min(0.2, tech / 250) - Math.min(0.12, ctx.fitScore / 900);
  const wear = ctx.worstGearCondition < 50 ? 0.1 : 0;
  return Math.max(0.15, Math.min(0.65, base + wear));
}

/** Deterministic event for a stage, or null when the stage passes uneventfully. */
export function rollPhaseEvent(project: Pick<Project, 'id' | 'unresolvedIssues'>, phase: SessionPhase, stageIndex: number, ctx: RollContext): SessionEvent | null {
  const rng = createSeededRandom(`phase:${project.id}:${stageIndex}`);
  const pool = SESSION_EVENTS.filter((e) => e.phase === phase);
  const open = project.unresolvedIssues?.length ?? 0;
  const bad = pool.filter((e) => e.issue);
  const good = pool.filter((e) => e.clears);
  if (rng() >= issueChance(ctx) + 0.25) return null; // ~quiet stage
  const wantBad = rng() < issueChance(ctx) / (issueChance(ctx) + 0.25);
  const choice = wantBad ? bad : good;
  const picked = choice[Math.floor(rng() * choice.length) % choice.length];
  if (picked.issue && open >= MAX_OPEN_ISSUES) return null; // defects never multiply without a cap
  if (picked.clears && open === 0) return null;
  return picked;
}

/** Immutable: returns the project with the event applied. */
export function applySessionEvent(project: Project, event: SessionEvent, stageIndex: number): Project {
  const issues = [...(project.unresolvedIssues ?? [])];
  if (event.issue) {
    issues.push({
      id: `${project.id}:${stageIndex}:${event.id}`,
      category: event.issue.category,
      severity: event.issue.severity,
      phase: event.phase,
      cause: event.why,
      label: event.label,
      habit: event.habit,
    });
  } else if (event.clears && issues.length > 0) {
    issues.sort((a, b) => b.severity - a.severity);
    issues.shift();
  }
  return { ...project, unresolvedIssues: issues };
}

/** A revision round the booking already covers costs studio time, as a share of the fee, but not client trust (#51). */
export const REVISION_ROUND_FEE = 0.05;

export type DeliveryDecision = 'deliver' | 'polish';

export interface DeliveryForecast {
  issues: UnresolvedIssue[];
  /** Quality points lost, revision chance, and polish cost as a share of the fee. */
  deliver: { qualityPenalty: number; revisionChance: number };
  polish: { cost: number; knowHow: number };
}

const totalSeverity = (issues: UnresolvedIssue[]) => issues.reduce((a, i) => a + i.severity, 0);

/** Bounded forecast shown before the player chooses. No hidden arithmetic beyond these numbers. */
export function forecastDelivery(issues: UnresolvedIssue[], payout: number): DeliveryForecast {
  const sev = totalSeverity(issues);
  return {
    issues,
    deliver: { qualityPenalty: Math.min(12, sev * 2), revisionChance: Math.min(60, sev * 10) },
    polish: { cost: Math.round(payout * Math.min(0.2, 0.04 * issues.length)), knowHow: Math.min(MAX_KNOW_HOW_PER_PROJECT, issues.length) },
  };
}

/**
 * Applies the decision to a settled report. Deliver keeps the issues and costs
 * quality, fee and reputation; polish pays studio time, clears every open issue
 * and teaches the studio something.
 */
export function applyDeliveryDecision(report: ProjectReport, issues: UnresolvedIssue[], decision: DeliveryDecision, seed: string, revisionAllowance = 0): ProjectReport {
  if (issues.length === 0) return report;
  const f = forecastDelivery(issues, report.moneyGained);
  const top = [...issues].sort((a, b) => b.severity - a.severity)[0];
  if (decision === 'polish') {
    const knowHow = f.polish.knowHow;
    const pay = Math.max(0, report.moneyGained - f.polish.cost);
    const quality = Math.min(100, report.overallQualityScore + Math.min(4, issues.length));
    return {
      ...report,
      overallQualityScore: quality,
      moneyGained: pay,
      knowHowGained: knowHow,
      reviewSnippet: `${report.reviewSnippet} You polished ${issues.length} open issue${issues.length === 1 ? '' : 's'} before delivery (-$${f.polish.cost}).`,
    };
  }
  const rng = createSeededRandom(`revision:${seed}`);
  const revision = rng() * 100 < f.deliver.revisionChance;
  const quality = Math.max(0, report.overallQualityScore - f.deliver.qualityPenalty);
  const factor = report.overallQualityScore > 0 ? quality / report.overallQualityScore : 1;
  const covered = revision && revisionAllowance > 0;
  const repPenalty = revision && !covered ? Math.min(report.reputationGained, Math.ceil(totalSeverity(issues) / 2)) : 0;
  return {
    ...report,
    overallQualityScore: quality,
    moneyGained: Math.round(report.moneyGained * (0.5 + 0.5 * factor) * (covered ? 1 - REVISION_ROUND_FEE : 1)),
    reputationGained: Math.max(0, report.reputationGained - repPenalty),
    reviewSnippet: `${report.reviewSnippet} Delivered early with ${issues.length} open issue${issues.length === 1 ? '' : 's'}; main cause: ${top.label.toLowerCase()} (${top.cause.toLowerCase()})${covered ? ' The client asked for a revision; the booking included a round, so it cost studio time, not trust.' : revision ? ' The client asked for a revision and trust took a small hit.' : ''}`,
  };
}
