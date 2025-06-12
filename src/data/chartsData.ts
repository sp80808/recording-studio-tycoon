// Chart data generation and management for the Charts System
import { Chart, ChartEntry, Artist, Song, MarketTrend, MusicGenre } from '@/types/charts';

// Sample artist names for chart generation
const artistNames = [
  'The Midnight Rebels', 'Luna Skywalker', 'Electric Dreams', 'Neon Nights',
  'Crystal Vision', 'Urban Legends', 'Digital Hearts', 'Sonic Bloom',
  'Velvet Thunder', 'Phoenix Rising', 'Midnight Sun', 'Stellar Groove',
  'Cosmic Echo', 'Silver Lining', 'Retro Future', 'Bass Revolution',
  'Harmony Heights', 'Voltage Drop', 'Rhythm Factory', 'Sound Wave',
  'Metro Pulse', 'Night Drive', 'Sunset Boulevard', 'Frequency',
  'Audio Clash', 'Beat Machine', 'Synth City', 'Reverb Station',
  'Echo Chamber', 'Sound Barrier', 'Wavelength', 'Amplitude',
  'Decibel Dreams', 'Sonic Boom', 'Audio Wave', 'Beat Drop'
];

const songTitles = [
  'Summer Nights', 'Electric Love', 'Midnight Highway', 'Neon Dreams',
  'City Lights', 'Dancing Shadows', 'Digital Heart', 'Crystal Rain',
  'Cosmic Journey', 'Starlight Express', 'Thunder Road', 'Silver Sky',
  'Velvet Moon', 'Golden Hour', 'Infinite Loop', 'Sound of Tomorrow',
  'Retro Vibes', 'Urban Jungle', 'Night Fever', 'Electric Storm',
  'Sunset Drive', 'Crystal Clear', 'Midnight Express', 'Neon Glow',
  'Digital Dreams', 'Cosmic Love', 'Thunder Strike', 'Silver Dreams',
  'Velvet Touch', 'Golden Light', 'Infinite Sky', 'Sound of Freedom'
];

const genres: MusicGenre[] = ['rock', 'pop', 'hip-hop', 'electronic', 'country', 'alternative', 'r&b'];

// Generate a random artist
const generateArtist = (id: string, genre: MusicGenre): Artist => {
  const name = artistNames[Math.floor(Math.random() * artistNames.length)];
  const popularity = Math.floor(Math.random() * 100) + 1;
  
  return {
    id,
    name,
    genre,
    popularity,
    reputation: Math.floor(Math.random() * 100) + 1,
    collaborationHistory: [],
    lastActive: new Date(),
    demandLevel: Math.floor(Math.random() * 100) + 1,
    priceRange: {
      min: popularity * 100,
      max: popularity * 200
    },
    specialties: [genre],
    socialMediaFollowers: popularity * 10000,
    description: 'A talented musician in the ' + genre + ' genre.'
  };
};

// Generate a random song
const generateSong = (id: string, artist: Artist): Song => {
  const title = songTitles[Math.floor(Math.random() * songTitles.length)];
  
  return {
    id,
    title,
    artist,
    genre: artist.genre,
    releaseDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
    quality: Math.floor(Math.random() * 40) + 60, // 60-100 quality for chart songs
    hypeScore: Math.floor(Math.random() * 100) + 1,
    playerProduced: false,
    studio: 'Your Studio'
  };
};

// Generate chart entries for a specific chart
const generateChartEntries = (count: number, chartGenre?: MusicGenre): ChartEntry[] => {
  const entries: ChartEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const genre = chartGenre || genres[Math.floor(Math.random() * genres.length)];
    const artist = generateArtist(`artist_${i}`, genre);
    const song = generateSong(`song_${i}`, artist);
    
    // Generate realistic chart movement
    const previousPosition = i + 1 + Math.floor(Math.random() * 10) - 5; // Some variation
    const positionChange = (previousPosition > 0 ? previousPosition : i + 1) - (i + 1);
    
    let movement: 'up' | 'down' | 'new' | 'steady' = 'steady';
    if (positionChange > 2) movement = 'up';
    else if (positionChange < -2) movement = 'down';
    else if (i > count * 0.8) movement = 'new'; // New entries typically at bottom
    
    entries.push({
      position: i + 1,
      song,
      movement,
      positionChange,
      weeksOnChart: Math.floor(Math.random() * 20) + 1,
      peakPosition: Math.floor(Math.random() * (i + 1)) + 1,
      lastWeekPosition: previousPosition > 0 ? previousPosition : undefined
    });
  }
  
  return entries;
};

