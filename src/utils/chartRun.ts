/**
 * chartRun.ts — weekly chart run for the player's released songs.
 * Pure + deterministic: a song debuts at its estimated position, then each
 * week drifts toward a quality-driven peak and decays, leaving after ~8-10 weeks.
 */
import { createSeededRandom } from '@/simulation/seededRandom';
import { estimateChartPosition } from '@/utils/chartReveal';

export const CHART_WEEK_DAYS = 7;
export const CHART_OFF_POSITION = 100;

export interface ChartRunEntry {
  projectId: string;
  title: string;
  chartName: string;
  quality: number;
  position: number;
  peak: number;
  weeks: number;
  /** Game day of the last weekly update (or debut). */
  lastUpdateDay: number;
}

export interface ChartRunUpdate {
  entry: ChartRunEntry;
  previousPosition: number;
  /** True once the song has fallen off the chart; drop it from the run. */
  exited: boolean;
}

export function debutChartRun(
  projectId: string, title: string, quality: number, day: number, chartName = 'Hot 100',
): ChartRunEntry | null {
  const position = estimateChartPosition(quality, `${projectId}:chart`);
  if (position === null) return null;
  return { projectId, title, chartName, quality, position, peak: position, weeks: 1, lastUpdateDay: day };
}

/** Advance one chart week. Good songs climb for a few weeks, then everything decays. */
export function advanceChartWeek(entry: ChartRunEntry, day: number): ChartRunUpdate {
  const rng = createSeededRandom(`${entry.projectId}:week:${entry.weeks}`);
  const climbWeeks = Math.round((entry.quality - 55) / 12); // 0-4 weeks of climbing
  const climbing = entry.weeks <= climbWeeks;
  const step = Math.max(1, Math.round(entry.position * (0.1 + rng() * 0.25)));
  const wobble = Math.floor(rng() * 3);
  const next = climbing
    ? Math.max(1, entry.position - step)
    : Math.min(CHART_OFF_POSITION, entry.position + step + wobble);
  const position = Math.max(1, next);
  const weeks = entry.weeks + 1;
  return {
    previousPosition: entry.position,
    exited: position >= CHART_OFF_POSITION || weeks > 12,
    entry: { ...entry, position, peak: Math.min(entry.peak, position), weeks, lastUpdateDay: day },
  };
}

/** Whole chart weeks elapsed since an entry's last update, capped to avoid day-skip floods. */
export const weeksDue = (entry: ChartRunEntry, day: number): number =>
  Math.min(4, Math.floor((day - entry.lastUpdateDay) / CHART_WEEK_DAYS));
