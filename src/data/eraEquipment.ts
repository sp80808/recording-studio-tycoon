import { Equipment } from '@/types/game';

export interface EraAvailableEquipment extends Equipment {
  availableFrom: number; // Year when equipment becomes available
  availableUntil?: number; // Year when equipment becomes obsolete (optional)
  eraDescription?: string; // Era-specific description
  isVintage?: boolean; // If true, becomes more expensive over time
  historicalPrice?: number; // Original price (for vintage items)
}

export const availableEquipment: EraAvailableEquipment[] = [
  // === 1960s Era Equipment ===
  
  // Basic 1960s Microphones
  {
    id: 'basic_60s_mic',
    name: 'RCA Ribbon "Velvet Elvis"',
    category: 'microphone',
    price: 150,
    historicalPrice: 45,
    availableFrom: 1960,
    availableUntil: 1975,
    description: 'Smooth as The King himself, warm as Memphis in July',
    eraDescription: 'The go-to mic for crooners and the occasional rebel',
    bonuses: { qualityBonus: 5, genreBonus: { 'Rock': 1, 'Pop': 2 } },
    icon: '🎤',
    isVintage: true
  },
  {
    id: 'dynamic_60s_mic',
    name: 'Shure SM-Surely-You-Jest 57',
    category: 'microphone',
    price: 85,
    historicalPrice: 25,
    availableFrom: 1965,
    description: 'Indestructible as Keith Richards, sounds almost as good',
    eraDescription: 'Perfect for loud amps and louder personalities',
    bonuses: { qualityBonus: 8, genreBonus: { 'Rock': 3, 'Blues': 2 } },
    icon: '🎤',
    isVintage: true
  },

  // 1960s Recording Equipment
  {
    id: 'tape_machine_4track',
    name: 'Tascam "Track-or-Treat" 4-Track',
    category: 'recorder',
    price: 800,
    historicalPrice: 240,
    availableFrom: 1967,
    availableUntil: 1985,
    description: 'Four whole tracks! The Beatles only needed this much',
    eraDescription: 'Revolutionary multi-track recording for the masses',
    bonuses: { qualityBonus: 15, technicalBonus: 10, speedBonus: -5 },
    icon: '📼',
    isVintage: true
  },
  {
    id: 'mixing_board_60s',
    name: 'Neve "Never-Enough-Knobs" 1073',
    category: 'mixer',
    price: 2500,
    historicalPrice: 750,
    availableFrom: 1970,
    description: 'More knobs than NASA, sounds like heaven',
    eraDescription: 'The sound of classic rock was born on this board',
    bonuses: { qualityBonus: 30, technicalBonus: 20, genreBonus: { 'Rock': 4, 'Pop': 3 } },
    icon: '🎛️',
    skillRequirement: { skill: 'Rock', level: 3 },
    isVintage: true
  },

  // Basic Monitoring
  {
    id: 'basic_60s_speakers',
    name: 'Altec "All-Tech-No-Soul" 604E',
    category: 'monitor',
    price: 400,
    historicalPrice: 120,
    availableFrom: 1960,
    availableUntil: 1980,
    description: 'Big, bold, and occasionally accurate',
    eraDescription: 'The sound of classic studio monitoring',
    bonuses: { qualityBonus: 10, technicalBonus: 5 },
    icon: '🔊',
    isVintage: true
  },

  // === 1970s Era Equipment ===
  
  {
    id: 'moog_modular',
    name: 'Moog "Mod-ular-Disaster" System',
    category: 'instrument',
    price: 3500,
    historicalPrice: 1200,
    availableFrom: 1970,
    availableUntil: 1985,
    description: 'More cables than a telephone exchange, sounds like the future',
    eraDescription: 'Synthesized sounds that make people question reality',
    bonuses: { creativityBonus: 25, genreBonus: { 'Electronic': 5, 'Rock': 3, 'Pop': 2 } },
    icon: '🎹',
    skillRequirement: { skill: 'Electronic', level: 2 },
    isVintage: true
  },

  // === 1980s Era Equipment ===
  
  {
    id: 'drum_machine_808',
    name: 'Roland TR-"Ate-Oh-Ate"',
    category: 'instrument',
    price: 1200,
    historicalPrice: 400,
    availableFrom: 1980,
    description: 'The boom-bap that launched a thousand careers',
    eraDescription: 'Hip-hop\'s best friend and pop music\'s secret weapon',
    bonuses: { genreBonus: { 'Hip-Hop': 5, 'Pop': 3, 'Electronic': 4 }, speedBonus: 15 },
    icon: '🥁',
    skillRequirement: { skill: 'Hip-Hop', level: 1 },
    isVintage: true
  },
  {
    id: 'digital_delay',
    name: 'Lexicon "Lex-Icon" 224',
    category: 'outboard',
    price: 6000,
    historicalPrice: 2000,
    availableFrom: 1982,
    description: 'Digital reverb so good it makes Phil Collins cry',
    eraDescription: 'The sound of the 80s: gated, reverbed, and proud of it',
    bonuses: { qualityBonus: 25, genreBonus: { 'Pop': 4, 'Rock': 3, 'New Wave': 5 }, creativityBonus: 15 },
    icon: '⚙️',
    skillRequirement: { skill: 'Pop', level: 2 },
    isVintage: true
  },

  // === 1990s Era Equipment ===
  
  {
    id: 'sampler_mpc',
    name: 'Akai MPC "Most-Precious-Child"',
    category: 'instrument',
    price: 2500,
    historicalPrice: 1000,
    availableFrom: 1990,
    description: 'Turns any sound into a beat, any beat into art',
    eraDescription: 'Hip-hop production revolutionized with 16 pads of power',
    bonuses: { genreBonus: { 'Hip-Hop': 6, 'R&B': 4, 'Electronic': 3 }, creativityBonus: 20, speedBonus: 10 },
    icon: '🎛️',
    skillRequirement: { skill: 'Hip-Hop', level: 2 },
    isVintage: true
  },
  {
    id: 'daw_protools',
    name: 'Pro Tools "Amateur-Drools"',
    category: 'software',
    price: 8000,
    historicalPrice: 3000,
    availableFrom: 1995,
    description: 'Digital audio workstation that makes editing magical and budgets disappear',
    eraDescription: 'The industry standard that changed everything',
    bonuses: { speedBonus: 30, technicalBonus: 25, qualityBonus: 20 },
    icon: '💻',
    skillRequirement: { skill: 'Pop', level: 3 }
  },

  // === 2000s Era Equipment ===
  
  {
    id: 'autotune_original',
    name: 'Auto-Tune "Robotic-Crooner"',
    category: 'software',
    price: 400,
    availableFrom: 2000,
    description: 'Makes everyone sound like a cyborg, for better or worse',
    eraDescription: 'The plugin that divided the music world in half',
    bonuses: { genreBonus: { 'Pop': 4, 'Hip-Hop': 3, 'R&B': 5 }, speedBonus: 20, creativityBonus: -5 },
    icon: '🤖',
    skillRequirement: { skill: 'Pop', level: 1 }
  },
  {
    id: 'midi_controller',
    name: 'M-Audio "M-Eh-dio" Keystation',
    category: 'instrument',
    price: 200,
    availableFrom: 2002,
    description: 'More keys than a janitor, less soul than expected',
    eraDescription: 'MIDI controller for the digital music revolution',
    bonuses: { speedBonus: 15, genreBonus: { 'Electronic': 2, 'Pop': 2 } },
    icon: '🎹'
  },

  // === Modern Era Equipment (2010+) ===
  
  // Basic modern equipment (available from start in modern era)
  {
    id: 'basic_mic',
    name: 'Audio-Technica "Audio-Pathetic-a" AT2020',
    category: 'microphone',
    price: 100,
    availableFrom: 2010,
    description: 'Entry-level condenser that punches above its weight class',
    bonuses: { qualityBonus: 5 },
    icon: '🎤'
  },
  {
    id: 'basic_monitors',
    name: 'KRK "Kinda-Reliable-Kinda" Rokits',
    category: 'monitor',
    price: 300,
    availableFrom: 2010,
    description: 'Yellow cones that make everything sound... yellow',
    bonuses: { qualityBonus: 10 },
    icon: '🔊'
  },
  {
    id: 'basic_interface',
    name: 'Focusrite "Focus-Wrong" Scarlett Solo',
    category: 'interface',
    price: 120,
    availableFrom: 2012,
    description: 'Red hot interface for red hot takes',
    bonuses: { qualityBonus: 8, speedBonus: 5 },
    icon: '🔌'
  },

  // Premium modern equipment
  {
    id: 'neumann_u87',
    name: 'Neumann U87 "Uber-Expensive-Mic"',
    category: 'microphone',
    price: 3500,
    availableFrom: 2015,
    description: 'The microphone that costs more than your car and sounds better than your voice',
    bonuses: { qualityBonus: 40, genreBonus: { 'Pop': 5, 'R&B': 5, 'Jazz': 4 }, creativityBonus: 15 },
    icon: '🎤',
    skillRequirement: { skill: 'Pop', level: 4 }
  },
  {
    id: 'genelec_monitors',
    name: 'Genelec "Generic-Lech" 8040A',
    category: 'monitor',
    price: 2000,
    availableFrom: 2018,
    description: 'Finnish precision engineering that reveals every flaw in your mix',
    bonuses: { qualityBonus: 35, technicalBonus: 25 },
    icon: '🔊',
    skillRequirement: { skill: 'Electronic', level: 3 }
  },
  {
    id: 'modern_daw',
    name: 'Ableton Live "Able-to-Confuse"',
    category: 'software',
    price: 750,
    availableFrom: 2020,
    description: 'DAW that makes electronic music creation feel like playing Tetris',
    bonuses: { speedBonus: 25, genreBonus: { 'Electronic': 4, 'Hip-Hop': 3, 'Pop': 2 }, creativityBonus: 20 },
    icon: '💻',
    skillRequirement: { skill: 'Electronic', level: 2 }
  },

  // Streaming era equipment
  {
    id: 'podcast_setup',
    name: 'PodMic "Pod-People-Approved"',
    category: 'microphone',
    price: 250,
    availableFrom: 2020,
    description: 'Because everyone has a podcast now, apparently',
    bonuses: { genreBonus: { 'Spoken Word': 6, 'Pop': 1 }, speedBonus: 10 },
    icon: '🎙️'
  },
  {
    id: 'ai_mastering',
    name: 'LANDR "Land-of-Confusion" AI Mastering',
    category: 'software',
    price: 200,
    availableFrom: 2022,
    description: 'AI that masters your tracks while slowly planning world domination',
    bonuses: { speedBonus: 50, qualityBonus: 15, creativityBonus: -10 },
    icon: '🤖'
  }
];

