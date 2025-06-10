import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseMinigameProps } from '@/types/game';

interface BeatMakingGameProps extends BaseMinigameProps {
  difficulty: number;
}

export const BeatMakingGame: React.FC<BeatMakingGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose
}) => {
  const [pads, setPads] = useState<boolean[]>(Array(16).fill(false));
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const trackSounds = useMemo(() => [
    new Audio('/sounds/kick.mp3'),
    new Audio('/sounds/snare.mp3'),
    new Audio('/sounds/hihat.mp3'),
    new Audio('/sounds/clap.mp3')
  ], []);

  const playSound = useCallback((index: number) => {
    if (trackSounds[index]) {
      trackSounds[index].currentTime = 0;
      trackSounds[index].play();
    }
  }, [trackSounds]);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    onComplete(score);
  }, [score, onComplete]);

  useEffect(() => {
    if (isPlaying && !isComplete) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= pads.length - 1) {
            setIsPlaying(false);
            handleComplete();
            return 0;
          }
          return prev + 1;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isPlaying, isComplete, pads.length, handleComplete]);

  useEffect(() => {
    if (currentStep >= 0 && currentStep < pads.length) {
      playSound(currentStep);
    }
  }, [currentStep, pads.length, playSound]);

  const togglePad = (index: number) => {
    setPads(prev => {
      const newPads = [...prev];
      newPads[index] = !newPads[index];
      return newPads;
    });
  };

  const startGame = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setScore(0);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="grid grid-cols-4 gap-2">
        {pads.map((active, index) => (
          <button
            key={index}
            className={`w-16 h-16 rounded-lg ${
              active ? 'bg-blue-500' : 'bg-gray-200'
            } ${currentStep === index ? 'ring-2 ring-yellow-400' : ''}`}
            onClick={() => togglePad(index)}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={startGame}
          disabled={isPlaying}
        >
          Start
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div>Score: {score}</div>
    </div>
  );
};
