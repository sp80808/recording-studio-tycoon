
import { GameState, StudioSkill, Equipment, PlayerAttributes } from '@/types/game';

export const calculateStudioSkillBonus = (skill: StudioSkill, type: 'creativity' | 'technical' | 'quality'): number => {
  const level = skill.level;
  
  switch (type) {
    case 'creativity':
      return level * 2; // +2% creativity per level
    case 'technical':
      return level * 1.5; // +1.5% technical per level  
    case 'quality':
      return level * 1; // +1% quality per level
    default:
      return 0;
  }
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

export const canPurchaseEquipment = (equipment: Equipment, gameState: GameState): { canPurchase: boolean; reason?: string } => {
  console.log(`Checking purchase for ${equipment.name}:`);
  console.log(`- Player money: $${gameState.money}`);
  console.log(`- Equipment cost: $${equipment.price}`);
  
  if (gameState.money < equipment.price) {
    console.log('- Result: Insufficient funds');
    return { canPurchase: false, reason: 'Insufficient funds' };
  }

  if (gameState.ownedEquipment.some(e => e.id === equipment.id)) {
    console.log('- Result: Already owned');
    return { canPurchase: false, reason: 'Already owned' };
  }

  if (equipment.skillRequirement) {
    const skill = gameState.studioSkills[equipment.skillRequirement.skill];
    console.log(`- Skill requirement: ${equipment.skillRequirement.skill} Level ${equipment.skillRequirement.level}`);
    console.log(`- Player skill level: ${skill?.level || 0}`);
    
    if (!skill || skill.level < equipment.skillRequirement.level) {
      console.log('- Result: Skill requirement not met');
      return { 
        canPurchase: false, 
        reason: `Requires ${equipment.skillRequirement.skill} Level ${equipment.skillRequirement.level}` 
      };
    }
  }

  console.log('- Result: Can purchase');
  return { canPurchase: true };
};

export const applyEquipmentEffects = (equipment: Equipment, gameState: GameState): GameState => {
  console.log(`=== APPLYING EQUIPMENT EFFECTS for ${equipment.name} ===`);
  console.log('Equipment bonuses:', equipment.bonuses);
  
  let updatedGameState = { ...gameState };
  
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
        let newXpToNext = updatedSkills[genre].xpToNext;
        let remainingXp = newXp;
        
        while (remainingXp >= newXpToNext && newLevel < 10) {
          remainingXp -= newXpToNext;
          newLevel++;
          newXpToNext = newLevel * 20; // XP required for next level
        }
        
        updatedSkills[genre] = {
          ...updatedSkills[genre],
          level: newLevel,
          xp: remainingXp,
          xpToNext: newXpToNext
        };
        
        console.log(`- ${genre} skill: Level ${updatedSkills[genre].level}, XP: ${remainingXp}/${newXpToNext}`);
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
