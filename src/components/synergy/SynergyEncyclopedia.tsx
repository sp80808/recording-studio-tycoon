import React, { useState, useMemo } from 'react';
import { GameState } from '@/types/game';
import { StudioSynergy, SynergyCategory } from '@/types/synergy';
import { STUDIO_SYNERGIES } from '@/data/synergies';
import { useSettings } from '@/contexts/SettingsContext';
import { gameAudio } from '@/utils/audioSystem';

interface SynergyEncyclopediaProps {
  gameState: GameState;
  className?: string;
}

const CATEGORY_LABELS: Record<SynergyCategory, { label: string; icon: string }> = {
  room_gear: { label: 'Room & Gear', icon: '🎛️' },
  staff_client: { label: 'Staff & Artists', icon: '👥' },
  genre_setup: { label: 'Genre Recipes', icon: '🎵' },
};

export const SynergyEncyclopedia: React.FC<SynergyEncyclopediaProps> = ({
  gameState,
  className = '',
}) => {
  const { settings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<SynergyCategory | 'all'>('all');

  const playClick = () => {
    if (settings.sfxEnabled) {
      gameAudio.playUISound('buttonClick');
    }
  };

  const discoveredSet = useMemo(
    () => new Set(gameState.discoveredSynergies || []),
    [gameState.discoveredSynergies]
  );

  const totalCount = STUDIO_SYNERGIES.length;
  const discoveredCount = useMemo(
    () => STUDIO_SYNERGIES.filter(s => discoveredSet.has(s.id)).length,
    [discoveredSet]
  );
  const discoveryPercent = Math.round((discoveredCount / totalCount) * 100);

  const filteredSynergies = useMemo(() => {
    if (selectedCategory === 'all') return STUDIO_SYNERGIES;
    return STUDIO_SYNERGIES.filter(s => s.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header & Discovery Progress Bar */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h3 className="text-sm font-bold text-amber-200 tracking-wide font-display">
                Studio Recipe Codex
              </h3>
              <p className="text-[11px] text-stone-400">
                Discover matching rooms, gear, staff, and genres for session boosts.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-black text-amber-300">
              {discoveredCount} / {totalCount}
            </div>
            <div className="text-[10px] text-amber-500/80 font-bold">{discoveryPercent}% Unlocked</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/50 border border-white/10">
          <div
            className="h-full bg-amber-400 transition-all duration-500 rounded-full"
            style={{ width: `${discoveryPercent}%` }}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => {
            playClick();
            setSelectedCategory('all');
          }}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
            selectedCategory === 'all'
              ? 'bg-amber-400/[0.16] ring-1 ring-inset ring-amber-400/50 text-amber-100 scale-102'
              : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700/60'
          }`}
        >
          All ({totalCount})
        </button>
        {(['room_gear', 'staff_client', 'genre_setup'] as SynergyCategory[]).map(cat => {
          const info = CATEGORY_LABELS[cat];
          const countInCat = STUDIO_SYNERGIES.filter(s => s.category === cat).length;
          const discoveredInCat = STUDIO_SYNERGIES.filter(s => s.category === cat && discoveredSet.has(s.id)).length;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                playClick();
                setSelectedCategory(cat);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1 transition-all ${
                isSelected
                  ? 'bg-amber-400/[0.16] ring-1 ring-inset ring-amber-400/50 text-amber-100 scale-102'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700/60'
              }`}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <span className={`text-[10px] ml-0.5 ${isSelected ? 'text-stone-900 font-extrabold' : 'text-stone-400'}`}>
                {discoveredInCat}/{countInCat}
              </span>
            </button>
          );
        })}
      </div>

      {/* Synergy Cards List */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filteredSynergies.map(synergy => {
          const isDiscovered = discoveredSet.has(synergy.id);
          const catInfo = CATEGORY_LABELS[synergy.category];

          if (isDiscovered) {
            const bonusBadges: string[] = [];
            if (synergy.bonuses.creativityMultiplier) {
              bonusBadges.push(`+${Math.round((synergy.bonuses.creativityMultiplier - 1) * 100)}% C-Points`);
            }
            if (synergy.bonuses.technicalMultiplier) {
              bonusBadges.push(`+${Math.round((synergy.bonuses.technicalMultiplier - 1) * 100)}% T-Points`);
            }
            if (synergy.bonuses.workUnitSpeedMultiplier) {
              bonusBadges.push(`+${Math.round((synergy.bonuses.workUnitSpeedMultiplier - 1) * 100)}% Speed`);
            }
            if (synergy.bonuses.reviewQualityBonus) {
              bonusBadges.push(`+${synergy.bonuses.reviewQualityBonus} Quality`);
            }
            if (synergy.bonuses.staffXpMultiplier) {
              bonusBadges.push(`+${Math.round((synergy.bonuses.staffXpMultiplier - 1) * 100)}% Staff XP`);
            }

            return (
              <div
                key={synergy.id}
                className="rounded-lg border border-amber-500/40 bg-stone-900/70 p-2.5 shadow-sm transition-all hover:border-amber-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                      {synergy.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-200">{synergy.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-medium">
                          {catInfo.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium">{synergy.tagline}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    ✓ Discovered
                  </span>
                </div>

                <p className="text-[11px] text-stone-300 mt-2 leading-relaxed">{synergy.description}</p>

                {bonusBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-stone-800">
                    {bonusBadges.map((badge, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-200 border border-amber-500/30"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Undiscovered Card: Kairosoft silhouette teaser
          return (
            <div
              key={synergy.id}
              className="rounded-lg border border-stone-800 bg-stone-950/60 p-2.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg p-1 rounded-md bg-stone-900 border border-stone-800 text-stone-500">
                    🔒
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-400 tracking-wider">???</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-800/80 text-stone-400">
                        {catInfo.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500">Undiscovered Recipe</div>
                  </div>
                </div>
              </div>

              <div className="mt-2 p-1.5 rounded bg-black/40 border border-stone-800/80 text-[10px] text-amber-300/80 flex items-start gap-1.5">
                <span className="shrink-0">💡</span>
                <span className="italic">{synergy.hint}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
