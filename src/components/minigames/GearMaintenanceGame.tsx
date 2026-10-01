import { createSeededRandom, randomInt } from '@/simulation/seededRandom';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { playSound } from '@/utils/soundUtils';
import { useSettings } from '@/contexts/SettingsContext';
import { MinigameTutorialPopup, minigameTutorials } from '@/components/minigames/index';
import { MinigameChrome, KenneyButton } from './MinigameChrome';

interface GearMaintenanceGameProps {
  equipment: { name: string };
  onComplete: (success: boolean, score: number) => void;
  onClose: () => void;
  minigameId: string;
  seed?: string | number;
}

interface MinigameState {
  progress: number;
  dials: number[];
  targetValues: number[];
  attemptsLeft: number;
  successfulAdjustmentsLastAttempt: number; // Added to store this value for the close button
}

const GearMaintenanceGame: React.FC<GearMaintenanceGameProps> = ({ equipment, onComplete, onClose, minigameId, seed }) => {
  const { settings, markMinigameTutorialAsSeen } = useSettings();
  const [showTutorial, setShowTutorial] = useState<boolean>(
    !settings.seenMinigameTutorials[minigameId]
  );

  const completed = useRef(false);
  const [minigameState, setMinigameState] = useState<MinigameState>(() => {
    const rng = createSeededRandom(seed ?? `${equipment.name}:${minigameId}`);
    return {
      progress: 0,
      dials: [50, 50, 50],
      targetValues: Array.from({ length: 3 }, () => randomInt(rng, 10, 89)),
      attemptsLeft: 5,
      successfulAdjustmentsLastAttempt: 0,
    };
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  useEffect(() => {
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
    if (completed.current || minigameState.attemptsLeft <= 0) return;
    setMinigameState(prevState => {
      const newDials = [...prevState.dials];
      newDials[dialIndex] = Math.max(0, Math.min(100, newDials[dialIndex] + (direction === 'up' ? 5 : -5)));
      return { ...prevState, dials: newDials };
    });
    playSound('buttonClick');
  };

  const handleSubmitAttempt = () => {
    if (completed.current || minigameState.attemptsLeft <= 0) return;
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
      setFeedbackMessage(`Calibration passed for ${equipment.name}.`);
      qualityImpact = 20;
      completed.current = true;
      setMinigameState(prev => ({ ...prev, attemptsLeft: 0 }));
      onComplete(true, qualityImpact);
    } else if (newAttemptsLeft <= 0) {
      setFeedbackMessage(`Out of attempts. ${equipment.name} did not pass calibration.`);
      qualityImpact = currentSuccessfulAdjustments * 5;
      completed.current = true;
      onComplete(false, qualityImpact);
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
    const tutorialContent = minigameTutorials[minigameId] ?? minigameTutorials.gearMaintenance;
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
    <Card className="w-full max-w-lg mx-auto bg-stone-800 text-white border-stone-700">
      <MinigameChrome
        title={`🔧 Gear Maintenance: ${equipment.name}`}
        score={minigameState.successfulAdjustmentsLastAttempt * 25}
        accent="yellow"
      >
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center text-xs text-amber-300 font-mono bg-amber-950/40 p-2 rounded border border-amber-800">
            <span>Calibrate dials to green target zones</span>
            <span>Attempts: {minigameState.attemptsLeft}</span>
          </div>

          {feedbackMessage && (
            <div className="text-center text-sm font-semibold text-yellow-300 mg-combo-pulse">
              {feedbackMessage}
            </div>
          )}
          
          {minigameState.dials.map((dialValue, index) => (
            <div key={index} className="space-y-2 bg-stone-900/60 p-3 rounded-lg border border-stone-700">
              <div className="flex justify-between text-xs font-semibold text-stone-300">
                <span>Dial {index + 1}</span>
                <span className="font-mono">Current: {dialValue} / Target: ~{minigameState.targetValues[index]}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 text-stone-200 border-stone-600 hover:bg-stone-700"
                  aria-label={`Decrease dial ${index + 1}`}
                  onClick={() => handleDialChange(index, 'down')}
                  disabled={minigameState.attemptsLeft <= 0}
                >
                  -
                </Button>
                <div className="w-full h-7 bg-stone-700 rounded overflow-hidden relative shadow-inner">
                  <motion.div
                    className={`h-full ${getDialColor(dialValue, minigameState.targetValues[index])}`}
                    initial={{ width: `${dialValue}%` }}
                    animate={{ width: `${dialValue}%` }}
                    transition={{ duration: 0.2 }}
                  />
                  {/* Target visualization */}
                  <div 
                    className="absolute top-0 h-full border-l-2 border-r-2 border-green-300/80 bg-green-400/20"
                    style={{ 
                      left: `${minigameState.targetValues[index] - 5}%`, 
                      width: '10%' 
                    }}
                    title={`Target: ${minigameState.targetValues[index]}`}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 text-stone-200 border-stone-600 hover:bg-stone-700"
                  aria-label={`Increase dial ${index + 1}`}
                  onClick={() => handleDialChange(index, 'up')}
                  disabled={minigameState.attemptsLeft <= 0}
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </MinigameChrome>
      <DialogFooter className="p-4">
        <KenneyButton variant="yellow" onClick={onClose}>
          Close
        </KenneyButton>
        {minigameState.attemptsLeft > 0 ? (
          <KenneyButton variant="yellow" onClick={handleSubmitAttempt}>
            Submit Calibration
          </KenneyButton>
        ) : (
          <KenneyButton
            variant="green"
            onClick={onClose}
          >
            Finish
          </KenneyButton>
        )}
      </DialogFooter>
    </Card>
  );
};

export default GearMaintenanceGame;