// Generate main charts for the game, considering the current era
export const generateCharts = (playerLevel: number, currentEra: string): Chart[] => {
  const charts: Chart[] = [];

  // TODO: Define available genres based on the current era (replace with actual era data)
  const availableGenres = genres; // For now, all genres are available

  // Main Hot 100 Chart (available from level 1)
  charts.push({
    id: 'hot100',
    name: 'Hot 100',
    description: 'The biggest hits across all genres',
    entries: generateChartEntries(40), // Show top 40 for UI purposes
    updateFrequency: 7, // Weekly updates
    influence: 100,
    region: 'national',
    minLevelToAccess: 1
  });

  // Local Charts (available from level 1)
  charts.push({
    id: 'local',
    name: 'Local Hits',
    description: 'Popular songs in your local area',
    entries: generateChartEntries(20),
    updateFrequency: 7,
    influence: 30,
    region: 'local',
    minLevelToAccess: 1
  });

  // Genre-specific charts (unlock as player progresses)
  if (playerLevel >= 3 && availableGenres.includes('rock')) {
    charts.push({
      id: 'rock',
      name: 'Rock Charts',
      description: 'The hottest rock tracks',
      entries: generateChartEntries(25, 'rock'),
      genre: 'rock',
      updateFrequency: 7,
      influence: 70,
      region: 'national',
      minLevelToAccess: 3
    });
  }

  if (playerLevel >= 4 && availableGenres.includes('pop')) {
    charts.push({
      id: 'pop',
      name: 'Pop Charts',
      description: 'Mainstream pop hits',
      entries: generateChartEntries(25, 'pop'),
      genre: 'pop',
      updateFrequency: 7,
      influence: 80,
      region: 'national',
      minLevelToAccess: 4
    });
  }

  if (playerLevel >= 5 && availableGenres.includes('hip-hop')) {
    charts.push({
      id: 'hiphop',
      name: 'Hip-Hop Charts',
      description: 'Urban and hip-hop tracks',
      entries: generateChartEntries(25, 'hip-hop'),
      genre: 'hip-hop',
      updateFrequency: 7,
      influence: 75,
      region: 'national',
      minLevelToAccess: 5
    });
  }

  if (playerLevel >= 6 && availableGenres.includes('electronic')) {
    charts.push({
      id: 'electronic',
      name: 'Electronic Charts',
      description: 'Electronic and dance music',
      entries: generateChartEntries(25, 'electronic'),
      genre: 'electronic',
      updateFrequency: 7,
      influence: 60,
      region: 'national',
      minLevelToAccess: 6
    });
  }

  return charts;
};
// Generate market trends
export const generateMarketTrends = (): MarketTrend[] => {
  return genres.map(genre => {
    const popularity = Math.floor(Math.random() * 100) + 1;
    const growth = Math.floor(Math.random() * 100) - 50; // -50 to +50
    
    return {
      genre,
      popularity,
      growth,
      seasonality: Array.from({ length: 12 }, () => Math.random() * 0.4 + 0.8), // 0.8 to 1.2 multiplier
      events: [],
      peakMonths: [
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 12)
      ]
    };
  });
};

// Calculate contact cost for an artist based on chart position and player reputation
export const calculateContactCost = (chartPosition: number, artistPopularity: number, playerReputation: number): number => {
  const baseCost = 1000;
  const positionMultiplier = Math.max(0.5, 2 - (chartPosition / 50)); // Higher chart position = higher cost
  const popularityMultiplier = artistPopularity / 100;
  const reputationDiscount = Math.max(0.7, 1 - (playerReputation / 500)); // Better reputation = lower cost
  
  return Math.floor(baseCost * positionMultiplier * popularityMultiplier * reputationDiscount);
};

// Calculate contact success probability
export const calculateContactSuccess = (
  chartPosition: number, 
  artistPopularity: number, 
  playerReputation: number, 
  offerAmount: number
): number => {
  const baseSuccess = 0.3; // 30% base success rate
  
  // Position factor (easier to contact lower-charting artists)
  const positionFactor = Math.max(0.1, 1 - (chartPosition / 100));
  
  // Reputation factor
  const reputationFactor = Math.min(2, 1 + (playerReputation / 200));
  
  // Offer factor (higher offer = better chance)
  const expectedOffer = calculateContactCost(chartPosition, artistPopularity, playerReputation);
  const offerFactor = Math.min(2, offerAmount / expectedOffer);
  
  return Math.min(0.95, baseSuccess * positionFactor * reputationFactor * offerFactor);
};

// Check if an artist is contactable based on game state
export const isArtistContactable = (chartEntry: ChartEntry, playerLevel: number, playerReputation: number): boolean => {
  // Level requirements
  if (chartEntry.position <= 10 && playerLevel < 8) return false; // Top 10 require level 8+
  if (chartEntry.position <= 25 && playerLevel < 5) return false; // Top 25 require level 5+
  
  // Reputation requirements  
  const minReputation = Math.max(0, (50 - chartEntry.position) * 10);
  if (playerReputation < minReputation) return false;
  
  return true;
};
