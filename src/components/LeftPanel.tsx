
import React from 'react';
import { Card } from '@/components/ui/card';
import { GameState, Project } from '@/types/game';
import { EnhancedProjectList } from './EnhancedProjectList';

interface LeftPanelProps {
  gameState: GameState;
  startProject: (project: Project) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  gameState,
  startProject
}) => {
  return (
    <div className="space-y-4">
      <EnhancedProjectList 
        gameState={gameState}
        setGameState={() => {}} // This will be handled by the parent
        startProject={startProject}
      />
    </div>
  );
};
