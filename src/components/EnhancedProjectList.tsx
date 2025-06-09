
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Star, TrendingUp, Clock } from 'lucide-react';

interface EnhancedProjectListProps {
  gameState: any;
  setGameState: any;
  startProject: any;
}

export const EnhancedProjectList: React.FC<EnhancedProjectListProps> = ({
  gameState,
  setGameState,
  startProject
}) => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [projectAnimations, setProjectAnimations] = useState<Record<string, boolean>>({});

  // Animate new projects appearing
  useEffect(() => {
    gameState.availableProjects.forEach((project: any) => {
      if (!projectAnimations[project.id]) {
        setProjectAnimations(prev => ({ ...prev, [project.id]: true }));
        setTimeout(() => {
          setProjectAnimations(prev => ({ ...prev, [project.id]: false }));
        }, 1000);
      }
    });
  }, [gameState.availableProjects]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'hard': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getGenreIcon = (genre: string) => {
    const icons: Record<string, string> = {
      'Rock': '🎸',
      'Pop': '🎤',
      'Electronic': '🎛️',
      'Hip-hop': '🎵',
      'Jazz': '🎺',
      'Classical': '🎼',
      'Country': '🤠',
      'Blues': '🎷'
    };
    return icons[genre] || '🎵';
  };

  return (
    <Card className="bg-gray-900/90 border-gray-600 p-4 h-full overflow-y-auto backdrop-blur-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Music className="w-6 h-6 text-purple-400" />
            Available Projects
          </h2>
          <Badge className="bg-purple-600 text-white">
            {gameState.availableProjects.length} Available
          </Badge>
        </div>

        <div className="space-y-3">
          {gameState.availableProjects.map((project: any) => (
            <Card
              key={project.id}
              className={`p-4 border transition-all duration-300 cursor-pointer transform hover:scale-102 ${
                hoveredProject === project.id 
                  ? 'border-purple-400 bg-gray-800/80 shadow-lg shadow-purple-400/20' 
                  : 'border-gray-600 bg-gray-800/60'
              } ${
                projectAnimations[project.id] ? 'animate-smooth-slide-in' : ''
              }`}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
            >
              <div className="space-y-3">
                {/* Project Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getGenreIcon(project.genre)}</span>
                    <div>
                      <h3 className="font-semibold text-white">{project.title}</h3>
                      <p className="text-sm text-gray-300">{project.genre}</p>
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(project.difficulty)}>
                    {project.difficulty}
                  </Badge>
                </div>

                {/* Band Info */}
                {project.associatedBand && (
                  <div className="bg-gray-700/50 rounded-lg p-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-300">🎸 {project.associatedBand.bandName}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          <span className="text-yellow-400">{project.associatedBand.fame}</span>
                        </div>
                        {project.associatedBand.notoriety > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-red-400">💀</span>
                            <span className="text-red-400">{project.associatedBand.notoriety}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300">Creativity</span>
                      <span className="text-blue-400">{project.requiredCPoints}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-300">Technical</span>
                      <span className="text-green-400">{project.requiredTPoints}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-300">Reward</span>
                      <span className="text-yellow-400">${project.reward}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Days
                      </span>
                      <span className="text-purple-400">{project.deadline}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => startProject(project)}
                  disabled={!!gameState.activeProject}
                  className={`w-full transition-all duration-200 ${
                    hoveredProject === project.id
                      ? 'bg-purple-600 hover:bg-purple-700 transform scale-105'
                      : 'bg-purple-700 hover:bg-purple-600'
                  } text-white enhanced-button`}
                >
                  {gameState.activeProject ? 'Studio Busy' : 'Start Project'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {gameState.availableProjects.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-pulse">🎵</div>
            <p className="text-gray-400">No projects available right now.</p>
            <p className="text-sm text-gray-500 mt-2">Check back tomorrow!</p>
          </div>
        )}
      </div>
    </Card>
  );
};
