import './minigame-juice.css';

import type { ReactNode } from 'react';
import { Flame, Timer } from 'lucide-react';

/** Kept for call-site compatibility: cyan/purple fold into the closest palette accent. */
type MinigameAccent = 'blue' | 'green' | 'red' | 'yellow' | 'cyan' | 'purple';

interface MinigameChromeProps {
  title: string;
  subtitle?: string;
  /** Omit for games without a running score; the score readout is hidden. */
  score?: number;
  /** Renders a close button in the header (games that run outside the dialog footer). */
  onClose?: () => void;
  timeLeft?: number;
  timeUnit?: string;
  streak?: number;
  accent?: MinigameAccent;
  children: ReactNode;
}

/**
 * Accent = one small colour bar + kicker, never a tinted header fill.
 * live (teal) for technical work, money-green for building, danger for risk, brass for craft, story-violet for creative.
 */
const ACCENT: Record<MinigameAccent, string> = {
  blue: 'var(--rst-live)',
  cyan: 'var(--rst-live)',
  green: 'var(--rst-money)',
  red: 'var(--rst-danger)',
  yellow: 'var(--rst-brass-400)',
  purple: 'var(--rst-story)',
};

/** Titles were authored with a leading emoji; the chrome drops it so every game header reads the same. */
const stripLeadingEmoji = (title: string) => title.replace(/^[\p{Extended_Pictographic}️‍\s]+/u, '');

export function MinigameChrome({
  title,
  subtitle,
  score,
  onClose,
  timeLeft,
  timeUnit = 's',
  streak,
  accent = 'blue',
  children,
}: MinigameChromeProps) {
  const timeDanger = timeLeft !== undefined && timeLeft <= 10;
  const accentColor = ACCENT[accent] ?? ACCENT.blue;

  return (
    <div className="rst-surface flex w-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--rst-line)] px-4 py-2.5">
        <h3 className="flex min-w-0 flex-1 items-center gap-2 truncate text-left text-sm font-semibold text-[var(--rst-ivory)]">
          <span aria-hidden="true" className="h-4 w-1 shrink-0 rounded-full" style={{ background: accentColor }} />
          <span className="truncate">{stripLeadingEmoji(title)}</span>
        </h3>
        <div className="flex flex-1 items-center justify-center gap-2 text-sm font-semibold text-[var(--rst-ivory)]">
          {score !== undefined && (
            <span>
              Score: <span className="tabular-nums">{score}</span>
            </span>
          )}
          {streak !== undefined && streak >= 2 && (
            <span className="mg-combo-pulse inline-flex items-center gap-1 text-[var(--rst-brass-300)]" aria-label={`${streak} streak`}>
              <Flame size={14} aria-hidden="true" />x{streak}
            </span>
          )}
        </div>
        {timeLeft !== undefined && (
          <div
            className={`flex flex-1 items-center justify-end gap-1 text-sm font-bold tabular-nums ${
              timeDanger ? 'animate-pulse text-[var(--rst-danger)]' : 'text-[var(--rst-ivory)]'
            }`}
            aria-live="polite"
          >
            <Timer size={14} aria-hidden="true" />
            {timeLeft}
            {timeUnit}
          </div>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close minigame"
            className="ml-2 rounded px-2 py-0.5 text-sm font-bold text-[var(--rst-ivory)] hover:bg-white/10"
          >
            ✕
          </button>
        )}
      </div>
      {subtitle && <p className="border-b border-[var(--rst-line)] px-4 py-1.5 text-left text-xs text-stone-400">{subtitle}</p>}
      <div className="w-full">{children}</div>
    </div>
  );
}

export { KenneyButton, type KenneyButtonProps, type KenneyButtonVariant } from '@/components/ui/KenneyButton';
