// Applies season resolutions to game state: notifications plus small horizontal
// rewards (gems / a flight case for annual award wins) through the same reward
// bundle path the chart reveal and mini-games use (#95, #96).

import type { GameState } from '@/types/game';
import { advanceSeasonClock, describeResolution, type SeasonResolution } from '@/rpg/studioSeasons';
import { grantRewardBundle, type RewardBundle } from './flightCaseEconomy';

export const GEMS_PER_AWARD = 10;

export function rewardForResolution(r: SeasonResolution): RewardBundle {
  const wins = r.awards.filter(a => a.status === 'winner').length;
  if (!wins) return {};
  return { gems: GEMS_PER_AWARD * wins, cases: [{ tier: 'road_case' }] };
}

/** Pure: one day tick of the season clock. Safe to call every day. */
export function applySeasonTick(state: GameState): { state: GameState; resolutions: SeasonResolution[] } {
  const ticked = advanceSeasonClock(state);
  let next = ticked.state;
  for (const r of ticked.resolutions) {
    next = grantRewardBundle(next, rewardForResolution(r)).state;
    const notes = [{
      id: `season-${r.record.seasonId}`,
      message: describeResolution(r),
      type: 'success' as const,
      timestamp: state.currentDay,
      priority: 'medium' as const,
    }];
    for (const a of r.awards) {
      notes.push({
        id: `award-${r.record.seasonId}-${a.id}`,
        message: `${a.name}: ${a.status === 'winner' ? 'Winner' : a.status === 'nominated' ? 'Nominated' : 'Not nominated'}. ${a.why}`,
        type: a.status === 'winner' ? 'success' : 'info',
        timestamp: state.currentDay,
        priority: 'medium',
      });
    }
    next = { ...next, notifications: [...(next.notifications ?? []), ...notes] };
  }
  return { state: next, resolutions: ticked.resolutions };
}
