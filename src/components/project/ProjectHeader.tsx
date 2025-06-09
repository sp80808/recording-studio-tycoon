
import React from 'react';
import { Project } from '@/types/game';

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="animate-fade-in">
        <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
        <p className="text-gray-300 text-sm mb-2">{project.genre} • {project.clientType}</p>
        <div className="flex gap-4 text-sm">
          <span className="text-green-400 animate-pulse">💰 ${project.payoutBase}</span>
          <span className="text-blue-400">🎵 {project.genre}</span>
          <span className="text-purple-400">⭐ {project.difficulty}</span>
        </div>
      </div>
      <div className="text-right animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="text-yellow-400 font-bold">{project.durationDaysTotal} days total</div>
        <div className="text-gray-400 text-sm">Work sessions: {project.workSessionCount || 0}</div>
        <div className="mt-2 space-y-1">
          <div id="creativity-points" data-creativity-target className="text-blue-400 text-sm">
            🎨 {project.accumulatedCPoints} creativity
          </div>
          <div id="technical-points" data-technical-target className="text-green-400 text-sm">
            ⚙️ {project.accumulatedTPoints} technical
          </div>
        </div>
      </div>
    </div>
  );
};
