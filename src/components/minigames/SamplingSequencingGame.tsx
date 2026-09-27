/**
 * @fileoverview Sampling & Sequencing Minigame - Digital Revolution Era (1980s-1990s)
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-01-19
 * @modified 2025-01-19
 * 
 * Era-specific minigame simulating digital sampling and beat sequencing.
 * Players must create beats by sampling sounds and arranging them in sequence.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw, Volume2 } from 'lucide-react';

interface SamplingSequencingGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

interface Sample {
  id: string;
  name: string;
  color: string;
  sound: string; // Sound description for UI
}

interface SequenceStep {
  sampleId: string | null;
  isActive: boolean;
}

const SAMPLES: Sample[] = [
  { id: 'kick', name: 'Kick', color: '#ff4444', sound: '🥁' },
  { id: 'snare', name: 'Snare', color: '#44ff44', sound: '🥁' },
  { id: 'hihat', name: 'Hi-Hat', color: '#4444ff', sound: '🔔' },
  { id: 'crash', name: 'Crash', color: '#ffaa44', sound: '💥' },
  { id: 'perc', name: 'Perc', color: '#aa44ff', sound: '🎵' },
  { id: 'synth', name: 'Synth', color: '#44aaff', sound: '🎹' },
];

const TARGET_PATTERNS = [
  // Classic 4/4 pattern
  [
    ['kick', null, 'hihat', null, 'snare', null, 'hihat', null],
    ['kick', null, 'hihat', null, 'snare', 'hihat', 'hihat', null]
  ],
  // Hip-hop pattern
  [
    ['kick', null, null, 'kick', 'snare', null, null, null],
    [null, 'hihat', null, 'hihat', null, 'hihat', 'kick', 'hihat']
  ],
  // Electronic pattern
  [
    ['kick', 'synth', 'hihat', 'synth', 'snare', 'synth', 'hihat', 'synth'],
    ['perc', null, 'crash', null, null, 'perc', null, 'crash']
  ]
];

export const SamplingSequencingGame: React.FC<SamplingSequencingGameProps> = ({ 
  onComplete, 
  onClose 
}) => {
  const [timeLeft, setTimeLeft] = useState(90);
  const [score, setScore] = useState(0);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [sequence, setSequence] = useState<SequenceStep[][]>([
    Array(8).fill({ sampleId: null, isActive: false }),
    Array(8).fill({ sampleId: null, isActive: false })
  ]);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const playbackRef = useRef<NodeJS.Timeout>();

  // Initialize first pattern
  useEffect(() => {
    const initialSequence = Array(2).fill(null).map(() => 
      Array(8).fill(null).map(() => ({ sampleId: null, isActive: false }))
    );
    setSequence(initialSequence);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !completed) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleGameEnd();
    }
  }, [timeLeft, completed]);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % 8);
      }, 250); // 120 BPM sixteenth notes
    } else {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying]);

  const handleStepClick = (trackIndex: number, stepIndex: number) => {
    if (!selectedSample) return;

    const newSequence = [...sequence];
    newSequence[trackIndex] = [...newSequence[trackIndex]];
    newSequence[trackIndex][stepIndex] = {
      sampleId: selectedSample,
      isActive: true
    };
    setSequence(newSequence);
  };

  const clearStep = (trackIndex: number, stepIndex: number) => {
    const newSequence = [...sequence];
    newSequence[trackIndex] = [...newSequence[trackIndex]];
    newSequence[trackIndex][stepIndex] = {
      sampleId: null,
      isActive: false
    };
    setSequence(newSequence);
  };

  const checkPattern = () => {
    const targetPattern = TARGET_PATTERNS[currentPatternIndex];
    const currentTrackPattern = targetPattern[currentTrackIndex];
    const userPattern = sequence[currentTrackIndex].map(step => step.sampleId);
    
    let matches = 0;
    for (let i = 0; i < 8; i++) {
      if (currentTrackPattern[i] === userPattern[i]) {
        matches++;
      }
    }
    
    const accuracy = matches / 8;
    const points = Math.floor(accuracy * 100);
    
    if (accuracy >= 0.75) {
      setScore(prev => prev + points);
      
      if (currentTrackIndex < 1) {
        // Move to next track
        setCurrentTrackIndex(prev => prev + 1);
      } else {
        // Move to next pattern
        if (currentPatternIndex < TARGET_PATTERNS.length - 1) {
          setCurrentPatternIndex(prev => prev + 1);
          setCurrentTrackIndex(0);
          // Reset sequence for new pattern
          const newSequence = Array(2).fill(null).map(() => 
            Array(8).fill(null).map(() => ({ sampleId: null, isActive: false }))
          );
          setSequence(newSequence);
        } else {
          // All patterns completed
          setCompleted(true);
          setTimeout(() => handleGameEnd(), 1000);
        }
      }
    }
    
    return accuracy;
  };

  const resetSequence = () => {
    const newSequence = Array(2).fill(null).map(() => 
      Array(8).fill(null).map(() => ({ sampleId: null, isActive: false }))
    );
    setSequence(newSequence);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleGameEnd = () => {
    setIsPlaying(false);
    onComplete(score);
  };

  const getSampleById = (id: string) => SAMPLES.find(s => s.id === id);

  return (
    <Card className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-gray-900 via-purple-900 to-pink-800 text-white border-2 border-neon-purple shadow-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              SAMPLING & SEQUENCING
            </h2>
            <p className="text-purple-300 text-sm">Digital Revolution Era • Create the perfect beat sequence</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{score}</div>
              <div className="text-xs text-gray-400">SCORE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{timeLeft}s</div>
              <div className="text-xs text-gray-400">TIME</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-purple-300">
              Pattern {currentPatternIndex + 1}/3 • Track {currentTrackIndex + 1}/2
            </span>
            <span className="text-cyan-300">
              {Math.floor((timeLeft / 90) * 100)}% Complete
            </span>
          </div>
          <Progress value={(timeLeft / 90) * 100} className="h-2 bg-gray-800" />
        </div>

        {/* Sample Bank */}
        <div className="bg-black/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-cyan-400">Sample Bank</h3>
          <div className="grid grid-cols-6 gap-2">
            {SAMPLES.map((sample) => (
              <Button
                key={sample.id}
                onClick={() => setSelectedSample(sample.id)}
                className={`h-16 text-lg font-bold transition-all duration-200 ${
                  selectedSample === sample.id
                    ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/30'
                    : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: sample.color,
                  color: 'white'
                }}
              >
                <div className="text-center">
                  <div className="text-2xl">{sample.sound}</div>
                  <div className="text-xs">{sample.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Sequencer */}
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-cyan-400">Sequencer</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-green-600 hover:bg-green-500"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setCurrentStep(0)}
                className="bg-yellow-600 hover:bg-yellow-500"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                onClick={resetSequence}
                className="bg-red-600 hover:bg-red-500"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="grid grid-cols-8 gap-1 mb-4">
            {Array(8).fill(null).map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded ${
                  currentStep === i ? 'bg-cyan-400' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Track 1 */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-16 text-sm font-semibold text-purple-300">Track 1</div>
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-8 gap-1">
              {sequence[0].map((step, i) => (
                <div
                  key={i}
                  className={`relative h-12 border-2 rounded cursor-pointer transition-all duration-200 ${
                    step.sampleId
                      ? 'border-cyan-400 shadow-lg shadow-cyan-400/30'
                      : 'border-gray-600 hover:border-purple-400'
                  } ${currentStep === i ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => selectedSample ? handleStepClick(0, i) : clearStep(0, i)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    clearStep(0, i);
                  }}
                  style={{
                    backgroundColor: step.sampleId 
                      ? getSampleById(step.sampleId)?.color + '40'
                      : 'transparent'
                  }}
                >
                  {step.sampleId && (
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                      {getSampleById(step.sampleId)?.sound}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Track 2 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-16 text-sm font-semibold text-purple-300">Track 2</div>
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-8 gap-1">
              {sequence[1].map((step, i) => (
                <div
                  key={i}
                  className={`relative h-12 border-2 rounded cursor-pointer transition-all duration-200 ${
                    step.sampleId
                      ? 'border-cyan-400 shadow-lg shadow-cyan-400/30'
                      : 'border-gray-600 hover:border-purple-400'
                  } ${currentStep === i ? 'ring-2 ring-yellow-400' : ''}`}
                  onClick={() => selectedSample ? handleStepClick(1, i) : clearStep(1, i)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    clearStep(1, i);
                  }}
                  style={{
                    backgroundColor: step.sampleId 
                      ? getSampleById(step.sampleId)?.color + '40'
                      : 'transparent'
                  }}
                >
                  {step.sampleId && (
                    <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                      {getSampleById(step.sampleId)?.sound}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-purple-300">
            <p>• Select a sample and click steps to place it</p>
            <p>• Right-click to clear steps • Match the target pattern</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={checkPattern}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold px-6"
            >
              Check Pattern
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="border-purple-400 text-purple-400 hover:bg-purple-400/10"
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
