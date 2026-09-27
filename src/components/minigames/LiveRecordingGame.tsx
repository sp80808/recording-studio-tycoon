import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameComponentProps } from './VocalTuningGame'; // Re-use from VocalTuningGame for now

// Placeholder types - actual implementation would be more complex
interface MusicianFigure {
  id: string;
  instrument: string;
  position: { x: number; y: number }; // For a visual layout
  isPerformingWell: boolean;
}

export const LiveRecordingGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds for this more complex game
  const [score, setScore] = useState(0);
  const [musicians, setMusicians] = useState<MusicianFigure[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  // Initialize a simple set of musicians
  useEffect(() => {
    setMusicians([
      { id: 'drummer', instrument: 'Drums 🥁', position: { x: 50, y: 20 }, isPerformingWell: true },
      { id: 'guitarist', instrument: 'Guitar 🎸', position: { x: 20, y: 60 }, isPerformingWell: true },
      { id: 'bassist', instrument: 'Bass 🎻', position: { x: 80, y: 60 }, isPerformingWell: true },
      // Add vocalist if applicable
    ]);
  }, []);

  // Game timer & random events
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      setGameOver(true);
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
      // Random event logic (simplified)
      if (Math.random() < 0.15 && !eventMessage) { // 15% chance of an event if no current event
        const randomMusicianIndex = Math.floor(Math.random() * musicians.length);
        setMusicians(prev => prev.map((m, i) => i === randomMusicianIndex ? { ...m, isPerformingWell: false } : m));
        setEventMessage(`${musicians[randomMusicianIndex].instrument} is struggling! Click to coach.`);
        setTimeout(() => setEventMessage(null), 4000); // Event message disappears
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver, musicians, eventMessage]);

  const handleMusicianClick = (musicianId: string) => {
    if (gameOver) return;

    setMusicians(prevMusicians => {
      return prevMusicians.map(m => {
        if (m.id === musicianId && !m.isPerformingWell) {
          setScore(s => s + 75); // Points for successful coaching
          setEventMessage(null); // Clear event message on successful interaction
          return { ...m, isPerformingWell: true };
        }
        return m;
      });
    });
  };
  
  // Simulate ongoing score accumulation for well-performing musicians
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      let currentTickScore = 0;
      musicians.forEach(m => {
        if (m.isPerformingWell) {
          currentTickScore += 5; // 5 points per second per well-performing musician
        } else {
          currentTickScore -= 2; // Penalty for struggling musicians not coached
        }
      });
      setScore(s => Math.max(0, s + currentTickScore));
    }, 1000); // Score updates every second
    return () => clearInterval(interval);
  }, [musicians, gameOver]);


  const handleFinalize = () => {
    setGameOver(true);
    onComplete(score);
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-gray-800 text-white border-gray-700">
      <CardHeader>
        <CardTitle>🎙️ Live Recording Coordination 🎙️</CardTitle>
        <CardDescription>
          Manage the band's performance. Click on struggling musicians to coach them!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <span className="text-xl font-bold">Score: {score}</span>
          <span className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            Time Left: {timeLeft}s
          </span>
        </div>

        {eventMessage && (
          <div className="mb-2 p-2 text-center bg-yellow-500/20 text-yellow-300 rounded animate-pulse">
            {eventMessage}
          </div>
        )}

        {/* Simplified visual representation of live band */}
        <div className="h-80 bg-gray-700 rounded p-4 relative">
          {musicians.map((musician) => (
            <div
              key={musician.id}
              className={`absolute p-2 rounded cursor-pointer transition-all duration-300
                          ${musician.isPerformingWell ? 'bg-green-500/70 border-green-400' : 'bg-red-500/70 border-red-400 animate-pulse'}`}
              style={{ 
                left: `${musician.position.x}%`, 
                top: `${musician.position.y}%`,
                transform: 'translate(-50%, -50%)', // Center the element
              }}
              onClick={() => handleMusicianClick(musician.id)}
            >
              <div className="text-center">
                <span className="text-lg">{musician.instrument.split(' ')[1]}</span> 
                <div>{musician.instrument.split(' ')[0]}</div>
                <div className="text-xs mt-1">{musician.isPerformingWell ? 'Rocking!' : 'Struggling!'}</div>
              </div>
            </div>
          ))}
        </div>
        
        {gameOver && (
          <div className="mt-4 text-center text-2xl font-bold text-green-400">
            Session Ended! Final Score: {score}
          </div>
        )}
      </CardContent>
      <DialogFooter className="p-4">
        <Button onClick={onClose} variant="outline" className="text-gray-300 border-gray-600 hover:bg-gray-700">
          Close
        </Button>
         <Button onClick={handleFinalize} disabled={gameOver} className="bg-green-600 hover:bg-green-700">
          Finalize & Get Score
        </Button>
      </DialogFooter>
    </Card>
  );
};
