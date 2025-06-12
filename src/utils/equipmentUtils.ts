import { Equipment, EquipmentMod } from '@/types/game';
import { availableMods } from '@/data/equipmentMods';

/**
 * Calculates the effective stats and properties of a piece of equipment
 * after applying a specific modification.
 *
 * @param baseEquipment - The original equipment object.
 * @returns A new equipment object with modified stats, name, and icon if a mod is applied.
 *          Returns the original equipment if no mod is applied or found.
 */
export function getModifiedEquipment(baseEquipment: Equipment): Equipment {
  if (!baseEquipment.appliedModId) {
    return baseEquipment;
  }

  const mod = availableMods.find(m => m.id === baseEquipment.appliedModId);
  if (!mod) {
    console.warn(`Mod with ID ${baseEquipment.appliedModId} not found. Returning base equipment.`);
    return baseEquipment;
  }

  // Start with a copy of the base equipment's bonuses
  const modifiedBonuses = { ...baseEquipment.bonuses };

  // Apply stat changes from the mod
  if (mod.statChanges) {
    for (const key in mod.statChanges) {
      const bonusKey = key as keyof Equipment['bonuses'];
      const changeValue = mod.statChanges[bonusKey];

      if (typeof changeValue === 'number') {
        if (bonusKey === 'genreBonus') {
          // This case should ideally not happen if genreBonus changes are objects
          console.warn(`Direct number change for genreBonus in mod ${mod.id} is not standard. Ignoring.`);
        } else {
          // Additive change for simple numeric bonuses
          modifiedBonuses[bonusKey] = (modifiedBonuses[bonusKey] || 0) + changeValue;
        }
      } else if (typeof changeValue === 'object' && bonusKey === 'genreBonus' && changeValue !== null) {
        // Merge genreBonus objects
        const baseGenreBonuses = modifiedBonuses.genreBonus || {};
        const modGenreBonuses = changeValue as Record<string, number>;
        const mergedGenreBonuses: Record<string, number> = { ...baseGenreBonuses };
        for (const genreKey in modGenreBonuses) {
          mergedGenreBonuses[genreKey] = (mergedGenreBonuses[genreKey] || 0) + modGenreBonuses[genreKey];
        }
        modifiedBonuses.genreBonus = mergedGenreBonuses;
      }
      // Note: The plan mentioned functional changes like `(currentSpeedBonus = 0) => currentSpeedBonus + 5`.
      // For simplicity and data-driven approach, mods define direct additive values or new genre bonus objects.
      // If functional changes are needed, this logic would need to be more complex to execute them.
    }
  }

  return {
    ...baseEquipment,
    name: `${baseEquipment.name} ${mod.nameSuffix || ''}`.trim(),
    icon: mod.iconOverride || baseEquipment.icon,
    bonuses: modifiedBonuses,
    // Retain other baseEquipment properties like id, category, price, description, skillRequirement, condition
  };
}
