import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameState } from '@/hooks/useGameState';
import { Band } from '@/types/game';
import { StaffMember, StudioSkillType } from '@/types/game';

interface BandMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  band: Band | null;
}

export const BandMemberModal: React.FC<BandMemberModalProps> = ({
  isOpen,
  onClose,
  band
}) => {
  const { gameState, bandManagement } = useGameState();

  const handleFireMember = (memberId: string) => {
    if (band) {
      bandManagement.fireBandMember(band.id, memberId);
    }
  };

  const getBandMembers = (): StaffMember[] => {
    if (!band) return [];
    return gameState.hiredStaff.filter(staff => band.memberIds.includes(staff.id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Band Members</DialogTitle>
          <DialogDescription>
            View and manage members of {band?.bandName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {getBandMembers().map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <Badge variant="outline">{member.status}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Primary Stats</h4>
                      <div className="space-y-1">
                        {Object.entries(member.primaryStats).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between text-sm">
                            <span className="capitalize">{stat}</span>
                            <span>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Skills</h4>
                      <div className="space-y-1">
                        {Object.entries(member.skills || {}).map(([skillName, skill]) => (
                          <div key={skillName} className="flex justify-between text-sm">
                            <span className="capitalize">{skillName}</span>
                            <span>Level {skill.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleFireMember(member.id)}
                      disabled={band?.tourStatus.isOnTour}
                    >
                      Fire Member
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