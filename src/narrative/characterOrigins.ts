import { PlayerAttributes, PlayerData } from '@/types/game';
import { ProducerBackgroundId, ProducerOrigin, PlaystyleFocus } from '@/types/character';

export const PRODUCER_ORIGINS: readonly ProducerOrigin[] = [
  {
    id: 'bedroom-beatmaker',
    name: 'The Bedroom Beatmaker',
    tagline: 'Scrappy MPC chops and nocturnal groove intuition',
    lore: 'Cut your teeth crafting beats on a cracked laptop with second-hand studio monitors propped on milk crates. You know how to make heavy 808s and punchy samples out of thin air, with zero patience for gatekeeping.',
    primaryPlaystyle: 'underground',
    startingAttributeBonus: {
      creativeIntuition: 3,
      focusMastery: 1,
    },
    passivePerk: {
      name: 'Sample Alchemy',
      description: '+8 Quality on Hip Hop, Lo-Fi, Electronic and Trap sessions. +20% Sound Design and Sample Warping XP.',
      qualityBonus: 8,
      xpMultiplier: 1.2,
      xpSkills: ['soundDesign', 'sampleWarping'],
      freeGigRefresh: true,
      specialTrait: 'Chasing new gigs costs nothing (the cooldown still applies).',
    },
    startingGearSuggestion: 'MPC Drum Sampler & Vintage Casio Keyboard',
    signatureGenres: ['Hip Hop', 'Lo-Fi', 'Electronic', 'Trap'],
    preferredTheme: 'neon-digital',
  },
  {
    id: 'tape-purist',
    name: 'The Analog Tape Purist',
    tagline: 'Guardian of 2-inch tape, tube preamps, and live acoustic room magic',
    lore: 'Spent three years winding reel-to-reel tape and demagnetizing record heads in damp basements. You believe music died the day digital waveforms replaced spinning oxide ribbons, but your organic vocal clarity is undisputed.',
    primaryPlaystyle: 'purist',
    startingAttributeBonus: {
      technicalAptitude: 3,
      creativeIntuition: 1,
    },
    passivePerk: {
      name: 'Harmonic Saturation',
      description: '+10 Quality on Acoustic, Rock, Folk, Blues and Jazz sessions.',
      qualityBonus: 10,
      rankARepBonus: 0.15,
      specialTrait: 'A-rank or better sessions earn +15% reputation.',
    },
    startingGearSuggestion: 'Reel-to-Reel Tape Machine & Ribbon Microphone',
    signatureGenres: ['Rock', 'Acoustic', 'Folk', 'Blues', 'Jazz'],
    preferredTheme: 'warm-analog',
  },
  {
    id: 'hit-factory-mercenary',
    name: 'The Hit Factory Mercenary',
    tagline: 'Viral hook radar and ruthless commercial efficiency',
    lore: 'A former junior A&R scout who realized the money wasn’t in finding talent, but in mass-producing earworms. You can arrange a four-chord radio anthem in your sleep and have every major playlist curator on speed dial.',
    primaryPlaystyle: 'hit-maker',
    startingAttributeBonus: {
      businessAcumen: 3,
      focusMastery: 1,
    },
    passivePerk: {
      name: 'Chart Penetration',
      description: '+25% payout on Pop, Dance, RnB and Synthpop sessions.',
      payoutMultiplier: 1.25,
      hotMarketPayoutBonus: 0.08,
      specialTrait: 'Genres in a hot market pay an extra +8%.',
    },
    startingGearSuggestion: 'Precision DSP Workstation & High-End Nearfield Monitors',
    signatureGenres: ['Pop', 'Dance', 'Commercial RnB', 'Synthpop'],
    preferredTheme: 'velvet-lounge',
  },
  {
    id: 'sonic-alchemist',
    name: 'The Sonic Alchemist',
    tagline: 'Soldering iron wizard, circuit bender, and acoustic architect',
    lore: 'Dropped out of electrical engineering to hot-rod vintage mixing boards and wind custom guitar pickups. Your patchbays look like bird nests, but you coax frequencies out of equipment that manufacturers said were impossible.',
    primaryPlaystyle: 'sound-lab',
    startingAttributeBonus: {
      technicalAptitude: 2,
      creativeIntuition: 2,
    },
    passivePerk: {
      name: 'Component Overclock',
      description: '-35% daily equipment upkeep.',
      upkeepDiscount: 0.35,
      synergyMultiplier: 1.25,
      specialTrait: 'Studio synergy quality bonuses are 25% stronger.',
    },
    startingGearSuggestion: 'Boutique Tube Equalizer & Modular Patch Synth',
    signatureGenres: ['Synthwave', 'Ambient', 'Experimental Rock', 'Techno'],
    preferredTheme: 'modular-rack',
  },
  {
    id: 'charismatic-svengali',
    name: 'The Charismatic Svengali',
    tagline: 'Psychologist in the control room; turns fragile divas into icons',
    lore: 'Part therapist, part diplomat, part creative director. You might not know the exact resistor value in a compressor, but you know exactly what words will make a terrified singer deliver a Grammy-winning breakdown on Take 3.',
    primaryPlaystyle: 'purist',
    startingAttributeBonus: {
      creativeIntuition: 2,
      businessAcumen: 2,
    },
    passivePerk: {
      name: 'Vocal Spell',
      description: '+50% client relationship XP, so regulars reach Loyal much faster.',
      relationshipXpMultiplier: 1.5,
      repeatClientPremium: 1.18,
      specialTrait: 'Returning clients pay an 18% loyalty premium (instead of 10%).',
    },
    startingGearSuggestion: 'Gold-Plated Condenser Microphone & Vintage Leather Studio Couch',
    signatureGenres: ['Soul', 'RnB', 'Indie Rock', 'Ballads'],
    preferredTheme: 'velvet-lounge',
  },
] as const;

