
import { Band, SessionMusician } from '@/types/bands';

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

export const generateAIBand = (genre: string): Band => {
  return {
    id: `ai_band_${Date.now()}_${Math.random()}`,
    bandName: generateBandName(),
    genre,
    fame: 0,
    notoriety: 0,
    memberIds: [],
    isPlayerCreated: false,
    pastReleases: [],
    tourStatus: {
      isOnTour: false,
      daysRemaining: 0,
      dailyIncome: 0
    }
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
      creativity: 20 + Math.floor(Math.random() * 30), // 20-50
      technical: 20 + Math.floor(Math.random() * 30), // 20-50
      hireCost: 500
    });
  }
  
  return musicians;
};

export const calculateReviewScore = (
  baseQuality: number,
  assignedStaffSkills: number,
  randomFactor: number = Math.random() * 4 - 2 // -2 to +2
): number => {
  const score = baseQuality + (assignedStaffSkills / 10) + randomFactor;
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10)); // Clamp between 1-10
};

export const calculateTotalSales = (reviewScore: number, fame: number): number => {
  return Math.floor(reviewScore * 1000 * (1 + fame / 100));
};

export const updateBandStats = (band: Band, reviewScore: number): Band => {
  let newFame = band.fame;
  let newNotoriety = band.notoriety;
  
  if (reviewScore > 7) {
    newFame = Math.min(100, newFame + 10); // Cap at 100
  } else if (reviewScore < 4) {
    newNotoriety = Math.min(50, newNotoriety + 5); // Cap at 50
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
