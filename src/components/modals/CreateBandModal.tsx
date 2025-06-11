
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameState, StaffMember } from '@/types/game';
import { Band } from '@/types/bands';
import { generateBandName } from '@/utils/bandUtils';
import { toast } from '@/hooks/use-toast';

interface CreateBandModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onCreateBand: (bandName: string, memberIds: string[]) => void;
}

export const CreateBandModal: React.FC<CreateBandModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onCreateBand
}) => {
  const [bandName, setBandName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const availableStaff = gameState.hiredStaff.filter(staff => 
    !gameState.playerBands.some(band => band.memberIds.includes(staff.id))
  );

  const handleGenerateName = () => {
    setBandName(generateBandName());
  };

  const toggleMember = (staffId: string) => {
    setSelectedMembers(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSubmit = () => {
    if (!bandName.trim()) {
      toast({
        title: "🎸 Band Name Required",
        description: "Please enter a name for your band.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: "👥 No Members Selected",
        description: "Please select at least one staff member for your band.",
        className: "bg-gray-800 border-gray-600 text-white",
        variant: "destructive"
      });
      return;
    }

    onCreateBand(bandName.trim(), selectedMembers);
    setBandName('');
    setSelectedMembers([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎸 Create New Band
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bandName">Band Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="bandName"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                placeholder="Enter band name..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateName}
              >
                🎲
              </Button>
            </div>
          </div>

          <div>
            <Label>Select Band Members</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {availableStaff.map(staff => (
                <div
                  key={staff.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMembers.includes(staff.id)
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  }`}
                  onClick={() => toggleMember(staff.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{staff.name}</div>
                      <div className="text-sm opacity-75">{staff.role}</div>
                    </div>
                    <div className="text-sm">
                      <div>🎨 {staff.primaryStats.creativity}</div>
                      <div>⚙️ {staff.primaryStats.technical}</div>
                    </div>
                  </div>
                </div>
              ))}
              {availableStaff.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No available staff members. All staff are already in bands or you need to hire more staff.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!bandName.trim() || selectedMembers.length === 0}
              className="flex-1"
            >
              Create Band
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
