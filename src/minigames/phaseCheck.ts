/**
 * phaseCheck.ts
 * Pure, seeded rules for Phase Check: a drum kit is miked up and some mics came in polarity-inverted.
 * You only hear the mono sum ("fullness"). Flip polarity (Ø) on a channel and watch the sum.
 * Two listens per kit reveal whether a channel agrees with the reference (the first channel).
 * Three kits per session. Fewer flips and unused listens score higher.
 */
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';

export const ROUNDS = 3;
export const LISTENS_PER_KIT = 2;
/** At or above this the kit is considered in phase. */
export const IN_PHASE = 0.98;

const MIC_POOL = [
  { id: 'kick-in', label: 'Kick in', weight: 1.4 },
  { id: 'kick-out', label: 'Kick out', weight: 1.2 },
  { id: 'snare-top', label: 'Snare top', weight: 1.2 },
  { id: 'snare-bottom', label: 'Snare bottom', weight: 0.9 },
  { id: 'oh-left', label: 'Overhead L', weight: 1 },
  { id: 'oh-right', label: 'Overhead R', weight: 1 },
  { id: 'tom', label: 'Floor tom', weight: 0.8 },
  { id: 'room', label: 'Room mic', weight: 0.7 },
] as const;

export const CHANNELS_BY_DIFFICULTY: Record<1 | 2 | 3, number> = { 1: 4, 2: 5, 3: 7 };

export interface PhaseChannel {
  id: string;
  label: string;
  weight: number;
  /** True when the mic arrived polarity-inverted. Hidden from the player. */
  invertedAtSource: boolean;
  /** The player's Ø switch. */
  flipped: boolean;
  /** Revealed by a listen. */
  heard: boolean;
}

export interface PhaseKit {
  channels: PhaseChannel[];
  listensLeft: number;
  flips: number;
  committed: boolean;
  score: number | null;
}

export interface PhaseState {
  seed: string | number;
  difficulty: 1 | 2 | 3;
  roundIndex: number;
  kits: PhaseKit[];
  phase: 'play' | 'done';
}

const sign = (c: PhaseChannel): 1 | -1 => (c.invertedAtSource !== c.flipped ? -1 : 1);

/** 0..1: how full the mono sum is. 1 means every channel agrees with the others. */
export const fullness = (kit: PhaseKit): number => {
  const total = kit.channels.reduce((n, c) => n + c.weight, 0);
  const sum = kit.channels.reduce((n, c) => n + sign(c) * c.weight, 0);
  return Math.abs(sum) / total;
};

/** Fewest flips that would put the kit in phase. */
export const minFlips = (kit: PhaseKit): number => {
  const inverted = kit.channels.filter((c) => c.invertedAtSource).length;
  return Math.min(inverted, kit.channels.length - inverted);
};

export function createPhaseCheck(seed: string | number, difficulty: 1 | 2 | 3 = 2, rng?: RandomSource): PhaseState {
  const roll = rng ?? createSeededRandom(`phasecheck:${seed}`);
  const count = CHANNELS_BY_DIFFICULTY[difficulty];
  const kits: PhaseKit[] = [];
  for (let r = 0; r < ROUNDS; r++) {
    const pool = [...MIC_POOL];
    const picked = Array.from({ length: count }, () => pool.splice(randomInt(roll, 0, pool.length - 1), 1)[0]);
    // At least one inverted mic and never an even split, so there is one clear fix.
    const invertedCount = randomInt(roll, 1, Math.max(1, Math.floor((count - 1) / 2)));
    const order = picked.map((_, i) => i).slice(1).sort(() => roll() - 0.5);
    const inverted = new Set(order.slice(0, invertedCount));
    kits.push({
      channels: picked.map((m, i) => ({ id: m.id, label: m.label, weight: m.weight, invertedAtSource: inverted.has(i), flipped: false, heard: false })),
      listensLeft: LISTENS_PER_KIT,
      flips: 0,
      committed: false,
      score: null,
    });
  }
  return { seed, difficulty, roundIndex: 0, kits, phase: 'play' };
}

export const currentKit = (state: PhaseState): PhaseKit => state.kits[state.roundIndex];

const withKit = (state: PhaseState, kit: PhaseKit): PhaseState => ({
  ...state,
  kits: state.kits.map((k, i) => (i === state.roundIndex ? kit : k)),
});

export function toggleFlip(state: PhaseState, channelId: string): PhaseState {
  const kit = currentKit(state);
  if (state.phase === 'done' || kit.committed) return state;
  if (!kit.channels.some((c) => c.id === channelId)) return state;
  return withKit(state, {
    ...kit,
    flips: kit.flips + 1,
    channels: kit.channels.map((c) => (c.id === channelId ? { ...c, flipped: !c.flipped } : c)),
  });
}

/** Spend a listen: the channel then shows live whether it agrees with the reference channel. */
export function listen(state: PhaseState, channelId: string): PhaseState {
  const kit = currentKit(state);
  if (state.phase === 'done' || kit.committed || kit.listensLeft <= 0) return state;
  const target = kit.channels.find((c) => c.id === channelId);
  if (!target || target.heard || kit.channels[0].id === channelId) return state;
  return withKit(state, { ...kit, listensLeft: kit.listensLeft - 1, channels: kit.channels.map((c) => (c.id === channelId ? { ...c, heard: true } : c)) });
}

/** Heard channels only: does this mic currently agree with the reference? */
export const agreesWithReference = (kit: PhaseKit, channelId: string): boolean | null => {
  const c = kit.channels.find((x) => x.id === channelId);
  if (!c || !c.heard) return null;
  return sign(c) === sign(kit.channels[0]);
};

export const scoreKit = (kit: PhaseKit): number => {
  const f = fullness(kit);
  const base = f >= IN_PHASE ? 100 : Math.round(f * 70);
  const extra = Math.max(0, kit.flips - minFlips(kit));
  return Math.max(0, Math.min(100, base - Math.min(24, extra * 4) + (f >= IN_PHASE ? kit.listensLeft * 3 : 0)));
};

/** Print the kit as it stands, then move to the next one. */
export function commitKit(state: PhaseState): PhaseState {
  const kit = currentKit(state);
  if (state.phase === 'done' || kit.committed) return state;
  const scored = withKit(state, { ...kit, committed: true, score: scoreKit(kit) });
  const last = state.roundIndex >= ROUNDS - 1;
  return last ? { ...scored, phase: 'done' } : { ...scored, roundIndex: state.roundIndex + 1 };
}

export const scorePhaseCheck = (state: PhaseState): { total: number; inPhaseKits: number; tips: string[] } => {
  const done = state.kits.filter((k) => k.committed);
  const total = done.length ? Math.round(done.reduce((n, k) => n + (k.score ?? 0), 0) / ROUNDS) : 0;
  const inPhaseKits = done.filter((k) => fullness(k) >= IN_PHASE).length;
  const tips: string[] = [];
  if (done.some((k) => fullness(k) < IN_PHASE)) tips.push('A kit went out thin. Flip one mic at a time and watch the meter climb.');
  if (done.some((k) => k.flips > minFlips(k) + 2)) tips.push('Spent flips cost points: use a listen to see which mics disagree with the first channel.');
  return { total, inPhaseKits, tips };
};
