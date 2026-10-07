import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Users, DoorOpen, Zap } from 'lucide-react';
import type { GameState, Project } from '@/types/game';
import { buildIdleConsoleSummary } from '@/rpg/idleConsole';
import { money } from '@/utils/displayMoney';

interface IdleConsoleProps {
  gameState: GameState;
  onBook?: (project: Project) => void;
  onOpenBookings?: () => void;
  onResume?: (project: Project) => void;
}

/** Compact "nothing on the desk" console: next bookable work, last result and studio readiness. */
export const IdleConsole: React.FC<IdleConsoleProps> = ({ gameState, onBook, onOpenBookings, onResume }) => {
  const { t } = useTranslation();
  const s = useMemo(() => buildIdleConsoleSummary(gameState), [gameState]);
  const chips = [
    { Icon: Zap, label: t('idle_console_energy', { count: s.energy }) },
    { Icon: Users, label: s.crew.total === 0 ? t('idle_console_crew_none') : t('idle_console_crew', { ready: s.crew.ready, total: s.crew.total }) },
    { Icon: DoorOpen, label: t('idle_console_rooms', { count: s.roomsReady }) },
  ];
  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-0.5 animate-fade-in" data-testid="idle-console">
      <div className="flex flex-wrap gap-1.5" aria-label={t('idle_console_status')}>
        {chips.map(({ Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1 rounded border border-stone-700 bg-stone-900/70 px-2 py-1 text-[11px] text-stone-300">
            <Icon size={12} aria-hidden="true" />{label}
          </span>
        ))}
        {s.crew.tired > 0 && <span className="inline-flex items-center rounded border border-amber-700/70 bg-stone-900/70 px-2 py-1 text-[11px] text-amber-300">{t('idle_console_crew_tired', { count: s.crew.tired })}</span>}
      </div>

      {s.waiting.length > 0 && (
        <section className="space-y-1.5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{t('idle_console_waiting')}</h4>
          {s.waiting.slice(0, 2).map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded border border-stone-700 bg-stone-950/60 p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                <p className="truncate text-[11px] text-stone-400">{t('idle_console_stage', { done: p.completedStages.length, total: p.stages.length })}</p>
              </div>
              <button type="button" className="rst-btn rst-btn-primary !min-h-8 !px-3 !text-xs" onClick={() => onResume?.(p)}>{t('idle_console_resume')}</button>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-1.5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {t('idle_console_enquiries', { count: s.enquiryCount })}
        </h4>
        {s.enquiries.length === 0 ? (
          <p className="text-sm text-stone-400">{t('idle_console_no_enquiries')}</p>
        ) : s.enquiries.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded border border-stone-700 bg-stone-950/60 p-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{p.title}</p>
              <p className="truncate text-[11px] text-stone-400">{p.clientName ?? p.clientType} · {p.genre} · <span className="text-green-400">{money(p.payoutBase)}</span> · {t('idle_console_days', { count: p.durationDaysTotal })}</p>
            </div>
            <button type="button" className="rst-btn rst-btn-primary !min-h-9 !px-3 !text-xs" onClick={() => onBook?.(p)}>{t('idle_console_book')}</button>
          </div>
        ))}
      </section>

      {s.lastRelease && (
        <section className="rounded border border-stone-800 bg-stone-950/40 p-2 text-[12px] text-stone-300">
          <span className="font-semibold text-stone-400">{t('idle_console_last')}</span>{' '}
          {t('idle_console_last_body', { title: s.lastRelease.title, band: t(`idle_console_band_${s.lastRelease.outcomeBand}`), quality: Math.round(s.lastRelease.qualityScore) })}
        </section>
      )}

      <button type="button" className="rst-btn w-full !min-h-10 !text-sm" onClick={onOpenBookings}>
        <Phone size={14} aria-hidden="true" /> {t('idle_console_all_enquiries')}
      </button>
    </div>
  );
};
