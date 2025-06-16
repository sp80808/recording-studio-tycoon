import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGameState } from '@/hooks/useGameState';
import { useBandManagement } from '@/hooks/useBandManagement';
import { StaffMember } from '@/types/game';
import { toast } from '@/hooks/use-toast';

interface BandCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BandCreationModal: React.FC<BandCreationModalProps> = ({ isOpen, onClose }) => {
  const { gameState } = useGameState();
  const { createBand } = useBandManagement();
  const [bandName, setBandName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [genre, setGenre] = useState('Rock');

  const availableStaff = gameState.hiredStaff.filter(
    (staff: StaffMember) => staff.status === 'Idle' && !selectedMembers.includes(staff.id)
  );

  const handleCreateBand = () => {
    if (!bandName.trim()) {
      toast({
        title: "Missing Band Name",
        description: "Please enter a name for your band.",
        variant: "destructive"
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: "No Members Selected",
        description: "Please select at least one member for your band.",
        variant: "destructive"
      });
      return;
    }

    createBand(bandName, selectedMembers);
    onClose();
    setBandName('');
    setSelectedMembers([]);
    setGenre('Rock');
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMembers((prev: string[]) => [...prev, memberId]);
  };

  const handleMemberRemove = (memberId: string) => {
    setSelectedMembers((prev: string[]) => prev.filter((id: string) => id !== memberId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Band</DialogTitle>
          <DialogDescription>
            Form a new band by selecting available staff members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bandName">Band Name</Label>
            <Input
              id="bandName"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Enter band name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="genre">Genre</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger>
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rock">Rock</SelectItem>
                <SelectItem value="Pop">Pop</SelectItem>
                <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                <SelectItem value="Electronic">Electronic</SelectItem>
                <SelectItem value="Jazz">Jazz</SelectItem>
                <SelectItem value="Classical">Classical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Selected Members</Label>
            <div className="space-y-2">
              {selectedMembers.map(memberId => {
                const member = gameState.hiredStaff.find(s => s.id === memberId);
                return member ? (
                  <div key={memberId} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                    <span>{member.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMemberRemove(memberId)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Available Staff</Label>
            <div className="space-y-2">
              {availableStaff.map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <span>{staff.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMemberSelect(staff.id)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateBand}>
            Create Band
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 