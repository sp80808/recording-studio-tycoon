/**
 * Creative brief + session recipes (issue #48).
 *
 * A brief is a tiny serialisable description of what a client wants, derived
 * deterministically from the project so old saves and seeded replays agree.
 * `evaluateBriefFit` turns the brief plus the studio's real room / staff /
 * gear / client history into a grade and explainable reasons. It never reads
 * market popularity, so a cold genre cannot change technical fit.
 */
import type { Equipment, EquipmentCategory, GameState, Project, StaffMember, StudioRoom, StudioRoomType } from '@/types/game';
import { createSeededRandom } from '@/simulation/seededRandom';

export type BriefServiceType = 'tracking' | 'vocal-production' | 'mix' | 'master' | 'full-production';
export type BriefDirection = 'raw' | 'polished' | 'intimate' | 'live' | 'heavy' | 'experimental';
export type BriefPriority = 'quality' | 'speed' | 'budget';
export type BriefFitGrade = 'excellent' | 'strong' | 'workable' | 'experimental' | 'poor';

export interface ProjectBrief {
  serviceType: BriefServiceType;
  direction: BriefDirection;
  priority: BriefPriority;
  genre: string;
}

export interface BriefFit {
  grade: BriefFitGrade;
  score: number;
  /** Every applied reason, strongest first. Use `topReasons` for UI. */
  reasons: string[];
  /** Signed score effect of each applied reason, strongest first (feeds the outcome forecast, #55). */
  effects?: { reason: string; delta: number }[];
  /** Named combos that fired on a strong/excellent result. */
  discoveries: { id: string; name: string }[];
}

export interface ProductionApproach {
  id: 'clean-commercial' | 'intimate-raw' | 'experimental-layers' | 'house-recipe';
  label: string;
  blurb: string;
  direction: BriefDirection;
  focus: { performance: number; soundCapture: number; layering: number };
}

export const SERVICE_LABELS: Record<BriefServiceType, string> = {
  tracking: 'Tracking',
  'vocal-production': 'Vocal production',
  mix: 'Mix',
  master: 'Master',
  'full-production': 'Full production',
};

export const DIRECTION_LABELS: Record<BriefDirection, string> = {
  raw: 'Raw',
  polished: 'Polished',
  intimate: 'Intimate',
  live: 'Live',
  heavy: 'Heavy',
  experimental: 'Experimental',
};

export const PRIORITY_LABELS: Record<BriefPriority, string> = {
  quality: 'Quality first',
  speed: 'Fast turnaround',
  budget: 'Lean budget',
};

export const GRADE_LABELS: Record<BriefFitGrade, string> = {
  excellent: 'Excellent fit',
  strong: 'Strong fit',
  workable: 'Workable',
  experimental: 'Experimental',
  poor: 'Poor fit',
};

export const PRODUCTION_APPROACHES: ProductionApproach[] = [
  {
    id: 'clean-commercial',
    label: 'Clean & commercial',
    blurb: 'Tight, radio-ready. Leans on capture and polish.',
    direction: 'polished',
    focus: { performance: 25, soundCapture: 45, layering: 30 },
  },
  {
    id: 'intimate-raw',
    label: 'Intimate & raw',
    blurb: 'Close, honest takes. Leans on the performance.',
    direction: 'intimate',
    focus: { performance: 50, soundCapture: 30, layering: 20 },
  },
  {
    id: 'experimental-layers',
    label: 'Experimental layers',
    blurb: 'Stacked textures. Rewards creative crews, punishes safe ones.',
    direction: 'experimental',
    focus: { performance: 20, soundCapture: 25, layering: 55 },
  },
];

const SERVICE_ROOM: Record<BriefServiceType, StudioRoomType> = {
  tracking: 'live-room',
  'vocal-production': 'vocal-suite',
  mix: 'mix-suite',
  master: 'mix-suite',
  'full-production': 'project-studio',
};

const SERVICE_ROLE: Record<BriefServiceType, StaffMember['role']> = {
  tracking: 'Engineer',
  'vocal-production': 'Producer',
  mix: 'Engineer',
  master: 'Engineer',
  'full-production': 'Producer',
};

const ROOM_NAMES: Record<StudioRoomType, string> = {
  'project-studio': 'Project Studio',
  'vocal-suite': 'Vocal Suite',
  'live-room': 'Live Room',
  'mix-suite': 'Mix Suite',
};

