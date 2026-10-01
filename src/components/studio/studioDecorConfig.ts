/**
 * Studio decor configuration — pure functions, no Pixi.
 *
 * Everything the decor renderer needs to decide (which trophies hang on the wall,
 * which era prop appears, where planks and dust motes sit) is computed here so it
 * is deterministic and unit-testable. The renderer (studioDecor.ts) only draws.
 */
import { createSeededRandom } from '@/simulation/seededRandom';
import type { GameState } from '@/types/game';
import { visualEraId } from '@/utils/eraProgression';

/* ------------------------------------------------------------ trophy wall */

export type TrophyKind = 'platinum' | 'gold' | 'award' | 'empty';

export interface TrophyInput {
  /** Releases that scored 90+ (S-rank): hung as platinum discs. */
  platinum: number;
  /** Releases that scored 80-89 (A-rank): hung as gold discs. */
  gold: number;
  /** Earned achievements: hung as small star plaques. */
  awards: number;
}

export interface TrophySlot {
  index: number;
  kind: TrophyKind;
  /** Tile-x centre on the right wall. */
  x: number;
}

export const TROPHY_SLOTS = 6;
/** Tile-x centres along the right wall: clear of the booth glass (x 1-3.5, low) and the window (x 5.1+). */
const TROPHY_X = [0.75, 1.5, 2.25, 3.0, 3.75, 4.5] as const;

/** Derive trophy counts from the settlement ledger + unlocked achievements. Safe on sparse saves. */
export const getTrophyInput = (
  state: Pick<GameState, 'financials' | 'unlockedAchievements'>,
): TrophyInput => {
  const reports = state.financials?.reports ?? [];
  let platinum = 0;
  let gold = 0;
  for (const r of reports) {
    const q = r?.overallQualityScore ?? 0;
    if (q >= 90) platinum++;
    else if (q >= 80) gold++;
  }
  return { platinum, gold, awards: Object.keys(state.unlockedAchievements ?? {}).length };
};

/**
 * Fill the wall best-first (platinum, gold, awards) and leave the rest as empty hangers,
 * so the wall is a visible "room to grow" cue rather than a blank stretch.
 */
export const getTrophyWall = (input: TrophyInput): TrophySlot[] => {
  const kinds: TrophyKind[] = [];
  for (let i = 0; i < Math.max(0, input.platinum); i++) kinds.push('platinum');
  for (let i = 0; i < Math.max(0, input.gold); i++) kinds.push('gold');
  // Awards are cheaper to earn, so they may never crowd out real records.
  const awardSlots = Math.max(0, Math.min(2, Math.ceil(input.awards / 4)));
  for (let i = 0; i < awardSlots; i++) kinds.push('award');
  return TROPHY_X.map((x, index) => ({ index, x, kind: kinds[index] ?? 'empty' }));
};

export const trophyKey = (input: TrophyInput): string => {
  const slots = getTrophyWall(input);
  return slots.map((s) => s.kind[0]).join('');
};

/* -------------------------------------------------------------- era props */

export type EraProp = 'brass-lamp' | 'neon-sign' | 'lava-lamp' | 'led-strip';

export interface EraDecorSpec {
  eraId: string;
  prop: EraProp;
  /** Primary glow colour of the signature prop. */
  glow: number;
  /** Secondary glow colour. */
  glow2: number;
  /** Warm/cool tone of the window light shaft. */
  daylight: number;
  /** Wainscot tone (lower wall band). */
  wainscot: number;
  /** Plank tones (three-step). */
  planks: [number, number, number];
}

const ERA_DECOR: Record<string, Omit<EraDecorSpec, 'eraId'>> = {
  analog60s: { prop: 'brass-lamp', glow: 0xffc266, glow2: 0xff9a4d, daylight: 0xffe0a6, wainscot: 0x3a2a20, planks: [0x6a4d38, 0x604532, 0x58402e] },
  digital80s: { prop: 'neon-sign', glow: 0xff4fd8, glow2: 0x4fd8ff, daylight: 0xf3d2ff, wainscot: 0x2a1f36, planks: [0x4d3a46, 0x45333e, 0x3e2e38] },
  internet2000s: { prop: 'lava-lamp', glow: 0xff7a45, glow2: 0x7ad9ff, daylight: 0xdaf2ff, wainscot: 0x1f2f36, planks: [0x4a4a44, 0x42423d, 0x3b3b36] },
  streaming2020s: { prop: 'led-strip', glow: 0x7bf0c8, glow2: 0xa78bfa, daylight: 0xeaf7ff, wainscot: 0x1f2b27, planks: [0x5a4a3e, 0x52443a, 0x4a3d33] },
};

