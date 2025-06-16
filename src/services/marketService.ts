// Market Service for Dynamic Market Trends & Sub-Genre Evolution
import { 
  MarketTrendEnhanced, 
  SubGenre, 
  SubGenreDefinition, 
  TrendDirection, 
  TrendInfluence, 
  MarketEvent, 
  MarketAnalysis, 
  PlayerMarketImpact 
} from '../types/marketTrends';
import { MusicGenre } from '../types/charts';
import { Project } from '../types/game';

export class MarketService {
  private trends: MarketTrendEnhanced[] = [];
  private subGenreDefinitions: Map<SubGenre, SubGenreDefinition> = new Map();
  private activeEvents: MarketEvent[] = [];
  private playerImpact: PlayerMarketImpact;
  private lastUpdateWeek: number = 0;

  constructor() {
    this.initializeSubGenres();
    this.initializeMarketTrends();
    this.playerImpact = this.initializePlayerImpact();
  }

  /**
   * Initialize sub-genre definitions with their characteristics
   */
  private initializeSubGenres(): void {
    const subGenres: SubGenreDefinition[] = [
      // Rock sub-genres
      {
        id: 'indie-rock',
        name: 'Indie Rock',
        parentGenre: 'rock',
        description: 'Independent rock music with alternative sensibilities',
        characteristics: ['DIY production', 'Alternative songwriting', 'Underground appeal'],
        typicalAudience: ['Young adults', 'College students', 'Alternative music fans'],
        seasonalityModifier: 0.1,
        volatility: 0.7,
        crossoverPotential: ['indie-folk', 'indie-pop'],
        requiredSkills: { creativity: 70, technical: 50 },
        equipmentPreferences: ['microphone', 'outboard']
      },
      {
        id: 'post-rock',
        name: 'Post-Rock',
        parentGenre: 'rock',
        description: 'Instrumental rock with atmospheric and experimental elements',
        characteristics: ['Instrumental focus', 'Atmospheric textures', 'Progressive structures'],
        typicalAudience: ['Music enthusiasts', 'Experimental listeners', 'Musicians'],
        seasonalityModifier: -0.2,
        volatility: 0.4,
        crossoverPotential: ['ambient', 'progressive-rock'],
        requiredSkills: { creativity: 80, technical: 70 },
        equipmentPreferences: ['outboard', 'software']
      },
      // Pop sub-genres
      {
        id: 'synthpop',
        name: 'Synthpop',
        parentGenre: 'pop',
        description: 'Pop music featuring prominent synthesizers and electronic elements',
        characteristics: ['Electronic production', 'Catchy melodies', 'Retro aesthetics'],
        typicalAudience: ['Mainstream pop fans', 'Electronic music listeners', 'Nostalgia seekers'],
        seasonalityModifier: 0.3,
        volatility: 0.6,
        crossoverPotential: ['dance-pop', 'house'],
        requiredSkills: { creativity: 60, technical: 75 },
        equipmentPreferences: ['software', 'interface']
      },
      {
        id: 'dance-pop',
        name: 'Dance Pop',
        parentGenre: 'pop',
        description: 'Upbeat pop music designed for dancing and clubs',
        characteristics: ['High energy', 'Club-ready beats', 'Commercial appeal'],
        typicalAudience: ['Club-goers', 'Mainstream pop fans', 'Young adults'],
        seasonalityModifier: 0.4,
        volatility: 0.8,
        crossoverPotential: ['house', 'synthpop'],
        requiredSkills: { creativity: 50, technical: 80 },
        equipmentPreferences: ['software', 'mixer']
      },
      // Electronic sub-genres
      {
        id: 'house',
        name: 'House',
        parentGenre: 'electronic',
        description: 'Four-on-the-floor electronic dance music',
        characteristics: ['Steady 4/4 beat', 'Repetitive rhythms', 'DJ-friendly'],
        typicalAudience: ['Club-goers', 'Dance music fans', 'DJs'],
        seasonalityModifier: 0.5,
        volatility: 0.6,
        crossoverPotential: ['techno', 'dance-pop', 'trance'],
        requiredSkills: { creativity: 55, technical: 85 },
        equipmentPreferences: ['software', 'mixer']
      },
      {
        id: 'ambient',
        name: 'Ambient',
        parentGenre: 'electronic',
        description: 'Atmospheric electronic music focused on mood and texture',
        characteristics: ['Atmospheric textures', 'Minimal beats', 'Meditative quality'],
        typicalAudience: ['Relaxation seekers', 'Meditation practitioners', 'Audio enthusiasts'],
        seasonalityModifier: -0.3,
        volatility: 0.3,
        crossoverPotential: ['post-rock', 'contemporary-classical', 'minimalism'],
        requiredSkills: { creativity: 75, technical: 60 },
        equipmentPreferences: ['software', 'outboard']
      }
    ];

    subGenres.forEach(subGenre => {
      this.subGenreDefinitions.set(subGenre.id, subGenre);
    });
  }