/** Return all available producer origins */
export const getProducerOrigins = (): readonly ProducerOrigin[] => PRODUCER_ORIGINS;

/** Return a specific producer origin by ID */
export const getProducerOrigin = (id: ProducerBackgroundId): ProducerOrigin => {
  const origin = PRODUCER_ORIGINS.find(o => o.id === id);
  return origin ?? PRODUCER_ORIGINS[0];
};

/** Compute starting player attributes incorporating background bonuses */
export const applyOriginAttributes = (
  baseAttributes: PlayerAttributes,
  originId: ProducerBackgroundId
): PlayerAttributes => {
  const origin = getProducerOrigin(originId);
  const bonus = origin.startingAttributeBonus;

  return {
    focusMastery: baseAttributes.focusMastery + (bonus.focusMastery ?? 0),
    creativeIntuition: baseAttributes.creativeIntuition + (bonus.creativeIntuition ?? 0),
    technicalAptitude: baseAttributes.technicalAptitude + (bonus.technicalAptitude ?? 0),
    businessAcumen: baseAttributes.businessAcumen + (bonus.businessAcumen ?? 0),
  };
};

/** Playstyle mechanics configuration */
export const PLAYSTYLE_CONFIGS: Record<PlaystyleFocus, {
  label: string;
  tagline: string;
  focusBonusDescription: string;
  preferredAwardsWeight: number;
  marketTrendSensitivity: number;
  reputationDecayResistance: number;
}> = {
  purist: {
    label: 'Acoustic Purist',
    tagline: 'Chasing timeless analogue warmth and critical acclaim',
    focusBonusDescription: 'Earns extra Golden Reel prestige and artist loyalty; penalizes rushed sessions.',
    preferredAwardsWeight: 1.35,
    marketTrendSensitivity: 0.7,
    reputationDecayResistance: 1.2,
  },
  'hit-maker': {
    label: 'Hit Machine',
    tagline: 'Engineering chart-topping hooks and commercial royalties',
    focusBonusDescription: 'Boosts streaming payouts on trending genres and unlocks fast-turnaround sessions.',
    preferredAwardsWeight: 0.9,
    marketTrendSensitivity: 1.5,
    reputationDecayResistance: 0.8,
  },
  underground: {
    label: 'Underground Maverick',
    tagline: 'Championing subcultures, rebel genres, and cult fanbases',
    focusBonusDescription: 'Doubles word-of-mouth client referrals and immune to mainstream market slumps.',
    preferredAwardsWeight: 1.0,
    marketTrendSensitivity: 0.5,
    reputationDecayResistance: 1.5,
  },
  'sound-lab': {
    label: 'Sound Scientist',
    tagline: 'Pushing acoustic physics, custom circuits, and modular DSP',
    focusBonusDescription: 'Provides 30% cheaper gear maintenance and empowers custom studio synergy recipes.',
    preferredAwardsWeight: 1.1,
    marketTrendSensitivity: 1.0,
    reputationDecayResistance: 1.0,
  },
};
