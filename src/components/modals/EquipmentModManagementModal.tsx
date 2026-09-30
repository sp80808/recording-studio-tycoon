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
      <DialogContent className="max-w-lg bg-stone-800 border-stone-700 text-stone-200">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">🔧 Manage Mods for {equipment.name}</DialogTitle>
          <DialogDescription className="text-stone-400">
            Apply or change modifications for this piece of equipment.
            {currentModDetails && (
              <span className="block mt-1 text-sm text-amber-200">
                Current Mod: {currentModDetails.name} {currentModDetails.nameSuffix || ''}
              </span>
            )}
            {!currentModDetails && (
              <span className="block mt-1 text-sm text-stone-500">
                Current Mod: None
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh]">
          <h3 className="text-md font-semibold mb-2 text-stone-200">Available Researched Mods:</h3>
          <ScrollArea className="h-[300px] border border-stone-600 rounded-md p-2 bg-stone-900/70">
            {compatibleResearchedMods.length === 0 && (
              <p className="text-stone-400 text-center py-4">No compatible researched mods available for this equipment.</p>
            )}
            {/* Option to remove current mod */}
            {equipment.appliedModId && (
                 <Card
                 className={`mb-2 cursor-pointer transition-all ${
                   selectedModId === null ? 'ring-2 ring-red-500 bg-red-900/30' : 'bg-stone-700/80 hover:bg-stone-700'
                 }`}
                 onClick={handleRemoveMod}
               >
                 <CardHeader className="pb-2 pt-3 px-4">
                   <CardTitle className="text-base text-red-400">🚫 Remove Current Mod</CardTitle>
                 </CardHeader>
                 <CardContent className="text-xs text-stone-400 pb-3 px-4">
                    Return to base equipment stats.
                 </CardContent>
               </Card>
            )}

            {compatibleResearchedMods.map((mod) => (
              <Card
                key={mod.id}
                className={`mb-2 cursor-pointer transition-all ${
                  selectedModId === mod.id ? 'ring-2 ring-green-500 bg-green-800/50' : 'bg-stone-700/80 hover:bg-stone-700'
                }`}
                onClick={() => setSelectedModId(mod.id)}
              >
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-base text-green-300">{mod.name} {mod.nameSuffix || ''}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-stone-300 pb-3 px-4">
                  <p>{mod.description}</p>
                  <p className="mt-1 text-purple-300">Bonuses: {JSON.stringify(mod.statChanges)}</p>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>

        <DialogFooter className="sm:justify-end pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="mr-2 border-stone-600 text-stone-300 hover:bg-stone-700">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleApply}
            className="bg-amber-600 hover:bg-amber-700 text-stone-950"
            disabled={selectedModId === equipment.appliedModId} // Disabled if selection hasn't changed
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