  /**
   * Initialize market trends for all genres and sub-genres
   */
  private initializeMarketTrends(): void {
    const genres: MusicGenre[] = ['rock', 'pop', 'hip-hop', 'electronic', 'country', 'alternative', 'r&b', 'jazz', 'classical', 'folk', 'acoustic'];
    
    // Create main genre trends
    genres.forEach(genre => {
      this.trends.push({
        genreId: genre,
        subGenreId: null,
        popularity: 50 + Math.random() * 40, // 50-90 initial popularity
        trendDirection: this.randomTrendDirection(),
        momentum: (Math.random() - 0.5) * 20, // -10 to 10
        peakProbability: Math.random() * 0.3,
        cycleDuration: 4 + Math.random() * 8, // 4-12 weeks
        influencingFactors: [],
        lastUpdated: Date.now(),
        historicalPeaks: [],
        crossoverBonus: Math.random() * 0.3
      });
    });

    // Create sub-genre trends
    this.subGenreDefinitions.forEach((def, subGenreId) => {
      this.trends.push({
        genreId: def.parentGenre,
        subGenreId: subGenreId,
        popularity: 20 + Math.random() * 60, // 20-80 initial popularity
        trendDirection: this.randomTrendDirection(),
        momentum: (Math.random() - 0.5) * 30, // -15 to 15
        peakProbability: Math.random() * 0.4,
        cycleDuration: 3 + Math.random() * 6, // 3-9 weeks
        influencingFactors: [],
        lastUpdated: Date.now(),
        historicalPeaks: [],
        crossoverBonus: Math.random() * 0.5
      });
    });
  }

  private initializePlayerImpact(): PlayerMarketImpact {
    const genreReputation: Record<MusicGenre, number> = {} as Record<MusicGenre, number>;
    const genres: MusicGenre[] = ['rock', 'pop', 'hip-hop', 'electronic', 'country', 'alternative', 'r&b', 'jazz', 'classical', 'folk', 'acoustic'];
    
    genres.forEach(genre => {
      genreReputation[genre] = 0;
    });

    return {
      successfulReleases: [],
      marketInfluence: 0,
      trendSetting: [],
      genreReputation
    };
  }

