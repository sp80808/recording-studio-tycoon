import React, { useState } from 'react';
import { GamePanel } from '@/components/ui/GamePanel';
import { KenneyButton } from '@/components/ui/KenneyButton';
import { PRODUCER_ORIGINS, getProducerOrigin, PLAYSTYLE_CONFIGS } from '@/narrative/characterOrigins';
import { THEME_VISUAL_CONFIGS, getRecommendedThemeForPlaystyle } from '@/narrative/playstyleTheme';
import { ProducerBackgroundId, PlaystyleFocus, VisualThemeId, ProducerCustomization } from '@/types/character';
import { gameAudio } from '@/utils/audioSystem';
import { Disc3, Sliders, Sparkles, User, Palette, CheckCircle2 } from 'lucide-react';

interface CharacterCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomization?: Partial<ProducerCustomization>;
  onSave: (customization: ProducerCustomization) => void;
}

export const CharacterCustomizationModal: React.FC<CharacterCustomizationModalProps> = ({
  isOpen,
  onClose,
  initialCustomization,
  onSave,
}) => {
  const [moniker, setMoniker] = useState(initialCustomization?.moniker || 'The Architect');
  const [motto, setMotto] = useState(initialCustomization?.signatureMotto || 'In Sound We Trust');
  const [selectedOrigin, setSelectedOrigin] = useState<ProducerBackgroundId>(
    initialCustomization?.backgroundId || 'tape-purist'
  );
  const [selectedPlaystyle, setSelectedPlaystyle] = useState<PlaystyleFocus>(
    initialCustomization?.playstyle || 'purist'
  );
  const [selectedTheme, setSelectedTheme] = useState<VisualThemeId>(
    initialCustomization?.visualTheme || 'warm-analog'
  );

  const [activeTab, setActiveTab] = useState<'origin' | 'playstyle' | 'visuals'>('origin');

  if (!isOpen) return null;

  const currentOrigin = getProducerOrigin(selectedOrigin);
  const currentPlaystyleConfig = PLAYSTYLE_CONFIGS[selectedPlaystyle];
  const currentThemeConfig = THEME_VISUAL_CONFIGS[selectedTheme];

  const handleSelectOrigin = (originId: ProducerBackgroundId) => {
    setSelectedOrigin(originId);
    const origin = getProducerOrigin(originId);
    setSelectedPlaystyle(origin.primaryPlaystyle);
    setSelectedTheme(getRecommendedThemeForPlaystyle(origin.primaryPlaystyle));
    void gameAudio.playClick().catch(() => {});
  };

  const handleSelectPlaystyle = (playstyle: PlaystyleFocus) => {
    setSelectedPlaystyle(playstyle);
    setSelectedTheme(getRecommendedThemeForPlaystyle(playstyle));
    void gameAudio.playClick().catch(() => {});
  };

  const handleSave = () => {
    onSave({
      name: moniker,
      moniker,
      backgroundId: selectedOrigin,
      playstyle: selectedPlaystyle,
      visualTheme: selectedTheme,
      signatureMotto: motto,
      avatarIcon: '🎛️',
      unlockedThemes: ['warm-analog', 'neon-digital', 'velvet-lounge', 'modular-rack'],
      storyFlags: {},
    });
    void gameAudio.playUISound('menuClose').catch(() => {});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-customization-title"
    >
      {/* Background Gradient Scrim */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
        onClick={() => {
          void gameAudio.playUISound('menuClose').catch(() => {});
          onClose();
        }}
      />

      <GamePanel
        className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl animate-inspector-pop"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-slate-700/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎛️</span>
            <div>
              <h2 id="character-customization-title" className="text-lg font-black tracking-wide text-white uppercase">
                Producer Profile & Style
              </h2>
              <p className="text-xs text-slate-400">
                Craft your studio identity, origin background, and audio philosophy.
              </p>
            </div>
          </div>
          <KenneyButton
            onClick={() => {
              void gameAudio.playUISound('menuClose').catch(() => {});
              onClose();
            }}
            variant="grey"
            size="sm"
          >
            ✕
          </KenneyButton>
        </div>

        {/* Identity Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 shrink-0">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Producer Moniker / Alias
            </label>
            <input
              type="text"
              value={moniker}
              onChange={(e) => setMoniker(e.target.value)}
              maxLength={24}
              className="w-full bg-slate-950/80 border-2 border-slate-700 rounded-md px-3 py-1.5 text-sm font-bold text-amber-200 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. The Architect"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Console Motto
            </label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              maxLength={36}
              className="w-full bg-slate-950/80 border-2 border-slate-700 rounded-md px-3 py-1.5 text-sm font-medium text-slate-200 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. In Sound We Trust"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 mb-3 bg-slate-950/60 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('origin'); void gameAudio.playClick().catch(() => {}); }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded transition-all ${
              activeTab === 'origin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={14} /> Origin Lore
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('playstyle'); void gameAudio.playClick().catch(() => {}); }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded transition-all ${
              activeTab === 'playstyle'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders size={14} /> Play Style
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('visuals'); void gameAudio.playClick().catch(() => {}); }}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded transition-all ${
              activeTab === 'visuals'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette size={14} /> Studio Theme
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
          {activeTab === 'origin' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400">
                Your origin determines starting stat bonuses and signature acoustic traits.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PRODUCER_ORIGINS.map((origin) => {
                  const isSelected = selectedOrigin === origin.id;
                  return (
                    <div
                      key={origin.id}
                      onClick={() => handleSelectOrigin(origin.id)}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-all game-interactive ${
                        isSelected
                          ? 'border-amber-400/80 bg-amber-950/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'border-slate-700/70 bg-slate-900/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            {origin.name}
                            {isSelected && <CheckCircle2 size={16} className="text-amber-400" />}
                          </h4>
                          <p className="text-[11px] text-amber-200/90 font-medium italic mt-0.5">
                            "{origin.tagline}"
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {origin.primaryPlaystyle}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                        {origin.lore}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700 text-emerald-300 font-semibold">
                          ⚡ {origin.passivePerk.name}: {origin.passivePerk.description}
                        </span>
                        <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700 text-slate-400">
                          🎙 Signature: {origin.signatureGenres.slice(0, 3).join(', ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'playstyle' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400">
                Choose the philosophy that drives your contracts, client bookings, and awards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.entries(PLAYSTYLE_CONFIGS) as [PlaystyleFocus, typeof currentPlaystyleConfig][]).map(
                  ([styleKey, config]) => {
                    const isSelected = selectedPlaystyle === styleKey;
                    return (
                      <div
                        key={styleKey}
                        onClick={() => handleSelectPlaystyle(styleKey)}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all game-interactive flex flex-col justify-between ${
                          isSelected
                            ? 'border-sky-400/80 bg-sky-950/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                            : 'border-slate-700/70 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-white">{config.label}</h4>
                            {isSelected && <CheckCircle2 size={16} className="text-sky-400" />}
                          </div>
                          <p className="text-[11px] text-sky-200 font-medium italic mb-2">
                            {config.tagline}
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            {config.focusBonusDescription}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                          Award Weight: x{config.preferredAwardsWeight} · Trend Sensitivity: x{config.marketTrendSensitivity}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {activeTab === 'visuals' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-400">
                Select your control room aesthetic and hardware meter styling.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.entries(THEME_VISUAL_CONFIGS) as [VisualThemeId, typeof currentThemeConfig][]).map(
                  ([themeKey, theme]) => {
                    const isSelected = selectedTheme === themeKey;
                    return (
                      <div
                        key={themeKey}
                        onClick={() => { setSelectedTheme(themeKey); void gameAudio.playClick().catch(() => {}); }}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all game-interactive ${
                          isSelected
                            ? `${theme.panelBorderClass} ${theme.panelBackgroundClass} ${theme.glowClass}`
                            : 'border-slate-700/70 bg-slate-900/60 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                            {theme.name}
                          </h4>
                          {isSelected && <CheckCircle2 size={16} style={{ color: theme.primaryColor }} />}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {theme.description}
                        </p>
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Meters: <strong className="text-white uppercase">{theme.meterStyle}</strong></span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${theme.uiBadgeClass}`}>
                            Preview
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t-2 border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 truncate">
            Active: <strong className="text-amber-300">{currentOrigin.name}</strong> · <span className="text-sky-300">{currentPlaystyleConfig.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <KenneyButton
              onClick={handleSave}
              variant="green"
              size="md"
            >
              Save Profile
            </KenneyButton>
          </div>
        </div>
      </GamePanel>
    </div>
  );
};
