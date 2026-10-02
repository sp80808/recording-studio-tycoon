import React from 'react';
import type { GameState, Project } from '@/types/game';
import {
  evaluateRider,
  getProjectRider,
  type RiderItemKind,
} from '@/rpg/studioRider';
import { hasActiveChoreBuff } from '@/simulation/choreEngine';

const KIND_MARK: Record<RiderItemKind, string> = {
  beer: '·',
  snacks: '·',
  gear: '⚙',
  hospitality: '·',
};

interface RiderPanelProps {
  project: Project;
  state: GameState;
  /** Compact booking card vs session prep. */
  mode?: 'booking' | 'session';
}

/**
 * Diegetic rider strip for booking / session prep — readable checklist, not a form.
 */
export const RiderPanel: React.FC<RiderPanelProps> = ({ project, state, mode = 'booking' }) => {
  const rider = getProjectRider(project);
  if (!rider) return null;

  const brewReady =
    state.choreState?.chores.brew_espresso?.completed === true ||
    hasActiveChoreBuff(state.choreState, 'vibe_boost');
  const evaluation = evaluateRider(rider, state.ownedEquipment ?? [], {
    brewReady,
    sessionLive: mode === 'session' || Boolean(project.bookingRoomId),
  });
  const missingIds = new Set(evaluation.missingRequired.map((i) => i.id));

  return (
    <div
      className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5 text-xs"
      data-testid="rider-panel"
      data-rider-id={rider.id}
      data-rider-met={evaluation.met ? 'true' : 'false'}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="rst-kicker !text-[10px]">Rider · {rider.title}</span>
        {mode === 'session' && (
          <span className={`rst-chip ${evaluation.met ? 'rst-chip-money' : 'rst-chip-danger'} whitespace-nowrap`}>
            {evaluation.met ? 'Met' : 'Short'}
          </span>
        )}
      </div>
      <p className="mb-1.5 text-[11px] italic leading-relaxed text-[var(--rst-ivory-soft)]">{rider.blurb}</p>
      <ul className="space-y-0.5 text-stone-300">
        {rider.items.map((item) => {
          const short = missingIds.has(item.id);
          return (
            <li key={item.id} className={short ? 'text-rose-300/90' : undefined}>
              <span aria-hidden="true">{KIND_MARK[item.kind]} </span>
              {item.label}
              {item.required && short ? ' — missing' : ''}
            </li>
          );
        })}
      </ul>
      {mode === 'session' && evaluation.warnings[0] && (
        <p className="mt-1.5 text-[11px] text-amber-200/90">{evaluation.warnings[0]}</p>
      )}
    </div>
  );
};

export default RiderPanel;
