import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { tc } from '@/i18n/content';

// Define a basic props interface for minigame components
export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

const BANDS = ['60Hz', '250Hz', '1kHz', '8kHz'];
const MIN_DB = -12;
const MAX_DB = 12;
// Max per-band distance is 24 (-12..+12), so max total over 4 bands is 96.
const MAX_TOTAL_DISTANCE = (MAX_DB - MIN_DB) * BANDS.length;

export const EQMatchGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [targets, setTargets] = useState<number[]>([]);
  const [values, setValues] = useState<number[]>([0, 0, 0, 0]);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for the game
  const [gameOver, setGameOver] = useState(false);

  // Generate hidden integer targets -12..+12 dB per band on mount
  useEffect(() => {
    setTargets(BANDS.map(() => Math.floor(Math.random() * 25) + MIN_DB));
  }, []);

  // Game timer — on timeout show the final score; do NOT auto-call onComplete
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      setGameOver(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  const totalDistance =
    targets.length === BANDS.length
      ? targets.reduce((sum, t, i) => sum + Math.abs(t - values[i]), 0)
      : 0;
  const matchPercent = Math.max(0, 100 - (totalDistance / MAX_TOTAL_DISTANCE) * 100);
  const score = Math.round(matchPercent * 10); // 0-1000
  const isGoodMatch = matchPercent >= 75;

  const adjustBand = (index: number, delta: number) => {
    if (gameOver) return;
    setValues((prev) => {
      const next = [...prev];
      next[index] = Math.min(MAX_DB, Math.max(MIN_DB, next[index] + delta));
      return next;
    });
  };

  const handleFinalize = () => {
    setGameOver(true);
    onComplete(score, score >= 600);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome title={tc('mg.EQMatchGame.title', '🎚️ EQ Match Challenge')} score={score} timeLeft={timeLeft} accent="blue">
      <CardContent>

        {/* Live match meter */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-stone-300 mb-1">
            <span>{tc('mg.EQMatchGame.match_meter', 'Match Meter')}</span>
            <span className={`font-mono ${matchPercent >= 90 ? 'mg-combo-pulse text-[var(--rst-brass-300)]' : ''}`}>{matchPercent.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-stone-700 rounded overflow-hidden">
            <div
              className={`h-full bg-[var(--rst-live)] transition-all duration-150 ${isGoodMatch ? 'mg-meter-glow' : ''}`}
              style={{ width: `${matchPercent}%` }}
            />
          </div>
        </div>

        {/* EQ bands */}
        <div className="space-y-4 bg-stone-700 rounded p-4">
          {BANDS.map((band, i) => (
            <div key={band} className="flex items-center gap-3">
              <span className="w-16 text-sm font-mono text-stone-200">{band}</span>
              <Button
                onClick={() => adjustBand(i, -1)}
                disabled={gameOver}
                variant="outline"
                className="w-9 text-stone-300 border-stone-600 hover:bg-stone-600 mg-hit-flash active:scale-95"
              >
                -
              </Button>
              <input
                type="range"
                min={MIN_DB}
                max={MAX_DB}
                step={1}
                value={values[i]}
                disabled={gameOver}
                onChange={(e) => {
                  if (gameOver) return;
                  const v = parseInt(e.target.value, 10);
                  setValues((prev) => {
                    const next = [...prev];
                    next[i] = v;
                    return next;
                  });
                }}
                className="flex-1 accent-green-500"
                aria-label={tc('mg.EQMatchGame.band_gain', '{{band}} gain', { band })}
              />
              <Button
                onClick={() => adjustBand(i, 1)}
                disabled={gameOver}
                variant="outline"
                className="w-9 text-stone-300 border-stone-600 hover:bg-stone-600 mg-hit-flash active:scale-95"
              >
                +
              </Button>
              <span className="w-20 text-right text-sm font-mono text-stone-200">
                {values[i] > 0 ? `+${values[i]}` : values[i]} dB
              </span>
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="mt-4 text-center">
            <div
              key={score}
              className={`text-2xl font-bold text-green-400 ${score >= 600 ? 'mg-perfect-pop' : 'mg-miss-shake'}`}
            >
              {tc('mg.EQMatchGame.times_up', "Time's Up! Final Score: {{score}}", { score })}
            </div>
            {targets.length === BANDS.length && (
              <div className="mt-2 text-sm text-stone-300">
                {tc('mg.EQMatchGame.hidden_targets', 'Hidden targets were:')}{' '}
                {BANDS.map((b, i) => (
                  <span key={b} className="font-mono mx-1">
                    {b}: {targets[i] > 0 ? `+${targets[i]}` : targets[i]}dB
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
      </MinigameChrome>
      <DialogFooter className="p-4">
        <KenneyButton variant="yellow" onClick={onClose}>
          {tc('mg.EQMatchGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton variant="yellow" onClick={handleFinalize}>
          {tc('mg.EQMatchGame.finalize', 'Finalize & Get Score')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
