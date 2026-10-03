/**
 * gainStaging.ts
 * Pure, seeded rules for Gain Staging: a hidden source level runs through three gain stages
 * (preamp, channel fader, master bus). Set each stage so nothing clips, the preamp stays
 * clear of the noise floor and the print lands in the target window. A Play pass shows the
 * peak at every stage for the current settings; the readings go stale as soon as you move a knob.
 * Three takes per session, three plays per take. Fewer moves and unused plays score higher.
 */
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import { tc } from '@/i18n/content';

export const ROUNDS = 3;
export const PLAYS_PER_TAKE = 3;
export const STEP_DB = 3;
export const GAIN_MIN = -12;
export const GAIN_MAX = 24;
export const STAGE_LABELS = ['Preamp', 'Channel fader', 'Master bus'] as const;
/** Peak after the last stage should land in this window (dBFS). */
export const TARGET_MIN = -15;
export const TARGET_MAX = -9;
/** Any stage peaking above this clips. */
export const CLIP_DB = 0;
/** The preamp output should stay above this or the noise floor comes up later. */
export const NOISE_FLOOR_DB = -24;

/** Source peak range per difficulty (dBFS): lower means more gain is needed. */
const SOURCE_RANGE: Record<1 | 2 | 3, [number, number]> = { 1: [-30, -24], 2: [-39, -24], 3: [-48, -21] };

export interface GainTake {
  /** Hidden source peak (dBFS). */
  source: number;
  gains: [number, number, number];
  playsLeft: number;
  moves: number;
  /** Peaks at each stage from the last Play, or null before the first Play. */
  reading: [number, number, number] | null;
  committed: boolean;
  score: number | null;
}

export interface GainState {
  seed: string | number;
  difficulty: 1 | 2 | 3;
  roundIndex: number;
  takes: GainTake[];
  phase: 'play' | 'done';
}

export const peaks = (source: number, gains: readonly number[]): [number, number, number] => {
  const a = source + gains[0], b = a + gains[1], c = b + gains[2];
  return [a, b, c];
};

export function createGainStaging(seed: string | number, difficulty: 1 | 2 | 3 = 2, rng?: RandomSource): GainState {
  const roll = rng ?? createSeededRandom(`gainstaging:${seed}`);
  const [lo, hi] = SOURCE_RANGE[difficulty];
  const takes: GainTake[] = [];
  for (let r = 0; r < ROUNDS; r++) {
    const source = lo + STEP_DB * randomInt(roll, 0, Math.floor((hi - lo) / STEP_DB));
    takes.push({ source, gains: [0, 0, 0], playsLeft: PLAYS_PER_TAKE, moves: 0, reading: null, committed: false, score: null });
  }
  return { seed, difficulty, roundIndex: 0, takes, phase: 'play' };
}

export const currentTake = (s: GainState): GainTake => s.takes[s.roundIndex];
const withTake = (s: GainState, t: GainTake): GainState => ({ ...s, takes: s.takes.map((x, i) => (i === s.roundIndex ? t : x)) });

export function adjustGain(s: GainState, stage: number, deltaDb: number): GainState {
  const t = currentTake(s);
  if (s.phase === 'done' || t.committed || stage < 0 || stage > 2) return s;
  const next = Math.max(GAIN_MIN, Math.min(GAIN_MAX, t.gains[stage] + Math.sign(deltaDb) * STEP_DB));
  if (next === t.gains[stage]) return s;
  const gains = [...t.gains] as GainTake['gains'];
  gains[stage] = next;
  return withTake(s, { ...t, gains, moves: t.moves + 1 });
}

/** Spend a play: the meters show the peaks for the current settings. */
export function play(s: GainState): GainState {
  const t = currentTake(s);
  if (s.phase === 'done' || t.committed || t.playsLeft <= 0) return s;
  return withTake(s, { ...t, playsLeft: t.playsLeft - 1, reading: peaks(t.source, t.gains) });
}

export interface TakeCheck { clipped: boolean; noisy: boolean; final: number; distance: number; inWindow: boolean }

export const checkTake = (t: GainTake): TakeCheck => {
  const p = peaks(t.source, t.gains);
  const clipped = p.some((x) => x > CLIP_DB);
  const noisy = p[0] < NOISE_FLOOR_DB;
  const final = p[2];
  const distance = final < TARGET_MIN ? TARGET_MIN - final : final > TARGET_MAX ? final - TARGET_MAX : 0;
  return { clipped, noisy, final, distance, inWindow: distance === 0 };
};

/** Fewest knob moves that could solve the take (preamp up to the floor, the rest to the window). */
export const minMoves = (t: GainTake): number => {
  const needed = TARGET_MIN + 3 - t.source; // aim for the window's lower-middle
  return Math.max(1, Math.ceil(Math.abs(needed) / (STEP_DB * 4)));
};

export const scoreTake = (t: GainTake): number => {
  const c = checkTake(t);
  let score = 100;
  if (c.clipped) score -= 40;
  if (c.noisy) score -= 15;
  score -= Math.min(45, Math.round((c.distance / STEP_DB) * 12));
  score -= Math.min(15, Math.max(0, t.moves - minMoves(t) - 4));
  if (!c.clipped && !c.noisy && c.inWindow) score += t.playsLeft * 3;
  return Math.max(0, Math.min(100, score));
};

export function commitTake(s: GainState): GainState {
  const t = currentTake(s);
  if (s.phase === 'done' || t.committed) return s;
  const scored = withTake(s, { ...t, committed: true, score: scoreTake(t) });
  return s.roundIndex >= ROUNDS - 1 ? { ...scored, phase: 'done' } : { ...scored, roundIndex: s.roundIndex + 1 };
}

export const scoreGainStaging = (s: GainState): { total: number; cleanTakes: number; tips: string[] } => {
  const done = s.takes.filter((t) => t.committed);
  const total = done.length ? Math.round(done.reduce((n, t) => n + (t.score ?? 0), 0) / ROUNDS) : 0;
  const cleanTakes = done.filter((t) => { const c = checkTake(t); return !c.clipped && !c.noisy && c.inWindow; }).length;
  const tips: string[] = [];
  if (done.some((t) => checkTake(t).clipped)) tips.push(tc('mg.gainStaging.tip_clipped', 'A stage clipped: pull it back before the next one adds more.'));
  if (done.some((t) => checkTake(t).noisy)) tips.push(tc('mg.gainStaging.tip_noisy', 'Keep the preamp healthy so the fader does not have to lift the noise floor.'));
  return { total, cleanTakes, tips };
};
