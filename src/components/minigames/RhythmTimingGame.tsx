
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { gameAudio } from '@/utils/audioSystem';
import { tc } from '@/i18n/content';

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
  const completionTimerRef = useRef<NodeJS.Timeout>();
  const scoreRef = useRef(0);
  const endingRef = useRef(false);

  const difficultySettings = {
    easy: { beatInterval: 1200, speed: 2, targetZone: 80 },
    medium: { beatInterval: 800, speed: 3, targetZone: 60 },
    hard: { beatInterval: 600, speed: 4, targetZone: 40 }
  };

  const settings = difficultySettings[difficulty];

  const startGame = useCallback(() => {
    setGameActive(true);
    endingRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    setCombo(0);
    setTimeLeft(30);
    setBeats([]);

    // Initialize audio system
    gameAudio.initialize();

    // Spawn beats
    beatIntervalRef.current = setInterval(() => {
      const newBeat: Beat = {
        id: Date.now().toString(),
        position: 0,
        hit: false,
        perfect: false
      };
      setBeats(prev => [...prev, newBeat]);
      
      // Play metronome sound for each beat spawn
      gameAudio.playMetronome();
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
    if (endingRef.current) return;
    endingRef.current = true;
    setGameActive(false);
    if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    
    // Play completion sound
    gameAudio.playCompleteProject();
    
    completionTimerRef.current = setTimeout(() => {
      onComplete(scoreRef.current);
      completionTimerRef.current = undefined;
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

    const perfectZone = 325; // Center of target zone
    const perfectRange = 15; // Perfect hit range
    const goodRange = settings.targetZone / 2; // Good hit range

    setBeats(prev => {
      const hitBeats = prev.filter(beat => 
        !beat.hit && 
        beat.position >= perfectZone - goodRange && 
        beat.position <= perfectZone + goodRange
      );

      if (hitBeats.length > 0) {
        const closestBeat = hitBeats.reduce((closest, beat) => 
          Math.abs(beat.position - perfectZone) < Math.abs(closest.position - perfectZone) ? beat : closest
        );

        const distance = Math.abs(closestBeat.position - perfectZone);
        const isPerfect = distance < perfectRange;
        const points = isPerfect ? 100 : distance < 30 ? 50 : 25;

        const nextScore = scoreRef.current + points + (combo * 10);
        scoreRef.current = nextScore;
        setScore(nextScore);
        setCombo(c => c + 1);

        // Play appropriate hit sound
        if (isPerfect) {
          gameAudio.playPerfectHit();
        } else {
          gameAudio.playGoodHit();
        }

        return prev.map(beat =>
          beat.id === closestBeat.id
            ? { ...beat, hit: true, perfect: isPerfect }
            : beat
        );
      } else {
        // Play miss sound and reset combo
        if (combo > 0) {
          gameAudio.playError();
        }
        setCombo(0);
        return prev;
      }
    });
  }, [gameActive, combo, settings.targetZone]);

  useEffect(() => () => {
    if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
  }, []);

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

  const finished = !gameActive && timeLeft === 0;

  return (
    <Card className="w-full max-w-2xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome title={tc('mg.RhythmTimingGame.title', '🎵 Rhythm Timing Challenge')} score={score} timeLeft={gameActive ? timeLeft : undefined} streak={combo} accent="blue">
      <CardContent>

      <div 
        ref={gameAreaRef}
        className="relative h-32 bg-stone-800 rounded-lg border-2 border-stone-600 overflow-hidden mb-4"
      >
        {/* Target zone with perfect timing indicator */}
        <div className="absolute left-72 top-0 w-12 h-full bg-green-500/30 border-2 border-green-400 flex items-center justify-center">
          <div className="text-green-400 font-bold text-xs">{tc('mg.RhythmTimingGame.hit_zone', 'HIT')}</div>
        </div>

        {/* Perfect timing line - shows exactly where to hit for perfect score */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-yellow-400 shadow-lg z-10"
          style={{ left: '325px' }}
        >
          <div className="absolute -top-1 -left-2 w-5 h-1 bg-yellow-400 animate-pulse"></div>
          <div className="absolute -bottom-1 -left-2 w-5 h-1 bg-yellow-400 animate-pulse"></div>
        </div>

        {/* Beats */}
        {beats.map(beat => (
          <div
            key={beat.id}
            className={`absolute top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full transition-all duration-100 ${
              beat.hit 
                ? beat.perfect 
                  ? 'bg-yellow-400 mg-perfect-pop scale-150' 
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
                {beat.perfect ? tc('mg.RhythmTimingGame.perfect', 'PERFECT!') : tc('mg.RhythmTimingGame.hit', 'HIT!')}
              </div>
            )}
          </div>
        ))}

        {/* Guide line */}
        <div className="absolute left-0 top-1/2 w-full h-0.5 bg-stone-600"></div>
      </div>

      <div className="text-center space-y-3">
        {!gameActive && timeLeft === 30 ? (
          <KenneyButton variant="yellow" onClick={startGame}>
            {tc('mg.RhythmTimingGame.start', 'Start Rhythm Challenge')}
          </KenneyButton>
        ) : finished ? (
          <div key={score} className="space-y-2">
            <div className={`text-lg font-bold text-yellow-400 ${score > 0 ? 'mg-perfect-pop' : ''}`}>{tc('mg.RhythmTimingGame.complete', 'Game Complete!')}</div>
            <div className="text-sm text-stone-300">{tc('mg.RhythmTimingGame.final_score', 'Final Score: {{score}}', { score })}</div>
            <KenneyButton variant="green" onClick={onClose}>
              {tc('mg.RhythmTimingGame.collect', 'Collect Rewards')}
            </KenneyButton>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-stone-300">
              {tc('mg.RhythmTimingGame.instr_pre', 'Press SPACE when beats hit the')} <span className="text-yellow-400 font-bold">{tc('mg.RhythmTimingGame.instr_line', 'yellow line')}</span> {tc('mg.RhythmTimingGame.instr_post', 'for PERFECT timing!')}
            </div>
            <KenneyButton variant="yellow" onClick={hitBeat} className="w-full mg-hit-flash active:scale-95">
              {tc('mg.RhythmTimingGame.hit_button', 'HIT (SPACE)')}
            </KenneyButton>
          </div>
        )}
      </div>
      </CardContent>
      </MinigameChrome>
      {!finished && (
        <DialogFooter className="p-4">
          <KenneyButton variant="grey" onClick={onClose}>
            {tc('mg.RhythmTimingGame.close', 'Close')}
          </KenneyButton>
        </DialogFooter>
      )}
    </Card>
  );
};
