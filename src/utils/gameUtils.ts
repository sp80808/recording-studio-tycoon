
import { GameState, StudioSkill, Equipment, PlayerAttributes } from '@/types/game';
import { upgradePlayerAttribute } from './playerUtils';
import {
  INVENTORY_SLOT_ID,
  generateDefaultRoomSlots,
} from '@/types/equipmentSlots';

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
  
  if (gameState.money < equipment.price) {
    console.log('- Result: Insufficient funds');
    return { canPurchase: false, reason: 'Insufficient funds' };
  }

  console.log('- Result: Can purchase');
  return { canPurchase: true };
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

/**
 * Spend a perk point on a player attribute.
 * Uses atomic upgrade logic with range validation and cap at 10.
 */
export const spendPerkPoint = (gameState: GameState, attribute: keyof PlayerAttributes): GameState => {
  return upgradePlayerAttribute(gameState, attribute);
};

/**
 * Resolve the equipment that is physically active in a given room.
 *
 * Slot-based placement (bead 8om) means an item only counts for a room's
 * sessions when it is seated in one of that room's slots. Items still in
 * inventory, or seated in a different room, do not contribute. Legacy saves
 * without placements fall back to the global ownedEquipment list.
 *
 * Prefer {@link resolveSessionEquipment} for work/settlement paths — it adds
 * the soft inventory-only cutover so bonuses are not zeroed before the player
 * seats any gear.
 */
export const getRoomEquipment = (
  gameState: Pick<GameState, 'ownedEquipment' | 'equipmentPlacements'>,
  roomId: string,
  roomSlots: { id: string }[]
): Equipment[] => {
  const placements = gameState.equipmentPlacements;
  if (!placements || placements.length === 0) {
    return gameState.ownedEquipment;
  }

  const roomSlotIds = new Set(roomSlots.map((slot) => slot.id));
  const activeIds = new Set(
    placements
      .filter((placement) => roomSlotIds.has(placement.slotId))
      .map((placement) => placement.equipmentId)
  );

  return gameState.ownedEquipment.filter((item) => activeIds.has(item.id));
};

/**
 * Soft-cutover session gear resolver (bead 8om).
 *
 * - No placements / empty → legacy: all owned gear
 * - Placements exist but nothing seated in any room chassis (inventory-only,
 *   including fresh migrations via buildDefaultPlacements) → all owned gear
 * - At least one room seat exists → only gear seated in `roomId` counts
 */
export const resolveSessionEquipment = (
  gameState: Pick<GameState, 'ownedEquipment' | 'equipmentPlacements'>,
  roomId?: string | null
): Equipment[] => {
  const owned = gameState.ownedEquipment || [];
  const placements = gameState.equipmentPlacements;

  if (!placements || placements.length === 0) {
    return owned;
  }

  const hasAnyRoomSeat = placements.some((p) => p.slotId !== INVENTORY_SLOT_ID);
  if (!hasAnyRoomSeat) {
    return owned;
  }

  const resolvedRoomId = roomId || 'studio-a';
  const roomSlots = generateDefaultRoomSlots(resolvedRoomId);
  return getRoomEquipment(gameState, resolvedRoomId, roomSlots);
};
