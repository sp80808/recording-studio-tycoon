
import { Equipment } from '@/types/game';

export interface EraAvailableEquipment extends Equipment {
  availableFrom: number; // Year when equipment becomes available
  availableUntil?: number; // Year when equipment becomes obsolete (optional)
  eraDescription?: string; // Era-specific description
  isVintage?: boolean; // If true, becomes more expensive over time
}

export const availableEquipment: EraAvailableEquipment[] = [
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
  {
    id: 'ribbon_vintage_mic',
    name: 'Ribbon-Me-This Vintage Mic',
    category: 'microphone',
    price: 850,
    description: 'Smooth as butter, warm as toast. Makes everything sound like it was recorded in the good old days.',
    bonuses: { genreBonus: { Acoustic: 3, Rock: 2 }, creativityBonus: 15, qualityBonus: 12 },
    icon: '🎤',
    skillRequirement: { skill: 'Acoustic', level: 2 }
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
  {
    id: 'ssl_console_strip',
    name: 'SSL Seriously Solid Logic Console Strip',
    category: 'outboard',
    price: 2200,
    description: 'The channel strip that launched a thousand hits. Or at least made them sound better.',
    bonuses: { technicalBonus: 30, qualityBonus: 25, speedBonus: 10, genreBonus: { Pop: 3, Rock: 2 } },
    icon: '⚙️',
    skillRequirement: { skill: 'Pop', level: 4 }
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
  {
    id: 'drum_machine_808',
    name: 'TR-808 Probably Genuine Drum Machine',
    category: 'instrument',
    price: 1350,
    description: 'The boom, the bap, the legendary sound that defined Hip-hop. May or may not be an authentic vintage unit.',
    bonuses: { genreBonus: { 'Hip-hop': 4, Electronic: 2 }, creativityBonus: 18, technicalBonus: 10 },
    icon: '🥁',
    skillRequirement: { skill: 'Hip-hop', level: 2 }
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
  {
    id: 'ableton_live_wire',
    name: 'Ableton Live Wire',
    category: 'software',
    price: 450,
    description: 'Perfect for live performances and studio work. Sometimes gets a bit too energetic.',
    bonuses: { creativityBonus: 20, speedBonus: 15, genreBonus: { Electronic: 3, 'Hip-hop': 1 } },
    icon: '💻',
    skillRequirement: { skill: 'Electronic', level: 1 }
  },
  {
    id: 'autotune_autobot',
    name: 'Auto-Tune Autobot Plugin',
    category: 'software',
    price: 280,
    description: 'Robots in disguise... as vocal processors. Makes everyone sound like the future.',
    bonuses: { technicalBonus: 12, genreBonus: { Pop: 2, 'Hip-hop': 2 } },
    icon: '💻',
    skillRequirement: { skill: 'Pop', level: 1 }
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
  {
    id: 'yamaha_ns_no_way',
    name: 'Yamaha NS-No-Way Reference Monitors',
    category: 'monitor',
    price: 1600,
    description: 'These monitors reveal truths about your mix you didn\'t want to know. Brutally honest.',
    bonuses: { qualityBonus: 30, technicalBonus: 20, speedBonus: 5 },
    icon: '🔊',
    skillRequirement: { skill: 'Pop', level: 2 }
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
  },
  {
    id: 'apogee_symphony_phony',
    name: 'Apogee Symphony-Phony Interface',
    category: 'interface',
    price: 2800,
    description: 'Converts analog to digital with the precision of a Swiss watch and the ego of a virtuoso.',
    bonuses: { qualityBonus: 35, technicalBonus: 25, speedBonus: 15 },
    icon: '🔌',
    skillRequirement: { skill: 'Acoustic', level: 3 }
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
