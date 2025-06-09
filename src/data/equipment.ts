
import { GameState } from '@/types/game';

export interface EraAvailableEquipment {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  bonuses: {
    qualityBonus?: number;
    creativityBonus?: number;
    technicalBonus?: number;
    speedBonus?: number;
    genreBonus?: Record<string, number>;
  };
  icon: string;
  availableFrom: string;
  skillRequirement?: Record<string, number>;
}

export const equipment: EraAvailableEquipment[] = [
  // Microphones
  {
    id: 'sm57',
    name: 'Shure SM57',
    category: 'microphone',
    price: 100,
    description: 'Industry standard dynamic microphone',
    bonuses: {
      qualityBonus: 5
    },
    icon: '🎤',
    availableFrom: '1960s'
  },
  {
    id: 'u87',
    name: 'Neumann U87',
    category: 'microphone',
    price: 3200,
    description: 'Premium large-diaphragm condenser microphone',
    bonuses: {
      genreBonus: { Rock: 15, Acoustic: 20 },
      technicalBonus: 10
    },
    icon: '🎙️',
    skillRequirement: {
      recording: 15
    },
    availableFrom: '1960s'
  },
  {
    id: 'c414',
    name: 'AKG C414',
    category: 'microphone',
    price: 1400,
    description: 'Versatile large-diaphragm condenser microphone',
    bonuses: {
      genreBonus: { Acoustic: 15, Pop: 10 },
      qualityBonus: 8
    },
    icon: '🎤',
    availableFrom: '1970s'
  },
  {
    id: 'sm58',
    name: 'Shure SM58',
    category: 'microphone',
    price: 100,
    description: 'Legendary vocal microphone',
    bonuses: {
      genreBonus: { Rock: 10, 'Hip-hop': 8 },
      qualityBonus: 6
    },
    icon: '🎤',
    availableFrom: '1960s'
  },
  {
    id: 'tube-u47',
    name: 'Neumann U47 Tube',
    category: 'microphone',
    price: 8000,
    description: 'Vintage tube condenser microphone',
    bonuses: {
      genreBonus: { Acoustic: 25, Pop: 15 },
      qualityBonus: 15,
      creativityBonus: 10
    },
    icon: '🎙️',
    skillRequirement: {
      recording: 25
    },
    availableFrom: '1940s'
  },
  {
    id: 'ribbon-mic',
    name: 'Coles 4038 Ribbon',
    category: 'microphone',
    price: 4500,
    description: 'Classic ribbon microphone',
    bonuses: {
      genreBonus: { Acoustic: 20, Rock: 12 },
      creativityBonus: 12,
      qualityBonus: 10
    },
    icon: '🎙️',
    skillRequirement: {
      recording: 20
    },
    availableFrom: '1950s'
  },

  // Outboard Gear
  {
    id: 'la2a',
    name: 'Teletronix LA-2A',
    category: 'outboard',
    price: 4000,
    description: 'Legendary tube compressor',
    bonuses: {
      creativityBonus: 15,
      qualityBonus: 12,
      genreBonus: { Acoustic: 18, Electronic: 8 }
    },
    icon: '📻',
    skillRequirement: {
      mixing: 18
    },
    availableFrom: '1960s'
  },
  {
    id: '1176',
    name: 'UREI 1176',
    category: 'outboard',
    price: 2500,
    description: 'Classic FET compressor',
    bonuses: {
      technicalBonus: 12,
      qualityBonus: 10,
      speedBonus: 5
    },
    icon: '📻',
    skillRequirement: {
      mixing: 15
    },
    availableFrom: '1960s'
  },
  {
    id: 'ssl-comp',
    name: 'SSL Bus Compressor',
    category: 'outboard',
    price: 3500,
    description: 'Punchy bus compressor',
    bonuses: {
      technicalBonus: 15,
      qualityBonus: 12,
      genreBonus: { Pop: 15, Rock: 12 }
    },
    icon: '📻',
    skillRequirement: {
      mixing: 20
    },
    availableFrom: '1980s'
  },
  {
    id: 'dbx160x',
    name: 'dbx 160X',
    category: 'outboard',
    price: 400,
    description: 'Affordable compressor/limiter',
    bonuses: {
      qualityBonus: 6,
      technicalBonus: 4
    },
    icon: '📻',
    availableFrom: '1980s'
  },
  {
    id: 'neve-1073',
    name: 'Neve 1073',
    category: 'outboard',
    price: 2800,
    description: 'Iconic preamp/EQ',
    bonuses: {
      technicalBonus: 18,
      qualityBonus: 15,
      speedBonus: 8,
      genreBonus: { Pop: 12, Rock: 15 }
    },
    icon: '🎛️',
    skillRequirement: {
      mixing: 22
    },
    availableFrom: '1970s'
  },

  // Instruments
  {
    id: 'moog-sub37',
    name: 'Moog Sub 37',
    category: 'instrument',
    price: 1500,
    description: 'Analog synthesizer',
    bonuses: {
      genreBonus: { Electronic: 20, Pop: 12 },
      creativityBonus: 15
    },
    icon: '🎹',
    skillRequirement: {
      arranging: 12
    },
    availableFrom: '2010s'
  },
  {
    id: 'strat',
    name: 'Fender Stratocaster',
    category: 'instrument',
    price: 1200,
    description: 'Classic electric guitar',
    bonuses: {
      genreBonus: { Rock: 15, Acoustic: 8 },
      creativityBonus: 10
    },
    icon: '🎸',
    skillRequirement: {
      arranging: 8
    },
    availableFrom: '1950s'
  },
  {
    id: 'dx7',
    name: 'Yamaha DX7',
    category: 'instrument',
    price: 2000,
    description: 'Digital FM synthesizer',
    bonuses: {
      genreBonus: { Electronic: 18, Pop: 15 },
      creativityBonus: 12
    },
    icon: '🎹',
    availableFrom: '1980s'
  },
  {
    id: 'les-paul',
    name: 'Gibson Les Paul',
    category: 'instrument',
    price: 2500,
    description: 'Premium electric guitar',
    bonuses: {
      genreBonus: { Rock: 18, Acoustic: 10 },
      creativityBonus: 12
    },
    icon: '🎸',
    availableFrom: '1950s'
  },
  {
    id: 'mpc2000xl',
    name: 'Akai MPC2000XL',
    category: 'instrument',
    price: 1800,
    description: 'Hip-hop production sampler',
    bonuses: {
      genreBonus: { 'Hip-hop': 25, Electronic: 15 },
      creativityBonus: 18,
      technicalBonus: 8
    },
    icon: '🥁',
    skillRequirement: {
      programming: 15
    },
    availableFrom: '1990s'
  },

  // Software
  {
    id: 'protools',
    name: 'Pro Tools',
    category: 'software',
    price: 600,
    description: 'Industry standard DAW',
    bonuses: {
      speedBonus: 15,
      technicalBonus: 10,
      qualityBonus: 8
    },
    icon: '💻',
    availableFrom: '1990s'
  },
  {
    id: 'ableton',
    name: 'Ableton Live',
    category: 'software',
    price: 450,
    description: 'Creative music software',
    bonuses: {
      creativityBonus: 18,
      speedBonus: 12,
      genreBonus: { Electronic: 20 }
    },
    icon: '💻',
    availableFrom: '2000s'
  },
  {
    id: 'logic',
    name: 'Logic Pro',
    category: 'software',
    price: 200,
    description: 'Complete music production suite',
    bonuses: {
      creativityBonus: 15,
      speedBonus: 10,
      genreBonus: { Electronic: 12, 'Hip-hop': 10 }
    },
    icon: '💻',
    skillRequirement: {
      programming: 8
    },
    availableFrom: '1990s'
  },
  {
    id: 'autotune',
    name: 'Auto-Tune',
    category: 'software',
    price: 400,
    description: 'Pitch correction software',
    bonuses: {
      technicalBonus: 12,
      genreBonus: { Pop: 15, 'Hip-hop': 20 }
    },
    icon: '🎵',
    skillRequirement: {
      mixing: 10
    },
    availableFrom: '1990s'
  },

  // Monitors
  {
    id: 'ns10',
    name: 'Yamaha NS-10M',
    category: 'monitor',
    price: 500,
    description: 'Industry reference monitors',
    bonuses: {
      qualityBonus: 10
    },
    icon: '🔊',
    availableFrom: '1970s'
  },
  {
    id: 'genelec',
    name: 'Genelec 1031A',
    category: 'monitor',
    price: 1500,
    description: 'High-end studio monitors',
    bonuses: {
      qualityBonus: 15,
      technicalBonus: 8
    },
    icon: '🔊',
    skillRequirement: {
      mixing: 12
    },
    availableFrom: '1980s'
  }
];
