import { PlaystyleFocus, VisualThemeId } from '@/types/character';

export interface ThemeVisualConfig {
  id: VisualThemeId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  panelBorderClass: string;
  panelBackgroundClass: string;
  glowClass: string;
  meterStyle: 'analog-vu' | 'digital-led' | 'warm-lamp' | 'oscilloscope';
  vignetteTone: string;
  uiBadgeClass: string;
}

export const THEME_VISUAL_CONFIGS: Record<VisualThemeId, ThemeVisualConfig> = {
  'warm-analog': {
    id: 'warm-analog',
    name: 'Warm Analog Abbey',
    description: 'Amber vacuum tube warmth, vintage mahogany wood, and analog needle VU meters',
    primaryColor: '#f59e0b',
    accentColor: '#b45309',
    panelBorderClass: 'border-amber-500/60',
    panelBackgroundClass: 'bg-gradient-to-b from-amber-950/40 via-slate-900/95 to-slate-950/95',
    glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    meterStyle: 'analog-vu',
    vignetteTone: 'radial-gradient(circle at center, transparent 40%, rgba(30, 15, 5, 0.7) 100%)',
    uiBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  'neon-digital': {
    id: 'neon-digital',
    name: 'Neon Grid Penthouse',
    description: 'Electric cyan and violet LED lighting, polished obsidian, and digital peak meters',
    primaryColor: '#06b6d4',
    accentColor: '#a855f7',
    panelBorderClass: 'border-cyan-500/60',
    panelBackgroundClass: 'bg-gradient-to-b from-cyan-950/30 via-slate-900/95 to-slate-950/95',
    glowClass: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    meterStyle: 'digital-led',
    vignetteTone: 'radial-gradient(circle at center, transparent 40%, rgba(5, 12, 25, 0.7) 100%)',
    uiBadgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  'velvet-lounge': {
    id: 'velvet-lounge',
    name: 'Executive Velvet Lounge',
    description: 'Deep plum and gold luxury, padded leather consoles, and subtle brass accents',
    primaryColor: '#c084fc',
    accentColor: '#fbbf24',
    panelBorderClass: 'border-purple-500/60',
    panelBackgroundClass: 'bg-gradient-to-b from-purple-950/30 via-slate-900/95 to-slate-950/95',
    glowClass: 'shadow-[0_0_20px_rgba(192,132,252,0.25)]',
    meterStyle: 'warm-lamp',
    vignetteTone: 'radial-gradient(circle at center, transparent 40%, rgba(20, 8, 25, 0.75) 100%)',
    uiBadgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  'modular-rack': {
    id: 'modular-rack',
    name: 'Modular Synth Laboratory',
    description: 'Phosphor green terminal displays, brushed aluminum rack panels, and oscilloscope sine waves',
    primaryColor: '#10b981',
    accentColor: '#38bdf8',
    panelBorderClass: 'border-emerald-500/60',
    panelBackgroundClass: 'bg-gradient-to-b from-emerald-950/30 via-slate-900/95 to-slate-950/95',
    glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    meterStyle: 'oscilloscope',
    vignetteTone: 'radial-gradient(circle at center, transparent 40%, rgba(4, 20, 14, 0.75) 100%)',
    uiBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
};

/** Get visual presentation config by theme id */
export const getThemeVisualConfig = (themeId: VisualThemeId): ThemeVisualConfig => {
  return THEME_VISUAL_CONFIGS[themeId] ?? THEME_VISUAL_CONFIGS['warm-analog'];
};

/** Get recommended theme for a playstyle */
export const getRecommendedThemeForPlaystyle = (playstyle: PlaystyleFocus): VisualThemeId => {
  switch (playstyle) {
    case 'purist':
      return 'warm-analog';
    case 'hit-maker':
      return 'velvet-lounge';
    case 'underground':
      return 'neon-digital';
    case 'sound-lab':
      return 'modular-rack';
  }
};
