/**
 * Studio decor configuration — pure functions, no Pixi.
 *
 * Everything the decor renderer needs to decide (which album covers hang above
 * the booth, which era prop appears, where planks and dust motes sit) is
 * computed here so it is deterministic and unit-testable. The renderer
 * (studioDecor.ts) only draws.
 */
import { createSeededRandom } from '@/simulation/seededRandom';
import type { GameState } from '@/types/game';
import { ERA_DEFINITIONS, visualEraId } from '@/utils/eraProgression';

/* -------------------------------------------------------- album cover wall */

/** One completed release hung above the booth. */
export interface AlbumCoverEntry {
  projectId: string;
  title: string;
  genre?: string;
  score: number;
  artist?: string;
}

export type TrophyKind = 'cover' | 'empty';

/**
 * Album covers for the wall above the vocal booth.
 * Sourced from `financials.reports` (settlement ledger). Reports do not store
 * `bookingRoomId`, so the wall shows all studio completions — not room-scoped.
 */
export interface TrophyInput {
  covers: AlbumCoverEntry[];
}

export interface TrophySlot {
  index: number;
  kind: TrophyKind;
  /** Tile-x centre on the right wall. */
  x: number;
  /** Present when kind === 'cover'. */
  cover?: AlbumCoverEntry;
}

export const TROPHY_SLOTS = 6;
/** Tile-x centres along the right wall: clear of the booth glass (x 1-3.5, low) and the window (x 5.1+). */
const TROPHY_X = [0.75, 1.5, 2.25, 3.0, 3.75, 4.5] as const;

/** Derive album-cover wall entries from the settlement ledger. Safe on sparse saves. */
export const getTrophyInput = (
  state: Pick<GameState, 'financials'>,
): TrophyInput => {
  const reports = state.financials?.reports ?? [];
  const covers: AlbumCoverEntry[] = [];
  for (const r of reports) {
    if (!r?.projectId) continue;
    covers.push({
      projectId: r.projectId,
      title: r.projectTitle || 'Untitled Session',
      genre: r.genre,
      score: r.overallQualityScore ?? 0,
      artist: r.assignedPerson?.name,
    });
  }
  return { covers };
};

/**
 * Fill slots with the most recent completions first; leftover hangers stay empty
 * (subtle frames — never stars) so the wall reads as "room to grow".
 */
export const getTrophyWall = (input: TrophyInput): TrophySlot[] => {
  const recent = [...(input.covers ?? [])].slice(-TROPHY_SLOTS).reverse();
  return TROPHY_X.map((x, index) => {
    const cover = recent[index];
    return cover
      ? { index, x, kind: 'cover' as const, cover }
      : { index, x, kind: 'empty' as const };
  });
};

