import React, { useState, useEffect } from 'react';
import { useMiniGame } from '@/contexts/MiniGameContext';
import { Button } from '@/components/ui/button';

interface Microphone {
  id: string;
  type: 'condenser' | 'dynamic' | 'ribbon';
  x: number;
  y: number;
  angle: number;
}

interface Instrument {
  id: string;
  name: string;
  type: 'guitar' | 'drums' | 'vocals' | 'piano';
  x: number;
  y: number;
  optimalPlacements: {
    type: 'condenser' | 'dynamic' | 'ribbon';
    distance: number;
    angle: number;
  }[];
}

const INSTRUMENTS: Instrument[] = [
  {
    id: 'acoustic_guitar',
    name: 'Acoustic Guitar',
    type: 'guitar',
    x: 400,
    y: 300,
    optimalPlacements: [
      {
        type: 'condenser',
        distance: 30,
        angle: 45,
      },
      {
        type: 'ribbon',
        distance: 40,
        angle: 90,
      },
    ],
  },
  {
    id: 'drum_kit',
    name: 'Drum Kit',
    type: 'drums',
    x: 400,
    y: 300,
    optimalPlacements: [
      {
        type: 'condenser',
        distance: 60,
        angle: 0,
      },
      {
        type: 'dynamic',
        distance: 20,
        angle: 45,
      },
    ],
  },
  {
    id: 'vocalist',
    name: 'Vocalist',
    type: 'vocals',
    x: 400,
    y: 300,
    optimalPlacements: [
      {
        type: 'condenser',
        distance: 20,
        angle: 0,
      },
    ],
  },
  {
    id: 'grand_piano',
    name: 'Grand Piano',
    type: 'piano',
    x: 400,
    y: 300,
    optimalPlacements: [
      {
        type: 'condenser',
        distance: 50,
        angle: 45,
      },
      {
        type: 'ribbon',
        distance: 40,
        angle: 90,
      },
    ],
  },
];

export const MicrophonePlacement: React.FC = () => {
  const { currentGame, endGame } = useMiniGame();
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>(INSTRUMENTS[0]);
  const [microphones, setMicrophones] = useState<Microphone[]>([]);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [accuracy, setAccuracy] = useState<number>(0);

  // Initialize game
  useEffect(() => {
    setMicrophones([]);
    setScore(0);
    setTimeLeft(120);
  }, [selectedInstrument]);

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

  const addMicrophone = (type: 'condenser' | 'dynamic' | 'ribbon') => {
    if (microphones.length >= 3) return;

    const newMic: Microphone = {
      id: `mic_${Date.now()}`,
      type,
      x: selectedInstrument.x + 50,
      y: selectedInstrument.y + 50,
      angle: 0,
    };

    setMicrophones(prev => [...prev, newMic]);
  };

  const moveMicrophone = (id: string, x: number, y: number) => {
    setMicrophones(prev =>
      prev.map(mic =>
        mic.id === id
          ? {
              ...mic,
              x,
              y,
              angle: Math.atan2(y - selectedInstrument.y, x - selectedInstrument.x) * (180 / Math.PI),
            }
          : mic
      )
    );
  };

  const calculateAccuracy = () => {
    let totalAccuracy = 0;
    let validPlacements = 0;

    microphones.forEach(mic => {
      const distance = Math.sqrt(
        Math.pow(mic.x - selectedInstrument.x, 2) + Math.pow(mic.y - selectedInstrument.y, 2)
      );

      const optimalPlacement = selectedInstrument.optimalPlacements.find(p => p.type === mic.type);
      if (optimalPlacement) {
        const distanceAccuracy = Math.max(
          0,
          100 - Math.abs(distance - optimalPlacement.distance) * 5
        );
        const angleAccuracy = Math.max(
          0,
          100 - Math.abs(mic.angle - optimalPlacement.angle) * 2
        );

        totalAccuracy += (distanceAccuracy + angleAccuracy) / 2;
        validPlacements++;
      }
    });

    const finalAccuracy = validPlacements > 0 ? totalAccuracy / validPlacements : 0;
    setAccuracy(finalAccuracy);

    if (finalAccuracy >= 90) {
      setScore(prev => prev + 100);
      const nextInstrument = INSTRUMENTS[(INSTRUMENTS.indexOf(selectedInstrument) + 1) % INSTRUMENTS.length];
      setSelectedInstrument(nextInstrument);
      setMicrophones([]);
    }
  };

  useEffect(() => {
    calculateAccuracy();
  }, [microphones]);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-xl font-bold">Microphone Placement</div>
      <div className="flex justify-between w-full max-w-md">
        <div>Time: {timeLeft}s</div>
        <div>Score: {score}</div>
        <div>Accuracy: {Math.round(accuracy)}%</div>
      </div>

      <div className="relative w-full max-w-2xl h-[400px] border border-gray-300 rounded-lg">
        {/* Instrument */}
        <div
          className="absolute w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white"
          style={{
            left: selectedInstrument.x - 8,
            top: selectedInstrument.y - 8,
          }}
        >
          {selectedInstrument.name}
        </div>

        {/* Microphones */}
        {microphones.map(mic => (
          <div
            key={mic.id}
            className="absolute w-8 h-8 bg-red-500 rounded-full cursor-move"
            style={{
              left: mic.x - 4,
              top: mic.y - 4,
              transform: `rotate(${mic.angle}deg)`,
            }}
            draggable
            onDragEnd={e => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                moveMicrophone(
                  mic.id,
                  e.clientX - rect.left,
                  e.clientY - rect.top
                );
              }
            }}
          />
        ))}
      </div>

      <div className="flex gap-4">
        <Button onClick={() => addMicrophone('condenser')}>Add Condenser</Button>
        <Button onClick={() => addMicrophone('dynamic')}>Add Dynamic</Button>
        <Button onClick={() => addMicrophone('ribbon')}>Add Ribbon</Button>
      </div>

      <Button onClick={() => endGame(score)} className="mt-4">
        End Game
      </Button>
    </div>
  );
}; 