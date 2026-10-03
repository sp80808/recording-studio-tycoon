import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  MAX_REPLAYS,
  createChainRecall,
  giveUp,
  requestReplay,
  scoreChainRecall,
  startInput,
  tapPad,
  type ChainRecallState,
} from '@/minigames/chainRecall';
import { playPadTone } from '@/minigames/chainTones';
import { tc } from '@/i18n/content';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  difficulty?: 1 | 2 | 3;
}

const STEP_MS = 650;

export const ChainRecallGame: React.FC<Props> = ({ onComplete, difficulty = 2 }) => {
  const [state, setState] = useState<ChainRecallState>(() => createChainRecall(Date.now(), difficulty));
  const [started, setStarted] = useState(false);
  const [lit, setLit] = useState<string | null>(null);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const timers = useRef<number[]>([]);
  const result = useMemo(() => scoreChainRecall(state), [state]);
  const noteOf = (id: string) => state.rack.find((r) => r.id === id)?.note ?? 'C4';

  // Play the chain whenever the phase returns to "show", then hand control back to the player.
  useEffect(() => {
    if (!started || state.phase !== 'show') return;
    const clear = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
    clear();
    const lead = 450;
    for (let i = 0; i < state.shown; i++) {
      const id = state.sequence[i];
      timers.current.push(window.setTimeout(() => { setLit(id); void playPadTone(noteOf(id)); }, lead + i * STEP_MS));
      timers.current.push(window.setTimeout(() => setLit(null), lead + i * STEP_MS + STEP_MS * 0.6));
    }
    timers.current.push(window.setTimeout(() => setState((s) => startInput(s)), lead + state.shown * STEP_MS));
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, state.phase, state.shown, state.strikes, state.replays]);

  const press = (id: string) => {
    if (state.phase !== 'input') return;
    void playPadTone(noteOf(id));
    const next = tapPad(state, id);
    setFlash(next.strikes > state.strikes ? 'bad' : 'ok');
    window.setTimeout(() => setFlash(null), 180);
    setState(next);
  };

  const done = state.phase === 'done';
  const status = !started ? tc('mg.ChainRecallGame.status_ready', 'Ready when you are.') : state.phase === 'show' ? tc('mg.ChainRecallGame.status_watch', 'Watch the chain…') : state.phase === 'input' ? tc('mg.ChainRecallGame.status_turn', 'Your turn: {{i}}/{{n}}', { i: state.inputIndex, n: state.shown }) : '';

  return (
    <MinigameChrome title={tc('mg.ChainRecallGame.title', 'Signal Chain Recall')} subtitle={tc(`mg.ChainRecallGame.theme_${state.theme.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`, state.theme)} score={done ? result.total : undefined} accent="blue">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs text-stone-300">
            {tc('mg.ChainRecallGame.instructions', 'The rack lights up a signal path, in order. Then it goes dark: tap it back. Each pad has its own pitch.')}{' '}
            {tc('mg.ChainRecallGame.strikes', 'Strikes:')} <b>{state.strikes}/{state.maxStrikes}</b> · {tc('mg.ChainRecallGame.round_n', 'Round {{n}}/{{total}}', { n: Math.min(state.roundsCleared + 1, state.totalRounds), total: state.totalRounds })}
          </p>
          <div className="text-center text-xs font-semibold text-amber-300" aria-live="polite">{status}</div>
          <div className={`grid grid-cols-3 gap-2 rounded-lg border p-3 ${flash === 'bad' ? 'border-red-500' : 'border-stone-700'} bg-stone-950/60`}>
            {state.rack.map((piece) => (
              <button
                key={piece.id}
                type="button"
                disabled={state.phase !== 'input'}
                onClick={() => press(piece.id)}
                className={`rounded-md border px-2 py-4 text-xs font-bold transition-colors ${
                  lit === piece.id
                    ? 'border-amber-300 bg-amber-400 text-stone-900 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : 'border-stone-600 bg-stone-800 text-stone-200 hover:bg-stone-700 disabled:hover:bg-stone-800'
                }`}
              >
                {tc(`mg.ChainRecallGame.piece_${piece.id.replace(/-/g, '_')}`, piece.label)}
              </button>
            ))}
          </div>
          {done && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-center text-xs text-stone-200">
              <h4 className={`mb-1 font-bold ${state.won ? 'text-emerald-300' : 'text-amber-300'}`}>
                {state.won ? tc('mg.ChainRecallGame.won', 'Chain locked in') : tc('mg.ChainRecallGame.lost', 'Signal lost')}
              </h4>
              {result.tips.join(' ') || tc('mg.ChainRecallGame.result_clean', 'Every stage recalled without a slip.')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {!started ? (
          <KenneyButton onClick={() => setStarted(true)} variant="green">{tc('mg.ChainRecallGame.start', 'Start')}</KenneyButton>
        ) : !done ? (
          <>
            <KenneyButton onClick={() => setState(requestReplay)} variant="blue">{tc('mg.ChainRecallGame.replay_n', 'Replay ({{n}})', { n: MAX_REPLAYS - state.replays })}</KenneyButton>
            <KenneyButton onClick={() => setState(giveUp)} variant="red">{tc('mg.ChainRecallGame.give_up', 'Give up')}</KenneyButton>
          </>
        ) : (
          <KenneyButton onClick={() => onComplete(result.total, state.won)} variant="green">{tc('mg.ChainRecallGame.done', 'Done')}</KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
