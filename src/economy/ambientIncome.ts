// Ambient earning: a small in-game cash trickle while the player is actively
// playing. Pure + deterministic (seeded by save seed, day and tick index).
//
// Design guardrails:
//  - in-game cash only; no real money, ads or random paid loot
//  - hard per-day cap, so it can never out-earn a single gig
//  - no artist-contract royalties here (processContractsDay already pays those)
//  - does not touch the used-gear economy

import type { GameState } from '@/types/game';
import { earn } from './ledger';
import { createSeededRandom } from '@/simulation/seededRandom';

export type AmbientSource = 'residual' | 'tip' | 'sync';

export interface AmbientIncomeState {
  /** Game day the counters below belong to. */
  day: number;
  earnedToday: number;
  ticks: number;
  total: number;
  last?: { amount: number; source: AmbientSource; line: string };
}

/** Active-play time that buys one tick. */
export const AMBIENT_TICK_MS = 45_000;
/** No input for this long (or a hidden tab) pauses accrual. */
export const AMBIENT_IDLE_MS = 60_000;
export const AMBIENT_DAILY_CAP_BASE = 25;
export const AMBIENT_DAILY_CAP_PER_RELEASE = 5;
export const AMBIENT_DAILY_CAP_MAX = 120;

const CATALOG_COUNT_CAP = 20;

export const LINES: Record<AmbientSource, readonly string[]> = {
  residual: [
    'A streaming service rounded your royalty up. To a whole cent.',
    'Your back catalogue landed between a rain-sounds loop and "lofi beats to file taxes to".',
    'A collecting society found your money down the back of the sofa.',
    'Someone looped your chorus all the way through a long commute.',
    'A playlist called "Vibes (Untitled)" added your track. Vibes pay, it turns out.',
    'A Sunday-morning radio host said your name correctly. Royalties followed.',
    'Your song soundtracked someone doing the washing up. Dishes: done. You: paid.',
    'An algorithm decided people who like one thing also like your thing.',
  ],
  tip: [
    'The tip jar by the coffee machine yielded mostly guitar picks and one fiver.',
    'A drummer tipped you for not asking "was that in time?" out loud.',
    'A bassist paid for the coffee. Nobody is sure he spoke this week.',
    'A singer left a tip and a note: "Can we hear it with more of me?"',
    'Someone swore the mix was done after the fourth file named FINAL_v2. Generous tip.',
    'A client tipped for the extra take. The talkback mic was not off. It is now.',
    'A session player left change in the piano. Sure, that is a tip.',
  ],
  sync: [
    'A sync agent placed your track under a very calm yoghurt advert.',
    'A teen drama needed "wistful but hopeful" for a rooftop scene. Yours fits.',
    'A car commercial wants the bridge. Not the verse. Never the verse.',
    'Your song is now the hold music at a dentist. Someone is paying for that.',
    'A trailer editor needs a slowed-down cover of something nice. Yours, apparently.',
    'A coming-of-age film needs a song for a bus window shot. You have a bus window shot.',
  ],
};

export const SOURCE_LABEL: Record<AmbientSource, string> = {
  residual: 'residuals',
  tip: 'session tips',
  sync: 'sync placement',
};

/** Finished releases in the player's catalog (capped so the trickle stays small). */
export const catalogSize = (state: Pick<GameState, 'financials'>): number =>
  Math.min(CATALOG_COUNT_CAP, state.financials?.reports?.length ?? 0);

export const ambientDailyCap = (state: Pick<GameState, 'financials'>): number =>
  Math.min(AMBIENT_DAILY_CAP_MAX, AMBIENT_DAILY_CAP_BASE + AMBIENT_DAILY_CAP_PER_RELEASE * catalogSize(state));

const pick = <T,>(items: readonly T[], roll: number): T => items[Math.min(items.length - 1, Math.floor(roll * items.length))];

export interface AmbientRoll { amount: number; source: AmbientSource; line: string }

/** Decide what (if anything) a single tick pays. Does not look at the daily cap. */
export function rollAmbientTick(
  state: Pick<GameState, 'financials' | 'studioLevel' | 'saveSeed'>,
  day: number,
  tickIndex: number,
): AmbientRoll {
  const rng = createSeededRandom(`${state.saveSeed ?? 'ambient'}:${day}:${tickIndex}:ambient`);
  const catalog = catalogSize(state);
  const tier = Math.max(1, Math.min(5, state.studioLevel ?? 1));
  const kind = rng();
  const lineRoll = rng();
  if (catalog >= 2 && kind > 0.94) {
    const amount = Math.round(8 + catalog * 1.5 + tier * 2);
    return { amount, source: 'sync', line: pick(LINES.sync, lineRoll) };
  }
  if (catalog >= 1 && kind > 0.3) {
    const amount = Math.max(1, Math.round(1 + catalog * 0.5 + tier * 0.4));
    return { amount, source: 'residual', line: pick(LINES.residual, lineRoll) };
  }
  return { amount: Math.max(1, Math.round(1 + tier * 0.6)), source: 'tip', line: pick(LINES.tip, lineRoll) };
}

export interface AmbientTickResult { state: GameState; roll: AmbientRoll | null }

/** Apply one tick: money, running income figure, and the capped daily counter. */
export function applyAmbientTick(state: GameState): AmbientTickResult {
  const prior = state.ambientIncome;
  const fresh = prior && prior.day === state.currentDay ? prior : undefined;
  const earned = fresh?.earnedToday ?? 0;
  const ticks = prior?.ticks ?? 0;
  const cap = ambientDailyCap(state);
  const remaining = cap - earned;
  if (remaining <= 0) return { state, roll: null };

  const roll = rollAmbientTick(state, state.currentDay, ticks);
  const amount = Math.min(roll.amount, remaining);
  const paid = { ...roll, amount };
  return {
    roll: paid,
    state: {
      ...earn(state, amount, {
        category: 'ambient-income',
        sourceId: `tick-${ticks}`,
        memo: SOURCE_LABEL[roll.source],
      }),
      financials: {
        ...state.financials,
        income: state.financials.income + amount,
        profit: state.financials.profit + amount,
      },
      ambientIncome: {
        day: state.currentDay,
        earnedToday: earned + amount,
        ticks: ticks + 1,
        total: (prior?.total ?? 0) + amount,
        last: paid,
      },
    },
  };
}

/**
 * Accrues active-play time. Returns the new accumulator and how many ticks are due.
 * Idle (no input for AMBIENT_IDLE_MS) or hidden-tab time never accrues.
 */
export function accrueActiveTime(
  accumulatedMs: number,
  elapsedMs: number,
  msSinceInput: number,
  visible: boolean,
): { accumulatedMs: number; due: number } {
  if (!visible || msSinceInput > AMBIENT_IDLE_MS || !(elapsedMs > 0)) return { accumulatedMs, due: 0 };
  // A throttled timer must not bank a big catch-up: clamp each step.
  const total = accumulatedMs + Math.min(elapsedMs, AMBIENT_TICK_MS);
  const due = Math.floor(total / AMBIENT_TICK_MS);
  return { accumulatedMs: total - due * AMBIENT_TICK_MS, due };
}

/** Text for the quiet pop-up. */
export const ambientPopLabel = (roll: AmbientRoll): string => `+$${roll.amount} ${SOURCE_LABEL[roll.source]}`;
