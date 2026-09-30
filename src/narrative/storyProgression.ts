/**
 * Composite story tick — the single entry point the game loop calls after a settlement or a day change.
 * Order matters: evaluate objectives/subplots first, offer the story contract for whatever node is now active,
 * let the Studio Event Director take its (at most one) opportunity, then award any achievements the new state has earned.
 */
import type { GameState } from '@/types/game';
import { evaluateStorylineTick } from './branchingStorylineEngine';
import { withStoryContract } from './storyContracts';
import { evaluateAchievements } from './achievements';
import { tickDirector } from './directorEvents';

export const advanceStory = (state: GameState): GameState =>
  evaluateAchievements(withStoryContract(tickDirector(evaluateStorylineTick(state)))).state;
