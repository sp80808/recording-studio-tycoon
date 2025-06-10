import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseMinigame } from './BaseMinigame';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

interface Track {
  id: number;
  name: string;
  level: number;
  pan: number;
  isBounced: boolean;
  bounceTarget?: number;
}

interface FourTrackRecordingGameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
}

export const FourTrackRecordingGame: React.FC<FourTrackRecordingGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose
}) => {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 1, name: 'Track 1', level: 0, pan: 0, isBounced: false },
    { id: 2, name: 'Track 2', level: 0, pan: 0, isBounced: false },
    { id: 3, name: 'Track 3', level: 0, pan: 0, isBounced: false },
    { id: 4, name: 'Track 4', level: 0, pan: 0, isBounced: false }
  ]);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { playSound } = useSound();

  // Generate target levels based on difficulty
  const targetLevels = React.useMemo(() => {
    return tracks.map(() => Math.random() * 0.8 + 0.2);
  }, [difficulty]);

  // Handle track selection
  const handleTrackSelect = useCallback((trackId: number) => {
    setSelectedTrack(trackId);
    playSound('click');
  }, [playSound]);

  // Handle level adjustment
  const handleLevelChange = useCallback((trackId: number, level: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, level } : track
    ));
  }, []);

  // Handle pan adjustment
  const handlePanChange = useCallback((trackId: number, pan: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, pan } : track
    ));
  }, []);

  // Handle track bouncing
  const handleBounce = useCallback((sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;
    
    setTracks(prev => prev.map(track => {
      if (track.id === sourceId) {
        return { ...track, isBounced: true, bounceTarget: targetId };
      }
      if (track.id === targetId) {
        return { ...track, level: Math.min(1, track.level + prev.find(t => t.id === sourceId)!.level) };
      }
      return track;
    }));
    
    playSound('bounce');
  }, [playSound]);

  // Calculate score based on level accuracy
  const calculateScore = useCallback(() => {
    const levelAccuracy = tracks.reduce((acc, track, index) => {
      const diff = Math.abs(track.level - targetLevels[index]);
      return acc + (1 - diff);
    }, 0) / tracks.length;

    const bouncePenalty = tracks.filter(t => t.isBounced).length * 0.1;
    const finalScore = Math.max(0, Math.min(100, (levelAccuracy - bouncePenalty) * 100));
    
    return Math.round(finalScore);
  }, [tracks, targetLevels]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const finalScore = calculateScore();
          setScore(finalScore);
          onComplete(finalScore);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, calculateScore, onComplete]);

  // Start game
  const startGame = useCallback(() => {
    setIsPlaying(true);
    playSound('start');
  }, [playSound]);

  return (
    <BaseMinigame
      type="four_track_recording"
      difficulty={difficulty}
      onComplete={onComplete}
      onFail={onFail}
      onClose={onClose}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-xl font-bold">
          Four Track Recording Challenge
        </div>
        
        <div className="text-lg">
          Time Remaining: {timeRemaining}s
        </div>

        {!isPlaying ? (
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Start Recording
          </motion.button>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
            {tracks.map(track => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-lg border-2",
                  selectedTrack === track.id ? "border-primary" : "border-border",
                  track.isBounced && "opacity-50"
                )}
                onClick={() => handleTrackSelect(track.id)}
              >
                <div className="font-bold mb-2">{track.name}</div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm">Level</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={track.level}
                      onChange={(e) => handleLevelChange(track.id, parseFloat(e.target.value))}
                      className="w-full"
                      disabled={track.isBounced}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm">Pan</label>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={track.pan}
                      onChange={(e) => handlePanChange(track.id, parseFloat(e.target.value))}
                      className="w-full"
                      disabled={track.isBounced}
                    />
                  </div>
                </div>

                {!track.isBounced && selectedTrack && selectedTrack !== track.id && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handleBounce(selectedTrack, track.id)}
                    className="mt-2 px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                  >
                    Bounce to Track {track.id}
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {score > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold"
          >
            Final Score: {score}
          </motion.div>
        )}
      </div>
    </BaseMinigame>
  );
};
