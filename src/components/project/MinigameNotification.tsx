
import React from 'react';

interface MinigameNotificationProps {
  autoTriggeredMinigame: {
    type: string;
    reason: string;
  } | null;
}

export const MinigameNotification: React.FC<MinigameNotificationProps> = ({
  autoTriggeredMinigame
}) => {
  if (!autoTriggeredMinigame) return null;

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500 rounded-lg animate-scale-in">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-yellow-400 font-semibold mb-1">🎯 Production Opportunity Ready!</h4>
          <p className="text-gray-300 text-sm">{autoTriggeredMinigame.reason}</p>
        </div>
        <div className="text-2xl animate-bounce">🎮</div>
      </div>
    </div>
  );
};
