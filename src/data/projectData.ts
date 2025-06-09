
import { Project } from '@/types/game';

export const generateInitialProjects = (playerLevel: number): Project[] => {
  const baseProjects: Omit<Project, 'id'>[] = [
    {
      title: 'Demo Recording',
      genre: 'Rock',
      clientType: 'Local Band',
      difficulty: 1,
      durationDaysTotal: 3,
      payoutBase: 500,
      repGainBase: 10,
      requiredSkills: { recording: 1 },
      stages: [
        {
          stageName: 'Setup',
          focusAreas: ['technical'],
          workUnitsBase: 5,
          workUnitsCompleted: 0,
          completed: false
        }
      ],
      matchRating: 'Good',
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      currentStageIndex: 0,
      completedStages: [],
      workSessionCount: 0
    },
    {
      title: 'Podcast Recording',
      genre: 'Spoken Word',
      clientType: 'Podcaster',
      difficulty: 1,
      durationDaysTotal: 2,
      payoutBase: 300,
      repGainBase: 5,
      requiredSkills: { recording: 1 },
      stages: [
        {
          stageName: 'Recording',
          focusAreas: ['technical'],
          workUnitsBase: 3,
          workUnitsCompleted: 0,
          completed: false
        }
      ],
      matchRating: 'Excellent',
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      currentStageIndex: 0,
      completedStages: [],
      workSessionCount: 0
    }
  ];

  return baseProjects.map((project, index) => ({
    ...project,
    id: `project_${Date.now()}_${index}`
  }));
};
