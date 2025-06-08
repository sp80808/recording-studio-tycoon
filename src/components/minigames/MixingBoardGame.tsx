import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

interface Track {
  id: string;
  name: string;
  targetVolume: number;
  currentVolume: number;
  color: string;
  targetZoneStart: number;
  targetZoneEnd: number;
  isInTargetZone: boolean;
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
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const containerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const initializeTracks = useCallback(() => {
    const trackNames = ['Drums', 'Bass', 'Vocals', 'Synths'];
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'];
    
    const newTracks: Track[] = trackNames.map((name, index) => {
      const targetVolume = Math.floor(Math.random() * 60) + 20; // 20-80 range
      const zoneSize = 15; // Size of target zone
      const targetZoneStart = Math.max(0, targetVolume - zoneSize/2);
      const targetZoneEnd = Math.min(100, targetVolume + zoneSize/2);
      
      return {
        id: index.toString(),
        name,
        targetVolume,
        currentVolume: 50,
        color: colors[index],
        targetZoneStart,
        targetZoneEnd,
        isInTargetZone: false
      };
    });

    setTracks(newTracks);
  }, []);

  const startGame = useCallback(() => {
    setGameActive(true);
    setGameStarted(true);
    setGameCompleted(false);
    setTimeLeft(15);
    initializeTracks();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initializeTracks]);

  const completeGame = useCallback(() => {
    if (gameCompleted) return; // Prevent double completion
    
    setGameCompleted(true);
    setGameActive(false);
    
    const correctTracks = tracks.filter(track => track.isInTargetZone).length;
    const scoreMultiplier = correctTracks === tracks.length ? 20 : 
                          correctTracks >= tracks.length / 2 ? 10 : 5;
    const finalScore = correctTracks * scoreMultiplier;
    
    console.log(`Mixing game complete! Correct tracks: ${correctTracks}/${tracks.length}, Score: ${finalScore}`);
    setTimeout(() => onComplete(finalScore), 500);
  }, [tracks, onComplete, gameCompleted]);

  // Complete game when time runs out
  useEffect(() => {
    if (gameStarted && !gameActive && timeLeft === 0 && !gameCompleted) {
      completeGame();
    }
  }, [gameStarted, gameActive, timeLeft, gameCompleted, completeGame]);

  const updateTrackVolume = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const isInTargetZone = volume >= track.targetZoneStart && volume <= track.targetZoneEnd;
        return { 
          ...track, 
          currentVolume: volume,
          isInTargetZone
        };
      }
      return track;
    }));
  };

  const handleBarClick = (trackId: string, event: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRefs.current[trackId];
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    const containerHeight = rect.height;
    const newVolume = Math.max(0, Math.min(100, 100 - (clickY / containerHeight) * 100));
    
    updateTrackVolume(trackId, Math.round(newVolume));
  };

  const handleMouseDown = (trackId: string) => {
    setIsDragging(trackId);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const container = containerRefs.current[isDragging];
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;
    const containerHeight = rect.height;
    const newVolume = Math.max(0, Math.min(100, 100 - (mouseY / containerHeight) * 100));
    
    updateTrackVolume(isDragging, Math.round(newVolume));
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging]);

  const getSliderStyle = (track: Track) => {
    return track.isInTargetZone ? 'accent-green-500' : 'accent-gray-500';
  };

  const handleSubmitEarly = () => {
    if (gameActive && !gameCompleted) {
      completeGame();
    }
  };

  return (
    <Card className="p-6 bg-gray-900/95 border-blue-500/50 text-white max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">🎛️ Mixing Balance Challenge</h3>
        <p className="text-gray-300">Get each track's level into the green target zone!</p>
        
        {gameStarted && !gameCompleted && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
              ⏱️ {timeLeft}s
            </div>
            {gameActive && (
              <Button 
                onClick={handleSubmitEarly}
                className="bg-green-600 hover:bg-green-700 text-sm px-4 py-2"
              >
                Submit Mix
              </Button>
            )}
          </div>
        )}
      </div>

      {!gameStarted ? (
        <div className="text-center space-y-4">
          <p className="text-gray-300">
            You have 15 seconds to position each track's volume slider within its target zone.
            The zone will light up green when you're in the right spot! You can submit early if you're confident.
          </p>
          <Button onClick={startGame} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
            Start Mixing Challenge
          </Button>
        </div>
      ) : gameCompleted || (!gameActive && timeLeft === 0) ? (
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-yellow-400">Mixing Complete!</div>
          <div className="space-y-2">
            <div className="text-lg">
              Tracks in Target Zone: {tracks.filter(t => t.isInTargetZone).length}/{tracks.length}
            </div>
            {tracks.filter(t => t.isInTargetZone).length === tracks.length && (
              <div className="text-green-400 font-bold text-xl">🎉 Perfect Mix!</div>
            )}
          </div>
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
            Collect Rewards
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tracks.map(track => (
            <Card key={track.id} className="p-4 bg-gray-800 border-gray-600 relative">
              <div className="text-center mb-4">
                <div className={`w-6 h-6 rounded-full ${track.color} mx-auto mb-2`}></div>
                <h4 className="font-bold text-lg">{track.name}</h4>
                <div className="text-xs text-gray-400 mt-1">
                  Target: {Math.round(track.targetZoneStart)}-{Math.round(track.targetZoneEnd)}
                </div>
              </div>

              {/* Enhanced Visual Level Display */}
              <div 
                className="relative mb-4 h-40 bg-gray-700 rounded-lg overflow-hidden cursor-pointer select-none"
                ref={el => containerRefs.current[track.id] = el}
                onClick={(e) => handleBarClick(track.id, e)}
                onMouseMove={handleMouseMove}
                onMouseDown={() => handleMouseDown(track.id)}
              >
                {/* Target zone highlight with label */}
                <div 
                  className="absolute w-full bg-green-500/30 border-2 border-green-400"
                  style={{
                    top: `${100 - track.targetZoneEnd}%`,
                    height: `${track.targetZoneEnd - track.targetZoneStart}%`
                  }}
                >
                  <div className="text-xs text-green-300 p-1 font-bold text-center">
                    TARGET ({Math.round(track.targetZoneStart)}-{Math.round(track.targetZoneEnd)})
                  </div>
                </div>
                
                {/* Current level indicator */}
                <div 
                  className={`absolute w-full transition-all duration-200 ${
                    track.isInTargetZone ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  style={{
                    bottom: '0',
                    height: `${track.currentVolume}%`
                  }}
                />
                
                {/* Draggable handle */}
                <div 
                  className={`absolute w-full h-2 transition-all duration-200 cursor-grab ${
                    isDragging === track.id ? 'cursor-grabbing' : ''
                  } ${track.isInTargetZone ? 'bg-green-200' : 'bg-red-200'}`}
                  style={{
                    bottom: `${track.currentVolume}%`,
                    transform: 'translateY(50%)'
                  }}
                />
                
                {/* Volume scale */}
                <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-1 pointer-events-none">
                  <span>100</span>
                  <span>50</span>
                  <span>0</span>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <Slider
                  value={[track.currentVolume]}
                  onValueChange={(value) => updateTrackVolume(track.id, value[0])}
                  max={100}
                  step={1}
                  className={`${getSliderStyle(track)} slider-vertical`}
                  orientation="horizontal"
                />
                
                <div className="text-center">
                  <div className={`text-sm font-bold ${track.isInTargetZone ? 'text-green-400' : 'text-gray-300'}`}>
                    {track.currentVolume}
                  </div>
                  {track.isInTargetZone && (
                    <div className="text-green-400 text-xs font-bold animate-pulse">✓ IN ZONE</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};
