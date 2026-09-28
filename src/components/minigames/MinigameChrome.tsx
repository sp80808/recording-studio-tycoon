import './minigame-juice.css';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type MinigameAccent = 'blue' | 'green' | 'red' | 'yellow';

interface MinigameChromeProps {
  title: string;
  score: number;
  timeLeft?: number;
  timeUnit?: string;
  streak?: number;
  accent?: MinigameAccent;
  children: ReactNode;
}

const ACCENT_HEADER_STYLES: Record<MinigameAccent, string> = {
  blue: 'from-blue-600 to-blue-900 border-blue-400/40',
  green: 'from-green-600 to-green-900 border-green-400/40',
  red: 'from-red-600 to-red-900 border-red-400/40',
  yellow: 'from-yellow-500 to-yellow-800 border-yellow-300/40',
};

export function MinigameChrome({
  title,
  score,
  timeLeft,
  timeUnit = 's',
  streak,
  accent = 'blue',
  children,
}: MinigameChromeProps) {
  const timeDanger = timeLeft !== undefined && timeLeft <= 10;

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-lg">
      <div
        className={`flex items-center justify-between gap-2 border-b bg-gradient-to-r px-4 py-2 ${ACCENT_HEADER_STYLES[accent]}`}
      >
        <h3 className="min-w-0 flex-1 truncate text-left text-sm font-bold text-white">
          {title}
        </h3>
        <div className="flex flex-1 items-center justify-center gap-2 text-sm font-semibold text-white">
          <span>
            Score: <span className="tabular-nums">{score}</span>
          </span>
          {streak !== undefined && streak >= 2 && (
            <span className="mg-combo-pulse" aria-label={`${streak} streak`}>
              🔥x{streak}
            </span>
          )}
        </div>
        {timeLeft !== undefined && (
          <div
            className={`flex-1 text-right text-sm font-bold tabular-nums ${
              timeDanger ? 'animate-pulse text-red-400' : 'text-white'
            }`}
            aria-live="polite"
          >
            ⏱ {timeLeft}
            {timeUnit}
          </div>
        )}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}

export { KenneyButton, type KenneyButtonProps, type KenneyButtonVariant } from '@/components/ui/KenneyButton';
