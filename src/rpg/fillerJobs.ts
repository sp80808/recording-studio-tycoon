/**
 * Filler jobs (#61): small walk-in sessions that fill gaps on the enquiry board.
 *
 * Derived on render from the save seed and the current day, never stored until the player
 * books one (booking goes through the normal start flow). They are always a single session
 * and always pay less per slot than the premium job they are cut from, so they pad a quiet
 * week without ever beating real work.
 */
import type { GameState, Project } from '@/types/game';
import { ERA_DEFINITIONS } from '@/utils/eraProgression';
import { getEraGigPool, pickWeightedGig } from '@/data/gigTemplates';
import { createSeededRandom } from '@/simulation/seededRandom';
import { deriveBrief } from '@/rpg/projectBrief';
import { buildBookingCalendar } from '@/rpg/bookingCalendar';

export const FILLER_MAX = 2;
export const FILLER_BOARD_TARGET = 3;
/** Fraction of the source job's per-session fee a filler pays. */
export const FILLER_PAY_FACTOR = 0.7;
/** Fillers only appear while the studio has this much of the week still free. */
export const FILLER_MAX_UTILIZATION = 0.5;

type FillerState = Pick<GameState, 'currentDay' | 'currentEra' | 'saveSeed' | 'studioRooms' | 'activeProject' | 'activeProjects' | 'availableProjects' | 'claimedOffers'>;

export const isFillerJob = (project: Pick<Project, 'id'>): boolean => project.id.startsWith('filler-');

export const fillerJobsFor = (state: FillerState): Project[] => {
  const gaps = Math.min(FILLER_MAX, FILLER_BOARD_TARGET - (state.availableProjects?.length ?? 0));
  if (gaps <= 0) return [];
  if (buildBookingCalendar(state).utilization >= FILLER_MAX_UTILIZATION) return [];

  const eraId = state.currentEra ?? 'analog60s';
  const eraGenres = (ERA_DEFINITIONS.find((e) => e.id === eraId) ?? ERA_DEFINITIONS[0]).availableGenres;
  const pool = getEraGigPool(eraId, 'starter', eraGenres);
  const out: Project[] = [];
  for (let n = 0; n < gaps; n++) {
    const rng = createSeededRandom(`filler:${state.saveSeed ?? 'legacy'}:${state.currentDay}:${n}`);
    const template = pickWeightedGig(pool, rng());
    const first = template.baseStages[0];
    const perSession = template.basePayout / template.baseStages.length;
    const title = template.titleTemplates[Math.floor(rng() * template.titleTemplates.length)];
    const project: Project = {
      id: `filler-${state.currentDay}-${n}`,
      title: `Walk-in: ${title}`,
      genre: template.genre,
      clientType: template.clientType,
      clientId: `walk-in-${template.genre.toLowerCase()}`,
      clientName: 'Walk-in client',
      difficulty: 1,
      payoutBase: Math.max(50, Math.round(perSession * FILLER_PAY_FACTOR)),
      repGainBase: 1,
      durationDaysTotal: 1,
      requiredSkills: { [template.genre]: 1 },
      matchRating: 'Excellent',
      stages: [{ stageName: first.stageName, focusAreas: first.focusAreas, workUnitsBase: first.workUnitsBase, workUnitsCompleted: 0, completed: false }],
      currentStageIndex: 0,
      completedStages: [],
      stake: 'safe',
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      workSessionCount: 0,
      focusAllocation: { performance: 33, soundCapture: 33, layering: 34 },
    };
    project.brief = deriveBrief(project);
    if (!state.claimedOffers?.includes(project.id)) out.push(project);
  }
  return out;
};
