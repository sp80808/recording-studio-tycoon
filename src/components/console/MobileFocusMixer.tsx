import { StatIcon } from '@/components/icons/GameIcons';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { FocusAllocation } from '@/types/game';

import { GamepadGlyph } from '@/components/ui/GamepadGlyph';
import type { ControllerType } from '@/types/gamepad';

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
  selectedChannel?: Channel;
  onSelectChannel?: (key: Channel) => void;
  gamepadActive?: boolean;
  controllerType?: ControllerType;
}

// Tall portrait phones get console-style vertical channel strips that fill the panel;
// short/landscape viewports keep compact horizontal rows.
const TALL_QUERY = '(min-height: 600px) and (orientation: portrait)';
const useTallPhone = (): boolean => {
  const read = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(TALL_QUERY).matches;
  const [tall, setTall] = useState<boolean>(read);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(TALL_QUERY);
    const on = () => setTall(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, []);
  return tall;
};

const CHANNELS: Channel[] = ['performance', 'soundCapture', 'layering'];

// Status lives on the value chip only; every fader shares one neutral style so the
// three rows read as a matched set (#295). The target band is drawn on the track.
const tone = (diff: number) =>
  diff <= 10
    ? { chip: 'bg-emerald-950 text-emerald-400 border-emerald-500/40' }
    : diff <= 25
      ? { chip: 'bg-amber-950 text-amber-400 border-amber-500/40' }
      : { chip: 'bg-rose-950 text-rose-400 border-rose-500/40' };

