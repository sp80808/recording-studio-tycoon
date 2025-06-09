
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EraSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEraSelect: (era: string) => void;
}

export const EraSelectionModal: React.FC<EraSelectionModalProps> = ({
  isOpen,
  onClose,
  onEraSelect
}) => {
  const eras = [
    { id: '1960s', name: '1960s', description: 'The birth of modern recording' },
    { id: '1980s', name: '1980s', description: 'The digital revolution begins' },
    { id: '2000s', name: '2000s', description: 'The internet age' },
    { id: '2020s', name: '2020s', description: 'Streaming dominance' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-2xl">
            Choose Your Era
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 p-4">
          {eras.map((era) => (
            <Button
              key={era.id}
              onClick={() => onEraSelect(era.id)}
              className="h-24 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 text-white"
            >
              <div className="text-lg font-bold">{era.name}</div>
              <div className="text-sm text-gray-400">{era.description}</div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
