import { Era } from "@/types/game";

/**
 * Era pickers and opening briefs label an era by decade ("2020s"), never by `startYear + "s"`:
 * a start year is a simulation boundary, not display copy (#326). Saves keep their own
 * stored eraStartYear/currentYear, so changing a boundary here never rewrites an existing career.
 */
export const eraDecadeLabel = (startYear: number): string => `${Math.floor(startYear / 10) * 10}s`;

export const AVAILABLE_ERAS: Era[] = [
  {
    id: 'modern',
    name: 'modern',
    displayName: 'Modern Era',
    startYear: 2020,
    description: 'Start in the current music industry with all modern equipment and streaming services.',
    funnyDescription: 'Auto-tune? Check. Social media drama? Double check. Actual musical talent? Optional!',
    startingMoney: 9000,
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
    startingMoney: 7000,
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
    startingMoney: 5000,
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
    startingMoney: 3500,
    equipmentMultiplier: 0.3,
    availableGenres: ['Rock', 'Pop', 'Soul', 'Folk', 'Jazz', 'Blues'],
    marketTrends: ['Stereo recording new', 'Multi-track emerging', 'Radio AM dominance'],
    icon: '🎸',
    difficulty: 'Legendary'
  }
];