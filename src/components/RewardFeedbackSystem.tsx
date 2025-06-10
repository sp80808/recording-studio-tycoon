
import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';

interface Reward {
  id: string;
  type: 'xp' | 'money' | 'reputation' | 'unlock';
  amount: number;
  message: string;
  timestamp: number;
}

interface RewardFeedbackSystemProps {
  rewards: Reward[];
  streakCount: number;
}

export const RewardFeedbackSystem: React.FC<RewardFeedbackSystemProps> = ({
  rewards,
  streakCount
}) => {
  const [visibleRewards, setVisibleRewards] = useState<Reward[]>([]);

  useEffect(() => {
    const newRewards = rewards.filter(reward => 
      Date.now() - reward.timestamp < 3000 // Show for 3 seconds
    );
    setVisibleRewards(newRewards);
  }, [rewards]);

  const getRewardIcon = (type: Reward['type']) => {
    switch (type) {
      case 'xp': return '⭐';
      case 'money': return '💰';
      case 'reputation': return '🎵';
      case 'unlock': return '🔓';
      default: return '✨';
    }
  };

  const getRewardColor = (type: Reward['type']) => {
    switch (type) {
      case 'xp': return 'text-blue-400';
      case 'money': return 'text-green-400';
      case 'reputation': return 'text-purple-400';
      case 'unlock': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      {/* Streak Counter */}
      {streakCount > 0 && (
        <div className="mb-4 animate-fade-in">
          <Card className="bg-orange-500/90 border-orange-400 p-2">
            <div className="text-white text-sm font-bold">
              🔥 {streakCount}x Streak
            </div>
          </Card>
        </div>
      )}

      {/* Reward Notifications */}
      <div className="space-y-2">
        {visibleRewards.map((reward, index) => (
          <div
            key={reward.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="bg-gray-900/95 border-gray-600 p-3 min-w-[200px]">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getRewardIcon(reward.type)}</span>
                <div>
                  <div className="text-white text-sm font-medium">
                    {reward.message}
                  </div>
                  <div className={`text-xs ${getRewardColor(reward.type)}`}>
                    +{reward.amount} {reward.type.toUpperCase()}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
