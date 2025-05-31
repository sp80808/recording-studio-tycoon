
import { Equipment } from '@/types/game';

export const availableEquipment: Equipment[] = [
  // Microphones
  {
    id: 'basic_mic',
    name: 'Basic USB Mic',
    category: 'microphone',
    price: 0,
    description: 'Standard starter microphone that came with your first audio interface',
    bonuses: { qualityBonus: 0 },
    icon: '🎤'
  },
  {
    id: 'shurely_serious_mic',
    name: 'Shurely You Can\'t Be Serious Mic',
    category: 'microphone',
    price: 280,
    description: 'Perfect for loud sources and denying the undeniable. Modest boost to Rock & Acoustic recording quality.',
    bonuses: { genreBonus: { Rock: 2, Acoustic: 1 }, technicalBonus: 5 },
    icon: '🎤',
    skillRequirement: { skill: 'Rock', level: 1 }
  },
  {
    id: 'condenser_mic',
    name: 'Professional Condenser Mic',
    category: 'microphone',
    price: 450,
    description: 'High-quality condenser microphone perfect for vocals and acoustic instruments',
    bonuses: { genreBonus: { Acoustic: 2, Pop: 1 }, qualityBonus: 10 },
    icon: '🎤'
  },
  {
    id: 'dynamic_mic',
    name: 'Dynamic Recording Mic',
    category: 'microphone',
    price: 320,
    description: 'Robust dynamic microphone ideal for rock and live recordings',
    bonuses: { genreBonus: { Rock: 2, 'Hip-hop': 1 }, qualityBonus: 8 },
    icon: '🎤'
  },
  {
    id: 'neumann_u_wish',
    name: 'Neumann U-Wish-U-Had-One U80-not-7',
    category: 'microphone',
    price: 1500,
    description: 'Captures every nuance, including the singer\'s breakfast. Significant boost to Vocal Recording Quality & Acoustic instrument clarity.',
    bonuses: { genreBonus: { Acoustic: 4, Pop: 3 }, qualityBonus: 25, creativityBonus: 10 },
    icon: '🎤',
    skillRequirement: { skill: 'Acoustic', level: 4 }
  },

  // Outboard Gear
  {
    id: 'telefunken_around',
    name: 'Telefunken Around Reverb Unit',
    category: 'outboard',
    price: 950,
    description: 'Spacious, warm, and occasionally wanders off key. Adds character and creativity during mixing.',
    bonuses: { creativityBonus: 20, qualityBonus: 15, genreBonus: { Acoustic: 2, Electronic: 1 } },
    icon: '⚙️',
    skillRequirement: { skill: 'Acoustic', level: 2 }
  },
  {
    id: 'api_the_wiser',
    name: 'API The Wiser EQ',
    category: 'outboard',
    price: 750,
    description: 'Makes your tracks sit up and pay attention. Boosts clarity and punch during mixing.',
    bonuses: { technicalBonus: 18, qualityBonus: 12, speedBonus: 5 },
    icon: '⚙️',
    skillRequirement: { skill: 'Rock', level: 2 }
  },
  {
    id: 'fairychild_comp',
    name: 'The Fairychild Compressor',
    category: 'outboard',
    price: 1200,
    description: 'Magically glues tracks together. Improves overall cohesion and technical score.',
    bonuses: { technicalBonus: 25, qualityBonus: 20, genreBonus: { Pop: 2, Rock: 2 } },
    icon: '⚙️',
    skillRequirement: { skill: 'Pop', level: 3 }
  },
  {
    id: 'compressor',
    name: 'Hardware Compressor',
    category: 'outboard',
    price: 600,
    description: 'Analog compressor for that warm, professional sound',
    bonuses: { qualityBonus: 20, technicalBonus: 8 },
    icon: '⚙️'
  },

  // Instruments
  {
    id: 'moog_or_less',
    name: 'Moog-or-Less Analog Synth',
    category: 'instrument',
    price: 1800,
    description: 'Either sounds amazing or completely off. No in-between. Perfect for Electronic music adventures.',
    bonuses: { genreBonus: { Electronic: 5, Pop: 2 }, creativityBonus: 25 },
    icon: '🎹',
    skillRequirement: { skill: 'Electronic', level: 3 }
  },
  {
    id: 'fender_bender',
    name: 'Fender Bender Telecaster',
    category: 'instrument',
    price: 800,
    description: 'Slightly damaged but full of character. Great for Rock and Country vibes.',
    bonuses: { genreBonus: { Rock: 3, Acoustic: 2 }, creativityBonus: 12 },
    icon: '🎸',
    skillRequirement: { skill: 'Rock', level: 1 }
  },
  {
    id: 'synthesizer',
    name: 'Analog Synthesizer',
    category: 'instrument',
    price: 1200,
    description: 'Vintage-style analog synthesizer for electronic music production',
    bonuses: { genreBonus: { Electronic: 3, Pop: 1 }, creativityBonus: 15 },
    icon: '🎹'
  },
  {
    id: 'guitar_amp',
    name: 'Tube Guitar Amplifier',
    category: 'instrument',
    price: 900,
    description: 'Classic tube amplifier for that perfect rock guitar tone',
    bonuses: { genreBonus: { Rock: 3, Acoustic: 1 }, creativityBonus: 10 },
    icon: '🎸'
  },

  // Software & Plugins
  {
    id: 'pro_tools_shed',
    name: 'Pro Tools Shed DAW',
    category: 'software',
    price: 600,
    description: 'Industry standard that sometimes feels like working in a shed. Reliable but quirky.',
    bonuses: { speedBonus: 15, technicalBonus: 10, qualityBonus: 8 },
    icon: '💻'
  },
  {
    id: 'logic_pro_blem',
    name: 'Logic Pro-blem X',
    category: 'software',
    price: 300,
    description: 'Great for Mac users who enjoy solving puzzles while making music.',
    bonuses: { creativityBonus: 15, speedBonus: 10, genreBonus: { Electronic: 2 } },
    icon: '💻'
  },

  // Studio Monitoring
  {
    id: 'basic_monitors',
    name: 'Basic Speakers',
    category: 'monitor',
    price: 0,
    description: 'Standard studio monitors that came with your starter setup',
    bonuses: { qualityBonus: 0 },
    icon: '🔊'
  },
  {
    id: 'studio_monitors',
    name: 'Studio Monitor Pair',
    category: 'monitor',
    price: 800,
    description: 'Professional studio monitors for accurate sound reproduction',
    bonuses: { qualityBonus: 15, technicalBonus: 5 },
    icon: '🔊'
  },

  // Audio Interfaces
  {
    id: 'audio_interface',
    name: 'Audio Interface',
    category: 'interface',
    price: 350,
    description: 'Multi-channel audio interface for professional recording',
    bonuses: { qualityBonus: 12, speedBonus: 10 },
    icon: '🔌'
  }
];

export const equipmentCategories = {
  all: 'All Equipment',
  microphone: 'Microphones',
  monitor: 'Studio Monitoring',
  interface: 'Audio Interfaces',
  outboard: 'Outboard Gear',
  instrument: 'Instruments',
  software: 'Software & Plugins'
};
