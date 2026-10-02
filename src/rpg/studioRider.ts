/**
 * Studio riders — mid/late-game band hospitality + gear asks.
 *
 * Early enquiries stay clean: riders only attach once reputation/level and
 * difficulty clear soft gates. Resolution is a small bounded work/quality
 * modifier (never a hard block) so missing a tube amp is a warning, not a wall.
 */
import type { Equipment, EquipmentCategory, Project } from '@/types/game';
import { createSeededRandom } from '@/simulation/seededRandom';

export type RiderItemKind = 'beer' | 'snacks' | 'gear' | 'hospitality';

export interface RiderItem {
  id: string;
  kind: RiderItemKind;
  /** Short diegetic label for booking / prep UI. */
  label: string;
  /** Soft-required gear: missing → warning + work/quality penalty. */
  required?: boolean;
  /** For `kind: 'gear'` — studio must own usable gear in this category. */
  gearCategory?: EquipmentCategory;
}

export interface StudioRider {
  id: string;
  /** Display title on the booking card. */
  title: string;
  /** One-line flavour — not a checklist dump. */
  blurb: string;
  items: RiderItem[];
  /** Genres this rider may attach to (empty = any). */
  genres?: string[];
  /** Era ids this rider may attach to (empty = any). */
  eras?: string[];
}

export interface RiderGateContext {
  reputation: number;
  playerLevel: number;
  eraId: string;
  difficulty: number;
  genre: string;
}

export interface RiderEvaluation {
  /** Every required item is satisfied. */
  met: boolean;
  missingRequired: RiderItem[];
  metItems: RiderItem[];
  warnings: string[];
  /** Bounded work-output multiplier (0.96 … 1.04). */
  workMultiplier: number;
  /** Flat quality delta at settlement (−3 … +4). */
  qualityDelta: number;
  /** Short notes for gear ledger / session prep. */
  notes: string[];
}

/** Soft gate: early game stays rider-free. */
export const RIDER_MIN_REPUTATION = 25;
export const RIDER_MIN_LEVEL = 5;
export const RIDER_MIN_DIFFICULTY = 5;

export const RIDER_WORK_MULT = { met: 1.04, miss: 0.96, none: 1 } as const;
export const RIDER_QUALITY_DELTA = { met: 4, miss: -3, none: 0 } as const;

/** Authored riders — eras/genres keep mid-game boards feeling alive. */
export const STUDIO_RIDERS: StudioRider[] = [
  {
    id: 'rider-rock-beers-outboard',
    title: 'Green Room Rider',
    blurb: 'A cold six-pack and something that actually saturates.',
    genres: ['Rock'],
    eras: ['analog60s', 'digital80s'],
    items: [
      { id: 'beers', kind: 'beer', label: 'Cold beers on the candle table' },
      { id: 'outboard', kind: 'gear', label: 'Working outboard / console colour', required: true, gearCategory: 'outboard' },
      { id: 'snacks', kind: 'snacks', label: 'Salted crisps (no onion)' },
    ],
  },
  {
    id: 'rider-jazz-hospitality',
    title: 'Quiet Room Rider',
    blurb: 'Soft lights, soft voices, a mic that flatters.',
    genres: ['Jazz', 'Soul', 'Acoustic', 'Folk'],
    eras: ['analog60s', 'digital80s', 'internet2000s'],
    items: [
      { id: 'tea', kind: 'hospitality', label: 'Hot tea / quiet hospitality' },
      { id: 'mic', kind: 'gear', label: 'Decent microphone', required: true, gearCategory: 'microphone' },
      { id: 'snacks', kind: 'snacks', label: 'Light snacks — nothing crunchy mid-take' },
    ],
  },
  {
    id: 'rider-hiphop-snacks-rig',
    title: 'Late Night Rider',
    blurb: 'Snacks that survive a four-hour pocket hunt.',
    genres: ['Hip-hop', 'Pop'],
    eras: ['internet2000s', 'streaming2020s', 'digital80s'],
    items: [
      { id: 'snacks', kind: 'snacks', label: 'Late-night snacks & water' },
      { id: 'interface', kind: 'gear', label: 'Clean audio interface', required: true, gearCategory: 'interface' },
      { id: 'beers', kind: 'beer', label: 'A couple of beers for the hook writers' },
    ],
  },
  {
    id: 'rider-pop-full-hospitality',
    title: 'Chart Act Rider',
    blurb: 'Hospitality first — then monitors that tell the truth.',
    genres: ['Pop', 'Soul'],
    eras: ['digital80s', 'internet2000s', 'streaming2020s'],
    items: [
      { id: 'beers', kind: 'beer', label: 'Beers (and a backup six)' },
      { id: 'snacks', kind: 'snacks', label: 'Styled snacks / fruit bowl' },
      { id: 'monitors', kind: 'gear', label: 'Honest studio monitors', required: true, gearCategory: 'monitor' },
      { id: 'hospitality', kind: 'hospitality', label: 'Clean lounge + fresh towels' },
    ],
  },
  {
    id: 'rider-electronic-rig',
    title: 'Laptop Band Rider',
    blurb: 'Power, software, and something cold that is not coffee.',
    genres: ['Electronic'],
    eras: ['internet2000s', 'streaming2020s'],
    items: [
      { id: 'beers', kind: 'beer', label: 'Cold drinks on the candle table' },
      { id: 'software', kind: 'gear', label: 'DAW / software stack ready', required: true, gearCategory: 'software' },
      { id: 'interface', kind: 'gear', label: 'Low-latency interface', required: true, gearCategory: 'interface' },
    ],
  },
];