export const MobileFocusMixer: React.FC<MobileFocusMixerProps> = ({
  focus, optimal, labels, matchPct, guidanceTitle, guidance, canAutoAlign, onChange, onAutoAlign,
  selectedChannel = 'performance', onSelectChannel, gamepadActive = false, controllerType,
}) => {
  const { t: tr } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);
  const tall = useTallPhone();
  return (
    <div className={`rst-mobile-mixer relative bg-stone-900/90 border border-stone-800 rounded-[2px] p-1.5 ${tall ? 'flex-1 min-h-0 flex flex-col' : ''}`} data-testid="mobile-focus-mixer">
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
          className={`ml-auto h-6 px-2 text-[10px] rounded border flex items-center gap-1 ${
            canAutoAlign
              ? 'bg-violet-900/40 border-violet-500/50 text-violet-200'
              : 'bg-stone-800/40 border-stone-700 text-stone-500 cursor-not-allowed'
          }`}
        >
          {gamepadActive && <GamepadGlyph button="north" controllerType={controllerType} size="xs" />}
          <StatIcon name="goal" /> {tr('active_auto_align')}
        </button>
      </div>
      {showGuide && (
        <div className="absolute left-1 right-1 top-8 z-30 rounded-[2px] border border-stone-600 bg-stone-950 p-2 text-[11px] text-stone-300 shadow-2xl" role="note">
          <span className="text-amber-300"><StatIcon name="bulb" /> </span><span className="font-medium">{guidanceTitle}:</span> {guidance}
        </div>
      )}
      {tall ? (
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-2" data-testid="mobile-focus-strips">
          {CHANNELS.map((key, idx) => {
            const diff = Math.abs(focus[key] - optimal[key]);
            const t = tone(diff);
            const isSelected = selectedChannel === key;
            const lo = Math.max(0, optimal[key] - 10);
            const hi = Math.min(100, optimal[key] + 10);
            return (
              <div
                key={key}
                onClick={() => onSelectChannel?.(key)}
                data-focus-channel={key}
                className={`min-h-0 flex flex-col items-center gap-1.5 rounded border px-1 py-2 transition-colors ${
                  diff <= 10 ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-stone-800 bg-stone-950/60'
                } ${isSelected && gamepadActive ? 'ring-1 ring-amber-400/60' : ''}`}
              >
                <span className="flex min-h-[2.2em] items-center gap-1 text-center text-[11px] font-semibold leading-tight text-stone-200" title={stripLead(labels[key].label)}>
                  {gamepadActive && idx === 0 && <GamepadGlyph button="lb" controllerType={controllerType} size="xs" />}
                  <span className="min-w-0 break-words">{stripLead(labels[key].label)}</span>
                  {gamepadActive && idx === 2 && <GamepadGlyph button="rb" controllerType={controllerType} size="xs" />}
                </span>
                <span className={`min-w-[52px] text-center text-xs font-mono font-bold rounded border px-1 py-0.5 ${t.chip}`} title={tr('active_target_title', { min: lo, max: hi })}>
                  {focus[key]}%{diff <= 10 ? <StatIcon name="check" size="0.9em" /> : null}
                </span>
                <div className="relative flex-1 min-h-[120px] w-12 flex justify-center">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 w-5 -translate-x-1/2 rounded-full bg-emerald-400/25 ring-1 ring-emerald-400/40"
                    style={{ bottom: `${lo}%`, height: `${hi - lo}%` }}
                  />
                  <Slider
                    orientation="vertical"
                    value={[focus[key]]}
                    onValueChange={(v) => onChange(key, v[0])}
                    max={100}
                    step={5}
                    aria-label={tr('active_focus_aria', { name: stripLead(labels[key].label) })}
                    className="rst-mixer-slider h-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="space-y-1.5">
        {CHANNELS.map((key, idx) => {
          const diff = Math.abs(focus[key] - optimal[key]);
          const t = tone(diff);
          const isSelected = selectedChannel === key;
          return (
            <div
              key={key}
              onClick={() => onSelectChannel?.(key)}
              className={`flex items-center gap-2 px-1 py-0.5 min-h-8 [@media(min-height:500px)]:min-h-11 rounded transition-all cursor-pointer ${
                isSelected && gamepadActive
                  ? 'bg-amber-950/40 ring-1 ring-amber-400/60 border border-amber-400/40'
                  : ''
              }`}
              data-focus-channel={key}
            >
              <span className="w-[84px] shrink-0 text-[11px] leading-tight font-semibold text-stone-200 flex items-center gap-1" title={stripLead(labels[key].label)}>
                {gamepadActive && (
                  <span className="shrink-0">
                    {idx === 0 && <GamepadGlyph button="lb" controllerType={controllerType} size="xs" />}
                    {idx === 2 && <GamepadGlyph button="rb" controllerType={controllerType} size="xs" />}
                  </span>
                )}
                <span className="min-w-0 break-words">{stripLead(labels[key].label)}</span>
              </span>
              <div className="flex-1 flex items-center gap-1">
                {gamepadActive && isSelected && (
                  <GamepadGlyph button="dpadLeft" controllerType={controllerType} size="xs" />
                )}
                <div className="relative flex-1 flex items-center">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-emerald-400/25 ring-1 ring-emerald-400/40"
                  style={{ left: `${Math.max(0, optimal[key] - 10)}%`, width: `${Math.min(100, optimal[key] + 10) - Math.max(0, optimal[key] - 10)}%` }}
                />
                <Slider
                  value={[focus[key]]}
                  onValueChange={(v) => onChange(key, v[0])}
                  max={100}
                  step={5}
                  aria-label={tr('active_focus_aria', { name: stripLead(labels[key].label) })}
                  className="rst-mixer-slider flex-1"
                />
                </div>
                {gamepadActive && isSelected && (
                  <GamepadGlyph button="dpadRight" controllerType={controllerType} size="xs" />
                )}
              </div>
              <span className={`w-[50px] shrink-0 text-center text-[10px] font-mono font-bold rounded border ${t.chip}`} title={tr('active_target_title', { min: Math.max(0, optimal[key] - 10), max: Math.min(100, optimal[key] + 10) })}>
                {focus[key]}%{diff <= 10 ? <StatIcon name="check" size="0.9em" /> : null}
              </span>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
