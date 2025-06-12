import { EquipmentMod, Equipment } from '@/types/game';

export const availableMods: EquipmentMod[] = [
  {
    id: 'urei1176_rev_a',
    name: 'UREI 1176 "Rev A / Blue Stripe" Mod',
    description: 'Modifies the UREI 1176 to the aggressive "Blue Stripe" characteristics, known for faster attack and unique color.',
    modifiesEquipmentId: 'urei_1176_compressor', // Assuming this will be the ID of the base UREI 1176
    statChanges: { 
      // These represent additive bonuses. The actual calculation logic will be in a helper function.
      speedBonus: 5,
      creativityBonus: 3,
      technicalBonus: 2,
      // Example of how a genre bonus could be affected (if applicable):
      // genreBonus: { Pop: 1 } // Adds +1 to Pop, or overwrites if Pop bonus already exists from base
    },
    nameSuffix: '(Rev A)', // To append to the equipment name
    // iconOverride: '🎛️✨', // Optional: if the emoji should change
    researchRequirements: {
      engineerSkill: 'Electronics', // Placeholder skill, actual skill names might differ
      engineerSkillLevel: 3,
      researchTime: 10, // Example: 10 game days
      cost: 500,
    }
  }
  // Future mods can be added here
];
