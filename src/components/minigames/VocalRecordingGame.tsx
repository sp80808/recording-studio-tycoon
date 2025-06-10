import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const VocalRecordingGame: React.FC<VocalRecordingGameProps> = ({ 
  onComplete, 
  onClose,
  difficulty = 'medium' 
}) => {
  const [pitchBlocks, setPitchBlocks] = useState<PitchBlock[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [totalBlocks] = useState(7);
  const intervalRef = useRef<NodeJS.Timeout>();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isHit, setIsHit] = useState(false);

  const handleHit = useCallback(() => {
    if (!gameActive) return;

    const tolerance = 3;
    
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
  }, [gameActive, cursorPosition, hitCount]);

  const initializeGame = useCallback(() => {
    const blocks: PitchBlock[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      blocks.push({
        id: `block-${i}`,
        position: (i + 1) * (100 / (totalBlocks + 1)),
        hit: false,
        missed: false
      });
    }
    setPitchBlocks(blocks);
    setCursorPosition(0);
    setHitCount(0);
    setScore(0);
  }, [totalBlocks]);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameStarted(true);
    initializeGame();

    intervalRef.current = setInterval(() => {
      setCursorPosition(prev => {
        const newPos = prev + 1;
        if (newPos >= 100) {
          setGameActive(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          const accuracy = (hitCount / totalBlocks) * 100;
          let finalScore = 0;
          
          if (accuracy >= 90) {
            finalScore = 150;
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
    }, 100);
  }, [initializeGame, hitCount, totalBlocks, onComplete]);

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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameActive) {
        e.preventDefault();
        handleHit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameActive, handleHit]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isHit) {
      handleHit();
    }
  }, [isHit, handleHit]);

  const getAccuracy = useCallback(() => {
    return totalBlocks > 0 ? Math.round((hitCount / totalBlocks) * 100) : 0;
  }, [hitCount, totalBlocks]);

  return (
    <Card className="w-full max-w-4xl bg-gray-900 border-gray-600 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🎤 Vocal Tuning Challenge</h2>
        <p className="text-gray-300">Hit the pitch blocks when the cursor reaches them!</p>
        
        {gameStarted && gameActive && (
          <div className="mt-4 space-y-2">
            <div className="text-yellow-400 font-bold">Score: {score}</div>
            <div className="text-blue-400">Hits: {hitCount}/{totalBlocks}</div>
          </div>
        )}
      </div>

      {!gameStarted ? (
        <div className="text-center space-y-4">
          <p className="text-gray-300">
            Click or press SPACEBAR when the cursor line hits each pitch block.
            Perfect timing gives you maximum creativity points!
          </p>
          <Button onClick={startGame} className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3">
            Start Vocal Session
          </Button>
        </div>
      ) : !gameActive ? (
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-yellow-400">Vocal Session Complete!</div>
          <div className="space-y-2">
            <div className="text-lg">Accuracy: {getAccuracy()}%</div>
            <div className="text-lg">Final Score: {score}</div>
            {getAccuracy() >= 90 && (
              <div className="text-green-400 font-bold text-xl">🌟 Polished Vocals!</div>
            )}
            {getAccuracy() >= 70 && getAccuracy() < 90 && (
              <div className="text-blue-400 font-bold">🎵 Good Performance!</div>
            )}
          </div>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
            Collect Rewards
          </Button>
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
                    ? 'bg-green-400 scale-110 animate-pulse' 
                    : block.missed 
                    ? 'bg-red-400 opacity-50' 
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
    </Card>
  );
};
