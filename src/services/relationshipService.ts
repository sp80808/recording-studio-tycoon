import { GameState, Project } from '@/types/game';
import { Client, RecordLabel, RelationshipStats, EntityType, RelationshipMap } from '@/types/relationships';
import { OriginalTrackProject } from '@/types/bands'; // For OriginalMusicProject success

// In-memory store for relationships. This would typically be part of GameState.
// For now, using a local let variable for demonstration.
// The GameState should eventually hold a `relationshipMap: RelationshipMap`
let entityRelationships: RelationshipMap = {};

// Helper to ensure an entity exists in the map
const ensureEntityRelationship = (entityId: string, entityType?: EntityType): RelationshipStats => {
  if (!entityRelationships[entityId]) {
    entityRelationships[entityId] = {
      relationshipScore: 50, // Start neutral
      trust: 50,
      respect: 50,
      lastInteractionDay: 0,
      interactionCount: 0,
      successfulProjects: 0,
      failedProjects: 0,
    };
    // console.log(`Initialized relationship for ${entityType || 'entity'} ${entityId}`);
  }
  return entityRelationships[entityId];
};

// Function to load relationships from GameState (if they were stored there)
export const loadRelationshipsFromState = (relationships: RelationshipMap | undefined) => {
  if (relationships) {
    entityRelationships = { ...relationships };
  } else {
    entityRelationships = {}; // Reset if nothing in game state
  }
};

// Function to get all relationships (e.g., for saving)
export const getAllRelationships = (): RelationshipMap => {
  return { ...entityRelationships };
};


