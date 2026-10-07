import React from 'react';
import { Award, GraduationCap, Lock } from 'lucide-react';
import { tc, useContentLocale } from '@/i18n/content';
import { CODEX_COMPLETE_XP, codexLineId, codexNameId, codexProgress, deriveCodex, isCodexRewardClaimed } from '@/rpg/conceptCodex';
import type { StudioKnowHow } from '@/rpg/studioKnowHow';

/** Career page "Things you've learned" (#306): concepts met through play, one plain line each. */
export function ConceptCodexPanel({ knowHow }: { knowHow?: StudioKnowHow }) {
  useContentLocale();
  const entries = deriveCodex(knowHow);
  const { met, total } = codexProgress(knowHow);
  return (
    <section className="rst-surface m-1 mt-3 p-3 text-xs" aria-label={tc('codex.title', "Things you've learned")} data-testid="concept-codex">
      <header className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-stone-100">
          <GraduationCap size={15} aria-hidden="true" />{tc('codex.title', "Things you've learned")}
        </h3>
        <span className="font-bold text-cyan-300" data-testid="codex-progress">{met}/{total}</span>
      </header>
      {met === 0 && <p className="mt-1 text-stone-400">{tc('codex.empty', 'Nothing here yet. Concepts are filled in as you meet them in sessions, minigames and gear.')}</p>}
      {isCodexRewardClaimed(knowHow) && (
        <p className="mt-2 flex items-center gap-1.5 text-amber-300" data-testid="codex-badge">
          <Award size={13} aria-hidden="true" />
          <span className="font-semibold">{tc('codex.badge.name', 'Good Ears')}</span>
          <span className="text-stone-400">{tc('codex.badge.line', 'Every concept met. Earned {{xp}} XP, once.', { xp: CODEX_COMPLETE_XP })}</span>
        </p>
      )}
      <ul className="mt-2 space-y-1.5">
        {entries.map(e => e.met && e.concept ? (
          <li key={e.id} data-codex-met="true">
            <span className="text-stone-100">{tc(codexNameId(e.id), e.concept.name)}</span>
            <span className="block text-stone-400">{tc(codexLineId(e.id), e.concept.line)}</span>
          </li>
        ) : (
          <li key={e.id} className="flex items-center gap-1.5 text-stone-500" data-codex-met="false">
            <Lock size={11} aria-hidden="true" />{tc('codex.locked', 'Not met yet')}
          </li>
        ))}
      </ul>
    </section>
  );
}
