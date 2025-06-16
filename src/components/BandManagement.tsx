import React, { useState } from 'react';
// Removed: import { useGameState } from '@/hooks/useGameState'; // gameState will be a prop
import { Band as BandType } from '@/types/bands'; // Renamed to avoid conflict with HTML Band element
import { StaffMember, GameState, MusicGenre } from '@/types/game'; // Added GameState, MusicGenre
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SessionMusicianModal } from '@/components/modals/SessionMusicianModal';
import { BandMemberModal } from '@/components/modals/BandMemberModal';
import { BandTrainingModal } from '@/components/modals/BandTrainingModal';
import { BandTourModal } from '@/components/modals/BandTourModal';
import { BandCreationModal } from '@/components/modals/BandCreationModal';
// MusicGenre already imported from @/types/game

export interface BandManagementProps {
  gameState: GameState;
  onCreateBand: (bandName: string, memberIds: string[], genre: MusicGenre) => void;
  onStartTour: (bandId: string) => void;
  onCreateOriginalTrack: (bandId: string) => void;
  // Consider adding setGameState if modals here need to update global state directly
  // and cannot do so via their own useGameState hook + passed callbacks.
}

export const BandManagement: React.FC<BandManagementProps> = ({ 
  gameState, 
  // onCreateBand, // This prop is for RightPanel to pass down, BandCreationModal uses its own hook
  // onStartTour,  // Similarly, BandTourModal will use its own hook
  // onCreateOriginalTrack 
}) => {
  const [selectedBand, setSelectedBand] = useState<BandType | null>(null);
  const [isSessionMusicianModalOpen, setIsSessionMusicianModalOpen] = useState(false);
  const [isBandMemberModalOpen, setIsBandMemberModalOpen] = useState(false);
  const [isBandTrainingModalOpen, setIsBandTrainingModalOpen] = useState(false);
  const [isBandTourModalOpen, setIsBandTourModalOpen] = useState(false);
  const [isBandCreationModalOpen, setIsBandCreationModalOpen] = useState(false);

  const handleCreateBand = () => {
    setIsBandCreationModalOpen(true);
  };

  const handleBandSelect = (band: BandType) => {
    setSelectedBand(band);
  };

  const handleStartTour = () => {
    if (selectedBand) {
      setIsBandTourModalOpen(true);
    }
  };

  const handleTrainBand = () => {
    if (selectedBand) {
      setIsBandTrainingModalOpen(true);
    }
  };

  const handleHireSessionMusician = () => {
    if (selectedBand) {
      setIsSessionMusicianModalOpen(true);
    }
  };

  const handleManageMembers = () => {
    if (selectedBand) {
      setIsBandMemberModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Band Management</h2>
        <Button onClick={handleCreateBand}>Create New Band</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Your Bands</CardTitle>
            <CardDescription>Manage your bands and their activities</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ScrollArea className="h-[calc(100%-0px)]"> {/* Adjust height dynamically or set fixed */}
              {gameState.playerBands.length === 0 && <p className="text-center text-gray-400 py-4">No bands created yet.</p>}
              {gameState.playerBands.map((band) => (
                <Card
                  key={band.id}
                  className={`mb-2 cursor-pointer transition-colors ${
                    selectedBand?.id === band.id ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-700 hover:border-purple-400'
                  }`}
                  onClick={() => handleBandSelect(band)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{band.bandName}</h3>
                        <p className="text-sm text-gray-400 capitalize">{band.genre}</p>
                      </div>
                      <Badge variant={band.tourStatus.isOnTour ? "destructive" : "secondary"} className={band.tourStatus.isOnTour ? "bg-red-600" : "bg-green-600"}>
                        {band.tourStatus.isOnTour ? "On Tour" : "Available"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1 text-gray-300">
                        <span>Fame</span>
                        <span className="text-white">{band.fame}</span>
                      </div>
                      <Progress value={band.fame} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Band Details</CardTitle>
            <CardDescription>
              {selectedBand ? `Manage ${selectedBand.bandName}` : 'Select a band to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
            {selectedBand ? (
              <>
                <div>
                  <h3 className="font-semibold mb-2 text-white">Band Members</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {selectedBand.memberIds.map((memberId: string) => {
                      const member = gameState.hiredStaff.find((s: StaffMember) => s.id === memberId);
                      return member ? (
                        <div key={memberId} className="flex justify-between items-center p-2 bg-gray-700/50 rounded text-sm">
                          <span className="text-gray-200">{member.name}</span>
                          <Badge variant="outline" className="border-gray-600 text-gray-400">{member.role}</Badge>
                        </div>
                      ) : <div key={memberId} className="text-xs text-gray-500">Unknown Member ({memberId})</div>;
                    })}
                     {selectedBand.memberIds.length === 0 && <p className="text-xs text-gray-500 text-center">No members in this band.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-white">Stats</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-300"><span>Fame:</span> <span className="text-white">{selectedBand.fame}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Notoriety:</span> <span className="text-white">{selectedBand.notoriety}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Experience:</span> <span className="text-white">{selectedBand.experience || 0}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Fans:</span> <span className="text-white">{selectedBand.fans || 0}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Past Releases:</span> <span className="text-white">{selectedBand.pastReleases.length}</span></div>
                  </div>
                </div>

                {selectedBand.tourStatus.isOnTour && (
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Tour Status</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-300"><span>Days Remaining:</span> <span className="text-white">{selectedBand.tourStatus.daysRemaining}</span></div>
                      <div className="flex justify-between text-gray-300"><span>Daily Income:</span> <span className="text-green-400">${selectedBand.tourStatus.dailyIncome.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-400 pt-10">
                Select a band to view and manage its details.
              </div>
            )}
          </CardContent>
          {selectedBand && (
            <CardFooter className="flex-col space-y-2 pt-4 border-t border-gray-700">
              <Button variant="outline" onClick={handleManageMembers} className="w-full">Manage Members</Button>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" onClick={handleTrainBand} disabled={selectedBand.tourStatus.isOnTour}>Train Band</Button>
                <Button variant="outline" onClick={handleHireSessionMusician} disabled={selectedBand.tourStatus.isOnTour}>Hire Session Musician</Button>
              </div>
              <Button onClick={handleStartTour} disabled={selectedBand.tourStatus.isOnTour || selectedBand.fame < 50} className="w-full bg-purple-600 hover:bg-purple-700">Start Tour</Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <SessionMusicianModal isOpen={isSessionMusicianModalOpen} onClose={() => setIsSessionMusicianModalOpen(false)} band={selectedBand} />
      <BandMemberModal isOpen={isBandMemberModalOpen} onClose={() => setIsBandMemberModalOpen(false)} band={selectedBand} />
      <BandTrainingModal isOpen={isBandTrainingModalOpen} onClose={() => setIsBandTrainingModalOpen(false)} band={selectedBand} />
      <BandTourModal isOpen={isBandTourModalOpen} onClose={() => setIsBandTourModalOpen(false)} band={selectedBand} />
      <BandCreationModal isOpen={isBandCreationModalOpen} onClose={() => setIsBandCreationModalOpen(false)} />
    </div>
  );
};
