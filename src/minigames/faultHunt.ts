/**
 * faultHunt.ts
 * Pure, seeded rules for Patchbay Panic (Fault Hunt): a patchbay grid hides faulty jacks.
 * Probing a jack reports how many of its neighbours are faulty (the classic proximity-clue
 * idea, written from scratch for RST). Probes are limited; flag the jacks you think are bad.
 * No DOM, no Math.random: every roll comes from the injected seeded RNG.
 */
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import { tc } from '@/i18n/content';

export type FaultKind = 'bad-cable' | 'noisy-psu' | 'dead-preamp' | 'ground-loop' | 'phase-flip';

export const FAULT_LABELS: Record<FaultKind, string> = {
  'bad-cable': 'Bad cable',
  'noisy-psu': 'Noisy PSU',
  'dead-preamp': 'Dead preamp',
  'ground-loop': 'Ground loop',
  'phase-flip': 'Phase flip',
};

const FAULT_KINDS = Object.keys(FAULT_LABELS) as FaultKind[];

export type CellStatus = 'hidden' | 'probed' | 'tripped';

export interface FaultCell {
  /** The hidden fault, or null for a healthy jack. */
  fault: FaultKind | null;
  /** Faulty neighbours (8-way). */
  adjacent: number;
  status: CellStatus;
  flagged: boolean;
}

export interface FaultHuntState {
  size: number;
  cells: FaultCell[];
  faultCount: number;
  probesLeft: number;
  trips: number;
  /** Set when the player files the report (or runs out of probes and does). */
  finished: boolean;
}

export interface FaultHuntConfig {
  /** 1 = 5x5 with 4 faults, 2 = 5x5 with 5, 3 = 6x6 with 8. */
  difficulty?: 1 | 2 | 3;
  /** Free safe clues revealed up front (engineer skill or gear condition can raise this). */
  freeClues?: number;
}

export interface FaultHuntDifficulty {
  size: number;
  faults: number;
  probes: number;
}

export const FAULT_DIFFICULTY: Record<1 | 2 | 3, FaultHuntDifficulty> = {
  1: { size: 5, faults: 4, probes: 9 },
  2: { size: 5, faults: 5, probes: 9 },
  3: { size: 6, faults: 8, probes: 11 },
};

export const neighbours = (size: number, index: number): number[] => {
  const x = index % size;
  const y = Math.floor(index / size);
  const out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) out.push(ny * size + nx);
    }
  }
  return out;
};

export function createFaultHunt(seed: string | number, config: FaultHuntConfig = {}, rng?: RandomSource): FaultHuntState {
  const { size, faults, probes } = FAULT_DIFFICULTY[config.difficulty ?? 1];
  const roll = rng ?? createSeededRandom(`faulthunt:${seed}`);
  const total = size * size;
  const cells: FaultCell[] = Array.from({ length: total }, () => ({
    fault: null,
    adjacent: 0,
    status: 'hidden' as CellStatus,
    flagged: false,
  }));

  const free = Array.from({ length: total }, (_, i) => i);
  for (let placed = 0; placed < faults; placed++) {
    const pick = randomInt(roll, 0, free.length - 1);
    const [index] = free.splice(pick, 1);
    // First faults cover every category so higher difficulties mix kinds rather than just adding more.
    cells[index].fault = placed < FAULT_KINDS.length ? FAULT_KINDS[placed] : FAULT_KINDS[randomInt(roll, 0, FAULT_KINDS.length - 1)];
  }
  cells.forEach((_, i) => {
    cells[i].adjacent = neighbours(size, i).filter((n) => cells[n].fault).length;
  });

  let state: FaultHuntState = { size, cells, faultCount: faults, probesLeft: probes, trips: 0, finished: false };

  // Free clues: prefer healthy jacks whose clue is 0 or 1 (cheap to read), deterministic order.
  const clueable = state.cells
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !c.fault)
    .sort((a, b) => a.c.adjacent - b.c.adjacent || a.i - b.i);
  const clues = Math.max(0, Math.min(config.freeClues ?? 0, clueable.length));
  for (let k = 0; k < clues; k++) state = reveal(state, clueable[k].i);
  return state;
}

