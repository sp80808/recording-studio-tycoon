// Relationship Service for Reputation & Relationship Management
import { 
  Client, 
  RecordLabel, 
  EntityType, 
  RelationshipEvent, 
  ContractOffer, 
  FavorRequest, 
  ReputationScore, 
  RelationshipBonus, 
  BlacklistEvent, 
  RelationshipInsight, 
  ContractHistory 
} from '../types/relationships';
import { MusicGenre } from '../types/charts';
import { Project, ProjectReport } from '../types/game';

export class RelationshipService {
  private clients: Map<string, Client> = new Map();
  private recordLabels: Map<string, RecordLabel> = new Map();
  private relationshipEvents: RelationshipEvent[] = [];
  private reputationScore: ReputationScore;
  private blacklistEvents: BlacklistEvent[] = [];
  private activeOffers: ContractOffer[] = [];
  private activeFavorRequests: FavorRequest[] = [];

  constructor() {
    this.initializeEntities();
    this.reputationScore = this.initializeReputation();
  }

  /**
   * Initialize default clients and record labels
   */
  private initializeEntities(): void {
    // Initialize some default clients
    const defaultClients: Client[] = [
      {
        id: 'indie-artist-1',
        name: 'Luna & The Moonbeams',
        type: 'independent',
        relationshipScore: 50,
        preferredGenres: ['rock', 'alternative', 'folk'],
        preferredMoods: ['mellow', 'introspective', 'nostalgic'],
        budgetRange: { min: 2000, max: 8000 },
        qualityExpectations: 70,
        timelineTolerance: 80,
        communicationStyle: 'collaborative',
        reputation: 40,
        contactHistory: [],
        blacklisted: false,
        industryConnections: []
      },
      {
        id: 'corporate-client-1',
        name: 'MediaSync Productions',
        type: 'corporate',
        relationshipScore: 30,
        preferredGenres: ['pop', 'electronic', 'r&b'],
        preferredMoods: ['upbeat', 'commercial', 'energetic'],
        budgetRange: { min: 15000, max: 50000 },
        qualityExpectations: 90,
        timelineTolerance: 40,
        communicationStyle: 'formal',
        reputation: 85,
        contactHistory: [],
        blacklisted: false,
        specialRequirements: ['radio-ready mixing', 'streaming optimization'],
        industryConnections: ['major-label-1', 'venue-chain-1']
      },
      {
        id: 'startup-label-1',
        name: 'Fresh Beats Records',
        type: 'startup',
        relationshipScore: 60,
        preferredGenres: ['hip-hop', 'r&b', 'pop'],
        preferredMoods: ['urban', 'contemporary', 'trendy'],
        budgetRange: { min: 5000, max: 20000 },
        qualityExpectations: 75,
        timelineTolerance: 65,
        communicationStyle: 'casual',
        reputation: 25,
        contactHistory: [],
        blacklisted: false,
        industryConnections: ['indie-artist-2', 'media-outlet-1']
      }
    ];

    defaultClients.forEach(client => {
      this.clients.set(client.id, client);
    });

    // Initialize some default record labels
    const defaultLabels: RecordLabel[] = [
      {
        id: 'major-label-1',
        name: 'Pinnacle Records',
        type: 'major',
        relationshipScore: 20,
        preferredGenres: ['pop', 'rock', 'r&b'],
        preferredMoods: ['commercial', 'mainstream', 'radio-friendly'],
        marketFocus: 'mainstream',
        budgetTier: 'unlimited',
        distributionReach: 'international',
        artistRoster: ['chart-artist-1', 'chart-artist-2'],
        contactHistory: [],
        blacklisted: false,
        exclusivityRequirements: true,
        royaltyRates: { standard: 15, premium: 20 },
        industryInfluence: 95
      },
      {
        id: 'indie-label-1',
        name: 'Underground Collective',
        type: 'independent',
        relationshipScore: 70,
        preferredGenres: ['alternative', 'rock', 'electronic'],
        preferredMoods: ['experimental', 'artistic', 'underground'],
        marketFocus: 'niche',
        budgetTier: 'medium',
        distributionReach: 'national',
        artistRoster: ['indie-artist-3', 'indie-artist-4'],
        contactHistory: [],
        blacklisted: false,
        exclusivityRequirements: false,
        royaltyRates: { standard: 25, premium: 30 },
        industryInfluence: 45
      },
      {
        id: 'boutique-label-1',
        name: 'Artisan Sound House',
        type: 'boutique',
        relationshipScore: 45,
        preferredGenres: ['jazz', 'classical', 'acoustic'],
        preferredMoods: ['sophisticated', 'intimate', 'refined'],
        marketFocus: 'niche',
        budgetTier: 'high',
        distributionReach: 'national',
        artistRoster: ['jazz-artist-1', 'classical-ensemble-1'],
        contactHistory: [],
        blacklisted: false,
        exclusivityRequirements: true,
        royaltyRates: { standard: 20, premium: 25 },
        industryInfluence: 60
      }
    ];

    defaultLabels.forEach(label => {
      this.recordLabels.set(label.id, label);
    });
  }

