import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  FAULT_DIFFICULTY,
  FAULT_LABELS,
  FAULT_FIELD_NOTES,
  createFaultHunt,
  finish,
  probe,
  scoreFaultHunt,
  toggleFlag,
  type FaultHuntState,
} from '@/minigames/faultHunt';
import { tc } from '@/i18n/content';

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

  const faultLabel = (k: keyof typeof FAULT_LABELS) => tc(`mg.FaultHuntGame.fault_${k.replace(/-/g, '_')}`, FAULT_LABELS[k]);

  const [lastTrip, setLastTrip] = useState<keyof typeof FAULT_LABELS | null>(null);
  const noteFor = (k: keyof typeof FAULT_LABELS) => ({
    symptom: tc(`mg.FaultHuntGame.note_${k.replace(/-/g, '_')}_symptom`, FAULT_FIELD_NOTES[k].symptom),
    fix: tc(`mg.FaultHuntGame.note_${k.replace(/-/g, '_')}_fix`, FAULT_FIELD_NOTES[k].fix),
  });

  const press = (i: number) => {
    if (flagMode) return setState((s) => toggleFlag(s, i));
    const cell = state.cells[i];
    setState((s) => probe(s, i));
    if (cell?.fault && cell.status === 'hidden') setLastTrip(cell.fault);
  };

  return (
    <MinigameChrome title={tc('mg.FaultHuntGame.title', 'Patchbay Panic')} subtitle={tc('mg.FaultHuntGame.subtitle', 'Find the faulty jacks')} score={state.finished ? result.total : undefined} accent="red">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs text-stone-300">
            {tc('mg.FaultHuntGame.instructions', 'Probe a jack to read how many of its 8 neighbours are faulty. Probing a bad jack trips it, so flag the ones you are sure about instead.')}{' '}
            {tc('mg.FaultHuntGame.probes', 'Probes:')} <b>{state.probesLeft}</b> · {tc('mg.FaultHuntGame.flags', 'Flags:')} <b>{flags}/{state.faultCount}</b>
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
                  aria-label={revealed ? (cell.fault ? faultLabel(cell.fault) : tc('mg.FaultHuntGame.faulty_neighbours', '{{n}} faulty neighbours', { n: cell.adjacent })) : cell.flagged ? tc('mg.FaultHuntGame.flagged_jack', 'Flagged jack') : tc('mg.FaultHuntGame.unprobed_jack', 'Unprobed jack')}
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
          {lastTrip && !state.finished && (
            <p className="rounded-md border border-red-500/40 bg-red-950/40 p-2 text-[11px] text-red-200" role="status">
              <b>{faultLabel(lastTrip)}.</b> {noteFor(lastTrip).symptom} {tc('mg.FaultHuntGame.note_fix_prefix', 'Fix:')} {noteFor(lastTrip).fix}
            </p>
          )}
          {state.finished && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-xs text-stone-200">
              <h4 className="mb-1 font-bold text-amber-300">
                {tc('mg.FaultHuntGame.faults_located', '{{found}}/{{total}} faults located', { found: result.found, total: state.faultCount })}
              </h4>
              <ul className="mb-1 space-y-1 text-[11px] text-stone-400">
                {state.cells.filter((c) => c.fault).map((c, i) => (
                  <li key={i}>
                    <b className="text-stone-300">{faultLabel(c.fault!)}{c.flagged || c.status === 'tripped' ? ' ✓' : ' ✗'}</b>{' '}
                    {noteFor(c.fault!).symptom} {tc('mg.FaultHuntGame.note_fix_prefix', 'Fix:')} {noteFor(c.fault!).fix}
                  </li>
                ))}
              </ul>
              {result.tips.join(' ') || tc('mg.FaultHuntGame.result_clean', 'Clean diagnosis. The session can start.')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {!state.finished ? (
          <>
            <KenneyButton onClick={() => setFlagMode((m) => !m)} variant={flagMode ? 'yellow' : 'blue'}>
              {flagMode ? tc('mg.FaultHuntGame.mode_flagging', 'Flagging ⚑') : tc('mg.FaultHuntGame.mode_probing', 'Probing ○')}
            </KenneyButton>
            <KenneyButton onClick={() => setState(finish)} variant="green">{tc('mg.FaultHuntGame.file_report', 'File report')}</KenneyButton>
          </>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, result.total >= 500)} variant="green">{tc('mg.FaultHuntGame.done', 'Done')}</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
