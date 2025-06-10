import { ProjectTemplate, StageTemplate } from '@/types/game';

export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'beginner_single',
    titlePattern: 'Simple {genre} Demo',
    genre: 'Rock',
    clientType: 'Indie Band',
    difficulty: 1,
    durationDaysTotal: 3,
    payoutBase: 300,
    repGainBase: 3,
    stages: [
      {
        stageName: 'Basic Recording',
        focusAreas: ['performance', 'soundCapture'],
        workUnitsBase: 1
      },
      {
        stageName: 'Quick Mix',
        focusAreas: ['mixing'],
        workUnitsBase: 1
      },
      {
        stageName: 'Final Touches',
        focusAreas: ['mastering'],
        workUnitsBase: 1
      }
    ]
  },
  {
    id: 'standard_album',
    titlePattern: '{genre} Album Track',
    genre: 'Pop',
    clientType: 'Record Label',
    difficulty: 3,
    durationDaysTotal: 12,
    payoutBase: 800,
    repGainBase: 8,
    stages: [
      {
        stageName: 'Pre-production',
        focusAreas: ['planning', 'arrangement'],
        workUnitsBase: 3,
        requiredSkills: { composition: 2 }
      },
      {
        stageName: 'Recording',
        focusAreas: ['performance', 'soundCapture', 'layering'],
        workUnitsBase: 5,
        stageBonuses: { creativity: 1 }
      },
      {
        stageName: 'Mixing',
        focusAreas: ['mixing'],
        workUnitsBase: 3,
        requiredSkills: { mixing: 3 }
      },
      {
        stageName: 'Mastering',
        focusAreas: ['mastering'],
        workUnitsBase: 1,
        requiredSkills: { mastering: 2 }
      }
    ]
  },
  {
    id: 'complex_scoring',
    titlePattern: '{genre} Film Score',
    genre: 'Electronic',
    clientType: 'Commercial',
    difficulty: 5,
    durationDaysTotal: 20,
    payoutBase: 1500,
    repGainBase: 15,
    stages: [
      {
        stageName: 'Concept Development',
        focusAreas: ['planning'],
        workUnitsBase: 4,
        requiredSkills: { composition: 4 },
        stageBonuses: { creativity: 2 }
      },
      {
        stageName: 'Orchestration',
        focusAreas: ['arrangement', 'layering'],
        workUnitsBase: 6,
        requiredSkills: { arrangement: 5 }
      },
      {
        stageName: 'Recording Sessions',
        focusAreas: ['performance', 'soundCapture'],
        workUnitsBase: 5,
        stageBonuses: { technical: 1 }
      },
      {
        stageName: 'Post-production',
        focusAreas: ['mixing', 'mastering'],
        workUnitsBase: 5,
        requiredSkills: { mixing: 4, mastering: 3 }
      }
    ]
  }
];

export const getProjectTemplate = (difficulty: number, genre?: string): ProjectTemplate => {
  const filtered = projectTemplates.filter(t => 
    t.difficulty === difficulty && 
    (!genre || t.genre === genre)
  );
  
  if (filtered.length === 0) {
    return projectTemplates.find(t => t.difficulty === 1)!;
  }
  
  return filtered[Math.floor(Math.random() * filtered.length)];
};