  private randomTrendDirection(): TrendDirection {
    const directions: TrendDirection[] = ['rising', 'stable', 'falling', 'volatile'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  /**
   * Update market trends based on time passage and game events
   */
  public updateMarketTrends(currentWeek: number, gameEvents?: MarketEvent[]): void {
    if (currentWeek <= this.lastUpdateWeek) return;

    this.trends.forEach(trend => {
      // Apply momentum to popularity
      let popularityChange = trend.momentum * 0.1;

      // Apply seasonal effects for sub-genres
      if (trend.subGenreId) {
        const subGenreDef = this.subGenreDefinitions.get(trend.subGenreId);
        if (subGenreDef) {
          const seasonalEffect = subGenreDef.seasonalityModifier * Math.sin((currentWeek / 52) * Math.PI * 2);
          popularityChange += seasonalEffect * 5;
        }
      }

      // Apply random volatility
      const volatility = trend.subGenreId ? 
        this.subGenreDefinitions.get(trend.subGenreId)?.volatility || 0.5 : 0.3;
      popularityChange += (Math.random() - 0.5) * volatility * 10;

      // Update popularity
      trend.popularity = Math.max(0, Math.min(100, trend.popularity + popularityChange));

      // Update trend direction based on momentum
      if (trend.momentum > 5) trend.trendDirection = 'rising';
      else if (trend.momentum < -5) trend.trendDirection = 'falling';
      else if (Math.abs(trend.momentum) > 2) trend.trendDirection = 'volatile';
      else trend.trendDirection = 'stable';

      // Decay momentum over time
      trend.momentum *= 0.9;

      // Update cycle duration
      trend.cycleDuration--;
      if (trend.cycleDuration <= 0) {
        // Start new cycle
        trend.cycleDuration = 4 + Math.random() * 8;
        trend.momentum = (Math.random() - 0.5) * 20;
      }

      trend.lastUpdated = Date.now();
    });

    this.lastUpdateWeek = currentWeek;
  }

  /**
   * Get current popularity for a specific genre/sub-genre combination
   */
  public getCurrentPopularity(genre: MusicGenre, subGenre?: SubGenre): number {
    const trend = this.trends.find(t => 
      t.genreId === genre && t.subGenreId === subGenre
    );
    return trend?.popularity || 50;
  }

  /**
   * Get trend direction for a specific genre/sub-genre combination
   */
  public getTrendDirection(genre: MusicGenre, subGenre?: SubGenre): TrendDirection {
    const trend = this.trends.find(t => 
      t.genreId === genre && t.subGenreId === subGenre
    );
    return trend?.trendDirection || 'stable';
  }

  /**
   * Calculate market trend influence on project appeal
   */
  public calculateMarketInfluence(project: Project): number {
    const mainGenreTrend = this.getCurrentPopularity(project.genre as MusicGenre);
    
    // Base multiplier from main genre
    let multiplier = 0.5 + (mainGenreTrend / 100) * 0.5; // 0.5-1.0

    // Add crossover bonuses if applicable
    const relatedTrends = this.trends.filter(t => 
      t.genreId === project.genre && t.crossoverBonus > 0
    );
    
    relatedTrends.forEach(trend => {
      multiplier += trend.crossoverBonus * 0.1;
    });

    return Math.min(1.5, multiplier); // Cap at 1.5x
  }

  /**
   * Calculate contract value modifier based on market trends
   */
  public calculateContractValueModifier(genre: MusicGenre, subGenre?: SubGenre): number {
    const popularity = this.getCurrentPopularity(genre, subGenre);
    const trend = this.trends.find(t => 
      t.genreId === genre && t.subGenreId === subGenre
    );

    let modifier = 0.7 + (popularity / 100) * 0.6; // 0.7-1.3

    // Bonus for rising trends
    if (trend?.trendDirection === 'rising') {
      modifier += 0.2;
    } else if (trend?.trendDirection === 'falling') {
      modifier -= 0.1;
    }

    return Math.max(0.5, Math.min(2.0, modifier));
  }

  /**
   * Record successful player release and its market impact
   */
  public recordPlayerSuccess(project: Project, chartSuccess: number): void {
    const genre = project.genre as MusicGenre;
    const impact = Math.min(5, chartSuccess * 0.1); // Max 5 point impact

    // Record the success
    this.playerImpact.successfulReleases.push({
      genre,
      subGenre: undefined, // Could be determined from project analysis
      impact,
      week: this.lastUpdateWeek
    });

    // Update genre reputation
    this.playerImpact.genreReputation[genre] = Math.min(100, 
      this.playerImpact.genreReputation[genre] + impact
    );

    // Update market influence
    this.playerImpact.marketInfluence = Math.min(100,
      this.playerImpact.marketInfluence + impact * 0.5
    );

    // Apply impact to market trends
    const trend = this.trends.find(t => 
      t.genreId === genre && t.subGenreId === null
    );
    if (trend) {
      trend.momentum += impact * 0.5;
      trend.influencingFactors.push({
        type: 'player-impact',
        description: `Player success with "${project.title}"`,
        impact: impact,
        duration: 2,
        source: project.id
      });
    }
  }

  /**
   * Generate comprehensive market analysis
   */
  public generateMarketAnalysis(): MarketAnalysis {
    const sortedByPopularity = [...this.trends].sort((a, b) => b.popularity - a.popularity);
    const risingTrends = this.trends.filter(t => t.trendDirection === 'rising');
    const fallingTrends = this.trends.filter(t => t.trendDirection === 'falling');
    const stableTrends = this.trends.filter(t => t.trendDirection === 'stable');

    return {
      currentWeek: this.lastUpdateWeek,
      hotTrends: risingTrends.slice(0, 5),
      coldTrends: fallingTrends.slice(0, 5),
      stableTrends: stableTrends.slice(0, 5),
      emergingSubGenres: this.findEmergingSubGenres(),
      saturatedMarkets: this.findSaturatedMarkets(),
      crossoverOpportunities: this.findCrossoverOpportunities(),
      seasonalForecast: this.generateSeasonalForecast()
    };
  }

  private findEmergingSubGenres(): SubGenre[] {
    return this.trends
      .filter(t => t.subGenreId && t.trendDirection === 'rising' && t.popularity < 70)
      .map(t => t.subGenreId!)
      .slice(0, 3);
  }

  private findSaturatedMarkets(): SubGenre[] {
    return this.trends
      .filter(t => t.subGenreId && t.popularity > 80)
      .map(t => t.subGenreId!)
      .slice(0, 3);
  }

  private findCrossoverOpportunities(): { primary: SubGenre; secondary: SubGenre; synergy: number }[] {
    const opportunities: { primary: SubGenre; secondary: SubGenre; synergy: number }[] = [];
    
    this.subGenreDefinitions.forEach((def, subGenreId) => {
      def.crossoverPotential.forEach(crossoverGenre => {
        if (this.subGenreDefinitions.has(crossoverGenre as SubGenre)) {
          const primaryPopularity = this.getCurrentPopularity(def.parentGenre, subGenreId);
          const secondaryPopularity = this.getCurrentPopularity(
            this.subGenreDefinitions.get(crossoverGenre as SubGenre)!.parentGenre,
            crossoverGenre as SubGenre
          );
          
          const synergy = (primaryPopularity + secondaryPopularity) / 200;
          opportunities.push({
            primary: subGenreId,
            secondary: crossoverGenre as SubGenre,
            synergy
          });
        }
      });
    });

    return opportunities
      .sort((a, b) => b.synergy - a.synergy)
      .slice(0, 5);
  }

  private generateSeasonalForecast(): { genre: MusicGenre; expectedChange: number; reasoning: string }[] {
    const genres: MusicGenre[] = ['rock', 'pop', 'electronic', 'country'];
    
    return genres.map(genre => {
      const trend = this.trends.find(t => t.genreId === genre && !t.subGenreId);
      const expectedChange = trend ? trend.momentum : 0;
      
      let reasoning = 'Market conditions remain stable';
      if (expectedChange > 5) reasoning = 'Strong upward momentum expected';
      else if (expectedChange < -5) reasoning = 'Declining interest anticipated';
      else if (Math.abs(expectedChange) > 2) reasoning = 'Volatile market conditions';

      return {
        genre,
        expectedChange,
        reasoning
      };
    });
  }

  /**
   * Get all current market trends
   */
  public getAllTrends(): MarketTrendEnhanced[] {
    return [...this.trends];
  }

  /**
   * Get sub-genre definition
   */
  public getSubGenreDefinition(subGenre: SubGenre): SubGenreDefinition | undefined {
    return this.subGenreDefinitions.get(subGenre);
  }

  /**
   * Get player's market impact data
   */
  public getPlayerImpact(): PlayerMarketImpact {
    return { ...this.playerImpact };
  }
}

// Singleton instance
export const marketService = new MarketService();
