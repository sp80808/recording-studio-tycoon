
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Project } from '@/types/game';

interface ProjectProgressProps {
  project: Project;
}

export const ProjectProgress: React.FC<ProjectProgressProps> = ({ project }) => {
  const currentStage = project.stages[project.currentStageIndex] || project.stages[0];
  const currentStageProgress = currentStage ? (currentStage.workUnitsCompleted / currentStage.workUnitsBase) * 100 : 0;
  
  const totalWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((total, stage) => total + stage.workUnitsCompleted, 0);
  const overallProgress = totalWorkUnits > 0 ? (completedWorkUnits / totalWorkUnits) * 100 : 0;

  const isCurrentStageComplete = currentStage && currentStage.workUnitsCompleted >= currentStage.workUnitsBase;
  const isProjectComplete = project.stages.every(stage => stage.completed);

  return (
    <>
      {/* Stage Completion Notification */}
      {isCurrentStageComplete && !isProjectComplete && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500 rounded-lg animate-scale-in">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-green-400 font-semibold mb-1">✅ Stage Complete!</h4>
              <p className="text-gray-300 text-sm">
                {currentStage.stageName} finished! Continue working to advance to the next stage.
              </p>
            </div>
            <div className="text-2xl animate-bounce">🎉</div>
          </div>
        </div>
      )}

      {/* Current Stage Progress */}
      <div className="mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">
            Current Stage: {currentStage?.stageName || 'Unknown'}
          </span>
          <span className="text-gray-400">
            {currentStage?.workUnitsCompleted || 0}/{currentStage?.workUnitsBase || 0}
          </span>
        </div>
        <Progress value={currentStageProgress} className="h-3 mb-2 transition-all duration-500" />
        {currentStage?.completed && (
          <div className="text-green-400 text-sm animate-scale-in">✓ Stage Complete!</div>
        )}
      </div>

      {/* Overall Project Progress */}
      <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold">Overall Progress</span>
          <span className="text-gray-400">{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-3 progress-bar transition-all duration-500" />
      </div>
    </>
  );
};
