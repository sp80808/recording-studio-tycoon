import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { MinigameChrome, KenneyButton } from './MinigameChrome';

// Define a basic props interface for minigame components
export interface MinigameComponentProps {
  minigameId: string;
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  equipmentContext?: { name: string };
}

// Musician tracking structure
interface MusicianFigure {
  id: string;
  instrument: string;
  position: { x: number; y: number };
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
      { id: 'drummer', instrument: 'Drums 🥁', position: { x: 50, y: 25 }, isPerformingWell: true },
      { id: 'guitarist', instrument: 'Guitar 🎸', position: { x: 25, y: 65 }, isPerformingWell: true },
      { id: 'bassist', instrument: 'Bass 🎻', position: { x: 75, y: 65 }, isPerformingWell: true },
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
    onComplete(score, score >= 200);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome
        title="🎙️ Live Recording Coordination"
        score={score}
        timeLeft={gameOver ? undefined : timeLeft}
        accent="red"
      >
        <CardContent>
          <div className="mb-2 text-sm text-stone-300">
            Manage the band's performance. Click struggling musicians to coach them and maintain studio groove!
          </div>

          {eventMessage && (
            <div className="mb-3 p-2 text-center bg-yellow-500/20 text-yellow-300 rounded animate-pulse mg-combo-pulse font-semibold">
              {eventMessage}
            </div>
          )}

          {/* Band stage visualization */}
          <div className="h-72 bg-stone-900/80 rounded-xl p-4 relative border border-stone-700 overflow-hidden">
            {musicians.map((musician) => (
              <div
                key={musician.id}
                className={`absolute p-3 rounded-xl cursor-pointer transition-all duration-300 shadow-lg ${
                  musician.isPerformingWell
                    ? 'bg-emerald-600/80 border-2 border-emerald-400 mg-meter-glow hover:scale-105'
                    : 'bg-red-600/90 border-2 border-red-300 mg-miss-shake animate-pulse hover:scale-105'
                }`}
                style={{
                  left: `${musician.position.x}%`,
                  top: `${musician.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handleMusicianClick(musician.id)}
              >
                <div className="text-center select-none">
                  <div className="text-3xl mb-1">{musician.instrument.split(' ')[1] || '🎵'}</div>
                  <div className="text-xs font-bold text-white">{musician.instrument.split(' ')[0]}</div>
                  <div className={`text-[10px] uppercase font-bold mt-1 px-1.5 py-0.5 rounded ${
                    musician.isPerformingWell ? 'bg-emerald-800 text-emerald-200' : 'bg-red-900 text-red-200'
                  }`}>
                    {musician.isPerformingWell ? 'In Pocket' : 'Needs Coach!'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {gameOver && (
            <div className="mt-4 text-center">
              <div className={`text-2xl font-bold text-green-400 ${score >= 200 ? 'mg-perfect-pop' : 'mg-miss-shake'}`}>
                Session Ended! Final Score: {score}
              </div>
            </div>
          )}
        </CardContent>
      </MinigameChrome>
      <DialogFooter className="p-4">
        <KenneyButton variant="red" onClick={onClose}>
          Close
        </KenneyButton>
        <KenneyButton variant="green" onClick={handleFinalize} disabled={gameOver}>
          Finalize & Get Score
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
