import { EntityId, GenreId, MoodId, ProjectId } from './common.types';

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

  constructor(initialClients: Client[], initialRecordLabels: RecordLabel[]) {
    initialClients.forEach(c => this.clients.set(c.id, c));
    initialRecordLabels.forEach(rl => this.recordLabels.set(rl.id, rl));
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
