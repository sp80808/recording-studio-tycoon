import React, { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { Band } from '@/types/bands';
import { StaffMember } from '@/types/game';
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

export const BandManagement: React.FC = () => {
  const { gameState } = useGameState();
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [isSessionMusicianModalOpen, setIsSessionMusicianModalOpen] = useState(false);
  const [isBandMemberModalOpen, setIsBandMemberModalOpen] = useState(false);
  const [isBandTrainingModalOpen, setIsBandTrainingModalOpen] = useState(false);
  const [isBandTourModalOpen, setIsBandTourModalOpen] = useState(false);
  const [isBandCreationModalOpen, setIsBandCreationModalOpen] = useState(false);

  const handleCreateBand = () => {
    setIsBandCreationModalOpen(true);
  };

  const handleBandSelect = (band: Band) => {
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
        <h2 className="text-2xl font-bold">Band Management</h2>
        <Button onClick={handleCreateBand}>Create New Band</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {/* Band List */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Your Bands</CardTitle>
            <CardDescription>Manage your bands and their activities</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {gameState.playerBands.map((band) => (
                <Card
                  key={band.id}
                  className={`mb-2 cursor-pointer transition-colors ${
                    selectedBand?.id === band.id ? 'border-primary' : ''
                  }`}
                  onClick={() => handleBandSelect(band)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{band.bandName}</h3>
                        <p className="text-sm text-muted-foreground">{band.genre}</p>
                      </div>
                      <Badge variant={band.tourStatus.isOnTour ? "default" : "secondary"}>
                        {band.tourStatus.isOnTour ? "On Tour" : "Available"}
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Fame</span>
                        <span>{band.fame}</span>
                      </div>
                      <Progress value={band.fame} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Band Details */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Band Details</CardTitle>
            <CardDescription>
              {selectedBand ? `Manage ${selectedBand.bandName}` : 'Select a band to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedBand ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Band Members</h3>
                  <div className="space-y-2">
                    {selectedBand.memberIds.map((memberId: string) => {
                      const member = gameState.hiredStaff.find((s: StaffMember) => s.id === memberId);
                      return member ? (
                        <div key={memberId} className="flex justify-between items-center p-2 bg-secondary/20 rounded">
                          <span>{member.name}</span>
                          <Badge variant="outline">{member.role}</Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Fame</span>
                      <span>{selectedBand.fame}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Notoriety</span>
                      <span>{selectedBand.notoriety}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Past Releases</span>
                      <span>{selectedBand.pastReleases.length}</span>
                    </div>
                  </div>
                </div>

                {selectedBand.tourStatus.isOnTour && (
                  <div>
                    <h3 className="font-semibold mb-2">Tour Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Days Remaining</span>
                        <span>{selectedBand.tourStatus.daysRemaining}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Income</span>
                        <span>${selectedBand.tourStatus.dailyIncome}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Select a band to view and manage its details
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleManageMembers}
              disabled={!selectedBand}
            >
              Manage Members
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={handleTrainBand}
                disabled={!selectedBand || selectedBand.tourStatus.isOnTour}
              >
                Train Band
              </Button>
              <Button
                variant="outline"
                onClick={handleHireSessionMusician}
                disabled={!selectedBand || selectedBand.tourStatus.isOnTour}
              >
                Hire Session Musician
              </Button>
              <Button
                onClick={handleStartTour}
                disabled={!selectedBand || selectedBand.tourStatus.isOnTour || selectedBand.fame < 50}
              >
                Start Tour
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Modals */}
      <SessionMusicianModal
        isOpen={isSessionMusicianModalOpen}
        onClose={() => setIsSessionMusicianModalOpen(false)}
        band={selectedBand}
      />
      <BandMemberModal
        isOpen={isBandMemberModalOpen}
        onClose={() => setIsBandMemberModalOpen(false)}
        band={selectedBand}
      />
      <BandTrainingModal
        isOpen={isBandTrainingModalOpen}
        onClose={() => setIsBandTrainingModalOpen(false)}
        band={selectedBand}
      />
      <BandTourModal
        isOpen={isBandTourModalOpen}
        onClose={() => setIsBandTourModalOpen(false)}
        band={selectedBand}
      />
      <BandCreationModal
        isOpen={isBandCreationModalOpen}
        onClose={() => setIsBandCreationModalOpen(false)}
      />
    </div>
  );
};
