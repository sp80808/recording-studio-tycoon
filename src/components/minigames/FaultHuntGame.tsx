import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  FAULT_DIFFICULTY,
  FAULT_LABELS,
  createFaultHunt,
  finish,
  probe,
  scoreFaultHunt,
  toggleFlag,
  type FaultHuntState,
} from '@/minigames/faultHunt';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  difficulty?: 1 | 2 | 3;
  /** Free clues from engineer skill / gear condition. */
  freeClues?: number;
}

const CLUE_COLOUR = ['text-stone-500', 'text-emerald-300', 'text-amber-300', 'text-orange-400', 'text-red-400'];

export const FaultHuntGame: React.FC<Props> = ({ onComplete, difficulty = 1, freeClues = 1 }) => {
  const [state, setState] = useState<FaultHuntState>(() => createFaultHunt(Date.now(), { difficulty, freeClues }));
  const [flagMode, setFlagMode] = useState(false);
  const maxProbes = FAULT_DIFFICULTY[difficulty].probes;
  const result = useMemo(() => scoreFaultHunt(state, maxProbes), [state, maxProbes]);
  const flags = state.cells.filter((c) => c.flagged).length;

  const press = (i: number) => setState((s) => (flagMode ? toggleFlag(s, i) : probe(s, i)));

  return (
    <MinigameChrome title="Patchbay Panic" subtitle="Find the faulty jacks" score={state.finished ? result.total : undefined} accent="red">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs text-stone-300">
            Probe a jack to read how many of its 8 neighbours are faulty. Probing a bad jack trips it, so flag the ones you
            are sure about instead. Probes: <b>{state.probesLeft}</b> · Flags: <b>{flags}/{state.faultCount}</b>
          </p>
          <div className="mx-auto grid max-w-xs gap-1" style={{ gridTemplateColumns: `repeat(${state.size}, minmax(0, 1fr))` }}>
            {state.cells.map((cell, i) => {
              const revealed = cell.status !== 'hidden';
              const showFault = state.finished && cell.fault && !revealed;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={state.finished || revealed}
                  onClick={() => press(i)}
                  aria-label={revealed ? (cell.fault ? FAULT_LABELS[cell.fault] : `${cell.adjacent} faulty neighbours`) : cell.flagged ? 'Flagged jack' : 'Unprobed jack'}
                  className={`aspect-square rounded-md border font-mono text-sm font-bold ${
                    cell.status === 'tripped'
                      ? 'border-red-500 bg-red-950 text-red-300'
                      : revealed
                        ? `border-stone-700 bg-stone-800 ${CLUE_COLOUR[Math.min(cell.adjacent, 4)]}`
                        : showFault
                          ? 'border-amber-500/60 bg-stone-900 text-amber-300'
                          : 'border-stone-500 bg-stone-700 text-stone-100 hover:bg-stone-600'
                  }`}
                >
                  {cell.status === 'tripped' ? '⚡' : revealed ? (cell.adjacent || '') : cell.flagged ? '⚑' : showFault ? '!' : '○'}
                </button>
              );
            })}
          </div>
          {state.finished && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-xs text-stone-200">
              <h4 className="mb-1 font-bold text-amber-300">
                {result.found}/{state.faultCount} faults located
              </h4>
              <ul className="mb-1 grid grid-cols-2 gap-x-3 text-[11px] text-stone-400">
                {state.cells.filter((c) => c.fault).map((c, i) => (
                  <li key={i}>{FAULT_LABELS[c.fault!]}{c.flagged || c.status === 'tripped' ? ' ✓' : ' ✗'}</li>
                ))}
              </ul>
              {result.tips.join(' ') || 'Clean diagnosis. The session can start.'}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {!state.finished ? (
          <>
            <KenneyButton onClick={() => setFlagMode((m) => !m)} variant={flagMode ? 'yellow' : 'blue'}>
              {flagMode ? 'Flagging ⚑' : 'Probing ○'}
            </KenneyButton>
            <KenneyButton onClick={() => setState(finish)} variant="green">File report</KenneyButton>
          </>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, result.total >= 500)} variant="green">Done</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
