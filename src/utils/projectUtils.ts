import { Project, ProjectStage, StaffMember, GameState, ProjectTemplate } from '@/types/game';
import { generateAIBand } from '@/utils/bandUtils';
import { ERA_DEFINITIONS, getGenrePopularity } from '@/utils/eraProgression';
import { getProjectTemplate } from '@/data/projectTemplates';
import { v4 as uuidv4 } from 'uuid';

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
    titleTemplates: ['Folk Harmony Sessions', 'Country Ballad Recording', 'Bluegrass Live Taping'],
    genre: 'Folk',
    clientType: 'Independent',
    difficulty: 2,
    baseStages: [
      { stageName: 'Acoustic Setup', workUnitsBase: 7, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Multi-Vocal Recording', workUnitsBase: 9, focusAreas: ['layering', 'performance'] },
      { stageName: 'Traditional Mix', workUnitsBase: 5, focusAreas: ['soundCapture', 'layering'] }
    ],
    basePayout: 350,
    baseRep: 3,
    baseDuration: 4
  },
  {
    titleTemplates: ['Soul Vocal Session', 'Motown-Style Recording', 'R&B Groove Track'],
    genre: 'Soul',
    clientType: 'Independent',
    difficulty: 3,
    baseStages: [
      { stageName: 'Rhythm Section Setup', workUnitsBase: 10, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Lead Vocal Recording', workUnitsBase: 12, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Horn Section Overdubs', workUnitsBase: 8, focusAreas: ['layering', 'performance'] }
    ],
    basePayout: 400,
    baseRep: 4,
    baseDuration: 5
  },
  {
    titleTemplates: ['Jazz Session Recording', 'Big Band Live Session', 'Trumpet & Piano Duo'],
    genre: 'Jazz',
    clientType: 'Independent',
    difficulty: 3,
    baseStages: [
      { stageName: 'Live Setup & Mic Placement', workUnitsBase: 9, focusAreas: ['soundCapture', 'performance'] },
      { stageName: 'Live Recording Session', workUnitsBase: 11, focusAreas: ['performance', 'soundCapture'] },
      { stageName: 'Analog Mix & Press', workUnitsBase: 7, focusAreas: ['soundCapture', 'layering'] }
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

export function generateNewProjects(gameState: GameState): Project[] {
  const numProjects = Math.min(3, 5 - gameState.projects.length);
  const newProjects: Project[] = [];

  for (let i = 0; i < numProjects; i++) {
    const template = getProjectTemplate(gameState);
    if (!template) continue;

    const project: Project = {
      id: uuidv4(),
      title: template.titlePattern,
      genre: template.genre,
      clientType: template.clientType,
      difficulty: template.difficulty,
      payoutBase: template.payoutBase,
      repGainBase: template.repGainBase,
      durationDaysTotal: template.durationDaysTotal,
      stages: template.stages.map(stage => ({
        stageName: stage.stageName,
        focusAreas: stage.focusAreas.map(area => ({
          name: area,
          allocation: 100 / stage.focusAreas.length,
          bonusMultiplier: 1
        })),
        workUnitsBase: stage.workUnitsBase,
        workUnitsCompleted: 0,
        workUnits: [],
        requiredSkills: stage.requiredSkills || {},
        stageBonuses: {
          creativity: stage.stageBonuses?.creativity || 0,
          technical: stage.stageBonuses?.technical || 0
        },
        qualityMultiplier: 1,
        timeMultiplier: 1,
        minigameTriggerId: stage.minigameTriggerId,
        specialEvents: stage.specialEvents || [],
        isCompleted: false,
        completed: false
      })),
      currentStageIndex: 0,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      workSessionCount: 0,
      era: template.era,
      isCompleted: false,
      quality: 0,
      reputation: 0,
      startDate: gameState.currentDay,
      endDate: undefined
    };

    newProjects.push(project);
  }

  return newProjects;
}

export function calculateProjectQuality(project: Project): number {
  const stageQualities = project.stages.map(stage => {
    const progress = stage.workUnitsCompleted / stage.workUnitsBase;
    return progress * (stage.qualityMultiplier || 1);
  });

  return Math.floor(stageQualities.reduce((sum, quality) => sum + quality, 0) / project.stages.length * 100);
}

export function calculateProjectProgress(project: Project): number {
  const totalWorkUnits = project.stages.reduce((sum, stage) => sum + stage.workUnitsBase, 0);
  const completedWorkUnits = project.stages.reduce((sum, stage) => sum + stage.workUnitsCompleted, 0);
  return Math.min(1, completedWorkUnits / totalWorkUnits);
}

export function getProjectRewards(project: Project): { money: number; reputation: number } {
  const qualityMultiplier = calculateProjectQuality(project) / 100;
  const progressMultiplier = calculateProjectProgress(project);

  return {
    money: Math.floor(project.payoutBase * qualityMultiplier * progressMultiplier),
    reputation: Math.floor(project.repGainBase * qualityMultiplier * progressMultiplier)
  };
}

export const generateCandidates = (count: number): StaffMember[] => {
  const candidates: StaffMember[] = [];
  const roles = ['Engineer', 'Producer', 'Mixer', 'Mastering Engineer'];
  const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Quinn'];

  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const baseSalary = 1000 + Math.floor(Math.random() * 2000);
    const experience = Math.floor(Math.random() * 100); // Random experience

    candidates.push({
      id: uuidv4(),
      name,
      role,
      skills: {
        recording: Math.floor(Math.random() * 50) + 1, // 1-50
        mixing: Math.floor(Math.random() * 50) + 1,
        mastering: Math.floor(Math.random() * 50) + 1,
        production: Math.floor(Math.random() * 50) + 1,
        songwriting: Math.floor(Math.random() * 50) + 1,
      },
      salary: baseSalary,
      experience: experience,
      status: 'available' // Default status
    });
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
