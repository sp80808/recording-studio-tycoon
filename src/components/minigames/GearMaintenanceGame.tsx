import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { playSound } from '@/utils/soundUtils';
import { useSettings } from '@/contexts/SettingsContext';
import { MinigameTutorialPopup, minigameTutorials } from '@/components/minigames/index';

interface GearMaintenanceGameProps {
  equipment: { name: string };
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
  minigameId: string;
}

interface MinigameState {
  progress: number;
  dials: number[];
  targetValues: number[];
  attemptsLeft: number;
  successfulAdjustmentsLastAttempt: number; // Added to store this value for the close button
}

const GearMaintenanceGame: React.FC<GearMaintenanceGameProps> = ({ equipment, onComplete, onClose, minigameId }) => {
  const { settings, markMinigameTutorialAsSeen } = useSettings();
  const [showTutorial, setShowTutorial] = useState<boolean>(
    !settings.seenMinigameTutorials[minigameId]
  );

  const [minigameState, setMinigameState] = useState<MinigameState>({
    progress: 0,
    dials: [50, 50, 50],
    targetValues: [],
    attemptsLeft: 5,
    successfulAdjustmentsLastAttempt: 0, // Initialize
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  useEffect(() => {
    setMinigameState(prevState => ({
      ...prevState,
      targetValues: [
        Math.floor(Math.random() * 80) + 10,
        Math.floor(Math.random() * 80) + 10,
        Math.floor(Math.random() * 80) + 10,
      ]
    }));
    if (!showTutorial) {
        playSound('notice');
    }
  }, [showTutorial]);

  const handleTutorialClose = () => {
    markMinigameTutorialAsSeen(minigameId);
    setShowTutorial(false);
    playSound('notice');
  };

  const handleDialChange = (dialIndex: number, direction: 'up' | 'down') => {
    if (minigameState.attemptsLeft <= 0) return;
    setMinigameState(prevState => {
      const newDials = [...prevState.dials];
      newDials[dialIndex] = Math.max(0, Math.min(100, newDials[dialIndex] + (direction === 'up' ? 5 : -5)));
      return { ...prevState, dials: newDials };
    });
    playSound('buttonClick');
  };

  const handleSubmitAttempt = () => {
    if (minigameState.attemptsLeft <= 0) return;
    playSound('proj-complete');

    let currentSuccessfulAdjustments = 0;
    minigameState.dials.forEach((dialValue, index) => {
      if (Math.abs(dialValue - minigameState.targetValues[index]) <= 10) {
        currentSuccessfulAdjustments++;
      }
    });

    const newAttemptsLeft = minigameState.attemptsLeft - 1;
    let qualityImpact = 0;

    // Store successful adjustments for potential use in onComplete if attempts run out
    setMinigameState(prevState => ({ 
        ...prevState, 
        attemptsLeft: newAttemptsLeft,
        successfulAdjustmentsLastAttempt: currentSuccessfulAdjustments 
    }));

    if (currentSuccessfulAdjustments === minigameState.dials.length) {
      setFeedbackMessage(`Perfect calibration! ${equipment.name} is in top condition!`);
      qualityImpact = 20;
      onComplete(true, qualityImpact);
    } else if (newAttemptsLeft <= 0) {
      setFeedbackMessage(`Out of attempts. ${equipment.name} condition partially improved.`);
      qualityImpact = currentSuccessfulAdjustments * 5;
      onComplete(false, qualityImpact); // This will be called by the close button now
    } else {
      setFeedbackMessage(
        `${currentSuccessfulAdjustments}/${minigameState.dials.length} dials calibrated. ${newAttemptsLeft} attempts left.`
      );
    }
  };

  const getDialColor = (value: number, target: number) => {
    const diff = Math.abs(value - target);
    if (diff <= 5) return 'bg-green-500';
    if (diff <= 15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Show tutorial if it hasn't been seen
  if (showTutorial) {
    const tutorialContent = minigameTutorials[minigameId];
    if (!tutorialContent) {
      // Fallback if tutorial content is missing, though this shouldn't happen
      console.warn(`Tutorial content for ${minigameId} not found.`);
      handleTutorialClose(); // Close tutorial and proceed
      return null; 
    }
    return (
      <MinigameTutorialPopup
        minigameId={minigameId}
        title={tutorialContent.title}
        instructions={tutorialContent.instructions}
        onClose={handleTutorialClose}
      />
    );
  }

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
            <Button 
                onClick={() => onComplete(false, minigameState.successfulAdjustmentsLastAttempt * 5)} 
                className="w-full bg-gray-500 hover:bg-gray-600"
            >
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GearMaintenanceGame;