const GENRE_DIRECTIONS: Record<string, BriefDirection[]> = {
  Rock: ['raw', 'live', 'heavy'],
  Pop: ['polished', 'intimate', 'experimental'],
  Electronic: ['polished', 'experimental', 'heavy'],
  'Hip-hop': ['heavy', 'polished', 'raw'],
  Acoustic: ['intimate', 'raw', 'live'],
  Jazz: ['live', 'intimate', 'raw'],
  Folk: ['intimate', 'raw', 'live'],
  Soul: ['intimate', 'polished', 'live'],
};
const DEFAULT_DIRECTIONS: BriefDirection[] = ['raw', 'polished', 'intimate'];
const SERVICES: BriefServiceType[] = ['tracking', 'vocal-production', 'mix', 'master', 'full-production'];
const PRIORITIES: BriefPriority[] = ['quality', 'speed', 'budget'];

const pick = <T,>(items: readonly T[], rng: () => number): T => items[Math.floor(rng() * items.length) % items.length];

/** Deterministic brief for a project: same id + genre always gives the same brief. */
export function deriveBrief(project: Pick<Project, 'id' | 'genre'>): ProjectBrief {
  const rng = createSeededRandom(`brief:${project.id}:${project.genre}`);
  return {
    serviceType: pick(SERVICES, rng),
    direction: pick(GENRE_DIRECTIONS[project.genre] ?? DEFAULT_DIRECTIONS, rng),
    priority: pick(PRIORITIES, rng),
    genre: project.genre,
  };
}

/** Old saves have no brief; derive one on read so nothing needs migrating. */
export const getProjectBrief = (project: Project): ProjectBrief => project.brief ?? deriveBrief(project);

/** Authored house recipe (#71, level 3): the direction this studio has learned works for a genre. */
const RECIPE_DIRECTION: Record<string, BriefDirection> = {
  Rock: 'live', Country: 'live', Jazz: 'live',
  Folk: 'intimate', Soul: 'intimate', Emo: 'intimate', Indie: 'intimate', Acoustic: 'intimate',
  Blues: 'raw', Punk: 'raw', 'Pop-punk': 'raw', 'Lo-fi': 'raw',
  'Hip-Hop': 'heavy', 'Hair Metal': 'heavy', EDM: 'heavy', Trap: 'heavy',
  Electronic: 'experimental',
};
const RECIPE_FOCUS: Record<BriefDirection, ProductionApproach['focus']> = {
  raw: { performance: 50, soundCapture: 30, layering: 20 },
  live: { performance: 50, soundCapture: 30, layering: 20 },
  intimate: { performance: 45, soundCapture: 35, layering: 20 },
  polished: { performance: 25, soundCapture: 45, layering: 30 },
  heavy: { performance: 30, soundCapture: 40, layering: 30 },
  experimental: { performance: 20, soundCapture: 25, layering: 55 },
};

export const houseRecipe = (genre: string): ProductionApproach => {
  const direction = RECIPE_DIRECTION[genre] ?? 'polished';
  return {
    id: 'house-recipe',
    label: `House recipe: ${genre}`,
    blurb: `The way this studio has learned to cut ${genre}. Plays to what it already does well.`,
    direction,
    focus: RECIPE_FOCUS[direction],
  };
};

export const getApproach = (id: string | undefined, genre?: string): ProductionApproach | undefined =>
  id === 'house-recipe' ? houseRecipe(genre ?? '') : PRODUCTION_APPROACHES.find((a) => a.id === id);

/** The approaches on offer for this genre: the three standards, plus the house recipe once the studio is Experienced in it. */
export const approachesFor = (expertise: { genres: Record<string, { level: number } | undefined> } | undefined, genre: string): ProductionApproach[] =>
  (expertise?.genres[genre]?.level ?? 0) >= 3 ? [...PRODUCTION_APPROACHES, houseRecipe(genre)] : PRODUCTION_APPROACHES;

type FitState = Pick<GameState, 'studioRooms' | 'hiredStaff' | 'ownedEquipment' | 'clientRelationships'>;

interface FitContext {
  brief: ProjectBrief;
  direction: BriefDirection;
  roomType: StudioRoomType;
  roomName: string;
  staff: StaffMember[];
  gearCategories: Set<EquipmentCategory>;
  clientId?: string;
  clientSessions: number;
  approachId?: ProductionApproach['id'];
  genre: string;
}

interface FitRule {
  id: string;
  /** Returns the score delta and a human reason, or null if it does not apply. */
  apply: (c: FitContext) => { delta: number; reason: string } | null;
  discovery?: string;
}

const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const has = (c: FitContext, ...cats: EquipmentCategory[]) => cats.some((k) => c.gearCategories.has(k));

