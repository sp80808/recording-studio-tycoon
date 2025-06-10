
import { useCallback, useEffect, useState } from 'react';
import { GameState, PlayerAttributes } from '@/types/game';
import { toast } from '@/hooks/use-toast';

interface ProgressionMilestone {
  id: string;
  name: string;
  description: string;
  requirements: {
    level?: number;
    completedProjects?: number;
    reputation?: number;
    money?: number;
  };
  rewards: {
    perkPoints?: number;
    money?: number;
    unlocks?: string[];
  };
  completed: boolean;
}

interface StudioUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  requirements: {
    level: number;
    reputation: number;
  };
  benefits: {
    staffCapacity?: number;
    projectCapacity?: number;
    qualityBonus?: number;
    speedBonus?: number;
  };
  unlocked: boolean;
  purchased: boolean;
}

export const useProgressionSystem = (
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const [milestones] = useState<ProgressionMilestone[]>([
    {
      id: 'first_project',
      name: 'First Recording',
      description: 'Complete your first project',
      requirements: { completedProjects: 1 },
      rewards: { perkPoints: 2, money: 500 },
      completed: false
    },
    {
      id: 'rising_star',
      name: 'Rising Star',
      description: 'Reach level 5 and 100 reputation',
      requirements: { level: 5, reputation: 100 },
      rewards: { perkPoints: 3, unlocks: ['advanced_equipment'] },
      completed: false
    },
    {
      id: 'studio_mogul',
      name: 'Studio Mogul',
      description: 'Complete 25 projects and reach $50,000',
      requirements: { completedProjects: 25, money: 50000 },
      rewards: { perkPoints: 5, unlocks: ['record_label'] },
      completed: false
    },
    {
      id: 'industry_legend',
      name: 'Industry Legend',
      description: 'Reach level 20 with 500 reputation',
      requirements: { level: 20, reputation: 500 },
      rewards: { perkPoints: 10, unlocks: ['legendary_studio'] },
      completed: false
    }
  ]);

  const [studioUpgrades] = useState<StudioUpgrade[]>([
    {
      id: 'basic_booth',
      name: 'Vocal Booth',
      description: 'A soundproof booth for clean vocal recordings',
      cost: 5000,
      requirements: { level: 3, reputation: 50 },
      benefits: { qualityBonus: 0.1 },
      unlocked: false,
      purchased: false
    },
    {
      id: 'mixing_room',
      name: 'Dedicated Mixing Room',
      description: 'Professional mixing environment with acoustic treatment',
      cost: 15000,
      requirements: { level: 7, reputation: 150 },
      benefits: { qualityBonus: 0.2, speedBonus: 0.15 },
      unlocked: false,
      purchased: false
    },
    {
      id: 'mastering_suite',
      name: 'Mastering Suite',
      description: 'High-end mastering room with reference monitors',
      cost: 35000,
      requirements: { level: 12, reputation: 300 },
      benefits: { qualityBonus: 0.3, projectCapacity: 1 },
      unlocked: false,
      purchased: false
    },
    {
      id: 'live_room',
      name: 'Live Recording Room',
      description: 'Spacious room for band recordings and live sessions',
      cost: 75000,
      requirements: { level: 18, reputation: 500 },
      benefits: { staffCapacity: 2, qualityBonus: 0.4 },
      unlocked: false,
      purchased: false
    }
  ]);

  // Check for milestone completion
  const checkMilestones = useCallback(() => {
    milestones.forEach(milestone => {
      if (milestone.completed) return;

      const meetsRequirements = Object.entries(milestone.requirements).every(([key, value]) => {
        switch (key) {
          case 'level':
            return gameState.playerData.level >= value;
          case 'completedProjects':
            return gameState.playerData.completedProjects >= value;
          case 'reputation':
            return gameState.reputation >= value;
          case 'money':
            return gameState.money >= value;
          default:
            return true;
        }
      });

      if (meetsRequirements) {
        milestone.completed = true;
        
        // Apply rewards
        setGameState(prev => ({
          ...prev,
          playerData: {
            ...prev.playerData,
            perkPoints: prev.playerData.perkPoints + (milestone.rewards.perkPoints || 0)
          },
          money: prev.money + (milestone.rewards.money || 0)
        }));

        toast({
          title: "🏆 Milestone Achieved!",
          description: `${milestone.name}: ${milestone.description}`,
          duration: 5000
        });
      }
    });
  }, [gameState, milestones, setGameState]);

  // Check for studio upgrade unlocks
  const checkStudioUpgrades = useCallback(() => {
    studioUpgrades.forEach(upgrade => {
      if (upgrade.unlocked) return;

      const meetsRequirements = 
        gameState.playerData.level >= upgrade.requirements.level &&
        gameState.reputation >= upgrade.requirements.reputation;

      if (meetsRequirements) {
        upgrade.unlocked = true;
        toast({
          title: "🔓 New Upgrade Available!",
          description: `${upgrade.name} is now available for purchase`,
          duration: 3000
        });
      }
    });
  }, [gameState, studioUpgrades]);

  // Purchase studio upgrade
  const purchaseStudioUpgrade = useCallback((upgradeId: string) => {
    const upgrade = studioUpgrades.find(u => u.id === upgradeId);
    if (!upgrade || !upgrade.unlocked || upgrade.purchased || gameState.money < upgrade.cost) {
      return false;
    }

    upgrade.purchased = true;
    
    setGameState(prev => ({
      ...prev,
      money: prev.money - upgrade.cost,
      studioLevel: prev.studioLevel + 1
    }));

    toast({
      title: "🏗️ Upgrade Purchased!",
      description: `${upgrade.name} has been added to your studio`,
      duration: 3000
    });

    return true;
  }, [gameState.money, studioUpgrades, setGameState]);

  // Calculate XP required for next level (logarithmic scaling)
  const calculateXPToNextLevel = useCallback((level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }, []);

  // Level up system with meaningful rewards
  const checkLevelUp = useCallback(() => {
    const { level, xp } = gameState.playerData;
    const xpRequired = calculateXPToNextLevel(level);

    if (xp >= xpRequired) {
      const newLevel = level + 1;
      const remainingXP = xp - xpRequired;
      
      // Base perk points: 2 per level, with bonus for milestone levels
      const perkPointsGained = 2 + (newLevel % 5 === 0 ? 1 : 0);
      
      setGameState(prev => ({
        ...prev,
        playerData: {
          ...prev.playerData,
          level: newLevel,
          xp: remainingXP,
          perkPoints: prev.playerData.perkPoints + perkPointsGained,
          dailyWorkCapacity: prev.playerData.dailyWorkCapacity + 1 // Increase capacity
        }
      }));

      toast({
        title: "🎉 Level Up!",
        description: `Welcome to Level ${newLevel}! +${perkPointsGained} Perk Points`,
        duration: 4000
      });
    }
  }, [gameState.playerData, calculateXPToNextLevel, setGameState]);

  // Generate money sinks to prevent hoarding
  const generateMoneySinks = useCallback((): Array<{
    name: string;
    cost: number;
    benefit: string;
  }> => {
    const playerMoney = gameState.money;
    const sinks = [];

    if (playerMoney > 10000) {
      sinks.push({
        name: 'Marketing Campaign',
        cost: Math.floor(playerMoney * 0.2),
        benefit: '+20% reputation gain for next 10 projects'
      });
    }

    if (playerMoney > 25000) {
      sinks.push({
        name: 'Industry Networking Event',
        cost: Math.floor(playerMoney * 0.15),
        benefit: 'Unlock 3 high-value projects'
      });
    }

    if (playerMoney > 50000) {
      sinks.push({
        name: 'Equipment Insurance',
        cost: Math.floor(playerMoney * 0.1),
        benefit: 'Prevent equipment breakdowns for 30 days'
      });
    }

    return sinks;
  }, [gameState.money]);

  // Run progression checks
  useEffect(() => {
    checkMilestones();
    checkStudioUpgrades();
    checkLevelUp();
  }, [checkMilestones, checkStudioUpgrades, checkLevelUp]);

  return {
    milestones,
    studioUpgrades,
    purchaseStudioUpgrade,
    calculateXPToNextLevel,
    generateMoneySinks,
    checkLevelUp
  };
};
