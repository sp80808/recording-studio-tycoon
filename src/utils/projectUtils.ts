import { Project, ProjectStage } from '@/types/game';

const genres = ['Rock', 'Pop', 'Electronic', 'Hip-hop', 'Acoustic'] as const;
const clientTypes = ['Independent', 'Record Label', 'Commercial', 'Streaming'] as const;

// Enhanced project templates based on the brainstormed ideas
const projectTemplates = [
  // Original templates
  {
    titleTemplate: 'Summer Vibes',
    genre: 'Pop',
    clientType: 'Record Label',
    difficulty: 3,
    baseStages: [
      { stageName: 'Pre-production', workUnitsBase: 8 },
      { stageName: 'Recording', workUnitsBase: 12 },
      { stageName: 'Mixing', workUnitsBase: 10 },
      { stageName: 'Mastering', workUnitsBase: 6 }
    ],
    basePayout: 500,
    baseRep: 5,
    baseDuration: 5
  },
  {
    titleTemplate: 'Midnight Drive',
    genre: 'Electronic',
    clientType: 'Independent',
    difficulty: 4,
    baseStages: [
      { stageName: 'Sound Design', workUnitsBase: 10 },
      { stageName: 'Sequencing', workUnitsBase: 14 },
      { stageName: 'Arrangement', workUnitsBase: 12 },
      { stageName: 'Final Mix', workUnitsBase: 8 }
    ],
    basePayout: 400,
    baseRep: 4,
    baseDuration: 6
  },
  
  // New enhanced project templates
  {
    titleTemplate: 'Neon Dreams',
    genre: 'Electronic',
    clientType: 'Streaming',
    difficulty: 5,
    baseStages: [
      { stageName: 'Concept & Sound Design', workUnitsBase: 12 },
      { stageName: 'Recording & Layering', workUnitsBase: 16 },
      { stageName: 'Mixing & Mastering', workUnitsBase: 14 }
    ],
    basePayout: 700,
    baseRep: 7,
    baseDuration: 7
  },
  {
    titleTemplate: 'Acoustic Confessions',
    genre: 'Acoustic',
    clientType: 'Independent',
    difficulty: 2,
    baseStages: [
      { stageName: 'Pre-production & Arrangement', workUnitsBase: 6 },
      { stageName: 'Live Recording Sessions', workUnitsBase: 10 },
      { stageName: 'Subtle Production & Final Mix', workUnitsBase: 8 }
    ],
    basePayout: 350,
    baseRep: 3,
    baseDuration: 4
  },
  {
    titleTemplate: 'Bass Drop Empire',
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 6,
    baseStages: [
      { stageName: 'Beat Programming & Sound Design', workUnitsBase: 14 },
      { stageName: 'Arrangement & Build-ups', workUnitsBase: 16 },
      { stageName: 'Mixing & Master', workUnitsBase: 12 }
    ],
    basePayout: 850,
    baseRep: 8,
    baseDuration: 8
  },
  {
    titleTemplate: 'Corporate Harmony',
    genre: 'Pop',
    clientType: 'Commercial',
    difficulty: 4,
    baseStages: [
      { stageName: 'Client Consultation & Concept', workUnitsBase: 8 },
      { stageName: 'Multiple Variations & Testing', workUnitsBase: 12 },
      { stageName: 'Final Production & Delivery', workUnitsBase: 10 }
    ],
    basePayout: 600,
    baseRep: 6,
    baseDuration: 6
  },
  {
    titleTemplate: 'Underground Cipher',
    genre: 'Hip-hop',
    clientType: 'Independent',
    difficulty: 3,
    baseStages: [
      { stageName: 'Beat Production & Sampling', workUnitsBase: 10 },
      { stageName: 'Recording & Vocal Production', workUnitsBase: 12 },
      { stageName: 'Mix & Street Release', workUnitsBase: 8 }
    ],
    basePayout: 400,
    baseRep: 4,
    baseDuration: 5
  },
  {
    titleTemplate: 'Symphony of Code',
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 8,
    baseStages: [
      { stageName: 'Thematic Composition', workUnitsBase: 16 },
      { stageName: 'Orchestration & Programming', workUnitsBase: 20 },
      { stageName: 'Interactive Implementation', workUnitsBase: 18 },
      { stageName: 'Final Mix & Mastering', workUnitsBase: 14 }
    ],
    basePayout: 1200,
    baseRep: 12,
    baseDuration: 12
  },
  {
    titleTemplate: 'Midnight Sessions',
    genre: 'Acoustic',
    clientType: 'Record Label',
    difficulty: 5,
    baseStages: [
      { stageName: 'Session Planning & Setup', workUnitsBase: 8 },
      { stageName: 'Live Recording Night', workUnitsBase: 14 },
      { stageName: 'Post-Production & Editing', workUnitsBase: 12 }
    ],
    basePayout: 750,
    baseRep: 7,
    baseDuration: 7
  },
  {
    titleTemplate: 'Rock Anthem',
    genre: 'Rock',
    clientType: 'Record Label',
    difficulty: 4,
    baseStages: [
      { stageName: 'Songwriting & Arrangement', workUnitsBase: 10 },
      { stageName: 'Tracking & Recording', workUnitsBase: 14 },
      { stageName: 'Mixing & Production', workUnitsBase: 12 },
      { stageName: 'Mastering & Polish', workUnitsBase: 8 }
    ],
    basePayout: 650,
    baseRep: 6,
    baseDuration: 8
  },
  {
    titleTemplate: 'Urban Freestyle',
    genre: 'Hip-hop',
    clientType: 'Streaming',
    difficulty: 3,
    baseStages: [
      { stageName: 'Beat Creation', workUnitsBase: 8 },
      { stageName: 'Vocal Recording', workUnitsBase: 10 },
      { stageName: 'Mixing & Effects', workUnitsBase: 8 },
      { stageName: 'Final Master', workUnitsBase: 6 }
    ],
    basePayout: 450,
    baseRep: 4,
    baseDuration: 5
  }
];

export const generateNewProjects = (count: number): Project[] => {
  const projects: Project[] = [];
  
  for (let i = 0; i < count; i++) {
    const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
    const difficultyVariation = Math.random() * 2 - 1; // -1 to +1
    const finalDifficulty = Math.max(1, Math.min(10, template.difficulty + Math.floor(difficultyVariation)));
    
    // Create stages with variation
    const stages: ProjectStage[] = template.baseStages.map(stageTemplate => ({
      stageName: stageTemplate.stageName,
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

    const project: Project = {
      id: `project-${Date.now()}-${i}`,
      title: template.titleTemplate,
      genre: template.genre,
      clientType: template.clientType,
      difficulty: finalDifficulty,
      payoutBase: finalPayout,
      repGainBase: finalRep,
      durationDaysTotal: finalDuration,
      stages,
      currentStageIndex: 0,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      workSessionCount: 0
    };

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
