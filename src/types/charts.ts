// Types for the Charts and Industry Integration System

export type MusicGenre = 'rock' | 'pop' | 'hip-hop' | 'electronic' | 'country' | 'alternative' | 'r&b' | 'jazz' | 'classical' | 'folk' | 'acoustic';

export type ChartMovement = 'up' | 'down' | 'new' | 'steady' | 'returning';

export interface Artist {
  id: string;
  name: string;
  genre: MusicGenre;
  popularity: number; // 0-100
  reputation: number; // 0-100
  collaborationHistory: string[]; // project IDs
  lastActive: Date;
  demandLevel: number; // how much they want to work (0-100)
  priceRange: {
    min: number;
    max: number;
  };
  specialties: string[];
  socialMediaFollowers: number;
  description?: string; // Short bio or description of the artist
  availability: {
    status: 'available' | 'busy' | 'on-tour' | 'in-studio';
    responseTime: number; // Days until artist responds
  };
  mood: number; // 0-100, affects negotiation and performance
}

export interface Song {
  id: string;
  title: string;
  artist: Artist;
  genre: MusicGenre;
  releaseDate: Date;
  quality: number; // 0-100
  hypeScore: number; // 0-100
  playerProduced?: boolean;
  studioId?: string;
  studio?: string;
}

export interface ChartEntry {
  position: number;
  song: Song;
  movement: ChartMovement;
  positionChange: number;
  weeksOnChart: number;
  peakPosition: number;
  lastWeekPosition?: number;
}

export interface Chart {
  id: string;
  name: string; // "Billboard Hot 100", "Country Charts", etc.
  description: string;
  entries: ChartEntry[];
  genre?: MusicGenre; // undefined = all genres
  updateFrequency: number; // days
  influence: number; // industry importance (0-100)
  region: ChartRegion;
  minLevelToAccess: number;
  lastChartUpdate?: number; // Add lastChartUpdate to Chart interface
}

export type ChartRegion = 'local' | 'regional' | 'national' | 'international';
export interface MarketTrend {
  genre: MusicGenre;
  popularity: number; // 0-100
  growth: number; // -50 to +50 (percentage change)
  seasonality: number[]; // 12 months of variation
  events: TrendEvent[];
  peakMonths: number[]; // months when this genre is most popular
}

export interface TrendEvent {
  id: string;
  name: string;
  description: string;
  impact: number; // -50 to +50
  duration: number; // days
  affectedGenres: MusicGenre[];
  startDate: Date;
}

export interface ArtistOpportunity {
  id: string;
  artist: Artist;
  projectType: 'single' | 'album' | 'ep' | 'remix' | 'soundtrack';
  description: string;
  budget: number;
  timeline: number; // days
  requirements: {
    minReputation: number;
    preferredGenres: MusicGenre[];
    equipmentNeeds: string[];
    staffNeeds: string[];
  };
  deadline: Date;
  hypeBonus: number; // bonus hype if completed well
  exclusivity: 'open' | 'limited' | 'exclusive'; // how many studios can bid
  responseDeadline: Date;
}

export interface ArtistContact {
  artistId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired';
  requestDate: Date;
  responseDate?: Date;
  opportunityId: string;
  playerMessage?: string;
  artistResponse?: string;
  negotiationPhase: 'initial' | 'terms' | 'contract' | 'finalized';
  proposedTerms?: {
    budget: number;
    timeline: number;
    royaltyShare: number;
    creativeControl: number; // 0-100, higher = more artist control
  };
}

export interface IndustryReputation {
  overall: number; // 0-100
  byGenre: Record<MusicGenre, number>;
  chartSuccess: number; // based on chart performance
  artistSatisfaction: number; // based on completed collaborations
  innovation: number; // based on unique approaches/equipment
  reliability: number; // based on meeting deadlines
}

export interface ChartsGameState {
  availableCharts: Chart[];
  contactedArtists: ArtistContact[];
  marketTrends: MarketTrend[];
  playerInfluence: number; // 0-100, ability to affect charts
  industryReputation: IndustryReputation;
  discoveredArtists: Artist[];
  completedCollaborations: string[]; // artist IDs
  chartHistory: ChartHistoryEntry[];
  lastChartsUpdate: Date;
}

export interface ChartHistoryEntry {
  date: Date;
  chartId: string;
  songId: string;
  position: number;
  isPlayerProject: boolean;
}

// Hype System Integration
export interface ProjectHype {
  projectId: string;
  currentHype: number; // 0-100
  sources: HypeSource[];
  peakHype: number;
  hypeDecay: number; // daily decay rate
  multiplierEffect: number; // calculated multiplier for rewards
}

export interface HypeSource {
  type: 'marketing' | 'milestone' | 'synergy' | 'equipment' | 'social' | 'industry';
  amount: number;
  timestamp: Date;
  description: string;
  cost?: number;
}

export interface HypeAction {
  id: string;
  name: string;
  description: string;
  cost: number;
  hypeGain: number;
  requirements: {
    minLevel?: number;
    maxUsesPerProject?: number;
    requiredEquipment?: string[];
    cooldownDays?: number;
  };
  unlockConditions: {
    level?: number;
    reputation?: number;
    completedProjects?: number;
  };
}
