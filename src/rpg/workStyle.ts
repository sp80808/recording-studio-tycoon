/**
 * Candidate work-style trait (#68 remainder). One low-count, explainable label per
 * recruit, chosen deterministically from the search seed and biased by channel so
 * the player can see why a given pool leans a certain way.
 *
 * Mechanical effect: a small stage-fit modifier. Each style is a little better on some
 * kinds of stage and a little worse on others, so it nudges who you put on a session
 * without changing stats, pay or recording quality. Bounded to +/-WORK_STYLE_FIT_CAP
 * points on the 0-100 staff fit score, and the UI states the exact numbers.
 */
import { createSeededRandom } from '@/simulation/seededRandom';

export type WorkStyle = 'methodical' | 'quick-study' | 'steady-hand' | 'showman' | 'night-owl';

export const WORK_STYLES: Record<WorkStyle, { label: string; blurb: string }> = {
  methodical: { label: 'Methodical', blurb: 'Documents every setup and double-checks the chain' },
  'quick-study': { label: 'Quick study', blurb: 'Picks up new rooms and gear fast, still rough at the edges' },
  'steady-hand': { label: 'Steady hand', blurb: 'Calm under deadline; never the flashiest take' },
  showman: { label: 'Showman', blurb: 'Great with nervous artists, loud about credit' },
  'night-owl': { label: 'Night owl', blurb: 'Does their best work after the clients have gone' },
};

const STYLE_ORDER: WorkStyle[] = ['methodical', 'quick-study', 'steady-hand', 'showman', 'night-owl'];

/** Relative weights per channel, in STYLE_ORDER order. */
const CHANNEL_BIAS: Record<string, number[]> = {
  referral: [1, 1, 3, 1, 1],
  college: [1, 4, 1, 1, 2],
  board: [2, 2, 2, 2, 2],
  specialist: [4, 1, 2, 1, 1],
  headhunter: [2, 1, 2, 4, 1],
};

export function pickWorkStyle(channelId: string, seed: string): WorkStyle {
  const w = CHANNEL_BIAS[channelId] ?? CHANNEL_BIAS.board;
  const total = w.reduce((a, b) => a + b, 0);
  let roll = createSeededRandom(`workstyle:${seed}`)() * total;
  for (let i = 0; i < w.length; i++) {
    roll -= w[i];
    if (roll < 0) return STYLE_ORDER[i];
  }
  return STYLE_ORDER[STYLE_ORDER.length - 1];
}

export type FitStageKind = 'tracking' | 'mixing' | 'mastering' | 'production' | 'general';
/** Most a work style can move a staff fit score, either way. */
export const WORK_STYLE_FIT_CAP = 4;

/** Points on the staff fit score by stage kind. Unlisted kinds are 0. */
export const WORK_STYLE_FIT: Record<WorkStyle, Partial<Record<FitStageKind, number>>> = {
  methodical: { mixing: 3, mastering: 3, tracking: -1 },
  'quick-study': { tracking: 3, production: 2, mastering: -2 },
  'steady-hand': { mastering: 2, mixing: 2, production: -1 },
  showman: { tracking: 3, production: 2, mixing: -2 },
  'night-owl': { production: 3, mixing: 1, tracking: -2 },
};

const KIND_LABEL: Record<FitStageKind, string> = { tracking: 'tracking', mixing: 'mixing', mastering: 'mastering', production: 'production', general: 'general' };

/** Fit points (and a plain reason) this style gives on this kind of stage. */
export function workStyleStageFit(style: WorkStyle | undefined, kind: FitStageKind): { points: number; reason?: string } {
  const raw = style ? WORK_STYLE_FIT[style]?.[kind] ?? 0 : 0;
  const points = Math.max(-WORK_STYLE_FIT_CAP, Math.min(WORK_STYLE_FIT_CAP, raw));
  if (!style || points === 0) return { points: 0 };
  return { points, reason: `${WORK_STYLES[style].label} ${points > 0 ? '+' : ''}${points} on ${KIND_LABEL[kind]}` };
}

/** One-line explanation of what a style does, for the candidate card and tooltips. */
export function workStyleEffectText(style: WorkStyle): string {
  const entries = Object.entries(WORK_STYLE_FIT[style]) as [FitStageKind, number][];
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${KIND_LABEL[k]}`)
    .join(', ');
}
