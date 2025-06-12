
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedProjectProgress } from './AnimatedProjectProgress';
import { InteractiveStudioElements } from './InteractiveStudioElements';
import { MinigameManager } from './minigames/MinigameManager';

interface EnhancedActiveProjectProps {
  gameState: any;
  focusAllocation: any;
  setFocusAllocation: any;
  performDailyWork: any;
  onMinigameReward: any;
}

export const EnhancedActiveProject: React.FC<EnhancedActiveProjectProps> = ({
  gameState,
  focusAllocation,
  setFocusAllocation,
  performDailyWork,
  onMinigameReward
}) => {
  const [showMinigame, setShowMinigame] = useState(false);
  const [minigameType, setMinigameType] = useState<string>('');

  if (!gameState.activeProject) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-600">
        <div className="space-y-4">
          <div className="text-6xl animate-bounce">🎵</div>
          <h2 className="text-2xl font-bold text-white">Ready to Create?</h2>
          <p className="text-gray-300">Select a project from the left panel to begin your musical journey!</p>
          <InteractiveStudioElements gameState={gameState} />
        </div>
      </Card>
    );
  }

  const handleStartMinigame = (type: string) => {
    setMinigameType(type);
    setShowMinigame(true);
  };

  const handleMinigameComplete = (score: number) => {
    setShowMinigame(false);
    
    // Convert score to bonuses based on minigame type
    let creativityBonus = 0;
    let technicalBonus = 0;
    let xpBonus = Math.floor(score / 10);

    switch (minigameType) {
      case 'creativity':
        creativityBonus = Math.floor(score / 20);
        break;
      case 'technical':
        technicalBonus = Math.floor(score / 20);
        break;
      default:
        creativityBonus = Math.floor(score / 40);
        technicalBonus = Math.floor(score / 40);
    }

    onMinigameReward(creativityBonus, technicalBonus, xpBonus, minigameType);
  };

  return (
    <div className="space-y-4">
      <AnimatedProjectProgress
        project={gameState.activeProject}
        creativityPoints={gameState.activeProject.accumulatedCPoints}
        technicalPoints={gameState.activeProject.accumulatedTPoints}
      />

      <Card className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-600">
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => handleStartMinigame('creativity')}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 transform hover:scale-105"
            >
              🎨 Creative Boost
            </Button>
            <Button
              onClick={() => handleStartMinigame('technical')}
              className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 transform hover:scale-105"
            >
              🔧 Technical Work
            </Button>
            <Button
              onClick={performDailyWork}
              className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 transform hover:scale-105"
            >
              ⏰ Daily Progress
            </Button>
            <Button
              onClick={() => handleStartMinigame('mixing')}
              className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-200 transform hover:scale-105"
            >
              🎛️ Mix Session
            </Button>
          </div>

          <InteractiveStudioElements 
            gameState={gameState}
            onStudioBoost={() => onMinigameReward(2, 2, 5, 'studio-boost')}
          />
        </div>
      </Card>

      {showMinigame && (
        <MinigameManager
          type={minigameType}
          onComplete={handleMinigameComplete}
          onClose={() => setShowMinigame(false)}
          gameState={gameState}
          focusAllocation={focusAllocation}
        />
      )}
    </div>
  );
};
