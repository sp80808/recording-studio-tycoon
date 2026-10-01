import React, { useMemo, useState } from 'react';
import type { GameState, Project } from '@/types/game';
import {
  MAX_WHY_REASONS,
  calculateSessionForecast,
  topImprovement,
  whyReasons,
  type ForecastLevel,
  type SessionAssignment,
} from '@/rpg/sessionForecast';

const LEVEL_LABEL: Record<ForecastLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const levelChip = (level: ForecastLevel) => (level === 'low' ? 'rst-chip-money' : level === 'high' ? 'rst-chip-danger' : 'rst-chip-brass');

interface ForecastPanelProps {
  project: Project;
  state: GameState;
  assignment: SessionAssignment;
  onChange: (next: SessionAssignment) => void;
}

/**
 * Compact outcome forecast (#55): a bounded quality range, delivery and
 * fatigue risk, and the two or three strongest causes. Derived on render from
 * visible state only; nothing is stored. Crew and room pickers update it live.
 */
export const ForecastPanel: React.FC<ForecastPanelProps> = ({ project, state, assignment, onChange }) => {
  const [open, setOpen] = useState(false);
  const forecast = useMemo(() => calculateSessionForecast(state, project, assignment), [state, project, assignment]);
  const rooms = (state.studioRooms ?? []).filter((r) => r.unlocked);
  const crew = state.hiredStaff.filter((s) => !s.assignedProjectId);
  const fix = topImprovement(forecast);
  const shown = [
    ...forecast.positives.slice(0, 2).map((r) => ({ r, sign: '+' })),
    ...forecast.risks.slice(0, 1).map((r) => ({ r, sign: '−' })),
  ];

  return (
    <div className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5 text-xs" data-testid="forecast-panel" aria-label="Outcome forecast">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="font-semibold text-[var(--rst-ivory)]" data-testid="forecast-quality">
          Expected quality: {forecast.quality.likelyMin}–{forecast.quality.likelyMax}
          <span className="rst-muted ml-1 font-normal">({forecast.quality.confidence} confidence)</span>
        </span>
        <span className="flex flex-wrap gap-1.5">
          <span className={`rst-chip ${levelChip(forecast.time.lateRisk)} whitespace-nowrap`} data-testid="forecast-delivery">Delivery risk: {LEVEL_LABEL[forecast.time.lateRisk]}</span>
          <span className={`rst-chip ${levelChip(forecast.fatigueRisk)} whitespace-nowrap`}>Fatigue: {LEVEL_LABEL[forecast.fatigueRisk]}</span>
        </span>
      </div>
      <ul className="mt-1.5 space-y-0.5 text-stone-300">
        {shown.map(({ r, sign }) => (
          <li key={r.key} className={sign === '+' ? '' : 'text-amber-300'}>{sign} {r.label}</li>
        ))}
      </ul>
      {fix && forecast.risks.length > 0 && <p className="rst-muted mt-1">Try: {fix}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          <span className="rst-muted">Crew</span>
          <select
            className="rounded border border-[var(--rst-line)] bg-black/40 px-1 py-0.5 text-[11px]"
            aria-label="Crew for forecast"
            value={assignment.staffIds[0] ?? ''}
            onChange={(e) => onChange({ ...assignment, staffIds: e.target.value ? [e.target.value] : [] })}
          >
            <option value="">Just me</option>
            {crew.map((s) => (<option key={s.id} value={s.id}>{s.name} ({Math.round(s.energy)}%)</option>))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span className="rst-muted">Room</span>
          <select
            className="rounded border border-[var(--rst-line)] bg-black/40 px-1 py-0.5 text-[11px]"
            aria-label="Room for forecast"
            value={assignment.roomId ?? ''}
            onChange={(e) => onChange({ ...assignment, roomId: e.target.value || undefined })}
          >
            {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
        </label>
        <button type="button" className="rst-chip cursor-pointer" aria-expanded={open} onClick={() => setOpen((v) => !v)}>Why?</button>
      </div>
      {open && (
        <ul className="mt-2 space-y-0.5 border-t border-[var(--rst-line)] pt-1.5 text-stone-300" data-testid="forecast-why" aria-label={`Up to ${MAX_WHY_REASONS} reasons`}>
          {whyReasons(forecast).map(({ reason, kind }) => (
            <li key={reason.key}>{kind === 'positive' ? '+' : '−'} {reason.label} <span className="rst-muted">({reason.impact})</span></li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ForecastPanel;
