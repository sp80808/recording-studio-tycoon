
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameState } from '@/types/game';
import { Band } from '@/types/bands';
import { CreateBandModal } from './modals/CreateBandModal';
import { canGoOnTour } from '@/utils/bandUtils';
import { toast } from '@/hooks/use-toast';

interface BandManagementProps {
  gameState: GameState;
  onCreateBand: (bandName: string, memberIds: string[]) => void;
  onStartTour: (bandId: string) => void;
  onCreateOriginalTrack: (bandId: string) => void;
}

export const BandManagement: React.FC<BandManagementProps> = ({
  gameState,
  onCreateBand,
  onStartTour,
  onCreateOriginalTrack
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreateBand = gameState.playerData.level >= 4 && gameState.hiredStaff.length >= 1;

  const getBandMembers = (band: Band) => {
    return gameState.hiredStaff.filter(staff => band.memberIds.includes(staff.id));
  };

  const getReviewEmoji = (score: number) => {
    if (score >= 8) return '😍';
    if (score >= 6) return '😊';
    if (score >= 4) return '😐';
    return '😞';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">🎸 Band Management</h2>
        {canCreateBand && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Create Band
          </Button>
        )}
      </div>

      {!canCreateBand && (
        <Card className="p-4 bg-gray-800/50 border-gray-600">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Band Management Locked</h3>
            <p className="text-sm">
              Reach Level 4 and hire at least 1 staff member to unlock band creation.
            </p>
            <div className="mt-2 text-xs">
              Current: Level {gameState.playerData.level}, {gameState.hiredStaff.length} staff
            </div>
          </div>
        </Card>
      )}

      {gameState.playerBands.length === 0 && canCreateBand && (
        <Card className="p-4 bg-gray-800/50 border-gray-600">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">🎤</div>
            <h3 className="font-semibold mb-1">No Bands Created</h3>
            <p className="text-sm">Create your first band to start making original music!</p>
          </div>
        </Card>
      )}

      {gameState.playerBands.map(band => {
        const members = getBandMembers(band);
        const canTour = canGoOnTour(band);
        
        return (
          <Card key={band.id} className="p-4 bg-gray-800/50 border-gray-600">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{band.bandName}</h3>
                <p className="text-gray-300 text-sm">{band.genre}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-400">⭐ {band.fame}</span>
                  <span className="text-red-400">💀 {band.notoriety}</span>
                </div>
              </div>
            </div>

            {/* Tour Status */}
            {band.tourStatus.isOnTour && (
              <div className="mb-3 p-2 bg-blue-900/50 border border-blue-500 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-blue-300">🚌 On Tour</span>
                  <span className="text-blue-300">{band.tourStatus.daysRemaining} days left</span>
                </div>
                <div className="text-xs text-blue-400">
                  Earning ${band.tourStatus.dailyIncome} per day
                </div>
              </div>
            )}

            {/* Band Members */}
            <div className="mb-3">
              <h4 className="text-sm font-semibold text-gray-300 mb-1">Members:</h4>
              <div className="flex flex-wrap gap-2">
                {members.map(member => (
                  <span
                    key={member.id}
                    className="text-xs bg-gray-700 px-2 py-1 rounded"
                  >
                    {member.name} ({member.role})
                  </span>
                ))}
              </div>
            </div>

            {/* Past Releases */}
            {band.pastReleases.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Past Releases:</h4>
                <div className="space-y-1">
                  {band.pastReleases.slice(-3).map(release => (
                    <div key={release.id} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300">{release.trackTitle}</span>
                      <div className="flex items-center gap-2">
                        <span>{getReviewEmoji(release.reviewScore)}</span>
                        <span className="text-gray-400">{release.reviewScore}/10</span>
                        <span className="text-green-400">${release.totalSales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onCreateOriginalTrack(band.id)}
                disabled={gameState.activeProject !== null || gameState.activeOriginalTrack !== null || band.tourStatus.isOnTour}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                🎵 Record Track
              </Button>
              {canTour && (
                <Button
                  size="sm"
                  onClick={() => onStartTour(band.id)}
                  disabled={band.tourStatus.isOnTour}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🚌 Tour
                </Button>
              )}
            </div>
          </Card>
        );
      })}

      <CreateBandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        gameState={gameState}
        onCreateBand={onCreateBand}
      />
    </div>
  );
};
