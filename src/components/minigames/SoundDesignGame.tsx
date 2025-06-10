import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSound } from '@/hooks/useSound';
import { BaseMinigame } from './BaseMinigame';

interface SynthesisParameters {
  oscillatorType: OscillatorType;
  frequency: number;
  detune: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterType: BiquadFilterType;
  filterFrequency: number;
  filterQ: number;
  lfoRate: number;
  lfoAmount: number;
}

interface EffectParameters {
  reverb: number;
  delay: number;
  filter: number;
  distortion: number;
  modulation: number;
}

interface SoundDesignGameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
}

const SYNTHESIS_METHODS = [
  'subtractive',
  'additive',
  'fm',
  'wavetable',
  'granular',
  'physical',
  'sample',
  'hybrid'
] as const;

const SOUND_CATEGORIES = [
  'ambient',
  'foley',
  'impact',
  'movement',
  'environmental',
  'character',
  'ui',
  'musical'
] as const;

const GAME_DURATION = 300; // 5 minutes

export const SoundDesignGame: React.FC<SoundDesignGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<typeof SYNTHESIS_METHODS[number]>('subtractive');
  const [selectedCategory, setSelectedCategory] = useState<typeof SOUND_CATEGORIES[number]>('ambient');
  const [synthesisParams, setSynthesisParams] = useState<SynthesisParameters>({
    oscillatorType: 'sine',
    frequency: 440,
    detune: 0,
    attack: 0.1,
    decay: 0.2,
    sustain: 0.5,
    release: 0.3,
    filterType: 'lowpass',
    filterFrequency: 1000,
    filterQ: 1,
    lfoRate: 5,
    lfoAmount: 0.5
  });
  const [effectParams, setEffectParams] = useState<EffectParameters>({
    reverb: 0,
    delay: 0,
    filter: 0,
    distortion: 0,
    modulation: 0
  });
  const [targetSound, setTargetSound] = useState<AudioBuffer | null>(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const { playSound } = useSound();

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleGameComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPlaying]);

  const handleStart = () => {
    setIsPlaying(true);
    playSound('start');
    generateTargetSound();
  };

  const generateTargetSound = () => {
    // Generate a target sound based on difficulty and category
    const context = new AudioContext();
    const buffer = context.createBuffer(2, context.sampleRate * 2, context.sampleRate);
    // Fill buffer with target sound
    setTargetSound(buffer);
  };

  const handleParameterChange = (param: keyof SynthesisParameters, value: number) => {
    setSynthesisParams((prev) => ({
      ...prev,
      [param]: value
    }));
    playSound('parameter');
  };

  const handleEffectChange = (effect: keyof EffectParameters, value: number) => {
    setEffectParams((prev) => ({
      ...prev,
      [effect]: value
    }));
    playSound('effect');
  };

  const handleMethodChange = (method: typeof SYNTHESIS_METHODS[number]) => {
    setSelectedMethod(method);
    playSound('select');
  };

  const handleCategoryChange = (category: typeof SOUND_CATEGORIES[number]) => {
    setSelectedCategory(category);
    playSound('select');
  };

  const playCurrentSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();
    const lfo = context.createOscillator();

    // Set up synthesis chain
    oscillator.type = synthesisParams.oscillatorType;
    oscillator.frequency.value = synthesisParams.frequency;
    oscillator.detune.value = synthesisParams.detune;

    filter.type = synthesisParams.filterType;
    filter.frequency.value = synthesisParams.filterFrequency;
    filter.Q.value = synthesisParams.filterQ;

    lfo.frequency.value = synthesisParams.lfoRate;
    lfo.connect(filter.frequency);

    // Connect nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(context.destination);

    // Start playback
    oscillator.start();
    lfo.start();
    setIsPlayingSound(true);

    // Stop after 2 seconds
    setTimeout(() => {
      oscillator.stop();
      lfo.stop();
      setIsPlayingSound(false);
    }, 2000);
  };

  const handleGameComplete = () => {
    const finalScore = calculateScore();
    onComplete(finalScore);
  };

  const calculateScore = (): number => {
    // Calculate score based on:
    // 1. Parameter matching with target sound
    // 2. Creative implementation
    // 3. Technical execution
    // 4. Time management
    return Math.floor(Math.random() * 100); // Placeholder
  };

  return (
    <BaseMinigame
      type="sound_design"
      difficulty={difficulty}
      onComplete={handleGameComplete}
      onFail={onFail}
      onClose={onClose}
    >
      <div className="p-4">
        {!isPlaying ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-2 px-4 bg-primary text-white rounded-lg"
            onClick={handleStart}
          >
            Start Designing
          </motion.button>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-lg font-semibold">
                Time Remaining: {timeRemaining}s
              </div>
              <div className="text-lg font-semibold">
                Score: {score}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Synthesis Method</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SYNTHESIS_METHODS.map((method) => (
                    <motion.button
                      key={method}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded ${
                        selectedMethod === method
                          ? 'bg-primary text-white'
                          : 'bg-secondary'
                      }`}
                      onClick={() => handleMethodChange(method)}
                    >
                      {method}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Sound Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SOUND_CATEGORIES.map((category) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-2 rounded ${
                        selectedCategory === category
                          ? 'bg-primary text-white'
                          : 'bg-secondary'
                      }`}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Synthesis Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Frequency
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="20000"
                    value={synthesisParams.frequency}
                    onChange={(e) =>
                      handleParameterChange('frequency', Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Filter Frequency
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="20000"
                    value={synthesisParams.filterFrequency}
                    onChange={(e) =>
                      handleParameterChange('filterFrequency', Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                {/* Add more parameter controls */}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Effects</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reverb
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={effectParams.reverb}
                    onChange={(e) =>
                      handleEffectChange('reverb', Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Delay
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={effectParams.delay}
                    onChange={(e) =>
                      handleEffectChange('delay', Number(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                {/* Add more effect controls */}
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`py-2 px-4 rounded-lg ${
                  isPlayingSound
                    ? 'bg-destructive text-white'
                    : 'bg-primary text-white'
                }`}
                onClick={playCurrentSound}
              >
                {isPlayingSound ? 'Stop' : 'Play Sound'}
              </motion.button>
            </div>
          </>
        )}
      </div>
    </BaseMinigame>
  );
};
