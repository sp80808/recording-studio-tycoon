/**
 * @fileoverview Tape Splicing Minigame - Analog Era (1960s-1970s)
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-06-08
 * @modified 2025-06-08
 * 
 * Era-specific minigame simulating analog tape editing with precision timing.
 * Players must cut and splice tape at exact points to remove unwanted sections.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Scissors, Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface TapeSplicingGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

interface CutPoint {
  position: number;
  isCorrect: boolean;
  tolerance: number;
}

export const TapeSplicingGame: React.FC<TapeSplicingGameProps> = ({ onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [targetCuts, setTargetCuts] = useState<CutPoint[]>([]);
  const [playerCuts, setPlayerCuts] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'cut' | 'splice'>('cut');
  const [feedback, setFeedback] = useState<string>('');
  const [cutsRemaining, setCutsRemaining] = useState(3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate analog-style waveform with noise and artifacts
  useEffect(() => {
    const generateWaveform = () => {
      const data: number[] = [];
      for (let i = 0; i < 800; i++) {
        // Simulate analog tape recording with some noise
        const baseSignal = Math.sin(i * 0.02) * 0.7;
        const harmonics = Math.sin(i * 0.04) * 0.2 + Math.sin(i * 0.08) * 0.1;
        const tapeNoise = (Math.random() - 0.5) * 0.05;
        const analogWarmth = Math.sin(i * 0.001) * 0.1;
        
        data.push(baseSignal + harmonics + tapeNoise + analogWarmth);
      }
      return data;
    };

    const waveform = generateWaveform();
    setWaveformData(waveform);

    // Generate target cut points (remove unwanted sections)
    const cuts: CutPoint[] = [
      { position: 200, isCorrect: true, tolerance: 10 },
      { position: 450, isCorrect: true, tolerance: 10 },
      { position: 600, isCorrect: true, tolerance: 10 }
    ];
    setTargetCuts(cuts);
  }, []);

  // Playback simulation
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setPlayheadPosition(prev => {
          if (prev >= 800) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 50);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Game timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Draw waveform and tape interface
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas with vintage tape color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, width, height);

    // Draw tape texture
    ctx.fillStyle = '#A0522D';
    for (let i = 0; i < width; i += 20) {
      ctx.fillRect(i, 0, 1, height);
    }

    // Draw waveform
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const midY = height / 2;
    const scale = (height * 0.3);
    
    for (let i = 0; i < waveformData.length && i < width; i++) {
      const x = i;
      const y = midY + waveformData[i] * scale;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Draw target cut zones (problem areas)
    targetCuts.forEach(cut => {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(cut.position - cut.tolerance, 0, cut.tolerance * 2, height);
      
      // Mark center line
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cut.position, 0);
      ctx.lineTo(cut.position, height);
      ctx.stroke();
    });

    // Draw player cuts
    playerCuts.forEach(cut => {
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cut, 0);
      ctx.lineTo(cut, height);
      ctx.stroke();
    });

    // Draw playhead
    if (isPlaying) {
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadPosition, 0);
      ctx.lineTo(playheadPosition, height);
      ctx.stroke();
    }

  }, [waveformData, targetCuts, playerCuts, playheadPosition, isPlaying]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool !== 'cut' || cutsRemaining <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Make the cut
    const newCuts = [...playerCuts, x];
    setPlayerCuts(newCuts);
    setCutsRemaining(prev => prev - 1);

    // Check if cut is accurate
    const accuracy = checkCutAccuracy(x);
    if (accuracy > 0) {
      setScore(prev => prev + accuracy);
      setFeedback(`Perfect cut! +${accuracy} points`);
    } else {
      setFeedback('Cut missed the target area');
    }

    setTimeout(() => setFeedback(''), 2000);
  };

  const checkCutAccuracy = (cutPosition: number): number => {
    for (const target of targetCuts) {
      const distance = Math.abs(cutPosition - target.position);
      if (distance <= target.tolerance) {
        // Score based on precision
        const precision = 1 - (distance / target.tolerance);
        return Math.floor(precision * 100);
      }
    }
    return 0;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setPlayerCuts([]);
    setCutsRemaining(3);
    setPlayheadPosition(0);
    setIsPlaying(false);
    setScore(0);
    setFeedback('');
  };

  const handleComplete = () => {
    // Bonus points for completing with cuts remaining
    const finalScore = score + (cutsRemaining * 50);
    onComplete(finalScore);
  };

  return (
    <Card className="bg-gradient-to-b from-amber-900 to-orange-800 text-white p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">🎞️ Tape Splicing Studio</h2>
          <Badge variant="outline" className="text-amber-200 border-amber-400">
            1960s Analog Era
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">Score: {score}</div>
          <div className="text-sm">Time: {timeLeft}s</div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-amber-100 mb-2">
          🎯 <strong>Objective:</strong> Cut and remove the highlighted problem sections from the analog tape recording.
          Listen for distortion, clicks, or unwanted sounds and make precise cuts.
        </p>
        <div className="flex items-center gap-2 text-sm text-amber-200">
          <Clock className="w-4 h-4" />
          <span>Cuts remaining: {cutsRemaining}</span>
        </div>
      </div>

      {/* Tape Interface */}
      <div className="mb-6 border-2 border-amber-600 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={150}
          className="w-full cursor-crosshair bg-gradient-to-r from-amber-800 to-orange-700"
          onClick={handleCanvasClick}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            onClick={handlePlayPause}
            variant="outline"
            className="border-amber-400 text-amber-200 hover:bg-amber-800"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-amber-400 text-amber-200 hover:bg-amber-800"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setSelectedTool('cut')}
            variant={selectedTool === 'cut' ? 'default' : 'outline'}
            className={selectedTool === 'cut' ? 'bg-amber-600' : 'border-amber-400 text-amber-200'}
          >
            <Scissors className="w-4 h-4" />
            Cut Tool
          </Button>
        </div>

        <Button
          onClick={handleComplete}
          className="bg-amber-600 hover:bg-amber-700"
        >
          Complete Edit
        </Button>
      </div>

      {/* Progress and Feedback */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-amber-200">
          <span>Editing Progress</span>
          <span>{Math.round((3 - cutsRemaining) / 3 * 100)}%</span>
        </div>
        <Progress 
          value={(3 - cutsRemaining) / 3 * 100} 
          className="h-2 bg-amber-800"
        />
        
        {feedback && (
          <div className="text-center text-yellow-300 font-medium">
            {feedback}
          </div>
        )}
      </div>

      {/* Vintage Tape Instructions */}
      <div className="mt-4 p-3 bg-amber-800/50 rounded border border-amber-600">
        <h4 className="font-semibold text-amber-200 mb-2">🎛️ Analog Tape Editing</h4>
        <div className="text-sm text-amber-100 space-y-1">
          <p>• <strong>Red zones:</strong> Problem areas that need to be cut out</p>
          <p>• <strong>Click to cut:</strong> Make precise cuts at the target lines</p>
          <p>• <strong>Listen carefully:</strong> Use playback to identify problem areas</p>
          <p>• <strong>Splice accuracy:</strong> Closer cuts to center lines = higher scores</p>
        </div>
      </div>
    </Card>
  );
};
