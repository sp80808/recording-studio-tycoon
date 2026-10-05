/**
 * Deterministic staff recruitment: portraits, era-aware names, traits, and CVs.
 */
import { pickWorkStyle } from '@/rpg/workStyle';
import { localName } from '@/rpg/cities';
import type { StaffCurriculumVitae, StaffMember } from '@/types/game';
import { createSeededRandom, pickWithRandom, randomInt } from '@/simulation/seededRandom';
import { initializeSkillsStaff } from '@/utils/skillUtils';
import {
  ERA_CREDITS,
  ERA_EDUCATION,
  ERA_NAME_POOLS,
  ERA_STUDIOS,
  ERA_TRAITS,
  LOOKING_FOR,
  ROLE_HEADLINES,
  type StaffJobRole,
} from '@/data/staffRecruitmentContent';
import {
  eraIdToNpcEra,
  pieceIdsFromAppearance,
  resolveStaffPortrait,
  staffPortraitSeed,
  staffRoleToStudioRole,
} from '@/features/sprites/staffPortrait';
import type { NpcEra } from '@/features/sprites/spriteTypes';
import type { NpcVisualIdentity } from '@/features/sprites/npcAppearance';
import { identityOf } from '@/features/sprites/npcAppearance';

export interface CandidateGenerationContext {
  count: number;
  saveSeed?: number | string;
  day?: number;
  era?: string;
  year?: number;
  /** Home city: part of the names come from its local pool. Absent = era pools only. */
  cityId?: string;
  /** Distinguishes start / day-roll / paid refresh batches. */
  batchKey?: string;
}

const ALL_GENRES = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic', 'Jazz', 'Folk', 'Soul'] as const;
const ROLES: readonly StaffJobRole[] = ['Engineer', 'Producer', 'Songwriter'];

const pickUnique = <T,>(rng: () => number, pool: readonly T[], count: number): T[] => {
  const available = [...pool];
  const picked: T[] = [];
  while (picked.length < count && available.length > 0) {
    const index = Math.floor(rng() * available.length);
    picked.push(available.splice(index, 1)[0]);
  }
  return picked;
};

export const buildStaffCv = (
  rng: () => number,
  options: {
    role: StaffJobRole;
    era: NpcEra;
    name: string;
    levelInRole: number;
    genreAffinity: StaffMember['genreAffinity'];
  },
): StaffCurriculumVitae => {
  const traits = pickUnique(rng, ERA_TRAITS[options.era], 3);
  const previousStudios = pickUnique(rng, ERA_STUDIOS[options.era], randomInt(rng, 1, 2));
  const notableCredits = pickUnique(rng, ERA_CREDITS[options.era], randomInt(rng, 1, 2));
  const headline = pickWithRandom(rng, ROLE_HEADLINES[options.role]);
  const education = pickWithRandom(rng, ERA_EDUCATION[options.era]);
  const lookingFor = pickWithRandom(rng, LOOKING_FOR[options.role]);
  const yearsExperience = Math.max(1, options.levelInRole + randomInt(rng, 0, 8));
  const affinityLine = options.genreAffinity
    ? ` Known for ${options.genreAffinity.genre.toLowerCase()} sessions (+${options.genreAffinity.bonus}% affinity).`
    : '';
  return {
    headline,
    summary: `${options.name} is a ${options.era} ${options.role.toLowerCase()} with ${yearsExperience} years across working rooms.${affinityLine}`,
    traits,
    previousStudios,
    notableCredits,
    yearsExperience,
    education,
    lookingFor,
  };
};

