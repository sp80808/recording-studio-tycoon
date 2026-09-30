import { GameState, Project, StudioRoomType } from '@/types/game';
import { StudioSynergy, SynergyBonuses } from '@/types/synergy';
import { activeChainSlots } from '@/rpg/signalChain';
import { STUDIO_SYNERGIES } from '@/data/synergies';

/**
 * Returns the effective studio room type for a project.
 */
export function getProjectRoomType(project: Project, gameState: Pick<GameState, 'studioRooms'>): StudioRoomType {
  const roomId = project.bookingRoomId || 'studio-a';
  const room = (gameState.studioRooms || []).find(r => r.id === roomId);
  return room ? room.type : 'project-studio';
}

/**
 * Evaluates all authored Studio Synergies against a given project and game state.
 * Returns only the active synergies whose criteria are fully satisfied.
 */
export function evaluateProjectSynergies(
  project: Project,
  gameState: GameState,
  catalog: StudioSynergy[] = STUDIO_SYNERGIES
): StudioSynergy[] {
  if (!project) return [];

  const projectRoomType = getProjectRoomType(project, gameState);
  const assignedStaff = (gameState.hiredStaff || []).filter(
    s => s.assignedProjectId === project.id
  );
  const ownedCategories = new Set(
    (gameState.ownedEquipment || []).map(e => e.category)
  );
  const ownedEquipmentIds = new Set(
    (gameState.ownedEquipment || []).map(e => e.id)
  );

  // Client relationship tier lookup
  const clientRel = project.clientId && gameState.clientRelationships
    ? gameState.clientRelationships[project.clientId]
    : undefined;
  const clientTier = clientRel?.tier;

  return catalog.filter(synergy => {
    const { criteria } = synergy;

    // 1. Room Type criteria (at least one must match)
    if (criteria.roomTypes && criteria.roomTypes.length > 0) {
      if (!criteria.roomTypes.includes(projectRoomType)) {
        return false;
      }
    }

    // 1b. Chain-aware criteria (#86): with a chosen chain, the slots must be filled
    // by the selected gear, not merely owned somewhere in storage.
    const chainSlots = project.signalChain ? activeChainSlots(project, gameState) : null;
    if (criteria.chainSlots && chainSlots) {
      if (!criteria.chainSlots.every(slot => chainSlots.includes(slot))) return false;
    }

    // 2. Equipment Category criteria (all required categories must be owned)
    if (criteria.requiredEquipmentCategories && criteria.requiredEquipmentCategories.length > 0 && !(criteria.chainSlots && chainSlots)) {
      const hasAllCategories = criteria.requiredEquipmentCategories.every(cat =>
        ownedCategories.has(cat)
      );
      if (!hasAllCategories) return false;
    }

    // 3. Specific Equipment IDs (all required IDs must be owned)
    if (criteria.requiredEquipmentIds && criteria.requiredEquipmentIds.length > 0) {
      const hasAllIds = criteria.requiredEquipmentIds.every(id => ownedEquipmentIds.has(id));
      if (!hasAllIds) return false;
    }

    // 4. Staff Count
    if (criteria.minStaffCount !== undefined) {
      if (assignedStaff.length < criteria.minStaffCount) {
        return false;
      }
    }

    // 5. Staff Roles
    if (criteria.anyStaffRoles && criteria.anyStaffRoles.length > 0) {
      const hasAnyRole = assignedStaff.some(s => criteria.anyStaffRoles!.includes(s.role));
      if (!hasAnyRole) return false;
    }
    if (criteria.requiredStaffRoles && criteria.requiredStaffRoles.length > 0) {
      const staffRoles = new Set(assignedStaff.map(s => s.role));
      const hasAllRoles = criteria.requiredStaffRoles.every(role => staffRoles.has(role));
      if (!hasAllRoles) return false;
    }

    // 6. Genre criteria
    if (criteria.genres && criteria.genres.length > 0) {
      const projectGenreLower = (project.genre || '').trim().toLowerCase();
      const genreMatches = criteria.genres.some(
        g => g.trim().toLowerCase() === projectGenreLower
      );
      if (!genreMatches) return false;
    }

    // 7. Client Relationship Tier criteria
    if (criteria.clientRelationshipTiers && criteria.clientRelationshipTiers.length > 0) {
      if (!clientTier || !criteria.clientRelationshipTiers.includes(clientTier)) {
        return false;
      }
    }

    // 8. Staff Creativity Stat
    if (criteria.minStaffCreativity !== undefined) {
      const maxCreativity = assignedStaff.reduce(
        (max, s) => Math.max(max, s.primaryStats?.creativity || 0),
        0
      );
      if (maxCreativity < criteria.minStaffCreativity) return false;
    }

    // 9. Staff Technical Stat
    if (criteria.minStaffTechnical !== undefined) {
      const maxTechnical = assignedStaff.reduce(
        (max, s) => Math.max(max, s.primaryStats?.technical || 0),
        0
      );
      if (maxTechnical < criteria.minStaffTechnical) return false;
    }

    return true;
  });
}

/**
 * Calculates aggregated bounded bonuses from a set of active synergies.
 * Upper clamps prevent compounding multipliers from breaking game balance (Issue #45).
 */
export function calculateSynergyBonuses(synergies: StudioSynergy[]): SynergyBonuses {
  let creativityMultiplier = 1;
  let technicalMultiplier = 1;
  let workUnitSpeedMultiplier = 1;
  let reviewQualityBonus = 0;
  let staffXpMultiplier = 1;

  for (const s of synergies) {
    if (s.bonuses.creativityMultiplier) creativityMultiplier *= s.bonuses.creativityMultiplier;
    if (s.bonuses.technicalMultiplier) technicalMultiplier *= s.bonuses.technicalMultiplier;
    if (s.bonuses.workUnitSpeedMultiplier) workUnitSpeedMultiplier *= s.bonuses.workUnitSpeedMultiplier;
    if (s.bonuses.reviewQualityBonus) reviewQualityBonus += s.bonuses.reviewQualityBonus;
    if (s.bonuses.staffXpMultiplier) staffXpMultiplier *= s.bonuses.staffXpMultiplier;
  }

  return {
    // Upper bounds as designed in #45
    creativityMultiplier: Math.min(1.6, Number(creativityMultiplier.toFixed(2))),
    technicalMultiplier: Math.min(1.6, Number(technicalMultiplier.toFixed(2))),
    workUnitSpeedMultiplier: Math.min(1.5, Number(workUnitSpeedMultiplier.toFixed(2))),
    reviewQualityBonus: Math.min(12, Math.round(reviewQualityBonus)),
    staffXpMultiplier: Math.min(1.8, Number(staffXpMultiplier.toFixed(2))),
  };
}

/**
 * Compares active synergies against currently discovered IDs.
 * Returns newly discovered synergies and the new combined list of discovered IDs.
 */
export function recordDiscoveredSynergies(
  currentDiscovered: string[] = [],
  activeSynergies: StudioSynergy[]
): { newlyDiscovered: StudioSynergy[]; updatedDiscovered: string[] } {
  const discoveredSet = new Set(currentDiscovered);
  const newlyDiscovered: StudioSynergy[] = [];

  for (const s of activeSynergies) {
    if (!discoveredSet.has(s.id)) {
      newlyDiscovered.push(s);
      discoveredSet.add(s.id);
    }
  }

  return {
    newlyDiscovered,
    updatedDiscovered: Array.from(discoveredSet),
  };
}
