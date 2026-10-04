import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  getStudioClockSnapshot,
  type StudioDifficulty,
} from '@/game-mechanics/studioTime';

export type StudioClock = ReturnType<typeof getStudioClockSnapshot>;

const StudioClockContext = createContext<StudioClock>(getStudioClockSnapshot(0, 'medium'));

interface StudioClockProviderProps {
  currentDay: number;
  difficulty: StudioDifficulty;
  active: boolean;
  onDayComplete: () => void;
  children: React.ReactNode;
}

/**
 * Owns the playable-day timer. It runs only while the studio is foregrounded
 * and interactive, then asks the existing authoritative advance-day action to
 * settle the day. The clock itself remains purely presentational.
 */
export const StudioClockProvider: React.FC<StudioClockProviderProps> = ({
  currentDay,
  difficulty,
  active,
  onDayComplete,
  children,
}) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const lastDayRef = useRef(currentDay);
  const lastTickRef = useRef<number | null>(null);
  const completeRef = useRef(onDayComplete);
  const clock = useMemo(() => getStudioClockSnapshot(elapsedMs, difficulty), [elapsedMs, difficulty]);

  useEffect(() => {
    completeRef.current = onDayComplete;
  }, [onDayComplete]);

  useEffect(() => {
    if (lastDayRef.current === currentDay) return;
    lastDayRef.current = currentDay;
    lastTickRef.current = null;
    setElapsedMs(0);
  }, [currentDay]);

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      lastTickRef.current = null;
      return;
    }
    const tick = () => {
      const now = performance.now();
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      if (typeof document !== 'undefined' && document.hidden) return;
      setElapsedMs((previous) => Math.min(clock.durationMs, previous + Math.min(1_000, now - last)));
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [active, clock.durationMs]);

  useEffect(() => {
    if (!active || elapsedMs < clock.durationMs) return;
    // Hold at the end-of-day visual until the existing settlement action has
    // changed currentDay; that change resets this timer above.
    completeRef.current();
  }, [active, clock.durationMs, elapsedMs]);

  return <StudioClockContext.Provider value={clock}>{children}</StudioClockContext.Provider>;
};

export const useStudioClock = (): StudioClock => useContext(StudioClockContext);
