// Progressive Project Interface - Automatically switches between single and multi-project views
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Lock, TrendingUp, Users, Zap, Info } from 'lucide-react';
import { GameState, Project, GameNotification } from '@/types/game';
import { ProgressionSystem, ProgressionStatus } from '@/services/ProgressionSystem';
import { useMultiProjectManagement } from '@/hooks/useMultiProjectManagement';
import { MultiProjectDashboard } from '@/components/MultiProjectDashboard';
import { ActiveProject } from '@/components/ActiveProject';

interface ProgressiveProjectInterfaceProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  onProjectSelect?: (project: Project) => void;
}

export const ProgressiveProjectInterface: React.FC<ProgressiveProjectInterfaceProps> = ({
  gameState,
  setGameState,
  onProjectSelect
}) => {
  const [progressionStatus, setProgressionStatus] = useState<ProgressionStatus | null>(null);
  const [showProgressionInfo, setShowProgressionInfo] = useState(false);
  const [lastMilestone, setLastMilestone] = useState<number>(0);

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
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Star className="w-5 h-5 mr-2 text-blue-600" />
            Studio Progression
            <Button
              onClick={() => setShowProgressionInfo(!showProgressionInfo)}
              variant="ghost"
              size="sm"
              className="ml-auto"
            >
              <Info className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Milestone */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">
                {progressionStatus.currentMilestone?.unlockMessage?.split('!')[0] || 'Starting Out'}
              </div>
              <div className="text-sm text-blue-700">
                Level {progressionStatus.currentMilestone?.level || 1} Studio
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              Current
            </Badge>
          </div>

          {/* Progress to Next */}
          {progressionStatus.nextMilestone && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">Next Unlock Progress</span>
                <span className="font-medium text-blue-900">
                  {Math.round(progressionStatus.progressToNext * 100)}%
                </span>
              </div>
              <Progress 
                value={progressionStatus.progressToNext * 100} 
                className="h-2 bg-blue-100"
              />
            </div>
          )}

          {/* Expandable Details */}
          {showProgressionInfo && (
            <div className="space-y-3 pt-2 border-t border-blue-200">
              {/* Current Features */}
              <div>
                <div className="text-sm font-medium text-blue-900 mb-2">Available Features:</div>
                <div className="flex flex-wrap gap-1">
                  {progressionStatus.currentMilestone?.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Next Requirements */}
              {nextRequirements && (
                <div>
                  <div className="text-sm font-medium text-blue-900 mb-2">Next Milestone Requirements:</div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="font-medium">Level</div>
                      <div className={nextRequirements.currentLevel >= nextRequirements.levelNeeded ? 'text-green-600' : 'text-orange-600'}>
                        {nextRequirements.currentLevel}/{nextRequirements.levelNeeded}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Staff</div>
                      <div className={nextRequirements.currentStaff >= nextRequirements.staffNeeded ? 'text-green-600' : 'text-orange-600'}>
                        {nextRequirements.currentStaff}/{nextRequirements.staffNeeded}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Projects</div>
                      <div className={nextRequirements.currentProjects >= nextRequirements.projectsNeeded ? 'text-green-600' : 'text-orange-600'}>
                        {nextRequirements.currentProjects}/{nextRequirements.projectsNeeded}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Features Preview */}
              {progressionStatus.nextMilestone && (
                <div>
                  <div className="text-sm font-medium text-blue-900 mb-2">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Upcoming Features:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {progressionStatus.nextMilestone.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs opacity-60">
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
      <div className="space-y-6">
        {renderProgressionInfo()}
        
        {/* Hint about upcoming multi-project capability */}
        {progressionStatus.progressToNext > 0.7 && progressionStatus.nextMilestone && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <TrendingUp className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Studio Expansion Coming Soon!</strong> You're close to unlocking multi-project management. 
              Keep growing your studio to handle multiple projects simultaneously.
            </AlertDescription>
          </Alert>
        )}

        {/* Traditional single project interface */}
        <ActiveProject
          gameState={gameState}
          setGameState={setGameState}
          onProjectSelect={onProjectSelect}
        />
      </div>
    );
  };

  // Render transition view when multi-project is newly unlocked
  const renderTransitionView = () => {
    const [showMultiProject, setShowMultiProject] = useState(false);

    return (
      <div className="space-y-6">
        {renderProgressionInfo()}
        
        {/* New Feature Announcement */}
        <Alert className="border-green-200 bg-green-50">
          <Zap className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>🎉 Multi-Project Management Unlocked!</strong> Your studio can now handle multiple projects simultaneously. 
            Try the new dashboard to see your expanded capabilities.
          </AlertDescription>
        </Alert>

        {/* Choice between views */}
        <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
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
            onProjectSelect={onProjectSelect}
          />
        )}
      </div>
    );
  };

  // Render advanced multi-project view for experienced players
  const renderAdvancedMultiProjectView = () => {
    return (
      <div className="space-y-6">
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
