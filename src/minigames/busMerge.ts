/**
 * busMerge.ts
 * Pure, seeded rules for Bus & Stem Merge, a 2048-style routing puzzle. Tracks slide around a
 * 4x4 board; touching compatible tracks sum into buses, buses into stems, stems into the mix
 * (Kick+Snare -> Drum Bus, Guitar L+R -> Guitar Bus, DRUM+MUSIC+VOX -> Mix). Every merge eats
 * headroom, deep routing is penalised, and the Hero Sample is a special track that is only
 * "printed" by merging it into the finished mix. No DOM, no Math.random: spawns come from rolls
 * pre-drawn from the seeded RNG, so every move is a pure function of state.
 */
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import { tc } from '@/i18n/content';

export type TrackKind =
  | 'kick' | 'snare' | 'overhead' | 'gtr-l' | 'gtr-r' | 'bass' | 'keys' | 'vox-lead' | 'vox-dbl' | 'sample'
  | 'drum-bus' | 'guitar-bus' | 'rhythm-bus'
  | 'drums' | 'music' | 'vox'
  | 'premix' | 'mix';

export const TRACK_LABELS: Record<TrackKind, string> = {
  kick: 'Kick', snare: 'Snare', overhead: 'Overheads', 'gtr-l': 'Guitar L', 'gtr-r': 'Guitar R',
  bass: 'Bass', keys: 'Keys', 'vox-lead': 'Lead Vox', 'vox-dbl': 'Vox Double', sample: 'Hero Sample',
  'drum-bus': 'Drum Bus', 'guitar-bus': 'Guitar Bus', 'rhythm-bus': 'Rhythm Bus',
  drums: 'DRUM stem', music: 'MUSIC stem', vox: 'VOX stem', premix: 'Pre-mix', mix: 'MIX',
};

export type TrackFamily = 'drums' | 'music' | 'vox' | 'mix' | 'special';
export const TRACK_FAMILY: Record<TrackKind, TrackFamily> = {
  kick: 'drums', snare: 'drums', overhead: 'drums', 'drum-bus': 'drums', drums: 'drums',
  'gtr-l': 'music', 'gtr-r': 'music', bass: 'music', keys: 'music', 'guitar-bus': 'music', 'rhythm-bus': 'music', music: 'music',
  'vox-lead': 'vox', 'vox-dbl': 'vox', vox: 'vox',
  premix: 'mix', mix: 'mix', sample: 'special',
};

export const RAW_KINDS: TrackKind[] = ['kick', 'snare', 'overhead', 'gtr-l', 'gtr-r', 'bass', 'keys', 'vox-lead', 'vox-dbl'];

/** Unordered recipes. Same-kind raw tracks may also be layered (see mergeResult). */
const RECIPES: [TrackKind, TrackKind, TrackKind][] = [
  ['kick', 'snare', 'drum-bus'],
  ['drum-bus', 'overhead', 'drums'],
  ['gtr-l', 'gtr-r', 'guitar-bus'],
  ['bass', 'keys', 'rhythm-bus'],
  ['guitar-bus', 'rhythm-bus', 'music'],
  ['vox-lead', 'vox-dbl', 'vox'],
  ['drums', 'music', 'premix'],
  ['premix', 'vox', 'mix'],
  ['mix', 'sample', 'mix'],
];

/** Milestones that count toward the score, in build order. */
export const MILESTONES: TrackKind[] = ['drum-bus', 'guitar-bus', 'rhythm-bus', 'drums', 'music', 'vox', 'premix', 'mix'];

/** Routing depth of a clean build: Mix = 4. Anything deeper is excess bus depth. */
export const PAR_DEPTH = 4;

export interface Track {
  kind: TrackKind;
  /** 0 for a raw track, 1 + deepest input for anything merged. */
  depth: number;
}

export type BusDir = 'up' | 'down' | 'left' | 'right';
export type BusOutcome = 'clipped' | 'out-of-moves' | 'stuck' | 'filed' | null;

export interface BusMergeState {
  size: number;
  cells: (Track | null)[];
  /** Tracks still to arrive, in order. */
  deck: TrackKind[];
  /** Pre-drawn rolls (0..1) that choose which empty cell each arrival lands in. */
  rolls: number[];
  spawned: number;
  movesLeft: number;
  maxMoves: number;
  headroom: number;
  startHeadroom: number;
  merges: number;
  built: TrackKind[];
  mixDepth: number;
  /** The Hero Sample was merged into the finished mix. */
  printed: boolean;
  finished: boolean;
  outcome: BusOutcome;
}

