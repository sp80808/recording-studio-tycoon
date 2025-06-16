import { GameState, Project } from '@/types/game';
import { RelationshipStats, RelationshipMap, EntityType } from '@/types/relationships';

let entityRelationships: RelationshipMap = {};

const ensureEntityRelationship = (entityId: string, entityType?: EntityType): RelationshipStats => {
  if (!entityRelationships[entityId]) {
    entityRelationships[entityId] = {
      relationshipScore: 50,
      trust: 50,
      respect: 50,
      lastInteractionDay: 0,
      interactionCount: 0,
      successfulProjects: 0,
      failedProjects: 0,
      isBlacklisted: false, // Initialize isBlacklisted
    };
  }
  // Ensure isBlacklisted exists if the object was created before this field was added
  if (entityRelationships[entityId].isBlacklisted === undefined) {
    entityRelationships[entityId].isBlacklisted = false;
  }
  return entityRelationships[entityId];
};

export const loadRelationshipsFromState = (relationships: RelationshipMap | undefined) => {
  if (relationships) {
    entityRelationships = { ...relationships };
    // Ensure all loaded relationships have the isBlacklisted field
    Object.keys(entityRelationships).forEach(id => {
      if (entityRelationships[id].isBlacklisted === undefined) {
        entityRelationships[id].isBlacklisted = false;
      }
    });
  } else {
    entityRelationships = {};
  }
};

export const getAllRelationships = (): RelationshipMap => {
  return { ...entityRelationships };
};

