import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';

interface MixingMinigameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty: number;
}

interface Track {
  id: string;
  name: string;
  volume: number;
  pan: number;
  effects: {
    reverb: number;
    delay: number;
    compression: number;
  };
}

export const MixingMinigame: React.FC<MixingMinigameProps> = ({
  onComplete,
  onClose,
  difficulty
}) => {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'vocal', name: 'Vocals', volume: 50, pan: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 'guitar', name: 'Guitar', volume: 50, pan: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 'bass', name: 'Bass', volume: 50, pan: 0, effects: { reverb: 0, delay: 0, compression: 0 } },
    { id: 'drums', name: 'Drums', volume: 50, pan: 0, effects: { reverb: 0, delay: 0, compression: 0 } }
  ]);

  const [timeRemaining, setTimeRemaining] = useState(60);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string>('vocal');

  // Target values for each track (would be randomized based on difficulty)
  const targetValues = {
    vocal: { volume: 75, pan: -10, effects: { reverb: 20, delay: 15, compression: 30 } },
    guitar: { volume: 65, pan: 20, effects: { reverb: 30, delay: 10, compression: 20 } },
    bass: { volume: 70, pan: 0, effects: { reverb: 10, delay: 5, compression: 40 } },
    drums: { volume: 80, pan: 10, effects: { reverb: 15, delay: 5, compression: 50 } }
  };

  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleGameComplete();
    }
  }, [isPlaying, timeRemaining]);

  const calculateScore = useCallback(() => {
    let totalScore = 0;
    tracks.forEach(track => {
      const target = targetValues[track.id as keyof typeof targetValues];
      const volumeDiff = Math.abs(track.volume - target.volume);
      const panDiff = Math.abs(track.pan - target.pan);
      const reverbDiff = Math.abs(track.effects.reverb - target.effects.reverb);
      const delayDiff = Math.abs(track.effects.delay - target.effects.delay);
      const compressionDiff = Math.abs(track.effects.compression - target.effects.compression);

      const trackScore = 100 - (
        (volumeDiff * 0.4) +
        (panDiff * 0.2) +
        (reverbDiff * 0.15) +
        (delayDiff * 0.15) +
        (compressionDiff * 0.1)
      );

      totalScore += Math.max(0, trackScore);
    });

    return Math.round(totalScore / tracks.length);
  }, [tracks]);

  const handleGameComplete = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsPlaying(false);
    gameAudio.playSuccess();
    toast({
      title: "🎵 Mix Complete!",
      description: `Final Score: ${finalScore}/100`,
      duration: 3000
    });
    onComplete(finalScore);
  };

  const handleStart = () => {
    setIsPlaying(true);
    gameAudio.playUISound('start');
  };

  const handleTrackChange = (trackId: string, type: string, value: number) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        if (type === 'volume' || type === 'pan') {
          return { ...track, [type]: value };
        } else {
          return {
            ...track,
            effects: { ...track.effects, [type]: value }
          };
        }
      }
      return track;
    }));
  };

  const selectedTrackData = tracks.find(t => t.id === selectedTrack);
  const targetData = targetValues[selectedTrack as keyof typeof targetValues];

  return (
    <Card className="p-6 bg-gray-800/90 border-gray-600">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Mix Master</h2>
          <div className="text-yellow-400">
            Time: {timeRemaining}s
          </div>
        </div>

        <Progress value={(timeRemaining / 60) * 100} className="h-2" />

        {!isPlaying ? (
          <div className="text-center space-y-4">
            <p className="text-gray-300">
              Balance the mix by adjusting volume, pan, and effects for each track.
              Get as close as possible to the target values!
            </p>
            <Button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Mixing
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {tracks.map(track => (
                <Button
                  key={track.id}
                  onClick={() => setSelectedTrack(track.id)}
                  className={`${
                    selectedTrack === track.id
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {track.name}
                </Button>
              ))}
            </div>

            {selectedTrackData && (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300">Volume</label>
                  <Slider
                    value={[selectedTrackData.volume]}
                    onValueChange={([value]) => handleTrackChange(selectedTrack, 'volume', value)}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Target: {targetData.volume}
                  </div>
                </div>

                <div>
                  <label className="text-gray-300">Pan</label>
                  <Slider
                    value={[selectedTrackData.pan]}
                    onValueChange={([value]) => handleTrackChange(selectedTrack, 'pan', value)}
                    min={-50}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Target: {targetData.pan}
                  </div>
                </div>

                <div>
                  <label className="text-gray-300">Reverb</label>
                  <Slider
                    value={[selectedTrackData.effects.reverb]}
                    onValueChange={([value]) => handleTrackChange(selectedTrack, 'reverb', value)}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Target: {targetData.effects.reverb}
                  </div>
                </div>

                <div>
                  <label className="text-gray-300">Delay</label>
                  <Slider
                    value={[selectedTrackData.effects.delay]}
                    onValueChange={([value]) => handleTrackChange(selectedTrack, 'delay', value)}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Target: {targetData.effects.delay}
                  </div>
                </div>

                <div>
                  <label className="text-gray-300">Compression</label>
                  <Slider
                    value={[selectedTrackData.effects.compression]}
                    onValueChange={([value]) => handleTrackChange(selectedTrack, 'compression', value)}
                    max={100}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    Target: {targetData.effects.compression}
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleGameComplete}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Complete Mix
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}; 