/**
 * sessionScramble.ts
 * Pure, seeded rules for Session Setup Scramble: "Artists arrive in 45 seconds."
 * The player hands setup jobs to staff who walk to them automatically. Staff stats change how long a job
 * takes. Blockers: a narrow store corridor (one person at a time), a cable across the walkway (slows
 * walking until repaired), an occupied booth (headphones wait), and an artist who may turn up early.
 * Simulation is a deterministic tick(state, dtMs); no timers, no Math.random.
 */
import { createSeededRandom, randomInt, type RandomSource } from '@/simulation/seededRandom';
import { tc } from '@/i18n/content';

export const SESSION_MS = 45000;
/** Internal simulation step. Splitting a tick into multiples of this gives identical results. */
export const STEP_MS = 50;
/** Walking cost of one map unit at pace 1. */
export const UNIT_MS = 450;
/** Walking rate while a cable lies across the walkway. */
export const CABLE_SLOW = 0.5;

export type LocId = 'control' | 'live' | 'booth' | 'store' | 'lobby';
export type JobId = 'patch' | 'mics' | 'cable' | 'greet' | 'headphones' | 'gobos';
export type StatKey = 'tech' | 'hands' | 'people';
export type BlockReason = 'narrow' | 'booth';

export const LOCS: Record<LocId, { x: number; y: number; label: string }> = {
  control: { x: 0, y: 0, label: 'Control room' },
  live: { x: 4, y: 0, label: 'Live room' },
  booth: { x: 4, y: 3, label: 'Vocal booth' },
  store: { x: 0, y: 4, label: 'Mic store' },
  lobby: { x: 2, y: 6, label: 'Lobby' },
};

export const distance = (a: LocId, b: LocId): number =>
  Math.abs(LOCS[a].x - LOCS[b].x) + Math.abs(LOCS[a].y - LOCS[b].y);

interface JobDef {
  id: JobId;
  label: string;
  verb: string;
  loc: LocId;
  stat: StatKey;
  baseMs: number;
  weight: number;
  /** Route runs through the one-person mic store corridor (mics and the spare cable). */
  narrow?: boolean;
  /** Needs the booth to be empty before work can start. */
  booth?: boolean;
  /** Route crosses the cable: walking is slowed until the cable is repaired. */
  cabled?: boolean;
}

export const JOB_DEFS: JobDef[] = [
  { id: 'patch', label: 'Patch interface', verb: 'Patching', loc: 'control', stat: 'tech', baseMs: 7000, weight: 1.5 },
  { id: 'mics', label: 'Fetch mics', verb: 'Fetching', loc: 'store', stat: 'hands', baseMs: 6000, weight: 1.5, narrow: true },
  { id: 'cable', label: 'Repair cable', verb: 'Repairing', loc: 'live', stat: 'hands', baseMs: 5000, weight: 1, narrow: true },
  { id: 'greet', label: 'Greet artist', verb: 'Greeting', loc: 'lobby', stat: 'people', baseMs: 3500, weight: 1 },
  { id: 'headphones', label: 'Bring headphones', verb: 'Setting up', loc: 'booth', stat: 'people', baseMs: 4000, weight: 1, booth: true, cabled: true },
  { id: 'gobos', label: 'Reposition gobos', verb: 'Moving', loc: 'live', stat: 'hands', baseMs: 5500, weight: 1, cabled: true },
];

export const STAFF_ROSTER = ['Maya', 'Dev', 'Ines', 'Tomas', 'Rae', 'Kofi'];

export interface Difficulty {
  /** Multiplies every job's base duration. */
  workMult: number;
  earlyChance: number;
  boothBusyMs: [number, number];
}

export const SCRAMBLE_DIFFICULTY: Record<1 | 2 | 3, Difficulty> = {
  1: { workMult: 0.85, earlyChance: 0.35, boothBusyMs: [6000, 10000] },
  2: { workMult: 1, earlyChance: 0.55, boothBusyMs: [9000, 15000] },
  3: { workMult: 1.15, earlyChance: 0.8, boothBusyMs: [12000, 19000] },
};

export interface Staff {
  id: string;
  name: string;
  /** Walking speed multiplier. */
  pace: number;
  tech: number;
  hands: number;
  people: number;
  at: LocId;
  jobId: JobId | null;
  /** Remaining walk in unscaled ms; 0 means standing at the job. */
  walkLeftMs: number;
  walkTotalMs: number;
  from: LocId;
  blocked: BlockReason | null;
  slowed: boolean;
}

export interface Job {
  id: JobId;
  label: string;
  verb: string;
  loc: LocId;
  stat: StatKey;
  /** Duration at stat 1.0, already scaled by difficulty. */
  baseMs: number;
  weight: number;
  narrow: boolean;
  booth: boolean;
  cabled: boolean;
  /** 0..1 */
  progress: number;
  doneAtMs: number | null;
}

