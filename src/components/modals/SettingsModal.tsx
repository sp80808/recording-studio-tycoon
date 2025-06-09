
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameState } from '@/types/game';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>⚙️ Game Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 bg-gray-800/50 border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-3">Audio Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Music Volume</span>
                <span className="text-gray-400">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">SFX Volume</span>
                <span className="text-gray-400">100%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gray-800/50 border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-3">Game Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Auto-save</span>
                <span className="text-green-400">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Animations</span>
                <span className="text-green-400">Enabled</span>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
