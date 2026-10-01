import React, { useState } from 'react';
import { AlertTriangle, CircleCheck, Info } from 'lucide-react';
import type { SessionForecast as Forecast } from '@/rpg/sessionForecast';

const riskTone = (risk: 'low' | 'medium' | 'high'): string =>
  risk === 'low' ? 'rst-chip-money' : risk === 'medium' ? 'rst-chip-brass' : 'rst-chip-danger';

const marginLabel = (margin: Forecast['economics']['marginBand']): string =>
  margin === 'poor' ? 'Poor margin' : margin === 'thin' ? 'Thin margin' : margin === 'healthy' ? 'Healthy margin' : 'Strong margin';

/**
 * Bounded, explainable booking forecast (GH #55).
 * Compact by default: quality band + delivery risk + strongest causes.
 * Full causes live behind a "Why?" toggle (max five reasons).
 */
export const SessionForecastView: React.FC<{ forecast: Forecast }> = ({ forecast }) => {
  const [showWhy, setShowWhy] = useState(false);
  const positives = forecast.positives.slice(0, 2);
  const risks = forecast.risks.slice(0, 2);
  const why = [...forecast.positives, ...forecast.risks].slice(0, 5);

  return (
    <div className="rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5" data-testid="session-forecast">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-[var(--rst-ivory)]">
          Expected quality {forecast.quality.likelyMin}–{forecast.quality.likelyMax}
        </span>
        <span className={`rst-chip ${riskTone(forecast.time.lateRisk)} whitespace-nowrap`}>
          Delivery risk: {forecast.time.lateRisk === 'low' ? 'Low' : forecast.time.lateRisk === 'medium' ? 'Medium' : 'High'}
        </span>
        <span className="rst-muted">· {marginLabel(forecast.economics.marginBand)}</span>
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="rst-btn rst-btn-ghost ml-auto !min-h-7 !px-2 !text-[11px]"
          aria-expanded={showWhy}
          title="Show the strongest reasons behind this forecast"
        >
          <Info size={12} aria-hidden="true" />
          Why?
        </button>
      </div>

      <ul className="mt-1.5 space-y-1 text-[11px] leading-relaxed">
        {positives.map((p) => (
          <li key={p.key} className="flex items-start gap-1.5 text-stone-300">
            <CircleCheck size={12} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
            <span>{p.label}</span>
          </li>
        ))}
        {risks.map((r) => (
          <li key={r.key} className="flex items-start gap-1.5 text-stone-300">
            <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span>{r.label}</span>
          </li>
        ))}
      </ul>

      {showWhy && (
        <div className="mt-2 border-t border-[var(--rst-line)] pt-2 text-[11px] text-stone-400">
          <div className="rst-kicker mb-1">Why this forecast</div>
          <ul className="space-y-0.5">
            {why.map((r) => (
              <li key={r.key}>
                {r.label} <span className="rst-muted">· {r.impact} influence</span>
              </li>
            ))}
          </ul>
          <p className="rst-muted mt-1.5">
            Confidence {forecast.quality.confidence} · about {forecast.time.estimatedDays}d in the room · fatigue risk{' '}
            {forecast.fatigueRisk}. A bounded estimate, not a promise.
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionForecastView;
