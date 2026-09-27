import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';

// Define a basic props interface for minigame components
export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

interface Take {
  center: number;
  width: number;
  result: string | null;
  points: number | null;
  hitPos: number | null;
}

const TOTAL_TAKES = 5;
const WINDOW_WIDTH = 16;
const SWEEP_MS = 20; // playhead step interval; 0->100 in ~2s

function makeTakes(): Take[] {
  return Array.from({ length: TOTAL_TAKES }, () => ({
    // Random punch window center 30-70, width 16
    center: Math.floor(Math.random() * 41) + 30,
    width: WINDOW_WIDTH,
    result: null,
    points: null,
    hitPos: null,
  }));
}

function gradeTake(pos: number, center: number, width: number): { result: string; points: number } {
  const d = Math.abs(pos - center);
  if (d <= 2) return { result: 'Perfect', points: 200 };
  if (d <= 5) return { result: 'Great', points: 120 };
  if (d <= width / 2) return { result: 'Good', points: 60 };
  return { result: 'Miss', points: 0 };
}

export const PunchInGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [takes, setTakes] = useState<Take[]>([]);
  const [currentTake, setCurrentTake] = useState(0);
  const [pos, setPos] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Initialize the 5 takes on mount
  useEffect(() => {
    setTakes(makeTakes());
  }, []);

  // Playhead sweep 0->100 over ~2s (loops until the player punches in)
  useEffect(() => {
    if (gameOver) return;
    setPos(0);
    const id = setInterval(() => {
      setPos((p) => (p + 1 > 100 ? 0 : p + 1));
    }, SWEEP_MS);
    return () => clearInterval(id);
  }, [currentTake, gameOver]);

  const total = takes.reduce((sum, t) => sum + (t.points ?? 0), 0); // 0-1000

  // Consecutive Perfect/Great run (display only, derived from existing state)
  let streak = 0;
  for (const t of takes) {
    if (!t.result) break;
    if (t.result === 'Perfect' || t.result === 'Great') streak += 1;
    else streak = 0;
  }

  const handleRec = () => {
    if (gameOver || takes.length !== TOTAL_TAKES || currentTake >= TOTAL_TAKES) return;
    const take = takes[currentTake];
    const { result, points } = gradeTake(pos, take.center, take.width);
    setTakes((prev) => {
      const next = [...prev];
      next[currentTake] = { ...next[currentTake], result, points, hitPos: pos };
      return next;
    });
    // Auto-advance; after take 5 the game is over (do NOT auto-call onComplete)
    if (currentTake >= TOTAL_TAKES - 1) {
      setGameOver(true);
    } else {
      setCurrentTake((c) => c + 1);
    }
  };

  const handleFinalize = () => {
    setGameOver(true);
    onComplete(total, total >= 600);
  };

  const active = takes[currentTake];
  const windowLeft = active ? Math.max(0, active.center - active.width / 2) : 0;

  const resultColor = (r: string | null) =>
    r === 'Perfect'
      ? 'text-yellow-300'
      : r === 'Great'
        ? 'text-green-400'
        : r === 'Good'
          ? 'text-blue-400'
          : 'text-red-400';

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gray-800 text-white border-gray-700">
      <MinigameChrome title="⏺️ Punch-In Challenge" score={total} timeLeft={TOTAL_TAKES - currentTake} timeUnit=" takes" streak={streak} accent="red">
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <span className="text-xl font-bold text-yellow-400">
            Take: {Math.min(currentTake + 1, TOTAL_TAKES)}/{TOTAL_TAKES}
          </span>
          {streak >= 2 && (
            <span className="text-sm font-bold text-orange-300 mg-combo-pulse">
              🔥 {streak}-take heater!
            </span>
          )}
        </div>

        {/* Playhead sweep area */}
        <div className="mb-4 bg-gray-700 rounded p-4">
          <div className="relative h-10 bg-gray-900 rounded overflow-hidden">
            {active && !gameOver && (
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-r from-red-500 to-orange-400 border-x border-red-300 mg-meter-glow"
                style={{ left: `${windowLeft}%`, width: `${active.width}%` }}
              />
            )}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white"
              style={{ left: `${pos}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-mono text-gray-200">Playhead: {pos}</span>
            <Button
              onClick={handleRec}
              disabled={gameOver}
              className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 font-bold px-8 mg-hit-flash active:scale-95"
            >
              ● REC
            </Button>
          </div>
        </div>

        {/* Per-take results */}
        <div className="bg-gray-700 rounded p-4">
          <div className="text-sm font-bold text-gray-300 mb-2">Takes</div>
          <ul className="space-y-1">
            {takes.map((t, i) => (
              <li key={i} className="flex justify-between text-sm font-mono">
                <span className="text-gray-300">
                  Take {i + 1}
                  {i === currentTake && !gameOver && (
                    <span className="ml-2 text-yellow-400">◀ live</span>
                  )}
                </span>
                <span
                  key={`${t.result}-${t.hitPos}`}
                  className={`font-bold ${resultColor(t.result)} ${t.result === 'Perfect' ? 'mg-perfect-pop' : ''} ${t.result === 'Miss' ? 'mg-miss-shake' : ''}`}
                >
                  {t.result ? `${t.result} (+${t.points}) @${t.hitPos}` : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {gameOver && (
          <div key={total} className={`mt-4 text-center text-2xl font-bold text-green-400 ${total >= 600 ? 'mg-perfect-pop' : 'mg-miss-shake'}`}>
            Session Complete! Final Score: {total}
          </div>
        )}
      </CardContent>
      </MinigameChrome>
      <DialogFooter className="p-4">
        <KenneyButton variant="red" onClick={onClose}>
          Close
        </KenneyButton>
        <KenneyButton variant="red" onClick={handleFinalize}>
          Finalize &amp; Get Score
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