export const getEraDecor = (eraId?: string): EraDecorSpec => {
  const id = visualEraId(eraId ?? 'analog60s');
  const spec = ERA_DECOR[id] ?? ERA_DECOR.analog60s;
  return { eraId: ERA_DECOR[id] ? id : 'analog60s', ...spec };
};

/* -------------------------------------------------------- studio time of day */

/**
 * Real seconds for one in-game day on the wall clock. 12 minutes keeps the hour hand
 * drifting slowly (30s per in-game hour) and the minute hand ticking twice a second,
 * and the daylight follows the same clock so the window, tint and dial always agree.
 */
export const DAY_CYCLE_SECONDS = 720;
/** The studio opens at 09:00 when the scene starts. */
export const STUDIO_START_HOUR = 9;

export interface StudioTime {
  /** 0..24 */
  hours24: number;
  /** 0..11 */
  hour: number;
  /** 0..59, whole minutes: the dial ticks rather than sweeps */
  minute: number;
  /** 0 = deepest night, 1 = full daylight */
  dayness: number;
}

/** Wall-clock time and matching daylight for `tSeconds` of scene time. */
export const getStudioTime = (tSeconds: number): StudioTime => {
  const total = (STUDIO_START_HOUR + (tSeconds / DAY_CYCLE_SECONDS) * 24) % 24;
  const hours24 = total < 0 ? total + 24 : total;
  const minutesTotal = Math.floor(hours24 * 60 + 1e-6); // epsilon: float error must not flip a tick
  // Brightest at 13:00, darkest at 01:00; clip the tails so midday and midnight hold a while.
  const raw = 0.5 + 0.5 * Math.cos(((hours24 - 13) / 24) * Math.PI * 2);
  const dayness = Math.min(1, Math.max(0, (raw - 0.2) / 0.6));
  return { hours24, hour: Math.floor(minutesTotal / 60) % 12, minute: minutesTotal % 60, dayness };
};

/** 0 = deepest night, 1 = full daylight. Follows the wall clock (see getStudioTime). */
export const getDayness = (tSeconds: number): number => getStudioTime(tSeconds).dayness;

/* ---------------------------------------------------------- floor planks */

export interface Plank {
  /** Tile-space rectangle along +x. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Index into the era's three plank tones. */
  tone: 0 | 1 | 2;
}

/**
 * Deterministic staggered plank layout. Rows run along +x; joints are offset per
 * row so the floor reads as real boards instead of a checkerboard.
 */
export const getPlankLayout = (seed: string | number, roomW: number, roomD: number, rowHeight = 0.5): Plank[] => {
  const rng = createSeededRandom(`planks:${seed}`);
  const planks: Plank[] = [];
  const rows = Math.round(roomD / rowHeight);
  let lastTone = -1;
  for (let r = 0; r < rows; r++) {
    let x = -rng() * 1.6; // stagger the first joint
    while (x < roomW) {
      const len = 1.6 + rng() * 1.6;
      let tone = Math.floor(rng() * 3);
      if (tone === lastTone) tone = (tone + 1) % 3;
      lastTone = tone;
      planks.push({
        x0: Math.max(0, x),
        x1: Math.min(roomW, x + len),
        y0: r * rowHeight,
        y1: (r + 1) * rowHeight,
        tone: tone as 0 | 1 | 2,
      });
      x += len;
    }
  }
  return planks.filter((p) => p.x1 - p.x0 > 0.05);
};

/* ------------------------------------------------------------ dust motes */

export interface MoteSeed {
  /** 0..1 position inside the light shaft (u along the beam, v across it). */
  u: number;
  v: number;
  speed: number;
  phase: number;
  size: number;
}

export const getMoteSeeds = (count: number, seed: string | number = 'motes'): MoteSeed[] => {
  const rng = createSeededRandom(`motes:${seed}`);
  return Array.from({ length: Math.max(0, count) }, () => ({
    u: rng(),
    v: rng(),
    speed: 0.012 + rng() * 0.03,
    phase: rng() * Math.PI * 2,
    size: 0.7 + rng() * 1.3,
  }));
};

/** Position of a mote at time t inside the beam (drifting slowly, wrapping). */
export const advanceMote = (m: MoteSeed, tSeconds: number): { u: number; v: number; alpha: number } => {
  const u = (m.u + tSeconds * m.speed) % 1;
  const v = (m.v + Math.sin(tSeconds * 0.35 + m.phase) * 0.06 + 1) % 1;
  // Fade at both ends of the beam so motes never pop in or out.
  const edge = Math.min(u, 1 - u) * 4;
  const twinkle = 0.55 + 0.45 * Math.sin(tSeconds * 1.6 + m.phase);
  return { u, v, alpha: Math.max(0, Math.min(1, edge)) * twinkle };
};
