import { EntityId, GenreId, MoodId, ProjectId } from './common.types';
import { GameState } from '../types/game'; // Import GameState
import type { ClientRelationship, ClientRelationshipTier } from '../types/game';

export interface Client {
  id: EntityId;
  name: string;
  relationshipScore: number; // 0-100
  preferredGenres: GenreId[];
  preferredMoods?: MoodId[]; // Optional
  // History of interactions, e.g., completed projects, specific feedback
  interactionHistory?: Array<{ event: string; impact: number; date: number }>;
  isBlacklisted: boolean;
}

export interface RecordLabel {
  id: EntityId;
  name: string;
  relationshipScore: number; // 0-100
  preferredGenres: GenreId[];
  preferredMoods?: MoodId[];
  // Influence level, market reach, etc.
  influenceTier: 'Indie' | 'Regional' | 'National' | 'Global';
  interactionHistory?: Array<{ event: string; impact: number; date: number }>;
  isBlacklisted: boolean;
}

export type RelatableEntity = Client | RecordLabel; // Could be expanded to Artists, etc.

/**
 * RelationshipService: Manages relationships with clients and record labels.
 */
export class RelationshipService {
  private clients: Map<EntityId, Client> = new Map();
  private recordLabels: Map<EntityId, RecordLabel> = new Map();
  private gameState: GameState; // Add gameState property

  constructor(initialClients: Client[], initialRecordLabels: RecordLabel[], gameState: GameState) {
    initialClients.forEach(c => this.clients.set(c.id, c));
    initialRecordLabels.forEach(rl => this.recordLabels.set(rl.id, rl));
    this.gameState = gameState; // Initialize gameState
  }

  private getEntity(entityId: EntityId): RelatableEntity | undefined {
    return this.clients.get(entityId) || this.recordLabels.get(entityId);
  }

  increaseRelationship(entityId: EntityId, amount: number, reason: string, gameTime: number): boolean {
    const entity = this.getEntity(entityId);
    if (entity && !entity.isBlacklisted) {
      entity.relationshipScore = Math.min(100, entity.relationshipScore + amount);
      entity.interactionHistory?.push({ event: reason, impact: amount, date: gameTime });
      // Potentially remove from blacklist if score improves significantly
      if (entity.isBlacklisted && entity.relationshipScore > 20) { // Example threshold
          // entity.isBlacklisted = false; // Consider a more involved un-blacklisting process
      }
      // Increase influence based on relationship gain
      this.gameState.influence += Math.floor(amount / 2); // Example: 50% of relationship gain
      return true;
    }
    return false;
  }

  decreaseRelationship(entityId: EntityId, amount: number, reason: string, gameTime: number): boolean {
    const entity = this.getEntity(entityId);
    if (entity) {
      entity.relationshipScore = Math.max(0, entity.relationshipScore - amount);
      entity.interactionHistory?.push({ event: reason, impact: -amount, date: gameTime });
      if (entity.relationshipScore < 10) { // Example threshold for blacklisting
        // this.blacklistEntity(entityId, 'Critically low relationship');
      }
      // Decrease influence based on relationship loss (optional, but adds consequence)
      this.gameState.influence = Math.max(0, this.gameState.influence - Math.floor(amount / 4)); // Example: 25% of relationship loss
      return true;
    }
    return false;
  }

  getRelationshipScore(entityId: EntityId): number | undefined {
    const entity = this.getEntity(entityId);
    return entity?.relationshipScore;
  }

  isEntityBlacklisted(entityId: EntityId): boolean {
    const entity = this.getEntity(entityId);
    return entity ? entity.isBlacklisted : true; // Default to true if entity not found
  }

  blacklistEntity(entityId: EntityId, reason: string, gameTime: number): void {
    const entity = this.getEntity(entityId);
    if (entity) {
      entity.isBlacklisted = true;
      entity.relationshipScore = 0; // Or a very low number
      entity.interactionHistory?.push({ event: `Blacklisted: ${reason}`, impact: -Infinity, date: gameTime });
      // Potentially trigger a PR event
      // gameEventManager.triggerEvent('NegativePR', { entityName: entity.name, reason: 'blacklisted' });
    }
  }

  // Example: Called after a project is completed
  processProjectCompletion(
    projectId: ProjectId,
    entityId: EntityId, // Client or Label for the project
    qualityScore: number, // 0-100
    onTime: boolean,
    gameTime: number
  ): void {
    const entity = this.getEntity(entityId);
    if (!entity) return;

    let relationshipChange = 0;
    let reason = `Project ${projectId} completed.`;

    // Quality impact (example logic)
    if (qualityScore > 85) {
      relationshipChange += 10;
      reason += ' Excellent quality.';
    } else if (qualityScore > 60) {
      relationshipChange += 5;
      reason += ' Good quality.';
    } else if (qualityScore < 40) {
      relationshipChange -= 10;
      reason += ' Poor quality.';
    } else {
      relationshipChange -= 2;
      reason += ' Subpar quality.';
    }

    // Timeliness impact
    if (onTime) {
      relationshipChange += 3;
      reason += ' Delivered on time.';
    } else {
      relationshipChange -= 5;
      reason += ' Delivered late.';
    }

    if (relationshipChange > 0) {
      this.increaseRelationship(entityId, relationshipChange, reason, gameTime);
    } else if (relationshipChange < 0) {
      this.decreaseRelationship(entityId, Math.abs(relationshipChange), reason, gameTime);
    }
    // Influence gain from project completion is handled in ProjectService.ts
  }
  
