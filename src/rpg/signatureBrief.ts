/**
 * Signature brief (#71, level 5): a studio that has mastered a genre gets one prestige enquiry
 * for it each week. Derived from the save seed, week and expertise; stored nowhere until booked.
 * Better fee and rep than a standard job, but the brief stays honest: no quality bonus.
 */
import type { GameState, Project } from '@/types/game';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import { GIG_TEMPLATES } from '@/data/gigTemplates';
import { createSeededRandom } from '@/simulation/seededRandom';
import { deriveBrief } from '@/rpg/projectBrief';

export const SIGNATURE_LEVEL = 5;
export const SIGNATURE_PAY_FACTOR = 1.3;
export const SIGNATURE_REP_FACTOR = 2;
export const SIGNATURE_WEEK_DAYS = 7;

type SignatureState = Pick<GameState, 'currentDay' | 'currentEra' | 'saveSeed' | 'studioExpertise' | 'claimedOffers'>;

export const isSignatureJob = (project: Pick<Project, 'id'>): boolean => project.id.startsWith('signature-');

/** Genres the studio has reached Signature level in, strongest first. */
export const signatureGenres = (expertise: GameState['studioExpertise']): string[] =>
  Object.entries(expertise?.genres ?? {})
    .filter(([, t]) => t.level >= SIGNATURE_LEVEL)
    .sort((a, b) => b[1].xp - a[1].xp || a[0].localeCompare(b[0]))
    .map(([g]) => g);

export const signatureJobFor = (state: SignatureState): Project | undefined => {
  const genres = signatureGenres(state.studioExpertise);
  if (genres.length === 0) return undefined;
  const week = Math.floor(state.currentDay / SIGNATURE_WEEK_DAYS);
  const rng = createSeededRandom(`signature:${state.saveSeed ?? 'legacy'}:${week}`);
  const genre = genres[Math.floor(rng() * genres.length)];
  const id = `signature-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${week}`;
  if (state.claimedOffers?.includes(id)) return undefined;

  const eraGenres = (ERA_DEFINITIONS.find((e) => e.id === state.currentEra) ?? ERA_DEFINITIONS[0]).availableGenres;
  const matches = GIG_TEMPLATES.filter((t) => t.genre === genre);
  // Prefer an advanced template for the genre; fall back to whatever exists, then to any era gig.
  const pool = matches.filter((t) => t.tier === 'advanced');
  const template = (pool.length ? pool : matches.length ? matches : GIG_TEMPLATES.filter((t) => eraGenres.includes(t.genre)))[0];
  if (!template) return undefined;
  const title = template.titleTemplates[Math.floor(rng() * template.titleTemplates.length)];
  const project: Project = {
    id,
    title: `Signature: ${title}`,
    genre,
    clientType: template.clientType,
    clientId: `signature-${genre.toLowerCase()}`,
    clientName: 'Industry referral',
    difficulty: template.difficulty,
    payoutBase: Math.round(template.basePayout * SIGNATURE_PAY_FACTOR),
    repGainBase: Math.round(template.baseRep * SIGNATURE_REP_FACTOR),
    durationDaysTotal: template.baseDuration,
    requiredSkills: { [genre]: Math.max(1, Math.floor(template.difficulty / 2)) },
    matchRating: 'Good',
    stages: template.baseStages.map((s) => ({ stageName: s.stageName, focusAreas: s.focusAreas, workUnitsBase: s.workUnitsBase, workUnitsCompleted: 0, completed: false })),
    currentStageIndex: 0,
    completedStages: [],
    stake: 'safe',
    accumulatedCPoints: 0,
    accumulatedTPoints: 0,
    workSessionCount: 0,
    focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
  };
  project.brief = deriveBrief(project);
  return project;
};
