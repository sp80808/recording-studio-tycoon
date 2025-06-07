
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameState } from '@/types/game';

interface StudioModalProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
  purchaseEquipment: (equipmentId: string) => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({
  gameState,
  isOpen,
  onClose,
  purchaseEquipment
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-600 text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-white">Your Studio</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 p-4">
          {/* Studio Visual Representation */}
          <div className="col-span-2 bg-gray-800 rounded-lg p-6 h-64 relative">
            <div className="text-center mb-4 text-gray-300">Studio Layout</div>
            <div className="grid grid-cols-4 gap-2 h-full">
              {/* Recording Booth */}
              <div className="bg-blue-900/50 rounded border-2 border-blue-400 p-2 text-center">
                <div className="text-xs text-blue-300 mb-1">Recording</div>
                {gameState.ownedEquipment.filter(e => e.category === 'microphone').map(eq => (
                  <div key={eq.id} className="text-lg">{eq.icon}</div>
                ))}
              </div>
              
              {/* Control Room */}
              <div className="bg-green-900/50 rounded border-2 border-green-400 p-2 text-center">
                <div className="text-xs text-green-300 mb-1">Control</div>
                {gameState.ownedEquipment.filter(e => e.category === 'monitor').map(eq => (
                  <div key={eq.id} className="text-lg">{eq.icon}</div>
                ))}
              </div>
              
              {/* Equipment Rack */}
              <div className="bg-yellow-900/50 rounded border-2 border-yellow-400 p-2 text-center">
                <div className="text-xs text-yellow-300 mb-1">Rack</div>
                {gameState.ownedEquipment.filter(e => e.category === 'outboard' || e.category === 'interface').map(eq => (
                  <div key={eq.id} className="text-lg">{eq.icon}</div>
                ))}
              </div>
              
              {/* Live Room */}
              <div className="bg-purple-900/50 rounded border-2 border-purple-400 p-2 text-center">
                <div className="text-xs text-purple-300 mb-1">Live Room</div>
                {gameState.ownedEquipment.filter(e => e.category === 'instrument').map(eq => (
                  <div key={eq.id} className="text-lg">{eq.icon}</div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Equipment List */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold mb-3 text-white">Owned Equipment</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameState.ownedEquipment.map(equipment => (
                <div key={equipment.id} className="bg-gray-700 p-2 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{equipment.icon}</span>
                    <span className="text-white">{equipment.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
