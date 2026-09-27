
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { Progress } from '@/components/ui/progress';

interface PitchBlock {
  id: string;
  position: number; // Position from 0-100 (percentage across screen)
  hit: boolean;
  missed: boolean;
}

interface VocalRecordingGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const VocalRecordingGame: React.FC<VocalRecordingGameProps> = ({ onComplete, onClose }) => {
  const [pitchBlocks, setPitchBlocks] = useState<PitchBlock[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [totalBlocks] = useState(7);
  const intervalRef = useRef<NodeJS.Timeout>();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const initializeGame = () => {
    const blocks: PitchBlock[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      blocks.push({
        id: `block-${i}`,
        position: (i + 1) * (100 / (totalBlocks + 1)), // Evenly space blocks
        hit: false,
        missed: false
      });
    }
    setPitchBlocks(blocks);
    setCursorPosition(0);
    setHitCount(0);
    setScore(0);
  };

  const startGame = () => {
    setGameActive(true);
    setGameStarted(true);
    initializeGame();

    // Move cursor across screen
    intervalRef.current = setInterval(() => {
      setCursorPosition(prev => {
        const newPos = prev + 1;
        if (newPos >= 100) {
          // Game over
          setGameActive(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          // Calculate final score
          const accuracy = (hitCount / totalBlocks) * 100;
          let finalScore = 0;
          
          if (accuracy >= 90) {
            finalScore = 150; // High creativity bonus
          } else if (accuracy >= 70) {
            finalScore = 100;
          } else if (accuracy >= 50) {
            finalScore = 50;
          } else {
            finalScore = 20;
          }
          
          setTimeout(() => onComplete(finalScore), 1000);
          return 100;
        }
        return newPos;
      });
    }, 100); // Cursor moves every 100ms for 10 seconds total
  };

  const handleHit = () => {
    if (!gameActive) return;

    const tolerance = 3; // Hit tolerance (percentage)
    
    setPitchBlocks(prev => {
      let newHitCount = hitCount;
      const updatedBlocks = prev.map(block => {
        if (!block.hit && !block.missed) {
          const distance = Math.abs(block.position - cursorPosition);
          if (distance <= tolerance) {
            newHitCount++;
            setHitCount(newHitCount);
            setScore(s => s + 20);
            return { ...block, hit: true };
          }
        }
        return block;
      });
      
      return updatedBlocks;
    });
  };

  // Mark missed blocks
  useEffect(() => {
    if (!gameActive) return;
    
    setPitchBlocks(prev => 
      prev.map(block => {
        if (!block.hit && !block.missed && block.position < cursorPosition - 5) {
          return { ...block, missed: true };
        }
        return block;
      })
    );
  }, [cursorPosition, gameActive]);

  // Handle spacebar press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameActive) {
        e.preventDefault();
        handleHit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameActive, cursorPosition, hitCount]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getAccuracy = () => {
    return totalBlocks > 0 ? Math.round((hitCount / totalBlocks) * 100) : 0;
  };

  const streak = hitCount;
  const finished = gameStarted && !gameActive;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gray-800 text-white border-gray-700">
      <MinigameChrome title="🎤 Vocal Tuning Challenge" score={score} streak={streak >= 2 ? streak : undefined} accent="red">
      <CardContent>
        <p className="mb-3 text-center text-sm text-gray-300">Hit the pitch blocks when the cursor reaches them! Hits: {hitCount}/{totalBlocks}</p>

      {!gameStarted ? (
        <div className="space-y-4 py-4 text-center">
          <p className="text-gray-300">
            Click or press SPACEBAR when the cursor line hits each pitch block.
            Perfect timing gives you maximum creativity points!
          </p>
          <KenneyButton variant="red" onClick={startGame}>
            Start Vocal Session
          </KenneyButton>
        </div>
      ) : !gameActive ? (
        <div key={score} className="space-y-4 py-4 text-center">
          <div className={`text-2xl font-bold text-yellow-400 ${getAccuracy() >= 70 ? 'mg-perfect-pop' : 'mg-miss-shake'}`}>Vocal Session Complete!</div>
          <div className="space-y-2">
            <div className="text-lg">Accuracy: {getAccuracy()}%</div>
            <div className="text-lg">Final Score: {score}</div>
            {getAccuracy() >= 90 && (
              <div className="mg-perfect-pop text-green-400 font-bold text-xl">🌟 Polished Vocals!</div>
            )}
            {getAccuracy() >= 70 && getAccuracy() < 90 && (
              <div className="text-blue-400 font-bold">🎵 Good Performance!</div>
            )}
          </div>
          <KenneyButton variant="green" onClick={onClose}>
            Collect Rewards
          </KenneyButton>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Game area */}
          <div 
            ref={gameContainerRef}
            className="relative h-32 bg-gray-800 rounded-lg border-2 border-gray-600 overflow-hidden cursor-pointer"
            onClick={handleHit}
          >
            {/* Vocal waveform background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20" />
            
            {/* Pitch blocks */}
            {pitchBlocks.map(block => (
              <div
                key={block.id}
                className={`absolute w-4 h-16 rounded transition-all duration-200 ${
                  block.hit 
                    ? 'bg-green-400 mg-perfect-pop scale-110' 
                    : block.missed 
                    ? 'bg-red-400 mg-miss-shake opacity-50' 
                    : 'bg-yellow-400 hover:bg-yellow-300'
                }`}
                style={{
                  left: `${block.position}%`,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              >
                {block.hit && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-green-300 font-bold text-sm">
                    ✓
                  </div>
                )}
                {block.missed && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-red-300 font-bold text-sm">
                    ✗
                  </div>
                )}
              </div>
            ))}
            
            {/* Moving cursor */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-all duration-100"
              style={{ left: `${cursorPosition}%` }}
            >
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full" />
            </div>
            
            {/* Hit zone indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-xs">
              Click or press SPACEBAR
            </div>
          </div>
          
          {/* Progress indicator */}
          <Progress value={cursorPosition} className="w-full" />
        </div>
      )}
      </CardContent>
      </MinigameChrome>
      {!finished && gameStarted && (
        <DialogFooter className="p-4">
          <KenneyButton variant="grey" onClick={onClose}>
            Close
          </KenneyButton>
        </DialogFooter>
      )}
    </Card>
  );
};
