import { useState } from 'react';
import { Award, BookOpen, Check, ChevronDown, Circle } from 'lucide-react';
import type { GameState } from '@/types/game';
import {
  FOCUS_INFO,
  SEASON_LENGTH_DAYS,
  STUDIO_FOCUSES,
  currentAwardStanding,
  currentObjectives,
  ensureSeasons,
  seasonDaysLeft,
  yearOfSeason,
  type StudioFocus,
} from '@/rpg/studioSeasons';
import { formatNumber } from '@/i18n/formatLocale';

interface SeasonPanelProps {
  gameState: GameState;
  onChooseFocus?: (focus: StudioFocus) => void;
}

const STATUS_LABEL = { winner: 'On track to win', nominated: 'Nominated', not_nominated: 'Not nominated' } as const;

/** Compact Studio Seasons surface: focus choice, causal objective progress, award criteria, yearbook. */
export function SeasonPanel({ gameState, onChooseFocus }: SeasonPanelProps) {
  const [showYear, setShowYear] = useState(false);
  const [focusExpanded, setFocusExpanded] = useState(false);
  const state = ensureSeasons(gameState);
  const seasons = state.studioSeasons!;
  const objectives = currentObjectives(state);
  const daysLeft = seasonDaysLeft(seasons, state.currentDay);
  const standing = currentAwardStanding(state);

  return (
    <section aria-label="Studio season" className="rst-surface space-y-3 p-4 text-stone-100" data-testid="season-panel">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <p className="rst-kicker">Season {seasons.seasonNumber} · Year {yearOfSeason(seasons.seasonNumber)}</p>
          <h3 className="rst-title text-lg">
            {seasons.focus ? `${FOCUS_INFO[seasons.focus].name} season` : 'Which direction matters this month?'}
          </h3>
        </div>
        <span className="text-[11px] tabular-nums text-stone-400">
          {daysLeft} of {SEASON_LENGTH_DAYS} days left
        </span>
      </header>

      {seasons.focus && (
        <button type="button" className="rst-btn flex w-full !min-h-11 items-center justify-between !px-3 text-left"
          aria-expanded={focusExpanded} onClick={() => setFocusExpanded(v => !v)}>
          <span className="flex items-center gap-2 text-xs"><Award size={15} className="text-[var(--rst-brass-300)]" aria-hidden="true" />
            {objectives.filter(o => o.done).length}/{objectives.length} season goals complete · Change focus
          </span>
          <ChevronDown size={15} className={`motion-safe:transition-transform ${focusExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}
      {(!seasons.focus || focusExpanded) && (
        <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Season focus">
        {STUDIO_FOCUSES.map(f => (
          <button
            key={f}
            type="button"
            aria-pressed={seasons.focus === f}
            onClick={() => onChooseFocus?.(f)}
            className={`rst-btn !min-h-9 !flex-col !items-start !px-3 !py-2 text-left ${seasons.focus === f ? 'rst-btn-primary' : ''}`}
          >
            <span className="text-xs font-semibold">{FOCUS_INFO[f].name}</span>
            <span className="text-[10px] font-normal opacity-80">{FOCUS_INFO[f].tagline}</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-stone-400">
        Other play styles stay fully viable. Skipping a focus costs nothing, and switching keeps everything you have delivered this season.
      </p>

      {objectives.length > 0 && (
        <ul className="space-y-2" aria-label="Season objectives">
          {objectives.map(o => (
            <li key={o.id} className="text-xs">
              <p className="flex items-center gap-1.5 font-semibold">
                {o.done ? <Check size={13} className="text-[var(--rst-live)]" aria-hidden="true" /> : <Circle size={13} aria-hidden="true" />}
                <span className="flex-1">{o.label}</span>
                <span className="tabular-nums">{o.current}/{o.target}</span>
              </p>
              <p className="ml-5 text-[11px] text-stone-400">{o.reason}</p>
            </li>
          ))}
        </ul>
      )}

        </div>
      )}
      <button type="button" className="rst-btn !min-h-11 !px-3 !text-xs" onClick={() => setShowYear(v => !v)} aria-expanded={showYear}>
        <Award size={13} aria-hidden="true" />
        Studio Awards and yearbook
      </button>

      {showYear && (
        <div className="space-y-3 text-xs" data-testid="season-year">
          <div>
            <p className="rst-kicker mb-1">Annual awards, judged at the end of year {yearOfSeason(seasons.seasonNumber)}</p>
            <ul className="space-y-1.5">
              {standing.map(a => (
                <li key={a.id}>
                  <p className="font-semibold">{a.name}: <span className="font-normal text-stone-300">{STATUS_LABEL[a.status]}</span></p>
                  <p className="text-[11px] text-stone-400">{a.criteria}</p>
                  <p className="text-[11px] text-stone-300">{a.why}</p>
                </li>
              ))}
            </ul>
          </div>
          {seasons.titles.length > 0 && (
            <p className="text-[11px] text-stone-300">Plaques: {seasons.titles.join(' · ')}</p>
          )}
          <div>
            <p className="rst-kicker mb-1 flex items-center gap-1"><BookOpen size={12} aria-hidden="true" />Yearbook</p>
            {seasons.history.length === 0 ? (
              <p className="text-[11px] text-stone-400">Finished seasons will be recorded here.</p>
            ) : (
              <ul className="space-y-1">
                {[...seasons.history].reverse().map(r => (
                  <li key={r.seasonId} className="text-[11px] text-stone-300">
                    {r.seasonId} · {r.chosenFocus === 'none' ? 'No focus' : FOCUS_INFO[r.chosenFocus].name} · {r.completedObjectives.length} objective
                    {r.completedObjectives.length === 1 ? '' : 's'} · ${formatNumber(r.endingCash)}
                    {r.awards.length ? ` · ${r.awards.length} award${r.awards.length === 1 ? '' : 's'}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
