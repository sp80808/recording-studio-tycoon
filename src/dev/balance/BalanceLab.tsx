/**
 * Balance Lab (#57): development-only panel for tuning the economy simulation. Plain controls, no extra dependency.
 * It edits an in-memory override object on top of the typed BalanceConfig, runs the real headless sweep, and exports
 * overrides and results. It never writes source files: a developer promotes accepted values in a normal commit.
 */
import React, { useMemo, useState } from 'react';
import { SCENARIOS } from './config';
import { runScenarioSweep, sweepToCsv, type SweepResult } from './sweep';
import {
  TUNABLES, baselineValue, diffAgainstBaseline, resetGroup, setOverride, toConfigOverrides,
  type Overrides, type TunableGroup,
} from './tunables';

const GROUPS: TunableGroup[] = ['Economy', 'Enquiries', 'Sessions', 'Outcomes'];
const download = (name: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const BalanceLab: React.FC = () => {
  const [scenario, setScenario] = useState('early');
  const [seeds, setSeeds] = useState(100);
  const [days, setDays] = useState(30);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [result, setResult] = useState<SweepResult | null>(null);
  const [running, setRunning] = useState(false);
  const diff = useMemo(() => diffAgainstBaseline(overrides), [overrides]);

  const run = () => {
    setRunning(true);
    // Yield once so the "Running" state paints before the synchronous sweep (1,000 seeds takes a couple of seconds).
    window.setTimeout(() => {
      setResult(runScenarioSweep({ scenario, seeds, days, config: toConfigOverrides(overrides) }));
      setRunning(false);
    }, 20);
  };

  return (
    <div data-testid="balance-lab" className="fixed inset-y-0 right-0 z-[200] w-[min(30rem,100vw)] overflow-y-auto border-l border-stone-600 bg-stone-950/95 p-4 text-xs text-stone-200 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold">Balance Lab <span className="font-normal text-stone-500">(dev only)</span></h2>
        <button type="button" className="rounded border border-stone-600 px-2 py-1" onClick={() => { const u = new URL(window.location.href); u.searchParams.delete('balanceLab'); window.location.href = u.toString(); }}>Close</button>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <label className="col-span-3">Scenario
          <select data-testid="lab-scenario" className="mt-1 w-full rounded bg-stone-900 p-1" value={scenario} onChange={(e) => setScenario(e.target.value)}>
            {Object.keys(SCENARIOS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Seeds
          <select className="mt-1 w-full rounded bg-stone-900 p-1" value={seeds} onChange={(e) => setSeeds(Number(e.target.value))}>
            <option value={20}>20</option><option value={100}>100</option><option value={1000}>1,000</option>
          </select>
        </label>
        <label>Days
          <input type="number" min={5} max={200} className="mt-1 w-full rounded bg-stone-900 p-1" value={days} onChange={(e) => setDays(Math.max(5, Math.min(200, Number(e.target.value) || 30)))} />
        </label>
        <button data-testid="lab-run" type="button" disabled={running} className="mt-4 rounded bg-amber-500 px-2 py-1 font-bold text-stone-950 disabled:opacity-50" onClick={run}>{running ? 'Running…' : 'Run sweep'}</button>
      </div>

      {GROUPS.map((g) => (
        <fieldset key={g} className="mb-3 rounded border border-stone-700 p-2">
          <legend className="px-1 font-semibold">{g}
            <button type="button" className="ml-2 text-stone-400 underline" onClick={() => setOverrides((o) => resetGroup(o, g))}>reset group</button>
          </legend>
          {TUNABLES.filter((t) => t.group === g).map((t) => {
            const value = overrides[t.path] ?? baselineValue(t.path);
            return (
              <label key={t.path} className="mb-2 block" title={t.why}>
                <span className="flex justify-between"><span>{t.label}</span><span className={t.path in overrides ? 'text-amber-300' : 'text-stone-400'}>{value}</span></span>
                <input data-testid={`lab-${t.path}`} type="range" min={t.min} max={t.max} step={t.step} value={value} className="w-full"
                  onChange={(e) => setOverrides((o) => setOverride(o, t.path, Number(e.target.value)))} />
                <span className="text-stone-500">{t.why}</span>
              </label>
            );
          })}
        </fieldset>
      ))}

      <div className="mb-3 flex flex-wrap gap-2">
        <button type="button" className="rounded border border-stone-600 px-2 py-1" onClick={() => navigator.clipboard?.writeText(JSON.stringify(overrides, null, 2))}>Copy overrides as JSON</button>
        <button type="button" className="rounded border border-stone-600 px-2 py-1" onClick={() => setOverrides({})}>Reset all to baseline</button>
        <button type="button" disabled={!result} className="rounded border border-stone-600 px-2 py-1 disabled:opacity-40" onClick={() => result && download('sweep.json', JSON.stringify({ overrides, result }, null, 2), 'application/json')}>Export sweep JSON</button>
        <button type="button" disabled={!result} className="rounded border border-stone-600 px-2 py-1 disabled:opacity-40" onClick={() => result && download('sweep.csv', sweepToCsv(result), 'text/csv')}>Export sweep CSV</button>
      </div>

      <div data-testid="lab-diff" className="mb-3">
        <p className="font-semibold">Diff against baseline</p>
        {diff.length === 0 ? <p className="text-stone-500">No overrides: this is the repository config.</p>
          : <ul>{diff.map((d) => <li key={d.path}>{d.label}: {d.baseline} → <span className="text-amber-300">{d.value}</span></li>)}</ul>}
      </div>

      {result && (
        <div data-testid="lab-result">
          <p className="font-semibold">{result.scenario}: {result.seeds} seeds × {result.days} days</p>
          <table className="w-full text-left">
            <thead><tr className="text-stone-400"><th>Strategy</th><th>Bankrupt</th><th>Median cash</th><th>Income/day</th><th>Quality</th><th>Rep</th><th>1st upgrade</th></tr></thead>
            <tbody>
              {result.stats.map((s) => (
                <tr key={s.strategy}><td>{s.strategy}</td><td>{Math.round(s.bankruptcyRate * 100)}%</td><td>{s.medianCash}</td><td>{Math.round(s.meanDailyIncome)}</td><td>{s.meanQuality}</td><td>{s.meanReputation}</td><td>{s.meanFirstUpgradeDay ?? 'never'}</td></tr>
              ))}
            </tbody>
          </table>
          {result.flags.length > 0 && <ul className="mt-2 text-amber-300">{result.flags.map((f, i) => <li key={i}>{f.kind} ({f.strategy}): {f.value} vs limit {f.limit}</li>)}</ul>}
        </div>
      )}
    </div>
  );
};

export default BalanceLab;
