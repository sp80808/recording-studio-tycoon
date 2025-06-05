
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VocalRecordingGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

export const VocalRecordingGame: React.FC<VocalRecordingGameProps> = ({ onComplete, onClose }) => {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [score, setScore] = useState(0);
  const [completedPhrases, setCompletedPhrases] = useState<number[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  const phrases = [
    "🎵 In the studio we create",
    "🎶 Making music is our fate", 
    "🎵 Every beat and every rhyme",
    "🎶 Perfect sound every time",
    "🎵 Creativity flows like water"
  ];

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 0.1);
    }, 100);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    // Score based on timing (2-4 seconds is optimal)
    const timing = recordingTime;
    let phraseScore = 0;
    
    if (timing >= 2 && timing <= 4) {
      phraseScore = 100; // Perfect timing
    } else if (timing >= 1.5 && timing <= 5) {
      phraseScore = 70; // Good timing
    } else {
      phraseScore = 30; // Poor timing
    }

    setScore(prev => prev + phraseScore);
    setCompletedPhrases(prev => [...prev, currentPhrase]);

    // Add visual feedback
    const recordButton = document.getElementById('record-button');
    if (recordButton) {
      recordButton.style.transform = 'scale(1.1)';
      setTimeout(() => {
        recordButton.style.transform = 'scale(1)';
      }, 200);
    }
  };

  const nextPhrase = () => {
    if (currentPhrase < phrases.length - 1) {
      setCurrentPhrase(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    // Bonus for completing all phrases
    const completionBonus = completedPhrases.length === phrases.length ? 100 : 0;
    onComplete(score + completionBonus);
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl bg-gray-900 border-gray-600 p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🎤 Vocal Recording Session</h2>
        <p className="text-gray-300">Record each phrase with perfect timing!</p>
        <div className="text-yellow-400 font-bold mt-2">Score: {score}</div>
      </div>

      <div className="mb-6">
        <Progress value={(currentPhrase / phrases.length) * 100} className="mb-4" />
        <div className="text-center text-sm text-gray-400">
          Phrase {currentPhrase + 1} of {phrases.length}
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="text-3xl font-bold text-white mb-4 p-4 bg-gray-800 rounded-lg">
          {phrases[currentPhrase]}
        </div>
        <div className="text-gray-400 text-sm">
          Hold the record button for 2-4 seconds for perfect timing
        </div>
      </div>

      {isRecording && (
        <div className="text-center mb-6">
          <div className="text-red-400 font-bold text-xl animate-pulse">
            🔴 RECORDING... {recordingTime.toFixed(1)}s
          </div>
          <div className="w-32 h-2 bg-gray-700 rounded-full mx-auto mt-2 overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-100"
              style={{ width: `${Math.min((recordingTime / 4) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center mb-6">
        <Button
          id="record-button"
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={completedPhrases.includes(currentPhrase)}
          className={`px-8 py-4 text-xl transition-all duration-150 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 scale-110' 
              : completedPhrases.includes(currentPhrase)
                ? 'bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {completedPhrases.includes(currentPhrase) ? '✅ Recorded' : '🎤 Hold to Record'}
        </Button>
      </div>

      <div className="flex gap-4 justify-center">
        {completedPhrases.includes(currentPhrase) && (
          <Button onClick={nextPhrase} className="px-6 py-3 bg-blue-600 hover:bg-blue-700">
            {currentPhrase < phrases.length - 1 ? 'Next Phrase' : 'Finish Session'}
          </Button>
        )}
        <Button onClick={onClose} variant="outline" className="px-6 py-3">
          Cancel
        </Button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {phrases.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${
              completedPhrases.includes(index) 
                ? 'bg-green-500' 
                : index === currentPhrase 
                  ? 'bg-blue-500' 
                  : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </Card>
  );
};
