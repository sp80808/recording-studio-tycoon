import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Band } from '@/types/game';
import { useBandReputation } from '@/hooks/useBandReputation';
import { useGameState } from '@/hooks/useGameState';
import { formatDate } from '@/utils/dateUtils';

interface BandReputationProps {
  band: Band;
}

export const BandReputation: React.FC<BandReputationProps> = ({ band }) => {
  const { gameState, updateGameState } = useGameState();
  const { getReputationLevel, getReputationProgress } = useBandReputation({
    gameState,
    setGameState: updateGameState
  });

  const reputationLevel = getReputationLevel(band.reputation);
  const { next, progress } = getReputationProgress(band.reputation);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Band Reputation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Reputation Level */}
          <div>
            <h3 className="text-lg font-semibold">{reputationLevel}</h3>
            <p className="text-sm text-muted-foreground">
              {band.reputation} / {next} reputation points
            </p>
            <Progress value={progress} className="mt-2" />
          </div>

          {/* Performance History */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Recent Performances</h3>
            <div className="space-y-2">
              {band.performanceHistory.slice(-5).reverse().map((entry, index) => (
                <div key={index} className="p-2 border rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{formatDate(entry.date)}</span>
                    <span className={`text-sm ${entry.reputationGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {entry.reputationGain >= 0 ? '+' : ''}{entry.reputationGain} rep
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                    <div>Overall: {entry.rating.overall}</div>
                    <div>Technical: {entry.rating.technical}</div>
                    <div>Creativity: {entry.rating.creativity}</div>
                    <div>Stage Presence: {entry.rating.stagePresence}</div>
                    <div>Genre Match: {entry.rating.genreMatch}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 