const FIT_RULES: FitRule[] = [
  {
    id: 'room-match',
    apply: (c) => {
      const want = SERVICE_ROOM[c.brief.serviceType];
      if (c.roomType === want && want !== 'project-studio') return { delta: 14, reason: `${ROOM_NAMES[want]} matches the brief` };
      if (c.roomType === 'project-studio') return { delta: 4, reason: 'Project Studio handles most briefs' };
      return { delta: -10, reason: `This brief wants a ${ROOM_NAMES[want]}, not the ${c.roomName}` };
    },
  },
  {
    id: 'intimate-vocal-chain',
    discovery: 'Intimate Vocal Chain',
    apply: (c) =>
      c.direction === 'intimate' && ['vocal-production', 'tracking'].includes(c.brief.serviceType) && c.roomType === 'vocal-suite' && has(c, 'microphone')
        ? { delta: 12, reason: 'Close mic in the Vocal Suite suits an intimate take' }
        : null,
  },
  {
    id: 'live-room-energy',
    discovery: 'Live Room Energy',
    apply: (c) =>
      ['live', 'raw', 'heavy'].includes(c.direction) && c.roomType === 'live-room'
        ? { delta: 12, reason: 'The Live Room gives this direction real energy' }
        : null,
  },
  {
    id: 'electronic-stack',
    discovery: 'Electronic Production Stack',
    apply: (c) =>
      c.brief.genre === 'Electronic' && ['polished', 'experimental'].includes(c.direction) && has(c, 'software', 'interface')
        ? { delta: 10, reason: 'Interface and software rig fit electronic production' }
        : null,
  },
  {
    id: 'trusted-mix-pair',
    discovery: 'Trusted Mix Pair',
    apply: (c) => {
      if (!['mix', 'master'].includes(c.brief.serviceType) || !c.clientId) return null;
      const s = c.staff.find((m) => (m.clientFamiliarity?.[c.clientId!] ?? 0) >= 2);
      return s ? { delta: 12, reason: `${s.name} already knows this client's sound` } : null;
    },
  },
  {
    id: 'genre-specialist',
    apply: (c) => {
      const s = c.staff
        .filter((m) => m.genreAffinity?.genre === c.brief.genre)
        .sort((a, b) => (b.genreAffinity?.bonus ?? 0) - (a.genreAffinity?.bonus ?? 0))[0];
      return s?.genreAffinity ? { delta: Math.min(12, Math.round(s.genreAffinity.bonus / 3)), reason: `${s.name} specializes in ${c.brief.genre}` } : null;
    },
  },
  {
    id: 'role-fit',
    apply: (c) => {
      const role = SERVICE_ROLE[c.brief.serviceType];
      const s = c.staff.find((m) => m.role === role);
      return s ? { delta: 8, reason: `${s.name} is a ${role.toLowerCase()} for ${SERVICE_LABELS[c.brief.serviceType].toLowerCase()}` } : null;
    },
  },
  {
    id: 'polished-monitoring',
    apply: (c) =>
      c.direction === 'polished' && (c.roomType === 'mix-suite' || has(c, 'monitor'))
        ? { delta: 8, reason: 'Good monitoring keeps a polished sound honest' }
        : null,
  },
  {
    id: 'heavy-punch',
    apply: (c) =>
      c.direction === 'heavy' && has(c, 'outboard', 'mixer') ? { delta: 8, reason: 'Outboard and console give it the punch it needs' } : null,
  },
  {
    id: 'quick-turnaround',
    apply: (c) =>
      c.brief.priority === 'speed' && c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.speed)) >= 30
        ? { delta: 8, reason: 'A quick crew suits the fast turnaround' }
        : null,
  },
  {
    id: 'lean-budget',
    apply: (c) => (c.brief.priority === 'budget' && c.staff.length <= 1 ? { delta: 6, reason: 'A lean crew keeps the budget tight' } : null),
  },
  {
    id: 'quality-hands',
    apply: (c) =>
      c.brief.priority === 'quality' && c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.technical)) >= 30
        ? { delta: 8, reason: 'Technical hands suit a quality-first brief' }
        : null,
  },
  {
    id: 'experimental-leap',
    apply: (c) => {
      if (c.direction !== 'experimental') return null;
      return c.staff.length > 0 && avg(c.staff.map((m) => m.primaryStats.creativity)) >= 35
        ? { delta: 10, reason: 'A creative crew can carry an experimental leap' }
        : { delta: -6, reason: 'An experimental brief needs a more creative crew' };
    },
  },
  {
    id: 'house-recipe',
    apply: (c) => (c.approachId === 'house-recipe' ? { delta: 6, reason: `Your house recipe: the studio knows how to cut ${c.genre}` } : null),
  },
  {
    id: 'repeat-client',
    apply: (c) => (c.clientSessions > 0 ? { delta: Math.min(10, c.clientSessions * 3), reason: 'Repeat client: you already speak the same language' } : null),
  },
];

