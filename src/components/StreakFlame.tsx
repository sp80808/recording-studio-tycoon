import React from 'react';

/**
 * StreakFlame — retention flame for the HUD (k6e.2).
 * Renders nothing below a 2-day streak; pops on change via .flame-pop.
 * tabular-nums so the count doesn't jitter the HUD.
 */
export const StreakFlame: React.FC<{ streakCount?: number | null }> = ({ streakCount }) => {
  const count = streakCount ?? 0;
  if (count < 2) return null;
  const flame = count >= 7 ? '🔥' : count >= 3 ? '✨' : '🌱';
  return (
    <span
      key={count}
      className="flame-pop"
      role="status"
      aria-label={`${count} day streak`}
      title={`${count}-day challenge streak`}
    >
      {flame} {count}
    </span>
  );
};
