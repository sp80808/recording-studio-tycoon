/**
 * Candidate work-style trait (#68 remainder). One low-count, explainable label per
 * recruit, chosen deterministically from the search seed and biased by channel so
 * the player can see why a given pool leans a certain way. Display/explanation
 * only for now: it changes no stats or economy.
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
