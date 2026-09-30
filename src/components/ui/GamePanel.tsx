import React from 'react';

export type GamePanelVariant = 'default' | 'amber' | 'cyan' | 'emerald' | 'slate' | 'interactive';

export interface GamePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GamePanelVariant;
  glow?: boolean;
  title?: string;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
}

const VARIANT_BORDER_BG: Record<GamePanelVariant, string> = {
  default: 'border-[var(--rst-line-strong)] bg-[rgba(24,21,18,0.86)]',
  slate: 'border-[var(--rst-line-strong)] bg-[rgba(30,26,22,0.86)]',
  amber: 'border-[var(--rst-brass-line)] bg-[rgba(38,30,18,0.82)]',
  // "cyan" = live / in-progress state — rendered as a muted teal, never saturated blue.
  cyan: 'border-teal-300/25 bg-[rgba(18,32,28,0.84)]',
  emerald: 'border-emerald-300/25 bg-[rgba(20,33,25,0.84)]',
  interactive: 'border-[var(--rst-line-strong)] bg-[rgba(24,21,18,0.86)] hover:border-[var(--rst-brass-line)] hover:bg-[rgba(32,28,23,0.9)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-200',
};

const GLOW_STYLES: Record<GamePanelVariant, string> = {
  default: 'shadow-[0_0_18px_rgba(230,184,102,0.10)]',
  slate: 'shadow-[0_0_18px_rgba(230,184,102,0.10)]',
  amber: 'shadow-[0_0_22px_rgba(230,184,102,0.22)]',
  cyan: 'shadow-[0_0_20px_rgba(95,208,192,0.18)]',
  emerald: 'shadow-[0_0_20px_rgba(127,214,166,0.18)]',
  interactive: 'shadow-[0_0_18px_rgba(230,184,102,0.10)]',
};

/**
 * GamePanel: Beveled tactile game container replacing generic web dashboard cards.
 * Provides 2px borders, hardware inner shadows, subtle era gradients, and containment.
 */
export const GamePanel = React.forwardRef<HTMLDivElement, GamePanelProps>(
  ({ variant = 'default', glow = false, title, headerIcon, headerActions, children, className = '', ...props }, ref) => {
    const borderBg = VARIANT_BORDER_BG[variant];
    const glowClass = glow ? GLOW_STYLES[variant] : '';

    return (
      <div
        ref={ref}
        className={`min-h-0 rounded-xl border text-stone-100 shadow-[0_6px_20px_rgba(0,0,0,0.3)] backdrop-blur-sm ${borderBg} ${glowClass} ${className}`}
        {...props}
      >
        {(title || headerActions) && (
          <div className="flex items-center justify-between border-b border-inherit px-3.5 py-2.5 bg-black/20">
            <div className="flex items-center gap-2">
              {headerIcon && <span className="shrink-0 text-inherit">{headerIcon}</span>}
              {title && <span className="rst-kicker !text-stone-200">{title}</span>}
            </div>
            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
          </div>
        )}
        {children}
      </div>
    );
  }
);

GamePanel.displayName = 'GamePanel';