/** Flood-reveal from a healthy jack with no faulty neighbours. Pure. */
function reveal(state: FaultHuntState, index: number): FaultHuntState {
  const cells = state.cells.map((c) => ({ ...c }));
  const queue = [index];
  while (queue.length) {
    const i = queue.pop() as number;
    const cell = cells[i];
    if (cell.status !== 'hidden' || cell.fault) continue;
    cell.status = 'probed';
    cell.flagged = false;
    if (cell.adjacent === 0) queue.push(...neighbours(state.size, i));
  }
  return { ...state, cells };
}

export const canAct = (state: FaultHuntState) => !state.finished;

/** Spend a probe on a jack. Hitting a fault trips it (costs the probe and counts against the score). */
export function probe(state: FaultHuntState, index: number): FaultHuntState {
  const cell = state.cells[index];
  if (!cell || state.finished || cell.status !== 'hidden' || state.probesLeft <= 0) return state;
  let next: FaultHuntState;
  if (cell.fault) {
    const cells = state.cells.map((c, i) => (i === index ? { ...c, status: 'tripped' as CellStatus, flagged: false } : c));
    next = { ...state, cells, trips: state.trips + 1 };
  } else {
    next = reveal(state, index);
  }
  next = { ...next, probesLeft: next.probesLeft - 1 };
  return next.probesLeft <= 0 ? { ...next, finished: true } : next;
}

export function toggleFlag(state: FaultHuntState, index: number): FaultHuntState {
  const cell = state.cells[index];
  if (!cell || state.finished || cell.status !== 'hidden') return state;
  const flags = state.cells.filter((c) => c.flagged).length;
  if (!cell.flagged && flags >= state.faultCount) return state;
  const cells = state.cells.map((c, i) => (i === index ? { ...c, flagged: !c.flagged } : c));
  return { ...state, cells };
}

export const finish = (state: FaultHuntState): FaultHuntState => ({ ...state, finished: true });

export interface FaultHuntScore {
  total: number;
  found: number;
  wrongFlags: number;
  trips: number;
  tips: string[];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Standard 0-1000 result.
 * Faults located (flagged, or tripped and logged) 650, healthy jacks cleared 150, probes left over 200;
 * each wrong flag costs 60 and each tripped fault is "found the hard way" for half credit and a 40 penalty.
 */
export function scoreFaultHunt(state: FaultHuntState, maxProbes: number): FaultHuntScore {
  const tips: string[] = [];
  const faults = state.cells.filter((c) => c.fault);
  const flaggedRight = faults.filter((c) => c.flagged).length;
  const wrongFlags = state.cells.filter((c) => c.flagged && !c.fault).length;
  const tripped = faults.filter((c) => c.status === 'tripped').length;
  const found = flaggedRight + tripped;
  const healthy = state.cells.filter((c) => !c.fault);
  const cleared = healthy.filter((c) => c.status === 'probed').length;

  const locate = ((flaggedRight + tripped * 0.5) / Math.max(1, state.faultCount)) * 650;
  const coverage = (cleared / Math.max(1, healthy.length)) * 150;
  const efficiency = flaggedRight > 0 ? (state.probesLeft / Math.max(1, maxProbes)) * 200 : 0;
  const total = Math.round(clamp(locate + coverage + efficiency - wrongFlags * 60 - tripped * 40, 0, 1000));

  if (wrongFlags > 0) tips.push(tc('mg.faultHunt.tip_wrong_flag', 'A flag went on a healthy jack. Check the numbers around it before committing.'));
  if (tripped > 0) tips.push(tc('mg.faultHunt.tip_tripped', 'Probing a faulty jack trips it. Probe jacks whose neighbours all add up first.'));
  if (found < state.faultCount) tips.push(tc('mg.faultHunt.tip_missed', 'Some faults were left in the rack. A number equal to the unprobed neighbours means they are all faults.'));
  return { total, found, wrongFlags, trips: tripped, tips };
}
