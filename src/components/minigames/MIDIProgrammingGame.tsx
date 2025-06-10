/**
 * @fileoverview MIDI Programming Minigame - Digital Revolution Era (1980s-1990s)
 * @version 0.3.0
 * @author Recording Studio Tycoon Development Team
 * @created 2025-01-19
 * @modified 2025-01-19
 * 
 * Era-specific minigame simulating MIDI programming and editing.
 * Players must program MIDI sequences with correct timing, velocity, and note selection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BaseMinigame } from './BaseMinigame';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

interface Note {
  pitch: number;
  velocity: number;
  startStep: number;
  duration: number;
}

interface Track {
  id: number;
  name: string;
  notes: Note[];
  isMuted: boolean;
  isSolo: boolean;
}

interface MIDIProgrammingGameProps {
  difficulty: number;
  onComplete: (score: number) => void;
  onFail: () => void;
  onClose: () => void;
}

const GRID_SIZE = 16;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [3, 4, 5];
const NOTE_LENGTHS = [1, 2, 4, 8]; // Quarter, half, whole, double whole notes

export const MIDIProgrammingGame: React.FC<MIDIProgrammingGameProps> = ({
  difficulty,
  onComplete,
  onFail,
  onClose
}) => {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 1, name: 'Bass', notes: [], isMuted: false, isSolo: false },
    { id: 2, name: 'Lead', notes: [], isMuted: false, isSolo: false },
    { id: 3, name: 'Pad', notes: [], isMuted: false, isSolo: false },
    { id: 4, name: 'Drums', notes: [], isMuted: false, isSolo: false }
  ]);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [score, setScore] = useState(0);
  const [selectedPitch, setSelectedPitch] = useState(60); // Middle C
  const [selectedLength, setSelectedLength] = useState(1);
  const [selectedVelocity, setSelectedVelocity] = useState(0.8);
  const { playSound } = useSound();

  // Generate target pattern based on difficulty
  const targetPattern = React.useMemo(() => {
    return tracks.map(() => {
      const notes: Note[] = [];
      const numNotes = Math.floor(Math.random() * 8) + 4; // 4-12 notes per track
      
      for (let i = 0; i < numNotes; i++) {
        const pitch = Math.floor(Math.random() * 12) + (OCTAVES[1] * 12); // Middle octave
        const velocity = Math.random() * 0.5 + 0.5; // 0.5-1.0
        const startStep = Math.floor(Math.random() * GRID_SIZE);
        const duration = Math.floor(Math.random() * 4) + 1; // 1-4 steps
        
        notes.push({ pitch, velocity, startStep, duration });
      }
      
      return notes;
    });
  }, [difficulty]);

  // Playback effect
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % GRID_SIZE);
    }, 250); // 120 BPM

    return () => clearInterval(interval);
  }, [isPlaying]);

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
  }, [isPlaying, onComplete]);

  // Handle track selection
  const handleTrackSelect = useCallback((trackId: number) => {
    setSelectedTrack(trackId);
    playSound('click');
  }, [playSound]);

  // Handle note placement with length
  const handleNotePlace = useCallback((trackId: number, step: number) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        // Remove any existing notes that would overlap
        const filteredNotes = track.notes.filter(note => 
          !(note.startStep <= step && step < note.startStep + note.duration) &&
          !(step <= note.startStep && note.startStep < step + selectedLength)
        );
        
        // Add new note
        return {
          ...track,
          notes: [...filteredNotes, {
            pitch: selectedPitch,
            velocity: selectedVelocity,
            startStep: step,
            duration: selectedLength
          }]
        };
      }
      return track;
    }));
    playSound('note');
  }, [selectedPitch, selectedLength, selectedVelocity, playSound]);

  // Handle note removal
  const handleNoteRemove = useCallback((trackId: number, step: number) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          notes: track.notes.filter(note => 
            !(note.startStep <= step && step < note.startStep + note.duration)
          )
        };
      }
      return track;
    }));
    playSound('delete');
  }, [playSound]);

  // Handle mute/solo
  const handleMuteToggle = useCallback((trackId: number) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const newMute = !track.isMuted;
        return { ...track, isMuted: newMute, isSolo: newMute ? false : track.isSolo };
      }
      return track;
    }));
    playSound('mute');
  }, [playSound]);

  const handleSoloToggle = useCallback((trackId: number) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const newSolo = !track.isSolo;
        return { ...track, isSolo: newSolo, isMuted: newSolo ? false : track.isMuted };
      }
      return track;
    }));
    playSound('solo');
  }, [playSound]);

  // Handle pitch selection
  const handlePitchSelect = useCallback((pitch: number) => {
    setSelectedPitch(pitch);
    playSound('click');
  }, [playSound]);

  // Handle length selection
  const handleLengthSelect = useCallback((length: number) => {
    setSelectedLength(length);
    playSound('click');
  }, [playSound]);

  // Handle velocity change
  const handleVelocityChange = useCallback((velocity: number) => {
    setSelectedVelocity(velocity);
  }, []);

  // Calculate score based on pattern accuracy
  const calculateScore = useCallback(() => {
    const trackScores = tracks.map((track, index) => {
      const target = targetPattern[index];
      
      // Calculate note accuracy
      const noteScores = track.notes.map(note => {
        const matchingTarget = target.find(t => 
          t.pitch === note.pitch && 
          t.startStep === note.startStep && 
          t.duration === note.duration
        );
        
        if (matchingTarget) {
          const velocityAccuracy = 1 - Math.abs(note.velocity - matchingTarget.velocity);
          return velocityAccuracy;
        }
        return 0;
      });

      // Calculate missing notes penalty
      const missingNotes = target.filter(t => 
        !track.notes.some(n => 
          n.pitch === t.pitch && 
          n.startStep === t.startStep && 
          n.duration === t.duration
        )
      ).length;

      const averageNoteScore = noteScores.reduce((acc, score) => acc + score, 0) / 
        (noteScores.length || 1);
      const missingNotesPenalty = missingNotes * 0.1;

      return Math.max(0, averageNoteScore - missingNotesPenalty);
    });

    const averageScore = trackScores.reduce((acc, score) => acc + score, 0) / tracks.length;
    return Math.max(0, Math.min(100, averageScore * 100));
  }, [tracks, targetPattern]);

  // Start game
  const startGame = useCallback(() => {
    setIsPlaying(true);
    playSound('start');
  }, [playSound]);

  const getNoteName = (pitch: number) => {
    const noteIndex = pitch % 12;
    const octave = Math.floor(pitch / 12);
    return `${NOTE_NAMES[noteIndex]}${octave}`;
  };

  return (
    <BaseMinigame
      type="midi_programming"
      difficulty={difficulty}
      onComplete={onComplete}
      onFail={onFail}
      onClose={onClose}
    >
      <div className="flex flex-col items-center gap-4 p-4">
        <div className="text-xl font-bold">
          MIDI Programming Challenge
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
            Start Programming
          </motion.button>
        ) : (
          <div className="w-full max-w-4xl space-y-4">
            {/* Pitch Selection */}
            <div className="flex flex-wrap gap-2 p-2 bg-secondary/20 rounded-lg">
              {OCTAVES.map(octave => 
                NOTE_NAMES.map((noteName, noteIndex) => {
                  const pitch = (octave + 1) * 12 + noteIndex;
                  return (
                    <button
                      key={pitch}
                      onClick={() => handlePitchSelect(pitch)}
                      className={cn(
                        "px-2 py-1 rounded text-sm",
                        selectedPitch === pitch
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      {noteName}{octave}
                    </button>
                  );
                })
              )}
            </div>

            {/* Note Length Selection */}
            <div className="flex gap-2 p-2 bg-secondary/20 rounded-lg">
              {NOTE_LENGTHS.map(length => (
                <button
                  key={length}
                  onClick={() => handleLengthSelect(length)}
                  className={cn(
                    "px-3 py-1 rounded text-sm",
                    selectedLength === length
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {length === 1 ? '♩' : length === 2 ? '♪' : length === 4 ? '♫' : '𝅘𝅥𝅮'}
                </button>
              ))}
            </div>

            {/* Velocity Control */}
            <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-lg">
              <span className="text-sm">Velocity:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedVelocity}
                onChange={(e) => handleVelocityChange(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm">{Math.round(selectedVelocity * 100)}%</span>
            </div>

            {/* Tracks */}
            {tracks.map(track => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-lg border-2",
                  selectedTrack === track.id ? "border-primary" : "border-border",
                  track.isMuted && "opacity-50"
                )}
                onClick={() => handleTrackSelect(track.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold">{track.name}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMuteToggle(track.id);
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-sm",
                        track.isMuted ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      M
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSoloToggle(track.id);
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-sm",
                        track.isSolo ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      )}
                    >
                      S
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-16 gap-1">
                  {Array.from({ length: GRID_SIZE }).map((_, step) => {
                    const note = track.notes.find(n => 
                      n.startStep <= step && step < n.startStep + n.duration
                    );
                    
                    return (
                      <div
                        key={step}
                        className={cn(
                          "aspect-square rounded cursor-pointer",
                          step === currentStep ? "bg-primary/20" : "bg-secondary/20",
                          note ? "bg-primary" : "hover:bg-primary/50"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (note) {
                            handleNoteRemove(track.id, step);
                          } else {
                            handleNotePlace(track.id, step);
                          }
                        }}
                      />
                    );
                  })}
                </div>

                {track.notes.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Notes: {track.notes.map(note => 
                      `${getNoteName(note.pitch)} (${note.duration})`
                    ).join(', ')}
                  </div>
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