  // Placeholder for ContractGenerationService modification
  /*
  In ContractGenerationService:

  generateContracts(availableEntities: Array<Client | RecordLabel>, count: number): Contract[] {
    const potentialContracts = [];
    for (const entity of availableEntities) {
      if (this.relationshipService.isEntityBlacklisted(entity.id)) continue;

      const relationshipScore = this.relationshipService.getRelationshipScore(entity.id) || 0;
      const baseChance = 0.1; // Base chance for any contract from this entity
      const relationshipBonus = relationshipScore / 200; // Max 0.5 bonus at 100 relationship
      
      if (Math.random() < baseChance + relationshipBonus) {
        // Generate a contract tailored to this entity
        const contractValueMultiplier = 1 + (relationshipScore / 250); // Max 1.4x value
        const prestigeBonus = relationshipScore > 70 ? (relationshipScore > 90 ? 2 : 1) : 0; // Tiers of prestige

        // ... logic to create contract based on entity preferences, market trends etc.
        // const newContract = createNewContract(entity, contractValueMultiplier, prestigeBonus);
        // potentialContracts.push(newContract);
      }
    }
    // Sort and select top 'count' contracts
    return potentialContracts.sort((a, b) => b.value - a.value).slice(0, count);
  }
  */
}

/*
Consequences of Low Relationship:

1. Blacklisting:
   - As implemented in `blacklistEntity` and checked in `generateContracts`.
   - Entity will not offer any new contracts.
   - Existing contracts might be cancelled (more complex logic).

2. Negative PR Events:
   - If a relationship with a high-profile label or client drops critically low or they blacklist the player:
     // gameEventManager.triggerEvent('NegativePREvent', {
     //   type: 'EntityDispute',
     //   entityName: entity.name,
     //   severity: 'major', // or 'minor'
     //   message: `${entity.name} has publicly criticized the studio's professionalism.`
     // });
   - This could lead to a temporary drop in overall studio reputation, difficulty attracting new staff, or fewer unsolicited contract offers.

3. Loss of Perks/Access:
    - Some labels might offer unique opportunities (e.g., access to special artists, events) that become unavailable if the relationship sours.
*/

// ---------------------------------------------------------------------------
// Issue #10 — lightweight client relationships (plain-JSON, save/load safe).
//
// The legacy `RelationshipService` above tracks 0-100 scores per entity id.
// Issue #10 instead wants a tiny per-client record keyed by stable client
// identity, stored on `GameState.clientRelationships` (already an optional
// `Record<string, ClientRelationship>`, already rendered by
// ProjectList/StudioStrip), so no new persisted shape is introduced:
//   key  = normalized `clientName|clientType` (plain string, survives save/load)
//   xp   = overallQualityScore (0-100), halved on Poor matchRating
//   tier = Unknown -> Acquaintance (1 session) -> Friendly (100xp) ->
//          Regular (250xp) -> Loyal (500xp)
// All helpers are pure and guard absent data (null project, missing client
// name, undefined map) by returning null / leaving the map untouched.
// Referrals, deposits and rush-premiums are explicitly OUT (follow-up).
// ---------------------------------------------------------------------------

export type LightweightRelationshipTier = 'Unknown' | 'Acquaintance' | 'Friendly' | 'Regular' | 'Loyal';

const LIGHTWEIGHT_TIER_RANK: Record<LightweightRelationshipTier, number> = {
  Unknown: 0,
  Acquaintance: 1,
  Friendly: 2,
  Regular: 3,
  Loyal: 4,
};

export function tierRankForRelationship(tier: string | undefined): number {
  return (LIGHTWEIGHT_TIER_RANK as Record<string, number>)[tier ?? 'Unknown'] ?? 0;
}

/** Stable map key from client identity. Plain string — survives save/load. */
export function buildClientRelationshipKey(clientName: string, clientType?: string): string {
  const name = (clientName || '').trim().toLowerCase();
  const type = (clientType || '').trim().toLowerCase();
  return `${name}|${type}`;
}

/** Issue #10 tier thresholds: sessions gate Acquaintance, xp gates the rest. */
export function tierForClientRelationship(xp: number, sessionsCompleted: number): ClientRelationshipTier {
  if (sessionsCompleted < 1) return 'Unknown';
  if (xp >= 500) return 'Loyal';
  if (xp >= 250) return 'Regular';
  if (xp >= 100) return 'Friendly';
  return 'Acquaintance';
}

