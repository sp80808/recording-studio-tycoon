import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameState, StaffMember, Equipment, EquipmentMod } from '@/types/game';
import { availableMods } from '@/data/equipmentMods';
import { useStaffManagement } from '@/hooks/useStaffManagement'; // To use startResearchMod

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineer: StaffMember | null;
  gameState: GameState;
  // Callback to useStaffManagement's startResearchMod or similar
  onStartResearch: (staffId: string, modId: string) => boolean; 
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  engineer,
  gameState,
  onStartResearch,
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [selectedModId, setSelectedModId] = useState<string | null>(null);

  if (!isOpen || !engineer) return null;

  // Filter for equipment that the player owns and is moddable by available mods
  const moddableOwnedEquipment = gameState.ownedEquipment.filter(ownedEq => 
    availableMods.some(mod => mod.modifiesEquipmentId === ownedEq.id && !gameState.researchedMods.includes(mod.id))
  );

  const availableModsForSelectedEquipment = selectedEquipmentId
    ? availableMods.filter(mod => 
        mod.modifiesEquipmentId === selectedEquipmentId && 
        !gameState.researchedMods.includes(mod.id)
      )
    : [];

  const handleResearch = () => {
    if (engineer && selectedModId) {
      const success = onStartResearch(engineer.id, selectedModId);
      if (success) {
        onClose(); // Close modal if research started successfully
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Start Research: {engineer.name}</DialogTitle>
          <DialogDescription>
            Select a piece of equipment and a modification for {engineer.name} to research.
            Ensure they have the required skills and your studio has enough funds.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Equipment Selection */}
          <div className="space-y-2">
            <label htmlFor="equipment-select" className="text-sm font-medium">Owned Moddable Equipment:</label>
            {moddableOwnedEquipment.length > 0 ? (
              <select
                id="equipment-select"
                value={selectedEquipmentId || ""}
                onChange={(e) => {
                  setSelectedEquipmentId(e.target.value);
                  setSelectedModId(null); // Reset mod selection when equipment changes
                }}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="" disabled>Select equipment...</option>
                {moddableOwnedEquipment.map(eq => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-400">No moddable equipment owned or all mods researched.</p>
            )}
          </div>

          {/* Mod Selection */}
          {selectedEquipmentId && availableModsForSelectedEquipment.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="mod-select" className="text-sm font-medium">Available Mods for Selected Equipment:</label>
              <select
                id="mod-select"
                value={selectedModId || ""}
                onChange={(e) => setSelectedModId(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="" disabled>Select a mod...</option>
                {availableModsForSelectedEquipment.map(mod => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name} (Cost: ${mod.researchRequirements.cost}, Time: {mod.researchRequirements.researchTime}d)
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedEquipmentId && availableModsForSelectedEquipment.length === 0 && (
             <p className="text-sm text-gray-400">No available mods to research for this equipment.</p>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-gray-300 border-gray-600 hover:bg-gray-700">Cancel</Button>
          <Button 
            onClick={handleResearch} 
            disabled={!selectedModId || !engineer}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Start Research
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
