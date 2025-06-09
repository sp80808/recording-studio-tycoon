
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Music2, Mic, Headphones, Volume2 } from 'lucide-react';

interface AnimatedProjectProgressProps {
  project: any;
  creativityPoints: number;
  technicalPoints: number;
}

export const AnimatedProjectProgress: React.FC<AnimatedProjectProgressProps> = ({
  project,
  creativityPoints,
  technicalPoints
}) => {
  const [animatedCreativity, setAnimatedCreativity] = useState(0);
  const [animatedTechnical, setAnimatedTechnical] = useState(0);
  const [stageAnimation, setStageAnimation] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCreativity(creativityPoints);
      setAnimatedTechnical(technicalPoints);
    }, 300);
    return () => clearTimeout(timer);
  }, [creativityPoints, technicalPoints]);

  const stages = [
    { name: 'Pre-Production', icon: Music2, color: 'text-blue-400' },
    { name: 'Recording', icon: Mic, color: 'text-red-400' },
    { name: 'Mixing', icon: Headphones, color: 'text-green-400' },
    { name: 'Mastering', icon: Volume2, color: 'text-purple-400' }
  ];

  const currentStageIndex = Math.floor((creativityPoints + technicalPoints) / project.requiredCPoints * 4);

  return (
    <Card className="p-4 bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-600">
      <div className="space-y-4">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{project.title}</h3>
          <Badge className="bg-purple-600 text-white">{project.genre}</Badge>
        </div>

        {/* Stage Progress */}
        <div className="grid grid-cols-4 gap-2">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            
            return (
              <div
                key={stage.name}
                className={`text-center p-2 rounded-lg transition-all duration-500 ${
                  isActive 
                    ? 'bg-gray-700/50 border border-gray-600' 
                    : 'bg-gray-800/30 border border-gray-700'
                } ${isCurrent ? 'animate-pulse' : ''}`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-1 ${isActive ? stage.color : 'text-gray-500'}`} />
                <div className={`text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {stage.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-blue-300">Creativity</span>
              <span className="text-sm text-blue-300">{animatedCreativity}/{project.requiredCPoints}</span>
            </div>
            <Progress 
              value={(animatedCreativity / project.requiredCPoints) * 100} 
              className="h-3 bg-gray-700"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-green-300">Technical</span>
              <span className="text-sm text-green-300">{animatedTechnical}/{project.requiredTPoints}</span>
            </div>
            <Progress 
              value={(animatedTechnical / project.requiredTPoints) * 100} 
              className="h-3 bg-gray-700"
            />
          </div>
        </div>

        {/* Overall Progress */}
        <div className="pt-2 border-t border-gray-600">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-purple-300 font-medium">Overall Progress</span>
            <span className="text-sm text-purple-300">
              {Math.round(((animatedCreativity + animatedTechnical) / (project.requiredCPoints + project.requiredTPoints)) * 100)}%
            </span>
          </div>
          <Progress 
            value={((animatedCreativity + animatedTechnical) / (project.requiredCPoints + project.requiredTPoints)) * 100}
            className="h-4 bg-gray-700"
          />
        </div>
      </div>
    </Card>
  );
};
