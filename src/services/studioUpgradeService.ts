import { GameState, MusicGenre } from '@/types/game';
import { StudioPerk, PerkUnlockCondition, PerkEffect } from '@/types/studioPerks';

// Placeholder for actual perk data.
const allStudioPerksData: StudioPerk[] = [
  {
    id: 'basicAcoustics', name: 'Basic Acoustic Treatment',
    description: 'Improves recording quality slightly by reducing unwanted room reflections.',
    category: 'Acoustics', tier: 1,
    cost: { money: 5000 },
    unlockConditions: [{ type: 'playerLevel', value: 2 }],
    effects: [{ key: 'globalRecordingQualityModifier', value: 0.02, operation: 'multiply' }],
  },
  {
    id: 'negotiation101', name: 'Negotiation 101',
    description: 'Slightly better contract payouts from clients.',
    category: 'BusinessOperations', tier: 1,
    cost: { money: 3000, perkPoints: 1 },
    unlockConditions: [{ type: 'completedProjects', value: 5 }],
    effects: [{ key: 'contractPayoutModifier', value: 0.03, operation: 'multiply' }],
  },
  {
    id: 'talentScoutNetwork', name: 'Talent Scout Network',
    description: 'Increases the quality and variety of available staff candidates.',
    category: 'TalentAcquisition', tier: 2,
    cost: { money: 15000, perkPoints: 2 },
    unlockConditions: [{ type: 'studioReputation', value: 30 }],
    effects: [{ key: 'candidateQualityBonus', value: 10, operation: 'add' }],
    prerequisites: ['negotiation101']
  },
  {
    id: 'rockAppealBoost', name: 'Rock Appeal Boost',
    description: 'Increases appeal for Rock projects.',
    category: 'Marketing', tier: 1,
    cost: { money: 2000 },
    unlockConditions: [{ type: 'playerLevel', value: 3 }],
    effects: [{ key: 'projectAppealModifier', value: 0.1, operation: 'add', genre: 'rock' }],
  }
];

const allMusicGenres: MusicGenre[] = [
    'rock', 'pop', 'hip-hop', 'electronic', 'country', 'alternative',
    'r&b', 'jazz', 'classical', 'folk', 'acoustic'
];

