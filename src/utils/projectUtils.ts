import { Project, ProjectStage, StaffMember, StageEvent, MinigameType, StudioSkillType, GameState } from '@/types/game';
import { MusicGenre } from '@/types/charts'; // SubGenre was imported but not used directly
import { generateAIBand } from '@/utils/bandUtils';
import { ERA_DEFINITIONS, getGenrePopularity } from '@/utils/eraProgression';
import { projectTemplates } from '@/data/projectTemplates';
import { marketService } from '@/services/marketService';
import { relationshipService } from '@/services/relationshipService';
import { Client, RecordLabel } from '@/types/relationships'; // Import Client and RecordLabel

const genresList = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic', 'Jazz', 'Classical', 'Folk', 'R&B'] as const;
// const clientTypesList = ['Independent', 'Record Label', 'Commercial', 'Streaming'] as const; // Not directly used

const calculateMultipliers = (project: Pick<Project, 'genre' | 'difficulty'>, currentEra: string, playerLevel: number) => {
  const projectGenreForEra = project.genre as MusicGenre;
  const genrePop = getGenrePopularity(projectGenreForEra, currentEra);
  const marketMultiplier = 0.8 + Math.random() * 0.4;
  const difficultyMultiplier = 1 + (project.difficulty - 1) * 0.15;
  const eraPopularityMultiplier = genrePop / 100;
  const playerLevelMultiplier = 1 + (playerLevel * 0.05);

  return {
    marketMultiplier,
    difficultyMultiplier,
    eraPopularityMultiplier,
    playerLevelMultiplier
  };
};

const generateStageEvents = (stage: ProjectStage, difficulty: number): ProjectStage => {
  const eventChance = Math.min(0.3, 0.1 + (difficulty * 0.02));
  if (Math.random() < eventChance) {
    const challengeTypes = ['technical', 'creative', 'client'] as const;
    const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    let eventType: StageEvent['type'];
    switch (challengeType) {
      case 'technical': eventType = 'technical_challenge'; break;
      case 'creative': eventType = 'creative_challenge'; break;
      case 'client': eventType = 'client_request'; break;
      default: eventType = 'choice';
    }
    const newEvent: StageEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: eventType,
      description: `${challengeType} challenge encountered.`,
      triggerCondition: () => true,
      active: true,
      choices: [{
        text: "Address challenge",
        effects: [{ type: 'quality', value: challengeType === 'creative' ? 0.1 : 0.05 }]
      }]
    };
    if (!stage.specialEvents) stage.specialEvents = [];
    stage.specialEvents.push(newEvent);
  }
  return stage;
};

