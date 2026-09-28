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
  default: 'border-slate-700/80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95',
  slate: 'border-slate-600/80 bg-gradient-to-b from-slate-900/95 via-slate-800/80 to-slate-950/95',
  amber: 'border-amber-500/50 bg-gradient-to-b from-slate-900/95 via-amber-950/30 to-slate-950/95',
  cyan: 'border-cyan-500/50 bg-gradient-to-b from-slate-900/95 via-cyan-950/30 to-slate-950/95',
  emerald: 'border-emerald-500/50 bg-gradient-to-b from-slate-900/95 via-emerald-950/30 to-slate-950/95',
  interactive: 'border-slate-700/80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 hover:border-slate-500 hover:brightness-110 active:scale-[0.99] cursor-pointer transition-all',
};

const GLOW_STYLES: Record<GamePanelVariant, string> = {
  default: 'shadow-[0_0_15px_rgba(100,116,139,0.25)]',
  slate: 'shadow-[0_0_15px_rgba(148,163,184,0.25)]',
  amber: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
  cyan: 'shadow-[0_0_15px_rgba(6,182,212,0.25)]',
  emerald: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
  interactive: 'shadow-[0_0_15px_rgba(100,116,139,0.2)]',
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
        className={`min-h-0 rounded-lg border-2 text-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.5)] ${borderBg} ${glowClass} ${className}`}
        {...props}
      >
        {(title || headerActions) && (
          <div className="flex items-center justify-between border-b-2 border-inherit px-3 py-2 bg-black/20">
            <div className="flex items-center gap-2">
              {headerIcon && <span className="shrink-0 text-inherit">{headerIcon}</span>}
              {title && <span className="font-bold text-xs uppercase tracking-wider text-slate-200">{title}</span>}
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