export type ScramblePhase = 'plan' | 'run' | 'done';

export interface ScrambleState {
  seed: string | number;
  difficulty: 1 | 2 | 3;
  elapsedMs: number;
  /** The real arrival time. Earlier than SESSION_MS when the artist turns up early. */
  deadlineMs: number;
  earlyMs: number;
  boothFreeAtMs: number;
  narrowLock: string | null;
  staff: Staff[];
  jobs: Job[];
  blockedMs: number;
  phase: ScramblePhase;
}

export function createSessionScramble(seed: string | number, difficulty: 1 | 2 | 3 = 2, rng?: RandomSource): ScrambleState {
  const cfg = SCRAMBLE_DIFFICULTY[difficulty];
  const roll = rng ?? createSeededRandom(`sessionscramble:${seed}`);

  const names = [...STAFF_ROSTER];
  const starts: LocId[] = ['control', 'live', 'lobby'];
  const stat = () => randomInt(roll, 6, 14) / 10;
  const staff: Staff[] = starts.map((at, i) => {
    const name = names.splice(randomInt(roll, 0, names.length - 1), 1)[0];
    return {
      id: `s${i}`, name, pace: randomInt(roll, 8, 13) / 10, tech: stat(), hands: stat(), people: stat(),
      at, jobId: null, walkLeftMs: 0, walkTotalMs: 0, from: at, blocked: null, slowed: false,
    };
  });

  const early = roll() < cfg.earlyChance;
  const earlyMs = early ? randomInt(roll, 6, 12) * 1000 : 0;
  const boothFreeAtMs = randomInt(roll, cfg.boothBusyMs[0] / 1000, cfg.boothBusyMs[1] / 1000) * 1000;

  return {
    seed, difficulty, elapsedMs: 0, deadlineMs: SESSION_MS - earlyMs, earlyMs, boothFreeAtMs, narrowLock: null,
    staff,
    jobs: JOB_DEFS.map((d) => ({
      id: d.id, label: d.label, verb: d.verb, loc: d.loc, stat: d.stat, baseMs: Math.round(d.baseMs * cfg.workMult),
      weight: d.weight, narrow: !!d.narrow, booth: !!d.booth, cabled: !!d.cabled, progress: 0, doneAtMs: null,
    })),
    blockedMs: 0,
    phase: 'plan',
  };
}

/** How long this person takes to finish the job from scratch. Higher matching stat means faster. */
export const workDurationMs = (job: Job, member: Staff): number => Math.round(job.baseMs / member[job.stat]);

export const jobById = (state: ScrambleState, id: JobId): Job => state.jobs.find((j) => j.id === id)!;
export const cableFixed = (state: ScrambleState): boolean => jobById(state, 'cable').doneAtMs !== null;

/** What the player can see: the nominal clock until the early-arrival warning appears. */
export const WARN_LEAD_MS = 9000;
export const earlyWarningShown = (state: ScrambleState): boolean =>
  state.earlyMs > 0 && state.elapsedMs >= state.deadlineMs - WARN_LEAD_MS;
export const visibleEtaMs = (state: ScrambleState): number =>
  Math.max(0, (earlyWarningShown(state) ? state.deadlineMs : SESSION_MS) - state.elapsedMs);

export const startSession = (state: ScrambleState): ScrambleState =>
  state.phase === 'plan' ? { ...state, phase: 'run' } : state;

/** Give a job to a staff member. Switching keeps the job's progress. One person per job. */
export function assignJob(state: ScrambleState, staffId: string, jobId: JobId): ScrambleState {
  if (state.phase === 'done') return state;
  const member = state.staff.find((s) => s.id === staffId);
  const job = state.jobs.find((j) => j.id === jobId);
  if (!member || !job || job.doneAtMs !== null) return state;
  if (state.staff.some((s) => s.id !== staffId && s.jobId === jobId)) return state;
  if (member.jobId === jobId) return state;
  const walk = distance(member.at, job.loc) * UNIT_MS;
  return {
    ...state,
    narrowLock: state.narrowLock === staffId ? null : state.narrowLock,
    staff: state.staff.map((s) =>
      s.id === staffId ? { ...s, jobId, from: s.at, walkLeftMs: walk, walkTotalMs: walk, blocked: null, slowed: false } : s,
    ),
  };
}

/** Stand a staff member down. */
export function unassign(state: ScrambleState, staffId: string): ScrambleState {
  if (state.phase === 'done') return state;
  return {
    ...state,
    narrowLock: state.narrowLock === staffId ? null : state.narrowLock,
    staff: state.staff.map((s) => (s.id === staffId ? { ...s, jobId: null, walkLeftMs: 0, walkTotalMs: 0, blocked: null, slowed: false } : s)),
  };
}