export const RIDER_TEMPLATE_COUNT = STUDIO_RIDERS.length;

export function canHaveRider(ctx: Pick<RiderGateContext, 'reputation' | 'playerLevel' | 'difficulty'>): boolean {
  const midCareer = ctx.reputation >= RIDER_MIN_REPUTATION || ctx.playerLevel >= RIDER_MIN_LEVEL;
  return midCareer && ctx.difficulty >= RIDER_MIN_DIFFICULTY;
}

const riderMatches = (rider: StudioRider, genre: string, eraId: string): boolean => {
  const genreOk = !rider.genres?.length || rider.genres.includes(genre);
  const eraOk = !rider.eras?.length || rider.eras.includes(eraId);
  return genreOk && eraOk;
};

const pick = <T,>(items: readonly T[], rng: () => number): T =>
  items[Math.floor(rng() * items.length) % items.length];

/**
 * Deterministic rider for a project once gates clear.
 * Same id + genre + era + gate inputs → same rider (or none).
 */
export function deriveRider(
  project: Pick<Project, 'id' | 'genre' | 'difficulty'>,
  ctx: Pick<RiderGateContext, 'reputation' | 'playerLevel' | 'eraId'>,
): StudioRider | undefined {
  if (!canHaveRider({ reputation: ctx.reputation, playerLevel: ctx.playerLevel, difficulty: project.difficulty })) {
    return undefined;
  }
  const pool = STUDIO_RIDERS.filter((r) => riderMatches(r, project.genre, ctx.eraId));
  const candidates = pool.length > 0 ? pool : STUDIO_RIDERS;
  const rng = createSeededRandom(`rider:${project.id}:${project.genre}:${ctx.eraId}`);
  // ~70% of gated bookings actually bring a rider (keeps boards varied).
  if (rng() > 0.7) return undefined;
  return pick(candidates, rng);
}

/** Old saves / story contracts without a rider stay rider-free. */
export const getProjectRider = (project: Project): StudioRider | undefined => project.rider;

export const riderHasBeers = (rider: StudioRider | undefined): boolean =>
  Boolean(rider?.items.some((i) => i.kind === 'beer'));

const usableCategories = (equipment: Equipment[]): Set<EquipmentCategory> =>
  new Set(equipment.filter((e) => (e.condition ?? 100) >= 30).map((e) => e.category));

/**
 * Pure rider check against owned gear. Hospitality / snacks / beers are
 * studio-provided once the session is live (props + chores cover the rest).
 */
export function evaluateRider(
  rider: StudioRider | undefined,
  equipment: Equipment[],
  opts?: { sessionLive?: boolean; brewReady?: boolean },
): RiderEvaluation {
  if (!rider) {
    return {
      met: true,
      missingRequired: [],
      metItems: [],
      warnings: [],
      workMultiplier: RIDER_WORK_MULT.none,
      qualityDelta: RIDER_QUALITY_DELTA.none,
      notes: [],
    };
  }

  const cats = usableCategories(equipment);
  const sessionLive = opts?.sessionLive ?? true;
  const brewReady = opts?.brewReady ?? false;
  const missingRequired: RiderItem[] = [];
  const metItems: RiderItem[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  for (const item of rider.items) {
    let ok = true;
    if (item.kind === 'gear' && item.gearCategory) {
      ok = cats.has(item.gearCategory);
      if (!ok && item.required) {
        missingRequired.push(item);
        warnings.push(`Rider wants ${item.label.toLowerCase()} — none ready.`);
      }
    } else if (item.kind === 'hospitality') {
      // Soft: brew covers hospitality vibe when the ask mentions tea/coffee/quiet.
      ok = brewReady || sessionLive;
    } else if (item.kind === 'beer' || item.kind === 'snacks') {
      ok = sessionLive;
    }
    if (ok) {
      metItems.push(item);
      notes.push(`Rider ok: ${item.label}`);
    }
  }

  const met = missingRequired.length === 0;
  if (met && metItems.length > 0) {
    notes.unshift(`Rider met — ${rider.title}`);
  } else if (!met) {
    notes.unshift(`Rider short — ${rider.title}`);
  }

  return {
    met,
    missingRequired,
    metItems,
    warnings,
    workMultiplier: met ? RIDER_WORK_MULT.met : RIDER_WORK_MULT.miss,
    qualityDelta: met ? RIDER_QUALITY_DELTA.met : RIDER_QUALITY_DELTA.miss,
    notes: notes.slice(0, 4),
  };
}

/** Convenience for stage work / review against a live project. */
export function evaluateProjectRider(
  project: Project,
  equipment: Equipment[],
  opts?: { brewReady?: boolean; sessionLive?: boolean },
): RiderEvaluation {
  return evaluateRider(getProjectRider(project), equipment, {
    sessionLive: opts?.sessionLive ?? Boolean(project.bookingRoomId),
    brewReady: opts?.brewReady,
  });
}

/** Candle-table presentation: coffee stays brew-gated; beers are rider-driven. */
export function candleTableDrinks(opts: {
  brewReady: boolean;
  riderBeers: boolean;
  sessionLive: boolean;
}): { coffee: boolean; beer: boolean } {
  return {
    coffee: opts.brewReady,
    beer: opts.sessionLive && opts.riderBeers,
  };
}
