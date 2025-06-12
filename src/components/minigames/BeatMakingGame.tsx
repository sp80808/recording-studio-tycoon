
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { gameAudio } from '@/utils/audioSystem';

interface BeatMakingGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  backgroundMusic?: {
    fadeVolume: (targetVolume: number, duration?: number) => Promise<void>;
    restoreVolume: (duration?: number) => Promise<void>;
  };
}

export const BeatMakingGame: React.FC<BeatMakingGameProps> = ({ onComplete, onClose, backgroundMusic }) => {
  const [beats, setBeats] = useState<boolean[][]>(Array(4).fill(null).map(() => Array(8).fill(false)));
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const intervalRef = useRef<NodeJS.Timeout>();
  const gameIntervalRef = useRef<NodeJS.Timeout>();

  const trackNames = ['Kick', 'Snare', 'Hi-Hat', 'Open Hat'];
  const trackColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
  const trackSounds = [
    () => gameAudio.playKick(),
    () => gameAudio.playSnare(), 
    () => gameAudio.playHiHat(),
    () => gameAudio.playOpenHat()
  ];

  // Initialize audio on first interaction
  useEffect(() => {
    const initAudio = async () => {
      await gameAudio.initialize();
      // Fade down background music when beatmaking game starts (slower fade)
      if (backgroundMusic) {
        await backgroundMusic.fadeVolume(0.2, 1500); // Fade to 20% volume over 1.5 seconds
      }
    };
    initAudio();

    // Cleanup: restore background music volume when component unmounts
    return () => {
      if (backgroundMusic) {
        backgroundMusic.restoreVolume(1500); // Restore over 1.5 seconds
      }
    };
  }, [backgroundMusic]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const newStep = (prev + 1) % 8;
          
          // Play sounds for active beats on this step
          beats.forEach((track, trackIndex) => {
            if (track[newStep]) {
              trackSounds[trackIndex]();
            }
          });
          
          return newStep;
        });
      }, 250);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, beats]);

  useEffect(() => {
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, []);

  const toggleBeat = (trackIndex: number, stepIndex: number) => {
    setBeats(prev => {
      const newBeats = [...prev];
      newBeats[trackIndex] = [...newBeats[trackIndex]];
      newBeats[trackIndex][stepIndex] = !newBeats[trackIndex][stepIndex];
      
      // Play sound when toggling on
      if (newBeats[trackIndex][stepIndex]) {
        trackSounds[trackIndex]();
        gameAudio.playClick();
      }
      
      // Calculate score based on pattern complexity
      const activeBeats = newBeats.flat().filter(Boolean).length;
      setScore(activeBeats * 5);
      
      return newBeats;
    });
  };

  const handleComplete = async () => {
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    
    // Restore background music volume with slower fade
    if (backgroundMusic) {
      await backgroundMusic.restoreVolume(1500);
    }
    
    // Bonus for creating rhythmic patterns
    const patternBonus = beats.some(track => 
      track.filter(Boolean).length >= 2
    ) ? 50 : 0;
    
    gameAudio.playSuccess();
    onComplete(score + patternBonus);
  };

  const handleClose = async () => {
    // Restore background music volume before closing with slower fade
    if (backgroundMusic) {
      await backgroundMusic.restoreVolume(1500);
    }
    onClose();
  };

  return (
    <Card className="w-full max-w-4xl bg-gray-900 border-gray-600 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🥁 Beat Making Challenge</h2>
        <p className="text-gray-300">Create a sick beat pattern!</p>
        <div className="flex justify-between items-center mt-4">
          <div className="text-yellow-400 font-bold">Score: {score}</div>
          <div className="text-red-400 font-bold">Time: {timeLeft}s</div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {beats.map((track, trackIndex) => (
          <div key={trackIndex} className="flex items-center gap-2">
            <div className={`w-16 text-center py-2 rounded text-white font-bold ${trackColors[trackIndex]}`}>
              {trackNames[trackIndex]}
            </div>
            <div className="flex gap-1">
              {track.map((isActive, stepIndex) => (
                <Button
                  key={stepIndex}
                  onClick={() => toggleBeat(trackIndex, stepIndex)}
                  className={`w-12 h-12 transition-all duration-150 ${
                    isActive 
                      ? `${trackColors[trackIndex]} shadow-lg scale-110` 
                      : 'bg-gray-700 hover:bg-gray-600'
                  } ${currentStep === stepIndex && isPlaying ? 'ring-2 ring-white animate-pulse' : ''}`}
                >
                  {stepIndex + 1}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`px-6 py-3 ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isPlaying ? '⏸️ Stop' : '▶️ Play'}
        </Button>
        <Button onClick={handleComplete} className="px-6 py-3 bg-blue-600 hover:bg-blue-700">
          🎵 Finish Beat
        </Button>
        <Button onClick={handleClose} variant="outline" className="px-6 py-3">
          Cancel
        </Button>
      </div>
    </Card>
  );
};
