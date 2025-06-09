
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StaffMember } from '@/types/game';

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember;
  onTrain: (skill: string) => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  isOpen,
  onClose,
  staff,
  onTrain
}) => {
  const skills = ['creativity', 'technical', 'speed'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle>Train {staff.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-300">Choose a skill to train:</p>
          <div className="grid gap-2">
            {skills.map(skill => (
              <Button
                key={skill}
                onClick={() => {
                  onTrain(skill);
                  onClose();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Train {skill}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
