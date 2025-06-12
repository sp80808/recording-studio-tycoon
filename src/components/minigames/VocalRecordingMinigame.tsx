import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { gameAudio } from '@/utils/audioSystem';

interface VocalRecordingMinigameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
  difficulty: number;
}

interface Note {
  pitch: number;
  duration: number;
  timing: number;
}

export const VocalRecordingMinigame: React.FC<VocalRecordingMinigameProps> = ({
  onComplete,
  onClose,
  difficulty
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  // Generate notes based on difficulty
  useEffect(() => {
    const generateNotes = () => {
      const newNotes: Note[] = [];
      const numNotes = 10 + difficulty * 5;
      let currentTime = 0;

      for (let i = 0; i < numNotes; i++) {
        const pitch = Math.floor(Math.random() * 12) + 60; // MIDI note range
        const duration = 500 + Math.random() * 1000; // 500-1500ms
        newNotes.push({
          pitch,
          duration,
          timing: currentTime
        });
        currentTime += duration;
      }

      setNotes(newNotes);
    };

    generateNotes();
  }, [difficulty]);

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

  const handleStart = () => {
    setIsPlaying(true);
    gameAudio.playUISound('start');
  };

  const handleNoteInput = (pitch: number) => {
    if (!isPlaying) return;

    const currentNote = notes[currentNoteIndex];
    const timingDiff = Math.abs(Date.now() - currentNote.timing);
    const pitchDiff = Math.abs(pitch - currentNote.pitch);
    
    const timingScore = Math.max(0, 100 - (timingDiff / 100));
    const pitchScore = Math.max(0, 100 - (pitchDiff * 10));
    const noteScore = Math.round((timingScore + pitchScore) / 2);

    setScore(prev => prev + noteScore);
    setPlayerInput(prev => [...prev, pitch]);
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentNoteIndex < notes.length - 1) {
        setCurrentNoteIndex(prev => prev + 1);
      } else {
        handleGameComplete();
      }
    }, 500);
  };

  const handleGameComplete = () => {
    const finalScore = Math.round(score / notes.length);
    setIsPlaying(false);
    gameAudio.playSuccess();
    toast({
      title: "🎤 Recording Complete!",
      description: `Final Score: ${finalScore}/100`,
      duration: 3000
    });
    onComplete(finalScore);
  };

  const renderNote = (note: Note, index: number) => {
    const isCurrent = index === currentNoteIndex;
    const isPast = index < currentNoteIndex;
    const playerPitch = isPast ? playerInput[index] : null;

    return (
      <div
        key={index}
        className={`p-2 rounded ${
          isCurrent
            ? 'bg-blue-600'
            : isPast
            ? 'bg-gray-700'
            : 'bg-gray-800'
        }`}
      >
        <div className="text-sm">
          Note {index + 1}
          {isPast && playerPitch !== null && (
            <span className="ml-2 text-xs">
              (Target: {note.pitch}, Your: {playerPitch})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-gray-800/90 border-gray-600">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Vocal Recording</h2>
          <div className="text-yellow-400">
            Time: {timeRemaining}s
          </div>
        </div>

        <Progress value={(timeRemaining / 60) * 100} className="h-2" />

        {!isPlaying ? (
          <div className="text-center space-y-4">
            <p className="text-gray-300">
              Sing along with the notes as they appear. Match the pitch and timing as closely as possible!
            </p>
            <Button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Recording
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-2">
              {notes.map((note, index) => renderNote(note, index))}
            </div>

            {showFeedback && (
              <div className="text-center text-green-400 animate-pulse">
                {score > 80 ? "Perfect!" : score > 60 ? "Good!" : "Try again!"}
              </div>
            )}

            <div className="grid grid-cols-7 gap-2">
              {[60, 62, 64, 65, 67, 69, 71].map(pitch => (
                <Button
                  key={pitch}
                  onClick={() => handleNoteInput(pitch)}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  {pitch}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleGameComplete}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Complete Recording
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}; 