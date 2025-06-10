import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BaseMinigame } from './BaseMinigame';
import { useSound } from '@/hooks/useSound';
import { useToast } from '@/hooks/useToast';

interface Region {
  id: string;
  start: number;
  end: number;
  type: 'noise' | 'click' | 'hum' | 'reverb' | 'other';
  severity: number;
}

interface RestorationTool {
  id: string;
  name: string;
  type: 'noise_reduction' | 'click_removal' | 'hum_removal' | 'de_reverb' | 'spectral_repair';
  parameters: {
    threshold: number;
    sensitivity: number;
    reduction: number;
    [key: string]: number;
  };
}

interface AudioRestorationGameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
}

const REGIONS: Region[] = [
  { id: '1', start: 0.2, end: 0.4, type: 'noise', severity: 0.8 },
  { id: '2', start: 0.6, end: 0.7, type: 'click', severity: 0.6 },
  { id: '3', start: 0.8, end: 1.0, type: 'hum', severity: 0.7 },
  { id: '4', start: 1.2, end: 1.4, type: 'reverb', severity: 0.5 },
  { id: '5', start: 1.6, end: 1.8, type: 'other', severity: 0.4 }
];

const TOOLS: RestorationTool[] = [
  {
    id: 'noise_reduction',
    name: 'Noise Reduction',
    type: 'noise_reduction',
    parameters: {
      threshold: 0.5,
      sensitivity: 0.5,
      reduction: 0.5
    }
  },
  {
    id: 'click_removal',
    name: 'Click Removal',
    type: 'click_removal',
    parameters: {
      threshold: 0.5,
      sensitivity: 0.5,
      reduction: 0.5
    }
  },
  {
    id: 'hum_removal',
    name: 'Hum Removal',
    type: 'hum_removal',
    parameters: {
      threshold: 0.5,
      sensitivity: 0.5,
      reduction: 0.5
    }
  },
  {
    id: 'de_reverb',
    name: 'De-reverb',
    type: 'de_reverb',
    parameters: {
      threshold: 0.5,
      sensitivity: 0.5,
      reduction: 0.5
    }
  },
  {
    id: 'spectral_repair',
    name: 'Spectral Repair',
    type: 'spectral_repair',
    parameters: {
      threshold: 0.5,
      sensitivity: 0.5,
      reduction: 0.5
    }
  }
];

