
import React from 'react';
import { Card } from '@/components/ui/card';

export const EmptyProjectState: React.FC = () => {
  return (
    <Card className="flex-1 bg-gray-800/50 border-gray-600 p-6 backdrop-blur-sm">
      <div className="text-center text-gray-400 animate-fade-in">
        <div className="text-6xl mb-4 animate-pulse">🎵</div>
        <h3 className="text-xl font-bold mb-2">No Active Project</h3>
        <p>Select a project from the left panel to start working</p>
      </div>
    </Card>
  );
};
