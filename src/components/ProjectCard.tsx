import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Project } from '@/types/game';

interface ProjectCardProps {
  project: Project;
  onStartProject: (project: Project) => void;
  isActiveProject: boolean;
}

const ProjectCardComponent: React.FC<ProjectCardProps> = ({ project, onStartProject, isActiveProject }) => {
  return (
    <Card className="p-4 bg-gray-900/90 border-gray-600 hover:bg-gray-800/90 transition-colors backdrop-blur-sm">
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
        onClick={() => onStartProject(project)}
        disabled={isActiveProject}
        className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white"
        size="sm"
      >
        Start Project
      </Button>
    </Card>
  );
};

export const ProjectCard = React.memo(ProjectCardComponent);
