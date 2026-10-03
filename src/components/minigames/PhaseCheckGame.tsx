import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  IN_PHASE,
  ROUNDS,
  agreesWithReference,
  commitKit,
  createPhaseCheck,
  currentKit,
  fullness,
  listen,
  scorePhaseCheck,
  toggleFlip,
  type PhaseChannel,
  type PhaseState,
} from '@/minigames/phaseCheck';
import { tc } from '@/i18n/content';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  difficulty?: 1 | 2 | 3;
}

/** A kick-drum thump drawn up or down. Only shown for mics you have listened to. */
const Wave: React.FC<{ down: boolean }> = ({ down }) => (
  <svg viewBox="0 0 60 24" className="h-6 w-14" aria-hidden="true">
    <path d={down ? 'M0 12h8l4 10 6-18 6 14 4-6h32' : 'M0 12h8l4-10 6 18 6-14 4 6h32'} fill="none" stroke={down ? '#f87171' : '#4ade80'} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const ChannelRow: React.FC<{
  channel: PhaseChannel;
  index: number;
  agrees: boolean | null;
  canListen: boolean;
  locked: boolean;
  onFlip: () => void;
  onListen: () => void;
}> = ({ channel, index, agrees, canListen, locked, onFlip, onListen }) => (
  <li className="flex min-h-[48px] items-center gap-2 rounded-md border border-stone-600 bg-stone-800 px-2 py-1.5 text-xs text-stone-200">
    <span className="flex-1 font-bold">{tc(`mg.PhaseCheckGame.channel_${channel.id}`, channel.label)}{index === 0 && <span className="ml-1 font-normal text-stone-400">{tc('mg.PhaseCheckGame.reference', '(reference)')}</span>}</span>
    {agrees !== null && (
      <span className="flex items-center gap-1" data-testid="phase-heard">
        <Wave down={!agrees} />
        <span className={agrees ? 'text-emerald-300' : 'text-red-300'}>{agrees ? tc('mg.PhaseCheckGame.agrees', 'agrees') : tc('mg.PhaseCheckGame.opposes', 'opposes')}</span>
      </span>
    )}
    {index > 0 && !channel.heard && (
      <button type="button" disabled={!canListen || locked} onClick={onListen} className="min-h-[40px] rounded border border-stone-500 px-2 text-[11px] disabled:opacity-40">
        {tc('mg.PhaseCheckGame.listen', 'Listen')}
      </button>
    )}
    <button
      type="button"
      aria-pressed={channel.flipped}
      aria-label={tc('mg.PhaseCheckGame.flip_polarity_on', 'Flip polarity on {{label}}', { label: tc(`mg.PhaseCheckGame.channel_${channel.id}`, channel.label) })}
      disabled={locked}
      onClick={onFlip}
      className={`min-h-[40px] min-w-[44px] rounded border text-sm font-black ${channel.flipped ? 'border-amber-300 bg-amber-400 text-stone-900' : 'border-stone-500 text-stone-200'}`}
    >
      Ø
    </button>
  </li>
);

export const PhaseCheckGame: React.FC<Props> = ({ onComplete, difficulty = 2 }) => {
  const [state, setState] = useState<PhaseState>(() => createPhaseCheck(Date.now(), difficulty));
  const kit = currentKit(state);
  const full = fullness(kit);
  const inPhase = full >= IN_PHASE;
  const done = state.phase === 'done';
  const result = useMemo(() => scorePhaseCheck(state), [state]);

  return (
    <MinigameChrome title={tc('mg.PhaseCheckGame.title', 'Phase Check')} subtitle={done ? tc('mg.PhaseCheckGame.session_printed', 'Session printed') : tc('mg.PhaseCheckGame.kit_n', 'Kit {{n}}/{{total}}', { n: state.roundIndex + 1, total: ROUNDS })} score={done ? result.total : undefined} accent="blue">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          {!done && (
            <>
              <p className="text-xs text-stone-300">
                {tc('mg.PhaseCheckGame.instructions', 'Some mics came in polarity-inverted and the drums sound thin. Flip Ø until the mono sum is full. Listen shows whether a mic agrees with the reference ({{left}} left).', { left: kit.listensLeft })}
              </p>
              <div aria-live="polite">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-200">{tc('mg.PhaseCheckGame.mono_sum', 'Mono sum')}</span>
                  <span className={inPhase ? 'font-bold text-emerald-300' : 'text-amber-300'}>{inPhase ? tc('mg.PhaseCheckGame.in_phase', 'In phase') : tc('mg.PhaseCheckGame.percent_full', '{{pct}}% full', { pct: Math.round(full * 100) })}</span>
                </div>
                <div className="relative mt-1 h-3 overflow-hidden rounded bg-stone-800" role="meter" aria-label={tc('mg.PhaseCheckGame.mono_sum_fullness', 'Mono sum fullness')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(full * 100)}>
                  <div className={`h-full transition-[width] duration-200 ${inPhase ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${Math.round(full * 100)}%` }} />
                  <div className="absolute inset-y-0 w-0.5 bg-stone-100/70" style={{ left: `${IN_PHASE * 100}%` }} />
                </div>
              </div>
              <ul className="space-y-2">
                {kit.channels.map((c, i) => (
                  <ChannelRow
                    key={c.id}
                    channel={c}
                    index={i}
                    agrees={agreesWithReference(kit, c.id)}
                    canListen={kit.listensLeft > 0}
                    locked={kit.committed}
                    onFlip={() => setState((s) => toggleFlip(s, c.id))}
                    onListen={() => setState((s) => listen(s, c.id))}
                  />
                ))}
              </ul>
            </>
          )}
          {done && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-center text-xs text-stone-200">
              <h4 className={`mb-1 font-bold ${result.inPhaseKits === ROUNDS ? 'text-emerald-300' : 'text-amber-300'}`}>
                {result.inPhaseKits === ROUNDS ? tc('mg.PhaseCheckGame.every_kit_in_phase', 'Every kit in phase') : tc('mg.PhaseCheckGame.kits_in_phase', '{{n}}/{{total}} kits in phase', { n: result.inPhaseKits, total: ROUNDS })}
              </h4>
              {result.tips.join(' ') || tc('mg.PhaseCheckGame.all_good', 'Tight, punchy and full. The low end is back.')}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {done ? (
          <KenneyButton onClick={() => onComplete(result.total, result.inPhaseKits >= 2)} variant="green">{tc('mg.PhaseCheckGame.done', 'Done')}</KenneyButton>
        ) : (
          <KenneyButton onClick={() => setState((s) => commitKit(s))} variant={inPhase ? 'green' : 'blue'}>
            {state.roundIndex === ROUNDS - 1 ? tc('mg.PhaseCheckGame.print_last_kit', 'Print the last kit') : tc('mg.PhaseCheckGame.print_this_kit', 'Print this kit')}
          </KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
