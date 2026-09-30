// Connects flight case + gem rewards to the chart reveal / mini-game payoff
// scenes. The game event bus drives the actual grant; the payoff scene's
// reward provider only *displays* the same bundle (both derive from the pure
// functions in flightCaseEconomy, so what is shown is what was granted).

import type { GameState } from '@/types/game';
import { gameEvents } from '@/engine/gameEventBus';
import { registerRewardProvider, MINIGAME_SUCCESS_SCORE, type RewardItem } from '@/utils/chartReveal';
import { FLIGHT_CASES } from '@/data/flightCases';
import {
  grantRewardBundle,
  rewardForChartPlacement,
  rewardForMinigame,
  type RewardBundle,
} from './flightCaseEconomy';

export const gradeForMinigameScore = (score: number): 'S' | 'A' | 'B' | 'C' =>
  score >= 900 ? 'S' : score >= 800 ? 'A' : score >= MINIGAME_SUCCESS_SCORE ? 'B' : 'C';

export function bundleToRewardItems(bundle: RewardBundle): RewardItem[] {
  const items: RewardItem[] = [];
  if (bundle.gems) items.push({ id: 'gems', label: `+${bundle.gems} gems`, icon: '💎' });
  (bundle.cases ?? []).forEach((c, i) =>
    items.push({ id: `case-${i}`, label: FLIGHT_CASES[c.tier].name, icon: FLIGHT_CASES[c.tier].icon }),
  );
  return items;
}

/** Returns an uninstall function. */
export function installFlightCaseRewards(
  setGameState: (updater: (prev: GameState) => GameState) => void,
): () => void {
  const apply = (bundle: RewardBundle) => {
    if (!bundle.gems && !bundle.cases?.length) return;
    setGameState((prev) => grantRewardBundle(prev, bundle).state);
  };
  const offChart = gameEvents.on('chart:placement', (p) => apply(rewardForChartPlacement(p.position)));
  const offMini = gameEvents.on('minigame:success', (p) => apply(rewardForMinigame(gradeForMinigameScore(p.score))));
  const offProvider = registerRewardProvider((m) =>
    bundleToRewardItems(
      m.source === 'chart' && m.position != null
        ? rewardForChartPlacement(m.position)
        : rewardForMinigame(gradeForMinigameScore(m.score ?? 0)),
    ),
  );
  return () => {
    offChart();
    offMini();
    offProvider();
  };
}
