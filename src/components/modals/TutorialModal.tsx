
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-2xl">
            Welcome to Music Studio Tycoon!
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="text-white">
            <h3 className="font-bold mb-2">Getting Started:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Accept projects from the left panel</li>
              <li>Work on projects to earn money and experience</li>
              <li>Hire staff to help with projects</li>
              <li>Upgrade your equipment and studio</li>
              <li>Create bands and produce original music</li>
            </ul>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Playing!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
