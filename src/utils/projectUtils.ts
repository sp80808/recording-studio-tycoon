import { Project, ProjectStage, StaffMember, StageEvent, MinigameType, StudioSkillType } from '@/types/game';
import { MusicGenre } from '@/types/charts';
import { generateAIBand } from '@/utils/bandUtils';
import { ERA_DEFINITIONS, getGenrePopularity } from '@/utils/eraProgression';
import { projectTemplates } from '@/data/projectTemplates';
import { marketService } from '@/services/marketService';
import { relationshipService } from '@/services/relationshipService'; // Import relationshipService

const genresList = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic', 'Jazz', 'Classical', 'Folk', 'R&B'] as const;
const clientTypesList = ['Independent', 'Record Label', 'Commercial', 'Streaming'] as const;

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

export const generateNewProjects = (count: number, playerLevel: number = 1, currentEra: string = 'analog60s'): Project[] => {
  const projects: Project[] = [];
  const usedTitles = new Set<string>();
  
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
      
      const currentGenrePopularity = marketService.getCurrentPopularity(template.genre as MusicGenre);
      let marketTrendPayoutModifier = 1.0;
      if (currentGenrePopularity < 30) marketTrendPayoutModifier = 0.7 + (currentGenrePopularity / 30) * 0.3;
      else if (currentGenrePopularity > 70) marketTrendPayoutModifier = 1.0 + ((currentGenrePopularity - 70) / 30) * 0.3;
      marketTrendPayoutModifier = Math.max(0.5, Math.min(1.5, marketTrendPayoutModifier));

      let relationshipModifier = 1.0;
      if (template.clientType === 'Record Label' || template.clientType === 'Commercial') {
        // This is a placeholder. In a full system, you'd fetch relationship with a specific entity.
        // For now, using a random factor to simulate varied relationship impacts.
        const simulatedRelationshipScore = 30 + Math.random() * 70; 
        if (simulatedRelationshipScore > 75) relationshipModifier = 1.25; 
        else if (simulatedRelationshipScore > 50) relationshipModifier = 1.1;
        else if (simulatedRelationshipScore < 30) relationshipModifier = 0.85; 
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

      const requiredSkillsForProject: Partial<Record<StudioSkillType, number>> = {}; // Use Partial
      // Example: aggregate skills from stages or define high-level project skills
      // This logic needs to be robust based on how skills are defined in templates vs. project
      stages.forEach(stage => {
        if (stage.requiredSkills) {
          Object.entries(stage.requiredSkills).forEach(([skill, level]) => {
            const skillKey = skill as StudioSkillType;
            if (!requiredSkillsForProject[skillKey] || (requiredSkillsForProject[skillKey] as number) < level) {
              requiredSkillsForProject[skillKey] = level;
            }
          });
        }
      });
      // If template.genre itself implies a skill:
      // if (Object.values(StudioSkillType).includes(template.genre as StudioSkillType)) {
      //   requiredSkillsForProject[template.genre as StudioSkillType] = Math.max(1, Math.floor(finalDifficulty / 2));
      // }


      const matchRating: 'Poor' | 'Good' | 'Excellent' = 
        finalDifficulty <= playerLevel ? 'Excellent' :
        finalDifficulty <= playerLevel + 2 ? 'Good' : 'Poor';

      const associatedBand = generateAIBand(template.genre as MusicGenre);

      project = {
        id: `project-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
        title,
        genre: template.genre,
        clientType: template.clientType,
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
        associatedBandId: associatedBand.id,
        qualityScore: 0,
        efficiencyScore: 0,
        isCompleted: false, 
        endDate: undefined, 
        lastWorkDay: undefined, 
        targetMood: undefined, 
      };

      attempts++;
    } while (usedTitles.has(project.title) && attempts < 50);
    
    usedTitles.add(project.title);
    projects.push(project);
  }
  
  return projects;
};

export const generateCandidates = (count: number): StaffMember[] => {
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