export const studioUpgradeService = {
  getAvailablePerks: (gameState: GameState): StudioPerk[] => {
    const { ownedUpgrades } = gameState;

    return allStudioPerksData.filter(perk => {
      if (ownedUpgrades.includes(perk.id) && !perk.isRepeatable) {
        return false;
      }
      if (perk.isRepeatable && perk.maxRepeats) {
        const timesOwned = ownedUpgrades.filter(id => id === perk.id).length;
        if (timesOwned >= perk.maxRepeats) return false;
      }
      if (perk.prerequisites && !perk.prerequisites.every(prereqId => ownedUpgrades.includes(prereqId))) {
        return false;
      }
      return perk.unlockConditions.every(condition =>
        checkCondition(condition, gameState)
      );
    });
  },

  canUnlockPerk: (perkId: string, gameState: GameState): boolean => {
    const perk = allStudioPerksData.find(p => p.id === perkId);
    if (!perk) return false;
    if (gameState.ownedUpgrades.includes(perk.id) && !perk.isRepeatable) return false;
    if (perk.prerequisites && !perk.prerequisites.every(pId => gameState.ownedUpgrades.includes(pId))) {
      return false;
    }
    return perk.unlockConditions.every(condition => checkCondition(condition, gameState));
  },

  unlockPerk: (perkId: string, currentGameState: GameState): GameState | null => {
    const perk = allStudioPerksData.find(p => p.id === perkId);
    if (!perk || !studioUpgradeService.canUnlockPerk(perkId, currentGameState)) {
      console.warn(`Cannot unlock perk ${perkId}. Conditions not met or perk already owned.`);
      return null;
    }

    let newGameState = { ...currentGameState };
    newGameState.playerData = { ...newGameState.playerData };

    if (perk.cost) {
      if (perk.cost.money && newGameState.money < perk.cost.money) return null;
      if (perk.cost.money) newGameState.money -= perk.cost.money;

      if (perk.cost.perkPoints && newGameState.playerData.perkPoints < perk.cost.perkPoints) return null;
      if (perk.cost.perkPoints) newGameState.playerData.perkPoints -= perk.cost.perkPoints;
    }

    newGameState.ownedUpgrades = [...newGameState.ownedUpgrades, perk.id];
    newGameState = studioUpgradeService.applyAllPerkEffects(newGameState);

    console.log(`Perk ${perk.name} unlocked!`);
    return newGameState;
  },

  getOwnedPerks: (gameState: GameState): StudioPerk[] => {
    return allStudioPerksData.filter(perk => gameState.ownedUpgrades.includes(perk.id));
  },

  applyAllPerkEffects: (gameState: GameState): GameState => {
    const modifiedGameState = { ...gameState };
    const ownedPerks = studioUpgradeService.getOwnedPerks(gameState);

    const initialProjectAppealModifier = allMusicGenres.reduce((acc, genre) => {
      acc[genre] = 1.0;
      return acc;
    }, { 'all': 1.0 } as Record<MusicGenre | 'all', number>);

    const defaultModifiers: NonNullable<GameState['aggregatedPerkModifiers']> = {
      globalRecordingQualityModifier: 1.0,
      globalMixingQualityModifier: 1.0,
      globalMasteringQualityModifier: 1.0,
      contractPayoutModifier: 1.0,
      researchSpeedModifier: 1.0,
      staffHappinessModifier: 0,
      staffTrainingSpeedModifier: 1.0,
      marketingEffectivenessModifier: 1.0,
      projectAppealModifier: initialProjectAppealModifier,
      candidateQualityBonus: 0,
    };

    modifiedGameState.aggregatedPerkModifiers = JSON.parse(JSON.stringify(defaultModifiers));

    ownedPerks.forEach(perk => {
      perk.effects.forEach(effect => {
        const { key, value, operation } = effect;
        const effectGenre = effect.genre;

        if (!modifiedGameState.aggregatedPerkModifiers) return;

        if (key === 'projectAppealModifier' && typeof value === 'number') {
          const targetGenreKey = effectGenre || 'all';

          if (modifiedGameState.aggregatedPerkModifiers.projectAppealModifier[targetGenreKey as MusicGenre | 'all'] === undefined) {
            modifiedGameState.aggregatedPerkModifiers.projectAppealModifier[targetGenreKey as MusicGenre | 'all'] = 1.0;
          }

          let currentAppealModifier = modifiedGameState.aggregatedPerkModifiers.projectAppealModifier[targetGenreKey as MusicGenre | 'all'];

          if (operation === 'multiply') {
            currentAppealModifier *= (1 + value);
          } else if (operation === 'add') {
            currentAppealModifier += value;
          } else if (operation === 'set') {
            currentAppealModifier = value;
          }
          modifiedGameState.aggregatedPerkModifiers.projectAppealModifier[targetGenreKey as MusicGenre | 'all'] = currentAppealModifier;

        } else if (typeof value === 'number' && Object.prototype.hasOwnProperty.call(modifiedGameState.aggregatedPerkModifiers, key)) {
          const modifiers = modifiedGameState.aggregatedPerkModifiers as unknown as Record<string, number>; // Double cast for dynamic numeric access
          if (typeof modifiers[key] === 'number') {
            let currentModifierValue = modifiers[key] as number;
            if (operation === 'multiply') {
              currentModifierValue *= (1 + value);
            } else if (operation === 'add') {
              currentModifierValue += value;
            } else if (operation === 'set') {
              currentModifierValue = value;
            }
            modifiers[key] = currentModifierValue;
          } else {
            console.warn(`Attempted to apply numeric operation to non-numeric, non-existent, or non-projectAppealModifier perk modifier key: ${key}`);
          }
        } else {
          console.warn(`Unhandled perk effect key, value type, or target not found in aggregatedPerkModifiers: ${key}`, effect);
        }
      });
    });

    console.log("Applied perk effects:", modifiedGameState.aggregatedPerkModifiers);
    return modifiedGameState;
  },
};

const checkCondition = (condition: PerkUnlockCondition, gameState: GameState): boolean => {
  const { playerData, reputation, completedProjects, ownedEquipment } = gameState;

  switch (condition.type) {
    case 'playerLevel':
      return playerData.level >= condition.value;
    case 'studioReputation':
      return reputation >= condition.value;
    case 'completedProjects':
      return (completedProjects?.length || 0) >= condition.value;
    case 'projectsInGenre':
      if (!condition.genre) return false;
      return (completedProjects?.filter(p => p.genre === condition.genre).length || 0) >= condition.value;
    case 'staffSkillSum':
      return true;
    case 'specificEquipmentOwned':
      if (!condition.equipmentId) return false;
      return ownedEquipment.some(eq => eq.id === condition.equipmentId);
    case 'specificPerkUnlocked':
      if (!condition.perkId) return false;
      return gameState.ownedUpgrades.includes(condition.perkId);
    case 'moneyEarned':
      return true;
    case 'chartSuccesses':
      return true;
    default:
      return false;
  }
};
