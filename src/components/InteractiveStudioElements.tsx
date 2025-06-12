
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Music, Zap, TrendingUp, Star } from 'lucide-react';

interface InteractiveStudioElementsProps {
  gameState: any;
  onStudioBoost?: () => void;
}

export const InteractiveStudioElements: React.FC<InteractiveStudioElementsProps> = ({
  gameState,
  onStudioBoost
}) => {
  const [studioVibes, setStudioVibes] = useState(50);
  const [inspirationLevel, setInspirationLevel] = useState(75);
  const [creativeFlow, setCreativeFlow] = useState(60);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Animate inspiration based on project activity
  useEffect(() => {
    if (gameState.activeProject) {
      const interval = setInterval(() => {
        setInspirationLevel(prev => Math.min(100, prev + Math.random() * 5));
        setCreativeFlow(prev => Math.min(100, prev + Math.random() * 3));
        setPulseAnimation(true);
        setTimeout(() => setPulseAnimation(false), 1000);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [gameState.activeProject]);

  const handleStudioInteraction = (type: string) => {
    switch (type) {
      case 'vibes':
        setStudioVibes(prev => Math.min(100, prev + 10));
        break;
      case 'inspiration':
        setInspirationLevel(prev => Math.min(100, prev + 15));
        break;
      case 'flow':
        setCreativeFlow(prev => Math.min(100, prev + 8));
        onStudioBoost?.();
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Studio Atmosphere Panel */}
      <Card className={`p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30 transition-all duration-500 ${pulseAnimation ? 'animate-pulse' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          Studio Atmosphere
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-200">Vibes</span>
            <Badge variant="outline" className="text-purple-300 border-purple-400">
              {studioVibes}%
            </Badge>
          </div>
          <Progress value={studioVibes} className="h-2 bg-purple-800/50" />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-200">Inspiration</span>
            <Badge variant="outline" className="text-blue-300 border-blue-400">
              {inspirationLevel}%
            </Badge>
          </div>
          <Progress value={inspirationLevel} className="h-2 bg-blue-800/50" />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-200">Creative Flow</span>
            <Badge variant="outline" className="text-green-300 border-green-400">
              {creativeFlow}%
            </Badge>
          </div>
          <Progress value={creativeFlow} className="h-2 bg-green-800/50" />
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStudioInteraction('vibes')}
            className="flex-1 border-purple-400 text-purple-300 hover:bg-purple-400/20"
          >
            <Zap className="w-4 h-4 mr-1" />
            Boost
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStudioInteraction('inspiration')}
            className="flex-1 border-blue-400 text-blue-300 hover:bg-blue-400/20"
          >
            <Star className="w-4 h-4 mr-1" />
            Inspire
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStudioInteraction('flow')}
            className="flex-1 border-green-400 text-green-300 hover:bg-green-400/20"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Flow
          </Button>
        </div>
      </Card>

      {/* Era Vibes Indicator */}
      <Card className="p-3 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-amber-200 text-sm font-medium">
            {gameState.currentEra || '2020s'} Era Vibes
          </span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= 4 ? 'text-amber-400 fill-current' : 'text-amber-600'} animate-pulse`}
                style={{ animationDelay: `${star * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
