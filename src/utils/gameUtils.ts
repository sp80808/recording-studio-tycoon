
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
  if (gameState.money < equipment.price) {
    return { canPurchase: false, reason: 'Insufficient funds' };
  }

  if (gameState.ownedEquipment.some(e => e.id === equipment.id)) {
    return { canPurchase: false, reason: 'Already owned' };
  }

  if (equipment.skillRequirement) {
    const skill = gameState.studioSkills[equipment.skillRequirement.skill];
    if (!skill || skill.level < equipment.skillRequirement.level) {
      return { 
        canPurchase: false, 
        reason: `Requires ${equipment.skillRequirement.skill} Level ${equipment.skillRequirement.level}` 
      };
    }
  }

  return { canPurchase: true };
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