const generateOneCandidate = (
  seed: number,
  era: NpcEra,
  index: number,
  batchKey: string,
  cityId?: string,
): StaffMember => {
  const rng = createSeededRandom(`staff-candidate:${seed}:${batchKey}:${index}`);
  const role = pickWithRandom(rng, ROLES);
  const names = ERA_NAME_POOLS[era];
  const eraName = `${pickWithRandom(rng, names.first)} ${pickWithRandom(rng, names.last)}`;
  // Local flavour: with a city set, about half the people are locals. The extra roll only exists then,
  // so a neutral save keeps its exact seeded names.
  const name = cityId && rng() < 0.5 ? (localName(cityId, rng(), rng()) ?? eraName) : eraName;

  const archetypeChance = rng();
  let primaryStats: StaffMember['primaryStats'];
  let genreAffinity: StaffMember['genreAffinity'] = null;
  let salary = 80;

  if (archetypeChance < 0.3) {
    primaryStats = {
      creativity: 10 + randomInt(rng, 0, 19),
      technical: 10 + randomInt(rng, 0, 19),
      speed: 10 + randomInt(rng, 0, 19),
    };
    const specialistStatBoost = 15 + randomInt(rng, 0, 9);
    const statToBoost = randomInt(rng, 0, 2);
    if (statToBoost === 0) primaryStats.creativity += specialistStatBoost;
    else if (statToBoost === 1) primaryStats.technical += specialistStatBoost;
    else primaryStats.speed += specialistStatBoost;

    if (rng() < 0.7) {
      genreAffinity = {
        genre: pickWithRandom(rng, ALL_GENRES),
        bonus: 20 + randomInt(rng, 0, 19),
      };
    }
  } else {
    primaryStats = {
      creativity: 15 + randomInt(rng, 0, 24),
      technical: 15 + randomInt(rng, 0, 24),
      speed: 15 + randomInt(rng, 0, 24),
    };
    if (rng() < 0.4) {
      genreAffinity = {
        genre: pickWithRandom(rng, ALL_GENRES),
        bonus: 10 + randomInt(rng, 0, 14),
      };
    }
  }

  const bestStat = Math.max(primaryStats.creativity, primaryStats.technical, primaryStats.speed);
  const affinityBonus = genreAffinity?.bonus ?? 0;
  if (bestStat >= 45 || affinityBonus >= 25) {
    salary = 160 + randomInt(rng, 0, 80);
  } else if (bestStat >= 30 || affinityBonus >= 15) {
    salary = 90 + randomInt(rng, 0, 50);
  } else {
    salary = 35 + randomInt(rng, 0, 20);
  }

  const levelInRole = 1 + (bestStat >= 40 ? randomInt(rng, 1, 3) : 0);
  const studioRole = staffRoleToStudioRole(role);
  const portrait = resolveStaffPortrait({ seed, role: studioRole, era, name });
  const appearance: NpcVisualIdentity = identityOf(portrait);
  const pieceIds = pieceIdsFromAppearance(portrait);
  const cv = buildStaffCv(rng, { role, era, name, levelInRole, genreAffinity });

  return {
    id: `candidate_${seed}_${index}`,
    name,
    role,
    primaryStats,
    xpInRole: 0,
    levelInRole,
    genreAffinity,
    clientFamiliarity: {},
    energy: 100,
    mood: 75,
    salary,
    status: 'Idle',
    assignedProjectId: null,
    skills: initializeSkillsStaff(),
    appearance,
    portraitSeed: seed,
    pieceIds,
    cv,
  };
};

/**
 * Generate a deterministic batch of recruitment candidates.
 * Accepts a plain count for backwards compatibility (non-deterministic fallback seed).
 */
export const generateCandidates = (countOrCtx: number | CandidateGenerationContext): StaffMember[] => {
  const ctx: CandidateGenerationContext = typeof countOrCtx === 'number'
    ? { count: countOrCtx }
    : countOrCtx;
  const count = Math.max(0, ctx.count);
  const saveSeed = ctx.saveSeed ?? 'legacy';
  const day = ctx.day ?? 0;
  const batchKey = ctx.batchKey ?? 'default';
  const era = eraIdToNpcEra(ctx.era, ctx.year);
  const candidates: StaffMember[] = [];

  for (let i = 0; i < count; i++) {
    const seed = staffPortraitSeed(saveSeed, day, batchKey, i);
    const candidate = generateOneCandidate(seed, era, i, batchKey, ctx.cityId);
    candidates.push({ ...candidate, workStyle: pickWorkStyle('board', `${seed}:${candidate.id}`) });
  }
  return candidates;
};

/** Resolve portrait for a staff member (hired or candidate), regenerating from seed when needed. */
export const resolveMemberPortrait = (member: Pick<StaffMember, 'name' | 'role' | 'appearance' | 'portraitSeed' | 'pieceIds'>, eraHint?: NpcEra) => {
  if (member.appearance) {
    return resolveStaffPortrait({
      seed: member.appearance.seed,
      role: member.appearance.role,
      era: member.appearance.era,
      appearanceVersion: member.appearance.appearanceVersion,
      name: member.name,
      pieces: member.pieceIds,
    });
  }
  const seed = member.portraitSeed ?? 1;
  return resolveStaffPortrait({
    seed,
    role: staffRoleToStudioRole(member.role),
    era: eraHint ?? 'modern',
    name: member.name,
    pieces: member.pieceIds,
  });
};
