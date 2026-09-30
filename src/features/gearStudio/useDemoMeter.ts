import { useEffect, useState } from 'react';
import { demoMeterLevel } from './gearVisualState';

/**
 * Low-frequency deterministic meter driver. One interval, quantised to the meter step,
 * paused while the tab is hidden, and idle (no timer) when unpowered or reduced-motion.
 */
export const useDemoMeter = (params: {
  seed: string | number;
  base: number;
  wobble?: number;
  active: boolean;
  stepMs?: number;
}): number => {
  const { seed, base, wobble, active, stepMs = 250 } = params;
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active || typeof window === 'undefined') {
      setLevel(0);
      return undefined;
    }
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => setLevel(demoMeterLevel({ seed, timeMs: Date.now(), base, wobble, stepMs }));
    const start = () => {
      if (timer === null) {
        tick();
        timer = setInterval(tick, stepMs);
      }
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [seed, base, wobble, active, stepMs]);

  return level;
};
