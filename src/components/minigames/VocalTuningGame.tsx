import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog'; // Import DialogFooter
import { MinigameChrome, KenneyButton } from './MinigameChrome';
import { tc } from '@/i18n/content';

// Define a basic props interface for minigame components
export interface MinigameComponentProps {
  minigameId: string; // Or use MinigameType if imported
  onComplete: (score: number, success?: boolean) => void;
  onClose: () => void;
  // Add other common props like equipmentContext if needed by many minigames
  equipmentContext?: { name: string }; 
}

// Placeholder types, actual implementation would need more detail
interface PitchNode {
  time: number; // in seconds or beats
  pitch: number; // MIDI note number or frequency
  originalPitch: number;
  isCorrected: boolean;
}

// TODO: Define AudioData and PitchMap more concretely if complex visualization is needed.
// For now, we'll simulate a simple version.

export const VocalTuningGame: React.FC<MinigameComponentProps> = ({ minigameId, onComplete, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds for the game
  const [score, setScore] = useState(0);
  const [pitchNodes, setPitchNodes] = useState<PitchNode[]>([]);
  const [gameOver, setGameOver] = useState(false);

  // Initialize a simple set of pitch nodes for the game
  useEffect(() => {
    const nodes: PitchNode[] = [];
    for (let i = 0; i < 10; i++) {
      const targetPitch = 60 + Math.floor(Math.random() * 12); // Random MIDI note C4-B4
      const deviation = Math.random() > 0.5 ? (Math.random() * 2 - 1) * 0.7 : 0; // 70% chance of deviation up to +/- 0.7 semitones
      nodes.push({
        time: i * 2, // Node every 2 seconds
        pitch: targetPitch,
        originalPitch: targetPitch + deviation,
        isCorrected: deviation === 0, // Correct if no deviation initially
      });
    }
    setPitchNodes(nodes);
  }, []);

  // Game timer
  useEffect(() => {
    if (timeLeft <= 0 || gameOver) {
      setGameOver(true);
      // onComplete(score); // Call onComplete with the final score
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameOver, score, onComplete]);

  const handleNodeClick = (index: number) => {
    if (gameOver) return;

    setPitchNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const node = newNodes[index];
      if (!node.isCorrected) {
        // Simulate correction - in a real game, this would involve dragging to the correct pitch
        node.isCorrected = true;
        // Check if the 'correction' is actually to the target pitch
        // For simplicity, any click on an uncorrected node is a 'successful' correction attempt
        const pitchDifference = Math.abs(node.originalPitch - node.pitch);
        if (pitchDifference < 0.1) { // Perfect correction
             setScore(s => s + 100);
        } else if (pitchDifference < 0.35) { // Good correction
             setScore(s => s + 50);
        } else { // Poor correction (still counts as 'corrected' for this simple version)
             setScore(s => s + 20);
        }
      }
      return newNodes;
    });
  };
  
  const handleFinalize = () => {
    setGameOver(true);
    onComplete(score);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome title={tc('mg.VocalTuningGame.title', '🎤 Vocal Tuning Challenge')} score={score} timeLeft={gameOver ? undefined : timeLeft} streak={pitchNodes.filter((node) => node.isCorrected).length >= 2 ? pitchNodes.filter((node) => node.isCorrected).length : undefined} accent="red">
      <CardContent>

        {/* Simplified visual representation of pitch nodes */}
        <div className="h-64 bg-stone-700 rounded p-4 relative overflow-x-auto flex items-center space-x-4">
          {pitchNodes.map((node, index) => (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleNodeClick(index)}
              style={{ position: 'relative' }}
            >
              {/* Line to represent target pitch (simplified) */}
              <div 
                className="w-8 h-0.5 bg-blue-400 absolute"
                style={{ top: `${50 - (node.pitch - 60) * 5}%` }} 
              ></div>
              {/* Node representing original pitch */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center
                            ${node.isCorrected ? 'bg-green-500 mg-perfect-pop' : 'bg-red-500 group-hover:bg-red-400'}
                            border-2 ${node.isCorrected ? 'border-green-300' : 'border-red-300'}`}
                style={{ 
                  position: 'relative', 
                  top: `${50 - (node.originalPitch - 60) * 5}%`, // Simplified Y position based on pitch
                  transition: 'background-color 0.2s'
                }}
              >
                <span className="text-xs font-mono">{Math.round(node.originalPitch * 10)/10}</span>
              </div>
               <span className="text-xs mt-1 text-stone-400">{node.time}s</span>
            </div>
          ))}
        </div>
        
        {gameOver && (
          <div className="mt-4 text-center text-2xl font-bold text-green-400">
            {tc('mg.VocalTuningGame.times_up', "Time's Up! Final Score: {{score}}", { score })}
          </div>
        )}
      </CardContent>
      </MinigameChrome>
      <DialogFooter className="p-4">
        <KenneyButton variant="red" onClick={onClose}>
          {tc('mg.VocalTuningGame.close', 'Close')}
        </KenneyButton>
        <KenneyButton variant="red" onClick={handleFinalize} disabled={gameOver}>
          {tc('mg.VocalTuningGame.finalize', 'Finalize & Get Score')}
        </KenneyButton>
      </DialogFooter>
    </Card>
  );
};
