
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RhythmTimingGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Beat {
  id: string;
  position: number;
  hit: boolean;
  perfect: boolean;
}

export const RhythmTimingGame: React.FC<RhythmTimingGameProps> = ({
  onComplete,
  onClose,
  difficulty = 'medium'
}) => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const beatIntervalRef = useRef<NodeJS.Timeout>();
  const gameTimerRef = useRef<NodeJS.Timeout>();

  const difficultySettings = {
    easy: { beatInterval: 1200, speed: 2, targetZone: 80 },
    medium: { beatInterval: 800, speed: 3, targetZone: 60 },
    hard: { beatInterval: 600, speed: 4, targetZone: 40 }
  };

  const settings = difficultySettings[difficulty];

  const startGame = useCallback(() => {
    setGameActive(true);
    setScore(0);
    setCombo(0);
    setTimeLeft(30);
    setBeats([]);

    // Spawn beats
    beatIntervalRef.current = setInterval(() => {
      const newBeat: Beat = {
        id: Date.now().toString(),
        position: 0,
        hit: false,
        perfect: false
      };
      setBeats(prev => [...prev, newBeat]);
    }, settings.beatInterval);

    // Game timer
    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings.beatInterval]);

  const endGame = useCallback(() => {
    setGameActive(false);
    if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    
    setTimeout(() => {
      onComplete(score);
    }, 1000);
  }, [score, onComplete]);

  // Move beats
  useEffect(() => {
    if (!gameActive) return;

    const moveInterval = setInterval(() => {
      setBeats(prev => prev.map(beat => ({
        ...beat,
        position: beat.position + settings.speed
      })).filter(beat => beat.position < 400));
    }, 16);

    return () => clearInterval(moveInterval);
  }, [gameActive, settings.speed]);

  const hitBeat = useCallback(() => {
    if (!gameActive) return;

    const targetZoneStart = 300;
    const targetZoneEnd = 350;

    setBeats(prev => {
      const hitBeats = prev.filter(beat => 
        !beat.hit && 
        beat.position >= targetZoneStart - settings.targetZone/2 && 
        beat.position <= targetZoneEnd + settings.targetZone/2
      );

      if (hitBeats.length > 0) {
        const closestBeat = hitBeats.reduce((closest, beat) => 
          Math.abs(beat.position - 325) < Math.abs(closest.position - 325) ? beat : closest
        );

        const distance = Math.abs(closestBeat.position - 325);
        const isPerfect = distance < 15;
        const points = isPerfect ? 100 : distance < 30 ? 50 : 25;

        setScore(s => s + points + (combo * 10));
        setCombo(c => c + 1);

        return prev.map(beat =>
          beat.id === closestBeat.id
            ? { ...beat, hit: true, perfect: isPerfect }
            : beat
        );
      } else {
        setCombo(0);
        return prev;
      }
    });
  }, [gameActive, combo, settings.targetZone]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameActive) {
        e.preventDefault();
        hitBeat();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [hitBeat, gameActive]);

  return (
    <Card className="p-6 bg-gray-900/95 border-purple-500/50 text-white max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2">🎵 Rhythm Timing Challenge</h3>
        <div className="flex justify-between items-center">
          <div>Score: <span className="text-purple-400 font-bold">{score}</span></div>
          <div>Combo: <span className="text-orange-400 font-bold">x{combo}</span></div>
          <div>Time: <span className="text-red-400 font-bold">{timeLeft}s</span></div>
        </div>
      </div>

      <div 
        ref={gameAreaRef}
        className="relative h-32 bg-gray-800 rounded-lg border-2 border-gray-600 overflow-hidden mb-4"
      >
        {/* Target zone */}
        <div className="absolute left-72 top-0 w-12 h-full bg-green-500/30 border-2 border-green-400 flex items-center justify-center">
          <div className="text-green-400 font-bold text-xs">HIT</div>
        </div>

        {/* Beats */}
        {beats.map(beat => (
          <div
            key={beat.id}
            className={`absolute top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full transition-all duration-100 ${
              beat.hit 
                ? beat.perfect 
                  ? 'bg-yellow-400 animate-pulse scale-150' 
                  : 'bg-green-400 animate-pulse scale-125'
                : 'bg-purple-500 animate-bounce'
            }`}
            style={{ 
              left: `${beat.position}px`,
              boxShadow: beat.hit ? '0 0 20px currentColor' : '0 0 10px rgba(147, 51, 234, 0.5)'
            }}
          >
            {beat.hit && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold">
                {beat.perfect ? 'PERFECT!' : 'HIT!'}
              </div>
            )}
          </div>
        ))}

        {/* Guide line */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-600"></div>
      </div>

      <div className="text-center space-y-3">
        {!gameActive && timeLeft === 30 ? (
          <Button onClick={startGame} className="bg-purple-600 hover:bg-purple-700">
            Start Rhythm Challenge
          </Button>
        ) : !gameActive && timeLeft === 0 ? (
          <div className="space-y-2">
            <div className="text-lg font-bold text-yellow-400">Game Complete!</div>
            <div className="text-sm text-gray-300">Final Score: {score}</div>
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
              Collect Rewards
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-gray-300">Press SPACE when beats hit the green zone!</div>
            <Button onClick={hitBeat} className="bg-orange-600 hover:bg-orange-700 w-full">
              HIT (SPACE)
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
