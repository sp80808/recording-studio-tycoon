import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameState } from '@/hooks/useGameState';
import { Band } from '@/types/game';
import { SessionMusician } from '@/types/game';

interface SessionMusicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: Band | null;
}

export const SessionMusicianModal: React.FC<SessionMusicianModalProps> = ({
  isOpen,
  onClose,
  band
}) => {
  const { gameState, bandManagement } = useGameState();

  const handleHireMusician = (musician: SessionMusician) => {
    if (band) {
      bandManagement.hireSessionMusician(band.id, musician.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hire Session Musician</DialogTitle>
          <DialogDescription>
            Select a session musician to join {band?.bandName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {gameState.availableSessionMusicians.map((musician) => (
              <Card key={musician.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{musician.name}</h3>
                      <p className="text-sm text-muted-foreground">{musician.role}</p>
                    </div>
                    <Badge variant="outline">${musician.dailyRate}/day</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Primary Stats</h4>
                      <div className="space-y-1">
                        {Object.entries(musician.primaryStats).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between text-sm">
                            <span className="capitalize">{stat}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Experience</h4>
                      <div className="space-y-1">
                        {Object.entries(musician.experience).map(([genre, level]) => (
                          <div key={genre} className="flex justify-between text-sm">
                            <span className="capitalize">{genre}</span>
                            <span>Level {level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => handleHireMusician(musician)}
                      disabled={gameState.playerData.money < musician.dailyRate}
                    >
                      Hire Musician
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}; 