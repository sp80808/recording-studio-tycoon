// Era progression system for Recording Studio Tycoon
import { GameState } from '@/types/game';

export interface EraDefinition {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  description: string;
  availableGenres: string[];
  technologyLevel: string;
  icon: string;
  colors: {
    gradient: string;
    primary: string;
    secondary: string;
  };
  features: string[];
  unlockRequirements: {
    minReputation?: number;
    minLevel?: number;
    completedProjects?: number;
    minDays?: number;
  };
}

export const ERA_DEFINITIONS: EraDefinition[] = [
  {
    id: 'analog60s',
    name: 'The Analog Foundation (1960s-1970s)',
    startYear: 1960,
    endYear: 1979,
    description: 'Basic analog equipment, 4-track recording, vinyl era',
    availableGenres: ['Rock', 'Folk', 'Soul', 'Motown', 'Country', 'Jazz'],
    technologyLevel: 'analog',
    icon: '🎛️',
    colors: {
      gradient: 'from-amber-800 to-orange-700',
      primary: '#D97706',
      secondary: '#92400E'
    },
    features: [
      '4-track analog recording',
      'Vintage microphones and preamps',
      'Tape-based mixing',
      'Vinyl mastering capabilities',
      'Classic reverb chambers',
      'Tube-driven warmth'
    ],
    unlockRequirements: {} // Starting era
  },
  {
    id: 'digital80s',
    name: 'The Digital Dawn (1980s-1990s)',
    startYear: 1980,
    endYear: 1999,
    description: 'Digital recording, MIDI, CD production, MTV influence',
    availableGenres: ['New Wave', 'Hip-Hop', 'Electronic', 'Hair Metal', 'Punk', 'Disco'],
    technologyLevel: 'early_digital',
    icon: '🔊',
    colors: {
      gradient: 'from-purple-800 to-pink-700',
      primary: '#A855F7',
      secondary: '#7C3AED'
    },
    features: [
      'Digital multitrack recording',
      'MIDI sequencing and synthesis',
      'CD mastering and production',
      'Early sampling technology',
      'Digital effects processors',
      'MTV-style production techniques'
    ],
    unlockRequirements: {
      minReputation: 50,
      minLevel: 5,
      completedProjects: 10,
      minDays: 90
    }
  },
  {
    id: 'internet2000s',
    name: 'The Internet Disruption (2000s-2010s)',
    startYear: 2000,
    endYear: 2019,
    description: 'DAWs, file sharing, digital distribution, social media',
    availableGenres: ['Pop-punk', 'Emo', 'Electronic', 'Indie', 'Digital'],
    technologyLevel: 'digital',
    icon: '💻',
    colors: {
      gradient: 'from-blue-800 to-cyan-700',
      primary: '#3B82F6',
      secondary: '#1E40AF'
    },
    features: [
      'Professional DAW software',
      'Digital distribution platforms',
      'High-quality audio interfaces',
      'VST plugin ecosystem',
      'Social media marketing tools',
      'Home studio accessibility'
    ],
    unlockRequirements: {
      minReputation: 100,
      minLevel: 10,
      completedProjects: 25,
      minDays: 180
    }
  },
  {
    id: 'streaming2020s',
    name: 'The Streaming Age (2020s+)',
    startYear: 2020,
    endYear: 2030,
    description: 'Streaming dominance, AI tools, social media marketing',
    availableGenres: ['EDM', 'Trap', 'Indie Pop', 'Lo-fi', 'TikTok Pop'],
    technologyLevel: 'modern',
    icon: '🎵',
    colors: {
      gradient: 'from-green-800 to-emerald-700',
      primary: '#10B981',
      secondary: '#047857'
    },
    features: [
      'AI-powered mixing and mastering',
      'Streaming optimization tools',
      'TikTok and social media integration',
      'Real-time collaboration platforms',
      'Advanced analytics and insights',
      'Blockchain music distribution'
    ],
    unlockRequirements: {
      minReputation: 150,
      minLevel: 15,
      completedProjects: 50,
      minDays: 270
    }
  }
];

export const calculateDaysPerYear = (era: string): number => {
  // Different eras can have different pacing
  switch (era) {
    case 'analog60s': return 90; // Slower pace in early era
    case 'digital80s': return 85;
    case 'internet2000s': return 80;
    case 'streaming2020s': return 75; // Faster pace in modern era
    default: return 90;
  }
};

export const calculateYearFromDay = (currentDay: number, startYear: number, era: string): number => {
  const daysPerYear = calculateDaysPerYear(era);
  const yearsElapsed = Math.floor((currentDay - 1) / daysPerYear);
  return startYear + yearsElapsed;
};