export const equipmentCategories = {
  all: 'All Equipment',
  microphone: 'Microphones',
  monitor: 'Studio Monitoring',
  interface: 'Audio Interfaces',
  outboard: 'Outboard Gear',
  instrument: 'Instruments',
  software: 'Software & Plugins',
  recorder: 'Recording Equipment',
  mixer: 'Mixing Consoles'
};

// Helper function to get equipment available for a specific era
export const getAvailableEquipmentForYear = (year: number): EraAvailableEquipment[] => {
  return availableEquipment.filter(equipment => {
    const availableFrom = equipment.availableFrom <= year;
    const notObsolete = equipment.availableUntil ? equipment.availableUntil >= year : true;
    return availableFrom && notObsolete;
  });
};

// Helper function to calculate era-adjusted pricing
export const getEraAdjustedPrice = (equipment: EraAvailableEquipment, currentYear: number, eraMultiplier: number): number => {
  let basePrice = equipment.price;
  
  // If it's vintage equipment and we're in a later era, make it more expensive
  if (equipment.isVintage && currentYear > (equipment.availableUntil || equipment.availableFrom + 20)) {
    const vintageMultiplier = Math.min(3.0, 1 + ((currentYear - (equipment.availableUntil || equipment.availableFrom + 20)) / 20));
    basePrice *= vintageMultiplier;
  }
  
  return Math.round(basePrice * eraMultiplier);
};
