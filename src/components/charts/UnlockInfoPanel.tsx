import React from 'react';
import { Card } from '@/components/ui/card';
import { GameState } from '@/types/game';

interface UnlockInfoPanelProps {
  playerLevel: number;
}

export const UnlockInfoPanel: React.FC<UnlockInfoPanelProps> = ({ playerLevel }) => {
  if (playerLevel >= 10) {
    return null; // Don't show if all unlocks are met or surpassed
  }

  const unlocks = [
    { level: 3, text: "• Rock Charts at Level 3" },
    { level: 4, text: "• Pop Charts at Level 4" },
    { level: 5, text: "• Hip-hop Charts at Level 5" },
    { level: 6, text: "• Electronic Charts at Level 6" },
    { level: 8, text: "• Top 10 Artist Access at Level 8" },
  ];

  const pendingUnlocks = unlocks.filter(unlock => playerLevel < unlock.level);

  if (pendingUnlocks.length === 0) {
    return null; // Don't show if no pending unlocks relevant to this panel
  }

  return (
    <Card className="bg-blue-900/20 border-blue-600/50 p-3">
      <div className="text-sm text-blue-300">
        <div className="font-semibold mb-1">🔓 Unlock More Charts</div>
        <div className="text-xs space-y-1">
          {pendingUnlocks.map(unlock => (
            <div key={unlock.level}>{unlock.text}</div>
          ))}
        </div>
      </div>
    </Card>
  );
};
