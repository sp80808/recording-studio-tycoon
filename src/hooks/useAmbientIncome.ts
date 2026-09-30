import { useEffect, useRef } from 'react';
import type { GameState } from '@/types/game';
import { accrueActiveTime, applyAmbientTick } from '@/economy/ambientIncome';

const POLL_MS = 5_000;
const INPUT_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel'] as const;

/** Drives the ambient trickle: accrues only while the tab is visible and the player is interacting. */
export function useAmbientIncome(
  enabled: boolean,
  setGameState: (updater: (prev: GameState) => GameState) => void,
): void {
  const lastInput = useRef(Date.now());
  const accumulated = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const touch = () => { lastInput.current = Date.now(); };
    INPUT_EVENTS.forEach((name) => window.addEventListener(name, touch, { passive: true }));
    let last = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - last;
      last = now;
      const { accumulatedMs, due } = accrueActiveTime(
        accumulated.current, elapsed, now - lastInput.current, document.visibilityState !== 'hidden',
      );
      accumulated.current = accumulatedMs;
      for (let i = 0; i < due; i += 1) setGameState((prev) => (prev ? applyAmbientTick(prev).state : prev));
    }, POLL_MS);
    return () => {
      INPUT_EVENTS.forEach((name) => window.removeEventListener(name, touch));
      window.clearInterval(interval);
    };
  }, [enabled, setGameState]);
}
