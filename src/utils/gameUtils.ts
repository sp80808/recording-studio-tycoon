import { GameState, StudioSkill, Equipment, PlayerAttributes, Project } from '@/types/game';

export const calculateStudioSkillBonus = (gameState: GameState, skillName: string): number => {
  const skill = gameState.studioSkills[skillName];
  if (!skill) return 0;
  return skill.level * 0.1; // 10% bonus per level
};

export const getEquipmentBonuses = (ownedEquipment: Equipment[], genre?: string) => {
  let totalQualityBonus = 0;
  let totalCreativityBonus = 0;
  let totalTechnicalBonus = 0;
  let totalSpeedBonus = 0;
  let genreBonus = 0;

  ownedEquipment.forEach(equipment => {
    totalQualityBonus += equipment.bonuses.qualityBonus || 0;
    totalCreativityBonus += equipment.bonuses.creativityBonus || 0;
    totalTechnicalBonus += equipment.bonuses.technicalBonus || 0;
    totalSpeedBonus += equipment.bonuses.speedBonus || 0;

    if (genre && equipment.bonuses.genreBonus?.[genre]) {
      genreBonus += equipment.bonuses.genreBonus[genre];
    }
  });

  return {
    quality: totalQualityBonus,
    creativity: totalCreativityBonus,
    technical: totalTechnicalBonus,
    speed: totalSpeedBonus,
    genre: genreBonus
  };
};

export const canPurchaseEquipment = (gameState: GameState, equipment: Equipment): boolean => {
  return gameState.playerData.money >= equipment.price;
};

export const applyEquipmentEffects = (equipment: Equipment, gameState: GameState): GameState => {
  console.log(`=== APPLYING EQUIPMENT EFFECTS for ${equipment.name} ===`);
  console.log('Equipment bonuses:', equipment.bonuses);
  
  const updatedGameState = { ...gameState };
  
  // Apply skill bonuses by adding XP to relevant skills
  if (equipment.bonuses.genreBonus) {
    const updatedSkills = { ...updatedGameState.studioSkills };
    
    Object.entries(equipment.bonuses.genreBonus).forEach(([genre, bonus]) => {
      if (updatedSkills[genre]) {
        const xpBonus = bonus * 10; // Convert genre bonus to XP (more generous)
        const oldXp = updatedSkills[genre].xp;
        const newXp = oldXp + xpBonus;
        
        // Calculate if level increases
        let newLevel = updatedSkills[genre].level;
        let newXpToNextLevel = updatedSkills[genre].xpToNextLevel;
        let remainingXp = newXp;
        
        while (remainingXp >= newXpToNextLevel && newLevel < 10) {
          remainingXp -= newXpToNextLevel;
          newLevel++;
          newXpToNextLevel = newLevel * 20; // XP required for next level
        }
        
        updatedSkills[genre] = {
          ...updatedSkills[genre],
          level: newLevel,
          xp: remainingXp,
          xpToNextLevel: newXpToNextLevel
        };
        
        console.log(`- ${genre} skill: Level ${updatedSkills[genre].level}, XP: ${remainingXp}/${newXpToNextLevel}`);
      }
    });
    
    updatedGameState.studioSkills = updatedSkills;
  }
  
  // Apply player attribute bonuses
  if (equipment.bonuses.creativityBonus || equipment.bonuses.technicalBonus) {
    const updatedAttributes = { ...updatedGameState.playerData.attributes };
    
    if (equipment.bonuses.creativityBonus) {
      const bonus = Math.floor(equipment.bonuses.creativityBonus / 10); // Convert percentage to attribute points
      updatedAttributes.creativeIntuition += bonus;
      console.log(`- Creative Intuition increased by ${bonus}`);
    }
    
    if (equipment.bonuses.technicalBonus) {
      const bonus = Math.floor(equipment.bonuses.technicalBonus / 10);
      updatedAttributes.technicalAptitude += bonus;
      console.log(`- Technical Aptitude increased by ${bonus}`);
    }
    
    updatedGameState.playerData = {
      ...updatedGameState.playerData,
      attributes: updatedAttributes
    };
  }
  
  console.log('=== EQUIPMENT EFFECTS APPLIED ===');
  return updatedGameState;
};

export const addNotification = (gameState: GameState, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 5000) => {
  const notification = {
    id: `notification_${Date.now()}_${Math.random()}`,
    message,
    type,
    timestamp: Date.now(),
    duration
  };

  return {
    ...gameState,
    notifications: [...gameState.notifications, notification]
  };
};

export const spendPerkPoint = (gameState: GameState, attribute: keyof PlayerAttributes): GameState => {
  if (gameState.playerData.perkPoints <= 0) {
    return gameState;
  }

  const updatedAttributes = {
    ...gameState.playerData.attributes,
    [attribute]: gameState.playerData.attributes[attribute] + 1
  };

  return {
    ...gameState,
    playerData: {
      ...gameState.playerData,
      perkPoints: gameState.playerData.perkPoints - 1,
      attributes: updatedAttributes
    }
  };
};

export const calculateProjectQuality = (gameState: GameState, project: Project): number => {
  let quality = 0;
  // Base quality from equipment
  gameState.ownedEquipment.forEach(equipment => {
    quality += equipment.bonuses.qualityBonus || 0;
  });
  // Add staff bonuses (if staff system is implemented)
  // Example: sum up all staff skills relevant to the project genre
  // (This is a placeholder; adapt as needed for your staff system)
  // if (project.assignedStaff) {
  //   project.assignedStaff.forEach(staffId => {
  //     const staff = gameState.staff.find(s => s.id === staffId);
  //     if (staff) {
  //       quality += (staff.skills[project.genre] || 0) * 0.05; // 5% bonus per skill level in genre
  //     }
  //   });
  // }
  return Math.min(100, Math.max(0, quality));
};

export const calculateProjectProgress = (project: Project): number => {
  const totalStages = project.stages.length;
  const completedStages = project.stages.filter(stage => stage.isCompleted).length;
  return (completedStages / totalStages) * 100;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value / 100);
};
