import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  CLIP_DB,
  GAIN_MAX,
  GAIN_MIN,
  NOISE_FLOOR_DB,
  ROUNDS,
  STAGE_LABELS,
  STEP_DB,
  TARGET_MAX,
  TARGET_MIN,
  adjustGain,
  commitTake,
  createGainStaging,
  currentTake,
  play,
  scoreGainStaging,
  type GainState,
} from '@/minigames/gainStaging';

interface Props {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  difficulty?: 1 | 2 | 3;
}

const METER_MIN = -60;
const pct = (db: number) => Math.max(0, Math.min(100, ((db - METER_MIN) / (0 - METER_MIN)) * 100));

const Meter: React.FC<{ label: string; peak: number | null; target?: boolean }> = ({ label, peak, target }) => (
  <div>
    <div className="flex items-center justify-between text-[11px] text-stone-300">
      <span>{label}</span>
      <span data-testid="gain-peak">{peak === null ? 'press Play' : `${peak > 0 ? '+' : ''}${peak} dBFS`}</span>
    </div>
    <div className="relative mt-0.5 h-3 overflow-hidden rounded bg-stone-800" role="meter" aria-label={`${label} peak`} aria-valuemin={METER_MIN} aria-valuemax={0} aria-valuenow={peak ?? METER_MIN}>
      {peak !== null && <div className={`h-full ${peak > CLIP_DB ? 'bg-red-500' : target && peak >= TARGET_MIN && peak <= TARGET_MAX ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${pct(peak)}%` }} />}
      {target && <div className="absolute inset-y-0 bg-emerald-300/25" style={{ left: `${pct(TARGET_MIN)}%`, width: `${pct(TARGET_MAX) - pct(TARGET_MIN)}%` }} />}
      <div className="absolute inset-y-0 w-px bg-stone-100/50" style={{ left: `${pct(NOISE_FLOOR_DB)}%` }} />
    </div>
  </div>
);

export const GainStagingGame: React.FC<Props> = ({ onComplete, difficulty = 2 }) => {
  const [state, setState] = useState<GainState>(() => createGainStaging(Date.now(), difficulty));
  const take = currentTake(state);
  const done = state.phase === 'done';
  const result = useMemo(() => scoreGainStaging(state), [state]);

  return (
    <MinigameChrome title="Gain Staging" subtitle={done ? 'Levels set' : `Take ${state.roundIndex + 1}/${ROUNDS}`} score={done ? result.total : undefined} accent="blue">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          {!done && (
            <>
              <p className="text-xs text-stone-300">
                The source level is unknown. Set the preamp, fader and bus so nothing clips, the preamp clears the noise floor (thin line) and the print lands in the green window.
                Play shows the peaks for your current settings ({take.playsLeft} left); the readings go stale when you move a knob.
              </p>
              <ul className="space-y-2">
                {STAGE_LABELS.map((label, i) => (
                  <li key={label} className="rounded-md border border-stone-600 bg-stone-800 p-2">
                    <div className="flex items-center gap-2 text-xs text-stone-200">
                      <span className="flex-1 font-bold">{label}</span>
                      <button type="button" aria-label={`Lower ${label} gain`} disabled={take.gains[i] <= GAIN_MIN} onClick={() => setState((s) => adjustGain(s, i, -STEP_DB))} className="min-h-[40px] min-w-[44px] rounded border border-stone-500 text-lg disabled:opacity-40">−</button>
                      <span className="w-14 text-center font-bold" data-testid="gain-value">{take.gains[i] > 0 ? '+' : ''}{take.gains[i]} dB</span>
                      <button type="button" aria-label={`Raise ${label} gain`} disabled={take.gains[i] >= GAIN_MAX} onClick={() => setState((s) => adjustGain(s, i, STEP_DB))} className="min-h-[40px] min-w-[44px] rounded border border-stone-500 text-lg disabled:opacity-40">+</button>
                    </div>
                    <div className="mt-1.5">
                      <Meter label="Peak after this stage" peak={take.reading ? take.reading[i] : null} target={i === 2} />
                    </div>
                  </li>
                ))}
              </ul>
              {take.reading && (
                <p className="text-[11px] text-amber-200" role="status">
                  {take.reading[2] > TARGET_MAX ? 'Hot overall: pull a stage back.' : take.reading[2] < TARGET_MIN ? 'Too quiet: add gain, preamp first.' : 'Print level is in the window.'}
                  {take.reading.some((p) => p > CLIP_DB) ? ' A stage is clipping.' : ''}
                </p>
              )}
            </>
          )}
          {done && (
            <div className="rounded-lg border border-stone-600 bg-stone-900/70 p-3 text-center text-xs text-stone-200">
              <h4 className={`mb-1 font-bold ${result.cleanTakes === ROUNDS ? 'text-emerald-300' : 'text-amber-300'}`}>
                {result.cleanTakes === ROUNDS ? 'Every take clean' : `${result.cleanTakes}/${ROUNDS} takes clean`}
              </h4>
              {result.tips.join(' ') || 'Healthy headroom and a clean floor. The take will mix beautifully.'}
            </div>
          )}
        </CardContent>
      </Card>
      <DialogFooter className="gap-2 p-4 pt-0">
        {done ? (
          <KenneyButton onClick={() => onComplete(result.total, result.cleanTakes >= 2)} variant="green">Done</KenneyButton>
        ) : (
          <>
            <KenneyButton onClick={() => setState((s) => play(s))} variant="grey" disabled={take.playsLeft <= 0}>Play ({take.playsLeft})</KenneyButton>
            <KenneyButton onClick={() => setState((s) => commitTake(s))} variant="blue">
              {state.roundIndex === ROUNDS - 1 ? 'Print the last take' : 'Print this take'}
            </KenneyButton>
          </>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