/** XP for one delivery: quality clamped to 0-100, halved (floored) on Poor match. */
export function relationshipXpForDelivery(overallQualityScore: number, matchRating?: string): number {
  const quality = Number.isFinite(overallQualityScore)
    ? Math.max(0, Math.min(100, Math.round(overallQualityScore)))
    : 0;
  return matchRating === 'Poor' ? Math.floor(quality / 2) : quality;
}

export interface DeliveryClient {
  clientKey: string;
  clientName: string;
  primaryGenre: string;
  matchRating?: string;
}

/**
 * Resolve the stable client identity for a delivered project.
 * Returns null when the project carries no usable client info (silent skip).
 */
export function resolveDeliveryClient(
  project: { clientName?: string; clientType?: string; genre?: string; matchRating?: string } | null | undefined
): DeliveryClient | null {
  if (!project) return null;
  const clientName = (project.clientName || '').trim();
  if (!clientName) return null;
  return {
    clientKey: buildClientRelationshipKey(clientName, project.clientType),
    clientName,
    primaryGenre: (project.genre || '').trim() || 'Unknown',
    matchRating: project.matchRating,
  };
}

/** Find the delivered project in state by report id. Guards every collection. */
export function findProjectForReport(
  state: GameState,
  projectId: string | undefined
): { id?: string; title?: string; followUpOf?: string; stages?: { stageName: string; completed?: boolean }[]; clientName?: string; clientType?: string; genre?: string; matchRating?: string } | null {
  if (!state || !projectId) return null;
  const activeSingle = state.activeProject;
  if (activeSingle && activeSingle.id === projectId) return activeSingle;
  const lists = [state.activeProjects, state.availableProjects];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const found = list.find(p => p && p.id === projectId);
    if (found) return found;
  }
  return null;
}

export interface AppliedClientRelationship {
  relationships: Record<string, ClientRelationship>;
  record: ClientRelationship;
  previousTier: ClientRelationshipTier;
  isNewClient: boolean;
  xpGained: number;
}

/** Pure map update for one delivery. Never mutates the input map. */
export function applyDeliveryToClientRelationships(
  existing: Record<string, ClientRelationship> | undefined,
  opts: {
    clientKey: string;
    clientName: string;
    primaryGenre: string;
    qualityScore: number;
    matchRating?: string;
    currentDay: number;
    /** Origin perk multiplier on relationship XP (default 1). */
    xpMultiplier?: number;
  }
): AppliedClientRelationship {
  const prev = existing?.[opts.clientKey];
  const xpGained = Math.round(
    relationshipXpForDelivery(opts.qualityScore, opts.matchRating) *
      Math.max(1, Math.min(3, opts.xpMultiplier ?? 1))
  );
  const sessionsCompleted = (prev?.sessionsCompleted ?? 0) + 1;
  const xp = Math.max(0, Math.floor((prev?.relationshipXp ?? 0) + xpGained));
  const tier = tierForClientRelationship(xp, sessionsCompleted);
  const previousTier: ClientRelationshipTier = prev?.tier ?? 'Unknown';
  const day = Number.isFinite(opts.currentDay) ? Math.max(0, Math.floor(opts.currentDay)) : 0;
  const quality = Number.isFinite(opts.qualityScore)
    ? Math.max(0, Math.min(100, Math.round(opts.qualityScore)))
    : 0;
  const record: ClientRelationship = {
    clientId: prev?.clientId ?? opts.clientKey,
    clientName: prev?.clientName ?? opts.clientName,
    primaryGenre: prev?.primaryGenre ?? opts.primaryGenre,
    relationshipXp: xp,
    tier,
    sessionsCompleted,
    lastSessionDay: day,
    bestQualityScore: Math.max(prev?.bestQualityScore ?? 0, quality),
    referralCount: prev?.referralCount ?? 0,
  };
  return {
    relationships: { ...(existing ?? {}), [opts.clientKey]: record },
    record,
    previousTier,
    isNewClient: !prev,
    xpGained,
  };
}

/** One-line review note for the tier movement. Always plain text. */
export function buildRelationshipSnippet(
  clientName: string,
  previousTier: ClientRelationshipTier,
  nextTier: ClientRelationshipTier,
  qualityScore: number
): string {
  const name = (clientName || '').trim();
  if (!name) return '';
  if (tierRankForRelationship(nextTier) > tierRankForRelationship(previousTier)) {
    return ` Your relationship with ${name} grew to ${nextTier}.`;
  }
  if (!Number.isFinite(qualityScore) || qualityScore < 40) {
    return ` Your standing with ${name} barely moved - they'll need a stronger session.`;
  }
  return ` Your relationship with ${name} holds at ${nextTier}.`;
}

/** Repeat offers vouch one step up: Poor -> Good -> Excellent. */
export function bumpMatchRatingForReturn(matchRating: 'Poor' | 'Good' | 'Excellent'): 'Poor' | 'Good' | 'Excellent' {
  if (matchRating === 'Poor') return 'Good';
  if (matchRating === 'Good') return 'Excellent';
  return 'Excellent';
}