export const trophyKey = (input: TrophyInput): string => {
  const slots = getTrophyWall(input);
  return slots.map((s) => (s.cover ? s.cover.projectId : '_')).join('|');
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

export const getEraDecor = (eraId?: string, currentYear?: number): EraDecorSpec => {
  // The displayed year also covers older saves whose era id disagrees with their date.
  const id = ERA_DEFINITIONS.find(era => currentYear !== undefined && currentYear >= era.startYear && currentYear <= era.endYear)?.id
    ?? visualEraId(eraId ?? 'analog60s');
  const spec = ERA_DECOR[id] ?? ERA_DECOR.analog60s;
  return { eraId: ERA_DECOR[id] ? id : 'analog60s', ...spec };
};

/* -------------------------------------------------------- era lighting kits */

/**
 * Data-driven practicals / glow overlays (ux-visual P2).
 * Values feed `buildDecorLights` — keep one continuous WebGL living studio.
 */
export interface EraLightingKit {
  eraId: string;
  /** Airborne window-shaft fill alpha (before dayness). */
  shaftAirAlpha: number;
  /** Floor spill fill alpha under the shaft. */
  shaftFloorAlpha: number;
  moteCount: number;
  moteBaseAlpha: number;
  rugPool: { color: number; alpha: number; rx: number; ry: number };
  deskPool: { color: number; alpha: number; rx: number; ry: number };
  /** Multiplier on era signature prop glows (lamp / neon / lava / LED). */
  propGlowScale: number;
  /** Tier at which the booth-header neon practical lights up (typically 5). */
  neonFromTier: number;
  neonPrimary: number;
  neonSecondary: number;
  neonPulseHz: number;
  /** Soft bloom tint for dynamic console/TV cores when bloom is enabled. */
  bloomAccent: number;
}

const ERA_LIGHTING: Record<string, Omit<EraLightingKit, 'eraId'>> = {
  analog60s: {
    shaftAirAlpha: 0.042,
    shaftFloorAlpha: 0.052,
    moteCount: 12,
    moteBaseAlpha: 0.32,
    rugPool: { color: 0xffb45a, alpha: 0.07, rx: 92, ry: 34 },
    deskPool: { color: 0xffd58a, alpha: 0.05, rx: 56, ry: 20 },
    propGlowScale: 1.08,
    neonFromTier: 5,
    neonPrimary: 0xffc266,
    neonSecondary: 0xff9a4d,
    neonPulseHz: 1.15,
    bloomAccent: 0xffaa33,
  },
  digital80s: {
    shaftAirAlpha: 0.034,
    shaftFloorAlpha: 0.04,
    moteCount: 10,
    moteBaseAlpha: 0.28,
    rugPool: { color: 0xc77dff, alpha: 0.06, rx: 86, ry: 32 },
    deskPool: { color: 0x5aa9e6, alpha: 0.05, rx: 52, ry: 19 },
    propGlowScale: 1.18,
    neonFromTier: 5,
    neonPrimary: 0xff4fd8,
    neonSecondary: 0x4fd8ff,
    neonPulseHz: 2.4,
    bloomAccent: 0xc77dff,
  },
  internet2000s: {
    shaftAirAlpha: 0.036,
    shaftFloorAlpha: 0.044,
    moteCount: 10,
    moteBaseAlpha: 0.3,
    rugPool: { color: 0xff7a45, alpha: 0.06, rx: 88, ry: 33 },
    deskPool: { color: 0x7ad9ff, alpha: 0.045, rx: 54, ry: 19 },
    propGlowScale: 1.12,
    neonFromTier: 5,
    neonPrimary: 0xff7a45,
    neonSecondary: 0x7ad9ff,
    neonPulseHz: 1.8,
    bloomAccent: 0x5aa9e6,
  },
  streaming2020s: {
    shaftAirAlpha: 0.03,
    shaftFloorAlpha: 0.038,
    moteCount: 8,
    moteBaseAlpha: 0.26,
    rugPool: { color: 0x7bf0c8, alpha: 0.055, rx: 84, ry: 30 },
    deskPool: { color: 0xa78bfa, alpha: 0.05, rx: 50, ry: 18 },
    propGlowScale: 1.22,
    neonFromTier: 4,
    neonPrimary: 0x7bf0c8,
    neonSecondary: 0xa78bfa,
    neonPulseHz: 2.8,
    bloomAccent: 0x7bd389,
  },
};

export const getEraLightingKit = (eraId?: string): EraLightingKit => {
  const id = visualEraId(eraId ?? 'analog60s');
  const kit = ERA_LIGHTING[id] ?? ERA_LIGHTING.analog60s;
  return { eraId: ERA_LIGHTING[id] ? id : 'analog60s', ...kit };
};

/* -------------------------------------------------------- daylight cycle */

/**
 * Studio clock ↔ lighting contract (shared by wall clock, window sky, shaft, night tint).
 *
 * Wall hands and lighting share one minute stream:
 *   minutes = floor(currentDay * CLOCK_DAY_OFFSET + tSeconds * CLOCK_MINUTES_PER_REAL_SECOND)
 * Wall face is 12h (`% 720`); lighting uses a full 24h day (`% 1440`) so morning vs evening
 * disagree on exterior light even when the analog face shows the same numbers.
 *
 * Phase map (24h clock minutes):
 *   morning  05:00–10:00  (300–600)   warm sky, rising shaft
 *   day      10:00–17:00  (600–1020)  clear sky, full shaft
 *   evening  17:00–21:00  (1020–1260) amber/violet sky, falling shaft
 *   night    21:00–05:00  (1260–1440 ∪ 0–300) deep sky, dim shaft, stronger room tint
 *
 * Dayness is a smooth cosine peaked at noon (not a hard step), so transitions feel intentional.
 * Reduced-motion callers should freeze dayness / sky (see `REDUCED_MOTION_DAYNESS`) while the
 * clock may still tick.
 */

/** In-game minutes advanced per real second — matches WebGLCanvas wall-clock ticker. */
export const CLOCK_MINUTES_PER_REAL_SECOND = 4;
/** Per-`currentDay` offset so consecutive mornings never start on the same face reading. */
export const CLOCK_DAY_OFFSET = 137;
/** Full lighting day in clock-minutes. */
export const STUDIO_DAY_MINUTES = 1440;
/** Analog face wrap (12-hour). */
export const WALL_CLOCK_MINUTES = 720;

export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

/** Stable midday look when `prefers-reduced-motion` / settings reduceMotion is on. */
export const REDUCED_MOTION_DAYNESS = 0.88;
export const REDUCED_MOTION_PHASE: DayPhase = 'day';

/** Absolute clock minutes since an arbitrary epoch (not wrapped). */
export const getStudioClockMinutesRaw = (day: number, tSeconds: number): number =>
  Math.floor(Math.max(0, day) * CLOCK_DAY_OFFSET + Math.max(0, tSeconds) * CLOCK_MINUTES_PER_REAL_SECOND);

/** Minutes within the 24h lighting day (0..1439). */
export const getStudioClockMinutes = (day: number, tSeconds: number): number =>
  ((getStudioClockMinutesRaw(day, tSeconds) % STUDIO_DAY_MINUTES) + STUDIO_DAY_MINUTES) % STUDIO_DAY_MINUTES;

/** Hour (0..11) + minute (0..59) for the wall face. */
export const getWallClockTime = (
  day: number,
  tSeconds: number,
): { hour: number; minute: number; minutesOfDay: number } => {
  return getWallClockTimeFromMinutes(getStudioClockMinutes(day, tSeconds));
};

/** Convert a shared 24-hour clock value into hands for the analog wall face. */
export const getWallClockTimeFromMinutes = (
  inputMinutes: number,
): { hour: number; minute: number; minutesOfDay: number } => {
  const minutesOfDay = ((Math.floor(inputMinutes) % STUDIO_DAY_MINUTES) + STUDIO_DAY_MINUTES) % STUDIO_DAY_MINUTES;
  const face = minutesOfDay % WALL_CLOCK_MINUTES;
  return { hour: Math.floor(face / 60) % 12, minute: face % 60, minutesOfDay };
};

export const getDayPhase = (minutesOfDay: number): DayPhase => {
  const m = ((Math.floor(minutesOfDay) % STUDIO_DAY_MINUTES) + STUDIO_DAY_MINUTES) % STUDIO_DAY_MINUTES;
  if (m >= 300 && m < 600) return 'morning';
  if (m >= 600 && m < 1020) return 'day';
  if (m >= 1020 && m < 1260) return 'evening';
  return 'night';
};

/**
 * 0 = deepest night, 1 = full daylight.
 * Cosine peaked at noon (minute 720) so control-room + live-room ambience ease through the day.
 */
export const getDaynessFromClockMinutes = (minutesOfDay: number): number => {
  const m = ((minutesOfDay % STUDIO_DAY_MINUTES) + STUDIO_DAY_MINUTES) % STUDIO_DAY_MINUTES;
  const noonCentered = (m - 720) * ((Math.PI * 2) / STUDIO_DAY_MINUTES);
  return 0.5 + 0.5 * Math.cos(noonCentered);
};

/** Screen-space night tint strength from dayness (era tint colour stays on the grade). */
export const getNightTintAlpha = (dayness: number): number => {
  const d = Math.max(0, Math.min(1, dayness));
  return 0.03 + (1 - d) * 0.22;
};

/** Practical / pool boost at night so lamps read when the window goes dark. */
export const getInteriorLightBoost = (dayness: number): number => {
  const d = Math.max(0, Math.min(1, dayness));
  return 1 + (1 - d) * 0.38;
};

const lerpByte = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
export const lerpHex = (a: number, b: number, t: number): number => {
  const u = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (lerpByte(ar, br, u) << 16) | (lerpByte(ag, bg, u) << 8) | lerpByte(ab, bb, u);
};

/** Exterior sky seen through the right-wall window glass. */
const SKY_KEYS: Array<{ at: number; color: number }> = [
  { at: 0, color: 0x0c1428 }, // midnight
  { at: 300, color: 0x3a4a78 }, // pre-dawn
  { at: 360, color: 0xffb07a }, // sunrise
  { at: 480, color: 0x9ec8f0 }, // morning
  { at: 720, color: 0x8fbfe6 }, // noon (legacy static pane)
  { at: 1020, color: 0xf0a060 }, // golden hour
  { at: 1140, color: 0xc06a9a }, // dusk violet
  { at: 1260, color: 0x1a2748 }, // early night
  { at: 1440, color: 0x0c1428 }, // wrap
];

export const getWindowSkyColor = (minutesOfDay: number): number => {
  const m = ((minutesOfDay % STUDIO_DAY_MINUTES) + STUDIO_DAY_MINUTES) % STUDIO_DAY_MINUTES;
  for (let i = 0; i < SKY_KEYS.length - 1; i++) {
    const a = SKY_KEYS[i];
    const b = SKY_KEYS[i + 1];
    if (m >= a.at && m <= b.at) {
      const span = b.at - a.at || 1;
      return lerpHex(a.color, b.color, (m - a.at) / span);
    }
  }
  return SKY_KEYS[0].color;
};

/**
 * @deprecated Prefer `getDaynessFromClockMinutes` + `getStudioClockMinutes`.
 * Legacy 90s sine removed — now samples the clock stream at day 0 so old call sites stay coherent.
 */
export const DAY_CYCLE_SECONDS = 90;
export const getDayness = (tSeconds: number): number =>
  getDaynessFromClockMinutes(getStudioClockMinutes(0, tSeconds));

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
