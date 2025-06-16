import { Band, SessionMusician, OriginalTrackProject } from '@/types/bands';
import { MusicGenre } from '@/types/charts';
import { marketService } from '@/services/marketService';

const bandAdjectives = [
  'Electric', 'Crimson', 'Midnight', 'Silver', 'Golden', 'Dark', 'Neon', 'Velvet',
  'Crystal', 'Thunder', 'Lightning', 'Fire', 'Ice', 'Shadow', 'Bright', 'Wild',
  'Lost', 'Broken', 'Rising', 'Falling', 'Secret', 'Hidden', 'Ancient', 'Modern'
];

const bandNouns = [
  'Waves', 'Tides', 'Dreams', 'Nights', 'Days', 'Stars', 'Moons', 'Suns',
  'Hearts', 'Souls', 'Minds', 'Eyes', 'Voices', 'Songs', 'Beats', 'Rhythms',
  'Echoes', 'Whispers', 'Screams', 'Lights', 'Shadows', 'Mirrors', 'Angels', 'Devils'
];

const sessionMusicianNames = [
  'Jake Miller', 'Sarah Johnson', 'Mike Rodriguez', 'Lisa Chen', 'Tom Wilson',
  'Amy Davis', 'Chris Brown', 'Nina Patel', 'Alex Kim', 'Maya Thompson'
];

export const generateBandName = (): string => {
  const adjective = bandAdjectives[Math.floor(Math.random() * bandAdjectives.length)];
  const noun = bandNouns[Math.floor(Math.random() * bandNouns.length)];
  return `${adjective} ${noun}`;
};

export const generateAIBand = (genre: MusicGenre): Band => {
  return {
    id: `ai_band_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    bandName: generateBandName(),
    genre,
    fame: Math.floor(Math.random() * 30), // Start with some initial, low fame
    notoriety: 0,
    memberIds: [], // AI bands might not have explicit members initially or managed differently
    isPlayerCreated: false,
    pastReleases: [],
    reputation: Math.floor(Math.random() * 50), // Initial reputation
    experience: 0, // Initial experience
    fans: Math.floor(Math.random() * 1000), // Initial fans
    performanceHistory: [], // Empty history initially
    tourStatus: {
      isOnTour: false,
      daysRemaining: 0,
      dailyIncome: 0
    }
    // trainingStatus can be omitted as it's optional
  };
};

export const generateSessionMusicians = (count: number): SessionMusician[] => {
  const roles: SessionMusician['role'][] = [
    'Session Guitarist', 'Session Drummer', 'Session Bassist', 'Session Keyboardist', 'Session Vocalist'
  ];
  
  const musicians: SessionMusician[] = [];
  
  for (let i = 0; i < count; i++) {
    musicians.push({
      id: `session_${Date.now()}_${i}`,
      name: sessionMusicianNames[Math.floor(Math.random() * sessionMusicianNames.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      creativity: 20 + Math.floor(Math.random() * 30), 
      technical: 20 + Math.floor(Math.random() * 30), 
      hireCost: 500
    });
  }
  
  return musicians;
};

export const calculateReviewScore = (
  project: Pick<OriginalTrackProject, 'genre' | 'subGenreId'>, 
  baseQuality: number, 
  assignedStaffSkills: number, 
  randomFactor: number = Math.random() * 2 - 1 
): number => {
  const popularity = marketService.getCurrentPopularity(project.genre, project.subGenreId); 

  let popularityModifier = 0;
  if (popularity >= 80) {
    popularityModifier = 0.5 + (popularity - 80) / 20; 
  } else if (popularity >= 60) {
    popularityModifier = (popularity - 60) / 20; 
  } else if (popularity >= 40) {
    popularityModifier = (popularity - 50) / 20; 
  } else if (popularity >= 20) {
    popularityModifier = -1.0 + (popularity - 20) / 20; 
  } else {
    popularityModifier = -1.5 + (popularity / 20); 
  }
  
  popularityModifier = Math.max(-1.5, Math.min(1.5, popularityModifier));

  const skillContribution = assignedStaffSkills / 20; 
  const scaledBaseQuality = baseQuality / 10; 

  const score = scaledBaseQuality + skillContribution + popularityModifier + randomFactor; 
  
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
};

export const calculateTotalSales = (reviewScore: number, fame: number): number => {
  return Math.floor(reviewScore * 1000 * (1 + fame / 100));
};

export const updateBandStats = (band: Band, reviewScore: number): Band => {
  let newFame = band.fame;
  let newNotoriety = band.notoriety;
  
  if (reviewScore > 7) {
    newFame = Math.min(100, newFame + 10); 
  } else if (reviewScore < 4) {
    newNotoriety = Math.min(50, newNotoriety + 5); 
  }
  
  return {
    ...band,
    fame: newFame,
    notoriety: newNotoriety
  };
};

export const canGoOnTour = (band: Band): boolean => {
  return band.fame >= 50 && !band.tourStatus.isOnTour;
};
