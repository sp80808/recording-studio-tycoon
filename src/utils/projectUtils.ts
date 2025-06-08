import { Project, ProjectStage, StaffMember } from '@/types/game';
import { generateAIBand } from '@/utils/bandUtils';

const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'] as const;
const clientTypes = ['Independent', 'Record Label', 'Commercial', 'Streaming'] as const;

// Early-game project templates (grounded names)
const earlyGameTemplates = [
  {
    titleTemplates: ['Local Band Demo', 'Garage Band Recording', 'Indie Demo Session'],
    genre: 'Rock',
    clientType: 'Independent',
    difficulty: 2,
    baseStages: [
      { stageName: 'Setup & Recording', workUnitsBase: 8, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Basic Mixing', workUnitsBase: 10, focusAreas: ['layering', 'soundCapture'] },
      { stageName: 'Demo Master', workUnitsBase: 6, focusAreas: ['performance', 'layering'] }
    ],
    basePayout: 300,
    baseRep: 3,
    baseDuration: 4
  },
  {
    titleTemplates: ['Coffee Shop Sessions', 'Acoustic Evening', 'Songwriter Demo'],
    genre: 'Acoustic',
    clientType: 'Independent',
    difficulty: 1,
    baseStages: [
      { stageName: 'Live Recording', workUnitsBase: 6, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Light Production', workUnitsBase: 8, focusAreas: ['layering', 'soundCapture'] }
    ],
    basePayout: 250,
    baseRep: 2,
    baseDuration: 3
  },
  {
    titleTemplates: ['Bedroom Pop Track', 'Lo-Fi Vibes', 'DIY Pop Recording'],
    genre: 'Pop',
    clientType: 'Independent',
    difficulty: 2,
    baseStages: [
      { stageName: 'Home Recording', workUnitsBase: 7, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Lo-Fi Production', workUnitsBase: 9, focusAreas: ['layering', 'performance'] },
      { stageName: 'Vintage Master', workUnitsBase: 5, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 350,
    baseRep: 3,
    baseDuration: 4
  },
  {
    titleTemplates: ['Underground Cipher', 'Street Rap Demo', 'Local Hip-Hop Track'],
    genre: 'Hip-hop',
    clientType: 'Independent',
    difficulty: 3,
    baseStages: [
      { stageName: 'Beat Production & Sampling', workUnitsBase: 10, focusAreas: ['layering', 'performance'] },
      { stageName: 'Recording & Vocal Production', workUnitsBase: 12, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Mix & Street Release', workUnitsBase: 8, focusAreas: ['layering', 'soundCapture'] }
    ],
    basePayout: 400,
    baseRep: 4,
    baseDuration: 5
  },
  {
    titleTemplates: ['Electronic Experiment', 'Synth Demo', 'Digital Soundscape'],
    genre: 'Electronic',
    clientType: 'Independent',
    difficulty: 3,
    baseStages: [
      { stageName: 'Sound Design Basics', workUnitsBase: 9, focusAreas: ['layering', 'performance'] },
      { stageName: 'Simple Sequencing', workUnitsBase: 11, focusAreas: ['performance', 'layering'] },
      { stageName: 'Digital Master', workUnitsBase: 7, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 375,
    baseRep: 3,
    baseDuration: 4
  }
];

// Mid-to-late game project templates (more epic names)
const advancedGameTemplates = [
  {
    titleTemplates: ['Symphony of Code', 'Digital Orchestra', 'Cyber Symphony'],
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 8,
    baseStages: [
      { stageName: 'Thematic Composition', workUnitsBase: 16, focusAreas: ['performance', 'layering'] },
      { stageName: 'Orchestration & Programming', workUnitsBase: 20, focusAreas: ['layering', 'soundCapture'] },
      { stageName: 'Interactive Implementation', workUnitsBase: 18, focusAreas: ['performance', 'layering'] },
      { stageName: 'Final Mix & Mastering', workUnitsBase: 14, focusAreas: ['layering', 'soundCapture'] }
    ],
    basePayout: 1200,
    baseRep: 12,
    baseDuration: 12
  },
  {
    titleTemplates: ['Bass Drop Empire', 'Electronic Anthem', 'Festival Banger'],
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 6,
    baseStages: [
      { stageName: 'Beat Programming & Sound Design', workUnitsBase: 14, focusAreas: ['layering', 'performance'] },
      { stageName: 'Arrangement & Build-ups', workUnitsBase: 16, focusAreas: ['performance', 'layering'] },
      { stageName: 'Mixing & Master', workUnitsBase: 12, focusAreas: ['layering', 'soundCapture'] }
    ],
    basePayout: 850,
    baseRep: 8,
    baseDuration: 8
  },
  {
    titleTemplates: ['Neon Dreams', 'Synthwave Journey', 'Retro Future'],
    genre: 'Electronic',
    clientType: 'Streaming',
    difficulty: 5,
    baseStages: [
      { stageName: 'Concept & Sound Design', workUnitsBase: 12, focusAreas: ['layering', 'performance'] },
      { stageName: 'Recording & Layering', workUnitsBase: 16, focusAreas: ['soundCapture', 'layering'] },
      { stageName: 'Mixing & Mastering', workUnitsBase: 14, focusAreas: ['layering', 'performance'] }
    ],
    basePayout: 700,
    baseRep: 7,
    baseDuration: 7
  },
  {
    titleTemplates: ['Corporate Harmony', 'Brand Anthem', 'Commercial Melody'],
    genre: 'Pop',
    clientType: 'Commercial',
    difficulty: 4,
    baseStages: [
      { stageName: 'Client Consultation & Concept', workUnitsBase: 8, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Multiple Variations & Testing', workUnitsBase: 12, focusAreas: ['layering', 'performance'] },
      { stageName: 'Final Production & Delivery', workUnitsBase: 10, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 600,
    baseRep: 6,
    baseDuration: 6
  },
  {
    titleTemplates: ['Rock Anthem', 'Power Ballad', 'Stadium Rocker'],
    genre: 'Rock',
    clientType: 'Record Label',
    difficulty: 4,
    baseStages: [
      { stageName: 'Songwriting & Arrangement', workUnitsBase: 10, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Tracking & Recording', workUnitsBase: 14, focusAreas: ['soundCapture', 'layering'] },
      { stageName: 'Mixing & Production', workUnitsBase: 12, focusAreas: ['layering', 'performance'] },
      { stageName: 'Mastering & Polish', workUnitsBase: 8, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 650,
    baseRep: 6,
    baseDuration: 8
  }
];

export const generateNewProjects = (count: number, playerLevel: number = 1): Project[] => {
  const projects: Project[] = [];
  const usedTitles = new Set<string>();
  
  // Choose appropriate template pool based on player level
  const isEarlyGame = playerLevel < 5;
  const templatePool = isEarlyGame ? earlyGameTemplates : [...earlyGameTemplates, ...advancedGameTemplates];
  const weightedPool = isEarlyGame ? earlyGameTemplates : advancedGameTemplates;
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let project: Project;
    
    do {
      // 70% chance to use level-appropriate templates, 30% chance for variety
      const useAppropriateLevel = Math.random() < 0.7;
      const selectedPool = useAppropriateLevel ? weightedPool : templatePool;
      const template = selectedPool[Math.floor(Math.random() * selectedPool.length)];
      
      // Pick a random title from the template's title array
      const titleIndex = Math.floor(Math.random() * template.titleTemplates.length);
      const selectedTitle = template.titleTemplates[titleIndex];
      
      const difficultyVariation = Math.random() * 2 - 1; // -1 to +1
      let finalDifficulty = Math.max(1, Math.min(10, template.difficulty + Math.floor(difficultyVariation)));
      
      // Cap difficulty for early game
      if (isEarlyGame) {
        finalDifficulty = Math.min(finalDifficulty, 4);
      }
      
      // Create stages with variation
      const stages: ProjectStage[] = template.baseStages.map(stageTemplate => ({
        stageName: stageTemplate.stageName,
        focusAreas: stageTemplate.focusAreas,
        workUnitsBase: Math.max(4, stageTemplate.workUnitsBase + Math.floor(Math.random() * 4 - 2)),
        workUnitsCompleted: 0,
        completed: false
      }));

      // Calculate dynamic pricing based on difficulty and market conditions
      const marketMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const difficultyMultiplier = 1 + (finalDifficulty - 1) * 0.15; // Scales with difficulty
      
      const finalPayout = Math.floor(template.basePayout * marketMultiplier * difficultyMultiplier);
      const finalRep = Math.floor(template.baseRep * difficultyMultiplier);
      const finalDuration = Math.max(3, template.baseDuration + Math.floor(Math.random() * 3 - 1));

      // Generate required skills based on genre and difficulty
      const requiredSkills: Record<string, number> = {};
      requiredSkills[template.genre] = Math.max(1, Math.floor(finalDifficulty / 2));

      // Determine match rating based on difficulty relative to player level
      const matchRating: 'Poor' | 'Good' | 'Excellent' = 
        finalDifficulty <= playerLevel ? 'Excellent' :
        finalDifficulty <= playerLevel + 2 ? 'Good' : 'Poor';

      // Generate associated AI band
      const associatedBand = generateAIBand(template.genre);

      project = {
        id: `project-${Date.now()}-${i}`,
        title: selectedTitle,
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
        associatedBandId: associatedBand.id
      };

      attempts++;
    } while (usedTitles.has(project.title) && attempts < 50); // Prevent infinite loops
    
    // Add the unique title to our set and the project to our list
    usedTitles.add(project.title);
    projects.push(project);
  }
  
  return projects;
};

export const generateCandidates = (count: number): StaffMember[] => {
  const names = ['Alex Rivera', 'Sam Chen', 'Jordan Blake', 'Casey Smith', 'Taylor Johnson', 'Morgan Davis', 'Riley Parker', 'Avery Wilson', 'Quinn Martinez', 'Sage Thompson'];
  const roles: ('Engineer' | 'Producer' | 'Songwriter')[] = ['Engineer', 'Producer', 'Songwriter'];
  const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'];
  const candidates: StaffMember[] = [];

  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const hasAffinity = Math.random() > 0.6; // 40% chance of genre affinity
    
    const candidate: StaffMember = {
      id: '', // Will be assigned when hired
      name: names[Math.floor(Math.random() * names.length)],
      role,
      primaryStats: {
        creativity: 15 + Math.floor(Math.random() * 25), // 15-40 range
        technical: 15 + Math.floor(Math.random() * 25),
        speed: 15 + Math.floor(Math.random() * 25)
      },
      xpInRole: 0,
      levelInRole: 1,
      genreAffinity: hasAffinity ? {
        genre: genres[Math.floor(Math.random() * genres.length)],
        bonus: 10 + Math.floor(Math.random() * 15) // 10-25% bonus
      } : null,
      energy: 100,
      mood: 75, // Start with good mood
      salary: 80 + Math.floor(Math.random() * 120), // $80-200 per week
      status: 'Idle',
      assignedProjectId: null
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
  
  return Math.min(10, Math.max(1, Math.floor(baseComplexity * genreComplexity)));
};

export const getProjectRequirements = (project: Project) => {
  const requirements = {
    minPlayerLevel: Math.max(1, Math.floor(project.difficulty / 2)),
    recommendedSkillLevel: Math.max(1, Math.floor(project.difficulty / 3)),
    estimatedWorkSessions: project.stages.reduce((sum, stage) => sum + Math.ceil(stage.workUnitsBase / 3), 0)
  };
  
  return requirements;
};
