import React from 'react';
import { StudioSynergy } from '@/types/synergy';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SynergyBadgeListProps {
  synergies: StudioSynergy[];
  className?: string;
  size?: 'sm' | 'md';
}

export const SynergyBadgeList: React.FC<SynergyBadgeListProps> = ({
  synergies,
  className = '',
  size = 'md',
}) => {
  if (!synergies || synergies.length === 0) return null;

  const isSmall = size === 'sm';

  return (
    <TooltipProvider delayDuration={150}>
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {synergies.map(synergy => {
          const bonusParts: string[] = [];
          if (synergy.bonuses.creativityMultiplier) {
            bonusParts.push(`+${Math.round((synergy.bonuses.creativityMultiplier - 1) * 100)}% C-Points`);
          }
          if (synergy.bonuses.technicalMultiplier) {
            bonusParts.push(`+${Math.round((synergy.bonuses.technicalMultiplier - 1) * 100)}% T-Points`);
          }
          if (synergy.bonuses.workUnitSpeedMultiplier) {
            bonusParts.push(`+${Math.round((synergy.bonuses.workUnitSpeedMultiplier - 1) * 100)}% Speed`);
          }
          if (synergy.bonuses.reviewQualityBonus) {
            bonusParts.push(`+${synergy.bonuses.reviewQualityBonus} Quality`);
          }
          if (synergy.bonuses.staffXpMultiplier) {
            bonusParts.push(`+${Math.round((synergy.bonuses.staffXpMultiplier - 1) * 100)}% Staff XP`);
          }

          return (
            <Tooltip key={synergy.id}>
              <TooltipTrigger asChild>
                <div
                  className={`inline-flex items-center gap-1 font-semibold rounded-full border border-amber-400/50 bg-amber-500/15 text-amber-300 shadow-sm cursor-help hover:border-amber-300 hover:scale-105 transition-all ${
                    isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
                  }`}
                >
                  <span className="text-xs">{synergy.icon}</span>
                  <span className="tracking-wide">{synergy.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-xs p-2.5 bg-stone-950/95 border border-amber-500/40 text-stone-100 shadow-xl rounded-lg"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                  <span>{synergy.icon}</span>
                  <span>{synergy.name}</span>
                  <span className="text-[10px] text-amber-500/80 font-normal">Active Synergy</span>
                </div>
                <div className="text-[11px] text-stone-300 mt-1">{synergy.description}</div>
                {bonusParts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-stone-800">
                    {bonusParts.map((b, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-200 border border-amber-500/30"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