const allDone = (state: ScrambleState): boolean => state.jobs.every((j) => j.doneAtMs !== null);

function step(state: ScrambleState, ms: number): ScrambleState {
  const elapsed = state.elapsedMs + ms;
  const fixed = cableFixed(state);
  let lock = state.narrowLock;
  let blockedMs = state.blockedMs;
  const jobs = state.jobs.map((j) => ({ ...j }));
  const staff = state.staff.map((m) => ({ ...m }));

  for (const m of staff) {
    m.blocked = null;
    m.slowed = false;
    if (!m.jobId) continue;
    const job = jobs.find((j) => j.id === m.jobId)!;
    if (job.doneAtMs !== null) { m.jobId = null; continue; }

    if (job.narrow) {
      if (lock && lock !== m.id) { m.blocked = 'narrow'; blockedMs += ms; continue; }
      lock = m.id;
    }
    if (m.walkLeftMs > 0) {
      const slow = job.cabled && !fixed;
      m.slowed = slow;
      m.walkLeftMs = Math.max(0, m.walkLeftMs - ms * m.pace * (slow ? CABLE_SLOW : 1));
      if (m.walkLeftMs === 0) m.at = job.loc;
      continue;
    }
    if (job.booth && elapsed < state.boothFreeAtMs) { m.blocked = 'booth'; blockedMs += ms; continue; }

    job.progress = Math.min(1, job.progress + (ms * m[job.stat]) / job.baseMs);
    if (job.progress >= 1) {
      job.doneAtMs = elapsed;
      m.jobId = null;
      if (lock === m.id) lock = null;
    }
  }

  const next: ScrambleState = { ...state, elapsedMs: elapsed, narrowLock: lock, blockedMs, staff, jobs };
  return allDone(next) || elapsed >= state.deadlineMs ? { ...next, phase: 'done' } : next;
}

/** Advance the simulation. Pure: returns a new state. Does nothing unless the session is running. */
export function tick(state: ScrambleState, dtMs: number): ScrambleState {
  if (state.phase !== 'run' || dtMs <= 0) return state;
  let s = state;
  let left = Math.min(dtMs, state.deadlineMs - state.elapsedMs);
  while (left > 0 && s.phase === 'run') {
    const ms = Math.min(STEP_MS, left);
    s = step(s, ms);
    left -= ms;
  }
  return s;
}

/** Where to draw a staff member on the map, in map units. */
export function staffPosition(m: Staff, jobs: Job[]): { x: number; y: number } {
  const job = m.jobId ? jobs.find((j) => j.id === m.jobId) : undefined;
  if (!job || m.walkTotalMs <= 0 || m.walkLeftMs <= 0) return { x: LOCS[m.at].x, y: LOCS[m.at].y };
  const t = 1 - m.walkLeftMs / m.walkTotalMs;
  const a = LOCS[m.from], b = LOCS[job.loc];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export interface ScrambleScore {
  total: number;
  tips: string[];
}

/**
 * Standard 0-1000 result. Jobs done (weighted) 650. A fully ready room adds up to 250 for time to spare and
 * 100 for little standing around, so any complete setup beats any incomplete one.
 */
export function scoreSessionScramble(state: ScrambleState): ScrambleScore {
  const tips: string[] = [];
  const totalW = state.jobs.reduce((a, j) => a + j.weight, 0);
  const doneW = state.jobs.reduce((a, j) => a + (j.doneAtMs !== null ? j.weight : 0), 0);
  let total = (doneW / totalW) * 650;
  const complete = allDone(state);
  if (complete) {
    const spare = Math.max(0, state.deadlineMs - Math.max(...state.jobs.map((j) => j.doneAtMs ?? 0)));
    total += Math.min(1, spare / 15000) * 250;
    total += (1 - Math.min(1, state.blockedMs / 15000)) * 100;
  } else {
    tips.push(tc('mg.sessionScramble.tip_long_jobs', 'Start the long jobs first and give each one to the person whose stat fits.'));
  }
  if (state.earlyMs > 0) tips.push(tc('mg.sessionScramble.tip_early', 'The artist can show up early: keep a spare pair of hands on the lobby and booth.'));
  if (state.blockedMs > 4000) tips.push(tc('mg.sessionScramble.tip_queued', 'Staff queued in the mic store or waited on the booth. Send someone else meanwhile.'));
  if (!cableFixed(state)) tips.push(tc('mg.sessionScramble.tip_cable', 'Repair the cable first: it halves walking speed to the live room and booth.'));
  return { total: Math.round(Math.max(0, Math.min(1000, total))), tips };
}
