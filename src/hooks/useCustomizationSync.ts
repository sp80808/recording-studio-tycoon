import { useEffect } from 'react';
import type { GameState } from '@/types/game';
import { getAnchorsForTier, remapForAnchors, syncCustomizationUnlocks } from '@/rpg/studioCustomization';

const nextCustomization = (state: GameState) =>
  remapForAnchors(syncCustomizationUnlocks(state), getAnchorsForTier(state.premisesTier));

/** True when an earned cosmetic is not yet recorded, or equipped items no longer fit the premises (#258). */
export const hasPendingCustomizationUpdate = (state: GameState): boolean => {
  const next = nextCustomization(state);
  return state.studioCustomization ? next !== state.studioCustomization : next.unlockedItems.length > 0;
};

/** Pure state transition: returns the same object when there is nothing to change (idempotent). */
export const applyCustomizationUnlocks = (state: GameState): GameState =>
  hasPendingCustomizationUpdate(state) ? { ...state, studioCustomization: nextCustomization(state) } : state;

/** Grants earned room/producer cosmetics as the career advances. Additive only; never revokes. */
export function useCustomizationSync(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled || !hasPendingCustomizationUpdate(gameState)) return;
    setGameState(prev => applyCustomizationUnlocks(prev));
  }, [gameState, setGameState, enabled]);
}
