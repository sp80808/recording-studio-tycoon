import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameState } from '@/hooks/useGameState';
import { Band } from '@/types/game';
import { StaffMember } from '@/types/game';

interface BandTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: Band | null;
}

export const BandTrainingModal: React.FC<BandTrainingModalProps> = ({
  isOpen,
  onClose,
  band
}) => {
  const { gameState, bandManagement } = useGameState();

  const handleTrainBand = () => {
    if (band) {
      bandManagement.trainBand(band.id);
      onClose();
    }
  };

  const getBandMembers = (): StaffMember[] => {
    if (!band) return [];
    return gameState.hiredStaff.filter(staff => band.memberIds.includes(staff.id));
  };

  const getTrainingCost = (): number => {
    if (!band) return 0;
    return getBandMembers().length * 1000; // $1000 per member
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Train Band</DialogTitle>
          <DialogDescription>
            Improve the skills of {band?.bandName} members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold">Training Cost</h3>
                  <p className="text-sm text-muted-foreground">
                    ${getTrainingCost()} (${1000} per member)
                  </p>
                </div>
                <Badge variant={gameState.playerData.money >= getTrainingCost() ? "default" : "destructive"}>
                  Available: ${gameState.playerData.money}
                </Badge>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Current Members</h4>
                {getBandMembers().map((member) => (
                  <div key={member.id} className="flex justify-between items-center p-2 bg-secondary/20 rounded">
                    <div>
                      <span className="font-medium">{member.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({member.role})</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Creativity: {member.primaryStats.creativity}</span>
                      <span className="text-muted-foreground ml-2">Technical: {member.primaryStats.technical}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Training Benefits</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Each member's creativity and technical skills will improve</li>
                  <li>• Band chemistry and performance quality will increase</li>
                  <li>• Higher chance of successful recordings and tours</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleTrainBand}
              disabled={gameState.playerData.money < getTrainingCost()}
            >
              Start Training
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 