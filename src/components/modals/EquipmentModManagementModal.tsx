import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GameState, Equipment, EquipmentMod } from '@/types/game';
import { availableMods } from '@/data/equipmentMods'; // To find mod details

interface EquipmentModManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null; // The equipment item to manage mods for
  gameState: GameState;
  onApplyMod: (equipmentId: string, modId: string | null) => void; // Pass null to remove mod
}

export const EquipmentModManagementModal: React.FC<EquipmentModManagementModalProps> = ({
  isOpen,
  onClose,
  equipment,
  gameState,
  onApplyMod,
}) => {
  const [selectedModId, setSelectedModId] = useState<string | null>(equipment?.appliedModId || null);

  useEffect(() => {
    // Update selectedModId if the equipment or its appliedModId changes externally
    setSelectedModId(equipment?.appliedModId || null);
  }, [equipment]);

  if (!equipment) return null;

  const compatibleResearchedMods = availableMods.filter(mod =>
    mod.modifiesEquipmentId === equipment.id && gameState.researchedMods.includes(mod.id)
  );

  const currentModDetails = equipment.appliedModId 
    ? availableMods.find(m => m.id === equipment.appliedModId) 
    : null;

  const handleApply = () => {
    onApplyMod(equipment.id, selectedModId);
    onClose();
  };

  const handleRemoveMod = () => {
    setSelectedModId(null); 
    // The actual removal will happen on "Save Changes" / handleApply
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">🔧 Manage Mods for {equipment.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Apply or change modifications for this piece of equipment.
            {currentModDetails && (
              <span className="block mt-1 text-sm text-blue-300">
                Current Mod: {currentModDetails.name} {currentModDetails.nameSuffix || ''}
              </span>
            )}
            {!currentModDetails && (
              <span className="block mt-1 text-sm text-gray-500">
                Current Mod: None
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh]">
          <h3 className="text-md font-semibold mb-2 text-gray-200">Available Researched Mods:</h3>
          <ScrollArea className="h-[300px] border border-gray-600 rounded-md p-2 bg-gray-900/70">
            {compatibleResearchedMods.length === 0 && (
              <p className="text-gray-400 text-center py-4">No compatible researched mods available for this equipment.</p>
            )}
            {/* Option to remove current mod */}
            {equipment.appliedModId && (
                 <Card
                 className={`mb-2 cursor-pointer transition-all ${
                   selectedModId === null ? 'ring-2 ring-red-500 bg-red-900/30' : 'bg-gray-700/80 hover:bg-gray-700'
                 }`}
                 onClick={handleRemoveMod}
               >
                 <CardHeader className="pb-2 pt-3 px-4">
                   <CardTitle className="text-base text-red-400">🚫 Remove Current Mod</CardTitle>
                 </CardHeader>
                 <CardContent className="text-xs text-gray-400 pb-3 px-4">
                    Return to base equipment stats.
                 </CardContent>
               </Card>
            )}

            {compatibleResearchedMods.map((mod) => (
              <Card
                key={mod.id}
                className={`mb-2 cursor-pointer transition-all ${
                  selectedModId === mod.id ? 'ring-2 ring-green-500 bg-green-800/50' : 'bg-gray-700/80 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedModId(mod.id)}
              >
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-base text-green-300">{mod.name} {mod.nameSuffix || ''}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-gray-300 pb-3 px-4">
                  <p>{mod.description}</p>
                  <p className="mt-1 text-purple-300">Bonuses: {JSON.stringify(mod.statChanges)}</p>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>

        <DialogFooter className="sm:justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="mr-2 border-gray-600 text-gray-300 hover:bg-gray-700">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={selectedModId === equipment.appliedModId} // Disabled if selection hasn't changed
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