export const getCurrentEraYear = (gameState: GameState): number => {
  const currentEra = ERA_DEFINITIONS.find(era => era.id === gameState.currentEra) || ERA_DEFINITIONS[0];
  return calculateYearFromDay(gameState.currentDay, currentEra.startYear, gameState.currentEra);
};

export const checkEraTransitionAvailable = (gameState: GameState): EraDefinition | null => {
  const currentEraIndex = ERA_DEFINITIONS.findIndex(era => era.id === gameState.currentEra);
  if (currentEraIndex === -1 || currentEraIndex >= ERA_DEFINITIONS.length - 1) {
    return null; // No next era available
  }

  const nextEra = ERA_DEFINITIONS[currentEraIndex + 1];
  const requirements = nextEra.unlockRequirements;

  // Check all requirements
  const meetsReputation = !requirements.minReputation || gameState.reputation >= requirements.minReputation;
  const meetsLevel = !requirements.minLevel || gameState.playerData.level >= requirements.minLevel;
  const meetsDays = !requirements.minDays || gameState.currentDay >= requirements.minDays;
  
  // Count completed projects (simplified - could be enhanced later)
  const completedProjects = Math.floor(gameState.reputation / 5); // Rough estimate
  const meetsProjects = !requirements.completedProjects || completedProjects >= requirements.completedProjects;

  if (meetsReputation && meetsLevel && meetsDays && meetsProjects) {
    return nextEra;
  }

  return null;
};

export const transitionToEra = (gameState: GameState, newEra: EraDefinition): GameState => {
  console.log(`Transitioning to era: ${newEra.name}`);
  
  // Calculate new starting conditions for the era
  const newEraStartYear = newEra.startYear;
  const daysSinceStart = gameState.currentDay;
  
  // Update equipment multiplier based on era
  let equipmentMultiplier = 1.0;
  switch (newEra.id) {
    case 'analog60s': equipmentMultiplier = 0.3; break;
    case 'digital80s': equipmentMultiplier = 0.6; break;
    case 'internet2000s': equipmentMultiplier = 0.8; break;
    case 'streaming2020s': equipmentMultiplier = 1.0; break;
  }

  return {
    ...gameState,
    currentEra: newEra.id,
    eraStartYear: newEraStartYear,
    currentYear: calculateYearFromDay(daysSinceStart, newEraStartYear, newEra.id),
    equipmentMultiplier,
    // Add bonus reputation for successful era transition
    reputation: gameState.reputation + 10
  };
};

export const getEraProgress = (gameState: GameState): { 
  currentEra: EraDefinition;
  nextEra: EraDefinition | null;
  progressPercent: number;
  canTransition: boolean;
} => {
  const currentEra = ERA_DEFINITIONS.find(era => era.id === gameState.currentEra) || ERA_DEFINITIONS[0];
  const nextEra = checkEraTransitionAvailable(gameState);
  
  // Calculate progress within current era based on days
  const eraRequiredDays = nextEra?.unlockRequirements.minDays || 365;
  const progressPercent = Math.min(100, (gameState.currentDay / eraRequiredDays) * 100);
  
  return {
    currentEra,
    nextEra,
    progressPercent,
    canTransition: nextEra !== null
  };
};

export const getEraSpecificEquipmentMultiplier = (era: string, baseYear: number, currentYear: number): number => {
  // Equipment pricing based on era and year progression
  const yearDifference = currentYear - baseYear;
  
  switch (era) {
    case 'analog60s':
      // Vintage equipment becomes more expensive over time
      return 0.3 + (yearDifference * 0.02);
    case 'digital80s':
      // Digital revolution makes some things cheaper, others expensive
      return 0.6 + (yearDifference * 0.015);
    case 'internet2000s':
      // Mass production reduces costs
      return 0.8 - (yearDifference * 0.01);
    case 'streaming2020s':
      // Modern era with stable pricing
      return 1.0;
    default:
      return 1.0;
  }
};

// Era-specific genre popularity
export const getGenrePopularity = (genre: string, era: string): number => {
  const genreByEra: Record<string, Record<string, number>> = {
    'analog60s': {
      'Rock': 90, 'Folk': 80, 'Soul': 85, 'Motown': 90, 'Country': 70, 'Jazz': 60
    },
    'digital80s': {
      'New Wave': 90, 'Hip-Hop': 70, 'Electronic': 60, 'Hair Metal': 80, 'Punk': 75, 'Rock': 70
    },
    'internet2000s': {
      'Pop-punk': 85, 'Emo': 80, 'Electronic': 90, 'Indie': 75, 'Hip-Hop': 85, 'Rock': 60
    },
    'streaming2020s': {
      'EDM': 90, 'Trap': 85, 'Indie Pop': 80, 'Lo-fi': 70, 'Hip-Hop': 95, 'Pop': 85
    }
  };

  return genreByEra[era]?.[genre] || 50; // Default popularity
};
