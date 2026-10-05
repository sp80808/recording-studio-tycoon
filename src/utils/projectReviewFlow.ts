/**
 * Project review hand-off (#255): pure, state-derived helpers plus cheap dev
 * diagnostics for final-take -> onProjectComplete -> handleShowProjectReview
 * -> showReviewModal. A complete active project must always have a working
 * route into review even if the final-take callback edge was missed.
 */
import type { Project } from '@/types/game';

/** True when every stage of the project is complete (the review-ready state). */
export const isProjectReadyForReview = (project: Pick<Project, 'stages'> | null | undefined): boolean =>
  !!project && project.stages.length > 0 && project.stages.every(stage => stage.completed);

export interface ReviewGateState {
  reviewOpen: boolean;
  hasReport: boolean;
  hasPendingDelivery: boolean;
}

/** Review may only be generated once per authoritative completed project. */
export const canOpenProjectReview = (g: ReviewGateState): boolean =>
  !g.reviewOpen && !g.hasReport && !g.hasPendingDelivery;

export type ReviewTraceStage =
  | 'final-take'
  | 'on-project-complete'
  | 'celebration-deferred'
  | 'recovery-cta'
  | 'show-review'
  | 'show-review-skipped'
  | 'review-modal-open'
  | 'delivery-prompt'
  | 'finalize'
  | 'finalize-skipped';

export interface ReviewTraceEntry { at: number; stage: ReviewTraceStage; detail?: string }

const TRACE_LIMIT = 40;
const trace: ReviewTraceEntry[] = [];
const isDev = (): boolean => {
  try { return Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV); } catch { return false; }
};

/** Cheap ring buffer + console.debug in dev only; no-op in production. */
export const traceReviewFlow = (stage: ReviewTraceStage, detail?: string): void => {
  if (!isDev()) return;
  trace.push({ at: Date.now(), stage, detail });
  if (trace.length > TRACE_LIMIT) trace.shift();
  console.debug(`[review-flow] ${stage}${detail ? ` ${detail}` : ''}`);
  if (typeof window !== 'undefined') (window as unknown as { __rstReviewTrace?: ReviewTraceEntry[] }).__rstReviewTrace = trace;
};

export const getReviewTrace = (): readonly ReviewTraceEntry[] => trace;
export const resetReviewTrace = (): void => { trace.length = 0; };
