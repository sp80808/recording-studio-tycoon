
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WavePoint {
  x: number;
  y: number;
}

interface SoundWaveGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const SoundWaveGame: React.FC<SoundWaveGameProps> = ({
  onComplete,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [targetWave, setTargetWave] = useState<WavePoint[]>([]);
  const [playerWave, setPlayerWave] = useState<WavePoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);

  const generateTargetWave = useCallback(() => {
    const points: WavePoint[] = [];
    const width = 400;
    const height = 150;
    const frequency = currentLevel * 0.02;
    const amplitude = 50 + (currentLevel * 10);

    for (let x = 0; x < width; x += 2) {
      const y = height/2 + Math.sin(x * frequency) * amplitude * Math.sin(x * 0.01);
      points.push({ x, y });
    }

    setTargetWave(points);
    setPlayerWave([]);
  }, [currentLevel]);

  const startGame = useCallback(() => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(30);
    setCurrentLevel(1);
    generateTargetWave();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          setTimeout(() => onComplete(score), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [score, onComplete, generateTargetWave]);

  const drawWaves = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw target wave
    if (targetWave.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(targetWave[0].x, targetWave[0].y);
      targetWave.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    // Draw player wave
    if (playerWave.length > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playerWave[0].x, playerWave[0].y);
      playerWave.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [targetWave, playerWave]);

  useEffect(() => {
    drawWaves();
  }, [drawWaves]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameActive) return;
    setIsDrawing(true);
    setPlayerWave([]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !gameActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPlayerWave(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (playerWave.length > 10) {
      checkAccuracy();
    }
  };

  const checkAccuracy = useCallback(() => {
    if (targetWave.length === 0 || playerWave.length === 0) return;

    let totalError = 0;
    let comparisons = 0;

    for (const playerPoint of playerWave) {
      const nearestTarget = targetWave.reduce((nearest, target) => 
        Math.abs(target.x - playerPoint.x) < Math.abs(nearest.x - playerPoint.x) ? target : nearest
      );

      const error = Math.abs(nearestTarget.y - playerPoint.y);
      totalError += error;
      comparisons++;
    }

    const averageError = totalError / comparisons;
    const accuracy = Math.max(0, 100 - (averageError / 2));
    const levelScore = Math.floor(accuracy * currentLevel);

    setScore(prev => prev + levelScore);

    if (accuracy > 75) {
      setCurrentLevel(prev => prev + 1);
      setTimeout(() => {
        generateTargetWave();
      }, 1000);
    }
  }, [targetWave, playerWave, currentLevel, generateTargetWave]);

  return (
    <Card className="p-6 bg-gray-900/95 border-green-500/50 text-white max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2">🌊 Sound Wave Matching</h3>
        <div className="flex justify-between items-center">
          <div>Score: <span className="text-green-400 font-bold">{score}</span></div>
          <div>Level: <span className="text-blue-400 font-bold">{currentLevel}</span></div>
          <div>Time: <span className="text-red-400 font-bold">{timeLeft}s</span></div>
        </div>
      </div>

      {!gameActive && timeLeft === 30 ? (
        <div className="text-center space-y-4">
          <p className="text-gray-300">Draw the orange wave to match the green target wave!</p>
          <Button onClick={startGame} className="bg-green-600 hover:bg-green-700">
            Start Wave Challenge
          </Button>
        </div>
      ) : !gameActive && timeLeft === 0 ? (
        <div className="text-center space-y-2">
          <div className="text-lg font-bold text-yellow-400">Challenge Complete!</div>
          <div className="text-sm text-gray-300">Final Score: {score}</div>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            Collect Rewards
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-300">
            Click and drag to draw the wave. Match the green line as closely as possible!
          </div>
          
          <div className="border-2 border-gray-600 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="bg-gray-800 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          <div className="flex justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-1 bg-green-500 mr-2"></div>
              <span className="text-sm">Target Wave</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-1 bg-yellow-500 mr-2"></div>
              <span className="text-sm">Your Wave</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
