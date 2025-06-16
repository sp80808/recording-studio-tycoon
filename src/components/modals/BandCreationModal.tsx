import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGameState } from '@/hooks/useGameState';
import { useBandManagement } from '@/hooks/useBandManagement';
import { StaffMember } from '@/types/game';
import { MusicGenre } from '@/types/charts';
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
  const [genre, setGenre] = useState<MusicGenre>('rock'); // Default genre

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

    createBand(bandName, selectedMembers, genre);
    onClose(); // Close modal after creation
    // Reset form fields
    setBandName('');
    setSelectedMembers([]);
    setGenre('rock'); 
  };

  const handleMemberSelect = (memberId: string) => {
    setSelectedMembers((prev: string[]) => {
      if (prev.includes(memberId)) return prev; // Avoid duplicates
      return [...prev, memberId];
    });
  };

  const handleMemberRemove = (memberId: string) => {
    setSelectedMembers((prev: string[]) => prev.filter((id: string) => id !== memberId));
  };

  // Define a list of genres for the select dropdown
  const musicGenres: MusicGenre[] = [
    'rock', 'pop', 'hip-hop', 'electronic', 'country', 'alternative', 
    'r&b', 'jazz', 'classical', 'folk', 'acoustic'
    // Add other genres from MusicGenre type as needed
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-purple-400">Create New Band</DialogTitle>
          <DialogDescription className="text-gray-400">
            Form a new band by selecting available staff members and choosing a genre.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="bandName" className="text-gray-300">Band Name</Label>
            <Input
              id="bandName"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Enter band name"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-500"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="genre" className="text-gray-300">Genre</Label>
            <Select value={genre} onValueChange={(value: string) => setGenre(value as MusicGenre)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-white">
                {musicGenres.map(g => (
                  <SelectItem key={g} value={g} className="capitalize hover:bg-purple-500">
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-gray-300">Selected Members ({selectedMembers.length})</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto p-1 bg-gray-700/50 rounded-md border border-gray-600">
              {selectedMembers.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No members selected yet.</p>}
              {selectedMembers.map(memberId => {
                const member = gameState.hiredStaff.find(s => s.id === memberId);
                return member ? (
                  <div key={memberId} className="flex items-center justify-between p-2 bg-gray-600/70 rounded-md text-sm">
                    <span>{member.name} <span className="text-xs text-gray-400">({member.role})</span></span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMemberRemove(memberId)}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      Remove
                    </Button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-gray-300">Available Staff</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto p-1 bg-gray-700/50 rounded-md border border-gray-600">
              {availableStaff.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No idle staff available.</p>}
              {availableStaff.map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-2 bg-gray-600/70 rounded-md text-sm">
                  <span>{staff.name} <span className="text-xs text-gray-400">({staff.role})</span></span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMemberSelect(staff.id)}
                    className="text-green-400 hover:text-green-300 px-2"
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
          <Button variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-700">
            Cancel
          </Button>
          <Button onClick={handleCreateBand} className="bg-purple-600 hover:bg-purple-700 text-white">
            Create Band
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
