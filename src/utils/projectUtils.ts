import { Project, ProjectStage, StaffMember, StageEvent, MinigameType } from '@/types/game'; // Added StageEvent, MinigameType
import { generateAIBand } from '@/utils/bandUtils';
import { ERA_DEFINITIONS, getGenrePopularity } from '@/utils/eraProgression';
import { projectTemplates } from '@/data/projectTemplates';

const genresList = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic', 'Jazz', 'Classical', 'Folk', 'R&B'] as const;
const clientTypesList = ['Independent', 'Record Label', 'Commercial', 'Streaming'] as const;

// Helper function to calculate dynamic multipliers
const calculateMultipliers = (project: Pick<Project, 'genre' | 'difficulty'>, currentEra: string, playerLevel: number) => {
  const genrePopularity = getGenrePopularity(project.genre, currentEra);
  const marketMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  const difficultyMultiplier = 1 + (project.difficulty - 1) * 0.15; // Scales with difficulty
  const eraPopularityMultiplier = genrePopularity / 100; // Convert to 0-1 scale
  const playerLevelMultiplier = 1 + (playerLevel * 0.05); // 5% bonus per level
  
  return {
    marketMultiplier,
    difficultyMultiplier,
    eraPopularityMultiplier,
    playerLevelMultiplier
  };
};

// Helper function to generate stage events
const generateStageEvents = (stage: ProjectStage, difficulty: number): ProjectStage => {
  const eventChance = Math.min(0.3, 0.1 + (difficulty * 0.02)); 
  
  if (Math.random() < eventChance) {
    const challengeTypes = ['technical', 'creative', 'client'] as const;
    const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    let eventType: StageEvent['type'];
    switch (challengeType) {
      case 'technical':
        eventType = 'technical_challenge';
        break;
      case 'creative':
        eventType = 'creative_challenge';
        break;
      case 'client':
        eventType = 'client_request';
        break;
      default:
        // This case should ideally not be reached if challengeTypes is exhaustive
        // For type safety, assign a default or handle error
        eventType = 'choice'; // Fallback to 'choice' or handle as an error
    }

    // Ensure the created event matches the StageEvent interface
    const newEvent: StageEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: eventType,
      description: `${challengeType} challenge encountered.`,
      triggerCondition: () => true, // Example: always triggers if present
      active: true,
      choices: [{ // Example choice structure
        text: "Address challenge",
        effects: [{ type: 'quality', value: challengeType === 'creative' ? 0.1 : 0.05 }] 
      }]
    };
    
    if (!stage.specialEvents) {
      stage.specialEvents = [];
    }
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
    // Fallback to any template if no era-appropriate ones are found, or handle error
    // For now, returning empty array if no templates match.
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
          requiredSkills: stageTemplate.requiredSkills,
          stageBonuses: stageTemplate.stageBonuses,
          minigameTriggerId: stageTemplate.minigameTriggerId as MinigameType | undefined // Cast to MinigameType
        };
        return generateStageEvents(baseStage, finalDifficulty);
      });

      const minimalProjectForMultipliers: Pick<Project, 'genre' | 'difficulty'> = {
        genre: template.genre,
        difficulty: finalDifficulty,
      };
      const multipliers = calculateMultipliers(minimalProjectForMultipliers, currentEra, playerLevel);
      
      const finalPayout = Math.floor(template.payoutBase * 
        multipliers.marketMultiplier * 
        multipliers.difficultyMultiplier * 
        multipliers.eraPopularityMultiplier * 
        multipliers.playerLevelMultiplier);
        
      const finalRep = Math.floor(template.repGainBase * 
        multipliers.difficultyMultiplier * 
        multipliers.eraPopularityMultiplier * 
        multipliers.playerLevelMultiplier);
        
      const finalDuration = Math.max(3, template.durationDaysTotal + Math.floor(Math.random() * 3 - 1));

      const requiredSkills: Record<string, number> = {};
      requiredSkills[template.genre] = Math.max(1, Math.floor(finalDifficulty / 2));
      
      template.stages.forEach(stage => {
        if (stage.requiredSkills) {
          Object.entries(stage.requiredSkills).forEach(([skill, level]) => {
            if (!requiredSkills[skill] || requiredSkills[skill] < level) {
              requiredSkills[skill] = level;
            }
          });
        }
      });

      const matchRating: 'Poor' | 'Good' | 'Excellent' = 
        finalDifficulty <= playerLevel ? 'Excellent' :
        finalDifficulty <= playerLevel + 2 ? 'Good' : 'Poor';

      const associatedBand = generateAIBand(template.genre);

      project = {
        id: `project-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`,
        title,
        genre: template.genre,
        clientType: template.clientType,
        difficulty: finalDifficulty,
        payoutBase: finalPayout,
        repGainBase: finalRep,
        durationDaysTotal: finalDuration,
        requiredSkills,
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
        isCompleted: false, // Ensure all Project fields are initialized
        endDate: undefined, // Ensure all Project fields are initialized
        lastWorkDay: undefined, // Ensure all Project fields are initialized
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
  const staffGenres = [...genresList]; // Use genresList defined at the top
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
        genre: staffGenres[Math.floor(Math.random() * staffGenres.length)],
        bonus: 10 + Math.floor(Math.random() * 15)
      } : null,
      mood: 75, 
      salary: 80 + Math.floor(Math.random() * 120),
      status: 'Idle',
      assignedProjectId: null,
      contractEndDate: 0, // Default value, actual date to be set upon hiring
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
  const genreComplexity = project.genre === 'Electronic' ? 1.2 : 
                           project.genre === 'Hip-hop' ? 1.1 : 
                           project.genre === 'Acoustic' ? 0.9 : 1.0;
  
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
