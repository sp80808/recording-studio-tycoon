import React, { useEffect, useRef, useState } from 'react';

/**
 * SettleTicker — settle landing for HUD chips (k6e.2).
 * Pulses `.settle-tick` for 600 ms whenever `value` rises (rewards landing,
 * not just flying). Mounts around AnimatedCounter; owns its motion curve.
 */
export const SettleTicker: React.FC<{
  value: number;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const [ticking, setTicking] = useState(false);
  const prev = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value > prev.current) {
      setTicking(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setTicking(false), 650);
    }
    prev.current = value;
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  return <span className={ticking ? 'settle-tick feel-land' : ''} style={{ display: 'inline-flex', alignItems: 'center' }}>{children}</span>;
};
