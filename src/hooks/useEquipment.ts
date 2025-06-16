import { useCallback } from 'react';
import { GameState, Equipment } from '@/types/game';
import { toast } from '@/hooks/use-toast';

export const useEquipment = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const purchaseEquipment = useCallback((equipment: Equipment) => {
    if (gameState.money < equipment.cost) {
      toast({
        title: "Insufficient Funds",
        description: `Cannot afford ${equipment.name}. Cost: $${equipment.cost}`,
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - equipment.cost,
      equipment: [...prev.equipment, equipment]
    }));

    toast({
      title: "Equipment Purchased!",
      description: `Added ${equipment.name} to your studio.`,
      duration: 3000
    });

    return true;
  }, [gameState.money, setGameState]);

  const sellEquipment = useCallback((equipmentId: string) => {
    const equipment = gameState.equipment.find(e => e.id === equipmentId);
    if (!equipment) {
      toast({
        title: "Equipment Not Found",
        description: "Cannot find the specified equipment.",
        variant: "destructive"
      });
      return false;
    }

    const sellValue = Math.floor(equipment.cost * 0.7); // 70% of original cost

    setGameState(prev => ({
      ...prev,
      money: prev.money + sellValue,
      equipment: prev.equipment.filter(e => e.id !== equipmentId)
    }));

    toast({
      title: "Equipment Sold!",
      description: `Sold ${equipment.name} for $${sellValue}.`,
      duration: 3000
    });

    return true;
  }, [gameState.equipment, setGameState]);

  const upgradeEquipment = useCallback((equipmentId: string) => {
    const equipment = gameState.equipment.find(e => e.id === equipmentId);
    if (!equipment) {
      toast({
        title: "Equipment Not Found",
        description: "Cannot find the specified equipment.",
        variant: "destructive"
      });
      return false;
    }

    const upgradeCost = Math.floor(equipment.cost * 0.5); // 50% of original cost
    if (gameState.money < upgradeCost) {
      toast({
        title: "Insufficient Funds",
        description: `Cannot afford upgrade. Cost: $${upgradeCost}`,
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - upgradeCost,
      equipment: prev.equipment.map(e => 
        e.id === equipmentId
          ? {
              ...e,
              quality: Math.min(100, e.quality + 10),
              condition: Math.min(100, e.condition + 20)
            }
          : e
      )
    }));

    toast({
      title: "Equipment Upgraded!",
      description: `Upgraded ${equipment.name} for $${upgradeCost}.`,
      duration: 3000
    });

    return true;
  }, [gameState.equipment, gameState.money, setGameState]);

  const repairEquipment = useCallback((equipmentId: string) => {
    const equipment = gameState.equipment.find(e => e.id === equipmentId);
    if (!equipment) {
      toast({
        title: "Equipment Not Found",
        description: "Cannot find the specified equipment.",
        variant: "destructive"
      });
      return false;
    }

    const repairCost = Math.floor(equipment.cost * 0.2); // 20% of original cost
    if (gameState.money < repairCost) {
      toast({
        title: "Insufficient Funds",
        description: `Cannot afford repair. Cost: $${repairCost}`,
        variant: "destructive"
      });
      return false;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - repairCost,
      equipment: prev.equipment.map(e => 
        e.id === equipmentId
          ? {
              ...e,
              condition: 100
            }
          : e
      )
    }));

    toast({
      title: "Equipment Repaired!",
      description: `Repaired ${equipment.name} for $${repairCost}.`,
      duration: 3000
    });

    return true;
  }, [gameState.equipment, gameState.money, setGameState]);

  return {
    purchaseEquipment,
    sellEquipment,
    upgradeEquipment,
    repairEquipment
  };
}; 