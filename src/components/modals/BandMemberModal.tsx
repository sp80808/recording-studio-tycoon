import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameState } from '@/hooks/useGameState';
import { Band } from '@/types/game';
import { StaffMember } from '@/types/game';
import { Separator } from '@/components/ui/separator'; // Import Separator

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

  const handleAddMember = (staffId: string) => {
    if (band) {
      bandManagement.addBandMember(band.id, staffId);
      onClose(); // Close modal after adding
    }
  };

  const getBandMembers = (): StaffMember[] => {
    if (!band) return [];
    return gameState.hiredStaff.filter(staff => band.memberIds.includes(staff.id));
  };

  const getAvailableStaff = (): StaffMember[] => {
    if (!band) return [];
    return gameState.hiredStaff.filter(
      staff => staff.status === 'Idle' && !band.memberIds.includes(staff.id)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Band Members</DialogTitle>
          <DialogDescription>
            View, add, or remove members of {band?.bandName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* Current Band Members Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Band Members ({getBandMembers().length})</h3>
              <div className="space-y-2">
                {getBandMembers().length === 0 && <p className="text-center text-gray-400 py-2">No members in this band.</p>}
                {getBandMembers().map((member) => (
                  <Card key={member.id} className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white">{member.name}</h3>
                          <p className="text-sm text-gray-400">{member.role}</p>
                        </div>
                        <Badge variant="outline" className="border-gray-500 text-gray-300">{member.status}</Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-gray-300">
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
                          disabled={band?.tourStatus.isOnTour || getBandMembers().length === 1} // Cannot fire last member
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Fire Member
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator className="my-6 bg-gray-600" />

            {/* Available Staff to Add Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Available Staff to Add ({getAvailableStaff().length})</h3>
              <div className="space-y-2">
                {getAvailableStaff().length === 0 && <p className="text-center text-gray-400 py-2">No idle staff available to add.</p>}
                {getAvailableStaff().map((staff) => (
                  <Card key={staff.id} className="bg-gray-700/50 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-white">{staff.name}</h3>
                          <p className="text-sm text-gray-400">{staff.role}</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-600 text-white">Idle</Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-gray-300">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Primary Stats</h4>
                          <div className="space-y-1">
                            {Object.entries(staff.primaryStats).map(([stat, value]) => (
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
                            {Object.entries(staff.skills || {}).map(([skillName, skill]) => (
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
                          onClick={() => handleAddMember(staff.id)}
                          disabled={band?.tourStatus.isOnTour}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          Add to Band
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};