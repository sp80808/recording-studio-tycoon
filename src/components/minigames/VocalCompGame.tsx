import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import {
  MOOD_LABEL,
  buildCompSession,
  scoreComp,
  traitChips,
  type CompChip,
  type CompTake,
} from '@/minigames/vocalComp';

interface VocalCompGameProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
}

const CHIP_CLASS: Record<CompChip['tone'], string> = {
  good: 'border-emerald-500/50 text-emerald-300',
  warn: 'border-amber-500/50 text-amber-300',
  bad: 'border-red-500/50 text-red-300',
};

const Wave: React.FC<{ take: CompTake; active: boolean }> = ({ take, active }) => (
  <svg viewBox={`0 0 ${take.wave.length * 6} 40`} className="h-10 w-full" aria-hidden="true">
    {take.wave.map((h, i) => (
      <rect
        key={i}
        x={i * 6 + 1}
        y={20 - h * 19}
        width={4}
        height={h * 38}
        rx={2}
        className={active ? 'fill-amber-400' : 'fill-stone-500'}
      />
    ))}
  </svg>
);

export const VocalCompGame: React.FC<VocalCompGameProps> = ({ onComplete }) => {
  const session = useMemo(() => buildCompSession(Date.now()), []);
  const [picks, setPicks] = useState<(number | null)[]>(() => session.lines.map(() => null));
  const [activeLine, setActiveLine] = useState(0);
  const [finished, setFinished] = useState(false);

  const pickedCount = picks.filter((p) => p !== null).length;
  const allPicked = pickedCount === session.lines.length;
  const result = useMemo(
    () => (finished ? scoreComp(session, picks.map((p) => p ?? 0)) : null),
    [finished, session, picks]
  );

  const choose = useCallback(
    (lineIndex: number, takeIndex: number) => {
      if (finished) return;
      setPicks((prev) => prev.map((p, i) => (i === lineIndex ? takeIndex : p)));
      setActiveLine(Math.min(session.lines.length - 1, lineIndex + 1));
    },
    [finished, session.lines.length]
  );

  // 1/2/3 pick a take for the highlighted line.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= session.lines[activeLine].takes.length) choose(activeLine, n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeLine, choose, session.lines]);

  const liveScore = allPicked ? scoreComp(session, picks.map((p) => p ?? 0)).total : 0;

  return (
    <MinigameChrome title="Comp Session" score={finished && result ? result.total : liveScore} accent="purple">
      <Card className="border-0 bg-transparent">
        <CardContent className="space-y-3 p-4">
          <p className="text-xs text-stone-300">
            The singer did three takes. Pick the best one for each line (keys 1 to 3). Bright, steady waves are a good
            sign, and the line&apos;s mood matters: a hushed verse wants feeling, a big chorus wants tightness. Fewer
            hops between takes sounds more natural.
          </p>

          <div className="space-y-2">
            {session.lines.map((line, lineIndex) => (
              <div
                key={lineIndex}
                onClick={() => setActiveLine(lineIndex)}
                className={`rounded-lg border p-2 ${
                  activeLine === lineIndex && !finished ? 'border-amber-400/70' : 'border-stone-700'
                } bg-stone-900/60`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-stone-100">&ldquo;{line.lyric}&rdquo;</span>
                  <span className="shrink-0 rounded-full border border-stone-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-stone-300">
                    {MOOD_LABEL[line.mood]}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {line.takes.map((take, takeIndex) => {
                    const selected = picks[lineIndex] === takeIndex;
                    const isBest = finished && result && result.lineScores[lineIndex] === result.bestLineScores[lineIndex] && selected;
                    return (
                      <button
                        key={take.number}
                        type="button"
                        disabled={finished}
                        onClick={(e) => {
                          e.stopPropagation();
                          choose(lineIndex, takeIndex);
                        }}
                        className={`rounded-md border p-1.5 text-left transition-colors ${
                          selected ? 'border-amber-400 bg-amber-400/10' : 'border-stone-700 hover:border-stone-500'
                        }`}
                        aria-pressed={selected}
                        aria-label={`Take ${take.number} for line ${lineIndex + 1}`}
                      >
                        <div className="mb-0.5 flex items-center justify-between text-[10px] font-mono text-stone-400">
                          <span>TAKE {take.number}</span>
                          {isBest && <span className="text-emerald-300">BEST</span>}
                        </div>
                        <Wave take={take} active={selected} />
                        <div className="mt-1 flex flex-wrap gap-1">
                          {traitChips(take).map((chip) => (
                            <span
                              key={chip.label}
                              className={`rounded-full border px-1.5 py-0 text-[9px] ${CHIP_CLASS[chip.tone]}`}
                            >
                              {chip.label}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {finished && result && (
            <div className="rounded-lg border border-emerald-500/50 bg-emerald-950/60 p-3 text-center">
              <h4 className="mb-1 font-bold text-emerald-300">Comp bounced</h4>
              <p className="mb-1 text-xs text-stone-200">{result.verdict}</p>
              <p className="text-[11px] text-stone-400">
                {result.switches} hop{result.switches === 1 ? '' : 's'} between takes, +{result.continuityBonus} for flow
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogFooter className="p-4 pt-0">
        {!finished ? (
          <KenneyButton onClick={() => setFinished(true)} disabled={!allPicked} variant="green">
            Bounce the comp ({pickedCount}/{session.lines.length})
          </KenneyButton>
        ) : (
          <KenneyButton onClick={() => onComplete(result?.total ?? 0, (result?.total ?? 0) >= 500)} variant="green">
            Send to the label
          </KenneyButton>
        )}
      </DialogFooter>
    </MinigameChrome>
  );
};
