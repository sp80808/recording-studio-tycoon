import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Removed CardFooter as it's not used
import { ScrollArea } from '@/components/ui/scroll-area';
import { GameState, StaffMember, EquipmentMod } from '@/types/game';
import { availableMods } from '@/data/equipmentMods';
import { availableEquipment } from '@/data/equipment'; // To display target equipment name

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  startResearchMod: (staffId: string, modId: string) => boolean;
}

export const ResearchModal: React.FC<ResearchModalProps> = ({
  isOpen,
  onClose,
  gameState,
  startResearchMod,
}) => {
  const [selectedMod, setSelectedMod] = useState<EquipmentMod | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  const handleSelectMod = (mod: EquipmentMod) => {
    setSelectedMod(mod);
    setSelectedStaff(null); // Reset staff selection when mod changes
  };

  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
  };

  const handleStartResearch = () => {
    if (selectedMod && selectedStaff) {
      const success = startResearchMod(selectedStaff.id, selectedMod.id);
      if (success) {
        setSelectedMod(null);
        setSelectedStaff(null);
        // Optionally close modal on success, or let user start more research
        // onClose(); 
      }
    }
  };

  const getTargetEquipmentName = (modifiesEquipmentId: string): string => {
    const equipment = availableEquipment.find(eq => eq.id === modifiesEquipmentId);
    return equipment ? equipment.name : 'Unknown Equipment';
  };

  const unresearchedMods = availableMods.filter(mod => !gameState.researchedMods.includes(mod.id));
  const eligibleEngineers = gameState.hiredStaff.filter(
    staff => staff.role === 'Engineer' && staff.status === 'Idle'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gray-800 border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">🔬 Equipment Modification Research</DialogTitle>
          <DialogDescription className="text-gray-400">
            Assign an Engineer to research new equipment modifications.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] ">
          {/* Mods List */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-2 text-gray-200">Available Modifications</h3>
            <ScrollArea className="flex-grow border border-gray-600 rounded-md p-2 bg-gray-900/70 min-h-[200px]">
              {unresearchedMods.length === 0 && (
                <p className="text-gray-400 text-center py-4">No new modifications available for research.</p>
              )}
              {unresearchedMods.map((mod) => (
                <Card
                  key={mod.id}
                  className={`mb-2 cursor-pointer transition-all ${
                    selectedMod?.id === mod.id ? 'ring-2 ring-blue-500 bg-blue-800/50' : 'bg-gray-700/80 hover:bg-gray-700'
                  }`}
                  onClick={() => handleSelectMod(mod)}
                >
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-base text-yellow-300">{mod.name}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">
                      Modifies: {getTargetEquipmentName(mod.modifiesEquipmentId)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-300 pb-3 px-4">
                    <p>{mod.description}</p>
                    <p className="mt-1">Cost: ${mod.researchRequirements.cost}, Time: {mod.researchRequirements.researchTime} days</p>
                    <p>Requires: {mod.researchRequirements.engineerSkill} Lvl {mod.researchRequirements.engineerSkillLevel}</p>
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          </div>

          {/* Staff Assignment & Details */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-2 text-gray-200">Assign Engineer</h3>
            {selectedMod ? (
              <>
                <ScrollArea className="flex-grow border border-gray-600 rounded-md p-2 bg-gray-900/70 min-h-[200px]">
                  {eligibleEngineers.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No idle Engineers available.</p>
                  )}
                  {eligibleEngineers.map((staff) => {
                    const skillName = selectedMod.researchRequirements.engineerSkill;
                    // @ts-expect-error TODO: Fix skill type to allow dynamic access
                    const staffSkillLevel = staff.skills[skillName]?.level || 0;
                    const canResearch = staffSkillLevel >= selectedMod.researchRequirements.engineerSkillLevel;
                    return (
                      <Card
                        key={staff.id}
                        className={`mb-2 cursor-pointer transition-all ${
                          selectedStaff?.id === staff.id ? 'ring-2 ring-green-500 bg-green-800/50' : 'bg-gray-700/80 hover:bg-gray-700'
                        } ${!canResearch ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => canResearch && handleSelectStaff(staff)}
                      >
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-base text-green-300">{staff.name}</CardTitle>
                          <CardDescription className="text-xs text-gray-400">
                            {staff.role} - {skillName} Lvl: {staffSkillLevel} (Req: {selectedMod.researchRequirements.engineerSkillLevel})
                          </CardDescription>
                        </CardHeader>
                        {!canResearch && (
                          <CardContent className="text-xs text-red-400 pb-3 px-4">
                            Skill too low for this research.
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </ScrollArea>
                <Button
                  onClick={handleStartResearch}
                  disabled={!selectedMod || !selectedStaff || gameState.money < selectedMod.researchRequirements.cost}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Research for ${selectedMod.researchRequirements.cost}
                </Button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full border border-gray-600 rounded-md p-4 bg-gray-900/70">
                <p className="text-gray-400">Select a modification to see assignable staff.</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="sm:justify-start pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