export const generateNewProjects = (
  count: number,
  playerLevel: number = 1,
  currentEra: string = 'analog60s',
  gameState?: GameState // Add gameState to access clients and labels
): Project[] => {
  const projects: Project[] = [];
  const usedTitles = new Set<string>();

  const availableClients: Client[] = gameState?.clients || [];
  const availableLabels: RecordLabel[] = gameState?.recordLabels || [];

  const currentEraDefinition = ERA_DEFINITIONS.find(era => era.id === currentEra);
  const availableGenres = currentEraDefinition?.availableGenres || ['Rock', 'Folk', 'Soul', 'Motown', 'Country', 'Jazz'];

  const eraAppropriateTemplates = projectTemplates.filter(template =>
    availableGenres.includes(template.genre) &&
    template.era === currentEra &&
    template.difficulty <= Math.min(10, playerLevel + 2)
  );

  if (eraAppropriateTemplates.length === 0) {
    console.warn(`No appropriate project templates found for era: ${currentEra} and player level: ${playerLevel}`);
    return [];
  }

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let project: Project;

    do {
      const template = eraAppropriateTemplates[Math.floor(Math.random() * eraAppropriateTemplates.length)];
      const title = template.titlePattern.replace('{genre}', template.genre);
      const difficultyVariation = Math.random() * 2 - 1;
      const finalDifficulty = Math.max(1, Math.min(10, template.difficulty + Math.floor(difficultyVariation)));

      const stages: ProjectStage[] = template.stages.map(stageTemplate => {
        const workUnitsVariation = Math.floor(Math.random() * 4 - 2);
        const baseStage: ProjectStage = {
          stageName: stageTemplate.stageName,
          focusAreas: stageTemplate.focusAreas,
          workUnitsBase: Math.max(4, stageTemplate.workUnitsBase + workUnitsVariation),
          workUnitsCompleted: 0,
          completed: false,
          requiredSkills: stageTemplate.requiredSkills as Record<string, number> | undefined,
          stageBonuses: stageTemplate.stageBonuses,
          minigameTriggerId: stageTemplate.minigameTriggerId as MinigameType | undefined
        };
        return generateStageEvents(baseStage, finalDifficulty);
      });

      const minimalProjectForMultipliers: Pick<Project, 'genre' | 'difficulty'> = {
        genre: template.genre,
        difficulty: finalDifficulty,
      };
      const multipliers = calculateMultipliers(minimalProjectForMultipliers, currentEra, playerLevel);

      const projectGenre = template.genre as MusicGenre;
      const subGenresForGenre = marketService.getAllSubGenres().filter(sg => sg.parentGenre === projectGenre);
      const projectSubGenreId = subGenresForGenre.length > 0 && Math.random() < 0.3 ?
                                subGenresForGenre[Math.floor(Math.random() * subGenresForGenre.length)].id :
                                undefined;

      const currentGenrePopularity = marketService.getCurrentPopularity(projectGenre, projectSubGenreId);
      let marketTrendPayoutModifier = 1.0;
      if (currentGenrePopularity < 30) marketTrendPayoutModifier = 0.7 + (currentGenrePopularity / 30) * 0.3;
      else if (currentGenrePopularity > 70) marketTrendPayoutModifier = 1.0 + ((currentGenrePopularity - 70) / 30) * 0.3;
      marketTrendPayoutModifier = Math.max(0.5, Math.min(1.5, marketTrendPayoutModifier));

      let relationshipModifier = 1.0;
      let chosenProviderId: string | undefined = undefined;
      let chosenProviderType: Project['contractProviderType'] = undefined;

      // Updated provider selection logic
      if (template.clientType === 'Record Label' && availableLabels.length > 0) {
        // TODO: Implement more sophisticated selection based on relationship, genre preference, etc.
        // For now, pick a random available label.
        const suitableLabels = availableLabels.filter(label => 
          label.preferredGenres.includes(projectGenre) || // Prefers project genre
          relationshipService.getRelationship(label.id).relationshipScore > 40 // Or has decent relationship
        );
        const selectedLabel = suitableLabels.length > 0 
          ? suitableLabels[Math.floor(Math.random() * suitableLabels.length)]
          : availableLabels[Math.floor(Math.random() * availableLabels.length)]; // Fallback to any label
        
        chosenProviderId = selectedLabel.id;
        chosenProviderType = 'recordLabel';
      } else if (template.clientType === 'Commercial' && availableClients.length > 0) {
        // TODO: Implement more sophisticated selection for clients
        const suitableClients = availableClients.filter(client =>
          client.preferredGenres.includes(projectGenre) ||
          relationshipService.getRelationship(client.id).relationshipScore > 30
        );
        const selectedClient = suitableClients.length > 0
          ? suitableClients[Math.floor(Math.random() * suitableClients.length)]
          : availableClients[Math.floor(Math.random() * availableClients.length)]; // Fallback to any client

        chosenProviderId = selectedClient.id;
        chosenProviderType = 'client';
      }
      // If no specific provider found, chosenProviderId remains undefined, and project might be considered 'Independent' or self-funded.

      if (chosenProviderId) {
        const relationshipStats = relationshipService.getRelationship(chosenProviderId);
        const relationshipScore = relationshipStats.relationshipScore;
        if (relationshipScore > 75) relationshipModifier = 1.25;
        else if (relationshipScore > 50) relationshipModifier = 1.1;
        else if (relationshipScore < 30) relationshipModifier = 0.85;
        // TODO: Further influence payout/difficulty based on provider's profile (e.g., budgetRange, qualityExpectation)
      }


      const finalPayout = Math.floor(template.payoutBase *
        multipliers.marketMultiplier *
        multipliers.difficultyMultiplier *
        multipliers.eraPopularityMultiplier *
        multipliers.playerLevelMultiplier *
        marketTrendPayoutModifier *
        relationshipModifier);

      const finalRep = Math.floor(template.repGainBase *
        multipliers.difficultyMultiplier *
        multipliers.eraPopularityMultiplier *
        multipliers.playerLevelMultiplier *
        relationshipModifier);

      const finalDuration = Math.max(3, template.durationDaysTotal + Math.floor(Math.random() * 3 - 1));

      const requiredSkillsForProject: Partial<Record<StudioSkillType, number>> = {};
      stages.forEach(stage => {
        if (stage.requiredSkills) {
          Object.entries(stage.requiredSkills).forEach(([skill, level]) => {
            const skillKey = skill as StudioSkillType;
            if (level !== undefined) {
              if (!requiredSkillsForProject[skillKey] || (requiredSkillsForProject[skillKey] as number) < level) {
                requiredSkillsForProject[skillKey] = level;
              }
            }
          });
        }
      });
      const matchRating: 'Poor' | 'Good' | 'Excellent' =
        finalDifficulty <= playerLevel ? 'Excellent' :
        finalDifficulty <= playerLevel + 2 ? 'Good' : 'Poor';

      const associatedBand = generateAIBand(projectGenre); // This might need gameState too if bands are managed there

      project = {
        id: `project-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
        title,
        genre: projectGenre,
        subGenreId: projectSubGenreId,
        clientType: chosenProviderId ? template.clientType : 'Independent', // Default to Independent if no provider
        difficulty: finalDifficulty,
        payoutBase: finalPayout,
        repGainBase: finalRep,
        durationDaysTotal: finalDuration,
        requiredSkills: requiredSkillsForProject,
        matchRating,
        stages,
        currentStageIndex: 0,
        completedStages: [],
        accumulatedCPoints: 0,
        accumulatedTPoints: 0,
        workSessionCount: 0,
        associatedBandId: associatedBand.id, // This might be for original music projects
        qualityScore: 0,
        efficiencyScore: 0,
        isCompleted: false,
        endDate: undefined,
        lastWorkDay: undefined,
        targetMood: undefined,
        deadlineDay: finalDuration + 7 + Math.floor(Math.random() * 7),
        contractProviderId: chosenProviderId,
        contractProviderType: chosenProviderType,
      };

      attempts++;
    } while (usedTitles.has(project.title) && attempts < 50);

    usedTitles.add(project.title);
    projects.push(project);
  }

  return projects;
};

export const generateCandidates = (count: number, gameState?: GameState): StaffMember[] => {
  const names = [
    'Alex Rivera', 'Sam Chen', 'Jordan Blake', 'Casey Smith', 'Taylor Johnson',
    'Morgan Davis', 'Riley Parker', 'Avery Wilson', 'Quinn Martinez', 'Sage Thompson',
    'Jamie Lee', 'Chris Evans', 'Patty O\'Malley', 'Drew Barry', 'Kelly Clarkson',
    'Ryan Gosling', 'Emma Stone', 'Tom Hanks', 'Meryl Streep', 'Denzel Washington'
  ];
  const roles: StaffMember['role'][] = ['Engineer', 'Producer', 'Songwriter', 'Mix Engineer', 'Mastering Engineer', 'Sound Designer'];
  const staffGenres = [...genresList];
  const candidates: StaffMember[] = [];

  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const hasAffinity = Math.random() > 0.6;

    const candidate: StaffMember = {
      id: `candidate-${Date.now()}-${i}`,
      name: names[Math.floor(Math.random() * names.length)],
      role,
      primaryStats: {
        creativity: 15 + Math.floor(Math.random() * 25),
        technical: 15 + Math.floor(Math.random() * 25),
        speed: 15 + Math.floor(Math.random() * 25)
      },
      xpInRole: 0,
      levelInRole: 1,
      genreAffinity: hasAffinity ? {
        genre: staffGenres[Math.floor(Math.random() * staffGenres.length)] as string,
        bonus: 10 + Math.floor(Math.random() * 15)
      } : null,
      mood: 75,
      salary: 80 + Math.floor(Math.random() * 120),
      status: 'Idle',
      assignedProjectId: null,
      contractEndDate: 0,
      experience: 0,
      skills: {},
    };

    if (gameState && gameState.aggregatedPerkModifiers?.candidateQualityBonus) {
      const bonus = gameState.aggregatedPerkModifiers.candidateQualityBonus;
      if (typeof bonus === 'number') { // Ensure bonus is a number before adding
        candidate.primaryStats.creativity = Math.min(100, candidate.primaryStats.creativity + bonus);
        candidate.primaryStats.technical = Math.min(100, candidate.primaryStats.technical + bonus);
      }
    }

    candidates.push(candidate);
  }
  return candidates;
};

export const calculateProjectDifficulty = (project: Project): number => {
  const totalWorkUnits = project.stages.reduce((sum, stage) => sum + stage.workUnitsBase, 0);
  const baseComplexity = totalWorkUnits / 10;

  const projectGenreForComplexity = project.genre as MusicGenre;
  const genreComplexity = projectGenreForComplexity === 'electronic' ? 1.2 :
                           projectGenreForComplexity === 'hip-hop' ? 1.1 :
                           projectGenreForComplexity === 'acoustic' ? 0.9 : 1.0;

  const eventMultiplier = project.stages.some(stage => stage.specialEvents && stage.specialEvents.length > 0) ? 1.2 : 1.0;

  return Math.min(10, Math.max(1, Math.floor(baseComplexity * genreComplexity * eventMultiplier)));
};

export const getProjectRequirements = (project: Project) => {
  const requirements = {
    minPlayerLevel: Math.max(1, Math.floor(project.difficulty / 2)),
    recommendedSkillLevel: Math.max(1, Math.floor(project.difficulty / 3)),
    estimatedWorkSessions: project.stages.reduce((sum, stage) => sum + Math.ceil(stage.workUnitsBase / 3), 0)
  };

  return requirements;
};
