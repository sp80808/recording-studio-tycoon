// Progressive Project Interface - Automatically switches between single and multi-project views
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Lock, TrendingUp, Users, Zap, Info } from 'lucide-react';
import { GameState, Project, GameNotification, FocusAllocation } from '@/types/game';
import { ProgressionSystem, ProgressionStatus } from '@/services/ProgressionSystem';
import { useMultiProjectManagement } from '@/hooks/useMultiProjectManagement';
import { MultiProjectDashboard } from '@/components/MultiProjectDashboard';
import { ActiveProject } from '@/components/ActiveProject';

interface ProgressiveProjectInterfaceProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  focusAllocation?: FocusAllocation;
  setFocusAllocation?: (allocation: FocusAllocation) => void;
  performDailyWork?: () => { isComplete: boolean; finalProjectData?: Project } | undefined;
  onMinigameReward?: (creativityBonus: number, technicalBonus: number, xpBonus: number, minigameType?: string) => void;
  onProjectComplete?: (completedProject: Project) => void;
  onProjectSelect?: (project: Project) => void;
  autoTriggeredMinigame?: { type: any; reason: string } | null;
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
  const [showProgressionInfo, setShowProgressionInfo] = useState(false);
  const [lastMilestone, setLastMilestone] = useState<number>(0);

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

  const multiProjectProps = useMultiProjectManagement({ gameState, setGameState });

  if (!progressionStatus) {
    return <div>Loading...</div>;
  }

  // Render progression info panel
  const renderProgressionInfo = () => {
    const nextRequirements = ProgressionSystem.getNextUnlockRequirements(gameState);
    
    return (
      <Card className="mb-4 border-gray-700 bg-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base">
            <Star className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-white">Studio Progression</span>
            <Button
              onClick={() => setShowProgressionInfo(!showProgressionInfo)}
              variant="ghost"
              size="sm"
              className="ml-auto text-gray-400 hover:text-white"
            >
              <Info className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Current Milestone */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white text-sm">
                {progressionStatus.currentMilestone?.unlockMessage?.split('!')[0] || 'Starting Out'}
              </div>
              <div className="text-xs text-gray-400">
                Level {progressionStatus.currentMilestone?.level || 1} Studio
              </div>
            </div>
            <Badge className="bg-blue-600 text-white border-blue-500 text-xs">
              Current
            </Badge>
          </div>

          {/* Progress to Next */}
          {progressionStatus.nextMilestone && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Next Unlock Progress</span>
                <span className="font-medium text-white">
                  {Math.round(progressionStatus.progressToNext * 100)}%
                </span>
              </div>
              <Progress 
                value={progressionStatus.progressToNext * 100} 
                className="h-1.5 bg-gray-700"
                aria-label="Progress to next milestone"
              />
            </div>
          )}

          {/* Expandable Details */}
          {showProgressionInfo && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              {/* Current Features */}
              <div>
                <div className="text-xs font-medium text-white mb-1">Available Features:</div>
                <div className="flex flex-wrap gap-1">
                  {progressionStatus.currentMilestone?.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Next Requirements */}
              {nextRequirements && (
                <div>
                  <div className="text-xs font-medium text-white mb-1">Next Milestone Requirements:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-gray-400">Level</div>
                      <div className={nextRequirements.currentLevel >= nextRequirements.levelNeeded ? 'text-green-400' : 'text-orange-400'}>
                        {nextRequirements.currentLevel}/{nextRequirements.levelNeeded}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-400">Staff</div>
                      <div className={nextRequirements.currentStaff >= nextRequirements.staffNeeded ? 'text-green-400' : 'text-orange-400'}>
                        {nextRequirements.currentStaff}/{nextRequirements.staffNeeded}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-400">Projects</div>
                      <div className={nextRequirements.currentProjects >= nextRequirements.projectsNeeded ? 'text-green-400' : 'text-orange-400'}>
                        {nextRequirements.currentProjects}/{nextRequirements.projectsNeeded}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Features Preview */}
              {progressionStatus.nextMilestone && (
                <div>
                  <div className="text-xs font-medium text-white mb-1">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Upcoming Features:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {progressionStatus.nextMilestone.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs border-gray-600 text-gray-400 opacity-60">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render single project view for early game
  const renderSingleProjectView = () => {
    return (
      <div className="space-y-6 h-full overflow-y-auto p-1">
        {renderProgressionInfo()}
        
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
        />
      </div>
    );
  };

  // Render transition view when multi-project is newly unlocked
  const renderTransitionView = () => {
    const [showMultiProject, setShowMultiProject] = useState(false);

    return (
      <div className="space-y-6 h-full overflow-y-auto p-1">
        {renderProgressionInfo()}
        
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
            onClick={() => setShowMultiProject(false)}
            variant={!showMultiProject ? 'default' : 'outline'}
            className="flex items-center"
          >
            Simple View
          </Button>
          <Button
            onClick={() => setShowMultiProject(true)}
            variant={showMultiProject ? 'default' : 'outline'}
            className="flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            Multi-Project Dashboard
            <Badge className="ml-2 bg-green-100 text-green-800">New!</Badge>
          </Button>
        </div>

        {/* Render selected view */}
        {showMultiProject ? (
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
          />
        )}
      </div>
    );
  };

  // Render advanced multi-project view for experienced players
  const renderAdvancedMultiProjectView = () => {
    return (
      <div className="space-y-6 h-full overflow-y-auto p-1">
        {renderProgressionInfo()}
        
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