  private initializeReputation(): ReputationScore {
    const genres: MusicGenre[] = ['rock', 'pop', 'hip-hop', 'electronic', 'country', 'alternative', 'r&b', 'jazz', 'classical', 'folk', 'acoustic'];
    const entityTypes: EntityType[] = ['client', 'record-label', 'artist', 'venue', 'media'];
    
    const byGenre: Record<MusicGenre, number> = {} as Record<MusicGenre, number>;
    const byEntityType: Record<EntityType, number> = {} as Record<EntityType, number>;

    genres.forEach(genre => { byGenre[genre] = 50; });
    entityTypes.forEach(type => { byEntityType[type] = 50; });

    return {
      overall: 50,
      byGenre,
      byEntityType,
      reliability: 50,
      quality: 50,
      innovation: 50,
      communication: 50,
      pricing: 50,
      specializations: []
    };
  }

  /**
   * Increase relationship score with an entity
   */
  public increaseRelationship(entityId: string, amount: number, reason: string): void {
    const client = this.clients.get(entityId);
    const label = this.recordLabels.get(entityId);
    
    if (client) {
      client.relationshipScore = Math.min(100, client.relationshipScore + amount);
      this.recordRelationshipEvent(entityId, 'client', 'project-completion', reason, amount);
    } else if (label) {
      label.relationshipScore = Math.min(100, label.relationshipScore + amount);
      this.recordRelationshipEvent(entityId, 'record-label', 'project-completion', reason, amount);
    }
  }

  /**
   * Decrease relationship score with an entity
   */
  public decreaseRelationship(entityId: string, amount: number, reason: string): void {
    const client = this.clients.get(entityId);
    const label = this.recordLabels.get(entityId);
    
    if (client) {
      client.relationshipScore = Math.max(0, client.relationshipScore - amount);
      this.recordRelationshipEvent(entityId, 'client', 'project-delay', reason, -amount);
      
      // Check for blacklisting
      if (client.relationshipScore <= 10) {
        this.considerBlacklisting(entityId, 'client', 'Poor relationship due to repeated issues');
      }
    } else if (label) {
      label.relationshipScore = Math.max(0, label.relationshipScore - amount);
      this.recordRelationshipEvent(entityId, 'record-label', 'project-delay', reason, -amount);
      
      if (label.relationshipScore <= 5) {
        this.considerBlacklisting(entityId, 'record-label', 'Severe relationship deterioration');
      }
    }
  }

