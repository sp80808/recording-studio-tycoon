import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Info, Lock } from 'lucide-react';
import { GameState } from '@/types/game';
import { ProgressionSystem } from '@/services/ProgressionSystem';

interface StudioProgressionPanelProps {
  gameState: GameState;
}

export const StudioProgressionPanel: React.FC<StudioProgressionPanelProps> = ({ gameState }) => {
  const [showProgressionInfo, setShowProgressionInfo] = useState(false);
  
  const progressionStatus = ProgressionSystem.getProgressionStatus(gameState);
  
  if (!progressionStatus) {
    return null;
  }

  const nextRequirements = ProgressionSystem.getNextUnlockRequirements(gameState);
  
  return (
    <Card className="border-gray-700 bg-gray-800">
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