export const BRIEF_RULE_COUNT = FIT_RULES.length;

const BASE_SCORE = 40;

const gradeFor = (score: number, direction: BriefDirection): BriefFitGrade => {
  if (score >= 75) return 'excellent';
  if (score >= 62) return 'strong';
  if (direction === 'experimental' && score >= 35) return 'experimental';
  if (score >= 48) return 'workable';
  return 'poor';
};

const usableGear = (items: Equipment[]) => new Set<EquipmentCategory>(items.filter((e) => e.condition >= 30).map((e) => e.category));

/** Pure and deterministic. Never reads market or genre popularity. */
export function evaluateBriefFit(
  brief: ProjectBrief,
  ctx: { room: Pick<StudioRoom, 'type' | 'name'>; staff: StaffMember[]; equipment: Equipment[]; clientId?: string; clientSessions?: number; approachId?: string },
): BriefFit {
  const approach = getApproach(ctx.approachId, brief.genre);
  const c: FitContext = {
    brief,
    direction: approach?.direction ?? brief.direction,
    roomType: ctx.room.type,
    roomName: ctx.room.name,
    staff: ctx.staff,
    gearCategories: usableGear(ctx.equipment),
    clientId: ctx.clientId,
    clientSessions: ctx.clientSessions ?? 0,
    approachId: approach?.id,
    genre: brief.genre,
  };
  let score = BASE_SCORE;
  const applied: { delta: number; reason: string; rule: FitRule }[] = [];
  for (const rule of FIT_RULES) {
    const hit = rule.apply(c);
    if (!hit) continue;
    score += hit.delta;
    applied.push({ ...hit, rule });
  }
  score = Math.max(0, Math.min(100, score));
  applied.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.rule.id.localeCompare(b.rule.id));
  const grade = gradeFor(score, c.direction);
  const strong = grade === 'excellent' || grade === 'strong';
  return {
    grade,
    score,
    reasons: applied.map((a) => a.reason),
    effects: applied.map((a) => ({ reason: a.reason, delta: a.delta })),
    discoveries: strong ? applied.filter((a) => a.rule.discovery && a.delta > 0).map((a) => ({ id: a.rule.id, name: a.rule.discovery! })) : [],
  };
}

/** At most two reasons for a compact card: strongest positives, or the main problem when the fit is poor. */
export function topReasons(fit: BriefFit, limit = 2): string[] {
  return fit.reasons.slice(0, limit);
}

export const pickBookingRoom = (rooms: StudioRoom[], type: StudioRoomType, preferred?: string): StudioRoom => {
  const unlocked = rooms.filter((r) => r.unlocked);
  return (
    unlocked.find((r) => r.id === preferred) ??
    unlocked.find((r) => r.type === type) ??
    unlocked.find((r) => r.type === 'project-studio') ??
    unlocked[0] ??
    { type: 'project-studio', name: ROOM_NAMES['project-studio'] } as StudioRoom
  );
};

/**
 * Fit for a project in the current studio. Before booking, every hired staff
 * member counts (the player can assign any of them) and the best-matching
 * unlocked room is assumed; once booked, the real room and assigned crew are used.
 */
export function evaluateProjectBriefFit(project: Project, state: FitState, approachId?: string): BriefFit {
  const brief = getProjectBrief(project);
  const booked = Boolean(project.bookingRoomId);
  const staff = booked ? state.hiredStaff.filter((s) => s.assignedProjectId === project.id) : state.hiredStaff;
  const room = pickBookingRoom(state.studioRooms ?? [], SERVICE_ROOM[brief.serviceType], project.bookingRoomId);
  return evaluateBriefFit(brief, {
    room,
    staff,
    equipment: state.ownedEquipment ?? [],
    clientId: project.clientId,
    clientSessions: project.clientId ? state.clientRelationships?.[project.clientId]?.sessionsCompleted ?? 0 : 0,
    approachId: approachId ?? project.approachId,
  });
}

/**
 * Bounded output modifier (+8% .. -4%) applied to creative/technical gains.
 * Deliberately small so it never replaces player skill, staff skill or timing.
 */
export const BRIEF_FIT_MULTIPLIER: Record<BriefFitGrade, number> = {
  excellent: 1.08,
  strong: 1.04,
  workable: 1,
  experimental: 1,
  poor: 0.96,
};

/** Merge newly earned discovery ids into the persisted list (stable, no duplicates). */
export function recordBriefDiscoveries(current: string[] | undefined, fit: BriefFit): { list: string[]; added: { id: string; name: string }[] } {
  const known = new Set(current ?? []);
  const added = fit.discoveries.filter((d) => !known.has(d.id));
  return { list: [...(current ?? []), ...added.map((d) => d.id)], added };
}
