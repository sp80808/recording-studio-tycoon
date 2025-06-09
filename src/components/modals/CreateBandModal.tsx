
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StaffMember } from '@/types/game';

interface CreateBandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBand: (bandName: string, memberIds: string[]) => void;
  staff: StaffMember[];
}

export const CreateBandModal: React.FC<CreateBandModalProps> = ({
  isOpen,
  onClose,
  onCreateBand,
  staff
}) => {
  const [bandName, setBandName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleSubmit = () => {
    if (bandName.trim() && selectedMembers.length > 0) {
      onCreateBand(bandName, selectedMembers);
      setBandName('');
      setSelectedMembers([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Create New Band</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Band name"
            value={bandName}
            onChange={(e) => setBandName(e.target.value)}
            className="bg-gray-800 border-gray-600"
          />
          <div>
            <p className="text-gray-300 mb-2">Select members:</p>
            <div className="space-y-2">
              {staff.map(member => (
                <label key={member.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                      }
                    }}
                  />
                  <span>{member.name} - {member.role}</span>
                </label>
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">
            Create Band
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
