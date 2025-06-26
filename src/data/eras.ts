import { Era } from "@/types/game";

export const AVAILABLE_ERAS: Era[] = [
  {
    id: 'modern',
    name: 'modern',
    displayName: 'Modern Era',
    startYear: 2024,
    description: 'Start in the current music industry with all modern equipment and streaming services.',
    funnyDescription: 'Auto-tune? Check. Social media drama? Double check. Actual musical talent? Optional!',
    startingMoney: 50000,
    equipmentMultiplier: 1.0,
    availableGenres: ['Pop', 'Hip-Hop', 'Electronic', 'Rock', 'Indie', 'R&B', 'Country', 'Jazz', 'Classical'],
    marketTrends: ['Streaming dominance', 'Social media influence', 'Bedroom pop revival'],
    icon: '📱',
    difficulty: 'Easy'
  },
  {
    id: 'digital_age',
    name: 'digital_age',
    displayName: 'Digital Revolution',
    startYear: 2000,
    description: 'Experience the dawn of digital music, file sharing chaos, and the iPod revolution.',
    funnyDescription: 'When Napster made record executives cry and everyone had 10,000 songs they never listened to.',
    startingMoney: 35000,
    equipmentMultiplier: 0.8,
    availableGenres: ['Pop', 'Hip-Hop', 'Rock', 'Electronic', 'Nu-Metal', 'Emo', 'R&B'],
    marketTrends: ['Digital piracy panic', 'CD sales declining', 'Auto-tune emergence'],
    icon: '💿',
    difficulty: 'Medium'
  },
  {
    id: 'golden_age',
    name: 'golden_age',
    displayName: 'Golden Age',
    startYear: 1980,
    description: 'The MTV era! Big hair, bigger synthesizers, and the birth of music videos.',
    funnyDescription: 'When musicians looked like they raided a glam rock costume shop and sounded amazing doing it.',
    startingMoney: 25000,
    equipmentMultiplier: 0.6,
    availableGenres: ['Rock', 'Pop', 'New Wave', 'Hip-Hop', 'Metal', 'Punk', 'R&B'],
    marketTrends: ['MTV launches', 'Synthesizer boom', 'Cassette tape dominance'],
    icon: '📺',
    difficulty: 'Hard'
  },
  {
    id: 'classic_rock',
    name: 'classic_rock',
    displayName: 'Rock Revolution',
    startYear: 1960,
    description: 'Start from the very beginning! Witness the birth of rock, soul, and studio innovation.',
    funnyDescription: 'When "experimental" meant playing your guitar really loud and studio effects were basically magic.',
    startingMoney: 15000,
    equipmentMultiplier: 0.3,
    availableGenres: ['Rock', 'Pop', 'Soul', 'Folk', 'Jazz', 'Blues'],
    marketTrends: ['Stereo recording new', 'Multi-track emerging', 'Radio AM dominance'],
    icon: '🎸',
    difficulty: 'Legendary'
  }
];