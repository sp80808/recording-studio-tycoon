import React, { useState, useEffect, useRef } from 'react';
import { motionSpring } from '@/lib/motion/tokens';
import { useMotionCapabilities } from '@/lib/motion/capabilities';
import { formatNumber } from '@/i18n/formatLocale';

export interface MotionNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Target numeric value */
  value: number;
  /** Starting value on first mount (default: 0) */
  from?: number;
  /** Optional prefix string (e.g. '$', '+') */
  prefix?: string;
  /** Optional suffix string (e.g. ' XP', '%') */
  suffix?: string;
  /** Custom formatter function (takes rounded number, returns string) */
  format?: (val: number) => string;
  className?: string;
  onComplete?: () => void;
}

/**
 * Pure analytical damped harmonic oscillator solver for spring settle.
 * Computes exact position at elapsed seconds `t` without frame accumulation error.
 */
export function evaluateSpringSettle(
  from: number,
  target: number,
  t: number,
  stiffness = motionSpring.drawer.stiffness,
  damping = motionSpring.drawer.damping,
  mass = motionSpring.drawer.mass
): { value: number; isSettled: boolean } {
  const delta = target - from;
  if (delta === 0) return { value: target, isSettled: true };
  if (t <= 0) return { value: from, isSettled: false };

  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * w0 * t);
    const cosTerm = Math.cos(wd * t);
    const sinTerm = Math.sin(wd * t);
    const factor = envelope * (cosTerm + (zeta / Math.sqrt(1 - zeta * zeta)) * sinTerm);
    const current = target - delta * factor;
    const isSettled = envelope < 0.003 || t > 1.2;
    return { value: isSettled ? target : current, isSettled };
  } else {
    const envelope = Math.exp(-w0 * t);
    const factor = envelope * (1 + w0 * t);
    const current = target - delta * factor;
    const isSettled = envelope < 0.003 || t > 1.2;
    return { value: isSettled ? target : current, isSettled };
  }
}

/**
 * Tactile numeric display with spring deceleration and reduced-motion instant jump.
 * Zero external animation dependencies; works seamlessly in headless test runners.
 */
export const MotionNumber: React.FC<MotionNumberProps> = ({
  value,
  from,
  prefix = '',
  suffix = '',
  format,
  className = '',
  onComplete,
  ...rest
}) => {
  const { reducedMotion, isTabVisible } = useMotionCapabilities();
  const [displayValue, setDisplayValue] = useState<number>(() => (from !== undefined ? from : value));
  const prevValueRef = useRef<number>(from !== undefined ? from : value);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const startVal = prevValueRef.current;
    prevValueRef.current = value;

    // Instant jump if reduced motion, hidden tab, or start == target
    if (reducedMotion || !isTabVisible || typeof window === 'undefined' || startVal === value) {
      setDisplayValue(value);
      onCompleteRef.current?.();
      return;
    }

    let rafId: number;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsedSec = (now - startTime) / 1000;
      const { value: springVal, isSettled } = evaluateSpringSettle(
        startVal,
        value,
        elapsedSec,
        motionSpring.drawer.stiffness,
        motionSpring.drawer.damping,
        motionSpring.drawer.mass
      );

      setDisplayValue(Math.round(springVal));

      if (isSettled) {
        setDisplayValue(value);
        onCompleteRef.current?.();
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (typeof window !== 'undefined' && rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [value, reducedMotion, isTabVisible]);

  const formatted = format
    ? format(displayValue)
    : `${prefix}${formatNumber(displayValue)}${suffix}`;

  return (
    <span
      role="status"
      aria-live="polite"
      className={`font-mono inline-block ${className}`}
      {...rest}
    >
      {formatted}
    </span>
  );
};
