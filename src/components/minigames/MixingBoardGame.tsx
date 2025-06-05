
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface Track {
  id: string;
  name: string;
  targetVolume: number;
  currentVolume: number;
  targetEQ: { low: number; mid: number; high: number };
  currentEQ: { low: number; mid: number; high: number };
  color: string;
}

interface MixingBoardGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const MixingBoardGame: React.FC<MixingBoardGameProps> = ({
  onComplete,
  onClose
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameActive, setGameActive] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState(0);

  const initializeTracks = useCallback(() => {
    const trackNames = ['Drums', 'Bass', 'Guitar', 'Vocals'];
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    
    const newTracks: Track[] = trackNames.map((name, index) => ({
      id: index.toString(),
      name,
      targetVolume: Math.floor(Math.random() * 70) + 30,
      currentVolume: 50,
      targetEQ: {
        low: Math.floor(Math.random() * 20) - 10,
        mid: Math.floor(Math.random() * 20) - 10,
        high: Math.floor(Math.random() * 20) - 10,
      },
      currentEQ: { low: 0, mid: 0, high: 0 },
      color: colors[index]
    }));

    setTracks(newTracks);
  }, []);

  const startGame = useCallback(() => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(45);
    setCurrentChallenge(1);
    initializeTracks();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          setTimeout(() => onComplete(score), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [score, onComplete, initializeTracks]);

  const updateTrackVolume = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId ? { ...track, currentVolume: volume } : track
    ));
  };

  const updateTrackEQ = (trackId: string, eqType: 'low' | 'mid' | 'high', value: number) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId 
        ? { ...track, currentEQ: { ...track.currentEQ, [eqType]: value } }
        : track
    ));
  };

  const checkMix = useCallback(() => {
    let totalAccuracy = 0;
    
    tracks.forEach(track => {
      const volumeAccuracy = Math.max(0, 100 - Math.abs(track.targetVolume - track.currentVolume) * 2);
      const eqAccuracy = (
        Math.max(0, 100 - Math.abs(track.targetEQ.low - track.currentEQ.low) * 5) +
        Math.max(0, 100 - Math.abs(track.targetEQ.mid - track.currentEQ.mid) * 5) +
        Math.max(0, 100 - Math.abs(track.targetEQ.high - track.currentEQ.high) * 5)
      ) / 3;
      
      totalAccuracy += (volumeAccuracy + eqAccuracy) / 2;
    });

    const averageAccuracy = totalAccuracy / tracks.length;
    const challengeScore = Math.floor(averageAccuracy * 10);
    
    setScore(prev => prev + challengeScore);
    
    if (averageAccuracy > 80) {
      setCurrentChallenge(prev => prev + 1);
      initializeTracks();
    }
  }, [tracks, initializeTracks]);

  const getAccuracy = (target: number, current: number, multiplier: number = 2) => {
    return Math.max(0, 100 - Math.abs(target - current) * multiplier);
  };

  return (
    <Card className="p-6 bg-gray-900/95 border-blue-500/50 text-white max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2">🎛️ Mixing Board Challenge</h3>
        <div className="flex justify-between items-center">
          <div>Score: <span className="text-blue-400 font-bold">{score}</span></div>
          <div>Challenge: <span className="text-green-400 font-bold">{currentChallenge}</span></div>
          <div>Time: <span className="text-red-400 font-bold">{timeLeft}s</span></div>
        </div>
      </div>

      {!gameActive && timeLeft === 45 ? (
        <div className="text-center">
          <p className="mb-4 text-gray-300">Match the target levels for each track's volume and EQ!</p>
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700">
            Start Mixing Challenge
          </Button>
        </div>
      ) : !gameActive && timeLeft === 0 ? (
        <div className="text-center space-y-2">
          <div className="text-lg font-bold text-yellow-400">Mixing Complete!</div>
          <div className="text-sm text-gray-300">Final Score: {score}</div>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            Collect Rewards
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tracks.map(track => (
              <Card key={track.id} className="p-4 bg-gray-800 border-gray-600">
                <div className="text-center mb-3">
                  <div className={`w-4 h-4 rounded-full ${track.color} mx-auto mb-2`}></div>
                  <h4 className="font-bold">{track.name}</h4>
                </div>

                {/* Volume */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Volume</span>
                    <span className="text-green-400">Target: {track.targetVolume}</span>
                  </div>
                  <Slider
                    value={[track.currentVolume]}
                    onValueChange={(value) => updateTrackVolume(track.id, value[0])}
                    max={100}
                    step={1}
                    className="mb-1"
                  />
                  <div className="text-xs text-center text-gray-400">{track.currentVolume}</div>
                  <div className="text-xs text-center">
                    Accuracy: {Math.floor(getAccuracy(track.targetVolume, track.currentVolume))}%
                  </div>
                </div>

                {/* EQ */}
                <div className="space-y-2">
                  {(['low', 'mid', 'high'] as const).map(eqType => (
                    <div key={eqType}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize">{eqType}</span>
                        <span className="text-green-400">Target: {track.targetEQ[eqType]}</span>
                      </div>
                      <Slider
                        value={[track.currentEQ[eqType]]}
                        onValueChange={(value) => updateTrackEQ(track.id, eqType, value[0])}
                        min={-10}
                        max={10}
                        step={1}
                        className="mb-1"
                      />
                      <div className="text-xs text-center text-gray-400">{track.currentEQ[eqType]}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button onClick={checkMix} className="bg-purple-600 hover:bg-purple-700">
              Check Mix & Next Challenge
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
