import { getDayPhase, STUDIO_DAY_MINUTES, type DayPhase } from '@/components/studio/studioDecorConfig';

export type StudioDifficulty = 'easy' | 'medium' | 'hard';

/**
 * One playable studio day at each career difficulty. Medium deliberately keeps
 * the original four in-game-minutes-per-real-second visual cadence.
 */
export const STUDIO_DAY_DURATION_MS: Record<StudioDifficulty, number> = {
  easy: 8 * 60_000,
  medium: 6 * 60_000,
  hard: 4 * 60_000,
};

/** Start each workday in the morning, not at an arbitrary clock offset. */
export const STUDIO_DAY_START_MINUTES = 8 * 60;

export const getStudioDayDurationMs = (difficulty: StudioDifficulty): number =>
  STUDIO_DAY_DURATION_MS[difficulty];

export const getStudioDayDurationLabel = (difficulty: StudioDifficulty): string => {
  const minutes = Math.round(getStudioDayDurationMs(difficulty) / 60_000);
  return `${minutes} min/day`;
};

export const getStudioClockMinutesForElapsed = (
  elapsedMs: number,
  difficulty: StudioDifficulty,
): number => {
  const progress = Math.max(0, Math.min(1, elapsedMs / getStudioDayDurationMs(difficulty)));
  return (STUDIO_DAY_START_MINUTES + Math.floor(progress * STUDIO_DAY_MINUTES)) % STUDIO_DAY_MINUTES;
};

export const formatStudioTime = (minutesOfDay: number): string => {
  const minutes = ((Math.floor(minutesOfDay) % STUDIO_DAY_MINUTES) + STUDIO_DAY_MINUTES) % STUDIO_DAY_MINUTES;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

export const formatStudioCountdown = (remainingMs: number): string => {
  const wholeSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, '0')}`;
};

export const getStudioClockSnapshot = (elapsedMs: number, difficulty: StudioDifficulty) => {
  const durationMs = getStudioDayDurationMs(difficulty);
  const clampedElapsedMs = Math.max(0, Math.min(durationMs, elapsedMs));
  const minutesOfDay = getStudioClockMinutesForElapsed(clampedElapsedMs, difficulty);
  return {
    difficulty,
    durationMs,
    elapsedMs: clampedElapsedMs,
    minutesOfDay,
    formattedTime: formatStudioTime(minutesOfDay),
    phase: getDayPhase(minutesOfDay) as DayPhase,
    progress: clampedElapsedMs / durationMs,
    remainingMs: Math.max(0, durationMs - clampedElapsedMs),
  };
};