  private recordRelationshipEvent(
    entityId: string, 
    entityType: EntityType, 
    type: RelationshipEvent['type'], 
    description: string, 
    relationshipChange: number
  ): void {
    this.relationshipEvents.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityId,
      entityType,
      type,
      description,
      relationshipChange,
      timestamp: Date.now()
    });

    // Keep only recent events (last 50)
    if (this.relationshipEvents.length > 50) {
      this.relationshipEvents = this.relationshipEvents.slice(-50);
    }
  }

  /**
   * Process project completion and update relationships
   */
  public processProjectCompletion(project: Project, report: ProjectReport): void {
    // Determine if this was from a client or label
    const entityId = this.findProjectEntity(project);
    if (!entityId) return;

    const entity = this.clients.get(entityId) || this.recordLabels.get(entityId);
    if (!entity) return;

    // Calculate relationship change based on performance
    let relationshipChange = 0;

    // Quality performance
    if (report.qualityScore >= 90) relationshipChange += 8;
    else if (report.qualityScore >= 80) relationshipChange += 5;
    else if (report.qualityScore >= 70) relationshipChange += 2;
    else if (report.qualityScore < 50) relationshipChange -= 5;

    // Timeline performance (assuming project was completed on time if efficiency is high)
    if (report.efficiencyScore >= 90) relationshipChange += 3;
    else if (report.efficiencyScore < 60) relationshipChange -= 3;

    // Budget performance (assuming staying within budget)
    if (report.payout >= project.payoutBase) relationshipChange += 2;

    // Apply the relationship change
    if (relationshipChange > 0) {
      this.increaseRelationship(entityId, relationshipChange, 
        `Excellent work on "${project.title}" - Quality: ${report.qualityScore}%`);
    } else if (relationshipChange < 0) {
      this.decreaseRelationship(entityId, Math.abs(relationshipChange), 
        `Issues with "${project.title}" - Quality: ${report.qualityScore}%`);
    }

    // Update reputation
    this.updateReputation(project, report);

    // Record contract history
    this.recordContractHistory(entityId, project, report);
  }

  private findProjectEntity(project: Project): string | null {
    // Simple heuristic - in a real implementation, this would be tracked in the project
    // For now, return the first client that matches the genre preference
    for (const [id, client] of this.clients) {
      if (client.preferredGenres.includes(project.genre as MusicGenre)) {
        return id;
      }
    }
    return null;
  }

  private updateReputation(project: Project, report: ProjectReport): void {
    // Update overall reputation
    const reputationChange = (report.qualityScore - 75) * 0.1; // -2.5 to +2.5
    this.reputationScore.overall = Math.max(0, Math.min(100, 
      this.reputationScore.overall + reputationChange));

    // Update genre-specific reputation
    const genre = project.genre as MusicGenre;
    if (this.reputationScore.byGenre[genre] !== undefined) {
      this.reputationScore.byGenre[genre] = Math.max(0, Math.min(100, 
        this.reputationScore.byGenre[genre] + reputationChange * 1.5));
    }

    // Update specific reputation aspects
    this.reputationScore.quality = Math.max(0, Math.min(100,
      this.reputationScore.quality + (report.qualityScore - 75) * 0.15));
    
    this.reputationScore.reliability = Math.max(0, Math.min(100,
      this.reputationScore.reliability + (report.efficiencyScore - 75) * 0.1));
  }

  private recordContractHistory(entityId: string, project: Project, report: ProjectReport): void {
    const entity = this.clients.get(entityId) || this.recordLabels.get(entityId);
    if (!entity) return;

    const history: ContractHistory = {
      contractId: `contract-${project.id}`,
      projectId: project.id,
      startDate: Date.now() - (project.durationDaysTotal * 24 * 60 * 60 * 1000), // Estimate
      endDate: Date.now(),
      agreedBudget: project.payoutBase,
      finalCost: project.payoutBase, // Simplified
      qualityDelivered: report.qualityScore,
      timelineMet: report.efficiencyScore >= 80,
      relationshipChange: 0, // Would be calculated based on the changes made above
      issues: [],
      bonusesEarned: Math.max(0, report.payout - project.payoutBase),
      penaltiesIncurred: 0
    };

    entity.contactHistory.push(history);

    // Keep only recent history (last 20 projects)
    if (entity.contactHistory.length > 20) {
      entity.contactHistory = entity.contactHistory.slice(-20);
    }
  }

  /**
   * Generate contract offers based on relationships
   */
  public generateContractOffers(): ContractOffer[] {
    const offers: ContractOffer[] = [];

    // Generate offers from high-relationship clients
    for (const [id, client] of this.clients) {
      if (client.blacklisted || client.relationshipScore < 30) continue;

      const offerChance = (client.relationshipScore - 30) / 70; // 0-1 based on relationship
      if (Math.random() < offerChance * 0.3) { // 30% max chance per update
        offers.push(this.createClientOffer(client));
      }
    }

    // Generate offers from record labels
    for (const [id, label] of this.recordLabels) {
      if (label.blacklisted || label.relationshipScore < 25) continue;

      const offerChance = (label.relationshipScore - 25) / 75;
      if (Math.random() < offerChance * 0.2) { // 20% max chance per update
        offers.push(this.createLabelOffer(label));
      }
    }

    this.activeOffers.push(...offers);
    return offers;
  }

  private createClientOffer(client: Client): ContractOffer {
    const genre = client.preferredGenres[Math.floor(Math.random() * client.preferredGenres.length)];
    const baseValue = client.budgetRange.min + 
      (client.budgetRange.max - client.budgetRange.min) * (client.relationshipScore / 100);

    return {
      id: `offer-${Date.now()}-${client.id}`,
      fromEntityId: client.id,
      fromEntityType: 'client',
      title: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Project for ${client.name}`,
      description: `High-quality ${genre} production needed`,
      genre,
      budget: Math.round(baseValue),
      timeline: 14 + Math.round(client.timelineTolerance / 10), // 14-24 days
      qualityThreshold: client.qualityExpectations,
      specialRequirements: client.specialRequirements || [],
      exclusivity: client.type === 'corporate',
      relationshipRequirement: Math.max(0, client.relationshipScore - 20),
      expirationDate: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      priority: client.reputation > 70 ? 'high' : 'normal',
      bonusOpportunities: [
        {
          condition: 'Complete 2 days early',
          bonus: Math.round(baseValue * 0.15),
          relationshipBonus: 5
        },
        {
          condition: 'Quality score above 95%',
          bonus: Math.round(baseValue * 0.2),
          relationshipBonus: 8
        }
      ]
    };
  }

  private createLabelOffer(label: RecordLabel): ContractOffer {
    const genre = label.preferredGenres[Math.floor(Math.random() * label.preferredGenres.length)];
    const budgetMultiplier = label.budgetTier === 'unlimited' ? 3 : 
                           label.budgetTier === 'high' ? 2 : 
                           label.budgetTier === 'medium' ? 1.5 : 1;
    const baseValue = 10000 * budgetMultiplier * (label.relationshipScore / 100);

    return {
      id: `offer-${Date.now()}-${label.id}`,
      fromEntityId: label.id,
      fromEntityType: 'record-label',
      title: `${label.name} - ${genre.charAt(0).toUpperCase() + genre.slice(1)} Album Production`,
      description: `Multi-track ${genre} album for ${label.distributionReach} release`,
      genre,
      budget: Math.round(baseValue),
      timeline: 30 + Math.round(label.industryInfluence / 5), // 30-50 days
      qualityThreshold: 85, // Labels typically want high quality
      specialRequirements: label.exclusivityRequirements ? ['Exclusive contract', 'No other label work during project'] : [],
      exclusivity: label.exclusivityRequirements,
      relationshipRequirement: label.type === 'major' ? 60 : 30,
      expirationDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 days
      priority: label.industryInfluence > 80 ? 'urgent' : 'high',
      bonusOpportunities: [
        {
          condition: 'Chart success (Top 50)',
          bonus: Math.round(baseValue * 0.5),
          relationshipBonus: 15
        },
        {
          condition: 'Critical acclaim (90%+ reviews)',
          bonus: Math.round(baseValue * 0.3),
          relationshipBonus: 10
        }
      ]
    };
  }

  /**
   * Calculate relationship bonus for contract values
   */
  public calculateRelationshipBonus(entityId: string): RelationshipBonus {
    const entity = this.clients.get(entityId) || this.recordLabels.get(entityId);
    if (!entity) {
      return {
        contractValueIncrease: 0,
        qualityToleranceIncrease: 0,
        timelineExtension: 0,
        exclusiveContractAccess: false,
        referralRate: 0,
        negotiationAdvantage: 0
      };
    }

    const relationship = entity.relationshipScore;
    
    return {
      contractValueIncrease: Math.max(0, (relationship - 50) * 0.4), // 0-20% increase
      qualityToleranceIncrease: Math.max(0, (relationship - 60) * 0.2), // 0-8 points
      timelineExtension: Math.max(0, Math.floor((relationship - 70) / 10)), // 0-3 days
      exclusiveContractAccess: relationship >= 80,
      referralRate: Math.max(0, (relationship - 60) / 100), // 0-40% chance
      negotiationAdvantage: Math.max(0, (relationship - 50) / 200) // 0-25% advantage
    };
  }

  private considerBlacklisting(entityId: string, entityType: EntityType, reason: string): void {
    const blacklistEvent: BlacklistEvent = {
      entityId,
      entityType,
      reason,
      severity: 'temporary',
      duration: 30, // 30 days
      impactOnIndustry: 10,
      recoveryRequirements: {
        relationshipThreshold: 40,
        timeRequired: 14,
        specialActions: ['Complete 2 successful projects', 'Public apology']
      }
    };

    this.blacklistEvents.push(blacklistEvent);

    // Mark entity as blacklisted
    const entity = this.clients.get(entityId) || this.recordLabels.get(entityId);
    if (entity) {
      entity.blacklisted = true;
    }

    // Impact overall reputation
    this.reputationScore.overall = Math.max(0, this.reputationScore.overall - 5);
    this.reputationScore.reliability = Math.max(0, this.reputationScore.reliability - 10);
  }

  /**
   * Get relationship insights for UI display
   */
  public getRelationshipInsights(): RelationshipInsight[] {
    const insights: RelationshipInsight[] = [];

    // Analyze clients
    for (const [id, client] of this.clients) {
      insights.push(this.analyzeEntityRelationship(id, 'client', client.relationshipScore, client.contactHistory));
    }

    // Analyze labels
    for (const [id, label] of this.recordLabels) {
      insights.push(this.analyzeEntityRelationship(id, 'record-label', label.relationshipScore, label.contactHistory));
    }

    return insights.sort((a, b) => b.currentRelationship - a.currentRelationship);
  }

  private analyzeEntityRelationship(
    entityId: string, 
    entityType: EntityType, 
    currentRelationship: number,
    history: ContractHistory[]
  ): RelationshipInsight {
    const recentEvents = this.relationshipEvents
      .filter(e => e.entityId === entityId)
      .slice(-5);

    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentEvents.length >= 2) {
      const recentChange = recentEvents.slice(-2).reduce((sum, e) => sum + e.relationshipChange, 0);
      if (recentChange > 5) trend = 'improving';
      else if (recentChange < -5) trend = 'declining';
    }

    // Generate recommendations
    const recommendations = [];
    if (currentRelationship < 40) {
      recommendations.push({
        action: 'Focus on quality delivery',
        expectedImpact: 8,
        timeline: 2
      });
    }
    if (currentRelationship > 80) {
      recommendations.push({
        action: 'Request premium contracts',
        expectedImpact: 15,
        cost: 0
      });
    }

    // Identify risk factors
    const riskFactors = [];
    if (currentRelationship < 30) {
      riskFactors.push({
        factor: 'Low relationship score',
        riskLevel: 'high' as const,
        mitigation: 'Deliver exceptional quality on next project'
      });
    }

    return {
      entityId,
      entityType,
      currentRelationship,
      trend,
      recentEvents,
      recommendations,
      riskFactors
    };
  }

  /**
   * Get all clients
   */
  public getAllClients(): Client[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get all record labels
   */
  public getAllRecordLabels(): RecordLabel[] {
    return Array.from(this.recordLabels.values());
  }

  /**
   * Get current reputation score
   */
  public getReputationScore(): ReputationScore {
    return { ...this.reputationScore };
  }

  /**
   * Get active contract offers
   */
  public getActiveOffers(): ContractOffer[] {
    return [...this.activeOffers];
  }

  /**
   * Get relationship score for specific entity
   */
  public getRelationshipScore(entityId: string): number {
    const entity = this.clients.get(entityId) || this.recordLabels.get(entityId);
    return entity?.relationshipScore || 0;
  }
}

// Singleton instance
export const relationshipService = new RelationshipService();
