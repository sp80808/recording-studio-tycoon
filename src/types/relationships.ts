import { MusicGenre } from './charts'; // Assuming MusicGenre is the standard genre type

export type EntityType = 'client' | 'recordLabel' | 'artist' | 'mediaOutlet' | 'influencer';

// Generic interface for any entity the player can have a relationship with
export interface GameEntity {
  id: string;
  name: string;
  entityType: EntityType;
  description?: string;
}

export interface RelationshipStats {
  relationshipScore: number; // 0-100, overall sentiment
  trust: number; // 0-100, how much they rely on your quality/timeliness
  respect: number; // 0-100, how much they value your artistic/technical skill
  lastInteractionDay: number; // Game day of last significant interaction
  interactionCount: number;
  successfulProjects: number;
  failedProjects: number;
  isBlacklisted?: boolean; // True if this entity has blacklisted the player
  activeNegativeBuffs?: string[]; // IDs or keys of temporary negative effects from this relationship
}

// --- PR Event System Types ---

export type PREventEffectTarget = 'globalReputation' | 'genreReputation' | 'entityRelationship' | 'contractAvailability';

export interface PREventEffect {
  type: PREventEffectTarget;
  value: number; // e.g., -10 for reputation, or a multiplier like 0.8
  durationDays?: number; // How long the effect lasts, undefined for permanent
  targetEntityId?: string; // For 'entityRelationship'
  targetGenre?: MusicGenre; // For 'genreReputation' or genre-specific contract availability
  description?: string; // e.g., "-10 Global Reputation for 30 days"
}

export interface PREvent {
  id: string;
  name: string; // e.g., "Scathing Review in MusicMag", "Label Drops Player"
  description: string; // Details of the event
  type: 'positive' | 'negative' | 'neutral';
  triggerConditions: { // Conditions that can trigger this event
    relationshipThreshold?: { entityId: string; scoreBelow?: number; scoreAbove?: number };
    projectOutcome?: { success?: boolean; failure?: boolean; highProfile?: boolean };
    randomChance?: number; // 0-1 probability
    // ... other potential triggers
  };
  effects: PREventEffect[];
  isGlobal: boolean; // Does it affect global state or a specific entity relationship?
  newsHeadline?: string; // For display in an in-game news feed
  startDate?: number; // Game day when the event started
  isActive?: boolean; // If the event's effects are currently active
}

// For entities that offer projects, like individual clients or small companies
export interface Client extends GameEntity {
  entityType: 'client';
  preferredGenres: MusicGenre[];
  preferredMoods?: string[]; // e.g., "Upbeat", "Melancholic", "Aggressive"
  budgetRange: { min: number; max: number }; // Typical project budget they offer
  patienceLevel: number; // 0-100, how tolerant they are of delays/issues
  qualityExpectation: number; // 0-100, minimum quality they expect
  relationship: RelationshipStats;
}

// For larger entities like record labels
export interface RecordLabel extends GameEntity {
  entityType: 'recordLabel';
  preferredGenres: MusicGenre[]; // Genres they specialize in or are looking for
  preferredArtistPopularity?: { min: number; max: number }; // e.g., looking for emerging or established artists
  marketFocus: 'mainstream' | 'niche' | 'experimental';
  contractTermsTemplate: { // Default terms they usually offer
    royaltySplit?: { player: number; label: number }; // e.g., { player: 20, label: 80 }
    advanceRange?: { min: number; max: number };
    creativeControl?: 'player' | 'label' | 'collaborative';
  };
  relationship: RelationshipStats;
  affiliatedArtistIds?: string[]; // Artists signed to this label
}

// Could also define interfaces for individual Artists (if they act as clients or collaborators),
// MediaOutlets (for PR), Influencers, etc., all extending GameEntity and having RelationshipStats.

// Example: Artist as a relationship entity (distinct from Artist in charts.ts if that's just for chart entries)
// This would be for artists the player builds a direct working relationship with.
export interface RelationshipArtist extends GameEntity {
  entityType: 'artist';
  primaryGenre: MusicGenre;
  secondaryGenres?: MusicGenre[];
  preferredMoods?: string[];
  careerStage: 'emerging' | 'established' | 'veteran' | 'legendary';
  artisticVision?: string; // A short description of their style/goals
  relationship: RelationshipStats;
  isSigned: boolean; // To a label (could be player's label or another)
  labelId?: string; // If signed to another label
}

// This map could store all relationships in the game state
export type RelationshipMap = Record<string, RelationshipStats>;
// The key would be the entityId (Client.id, RecordLabel.id, etc.)

// It might also be useful to have a list of active PR events in the GameState
// export type ActivePREvents = PREvent[]; // This would go into src/types/game.ts GameState interface
