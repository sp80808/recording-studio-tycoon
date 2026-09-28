
import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { gameAudio } from '@/utils/audioSystem';
import { triggerProjectCompleteJuice } from '@/utils/confettiJuice';

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
  const gameIntervalRef = useRef<NodeJS.Timeout>();
  const beatsRef = useRef(beats);
  beatsRef.current = beats;

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
      if (backgroundMusic) {
        await backgroundMusic.fadeVolume(0.2, 1500);
      }
    };
    initAudio();

    return () => {
      Tone.getTransport().stop();
      if (backgroundMusic) {
        backgroundMusic.restoreVolume(1500);
      }
    };
  }, [backgroundMusic]);

  // Tone.js Transport-backed drift-free step sequencer
  useEffect(() => {
    let repeatId: number | null = null;

    if (isPlaying) {
      void gameAudio.playTactileClick();
      if (Tone.getContext().state !== 'running') {
        void Tone.start();
      }

      Tone.getTransport().bpm.value = 120;
      let stepCounter = 0;

      repeatId = Tone.getTransport().scheduleRepeat((time) => {
        const step = stepCounter % 8;
        stepCounter++;

        Tone.getDraw().schedule(() => {
          setCurrentStep(step);
        }, time);

        const currentBeats = beatsRef.current;
        currentBeats.forEach((track, trackIndex) => {
          if (track[step]) {
            trackSounds[trackIndex]();
          }
        });
      }, '8n');

      Tone.getTransport().start();
    } else {
      Tone.getTransport().stop();
      if (repeatId !== null) {
        Tone.getTransport().clear(repeatId);
      }
    }

    return () => {
      Tone.getTransport().stop();
      if (repeatId !== null) {
        Tone.getTransport().clear(repeatId);
      }
    };
  }, [isPlaying]);

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
      
      // Play sound and tactile feedback when toggling
      if (newBeats[trackIndex][stepIndex]) {
        trackSounds[trackIndex]();
        void gameAudio.playTactileClick(0.7);
      } else {
        void gameAudio.playTactileClick(0.4);
      }
      
      // Calculate score based on pattern complexity
      const activeBeats = newBeats.flat().filter(Boolean).length;
      setScore(activeBeats * 5);
      
      return newBeats;
    });
  };

  const handleComplete = async () => {
    setIsPlaying(false);
    Tone.getTransport().stop();
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    
    if (backgroundMusic) {
      await backgroundMusic.restoreVolume(1500);
    }
    
    const patternBonus = beats.some(track => 
      track.filter(Boolean).length >= 2
    ) ? 50 : 0;
    
    gameAudio.playSuccess();
    triggerProjectCompleteJuice();
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
    <Card className="w-full max-w-4xl mx-auto bg-gray-800 text-white border-gray-700">
      <MinigameChrome title="🥁 Beat Making Challenge" score={score} timeLeft={timeLeft} accent="yellow">
      <CardContent>
        <p className="text-center text-sm text-gray-300">Create a sick beat pattern!</p>

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
                      ? `${trackColors[trackIndex]} shadow-lg mg-perfect-pop scale-110` 
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

      </CardContent>
      </MinigameChrome>
      <DialogFooter className="flex flex-wrap gap-3 p-4 sm:justify-center">
        <KenneyButton variant={isPlaying ? 'red' : 'green'} onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸️ Stop' : '▶️ Play'}
        </KenneyButton>
        <KenneyButton variant="blue" onClick={handleComplete}>
          🎵 Finish Beat
        </KenneyButton>
        <KenneyButton variant="grey" onClick={handleClose}>
          Cancel
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
