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
