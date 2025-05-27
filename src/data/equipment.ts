
import { Equipment } from '@/types/game';

export const availableEquipment: Equipment[] = [
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
    bonuses: { genreBonus: { Rock: 2, Hiphop: 1 }, qualityBonus: 8 },
    icon: '🎤'
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
    id: 'audio_interface',
    name: 'Audio Interface',
    category: 'interface',
    price: 350,
    description: 'Multi-channel audio interface for professional recording',
    bonuses: { qualityBonus: 12, speedBonus: 10 },
    icon: '🔌'
  },
  {
    id: 'compressor',
    name: 'Hardware Compressor',
    category: 'processor',
    price: 600,
    description: 'Analog compressor for that warm, professional sound',
    bonuses: { qualityBonus: 20, technicalBonus: 8 },
    icon: '⚙️'
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
  }
];
