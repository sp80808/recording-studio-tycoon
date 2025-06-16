// Advanced Market Trends & Sub-Genre Evolution System
import { MusicGenre } from './charts';

export type TrendDirection = 'rising' | 'stable' | 'falling' | 'volatile';

export type SubGenre = 
  // Rock sub-genres
  | 'indie-rock' | 'post-rock' | 'garage-rock' | 'psychedelic-rock' | 'progressive-rock' | 'punk-rock'
  // Pop sub-genres
  | 'synthpop' | 'teen-pop' | 'dance-pop' | 'indie-pop' | 'k-pop' | 'latin-pop'
  // Hip-Hop sub-genres
  | 'trap' | 'conscious-rap' | 'drill' | 'mumble-rap' | 'old-school' | 'experimental-hip-hop'
  // Electronic sub-genres
  | 'house' | 'techno' | 'dubstep' | 'ambient' | 'drum-and-bass' | 'trance'
  // Country sub-genres
  | 'bluegrass' | 'country-pop' | 'outlaw-country' | 'contemporary-country' | 'folk-country'
  // R&B sub-genres
  | 'neo-soul' | 'contemporary-rb' | 'funk' | 'smooth-jazz-rb' | 'alternative-rb'
  // Alternative sub-genres
  | 'grunge' | 'shoegaze' | 'britpop' | 'emo' | 'post-punk' | 'art-rock'
  // Jazz sub-genres
  | 'bebop' | 'smooth-jazz' | 'fusion' | 'free-jazz' | 'latin-jazz' | 'swing'
  // Classical sub-genres
  | 'baroque' | 'romantic' | 'contemporary-classical' | 'minimalism' | 'opera'
  // Folk sub-genres
  | 'indie-folk' | 'folk-rock' | 'americana' | 'world-folk' | 'singer-songwriter'
  // Acoustic sub-genres
  | 'acoustic-pop' | 'acoustic-rock' | 'fingerstyle' | 'acoustic-indie';

export interface SubGenreDefinition {
  id: SubGenre;
  name: string;
  parentGenre: MusicGenre;
  description: string;
  characteristics: string[];
  typicalAudience: string[];
  seasonalityModifier: number; // -0.5 to 0.5, affects base popularity
  volatility: number; // 0-1, how much the trend can fluctuate
  crossoverPotential: SubGenre[]; // sub-genres this can blend with
  requiredSkills?: {
    creativity: number;
    technical: number;
  };
  equipmentPreferences?: string[]; // equipment categories that boost this sub-genre
}

export interface MarketTrendEnhanced {
  genreId: MusicGenre;
  subGenreId: SubGenre | null; // null for main genre trends
  popularity: number; // 0-100
  trendDirection: TrendDirection;
  momentum: number; // -50 to 50, rate of change per update
  peakProbability: number; // 0-1, chance this trend peaks soon
  cycleDuration: number; // weeks this trend is expected to last
  influencingFactors: TrendInfluence[];
  lastUpdated: number; // timestamp
  historicalPeaks: number[]; // previous peak popularity values
  crossoverBonus: number; // 0-1, multiplier for related sub-genres
}

export interface TrendInfluence {
  type: 'seasonal' | 'cultural-event' | 'artist-success' | 'technology' | 'economic' | 'social-media' | 'player-impact';
  description: string;
  impact: number; // -25 to 25
  duration: number; // weeks remaining
  source?: string; // specific event or cause
}

export interface MarketEvent {
  id: string;
  name: string;
  description: string;
  type: 'cultural' | 'technological' | 'economic' | 'seasonal' | 'artist-driven';
  startWeek: number;
  duration: number; // weeks
  affectedGenres: MusicGenre[];
  affectedSubGenres: SubGenre[];
  impact: {
    popularityChange: number;
    contractValueMultiplier: number;
    chartSuccessBonus: number;
  };
  probability: number; // 0-1, chance this event occurs
  requirements?: {
    minPlayerLevel?: number;
    minReputation?: number;
    requiredEra?: string;
  };
}

export interface GenrePopularityHistory {
  genre: MusicGenre;
  subGenre?: SubGenre;
  weekData: {
    week: number;
    popularity: number;
    events: string[]; // event IDs that affected this week
  }[];
  predictions: {
    nextWeekTrend: TrendDirection;
    confidenceLevel: number; // 0-1
    expectedPeakWeeks?: number;
  };
}

export interface MarketAnalysis {
  currentWeek: number;
  hotTrends: MarketTrendEnhanced[]; // top 5 rising trends
  coldTrends: MarketTrendEnhanced[]; // top 5 falling trends
  stableTrends: MarketTrendEnhanced[]; // consistent performers
  emergingSubGenres: SubGenre[]; // new sub-genres gaining traction
  saturatedMarkets: SubGenre[]; // oversaturated sub-genres
  crossoverOpportunities: {
    primary: SubGenre;
    secondary: SubGenre;
    synergy: number; // 0-1, potential success multiplier
  }[];
  seasonalForecast: {
    genre: MusicGenre;
    expectedChange: number;
    reasoning: string;
  }[];
}

export interface PlayerMarketImpact {
  successfulReleases: {
    genre: MusicGenre;
    subGenre?: SubGenre;
    impact: number; // how much player success influenced the trend
    week: number;
  }[];
  marketInfluence: number; // 0-100, player's overall market influence
  trendSetting: {
    subGenre: SubGenre;
    influenceStrength: number; // how much player can boost this sub-genre
  }[];
  genreReputation: Record<MusicGenre, number>; // 0-100 reputation in each genre
}
