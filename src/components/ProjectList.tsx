
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, Project } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';

interface ProjectListProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  startProject: (project: Project) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  gameState,
  setGameState,
  startProject
}) => {
  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 h-full flex flex-col backdrop-blur-sm animate-slide-in-left">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Available Projects</h2>
        <Button 
          onClick={() => setGameState(prev => ({ 
            ...prev, 
            availableProjects: [...prev.availableProjects, ...generateNewProjects(1, prev.playerData.level, prev.currentEra)] 
          }))}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Refresh
        </Button>
      </div>

      {gameState.activeProject && (
        <Card className="p-4 bg-blue-900/80 border-blue-400 backdrop-blur-sm mb-4">
          <div className="text-sm text-blue-200 mb-2 font-semibold">📋 Project Status</div>
          <div className="text-sm text-white mb-1">Working on: {gameState.activeProject.title}</div>
          <div className="text-xs text-blue-300 mb-2">
            Stage {gameState.activeProject.currentStageIndex + 1} of {gameState.activeProject.stages.length}
          </div>
          <div className="text-xs text-gray-300 bg-blue-900/40 p-2 rounded border-l-2 border-blue-400">
            💡 Tip: Switch to the "Studio" tab to work on this project
          </div>
          
          {/* Show assigned staff */}
          <div className="mt-3 pt-2 border-t border-blue-400/30">
            <div className="text-xs text-blue-300 mb-1">Assigned Staff:</div>
            {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).map(staff => (
              <div key={staff.id} className="text-xs text-gray-200">
                👤 {staff.name} ({staff.role})
              </div>
            ))}
            {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).length === 0 && (
              <div className="text-xs text-gray-400">No staff assigned</div>
            )}
          </div>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto space-y-3">
        {gameState.availableProjects.map(project => (
          <Card key={project.id} className="p-4 bg-gray-900/90 border-gray-600 hover:bg-gray-800/90 transition-colors backdrop-blur-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-white">{project.title}</h3>
              <span className="text-xs bg-red-600 px-2 py-1 rounded text-white">{project.clientType}</span>
            </div>
            <div className="text-sm space-y-1 text-gray-200">
              <div>Genre: <span className="text-white">{project.genre}</span></div>
              <div>Difficulty: <span className="text-orange-400">{project.difficulty}</span></div>
              <div className="text-green-400 font-semibold">${project.payoutBase}</div>
              <div className="text-blue-400 font-semibold">+{project.repGainBase} Rep</div>
              <div className="text-yellow-400 font-semibold">{project.durationDaysTotal} days</div>
            </div>
            <Button 
              onClick={() => startProject(project)}
              disabled={!!gameState.activeProject}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white"
              size="sm"
            >
              Start Project
            </Button>
          </Card>
        ))}
      </div>
    </Card>
  );
};
