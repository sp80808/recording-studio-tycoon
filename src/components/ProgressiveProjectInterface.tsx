// Progressive Project Interface - Automatically switches between single and multi-project views
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap } from 'lucide-react'; // Removed Users
import { GameState, Project, GameNotification, FocusAllocation } from '@/types/game';
import { ProgressionSystem, ProgressionStatus } from '@/services/ProgressionSystem';
// import { useMultiProjectManagement } from '@/hooks/useMultiProjectManagement'; // Commented out if multiProjectProps is unused
import { MultiProjectDashboard } from '@/components/MultiProjectDashboard';
import { ActiveProject } from '@/components/ActiveProject';
import { MinigameType } from '@/components/minigames/MinigameManager';

interface ProgressiveProjectInterfaceProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  focusAllocation?: FocusAllocation;
  setFocusAllocation?: (allocation: FocusAllocation) => void;
  performDailyWork?: () => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame?: () => void;
}

export const ProgressiveProjectInterface: React.FC<ProgressiveProjectInterfaceProps> = ({
  gameState,
  setGameState,
  focusAllocation,
  setFocusAllocation,
  performDailyWork,
  onMinigameReward,
  onProjectComplete,
  onProjectSelect,
  autoTriggeredMinigame,
  clearAutoTriggeredMinigame
}) => {
  const [progressionStatus, setProgressionStatus] = useState<ProgressionStatus | null>(null);
  // const [showProgressionInfo, setShowProgressionInfo] = useState(false); // Unused
  const [lastMilestone, setLastMilestone] = useState<number>(0);
  const [showMultiProjectInTransition, setShowMultiProjectInTransition] = useState(false); // Lifted state for renderTransitionView

  // Provide default focus allocation if not provided
  const defaultFocusAllocation: FocusAllocation = {
    performance: 50,
    soundCapture: 50,
    layering: 50
  };

  const currentFocusAllocation = focusAllocation || defaultFocusAllocation;
  const handleSetFocusAllocation = setFocusAllocation || (() => {});

  // Check progression status on game state changes
  useEffect(() => {
    const status = ProgressionSystem.getProgressionStatus(gameState);
    setProgressionStatus(status);

    // Check for milestone progression and add notification
    const currentMilestoneLevel = status.currentMilestone?.level || 0;
    if (currentMilestoneLevel > lastMilestone && lastMilestone > 0) {
      // Add milestone unlock notification
      const notification: GameNotification = {
        id: `milestone_${currentMilestoneLevel}_${Date.now()}`,
        message: status.currentMilestone?.unlockMessage || 'New milestone reached!',
        type: 'success',
        timestamp: Date.now(),
        duration: 8000,
        priority: 'high'
      };
      
      setGameState(prev => ({
        ...prev,
        notifications: [...prev.notifications, notification]
      }));
    }
    setLastMilestone(currentMilestoneLevel);
  }, [gameState.playerData.level, gameState.hiredStaff.length, lastMilestone, setGameState]);

  // const multiProjectProps = useMultiProjectManagement({ gameState, setGameState }); // Result unused

  if (!progressionStatus) {
    return <div>Loading...</div>;
  }

  // Render single project view for early game
  const renderSingleProjectView = () => {
    return (
      <div className="space-y-6 h-full overflow-y-auto p-1">        
        {/* Hint about upcoming multi-project capability */}
        {progressionStatus.progressToNext > 0.7 && progressionStatus.nextMilestone && (
          <Alert className="border-yellow-600 bg-gray-800">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              <strong>Studio Expansion Coming Soon!</strong> You're close to unlocking multi-project management. 
              Keep growing your studio to handle multiple projects simultaneously.
            </AlertDescription>
          </Alert>
        )}

        {/* Traditional single project interface */}
        <ActiveProject
          gameState={gameState}
          setGameState={setGameState}
          focusAllocation={currentFocusAllocation}
          setFocusAllocation={handleSetFocusAllocation}
          onProjectSelect={onProjectSelect}
          performDailyWork={performDailyWork}
          onMinigameReward={onMinigameReward}
          onProjectComplete={onProjectComplete}
          autoTriggeredMinigame={autoTriggeredMinigame}
          clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
        />
      </div>
    );
  };

  // Render transition view when multi-project is newly unlocked
  const renderTransitionView = () => {
    // const [showMultiProject, setShowMultiProject] = useState(false); // State lifted

    return (
      <div className="space-y-6 h-full overflow-y-auto p-1">        
        {/* New Feature Announcement */}
        <Alert className="border-green-600 bg-gray-800">
          <Zap className="w-4 h-4 text-green-400" />
          <AlertDescription className="text-green-200">
            <strong>🎉 Multi-Project Management Unlocked!</strong> Your studio can now handle multiple projects simultaneously. 
            Try the new dashboard to see your expanded capabilities.
          </AlertDescription>
        </Alert>

        {/* Choice between views */}
        <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <Button
            onClick={() => setShowMultiProjectInTransition(false)}
            variant={!showMultiProjectInTransition ? 'default' : 'outline'}
            className="flex items-center"
          >
            Simple View
          </Button>
          <Button
            onClick={() => setShowMultiProjectInTransition(true)}
            variant={showMultiProjectInTransition ? 'default' : 'outline'}
            className="flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Multi-Project Dashboard
            <Badge className="ml-2 bg-green-100 text-green-800">New!</Badge>
          </Button>
        </div>

        {/* Render selected view */}
        {showMultiProjectInTransition ? (
          <MultiProjectDashboard
            gameState={gameState}
            setGameState={setGameState}
            onProjectSelect={onProjectSelect}
          />
        ) : (
          <ActiveProject
            gameState={gameState}
            setGameState={setGameState}
            focusAllocation={currentFocusAllocation}
            setFocusAllocation={handleSetFocusAllocation}
            onProjectSelect={onProjectSelect}
            performDailyWork={performDailyWork}
            onMinigameReward={onMinigameReward}
            onProjectComplete={onProjectComplete}
            autoTriggeredMinigame={autoTriggeredMinigame}
            clearAutoTriggeredMinigame={clearAutoTriggeredMinigame}
          />
        )}
      </div>
    );
  };

  // Render advanced multi-project view for experienced players
  const renderAdvancedMultiProjectView = () => {
    return (
      <div className="space-y-6 h-full overflow-y-auto p-1">        
        <MultiProjectDashboard
          gameState={gameState}
          setGameState={setGameState}
          onProjectSelect={onProjectSelect}
        />
      </div>
    );
  };

  // Main render logic based on progression
  const isMultiProjectUnlocked = progressionStatus.isMultiProjectUnlocked;
  const currentLevel = progressionStatus.currentMilestone?.level || 1;
  const isNewlyUnlocked = isMultiProjectUnlocked && currentLevel === 3; // First multi-project milestone

  if (!isMultiProjectUnlocked) {
    return renderSingleProjectView();
  } else if (isNewlyUnlocked) {
    return renderTransitionView();
  } else {
    return renderAdvancedMultiProjectView();
  }
};
