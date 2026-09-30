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
  default: 'border-[var(--rst-line-strong)] bg-gradient-to-b from-[#231e19]/90 via-[#1b1815]/90 to-[#14110f]/95',
  slate: 'border-[var(--rst-line-strong)] bg-gradient-to-b from-[#28231d]/90 via-[#1e1a16]/90 to-[#15120f]/95',
  amber: 'border-[var(--rst-brass-line)] bg-gradient-to-b from-[#2c2417]/90 via-[#211b13]/90 to-[#15110d]/95',
  // "cyan" = live / in-progress state — rendered as a muted teal, never saturated blue.
  cyan: 'border-teal-300/25 bg-gradient-to-b from-[#16241f]/90 via-[#131d1a]/90 to-[#0f1513]/95',
  emerald: 'border-emerald-300/25 bg-gradient-to-b from-[#17241b]/90 via-[#131d16]/90 to-[#0f1511]/95',
  interactive: 'border-[var(--rst-line-strong)] bg-gradient-to-b from-[#231e19]/90 via-[#1b1815]/90 to-[#14110f]/95 hover:border-[var(--rst-brass-line)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.4)] active:translate-y-0 cursor-pointer transition-all duration-200',
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
        className={`min-h-0 rounded-xl border text-stone-100 shadow-[inset_0_1px_0_rgba(255,244,214,0.07),0_6px_20px_rgba(0,0,0,0.35)] ${borderBg} ${glowClass} ${className}`}
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
