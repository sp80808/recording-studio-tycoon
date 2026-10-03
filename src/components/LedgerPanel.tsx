import { money } from '@/utils/displayMoney';
import { useMemo, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ChevronDown, Landmark } from 'lucide-react';
import type { GameState } from '@/types/game';
import { calculateEquipmentUpkeep } from '@/economy/upkeep';
import { serviceSummary } from '@/rpg/serviceQuote';
import { premisesDailyRent } from '@/rpg/premises';
import { getOriginEffects } from '@/narrative/originPerks';
import {
  CATEGORY_LABELS, getCashFlowForDays, getCostBreakdown, getDailyNetSeries, getGemFlow,
  getCategorySpend, getLedger, getProjectPnl, getRunway, type RunwayBand,
} from '@/economy/ledger';

const fmt = (n: number) => `${n < 0 ? '-' : ''}${money(Math.abs(Math.round(n)))}`;

const BAND_STYLE: Record<RunwayBand, { label: string; cls: string }> = {
  comfortable: { label: 'Comfortable', cls: 'text-[var(--rst-money)]' },
  watch: { label: 'Watch', cls: 'text-[var(--rst-brass-300)]' },
  tight: { label: 'Tight', cls: 'text-orange-300' },
  critical: { label: 'Critical', cls: 'text-red-400' },
};

/** Quiet management view of the studio ledger: cash runway, recent cash flow, margin, top costs. */
export function LedgerPanel({ gameState }: { gameState: GameState }) {
  const [open, setOpen] = useState(false);
  const view = useMemo(() => {
    const payroll = gameState.hiredStaff.reduce((t, s) => t + s.salary, 0);
    const upkeep = calculateEquipmentUpkeep(gameState.ownedEquipment, getOriginEffects(gameState));
    const last = gameState.financials.reports[gameState.financials.reports.length - 1];
    return {
      runway: getRunway(gameState, payroll + upkeep + premisesDailyRent(gameState)),
      week: getCashFlowForDays(gameState, 7),
      month: getCashFlowForDays(gameState, 30),
      costs: getCostBreakdown(gameState, getCashFlowForDays(gameState, 30).range).slice(0, 4),
      series: getDailyNetSeries(gameState, 14),
      gems: getGemFlow(gameState),
      ambient: getCategorySpend(gameState, 'ambient-income', getCashFlowForDays(gameState, 30).range),
      pnl: last && getLedger(gameState).entries.some(e => e.projectId === last.projectId)
        ? { title: last.projectTitle, ...getProjectPnl(gameState, last.projectId) }
        : null,
    };
  }, [gameState]);
  const { runway } = view;
  const band = BAND_STYLE[runway.band];
  const runwayText = Number.isFinite(runway.days) ? `${Math.floor(runway.days)} days` : 'No fixed costs';

  return (
    <div className="rst-surface overflow-hidden text-sm" data-testid="ledger-panel">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full min-h-11 items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.03]"
      >
        <Landmark size={14} className="text-[var(--rst-brass-400)]" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-semibold">Studio books · {fmt(gameState.money)}</span>
        <span className={`shrink-0 tabular-nums font-medium ${band.cls}`}>Runway {runwayText} · {band.label}</span>
        <ChevronDown size={14} className={`shrink-0 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="space-y-3 border-t border-[var(--rst-line)] bg-black/25 p-4 animate-rst-rise">
          <p className="text-stone-400">{runway.explanation}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[['Last 7 days', view.week], ['Last 30 days', view.month]].map(([label, f]) => {
              const flow = f as typeof view.week;
              return (
                <div key={label as string}>
                  <p className="rst-kicker">{label as string}</p>
                  <p className="tabular-nums text-stone-200">
                    <span className="text-[var(--rst-money)]">+{fmt(flow.inflow)}</span>{' '}
                    <span className="text-red-300">-{fmt(flow.outflow)}</span>{' '}
                    <span className="font-semibold">= {fmt(flow.net)}</span>
                  </p>
                </div>
              );
            })}
          </div>
          <div className="h-16" aria-label="Net cash by day, last 14 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={view.series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" hide />
                <Tooltip
                  cursor={false}
                  formatter={(v: number) => fmt(v)}
                  labelFormatter={d => `Day ${d}`}
                  contentStyle={{ background: '#1c1917', border: '1px solid #44403c', fontSize: 12 }}
                />
                <Bar dataKey="net" name="Net" fill="#8df0b8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(() => {
            const use = serviceSummary(gameState);
            return (
              <div data-testid="studio-use">
                <p className="rst-kicker">Studio use</p>
                <p className="text-stone-300 tabular-nums">
                  {Math.round(use.weekUtilization * 100)}% of this week's slots booked · {use.idleDays} idle day{use.idleDays === 1 ? '' : 's'}
                  {use.sessions > 0 && <> · {fmt(use.revenuePerHour)} per booked hour over {use.sessions} session{use.sessions === 1 ? '' : 's'} ({use.bookedHours}h)</>}
                </p>
                {use.topServices.length > 0 && (
                  <p className="text-stone-400">Mostly {use.topServices.map(s => `${s.label.toLowerCase()} (${s.count})`).join(', ')}. Packing every slot is not the aim: crew and gear need rest.</p>
                )}
              </div>
            );
          })()}
          {view.costs.length > 0 && (
            <div>
              <p className="rst-kicker">Biggest costs (30 days)</p>
              <ul className="mt-1 space-y-0.5 text-stone-300">
                {view.costs.map(c => (
                  <li key={c.category} className="flex justify-between tabular-nums">
                    <span>{CATEGORY_LABELS[c.category]}</span><span>{fmt(c.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {view.pnl && (
            <div>
              <p className="rst-kicker">Last session · {view.pnl.title}</p>
              <ul className="mt-1 space-y-0.5 text-stone-300 tabular-nums">
                <li className="flex justify-between"><span>Revenue</span><span>{fmt(view.pnl.revenue)}</span></li>
                <li className="flex justify-between"><span>Staff allocation</span><span>-{fmt(view.pnl.staffAllocation)}</span></li>
                {view.pnl.directCosts > 0 && (
                  <li className="flex justify-between"><span>Direct costs</span><span>-{fmt(view.pnl.directCosts)}</span></li>
                )}
                <li className="flex justify-between"><span>Gear overhead allocation</span><span>-{fmt(view.pnl.overheadAllocation)}</span></li>
                <li className="flex justify-between font-semibold text-stone-100"><span>Contribution</span><span>{fmt(view.pnl.contribution)}</span></li>
              </ul>
            </div>
          )}
          {view.ambient > 0 && (
            <p className="text-stone-400">Ambient earnings (30 days, kept apart from project revenue): {fmt(view.ambient)}.</p>
          )}
          {(view.gems.gained > 0 || view.gems.spent > 0) && (
            <p className="text-stone-400">Gems (in-game only): +{view.gems.gained} earned, -{view.gems.spent} spent.</p>
          )}
        </div>
      )}
    </div>
  );
}
