import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { tc, useContentLocale } from '@/i18n/content';
import { gearWhyHint } from '@/rpg/gearWhy';
import type { StudioKnowHow } from '@/rpg/studioKnowHow';

interface GearWhyHintProps {
  gear: { id?: string; name?: string; category?: string };
  ownedCategories: readonly (string | undefined)[];
  knowHow: StudioKnowHow | undefined;
}

/** Quiet, optional "why does a pro reach for this?" tip. Hover, focus or tap; ignoring it costs nothing. */
export const GearWhyHint: React.FC<GearWhyHintProps> = ({ gear, ownedCategories, knowHow }) => {
  useContentLocale();
  const [open, setOpen] = useState(false);
  const hint = gearWhyHint(gear, ownedCategories, knowHow);
  if (!hint) return null;
  const label = tc('gear.why.label', 'Why does a pro reach for this?');
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={label}
            className="gear-why-hint ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-stone-600 text-[10px] text-stone-400 hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            ?
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          <p className="mb-1 font-semibold text-amber-200">{label}</p>
          <p>{tc(hint.id, hint.english)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
