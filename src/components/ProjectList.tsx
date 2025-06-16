import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState, Project } from '@/types/game';
import { generateNewProjects } from '@/utils/projectUtils';
import { useMarketTrends } from '@/hooks/useMarketTrends';
import { MusicGenre, TrendDirection } from '@/types/charts';
import { ArrowUp, ArrowDown, MinusCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export interface ProjectListProps { // Ensured export
  gameState: GameState;
  startProject: (project: Project) => void;
  updateGameState: (updater: (prevState: GameState) => GameState) => void;
}

const TrendIconDisplay = ({ direction }: { direction?: TrendDirection }) => {
  if (!direction) return null;
  switch (direction) {
    case 'rising': return <ArrowUp className="h-3 w-3 text-green-400 ml-1 inline" aria-label="Rising trend" />;
    case 'falling': return <ArrowDown className="h-3 w-3 text-red-400 ml-1 inline" aria-label="Falling trend" />;
    case 'stable': return <MinusCircle className="h-3 w-3 text-yellow-400 ml-1 inline" aria-label="Stable trend" />;
    case 'emerging': return <TrendingUp className="h-3 w-3 text-blue-400 ml-1 inline" aria-label="Emerging trend" />;
    case 'fading': return <TrendingDown className="h-3 w-3 text-gray-400 ml-1 inline" aria-label="Fading trend" />;
    default: return <AlertCircle className="h-3 w-3 text-gray-500 ml-1 inline" aria-label="Unknown trend" />;
  }
};

export const ProjectList: React.FC<ProjectListProps> = ({
  gameState,
  startProject,
  updateGameState 
}) => {
  const { getTrendForGenre } = useMarketTrends(updateGameState);

  const handleRefreshProjects = () => {
    updateGameState(prev => ({ 
      ...prev, 
      availableProjects: [...generateNewProjects(5, prev.playerData.level, prev.currentEra)] 
    }));
  };

  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 h-full flex flex-col backdrop-blur-sm animate-slide-in-left">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Available Projects</h2>
        <Button 
          onClick={handleRefreshProjects}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Refresh
        </Button>
      </div>

      {gameState.activeProject && (
        <Card className="p-4 bg-blue-900/80 border-blue-400 backdrop-blur-sm mb-4">
          <div className="text-sm text-blue-200 mb-2">Currently working on: <strong className="text-white">{gameState.activeProject.title}</strong></div>
          <div className="text-xs text-gray-300">Complete it before taking another.</div>
          
          <div className="mt-2 pt-2 border-t border-blue-400/30">
            <div className="text-xs text-blue-300 mb-1">Assigned Staff:</div>
            {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).map(staff => (
              <div key={staff.id} className="text-xs text-gray-200">
                {staff.name} ({staff.role})
              </div>
            ))}
            {gameState.hiredStaff.filter(s => s.assignedProjectId === gameState.activeProject?.id).length === 0 && (
              <div className="text-xs text-gray-400">No staff assigned</div>
            )}
          </div>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {gameState.availableProjects.map(project => {
          const trend = getTrendForGenre(project.genre as MusicGenre, project.subGenreId); 
          return (
            <Card key={project.id} className="p-4 bg-gray-900/90 border-gray-600 hover:bg-gray-800/90 transition-colors backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white">{project.title}</h3>
                <span className="text-xs bg-red-600 px-2 py-1 rounded text-white whitespace-nowrap">{project.clientType}</span>
              </div>
              <div className="text-sm space-y-1 text-gray-200">
                <div>
                  Genre: <span className="text-white capitalize">{project.genre}</span>
                  <TrendIconDisplay direction={trend?.trendDirection} /> 
                </div>
                <div>Difficulty: <span className="text-orange-400">{project.difficulty}</span></div>
                <div className="text-green-400 font-semibold">${project.payoutBase.toLocaleString()}</div>
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
          );
        })}
        {gameState.availableProjects.length === 0 && !gameState.activeProject && (
          <p className="text-center text-gray-400 py-8">No projects available. Try refreshing or wait for new opportunities.</p>
        )}
      </div>
    </Card>
  );
};
