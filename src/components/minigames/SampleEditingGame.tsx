import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BaseMinigameProps } from '@/types/game';
import { useSound } from '@/hooks/useSound';

interface Sample {
  id: string;
  name: string;
  waveform: number[];
  start: number;
  end: number;
  pitch: number;
  volume: number;
  effects: {
    reverb: number;
    delay: number;
    filter: number;
  };
}

const SAMPLE_COUNT = 4;
const WAVEFORM_POINTS = 100;

const generateRandomWaveform = () => {
  return Array.from({ length: WAVEFORM_POINTS }, () => Math.random() * 2 - 1);
};

const SAMPLES: Sample[] = Array.from({ length: SAMPLE_COUNT }, (_, i) => ({
  id: `sample-${i + 1}`,
  name: `Sample ${i + 1}`,
  waveform: generateRandomWaveform(),
  start: 0,
  end: 1,
  pitch: 1,
  volume: 1,
  effects: {
    reverb: 0,
    delay: 0,
    filter: 0
  }
}));

export const SampleEditingGame: React.FC<BaseMinigameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose
}) => {
  const [samples, setSamples] = useState<Sample[]>(SAMPLES);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { playSound } = useSound();

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleStart = () => {
    setIsPlaying(true);
    playSound('start');
  };

  const handleSampleSelect = (sampleId: string) => {
    setSelectedSample(sampleId);
    playSound('select');
  };

  const handleStartChange = (sampleId: string, value: number) => {
    setSamples(prev =>
      prev.map(sample =>
        sample.id === sampleId
          ? { ...sample, start: Math.max(0, Math.min(value, sample.end - 0.1)) }
          : sample
      )
    );
  };

  const handleEndChange = (sampleId: string, value: number) => {
    setSamples(prev =>
      prev.map(sample =>
        sample.id === sampleId
          ? { ...sample, end: Math.min(1, Math.max(value, sample.start + 0.1)) }
          : sample
      )
    );
  };

  const handlePitchChange = (sampleId: string, value: number) => {
    setSamples(prev =>
      prev.map(sample =>
        sample.id === sampleId
          ? { ...sample, pitch: Math.max(0.5, Math.min(2, value)) }
          : sample
      )
    );
  };

  const handleVolumeChange = (sampleId: string, value: number) => {
    setSamples(prev =>
      prev.map(sample =>
        sample.id === sampleId
          ? { ...sample, volume: Math.max(0, Math.min(1, value)) }
          : sample
      )
    );
  };

  const handleEffectChange = (sampleId: string, effect: keyof Sample['effects'], value: number) => {
    setSamples(prev =>
      prev.map(sample =>
        sample.id === sampleId
          ? { ...sample, effects: { ...sample.effects, [effect]: Math.max(0, Math.min(1, value)) } }
          : sample
      )
    );
  };

  const calculateScore = () => {
    // Calculate score based on how well the samples match target settings
    // Target settings are generated based on difficulty
    const targetSettings = samples.map(sample => ({
      start: Math.random() * 0.5,
      end: 0.5 + Math.random() * 0.5,
      pitch: 0.8 + Math.random() * 0.4,
      volume: 0.7 + Math.random() * 0.3,
      effects: {
        reverb: Math.random() * 0.5,
        delay: Math.random() * 0.5,
        filter: Math.random() * 0.5
      }
    }));

    let totalScore = 0;
    samples.forEach((sample, index) => {
      const target = targetSettings[index];
      const startDiff = Math.abs(sample.start - target.start);
      const endDiff = Math.abs(sample.end - target.end);
      const pitchDiff = Math.abs(sample.pitch - target.pitch);
      const volumeDiff = Math.abs(sample.volume - target.volume);
      const effectsDiff = Object.keys(sample.effects).reduce((sum, effect) => {
        const key = effect as keyof Sample['effects'];
        return sum + Math.abs(sample.effects[key] - target.effects[key]);
      }, 0);

      const sampleScore = 100 - (
        (startDiff + endDiff + pitchDiff + volumeDiff + effectsDiff) * 20
      );
      totalScore += Math.max(0, sampleScore);
    });

    return Math.round(totalScore / samples.length);
  };

  const handleComplete = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsPlaying(false);
    playSound('complete');
    onComplete(finalScore);
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Sample Editing Challenge</h2>
        <div className="text-white">
          Time: {timeLeft}s
        </div>
      </div>

      {!isPlaying ? (
        <button
          onClick={handleStart}
          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Challenge
        </button>
      ) : (
        <div className="space-y-6">
          {samples.map(sample => (
            <div
              key={sample.id}
              className={`p-4 rounded-lg ${
                selectedSample === sample.id ? 'bg-gray-800' : 'bg-gray-700'
              }`}
              onClick={() => handleSampleSelect(sample.id)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">{sample.name}</h3>
                <div className="flex gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Start</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={sample.start}
                      onChange={(e) => handleStartChange(sample.id, parseFloat(e.target.value))}
                      className="w-32"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">End</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={sample.end}
                      onChange={(e) => handleEndChange(sample.id, parseFloat(e.target.value))}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>

              <div className="h-20 bg-gray-800 rounded-lg mb-4">
                <svg className="w-full h-full">
                  <path
                    d={sample.waveform.map((y, x) => 
                      `${x === 0 ? 'M' : 'L'} ${(x / WAVEFORM_POINTS) * 100} ${50 + y * 25}`
                    ).join(' ')}
                    fill="none"
                    stroke="currentColor"
                    className="text-primary"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Pitch</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.01"
                    value={sample.pitch}
                    onChange={(e) => handlePitchChange(sample.id, parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sample.volume}
                    onChange={(e) => handleVolumeChange(sample.id, parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Effects</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Reverb</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={sample.effects.reverb}
                      onChange={(e) => handleEffectChange(sample.id, 'reverb', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Delay</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={sample.effects.delay}
                      onChange={(e) => handleEffectChange(sample.id, 'delay', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Filter</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={sample.effects.filter}
                      onChange={(e) => handleEffectChange(sample.id, 'filter', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 