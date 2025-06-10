
import { GameState, PlayerAttributes } from '@/types/game';

export const calculateAttributeBonus = (attribute: keyof PlayerAttributes, level: number): number => {
  // Each attribute level provides a percentage bonus
  const bonusPerLevel = 5; // 5% per level
  return (level - 1) * bonusPerLevel;
};

export const getCreativityMultiplier = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('creativeIntuition', gameState.playerData.attributes.creativeIntuition);
  return 1 + (bonus / 100);
};

export const getTechnicalMultiplier = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('technicalAptitude', gameState.playerData.attributes.technicalAptitude);
  return 1 + (bonus / 100);
};

export const getBusinessMultiplier = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('businessAcumen', gameState.playerData.attributes.businessAcumen);
  return 1 + (bonus / 100);
};

export const getFocusEffectiveness = (gameState: GameState): number => {
  const bonus = calculateAttributeBonus('focusMastery', gameState.playerData.attributes.focusMastery);
  return 1 + (bonus / 100);
};

export const getTotalWorkCapacity = (gameState: GameState): number => {
  // Base capacity from focus mastery + assigned staff capacity
  const baseCapacity = gameState.playerData.attributes.focusMastery + 3;
  const staffCapacity = gameState.hiredStaff
    .filter(s => s.status === 'Working' && s.assignedProjectId === gameState.activeProject?.id)
    .reduce((total, staff) => total + Math.floor(staff.primaryStats.speed / 10), 0);
  
  return baseCapacity + staffCapacity;
};

export const getMoodEffectiveness = (mood: number): number => {
  if (mood < 40) return 0.75; // 25% penalty for low mood
  if (mood > 75) return 1.1; // 10% bonus for high mood
  return 1.0; // Normal effectiveness
};
