import { GameState, StudioSkill, Equipment } from '@/types/game';

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
  console.log(`APPLYING EQUIPMENT EFFECTS for ${equipment.name}:`, equipment.bonuses);
  
  const updatedGameState = { ...gameState };
  
  // Apply skill XP bonuses if equipment has genre bonuses
  if (equipment.bonuses.genreBonus) {
    const updatedSkills = { ...updatedGameState.studioSkills };
    
    Object.entries(equipment.bonuses.genreBonus).forEach(([genre, bonus]) => {
      if (updatedSkills[genre]) {
        const xpBonus = bonus * 5; // Convert genre bonus to XP
        const currentSkill = updatedSkills[genre];
        const newXp = currentSkill.xp + xpBonus;
        let newLevel = currentSkill.level;
        let newXpToNext = currentSkill.xpToNext;

        // Check for level up
        while (newXp >= newXpToNext) {
          newLevel++;
          newXpToNext = newLevel * 100; // Assuming 100 XP per level threshold
          console.log(`- ${genre} skill leveled up to Level ${newLevel}!`);
          // No need to carry over excess XP for now, just update level and next threshold
        }

        updatedSkills[genre] = {
          ...currentSkill,
          xp: newXp,
          level: newLevel,
          xpToNext: newXpToNext
        };
        console.log(`- APPLIED: Added ${xpBonus} XP to ${genre} skill (Current XP: ${updatedSkills[genre].xp}/${updatedSkills[genre].xpToNext}, Level: ${updatedSkills[genre].level})`);
      }
    });
    
    updatedGameState.studioSkills = updatedSkills;
  }
  
  // Apply creativity/technical bonuses by updating player attributes
  if (equipment.bonuses.creativityBonus || equipment.bonuses.technicalBonus) {
    const updatedAttributes = { ...updatedGameState.playerData.attributes };
    
    if (equipment.bonuses.creativityBonus) {
      updatedAttributes.creativeIntuition += equipment.bonuses.creativityBonus;
      console.log(`- APPLIED: Added ${equipment.bonuses.creativityBonus} to creativeIntuition (New value: ${updatedAttributes.creativeIntuition})`);
    }
    
    if (equipment.bonuses.technicalBonus) {
      updatedAttributes.technicalAptitude += equipment.bonuses.technicalBonus;
      console.log(`- APPLIED: Added ${equipment.bonuses.technicalBonus} to technicalAptitude (New value: ${updatedAttributes.technicalAptitude})`);
    }
    
    updatedGameState.playerData.attributes = updatedAttributes;
  }
  
  // Apply quality bonus if present
  if (equipment.bonuses.qualityBonus) {
    // Quality bonus affects project quality calculations
    // This is handled during project work calculations
    console.log(`- APPLIED: Quality bonus of ${equipment.bonuses.qualityBonus}% will affect project quality`);
  }
  
  // Apply speed bonus if present
  if (equipment.bonuses.speedBonus) {
    // Speed bonus affects work unit calculations
    const updatedPlayerData = { ...updatedGameState.playerData };
    updatedPlayerData.dailyWorkCapacity = Math.floor(
      updatedPlayerData.dailyWorkCapacity * (1 + equipment.bonuses.speedBonus / 100)
    );
    console.log(`- APPLIED: Speed bonus of ${equipment.bonuses.speedBonus}% increases daily work capacity to ${updatedPlayerData.dailyWorkCapacity}`);
    updatedGameState.playerData = updatedPlayerData;
  }
  
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
