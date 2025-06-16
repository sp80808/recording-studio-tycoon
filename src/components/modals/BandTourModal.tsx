import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameState } from '@/hooks/useGameState';
import { Band } from '@/types/game';
import { StaffMember } from '@/types/game';
import { Slider } from '@/components/ui/slider';

interface BandTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: Band | null;
}

export const BandTourModal: React.FC<BandTourModalProps> = ({
  isOpen,
  onClose,
  band
}) => {
  const { gameState, bandManagement } = useGameState();
  const [tourDuration, setTourDuration] = useState(7); // Default 7 days

  const handleStartTour = () => {
    if (band) {
      bandManagement.startTour(band.id);
      onClose();
    }
  };

  const getBandMembers = (): StaffMember[] => {
    if (!band) return [];
    return gameState.hiredStaff.filter(staff => band.memberIds.includes(staff.id));
  };

  const getTourCost = (): number => {
    if (!band) return 0;
    return tourDuration * 5000; // $5000 per day
  };

  const getEstimatedIncome = (): number => {
    if (!band) return 0;
    const baseIncome = (band.fame || 0) * 100; // $100 per fame point
    return baseIncome * tourDuration;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start Tour</DialogTitle>
          <DialogDescription>
            Plan a tour for {band?.bandName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Tour Duration</h3>
                  <div className="space-y-2">
                    <Slider
                      value={[tourDuration]}
                      onValueChange={(value) => setTourDuration(value[0])}
                      min={7}
                      max={30}
                      step={1}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{tourDuration} days</span>
                      <span>${getTourCost()} total cost</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tour Cost</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Daily Expenses</span>
                        <span>${5000}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Cost</span>
                        <span>${getTourCost()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Estimated Income</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Base Income</span>
                        <span>${(band?.fame || 0) * 100}/day</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Income</span>
                        <span>${getEstimatedIncome()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Band Members</h4>
                  <div className="space-y-2">
                    {getBandMembers().map((member) => (
                      <div key={member.id} className="flex justify-between items-center p-2 bg-secondary/20 rounded">
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">({member.role})</span>
                        </div>
                        <Badge variant="outline">
                          Fame: {Math.round(member.primaryStats.creativity + member.primaryStats.technical)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Tour Benefits</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Increase band fame and notoriety</li>
                    <li>• Earn money from ticket sales and merchandise</li>
                    <li>• Improve band chemistry and performance skills</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleStartTour}
              disabled={gameState.playerData.money < getTourCost()}
            >
              Start Tour
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 