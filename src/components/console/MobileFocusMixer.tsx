import { StatIcon } from '@/components/icons/GameIcons';
import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { FocusAllocation } from '@/types/game';

// Labels carry a leading emoji for other surfaces; drop it here so the row fits.
const stripLead = (l: string) => l.replace(/^[^\p{L}\p{N}]+/u, '');

/**
 * Phone-only focus mixer (#141): three labelled channels in one compact panel,
 * stage guidance behind an info popover, Auto-Align inline. State and handlers
 * stay in ActiveProject; this component only presents them.
 */
type Channel = keyof FocusAllocation;

export interface MobileFocusMixerProps {
  focus: FocusAllocation;
  optimal: FocusAllocation;
  labels: Record<Channel, { label: string }>;
  matchPct: number;
  guidanceTitle: string;
  guidance: string;
  canAutoAlign: boolean;
  onChange: (key: Channel, value: number) => void;
  onAutoAlign: () => void;
}

const CHANNELS: Channel[] = ['performance', 'soundCapture', 'layering'];

const tone = (diff: number) =>
  diff <= 10
    ? { chip: 'bg-emerald-950 text-emerald-400 border-emerald-500/40', slider: 'slider-optimal' }
    : diff <= 25
      ? { chip: 'bg-amber-950 text-amber-400 border-amber-500/40', slider: 'slider-good' }
      : { chip: 'bg-rose-950 text-rose-400 border-rose-500/40', slider: 'slider-default' };

export const MobileFocusMixer: React.FC<MobileFocusMixerProps> = ({
  focus, optimal, labels, matchPct, guidanceTitle, guidance, canAutoAlign, onChange, onAutoAlign,
}) => {
  const { t: tr } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  return (
    <div className="rst-mobile-mixer relative bg-stone-900/90 border border-stone-800 rounded-[2px] p-1.5" data-testid="mobile-focus-mixer">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-300"><StatIcon name="technical" /> {tr('active_focus')}</span>
        <span className="text-[10px] font-bold px-1.5 rounded-full border bg-stone-950 text-amber-300 border-amber-500/40 tabular-nums">{tr('active_match', { pct: matchPct })}</span>
        <button
          type="button"
          onClick={() => setShowGuide(v => !v)}
          aria-expanded={showGuide}
          aria-label={tr('active_stage_guidance')}
          className="grid place-items-center h-6 w-6 rounded border border-stone-700 text-stone-300"
        >
          <Info size={12} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onAutoAlign}
          disabled={!canAutoAlign}
          title={canAutoAlign ? tr('active_auto_align_title') : tr('active_auto_align_locked')}
          className={`ml-auto h-6 px-2 text-[10px] rounded border ${
            canAutoAlign
              ? 'bg-violet-900/40 border-violet-500/50 text-violet-200'
              : 'bg-stone-800/40 border-stone-700 text-stone-500 cursor-not-allowed'
          }`}
        >
          <StatIcon name="goal" /> {tr('active_auto_align')}
        </button>
      </div>
      {showGuide && (
        <div className="absolute left-1 right-1 top-8 z-30 rounded-[2px] border border-stone-600 bg-stone-950 p-2 text-[11px] text-stone-300 shadow-2xl" role="note">
          <span className="text-amber-300"><StatIcon name="bulb" /> </span><span className="font-medium">{guidanceTitle}:</span> {guidance}
        </div>
      )}
      <div className="space-y-1">
        {CHANNELS.map(key => {
          const diff = Math.abs(focus[key] - optimal[key]);
          const t = tone(diff);
          return (
            <div key={key} className="flex items-center gap-2" data-focus-channel={key}>
              <span className="w-[88px] shrink-0 truncate text-[11px] font-semibold text-stone-200" title={stripLead(labels[key].label)}>{stripLead(labels[key].label)}</span>
              <Slider
                value={[focus[key]]}
                onValueChange={(v) => onChange(key, v[0])}
                max={100}
                step={5}
                aria-label={tr('active_focus_aria', { name: stripLead(labels[key].label) })}
                className={`flex-1 ${t.slider}`}
              />
              <span className={`w-[50px] shrink-0 text-center text-[10px] font-mono font-bold rounded border ${t.chip}`} title={tr('active_target_title', { min: Math.max(0, optimal[key] - 10), max: Math.min(100, optimal[key] + 10) })}>
                {focus[key]}%{diff <= 10 ? <StatIcon name="check" size="0.9em" /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
