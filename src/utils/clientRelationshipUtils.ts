import { ClientRelationship, ClientRelationshipTier, Project } from '@/types/game';

const TIER_THRESHOLDS: Array<{ tier: ClientRelationshipTier; xp: number }> = [
  { tier: 'Unknown', xp: 0 },
  { tier: 'Acquaintance', xp: 10 },
  { tier: 'Friendly', xp: 30 },
  { tier: 'Regular', xp: 65 },
  { tier: 'Loyal', xp: 110 },
  { tier: 'Advocate', xp: 170 }
];

export const getClientRelationshipTier = (relationshipXp: number): ClientRelationshipTier => {
  let tier: ClientRelationshipTier = 'Unknown';

  for (const threshold of TIER_THRESHOLDS) {
    if (relationshipXp >= threshold.xp) tier = threshold.tier;
  }

  return tier;
};

export const createClientRelationshipFromProject = (
  project: Project,
  currentDay: number
): ClientRelationship | null => {
  if (!project.clientId || !project.clientName) return null;

  return {
    clientId: project.clientId,
    clientName: project.clientName,
    primaryGenre: project.genre,
    relationshipXp: 0,
    tier: 'Unknown',
    sessionsCompleted: 0,
    lastSessionDay: currentDay,
    bestQualityScore: 0,
    referralCount: 0
  };
};

export const applyCompletedSessionToRelationship = (
  relationship: ClientRelationship,
  qualityScore: number,
  currentDay: number
): ClientRelationship => {
  const qualityXp =
    qualityScore >= 90 ? 24 :
    qualityScore >= 80 ? 18 :
    qualityScore >= 70 ? 13 :
    qualityScore >= 55 ? 9 :
    qualityScore >= 40 ? 5 : 2;

  const repeatClientBonus = relationship.sessionsCompleted > 0 ? 2 : 0;
  const relationshipXp = Math.max(0, relationship.relationshipXp + qualityXp + repeatClientBonus);
  const tier = getClientRelationshipTier(relationshipXp);

  return {
    ...relationship,
    relationshipXp,
    tier,
    sessionsCompleted: relationship.sessionsCompleted + 1,
    lastSessionDay: currentDay,
    bestQualityScore: Math.max(relationship.bestQualityScore, qualityScore)
  };
};
