// Reputation & Relationship Management System
import { MusicGenre } from './charts';

export type EntityType = 'client' | 'record-label' | 'artist' | 'venue' | 'media';

export interface Client {
  id: string;
  name: string;
  type: 'independent' | 'corporate' | 'startup' | 'established';
  relationshipScore: number; // 0-100
  preferredGenres: MusicGenre[];
  preferredMoods: string[]; // 'upbeat', 'mellow', 'aggressive', 'romantic', etc.
  budgetRange: {
    min: number;
    max: number;
  };
  qualityExpectations: number; // 0-100
  timelineTolerance: number; // 0-100, higher = more flexible
  communicationStyle: 'formal' | 'casual' | 'direct' | 'collaborative';
  reputation: number; // 0-100, how well-known they are
  contactHistory: ContractHistory[];
  blacklisted: boolean;
  specialRequirements?: string[];
  industryConnections: string[]; // IDs of other entities they're connected to
}

export interface RecordLabel {
  id: string;
  name: string;
  type: 'major' | 'independent' | 'boutique' | 'digital';
  relationshipScore: number; // 0-100
  preferredGenres: MusicGenre[];
  preferredMoods: string[];
  marketFocus: 'mainstream' | 'niche' | 'experimental' | 'commercial';
  budgetTier: 'low' | 'medium' | 'high' | 'unlimited';
  distributionReach: 'local' | 'national' | 'international';
  artistRoster: string[]; // artist IDs they represent
  contactHistory: ContractHistory[];
  blacklisted: boolean;
  exclusivityRequirements: boolean; // do they require exclusive contracts
  royaltyRates: {
    standard: number; // percentage
    premium: number; // for high-relationship clients
  };
  industryInfluence: number; // 0-100, their power in the industry
}

export interface ContractHistory {
  contractId: string;
  projectId: string;
  startDate: number;
  endDate: number;
  agreedBudget: number;
  finalCost: number;
  qualityDelivered: number; // 0-100
  timelineMet: boolean;
  relationshipChange: number; // -20 to +20
  issues: ContractIssue[];
  bonusesEarned: number;
  penaltiesIncurred: number;
}

export interface ContractIssue {
  type: 'quality' | 'timeline' | 'communication' | 'budget' | 'creative-differences';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  resolved: boolean;
  impactOnRelationship: number; // -10 to +5
}

export interface RelationshipEvent {
  id: string;
  entityId: string;
  entityType: EntityType;
  type: 'project-completion' | 'project-delay' | 'quality-bonus' | 'favor-request' | 'industry-event' | 'recommendation';
  description: string;
  relationshipChange: number;
  timestamp: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface RelationshipModifier {
  id: string;
  name: string;
  description: string;
  entityTypes: EntityType[];
  conditions: {
    minRelationship?: number;
    maxRelationship?: number;
    requiredGenres?: MusicGenre[];
    requiredHistory?: number; // minimum completed projects
  };
  effects: {
    contractValueMultiplier?: number;
    qualityBonusMultiplier?: number;
    timelineFlexibility?: number; // additional days tolerance
    exclusiveAccess?: boolean; // access to special contracts
    referralChance?: number; // 0-1, chance of getting referrals
  };
}

export interface ContractOffer {
  id: string;
  fromEntityId: string;
  fromEntityType: EntityType;
  title: string;
  description: string;
  genre: MusicGenre;
  budget: number;
  timeline: number; // days
  qualityThreshold: number; // minimum quality score required
  specialRequirements: string[];
  exclusivity: boolean;
  relationshipRequirement: number; // minimum relationship score needed
  expirationDate: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  bonusOpportunities: {
    condition: string;
    bonus: number;
    relationshipBonus: number;
  }[];
}

export interface FavorRequest {
  id: string;
  fromEntityId: string;
  fromEntityType: EntityType;
  type: 'rush-job' | 'discount-rate' | 'creative-consultation' | 'equipment-loan' | 'referral';
  description: string;
  cost: number; // money, time, or reputation cost
  relationshipGain: number;
  relationshipLossIfDeclined: number;
  deadline?: number;
  requirements?: {
    minLevel?: number;
    requiredEquipment?: string[];
    timeCommitment?: number;
  };
}

export interface ReputationScore {
  overall: number; // 0-100
  byGenre: Record<MusicGenre, number>;
  byEntityType: Record<EntityType, number>;
  reliability: number; // track record of meeting deadlines
  quality: number; // average quality of delivered projects
  innovation: number; // use of cutting-edge techniques/equipment
  communication: number; // how well you work with clients
  pricing: number; // fair pricing reputation
  specializations: {
    genre: MusicGenre;
    reputation: number;
  }[];
}

export interface IndustryStanding {
  tier: 'unknown' | 'emerging' | 'established' | 'premier' | 'legendary';
  influencePoints: number; // 0-1000
  networkSize: number; // number of industry connections
  mediaAttention: number; // 0-100
  awardRecognitions: string[];
  industryEvents: {
    type: 'conference' | 'award-show' | 'networking' | 'masterclass';
    name: string;
    invitationLevel: 'none' | 'attendee' | 'speaker' | 'headliner';
  }[];
}

export interface RelationshipBonus {
  contractValueIncrease: number; // percentage
  qualityToleranceIncrease: number; // extra quality points forgiven
  timelineExtension: number; // extra days granted
  exclusiveContractAccess: boolean;
  referralRate: number; // 0-1, chance of getting referred to others
  negotiationAdvantage: number; // 0-1, better contract terms
}

export interface BlacklistEvent {
  entityId: string;
  entityType: EntityType;
  reason: string;
  severity: 'temporary' | 'permanent';
  duration?: number; // days, for temporary blacklists
  impactOnIndustry: number; // how much this affects overall reputation
  recoveryRequirements?: {
    relationshipThreshold?: number;
    timeRequired?: number;
    specialActions?: string[];
  };
}

export interface RelationshipInsight {
  entityId: string;
  entityType: EntityType;
  currentRelationship: number;
  trend: 'improving' | 'stable' | 'declining';
  recentEvents: RelationshipEvent[];
  recommendations: {
    action: string;
    expectedImpact: number;
    cost?: number;
    timeline?: number;
  }[];
  riskFactors: {
    factor: string;
    riskLevel: 'low' | 'medium' | 'high';
    mitigation: string;
  }[];
}