export const relationshipService = {
  getRelationship: (entityId: string): RelationshipStats => {
    return ensureEntityRelationship(entityId);
  },

  increaseRelationship: (
    entityId: string,
    amount: number,
    reason: string,
    _gameState: GameState
  ): RelationshipStats => {
    const currentRel = ensureEntityRelationship(entityId);
    let scoreIncrease = amount;
    let trustIncrease = 0;
    let respectIncrease = 0;

    switch (reason) {
      case 'PROJECT_COMPLETED_ON_TIME':
      case 'PROJECT_COMPLETED_VERY_EARLY':
        trustIncrease = Math.floor(amount * 0.7);
        respectIncrease = Math.floor(amount * 0.1);
        break;
      case 'PROJECT_HIGH_QUALITY':
      case 'PROJECT_EXCELLENT_QUALITY':
        respectIncrease = Math.floor(amount * 0.7);
        trustIncrease = Math.floor(amount * 0.2);
        break;
      case 'SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL':
        scoreIncrease = amount * 1.5;
        respectIncrease = amount;
        trustIncrease = Math.floor(amount * 0.5);
        break;
      case 'PLAYER_FAVOR_COMPLETED':
        trustIncrease = amount;
        break;
      case 'AVERAGE_ORIGINAL_MUSIC_RELEASE_WITH_LABEL':
        respectIncrease = Math.floor(amount * 0.5);
        trustIncrease = Math.floor(amount * 0.2);
        break;
      default:
        trustIncrease = Math.floor(amount * 0.2);
        respectIncrease = Math.floor(amount * 0.2);
        break;
    }

    currentRel.relationshipScore = Math.min(100, currentRel.relationshipScore + scoreIncrease);
    currentRel.trust = Math.min(100, currentRel.trust + trustIncrease);
    currentRel.respect = Math.min(100, currentRel.respect + respectIncrease);
    currentRel.interactionCount += 1;
    currentRel.lastInteractionDay = _gameState.currentDay;

    if (reason.startsWith('PROJECT_') && (reason.includes('QUALITY') || reason.includes('EARLY') || reason.includes('ON_TIME'))) {
        currentRel.successfulProjects +=1;
    }
    
    // If relationship was bad enough to be blacklisted, a very positive interaction might lift it
    if (currentRel.isBlacklisted && currentRel.relationshipScore > 30 && reason !== 'BLACKLIST_LIFTED_MANUALLY') { // Example threshold to lift
        currentRel.isBlacklisted = false;
        console.log(`Blacklist lifted for ${entityId} due to improved relations.`);
        // Potentially trigger a positive PR event or notification
    }

    entityRelationships[entityId] = currentRel;
    console.log(`Relationship with ${entityId} increased by ${scoreIncrease} (Trust: +${trustIncrease}, Respect: +${respectIncrease}) due to ${reason}. New score: ${currentRel.relationshipScore}`);
    return { ...currentRel };
  },

  decreaseRelationship: (
    entityId: string,
    amount: number,
    reason: string,
    _gameState: GameState
  ): RelationshipStats => {
    const currentRel = ensureEntityRelationship(entityId);
    let scoreDecrease = amount;
    let trustDecrease = 0;
    let respectDecrease = 0;

    switch (reason) {
      case 'PROJECT_LATE':
        trustDecrease = Math.floor(amount * 0.8);
        break;
      case 'PROJECT_POOR_QUALITY':
      case 'PROJECT_SUBPAR_QUALITY':
        respectDecrease = Math.floor(amount * 0.7);
        trustDecrease = Math.floor(amount * 0.3);
        break;
      case 'FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL':
        scoreDecrease = amount * 1.5;
        respectDecrease = amount;
        trustDecrease = Math.floor(amount * 0.5);
        break;
      case 'PLAYER_FAVOR_REJECTED':
        trustDecrease = amount;
        break;
      default:
        trustDecrease = Math.floor(amount * 0.2);
        respectDecrease = Math.floor(amount * 0.2);
        break;
    }

    currentRel.relationshipScore = Math.max(0, currentRel.relationshipScore - scoreDecrease);
    currentRel.trust = Math.max(0, currentRel.trust - trustDecrease);
    currentRel.respect = Math.max(0, currentRel.respect - respectDecrease);
    currentRel.interactionCount += 1;
    currentRel.lastInteractionDay = _gameState.currentDay;

    if (reason.startsWith('PROJECT_') && (reason.includes('LATE') || reason.includes('QUALITY'))) {
        currentRel.failedProjects +=1;
    }

    entityRelationships[entityId] = currentRel; // Save intermediate state before blacklisting check
    console.log(`Relationship with ${entityId} decreased by ${scoreDecrease} (Trust: -${trustDecrease}, Respect: -${respectDecrease}) due to ${reason}. New score: ${currentRel.relationshipScore}`);

    const finalRel = relationshipService.checkAndApplyBlacklisting(entityId, { ...currentRel }, _gameState); // Pass a copy
    entityRelationships[entityId] = finalRel; // Store the final state after blacklisting check

    if (finalRel.relationshipScore < 20 && !finalRel.isBlacklisted) {
        // gameState = relationshipService.triggerPREvent('LOW_RELATIONSHIP_WARNING', entityId, gameState);
        console.log(`Low relationship with ${entityId} may trigger a PR event.`);
    }

    return { ...finalRel };
  },

  checkAndApplyBlacklisting: (entityId: string, currentRelStats: RelationshipStats, _gameState: GameState): RelationshipStats => {
    const relCopy = { ...currentRelStats }; // Work on a copy
    const BLACKLIST_THRESHOLD = 10;
    const FAILED_PROJECTS_BLACKLIST_THRESHOLD = 3;

    if (relCopy.isBlacklisted) {
      return relCopy;
    }

    let shouldBlacklist = false;
    let blacklistReason = "";

    if (relCopy.relationshipScore <= BLACKLIST_THRESHOLD) {
      shouldBlacklist = true;
      blacklistReason = `Relationship score dropped to ${relCopy.relationshipScore}.`;
    } else if (relCopy.failedProjects >= FAILED_PROJECTS_BLACKLIST_THRESHOLD && relCopy.interactionCount > FAILED_PROJECTS_BLACKLIST_THRESHOLD) {
      const successRatio = relCopy.successfulProjects > 0 || relCopy.failedProjects > 0 ? relCopy.successfulProjects / (relCopy.successfulProjects + relCopy.failedProjects) : 1;
      if (relCopy.failedProjects > relCopy.successfulProjects && successRatio < 0.25 && relCopy.interactionCount > 5) {
        shouldBlacklist = true;
        blacklistReason = `${relCopy.failedProjects} failed projects and low success ratio (${(successRatio * 100).toFixed(0)}%).`;
      }
    }

    if (shouldBlacklist) {
      relCopy.isBlacklisted = true;
      console.warn(`Entity ${entityId} has blacklisted the player. Reason: ${blacklistReason}`);
      
      // This is where you'd ideally update gameState with a notification
      // For now, we'll just log, as modifying gameState here directly is complex
      // and should be handled by the calling context (e.g., a game state hook)
      const notificationMessage = `You have been blacklisted by ${entityId}! They will no longer offer you projects. Reason: ${blacklistReason}`;
      console.error(notificationMessage); 
      // Example: gameState.notifications.push({ id: `notif-${Date.now()}`, message: notificationMessage, type: 'error', timestamp: Date.now() });
      // relationshipService.triggerPREvent('BLACKLISTED_BY_ENTITY', entityId, gameState); // This would also need to return new gameState
    }
    return relCopy;
  },

  triggerPREvent: (eventType: string, entityId: string | null, _gameState: GameState): GameState => {
    console.log(`PR Event triggered: ${eventType}, Entity: ${entityId || 'Global'}`);
    // This function would ideally return a new GameState with the PREvent added
    // and any immediate effects applied. For now, it's a placeholder.
    // Example:
    // const newEvent: PREvent = { /* define event based on eventType */ };
    // const updatedPREvents = [...(gameState.activePREvents || []), newEvent];
    // let updatedGameState = { ...gameState, activePREvents: updatedPREvents };
    // Apply immediate effects of newEvent to updatedGameState...
    // return updatedGameState;
    return _gameState; // Placeholder return
  },

  handleProjectCompletion: (project: Project, _gameState: GameState) => {
    const { contractProviderId, contractProviderType, qualityScore, endDate, deadlineDay, title } = project;

    if (!contractProviderId || !contractProviderType) {
      console.log(`Project ${title}: No specific contract provider. No relationship update.`);
      return;
    }

    const entityId = contractProviderId;
    let qualityReason = "";
    let qualityAmount = 0;
    let timelinessReason = "";
    let timelinessAmount = 0;

    if (qualityScore !== undefined) {
      if (qualityScore >= 85) {
        qualityReason = 'PROJECT_EXCELLENT_QUALITY'; qualityAmount = 15;
      } else if (qualityScore >= 65) {
        qualityReason = 'PROJECT_GOOD_QUALITY'; qualityAmount = 8;
      } else if (qualityScore < 40) {
        qualityReason = 'PROJECT_POOR_QUALITY'; qualityAmount = 12;
      } else if (qualityScore < 55) {
        qualityReason = 'PROJECT_SUBPAR_QUALITY'; qualityAmount = 6;
      }
    }

    if (endDate !== undefined && deadlineDay !== undefined) {
      const daysDifference = deadlineDay - endDate;
      if (daysDifference >= 0) {
        if (daysDifference > 7) { timelinessReason = 'PROJECT_COMPLETED_VERY_EARLY'; timelinessAmount = 10; }
        else { timelinessReason = 'PROJECT_COMPLETED_ON_TIME'; timelinessAmount = 5; }
      } else {
        const daysLate = Math.abs(daysDifference);
        timelinessReason = 'PROJECT_LATE';
        if (daysLate > 14) { timelinessAmount = 15; }
        else if (daysLate > 7) { timelinessAmount = 10; }
        else { timelinessAmount = 5; }
      }
    }

    if (qualityReason && qualityAmount > 0) {
      if (qualityReason.includes('POOR') || qualityReason.includes('SUBPAR')) {
        relationshipService.decreaseRelationship(entityId, qualityAmount, qualityReason, _gameState);
      } else {
        relationshipService.increaseRelationship(entityId, qualityAmount, qualityReason, _gameState);
      }
    }
    if (timelinessReason && timelinessAmount > 0) {
      if (timelinessReason.includes('LATE')) {
        relationshipService.decreaseRelationship(entityId, timelinessAmount, timelinessReason, _gameState);
      } else {
        relationshipService.increaseRelationship(entityId, timelinessAmount, timelinessReason, _gameState);
      }
    }

    if (contractProviderType === 'recordLabel' && project.associatedBandId && entityId) {
      const band = _gameState.bands?.find(b => b.id === project.associatedBandId);
      let releaseSuccessAmount = 0;
      let releaseReason = "";
      let successMetricScore = -1;

      if (band) {
        const latestRelease = band.pastReleases
          .filter(r => r.trackTitle.toLowerCase() === project.title.toLowerCase())
          .sort((a, b) => b.releaseDate - a.releaseDate)[0];

        if (latestRelease && typeof latestRelease.reviewScore === 'number') {
          successMetricScore = latestRelease.reviewScore * 10;
          console.log(`Original Track Release: ${project.title} by ${band.bandName}. Found BandRelease. Review Score (scaled): ${successMetricScore}`);
        }
      }

      if (successMetricScore === -1 && typeof project.qualityScore === 'number') {
        successMetricScore = project.qualityScore;
        console.log(`Original Track Release: ${project.title}. No specific BandRelease data. Using project quality score: ${successMetricScore}`);
      }

      if (successMetricScore !== -1) {
        if (successMetricScore >= 75) {
          releaseReason = 'SUCCESSFUL_ORIGINAL_MUSIC_RELEASE_WITH_LABEL';
          releaseSuccessAmount = (successMetricScore >= 90) ? 30 : 20;
          relationshipService.increaseRelationship(entityId, releaseSuccessAmount, releaseReason, _gameState);
        } else if (successMetricScore < 40) {
          releaseReason = 'FAILED_ORIGINAL_MUSIC_RELEASE_WITH_LABEL';
          releaseSuccessAmount = (successMetricScore < 20) ? 25 : 15;
          relationshipService.decreaseRelationship(entityId, releaseSuccessAmount, releaseReason, _gameState);
        } else if (successMetricScore >= 50) {
          releaseReason = 'AVERAGE_ORIGINAL_MUSIC_RELEASE_WITH_LABEL';
          releaseSuccessAmount = 5;
          relationshipService.increaseRelationship(entityId, releaseSuccessAmount, releaseReason, _gameState);
        } else {
          console.log(`Original Track Release: ${project.title}. Performance (score: ${successMetricScore}) was below average. No specific label relationship impact beyond standard project metrics for this release.`);
        }
      } else {
        console.warn(`Original Track Release: ${project.title}. Could not determine a success metric for label relationship impact.`);
      }
    }
  },

  initiatePlayerFavor: (entityId: string, favorType: string, _gameState: GameState) => {
    console.log(`Player is considering initiating favor of type '${favorType}' with entity ${entityId}.`);
    return { canProceed: true, message: `Favor '${favorType}' can be initiated.` };
  },

  resolvePlayerFavor: (
    entityId: string,
    favorType: string,
    success: boolean,
    _gameState: GameState,
    magnitude?: number
  ) => {
    const favorAmount = magnitude || 10;
    if (success) {
      console.log(`Player successfully completed favor '${favorType}' for ${entityId}.`);
      return relationshipService.increaseRelationship(entityId, favorAmount, 'PLAYER_FAVOR_COMPLETED', _gameState);
    } else {
      console.log(`Player failed or rejected favor '${favorType}' for ${entityId}.`);
      return relationshipService.decreaseRelationship(entityId, favorAmount, 'PLAYER_FAVOR_REJECTED', _gameState);
    }
  },
};
