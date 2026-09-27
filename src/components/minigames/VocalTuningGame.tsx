import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog'; // Import DialogFooter

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
    <Card className="w-full max-w-2xl mx-auto bg-gray-800 text-white border-gray-700">
      <CardHeader>
        <CardTitle>🎤 Vocal Tuning Challenge 🎤</CardTitle>
        <CardDescription>
          Click on the notes to correct their pitch! Aim for precision.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <span className="text-xl font-bold">Score: {score}</span>
          <span className={`text-xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
            Time Left: {timeLeft}s
          </span>
        </div>

        {/* Simplified visual representation of pitch nodes */}
        <div className="h-64 bg-gray-700 rounded p-4 relative overflow-x-auto flex items-center space-x-4">
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
                            ${node.isCorrected ? 'bg-green-500' : 'bg-red-500 group-hover:bg-red-400'}
                            border-2 ${node.isCorrected ? 'border-green-300' : 'border-red-300'}`}
                style={{ 
                  position: 'relative', 
                  top: `${50 - (node.originalPitch - 60) * 5}%`, // Simplified Y position based on pitch
                  transition: 'background-color 0.2s'
                }}
              >
                <span className="text-xs font-mono">{Math.round(node.originalPitch * 10)/10}</span>
              </div>
               <span className="text-xs mt-1 text-gray-400">{node.time}s</span>
            </div>
          ))}
        </div>
        
        {gameOver && (
          <div className="mt-4 text-center text-2xl font-bold text-green-400">
            Time's Up! Final Score: {score}
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
