import { EquipmentMod } from '@/types/game';

// All mods are in-house proprietary original designs — no external art source needed.
// Art = CSS/SVG faceplate variant + iconOverride; physical sprite stays on the
// base equipment entry in equipmentArt.ts. Research costs scale with tier.

export const availableMods: EquipmentMod[] = [
  {
    id: 'urei1176_rev_a',
    name: 'UREI 1176 "Rev A / Blue Stripe" Mod',
    description:
      'Modifies the UREI 1176 to the aggressive "Blue Stripe" characteristics, known for faster attack and unique color.',
    modifiesEquipmentId: 'urei_1176_compressor',
    statChanges: {
      speedBonus: 5,
      creativityBonus: 3,
      technicalBonus: 2,
    },
    nameSuffix: '(Rev A)',
    researchRequirements: {
      engineerSkill: 'Electronics',
      engineerSkillLevel: 3,
      researchTime: 10,
      cost: 500,
    },
  },
  {
    id: 'shurely_sm58_capsule_swap',
    name: 'Shurely Capsule Swap (Beta-58 Windscreen)',
    description:
      'Swaps the ball grille for a tighter supercardioid capsule. Cuts bleed on loud stages; small Rock/Hip-hop lift.',
    modifiesEquipmentId: 'shurely_serious_mic',
    statChanges: {
      qualityBonus: 4,
      technicalBonus: 4,
      genreBonus: { Rock: 1 },
    },
    nameSuffix: '(Beta Capsule)',
    iconOverride: '🎤',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 1, researchTime: 4, cost: 150 },
  },
  {
    id: 'condenser_tube_stage',
    name: 'Condenser Tube Output Stage',
    description:
      'Retrofits the FET output with a starved-plate tube stage. Adds air to vocals and acoustic strings.',
    modifiesEquipmentId: 'condenser_mic',
    statChanges: {
      qualityBonus: 6,
      creativityBonus: 4,
      genreBonus: { Acoustic: 1, Pop: 1 },
    },
    nameSuffix: '(Tube Stage)',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 2, researchTime: 7, cost: 350 },
  },
  {
    id: 'ribbon_active_boost',
    name: 'Ribbon Active-Phantom Boost',
    description:
      'Adds an active phantom-powered buffer to the ribbon motor. Tames noise floor without losing the vintage top-end roll-off.',
    modifiesEquipmentId: 'ribbon_vintage_mic',
    statChanges: { qualityBonus: 5, technicalBonus: 5, speedBonus: 2 },
    nameSuffix: '(Active)',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 2, researchTime: 6, cost: 300 },
  },
  {
    id: 'telefunken_spring_tank',
    name: 'Telefunken Spring-Tank Extension',
    description:
      'Bolts a triple-spring tank onto the plate send. Drippy, wobbly tails that songwriters either love or fear.',
    modifiesEquipmentId: 'telefunken_around',
    statChanges: { creativityBonus: 8, qualityBonus: 3, genreBonus: { Rock: 1 } },
    nameSuffix: '(+Springs)',
    iconOverride: '🎛️',
    researchRequirements: { engineerSkill: 'Acoustics', engineerSkillLevel: 2, researchTime: 6, cost: 320 },
  },
  {
    id: 'fairychild_sidechain_filter',
    name: 'Fairychild Sidechain Hi-Pass Filter',
    description:
      'Adds a sidechain filter so the compressor stops ducking on every kick hit. Glue without the pump.',
    modifiesEquipmentId: 'fairychild_comp',
    statChanges: { technicalBonus: 6, qualityBonus: 4, speedBonus: 2 },
    nameSuffix: '(SC-HPF)',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 3, researchTime: 8, cost: 550 },
  },
  {
    id: 'ssl_black_eq_card',
    name: 'SSL Black-EQ Recall Card',
    description:
      'Drops in the rarer black-knob EQ card with stepped recall. Punchier mids, faster mix decisions.',
    modifiesEquipmentId: 'ssl_console_strip',
    statChanges: { technicalBonus: 7, speedBonus: 5, qualityBonus: 4 },
    nameSuffix: '(Black EQ)',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 4, researchTime: 12, cost: 900 },
  },
  {
    id: 'moog_filter_drive',
    name: 'Moog Filter-Drive Overload Kit',
    description:
      'Lets the ladder filter overdrive into creamy saturation. Electronic basslines gain teeth.',
    modifiesEquipmentId: 'moog_or_less',
    statChanges: { creativityBonus: 8, genreBonus: { Electronic: 2 }, technicalBonus: 2 },
    nameSuffix: '(Driven)',
    iconOverride: '🎹',
    researchRequirements: { engineerSkill: 'Sound Design', engineerSkillLevel: 3, researchTime: 9, cost: 600 },
  },
  {
    id: 'fender_hot_rail',
    name: 'Fender Hot-Rail Bridge Pickup',
    description:
      'Replaces the bridge single-coil with a hot rail humbucker. More sustain, more feedback (the good kind).',
    modifiesEquipmentId: 'fender_bender',
    statChanges: { creativityBonus: 5, genreBonus: { Rock: 2 }, qualityBonus: 2 },
    nameSuffix: '(Hot Rail)',
    researchRequirements: { engineerSkill: 'Luthiery', engineerSkillLevel: 1, researchTime: 5, cost: 220 },
  },
  {
    id: '808_sub_drop_board',
    name: '808 Sub-Drop Extension Board',
    description:
      'Adds a 30-second long-decay sub oscillator to the kick channel. Windows rattle in a three-block radius.',
    modifiesEquipmentId: 'drum_machine_808',
    statChanges: { genreBonus: { 'Hip-hop': 2, Electronic: 1 }, creativityBonus: 5 },
    nameSuffix: '(Sub Drop)',
    iconOverride: '🥁',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 2, researchTime: 7, cost: 400 },
  },
  {
    id: 'ns10_tissue_classic',
    name: 'NS-No-Way Tissue-Mod (Classic Mix Trick)',
    description:
      'The legendary tissue-over-tweeter mod. Tames the harshness so mixes translate everywhere.',
    modifiesEquipmentId: 'yamaha_ns_no_way',
    statChanges: { qualityBonus: 6, technicalBonus: 4 },
    nameSuffix: '(Tissued)',
    researchRequirements: { engineerSkill: 'Acoustics', engineerSkillLevel: 1, researchTime: 3, cost: 120 },
  },
  {
    id: 'scarlett_clock_upgrade',
    name: 'Scarlett Clock + PSU Upgrade',
    description:
      'Aftermarket master clock and linear PSU for the budget interface. Stereo image tightens up noticeably.',
    modifiesEquipmentId: 'audio_interface',
    statChanges: { qualityBonus: 5, speedBonus: 3, technicalBonus: 3 },
    nameSuffix: '(Reclocked)',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 2, researchTime: 6, cost: 280 },
  },
  {
    id: 'api_opamp_swap',
    name: 'API Op-Amp Swap (Red Dot 2520)',
    description:
      'Drops discrete red-dot op-amps into the EQ cards. Punchier mids, faster transients, louder attitude.',
    modifiesEquipmentId: 'api_the_wiser',
    statChanges: { qualityBonus: 5, technicalBonus: 6 },
    nameSuffix: '(Red Dot)',
    iconOverride: '⚙️',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 2, researchTime: 6, cost: 300 },
  },
  {
    id: 'modular_quantizer_brain',
    name: 'Quantizer Brain for the Eurorack Rig',
    description:
      'A quad quantizer that forces the spaghetti patching into key. Happy accidents, now in tune.',
    modifiesEquipmentId: 'modular_synth_rig',
    statChanges: { creativityBonus: 8, technicalBonus: 4, genreBonus: { Electronic: 1 } },
    nameSuffix: '(Quantized)',
    researchRequirements: { engineerSkill: 'Electronics', engineerSkillLevel: 3, researchTime: 8, cost: 450 },
  },
];