export const AudioRestorationGame: React.FC<AudioRestorationGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose
}) => {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedTool, setSelectedTool] = useState<RestorationTool>(TOOLS[0]);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<{ tool: RestorationTool; region: Region }[]>([]);
  const [previewBuffer, setPreviewBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { playSound } = useSound();
  const { toast } = useToast();

  const generateRegions = (difficulty: number): Region[] => {
    const baseRegions = [...REGIONS];
    const numRegions = Math.min(3 + difficulty, baseRegions.length);
    return baseRegions.slice(0, numRegions);
  };

  const [regions, setRegions] = useState<Region[]>(() => generateRegions(difficulty));

  const maxScore = regions.length * 100;

  const calculateScore = () => {
    let totalScore = 0;

    regions.forEach((region, index) => {
      const target = regions[index];
      const severityDiff = Math.abs(region.severity - target.severity);
      const regionScore = Math.max(0, 100 - severityDiff * 100);
      totalScore += regionScore;
    });

    return Math.round((totalScore / maxScore) * 100);
  };

  const handleComplete = () => {
    setIsPlaying(false);

    // Calculate final score
    const finalScore = calculateScore();
    setScore(finalScore);

    if (finalScore >= 70) {
      playSound('success');
      toast({ description: 'Restoration completed successfully!', variant: 'success' });
      onComplete(finalScore);
    } else {
      playSound('failure');
      toast({ description: 'Restoration quality below target.', variant: 'destructive' });
      onFail();
    }
  };

  // Update timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, handleComplete]);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleStart = () => {
    setIsPlaying(true);
    playSound('button_click');
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    playSound('button_click');
  };

  const handleToolSelect = (tool: RestorationTool) => {
    setSelectedTool(tool);
    playSound('button_click');
  };

  const handleParameterChange = (parameter: string, value: number) => {
    if (!selectedTool) return;

    setSelectedTool(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [parameter]: value
      }
    }));

    playSound('slider_move');
  };

  const handleApplyTool = () => {
    if (!selectedRegion || !selectedTool) return;

    setIsProcessing(true);
    playSound('processing_start');

    // Simulate processing delay
    setTimeout(() => {
      setRegions(prev =>
        prev.map(region =>
          region.id === selectedRegion.id
            ? {
                ...region,
                severity: Math.max(0, region.severity - selectedTool.parameters.reduction)
              }
            : region
        )
      );

      setHistory(prev => [...prev, { tool: selectedTool, region: selectedRegion }]);
      setIsProcessing(false);
      playSound('processing_complete');
    }, 1000);
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    setRegions(prev =>
      prev.map(region =>
        region.id === lastAction.region.id
          ? {
              ...region,
              severity: Math.min(1, region.severity + lastAction.tool.parameters.reduction)
            }
          : region
      )
    );

    setHistory(prev => prev.slice(0, -1));
    playSound('undo');
  };

  const handlePreview = () => {
    if (!audioContextRef.current) return;

    // Simulate audio preview
    playSound('preview_start');
    setTimeout(() => {
      playSound('preview_complete');
    }, 2000);
  };

  return (
    <BaseMinigame
      type="audio_restoration"
      difficulty={difficulty}
      onComplete={onComplete}
      onFail={onFail}
      onClose={onClose}
      title="Audio Restoration"
      description="Clean up and restore degraded audio recordings"
    >
      <div className="flex flex-col gap-4">
        {/* Waveform Display */}
        <div className="relative h-32 bg-gray-800 rounded-lg overflow-hidden">
          {regions.map(region => (
            <motion.div
              key={region.id}
              className={`absolute h-full ${
                region.type === 'noise'
                  ? 'bg-red-500'
                  : region.type === 'click'
                  ? 'bg-yellow-500'
                  : region.type === 'hum'
                  ? 'bg-blue-500'
                  : region.type === 'reverb'
                  ? 'bg-purple-500'
                  : 'bg-gray-500'
              }`}
              style={{
                left: `${region.start * 100}%`,
                width: `${(region.end - region.start) * 100}%`,
                opacity: region.severity
              }}
              onClick={() => handleRegionSelect(region)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            />
          ))}
        </div>

        {/* Tool Selection */}
        <div className="grid grid-cols-5 gap-2">
          {TOOLS.map(tool => (
            <motion.button
              key={tool.id}
              className={`p-2 rounded-lg ${
                selectedTool?.id === tool.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => handleToolSelect(tool)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tool.name}
            </motion.button>
          ))}
        </div>

        {/* Parameter Controls */}
        {selectedTool && (
          <div className="space-y-2">
            {Object.entries(selectedTool.parameters).map(([param, value]) => (
              <div key={param} className="flex items-center gap-2">
                <label className="text-sm text-gray-300 w-24">
                  {param.charAt(0).toUpperCase() + param.slice(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={value}
                  onChange={e => handleParameterChange(param, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-300 w-12">{Math.round(value * 100)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            className="flex-1 p-2 bg-blue-500 text-white rounded-lg"
            onClick={handleApplyTool}
            disabled={!selectedRegion || !selectedTool || isProcessing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Apply Tool
          </motion.button>
          <motion.button
            className="flex-1 p-2 bg-gray-700 text-white rounded-lg"
            onClick={handleUndo}
            disabled={history.length === 0}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Undo
          </motion.button>
          <motion.button
            className="flex-1 p-2 bg-gray-700 text-white rounded-lg"
            onClick={handlePreview}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Preview
          </motion.button>
        </div>

        {/* Game Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-300">
            Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-300">Score: {score}</div>
          {!isPlaying && (
            <motion.button
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
              onClick={handleStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start
            </motion.button>
          )}
        </div>
      </div>
    </BaseMinigame>
  );
};
