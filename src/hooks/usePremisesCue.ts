import { useEffect, useRef } from 'react';
import type { GameState } from '@/types/game';
import { gameAudio } from '@/utils/audioSystem';
import { getPremisesCue, markPremisesCueDelivered } from '@/rpg/premisesCue';

/**
 * Delivers the property-lead world cue (#250): phone rings or a knock at the door,
 * once per lead. Sounds go through playUISound, so the central one-shot gate
 * applies; the lead is marked seen in state so reloads and re-renders stay quiet.
 */
export function usePremisesCue(
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  enabled: boolean,
  sfxEnabled: boolean,
): void {
  const firedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const cue = getPremisesCue(gameState);
    if (!cue || firedRef.current === cue.leadId) return;
    firedRef.current = cue.leadId;
    setGameState(prev => markPremisesCueDelivered(prev, cue));
    if (!sfxEnabled) return;
    // No cleanup: marking the lead seen re-renders immediately, and the ring must still finish.
    cue.sounds.forEach(x => window.setTimeout(() => { void gameAudio.playUISound(x.sound); }, x.delayMs));
  }, [gameState, setGameState, enabled, sfxEnabled]);
}
