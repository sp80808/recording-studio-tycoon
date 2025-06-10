import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { playSound } from '@/utils/soundUtils';

interface GearMaintenanceGameProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

// Example: Define a simple state for the minigame
interface MinigameState {
  progress: number;
  dials: number[]; // Example: 3 dials to adjust
  targetValues: number[];
  attemptsLeft: number;
}

const GearMaintenanceGame: React.FC<GearMaintenanceGameProps> = ({ equipment, onComplete }) => {
  const [minigameState, setMinigameState] = useState<MinigameState>({
    progress: 0,
    dials: [50, 50, 50], // Initial dial positions (0-100)
    targetValues: [], // Will be randomized
    attemptsLeft: 5,
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  useEffect(() => {
    // Initialize target values for the dials (example)
    setMinigameState(prevState => ({
      ...prevState,
      targetValues: [
        Math.floor(Math.random() * 80) + 10, // Target between 10-90
        Math.floor(Math.random() * 80) + 10,
        Math.floor(Math.random() * 80) + 10,
      ]
    }));
    gameAudio.playSound('notice'); // Sound for minigame start
  }, []);

  const handleDialChange = (dialIndex: number, direction: 'up' | 'down') => {
    if (minigameState.attemptsLeft <= 0) return;

    setMinigameState(prevState => {
      const newDials = [...prevState.dials];
      newDials[dialIndex] = Math.max(0, Math.min(100, newDials[dialIndex] + (direction === 'up' ? 5 : -5)));
      return { ...prevState, dials: newDials };
    });
    gameAudio.playSound('buttonClick'); // Sound for dial adjustment
  };

  const handleSubmitAttempt = () => {
    if (minigameState.attemptsLeft <= 0) return;

    gameAudio.playSound('proj-complete'); // Sound for attempt submission

    let successfulAdjustments = 0;
    minigameState.dials.forEach((dialValue, index) => {
      if (Math.abs(dialValue - minigameState.targetValues[index]) <= 10) { // Allow some tolerance
        successfulAdjustments++;
      }
    });

    const newAttemptsLeft = minigameState.attemptsLeft - 1;
    let qualityImpact = 0;

    if (successfulAdjustments === minigameState.dials.length) {
      setFeedbackMessage(`Perfect calibration! ${equipment.name} is in top condition!`);
      qualityImpact = 20; // Max positive impact
      onComplete(true, qualityImpact);
    } else if (newAttemptsLeft <= 0) {
      setFeedbackMessage(`Out of attempts. ${equipment.name} condition partially improved.`);
      qualityImpact = successfulAdjustments * 5; // Partial positive impact
      onComplete(false, qualityImpact);
    } else {
      setFeedbackMessage(
        `${successfulAdjustments}/${minigameState.dials.length} dials calibrated. ${newAttemptsLeft} attempts left.`
      );
      setMinigameState(prevState => ({ ...prevState, attemptsLeft: newAttemptsLeft }));
    }
  };

  const getDialColor = (value: number, target: number) => {
    const diff = Math.abs(value - target);
    if (diff <= 5) return 'bg-green-500'; // Very close
    if (diff <= 15) return 'bg-yellow-500'; // Close
    return 'bg-red-500'; // Far
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 bg-gray-800 rounded-lg shadow-xl text-white fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    >
      <Card className="w-full max-w-md bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle>Gear Maintenance: {equipment.name}</CardTitle>
          <CardDescription>Calibrate the dials to their target zones. Attempts left: {minigameState.attemptsLeft}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm mb-4">{feedbackMessage}</div>
          
          {minigameState.dials.map((dialValue, index) => (
            <div key={index} className="space-y-2">
              <div className="text-sm font-medium">Dial {index + 1} (Target Zone: Green)</div>
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={() => handleDialChange(index, 'down')} disabled={minigameState.attemptsLeft <= 0}>-</Button>
                <div className="w-full h-8 bg-gray-600 rounded overflow-hidden relative">
                  <motion.div
                    className={`h-full ${getDialColor(dialValue, minigameState.targetValues[index])}`}
                    initial={{ width: `${dialValue}%`}}
                    animate={{ width: `${dialValue}%`}}
                    transition={{ duration: 0.2 }}
                  />
                   {/* Target visualization (optional) */}
                  <div 
                    className="absolute top-0 h-full border-l-2 border-r-2 border-green-300/50"
                    style={{ 
                      left: `${minigameState.targetValues[index] - 5}%`, 
                      width: '10%' 
                    }}
                    title={`Target: ${minigameState.targetValues[index]}`}
                  />
                </div>
                <Button size="sm" onClick={() => handleDialChange(index, 'up')} disabled={minigameState.attemptsLeft <= 0}>+</Button>
              </div>
              <div className="text-xs text-center">Current: {dialValue}</div>
            </div>
          ))}

          {minigameState.attemptsLeft > 0 ? (
            <Button onClick={handleSubmitAttempt} className="w-full bg-blue-600 hover:bg-blue-700">
              Submit Attempt
            </Button>
          ) : (
            <Button onClick={() => onComplete(false, 0)} className="w-full bg-gray-500 hover:bg-gray-600">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GearMaintenanceGame;
