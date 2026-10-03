import React, { useState, useEffect, useRef } from 'react';
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

const ZONE_LO = 40;
const ZONE_HI = 60;
const CLIP_LEVEL = 95;
const TICK_MS = 200;
const GAME_SECONDS = 30;

export const FaderRideGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS); // 30 seconds for the game
  const [gameOver, setGameOver] = useState(false);
  const [trackLevel, setTrackLevel] = useState(50);
  const [fader, setFader] = useState(50);
  const [output, setOutput] = useState(50);
  const [inZoneTicks, setInZoneTicks] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);
  const [maxOutput, setMaxOutput] = useState(0);

  const faderRef = useRef(50);
  const trackRef = useRef(50);

  // Game timer — on timeout show the final score; do NOT auto-call onComplete
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      setGameOver(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver]);

  // Track level random walk + scoring ticks every 200ms
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      const next = Math.min(100, Math.max(0, trackRef.current + (Math.random() * 10 - 5)));
      trackRef.current = next;
      setTrackLevel(next);
      const out = next + (faderRef.current - 50) * 0.4;
      setOutput(out);
      setTotalTicks((t) => t + 1);
      setMaxOutput((m) => Math.max(m, out));
      if (out >= ZONE_LO && out <= ZONE_HI) {
        setInZoneTicks((c) => c + 1);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [gameOver]);

  const handleFaderChange = (v: number) => {
    if (gameOver) return;
    faderRef.current = v;
    setFader(v);
  };

  const baseScore = totalTicks > 0 ? Math.round((inZoneTicks / totalTicks) * 1000) : 0;
  const noClip = maxOutput <= CLIP_LEVEL;
  const score = Math.min(1000, Math.round(baseScore * (noClip ? 1.1 : 1))); // 0-1000

  const inZone = output >= ZONE_LO && output <= ZONE_HI;

  const handleFinalize = () => {
    setGameOver(true);
    onComplete(score, score >= 600);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome title={tc('mg.FaderRideGame.title', '🎛️ Fader Ride Challenge')} score={score} timeLeft={timeLeft} streak={Math.floor(inZoneTicks / 10)} accent="green">
      <CardContent>

        {/* Level meter with fixed green zone */}
        <div className="mb-4 bg-stone-700 rounded p-4">
          <div className="flex justify-between text-xs text-stone-300 mb-1">
            <span>0</span>
            <span className="text-green-400 font-bold">{tc('mg.FaderRideGame.green_zone', 'Green zone 40-60')}</span>
            <span>100</span>
          </div>
          <div className="relative h-8 bg-stone-900 rounded overflow-hidden">
            {/* Green zone */}
            <div
              className={`absolute top-0 bottom-0 bg-gradient-to-r from-green-500 to-emerald-400 ${inZone ? 'mg-meter-glow' : 'opacity-70'}`}
              style={{ left: `${ZONE_LO}%`, width: `${ZONE_HI - ZONE_LO}%` }}
            />
            {/* Track level marker (blue) */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-blue-400"
              style={{ left: `${trackLevel}%` }}
              title={tc('mg.FaderRideGame.track_title', 'Track: {{value}}', { value: trackLevel.toFixed(1) })}
            />
            {/* Output needle (white/yellow) */}
            <div
              className={`absolute top-0 bottom-0 w-1.5 ${inZone ? 'bg-gradient-to-b from-yellow-200 to-yellow-400 mg-meter-glow' : 'bg-gradient-to-b from-red-300 to-red-500'}`}
              style={{ left: `${Math.min(100, Math.max(0, output))}%` }}
              title={tc('mg.FaderRideGame.output_title', 'Output: {{value}}', { value: output.toFixed(1) })}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm font-mono text-stone-200">
            <span>{tc('mg.FaderRideGame.track_title', 'Track: {{value}}', { value: trackLevel.toFixed(1) })}</span>
            <span className={inZone ? 'text-green-400' : 'text-red-400'}>
              {tc('mg.FaderRideGame.output_title', 'Output: {{value}}', { value: output.toFixed(1) })} {inZone ? tc('mg.FaderRideGame.in_zone', '(IN ZONE)') : tc('mg.FaderRideGame.out', '(OUT)')}
            </span>
          </div>
          <div className="mt-1 text-xs text-stone-400 font-mono">
            {tc('mg.FaderRideGame.in_zone_ticks', 'In-zone ticks: {{in}}/{{total}}', { in: inZoneTicks, total: totalTicks })}
          </div>
        </div>

        {/* Fader control */}
        <div className="bg-stone-700 rounded p-4">
          <div className="flex justify-between text-sm text-stone-300 mb-1">
            <span>{tc('mg.FaderRideGame.fader', 'Fader')}</span>
            <span className="font-mono">{fader}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={fader}
            disabled={gameOver}
            onChange={(e) => handleFaderChange(parseInt(e.target.value, 10))}
            className="w-full accent-green-500 mg-hit-flash cursor-pointer"
            aria-label={tc('mg.FaderRideGame.master_fader', 'Master fader')}
          />
        </div>

        {/* No-clip streak bonus */}
        <div key={String(noClip)} className={`mt-3 text-sm font-bold ${noClip ? 'text-green-400 mg-combo-pulse' : 'text-red-400 mg-miss-shake'}`}>
          {noClip
            ? tc('mg.FaderRideGame.no_clip', '🔇 No-clip streak intact! +10% bonus applied.')
            : tc('mg.FaderRideGame.clipped', '⚠️ Clipped! Output exceeded {{level}} (peak {{peak}}). Bonus lost.', { level: CLIP_LEVEL, peak: maxOutput.toFixed(1) })}
        </div>

        {gameOver && (
          <div key={score} className={`mt-4 text-center text-2xl font-bold text-green-400 ${score >= 600 ? 'mg-perfect-pop' : 'mg-miss-shake'}`}>
            {tc('mg.FaderRideGame.times_up', "Time's Up! Final Score: {{score}}", { score })}
          </div>
        )}
      </CardContent>
      </MinigameChrome>
      <DialogFooter className="p-4">
        <KenneyButton variant="green" onClick={onClose}>
          {tc('mg.FaderRideGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton variant="green" onClick={handleFinalize}>
          {tc('mg.FaderRideGame.finalize', 'Finalize & Get Score')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