export const relationshipService = {
  /**
   * Gets the current relationship stats for a given entity.
   * @param entityId The ID of the client, record label, or other entity.
   * @returns The RelationshipStats object or a default neutral one if not found.
   */
  getRelationship: (entityId: string): RelationshipStats => {
    return ensureEntityRelationship(entityId);
  },

  /**
   * Increases the relationship score and related stats with an entity.
   * @param entityId ID of the entity.
   * @param amount Base amount to increase relationshipScore by.
   * @param reason A string key or description for why the relationship is increasing.
   * @param gameState Current game state for context (e.g., currentDay).
   */
  increaseRelationship: (
    entityId: string,
    amount: number,
    reason: string, // e.g., "PROJECT_COMPLETED_WELL", "FAVOR_DONE", "SUCCESSFUL_RELEASE"
    gameState: GameState
  ): RelationshipStats => {
    const currentRel = ensureEntityRelationship(entityId);
    let scoreIncrease = amount;
    let trustIncrease = 0;
    let respectIncrease = 0;

    switch (reason) {
      case 'PROJECT_COMPLETED_ON_TIME':
        trustIncrease = Math.floor(amount * 0.5);
        respectIncrease = Math.floor(amount * 0.2);
        break;
      case 'PROJECT_HIGH_QUALITY':
        respectIncrease = Math.floor(amount * 0.6);
        trustIncrease = Math.floor(amount * 0.3);
        break;
      case 'SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL': // Assuming entityId is labelId
        scoreIncrease = amount * 1.5; // Bigger impact
        respectIncrease = amount;
        break;
      case 'PLAYER_FAVOR_COMPLETED':
        trustIncrease = amount;
        break;
      default: // Generic increase
        trustIncrease = Math.floor(amount * 0.1);
        respectIncrease = Math.floor(amount * 0.1);
        break;
    }
    
    currentRel.relationshipScore = Math.min(100, currentRel.relationshipScore + scoreIncrease);
    currentRel.trust = Math.min(100, currentRel.trust + trustIncrease);
    currentRel.respect = Math.min(100, currentRel.respect + respectIncrease);
    currentRel.interactionCount += 1;
    currentRel.lastInteractionDay = gameState.currentDay;
    
    if (reason.startsWith('PROJECT_') && (reason.includes('WELL') || reason.includes('QUALITY'))) {
        currentRel.successfulProjects +=1;
    }

    entityRelationships[entityId] = currentRel;
    console.log(`Relationship with ${entityId} increased by ${scoreIncrease} due to ${reason}. New score: ${currentRel.relationshipScore}`);
    return { ...currentRel };
  },

  /**
   * Decreases the relationship score and related stats with an entity.
   * @param entityId ID of the entity.
   * @param amount Base amount to decrease relationshipScore by (positive number).
   * @param reason A string key or description for why the relationship is decreasing.
   * @param gameState Current game state for context.
   */
  decreaseRelationship: (
    entityId: string,
    amount: number,
    reason: string, // e.g., "PROJECT_LATE", "PROJECT_POOR_QUALITY", "FAVOR_REJECTED"
    gameState: GameState
  ): RelationshipStats => {
    const currentRel = ensureEntityRelationship(entityId);
    let scoreDecrease = amount;
    let trustDecrease = 0;
    let respectDecrease = 0;

    switch (reason) {
      case 'PROJECT_LATE':
        trustDecrease = Math.floor(amount * 0.7);
        break;
      case 'PROJECT_POOR_QUALITY':
        respectDecrease = Math.floor(amount * 0.6);
        trustDecrease = Math.floor(amount * 0.4);
        break;
      case 'FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL':
        scoreDecrease = amount * 1.5;
        respectDecrease = amount;
        break;
      case 'PLAYER_FAVOR_REJECTED':
        trustDecrease = amount;
        break;
      default: // Generic decrease
        trustDecrease = Math.floor(amount * 0.1);
        respectDecrease = Math.floor(amount * 0.1);
        break;
    }

    currentRel.relationshipScore = Math.max(0, currentRel.relationshipScore - scoreDecrease);
    currentRel.trust = Math.max(0, currentRel.trust - trustDecrease);
    currentRel.respect = Math.max(0, currentRel.respect - respectDecrease);
    currentRel.interactionCount += 1;
    currentRel.lastInteractionDay = gameState.currentDay;

    if (reason.startsWith('PROJECT_') && (reason.includes('LATE') || reason.includes('POOR_QUALITY'))) {
        currentRel.failedProjects +=1;
    }
    
    entityRelationships[entityId] = currentRel;
    console.log(`Relationship with ${entityId} decreased by ${scoreDecrease} due to ${reason}. New score: ${currentRel.relationshipScore}`);
    return { ...currentRel };
  },

  /**
   * Logic to trigger relationship updates based on project completion.
   * This would be called when a project is finalized.
   * @param project The completed project.
   * @param gameState Current game state.
   */
  handleProjectCompletion: (project: Project, gameState: GameState) => {
    // Assuming project.clientType could be an entityId or map to one.
    // For now, let's assume project.associatedBandId could be a client if it's not player's band,
    // or project.clientType refers to a specific client/label ID.
    // This part needs more context on how clients/labels are linked to projects.
    
    const entityId = project.clientType; // Placeholder: This needs to be the actual ID of the client/label
    if (!entityId || typeof entityId !== 'string') return; // No specific client/label to update relationship with

    // Example: If project is for a Record Label and it's an OriginalMusicProject
    // if (project.clientType === 'RecordLabel' && (project as any).originalTrackDetails) {
    //   const originalProject = project as any as OriginalTrackProject; // Needs proper typing
    //   if (project.qualityScore && project.qualityScore > 80) {
    //     relationshipService.increaseRelationship(entityId, 20, 'SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL', gameState);
    //   } else if (project.qualityScore && project.qualityScore < 50) {
    //     relationshipService.decreaseRelationship(entityId, 15, 'FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL', gameState);
    //   }
    // } else { // For general contract projects
      if (project.qualityScore && project.qualityScore > 75) {
        relationshipService.increaseRelationship(entityId, 10 + Math.floor(project.qualityScore / 10), 'PROJECT_HIGH_QUALITY', gameState);
      } else if (project.qualityScore && project.qualityScore < 40) {
        relationshipService.decreaseRelationship(entityId, 10 + Math.floor((50 - project.qualityScore) / 5), 'PROJECT_POOR_QUALITY', gameState);
      }
      // Add checks for timeliness if project has deadline and completion date
    // }
  },
  
  // TODO: Add methods for player-initiated "favors" and their impact.
};

// Example of how to integrate into GameState:
// In GameState interface:
// relationships: RelationshipMap;

// In INITIAL_GAME_STATE:
// relationships: {},

// When loading game:
// loadRelationshipsFromState(savedGame.relationships);

// When saving game:
// relationships: getAllRelationships(),
