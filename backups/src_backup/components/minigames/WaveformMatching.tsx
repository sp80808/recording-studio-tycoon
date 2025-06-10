import React, { useState, useEffect } from 'react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { WaveformProps, WaveformType } from '@/types/miniGame';
import { useMiniGame } from '@/contexts/MiniGameContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';

const WAVEFORM_TYPES: WaveformType[] = ['sine', 'square', 'triangle'];

export const WaveformMatching: React.FC = () => {
  const { currentGame, endGame } = useMiniGame();
  const [target, setTarget] = useState<WaveformProps>({
    type: 'sine',
    frequency: 1,
    amplitude: 1,
    phase: 0,
  });
  const [current, setCurrent] = useState<WaveformProps>({
    type: 'sine',
    frequency: 1,
    amplitude: 1,
    phase: 0,
  });
  const [accuracy, setAccuracy] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);

  // Generate new target waveform
  const generateTarget = () => {
    const type = WAVEFORM_TYPES[Math.floor(Math.random() * WAVEFORM_TYPES.length)];
    const frequency = 0.5 + Math.random() * 2;
    const amplitude = 0.5 + Math.random() * 1.5;
    const phase = Math.random() * Math.PI * 2;

    setTarget({ type, frequency, amplitude, phase });
    setCurrent({ type, frequency: 1, amplitude: 1, phase: 0 });
  };

  // Initialize game
  useEffect(() => {
    generateTarget();
  }, []);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      endGame(score);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, score, endGame]);

  // Handle accuracy updates
  const handleAccuracyUpdate = (newAccuracy: number) => {
    setAccuracy(newAccuracy);
    if (newAccuracy >= 95) {
      setScore(prev => prev + 100);
      generateTarget();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xl font-bold">Waveform Matching</div>
      <div className="flex justify-between w-full max-w-md">
        <div>Time: {timeLeft}s</div>
        <div>Score: {score}</div>
        <div>Accuracy: {accuracy}%</div>
      </div>

      <div className="w-full max-w-2xl">
        <WaveformVisualizer
          target={target}
          current={current}
          width={800}
          height={200}
          onMatch={handleAccuracyUpdate}
        />
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <div>
          <label>Waveform Type</label>
          <Select
            value={current.type}
            onValueChange={(value: WaveformType) =>
              setCurrent(prev => ({ ...prev, type: value }))
            }
          >
            {WAVEFORM_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label>Frequency</label>
          <Slider
            value={[current.frequency]}
            min={0.1}
            max={3}
            step={0.1}
            onValueChange={([value]) =>
              setCurrent(prev => ({ ...prev, frequency: value }))
            }
          />
        </div>

        <div>
          <label>Amplitude</label>
          <Slider
            value={[current.amplitude]}
            min={0.1}
            max={2}
            step={0.1}
            onValueChange={([value]) =>
              setCurrent(prev => ({ ...prev, amplitude: value }))
            }
          />
        </div>

        <div>
          <label>Phase</label>
          <Slider
            value={[current.phase]}
            min={0}
            max={Math.PI * 2}
            step={0.1}
            onValueChange={([value]) =>
              setCurrent(prev => ({ ...prev, phase: value }))
            }
          />
        </div>
      </div>

      <Button
        onClick={() => endGame(score)}
        className="mt-4"
      >
        End Game
      </Button>
    </div>
  );
}; 