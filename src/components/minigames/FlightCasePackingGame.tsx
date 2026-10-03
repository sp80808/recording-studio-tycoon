import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  auditCase,
  canPlace,
  cellsOf,
  closeCase,
  createFlightCase,
  footprint,
  itemById,
  placeItem,
  removeItem,
  scoreFlightCase,
  sessionRisk,
  type FlightCaseState,
} from '@/minigames/flightCasePacking';
import { tc } from '@/i18n/content';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  difficulty?: 1 | 2 | 3;
}

export const FlightCasePackingGame: React.FC<Props> = ({ onComplete, difficulty = 1 }) => {
  const [state, setState] = useState<FlightCaseState>(() => createFlightCase(Date.now(), difficulty));
  const [held, setHeld] = useState<string | null>(null);
  const [rotated, setRotated] = useState(false);
  const [hover, setHover] = useState<[number, number] | null>(null);

  const audit = useMemo(() => auditCase(state), [state]);
  const result = useMemo(() => scoreFlightCase(state), [state]);
  const risk = sessionRisk(state);
  const cellOwner = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of state.placed) for (const [x, y] of cellsOf(state, p)) m.set(`${x},${y}`, p.id);
    return m;
  }, [state]);

  const preview = useMemo(() => {
    if (!held || !hover) return null;
    const { w, h } = footprint(itemById(state, held), rotated);
    const valid = canPlace(state, held, hover[0], hover[1], rotated);
    const cells = new Set<string>();
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.add(`${hover[0] + dx},${hover[1] + dy}`);
    return { cells, valid };
  }, [held, hover, rotated, state]);

  const tapCell = (x: number, y: number) => {
    if (state.closed) return;
    const owner = cellOwner.get(`${x},${y}`);
    if (!held && owner) { setHeld(owner); setRotated(state.placed.find((p) => p.id === owner)!.rotated); setState((s) => removeItem(s, owner)); return; }
    if (!held) return;
    const next = placeItem(state, held, x, y, rotated);
    if (next !== state) { setState(next); setHeld(null); setHover(null); }
  };

  const trayIds = state.items.filter((i) => !state.placed.some((p) => p.id === i.id)).map((i) => i.id);
  const flagged = (id: string) => audit.unprotected.includes(id) || audit.crushed.includes(id);

  return (
    <MinigameChrome title={tc('mg.FlightCasePackingGame.title', 'Flight Case Packing')} subtitle={tc(`mg.FlightCasePackingGame.case_${state.caseName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, state.caseName)} score={state.closed ? result.total : undefined} accent="yellow">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs text-stone-300">
            {tc('mg.FlightCasePackingGame.instructions', 'Pick a piece, then tap a square to drop it in (tap packed gear to pick it up again). Fragile gear needs a cable bag or foam touching it; heavy gear must not sit directly above anything expensive.')}
            {' '}{tc('mg.FlightCasePackingGame.session_risk', 'Session risk:')} <b className={risk > 40 ? 'text-red-300' : 'text-emerald-300'}>{risk}</b>
          </p>
          <div
            className="mx-auto grid w-full max-w-[320px] gap-[2px] rounded-lg border-2 border-stone-600 bg-stone-950/80 p-2"
            style={{ gridTemplateColumns: `repeat(${state.cols}, minmax(0, 1fr))` }}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: state.rows * state.cols }, (_, i) => {
              const x = i % state.cols, y = Math.floor(i / state.cols);
              const key = `${x},${y}`;
              const owner = cellOwner.get(key);
              const item = owner ? itemById(state, owner) : null;
              const inPreview = preview?.cells.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={item ? tc('mg.FlightCasePackingGame.item_at', '{{label}} at {{x}},{{y}}', { label: tc(`mg.FlightCasePackingGame.item_${item.id}`, item.label), x: x + 1, y: y + 1 }) : tc('mg.FlightCasePackingGame.empty_slot', 'Empty slot {{x}},{{y}}', { x: x + 1, y: y + 1 })}
                  onClick={() => tapCell(x, y)}
                  onMouseEnter={() => setHover([x, y])}
                  className={`flex aspect-square items-center justify-center rounded-sm border text-base transition-colors ${
                    item
                      ? flagged(item.id)
                        ? 'border-red-400 bg-red-900/60'
                        : item.traits.includes('soft') ? 'border-sky-500 bg-sky-900/50' : 'border-amber-600 bg-stone-700'
                      : inPreview
                        ? preview?.valid ? 'border-emerald-400 bg-emerald-900/50' : 'border-red-400 bg-red-900/40'
                        : 'border-stone-700 bg-stone-900'
                  }`}
                >
                  {item && cellsOf(state, state.placed.find((p) => p.id === item.id)!)[0].join() === key ? item.glyph : ''}
                </button>
              );
            })}
          </div>
          {!state.closed && (
            <div className="flex flex-wrap justify-center gap-2" aria-label={tc('mg.FlightCasePackingGame.gear_on_floor', 'Gear on the floor')}>
              {trayIds.length === 0 && <span className="text-xs text-emerald-300">{tc('mg.FlightCasePackingGame.all_packed', 'Everything is in the case.')}</span>}
              {trayIds.map((id) => {
                const item = itemById(state, id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setHeld(held === id ? null : id); setRotated(false); }}
                    className={`min-h-11 rounded-md border px-2 py-1 text-xs font-bold ${
                      held === id ? 'border-amber-300 bg-amber-400 text-stone-900' : 'border-stone-600 bg-stone-800 text-stone-200'
                    }`}
                  >
                    {item.glyph} {tc(`mg.FlightCasePackingGame.item_${item.id}`, item.label)} <span className="opacity-70">{item.w}×{item.h}</span>
                    {item.traits.includes('fragile') ? ` ·${tc('mg.FlightCasePackingGame.fragile', 'fragile')}` : ''}{item.traits.includes('heavy') ? ` ·${tc('mg.FlightCasePackingGame.heavy', 'heavy')}` : ''}
                  </button>
                );
              })}
            </div>
          )}
          {state.closed && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-center text-xs text-stone-200">
              <h4 className={`mb-1 font-bold ${risk <= 20 ? 'text-emerald-300' : 'text-amber-300'}`}>
                {risk <= 20 ? tc('mg.FlightCasePackingGame.latched_ready', 'Case latched, rig is road-ready') : tc('mg.FlightCasePackingGame.latched_risky', 'Case latched, but the session carries risk')}
              </h4>
              {result.tips.join(' ') || tc('mg.FlightCasePackingGame.all_protected', 'Everything protected and nothing left behind.')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {!state.closed ? (
          <>
            <KenneyButton onClick={() => setRotated((r) => !r)} variant="blue">{tc('mg.FlightCasePackingGame.rotate', 'Rotate')}</KenneyButton>
            <KenneyButton onClick={() => { setHeld(null); setState(closeCase); }} variant="green">{tc('mg.FlightCasePackingGame.latch_case', 'Latch case')}</KenneyButton>
          </>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, risk <= 40)} variant="green">{tc('mg.FlightCasePackingGame.done', 'Done')}</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
