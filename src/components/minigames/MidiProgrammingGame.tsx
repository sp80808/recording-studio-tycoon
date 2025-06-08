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

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Square, RotateCcw, Music, Settings } from 'lucide-react';

interface MidiProgrammingGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

interface MidiNote {
  note: number; // MIDI note number (C4 = 60)
  start: number; // Start position (0-15)
  length: number; // Note length
  velocity: number; // Velocity (0-127)
}

interface TargetSequence {
  notes: MidiNote[];
  name: string;
  difficulty: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const OCTAVES = [3, 4, 5, 6];

const TARGET_SEQUENCES: TargetSequence[] = [
  {
    name: "C Major Scale",
    difficulty: 1,
    notes: [
      { note: 60, start: 0, length: 1, velocity: 80 }, // C4
      { note: 62, start: 2, length: 1, velocity: 80 }, // D4
      { note: 64, start: 4, length: 1, velocity: 80 }, // E4
      { note: 65, start: 6, length: 1, velocity: 80 }, // F4
      { note: 67, start: 8, length: 1, velocity: 80 }, // G4
      { note: 69, start: 10, length: 1, velocity: 80 }, // A4
      { note: 71, start: 12, length: 1, velocity: 80 }, // B4
      { note: 72, start: 14, length: 2, velocity: 100 }, // C5
    ]
  },
  {
    name: "Chord Progression",
    difficulty: 2,
    notes: [
      // C Major chord
      { note: 60, start: 0, length: 4, velocity: 90 }, // C4
      { note: 64, start: 0, length: 4, velocity: 80 }, // E4
      { note: 67, start: 0, length: 4, velocity: 70 }, // G4
      // A Minor chord
      { note: 57, start: 4, length: 4, velocity: 90 }, // A3
      { note: 60, start: 4, length: 4, velocity: 80 }, // C4
      { note: 64, start: 4, length: 4, velocity: 70 }, // E4
      // F Major chord
      { note: 53, start: 8, length: 4, velocity: 90 }, // F3
      { note: 57, start: 8, length: 4, velocity: 80 }, // A3
      { note: 60, start: 8, length: 4, velocity: 70 }, // C4
      // G Major chord
      { note: 55, start: 12, length: 4, velocity: 90 }, // G3
      { note: 59, start: 12, length: 4, velocity: 80 }, // B3
      { note: 62, start: 12, length: 4, velocity: 70 }, // D4
    ]
  },
  {
    name: "Melody + Bass",
    difficulty: 3,
    notes: [
      // Bass line
      { note: 36, start: 0, length: 2, velocity: 100 }, // C2
      { note: 43, start: 4, length: 2, velocity: 90 },  // G2
      { note: 41, start: 8, length: 2, velocity: 90 },  // F2
      { note: 38, start: 12, length: 2, velocity: 90 }, // D2
      // Melody
      { note: 72, start: 1, length: 1, velocity: 80 }, // C5
      { note: 74, start: 3, length: 1, velocity: 85 }, // D5
      { note: 76, start: 5, length: 2, velocity: 90 }, // E5
      { note: 74, start: 9, length: 1, velocity: 80 }, // D5
      { note: 72, start: 11, length: 1, velocity: 85 }, // C5
      { note: 71, start: 13, length: 3, velocity: 100 }, // B4
    ]
  }
];

export const MidiProgrammingGame: React.FC<MidiProgrammingGameProps> = ({ 
  onComplete, 
  onClose 
}) => {
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [userNotes, setUserNotes] = useState<MidiNote[]>([]);
  const [selectedNote, setSelectedNote] = useState(60); // C4
  const [selectedVelocity, setSelectedVelocity] = useState([80]);
  const [selectedLength, setSelectedLength] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [completed, setCompleted] = useState(false);
  const playbackRef = useRef<NodeJS.Timeout>();

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !completed) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleGameEnd();
    }
  }, [timeLeft, completed]);

  // Playback
  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = setInterval(() => {
        setCurrentPosition((prev) => (prev + 1) % 16);
      }, 300); // Slower tempo for MIDI programming
    } else {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying]);

  const getNoteName = (midiNote: number) => {
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    return `${NOTE_NAMES[noteIndex]}${octave}`;
  };

  const handleGridClick = (position: number) => {
    // Check if there's already a note at this position with the same note value
    const existingNoteIndex = userNotes.findIndex(
      note => note.start === position && note.note === selectedNote
    );

    if (existingNoteIndex >= 0) {
      // Remove existing note
      const newNotes = [...userNotes];
      newNotes.splice(existingNoteIndex, 1);
      setUserNotes(newNotes);
    } else {
      // Add new note
      const newNote: MidiNote = {
        note: selectedNote,
        start: position,
        length: selectedLength,
        velocity: selectedVelocity[0]
      };
      setUserNotes(prev => [...prev, newNote]);
    }
  };

  const checkSequence = () => {
    const targetSeq = TARGET_SEQUENCES[currentSequenceIndex];
    let totalScore = 0;
    let matches = 0;

    for (const targetNote of targetSeq.notes) {
      // Find matching user note
      const userNote = userNotes.find(
        note => 
          Math.abs(note.note - targetNote.note) <= 1 && // Allow 1 semitone tolerance
          Math.abs(note.start - targetNote.start) <= 1 && // Allow 1 position tolerance
          Math.abs(note.length - targetNote.length) <= 1 && // Allow length tolerance
          Math.abs(note.velocity - targetNote.velocity) <= 20 // Allow velocity tolerance
      );

      if (userNote) {
        matches++;
        // Calculate accuracy bonus
        const noteAccuracy = 1 - (Math.abs(userNote.note - targetNote.note) / 12);
        const positionAccuracy = 1 - (Math.abs(userNote.start - targetNote.start) / 16);
        const velocityAccuracy = 1 - (Math.abs(userNote.velocity - targetNote.velocity) / 127);
        
        const noteScore = Math.floor((noteAccuracy + positionAccuracy + velocityAccuracy) * 100 / 3);
        totalScore += noteScore;
      }
    }

    const accuracy = matches / targetSeq.notes.length;
    const bonusPoints = Math.floor(accuracy * targetSeq.difficulty * 50);
    totalScore += bonusPoints;

    if (accuracy >= 0.7) {
      setScore(prev => prev + totalScore);
      
      if (currentSequenceIndex < TARGET_SEQUENCES.length - 1) {
        setCurrentSequenceIndex(prev => prev + 1);
        setUserNotes([]);
        setCurrentPosition(0);
        setIsPlaying(false);
      } else {
        setCompleted(true);
        setTimeout(() => handleGameEnd(), 1000);
      }
    }

    return { accuracy, totalScore };
  };

  const clearSequence = () => {
    setUserNotes([]);
    setCurrentPosition(0);
    setIsPlaying(false);
  };

  const handleGameEnd = () => {
    setIsPlaying(false);
    onComplete(score);
  };

  const currentSequence = TARGET_SEQUENCES[currentSequenceIndex];

  return (
    <Card className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-900 via-blue-900 to-cyan-800 text-white border-2 border-cyan-400 shadow-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              MIDI PROGRAMMING
            </h2>
            <p className="text-blue-300 text-sm">Digital Revolution Era • Program the perfect MIDI sequence</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{score}</div>
              <div className="text-xs text-gray-400">SCORE</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{timeLeft}s</div>
              <div className="text-xs text-gray-400">TIME</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-blue-300">
              Sequence: {currentSequence.name} (Difficulty: {currentSequence.difficulty}/3)
            </span>
            <span className="text-cyan-300">
              {currentSequenceIndex + 1}/{TARGET_SEQUENCES.length}
            </span>
          </div>
          <Progress value={((currentSequenceIndex + 1) / TARGET_SEQUENCES.length) * 100} className="h-2 bg-gray-800" />
        </div>

        {/* MIDI Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/30 rounded-lg p-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-cyan-400">Note Selection</label>
            <div className="grid grid-cols-4 gap-1">
              {OCTAVES.map(octave => 
                NOTE_NAMES.map((noteName, noteIndex) => {
                  const midiNote = (octave + 1) * 12 + noteIndex;
                  return (
                    <Button
                      key={midiNote}
                      onClick={() => setSelectedNote(midiNote)}
                      className={`text-xs p-1 ${
                        selectedNote === midiNote 
                          ? 'bg-cyan-500 text-black font-bold' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {noteName}{octave}
                    </Button>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-cyan-400">
                Velocity: {selectedVelocity[0]}
              </label>
              <Slider
                value={selectedVelocity}
                onValueChange={setSelectedVelocity}
                max={127}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-cyan-400">Note Length</label>
              <div className="flex gap-1">
                {[1, 2, 4].map(length => (
                  <Button
                    key={length}
                    onClick={() => setSelectedLength(length)}
                    className={`text-xs ${
                      selectedLength === length 
                        ? 'bg-cyan-500 text-black' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {length === 1 ? '♩' : length === 2 ? '♪' : '♫'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-2">
            <div className="text-center p-3 bg-gray-800 rounded">
              <div className="text-lg font-bold text-cyan-400">
                {getNoteName(selectedNote)}
              </div>
              <div className="text-sm text-gray-400">
                Vel: {selectedVelocity[0]} | Len: {selectedLength}
              </div>
            </div>
          </div>
        </div>

        {/* Sequencer Grid */}
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
              <Music className="w-5 h-5" />
              MIDI Sequencer
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-green-600 hover:bg-green-500"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => setCurrentPosition(0)}
                className="bg-yellow-600 hover:bg-yellow-500"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                onClick={clearSequence}
                className="bg-red-600 hover:bg-red-500"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Position indicator */}
          <div className="grid grid-cols-16 gap-1 mb-4">
            {Array(16).fill(null).map((_, i) => (
              <div
                key={i}
                className={`h-3 rounded text-center text-xs flex items-center justify-center ${
                  currentPosition === i ? 'bg-cyan-400 text-black font-bold' : 'bg-gray-600 text-gray-300'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* MIDI Grid */}
          <div className="grid grid-cols-16 gap-1">
            {Array(16).fill(null).map((_, position) => {
              const notesAtPosition = userNotes.filter(note => 
                note.start <= position && note.start + note.length > position
              );
              
              return (
                <div
                  key={position}
                  className={`h-16 border-2 rounded cursor-pointer transition-all duration-200 relative ${
                    currentPosition === position ? 'ring-2 ring-cyan-400' : ''
                  } ${
                    notesAtPosition.length > 0 
                      ? 'border-cyan-400 bg-cyan-400/20' 
                      : 'border-gray-600 hover:border-blue-400 hover:bg-blue-400/10'
                  }`}
                  onClick={() => handleGridClick(position)}
                >
                  {notesAtPosition.map((note, index) => (
                    <div
                      key={index}
                      className="absolute inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded text-xs flex flex-col items-center justify-center text-black font-bold"
                      style={{ opacity: note.velocity / 127 }}
                    >
                      <div className="text-[10px]">{getNoteName(note.note)}</div>
                      <div className="text-[8px]">{note.velocity}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Target Reference */}
        <div className="bg-black/20 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">Target: {currentSequence.name}</h4>
          <div className="text-xs text-gray-400">
            Program the MIDI sequence to match the target pattern. 
            Use the correct notes, timing, and velocity for maximum score.
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-blue-300">
            <p>• Click grid positions to place/remove notes</p>
            <p>• Adjust velocity and length before placing • Match the target sequence</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={checkSequence}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 font-semibold px-6"
            >
              Check Sequence
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="border-blue-400 text-blue-400 hover:bg-blue-400/10"
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
