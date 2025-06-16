// Progressive Project Interface - Automatically switches between single and multi-project views
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Zap } from 'lucide-react';
import { GameState, Project, GameNotification, FocusAllocation, MinigameType, ProjectReport } from '@/types/game';
import { ProgressionSystem, ProgressionStatus } from '@/services/ProgressionSystem';
import { useMultiProjectManagement } from '@/hooks/useMultiProjectManagement';
import { MultiProjectDashboard } from '@/components/MultiProjectDashboard';
import { ActiveProject, ActiveProjectProps } from '@/components/ActiveProject';

export interface ProgressiveProjectInterfaceProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  focusAllocation?: FocusAllocation;
  setFocusAllocation?: (allocation: FocusAllocation) => void;
  performDailyWork?: () => { isComplete: boolean; finalProjectData?: Project | null; review?: ProjectReport | null } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project, review: ProjectReport | null) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: { type: MinigameType; reason: string } | null;
  clearAutoTriggeredMinigame?: () => void;
}

// Define TransitionView as a sub-component to handle its own state
const TransitionView: React.FC<Pick<ProgressiveProjectInterfaceProps, 'gameState' | 'setGameState' | 'onProjectSelect'> & { activeProjectProps: ActiveProjectProps }> = 
({ gameState, setGameState, onProjectSelect, activeProjectProps }) => {
  const [showMultiProject, setShowMultiProject] = useState(false);
  return (
    <div className="space-y-6 h-full overflow-y-auto p-1">        
      <Alert className="border-green-600 bg-gray-800">
        <Zap className="w-4 h-4 text-green-400" />
        <AlertDescription className="text-green-200">
          <strong>🎉 Multi-Project Management Unlocked!</strong> Your studio can now handle multiple projects simultaneously. 
          Try the new dashboard to see your expanded capabilities.
        </AlertDescription>
      </Alert>
      <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <Button onClick={() => setShowMultiProject(false)} variant={!showMultiProject ? 'default' : 'outline'} className="flex items-center">Simple View</Button>
        <Button onClick={() => setShowMultiProject(true)} variant={showMultiProject ? 'default' : 'outline'} className="flex items-center">
          <Zap className="w-4 h-4 mr-2" /> Multi-Project Dashboard <Badge className="ml-2 bg-green-100 text-green-800">New!</Badge>
        </Button>
      </div>
      {showMultiProject ? <MultiProjectDashboard gameState={gameState} setGameState={setGameState} onProjectSelect={onProjectSelect} /> : <ActiveProject {...activeProjectProps} />}
    </div>
  );
};

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
  const [lastMilestone, setLastMilestone] = useState<number>(0);

  const defaultFocusAllocation: FocusAllocation = {
    performance: 50, soundCapture: 50, layering: 50,
    creativity: 50, technical: 50, business: 50,
  };

  const currentFocusAllocation = focusAllocation || defaultFocusAllocation;
  const handleSetFocusAllocation = setFocusAllocation || (() => {});

  useEffect(() => {
    if (!gameState) return;
    const status = ProgressionSystem.getProgressionStatus(gameState);
    setProgressionStatus(status);

    const currentMilestoneLevel = status.currentMilestone?.level || 0;
    if (currentMilestoneLevel > lastMilestone && lastMilestone > 0) {
      const notification: GameNotification = {
        id: `milestone_${currentMilestoneLevel}_${Date.now()}`,
        message: status.currentMilestone?.unlockMessage || 'New milestone reached!',
        type: 'success', timestamp: Date.now(), duration: 8000, priority: 'high'
      };
      setGameState(prev => ({ ...prev!, notifications: [...prev!.notifications, notification] }));
    }
    setLastMilestone(currentMilestoneLevel);
  }, [gameState, lastMilestone, setGameState]);

  if (!progressionStatus || !gameState) { 
    return <div>Loading...</div>;
  }
  
  const activeProjectProps: ActiveProjectProps = {
    gameState, setGameState,
    focusAllocation: currentFocusAllocation,
    setFocusAllocation: handleSetFocusAllocation,
    onProjectSelect: onProjectSelect, performDailyWork, onMinigameReward, onProjectComplete,
    autoTriggeredMinigame, clearAutoTriggeredMinigame,
  };

  const renderSingleProjectView = () => (
    <div className="space-y-6 h-full overflow-y-auto p-1">        
      {progressionStatus.progressToNext > 0.7 && progressionStatus.nextMilestone && (
        <Alert className="border-yellow-600 bg-gray-800">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          <AlertDescription className="text-yellow-200">
            <strong>Studio Expansion Coming Soon!</strong> You're close to unlocking multi-project management. 
            Keep growing your studio to handle multiple projects simultaneously.
          </AlertDescription>
        </Alert>
      )}
      <ActiveProject {...activeProjectProps} />
    </div>
  );

  const renderAdvancedMultiProjectView = () => (
    <div className="space-y-6 h-full overflow-y-auto p-1">        
      <MultiProjectDashboard gameState={gameState} setGameState={setGameState} onProjectSelect={onProjectSelect} />
    </div>
  );

  const isMultiProjectUnlocked = progressionStatus.isMultiProjectUnlocked;
  const currentLevel = progressionStatus.currentMilestone?.level || 1;
  const isNewlyUnlocked = isMultiProjectUnlocked && currentLevel === 3; 

  if (!isMultiProjectUnlocked) {
    return renderSingleProjectView();
  } else if (isNewlyUnlocked) {
    return <TransitionView 
              gameState={gameState} 
              setGameState={setGameState} 
              onProjectSelect={onProjectSelect} 
              activeProjectProps={activeProjectProps} 
            />;
  } else {
    return renderAdvancedMultiProjectView();
  }
};