export interface BusMergeConfig {
  difficulty?: 1 | 2 | 3;
  /** Extra headroom (engineer skill / gear condition). */
  bonusHeadroom?: number;
}

export interface BusMergeDifficulty {
  moves: number;
  headroom: number;
  /** Duplicate raw tracks that clutter the board. */
  extras: number;
}

export const BUS_DIFFICULTY: Record<1 | 2 | 3, BusMergeDifficulty> = {
  1: { moves: 60, headroom: 28, extras: 2 },
  2: { moves: 50, headroom: 24, extras: 4 },
  3: { moves: 44, headroom: 21, extras: 6 },
};

const SIZE = 4;
const INITIAL_TRACKS = 5;

const shuffle = <T,>(items: T[], roll: RandomSource): T[] => {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(roll, 0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export function createBusMerge(seed: string | number, config: BusMergeConfig = {}, rng?: RandomSource): BusMergeState {
  const level = BUS_DIFFICULTY[config.difficulty ?? 1];
  const roll = rng ?? createSeededRandom(`busmerge:${seed}`);
  const extras: TrackKind[] = Array.from({ length: level.extras }, () => RAW_KINDS[randomInt(roll, 0, RAW_KINDS.length - 1)]);
  const all = shuffle<TrackKind>([...RAW_KINDS, ...extras, 'sample'], roll);
  const rolls = Array.from({ length: all.length + 8 }, () => roll());

  const cells: (Track | null)[] = Array.from({ length: SIZE * SIZE }, () => null);
  const free = Array.from({ length: SIZE * SIZE }, (_, i) => i);
  for (let k = 0; k < INITIAL_TRACKS; k++) {
    const [index] = free.splice(randomInt(roll, 0, free.length - 1), 1);
    cells[index] = { kind: all[k], depth: 0 };
  }
  const headroom = level.headroom + Math.max(0, config.bonusHeadroom ?? 0);
  return {
    size: SIZE, cells, deck: all.slice(INITIAL_TRACKS), rolls, spawned: 0,
    movesLeft: level.moves, maxMoves: level.moves, headroom, startHeadroom: headroom,
    merges: 0, built: [], mixDepth: 0, printed: false, finished: false, outcome: null,
  };
}

/** What two tracks merge into, or null when they cannot merge. */
export function mergeResult(a: Track, b: Track): Track | null {
  const depth = Math.max(a.depth, b.depth) + 1;
  const recipe = RECIPES.find(([x, y]) => (a.kind === x && b.kind === y) || (a.kind === y && b.kind === x));
  if (recipe) {
    // Printing the sample into a mix does not make the routing any deeper.
    return { kind: recipe[2], depth: recipe[2] === 'mix' && (a.kind === 'sample' || b.kind === 'sample') ? Math.max(a.depth, b.depth) : depth };
  }
  // Layering two of the same raw track is legal but spends headroom and adds depth.
  if (a.kind === b.kind && RAW_KINDS.includes(a.kind)) return { kind: a.kind, depth };
  return null;
}

/** Headroom a merge eats: deeper routing costs more. Printing the sample is cheap. */
export const mergeCost = (result: Track, a: Track, b: Track): number =>
  a.kind === 'sample' || b.kind === 'sample' ? 1 : result.depth;

/** Cell indices of one line, ordered from the edge tiles slide toward. */
function line(size: number, dir: BusDir, n: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < size; k++) {
    if (dir === 'left') out.push(n * size + k);
    else if (dir === 'right') out.push(n * size + (size - 1 - k));
    else if (dir === 'up') out.push(k * size + n);
    else out.push((size - 1 - k) * size + n);
  }
  return out;
}

interface SlideResult { cells: (Track | null)[]; merged: { a: Track; b: Track; into: Track }[]; moved: boolean }

function slide(state: BusMergeState, dir: BusDir): SlideResult {
  const cells = state.cells.slice();
  const merged: SlideResult['merged'] = [];
  let moved = false;
  for (let n = 0; n < state.size; n++) {
    const idx = line(state.size, dir, n);
    const tracks = idx.map((i) => state.cells[i]).filter((t): t is Track => !!t);
    const outLine: (Track | null)[] = [];
    for (let k = 0; k < tracks.length; k++) {
      const next = tracks[k + 1];
      const into = next ? mergeResult(tracks[k], next) : null;
      if (next && into) {
        merged.push({ a: tracks[k], b: next, into });
        outLine.push(into);
        k++;
      } else outLine.push(tracks[k]);
    }
    idx.forEach((cellIndex, k) => {
      const t = outLine[k] ?? null;
      if (t !== state.cells[cellIndex]) moved = true;
      cells[cellIndex] = t;
    });
  }
  return { cells, merged, moved };
}

export const canMove = (state: BusMergeState): boolean =>
  !state.finished && (['up', 'down', 'left', 'right'] as BusDir[]).some((d) => slide(state, d).moved);

/** Slide every track one way. Illegal (no-op) moves return the same state and cost nothing. Pure. */
export function move(state: BusMergeState, dir: BusDir): BusMergeState {
  if (state.finished || state.movesLeft <= 0) return state;
  const res = slide(state, dir);
  if (!res.moved) return state;

  let headroom = state.headroom;
  const built = state.built.slice();
  let mixDepth = state.mixDepth;
  let printed = state.printed;
  for (const m of res.merged) {
    headroom -= mergeCost(m.into, m.a, m.b);
    if (MILESTONES.includes(m.into.kind) && m.a.kind !== m.b.kind && !built.includes(m.into.kind) && m.a.kind !== 'sample' && m.b.kind !== 'sample') {
      built.push(m.into.kind);
    }
    if (m.into.kind === 'mix' && m.a.kind !== 'sample' && m.b.kind !== 'sample') mixDepth = Math.max(mixDepth, m.into.depth);
    if (m.a.kind === 'sample' || m.b.kind === 'sample') printed = true;
  }

  let cells = res.cells;
  let deck = state.deck;
  let spawned = state.spawned;
  const empty = cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (deck.length && empty.length) {
    const spot = empty[Math.min(empty.length - 1, Math.floor((state.rolls[spawned % state.rolls.length] ?? 0) * empty.length))];
    cells = cells.slice();
    cells[spot] = { kind: deck[0], depth: 0 };
    deck = deck.slice(1);
    spawned += 1;
  }

  let next: BusMergeState = {
    ...state, cells, deck, spawned, headroom, built, mixDepth, printed,
    movesLeft: state.movesLeft - 1, merges: state.merges + res.merged.length,
  };
  if (headroom < 0) next = { ...next, finished: true, outcome: 'clipped' };
  else if (next.movesLeft <= 0) next = { ...next, finished: true, outcome: 'out-of-moves' };
  else if (!canMove(next)) next = { ...next, finished: true, outcome: 'stuck' };
  return next;
}

/** Bounce what is on the board and file the result. */
export const finish = (state: BusMergeState): BusMergeState =>
  state.finished ? state : { ...state, finished: true, outcome: 'filed' };

export interface BusMergeScore {
  total: number;
  milestones: number;
  mixed: boolean;
  excessDepth: number;
  printed: boolean;
  clipped: boolean;
  tips: string[];
}

/**
 * Standard 0-1000 result.
 * Milestones built (8 x 62.5) 500; with the MIX done: headroom left 150, moves left 150,
 * depth at par 100 (minus 50 per extra level), Hero Sample printed into the mix 100.
 * Clipping the bus forfeits the headroom, moves, depth and sample bonuses.
 */
export function scoreBusMerge(state: BusMergeState): BusMergeScore {
  const tips: string[] = [];
  const mixed = state.built.includes('mix');
  const clipped = state.outcome === 'clipped' || state.headroom < 0;
  const milestones = state.built.length;
  const excessDepth = mixed ? Math.max(0, state.mixDepth - PAR_DEPTH) : 0;

  let total = (milestones / MILESTONES.length) * 500;
  if (mixed && !clipped) {
    total += Math.max(0, state.headroom / Math.max(1, state.startHeadroom)) * 150;
    total += (state.movesLeft / Math.max(1, state.maxMoves)) * 150;
    total += Math.max(0, 100 - excessDepth * 50);
    if (state.printed) total += 100;
  }
  total = Math.round(Math.max(0, Math.min(1000, total)));

  if (clipped) tips.push(tc('mg.busMerge.tip_clipped', 'The master bus clipped. Every merge eats headroom, so avoid layering duplicates.'));
  else if (!mixed) tips.push(tc('mg.busMerge.tip_no_mix', 'No final mix yet: DRUM + MUSIC make the pre-mix, then add VOX.'));
  if (excessDepth > 0) tips.push(tc('mg.busMerge.tip_depth', 'Layering duplicate tracks made the routing deeper than it needs to be.'));
  if (mixed && !clipped && !state.printed) tips.push(tc('mg.busMerge.tip_sample', 'The Hero Sample never made it into the mix. Merge it with the finished MIX.'));
  if (state.outcome === 'stuck') tips.push(tc('mg.busMerge.tip_stuck', 'The board locked up. Keep stray tracks out of the way of the buses.'));
  return { total, milestones, mixed, excessDepth, printed: state.printed, clipped, tips };
}
