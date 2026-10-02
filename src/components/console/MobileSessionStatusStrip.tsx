import { money } from '@/utils/displayMoney';
import React, { useState } from 'react';
import { ClipboardList, Info } from 'lucide-react';

/**
 * Phone-only presentation of the session header (#141): one compact two-row
 * strip replacing the project summary + progress card stack. Purely
 * presentational; all values come from ActiveProject.
 */
export interface MobileSessionStatusStripProps {
  title: string;
  subtitle: string;
  payout: number;
  difficulty: number;
  stageLabel: string;
  stageProgress: number;
  overallProgress: number;
  energy: number;
  dutiesDone: number;
  dutiesTotal: number;
  creativityPoints: number;
  technicalPoints: number;
  durationDays: number;
  sessions: number;
  activeBuffs: string[];
  synergyCount: number;
  onOpenDuties: () => void;
}

export const MobileSessionStatusStrip: React.FC<MobileSessionStatusStripProps> = (p) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rst-mobile-status relative shrink-0 bg-stone-950/80 border border-stone-800/90 rounded-[2px] px-2 py-1.5 z-20" data-testid="mobile-session-status">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 inline-flex items-center px-1 py-px rounded text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">● REC</span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">
          {p.title}<span className="font-normal text-stone-400"> · {p.subtitle}</span>
        </span>
        <span className="shrink-0 text-[11px] font-semibold text-emerald-400 tabular-nums">{money(Math.round(p.payout))}</span>
        <span className="shrink-0 text-[11px] text-amber-300 tabular-nums">★{p.difficulty}</span>
        <span className="shrink-0 text-[11px] font-bold text-amber-200 tabular-nums" aria-label={`${p.energy} energy left`}>⚡{p.energy}</span>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label="Session details"
          className="shrink-0 grid place-items-center h-6 w-6 rounded border border-stone-700 text-stone-300"
        >
          <Info size={13} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-stone-400">
        <span className="shrink-0 max-w-[34%] truncate text-amber-200 font-semibold">{p.stageLabel}</span>
        <div
          className="relative h-1.5 flex-1 rounded-full bg-stone-800 overflow-hidden"
          role="progressbar"
          aria-label="Current stage progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(p.stageProgress)}
        >
          <div className="absolute inset-y-0 left-0 bg-amber-400 transition-all duration-300" style={{ width: `${Math.min(100, p.stageProgress)}%` }} />
        </div>
        {/* Always mounted: reward orbs / stat blobs (useStageWork, AnimatedStatBlobs) fly to these ids. */}
        <span id="creativity-points" data-creativity-target className="shrink-0 text-amber-300 font-bold tabular-nums" aria-label="Creativity points">🎨{Math.round(p.creativityPoints)}</span>
        <span id="technical-points" data-technical-target className="shrink-0 text-emerald-400 font-bold tabular-nums" aria-label="Technical points">⚙️{Math.round(p.technicalPoints)}</span>
        <span className="shrink-0 tabular-nums" aria-label={`Overall progress ${Math.round(p.overallProgress)} percent`}>{Math.round(p.overallProgress)}%</span>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-[2px] border border-stone-600 bg-stone-950 p-2.5 text-xs text-stone-300 shadow-2xl space-y-1.5" role="region" aria-label="Session details">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{p.durationDays}d duration</span>
            <span>{Math.round(p.sessions)} sessions</span>
          </div>
          {p.activeBuffs.length > 0 && <div className="text-emerald-300">Buffs: {p.activeBuffs.join(' · ')}</div>}
          {p.synergyCount > 0 && <div className="text-amber-300">✨ {p.synergyCount} active combo{p.synergyCount === 1 ? '' : 's'}</div>}
          <button
            type="button"
            onClick={() => { setOpen(false); p.onOpenDuties(); }}
            className="flex items-center gap-1.5 px-2 py-1 bg-amber-950/70 border border-amber-500/40 rounded text-amber-200"
          >
            <ClipboardList size={13} aria-hidden="true" />
            <span>Studio duties</span>
            <span className="text-[10px] font-bold bg-amber-900/60 px-1 rounded">{p.dutiesDone}/{p.dutiesTotal}</span>
          </button>
        </div>
      )}
    </div>
  );
};
