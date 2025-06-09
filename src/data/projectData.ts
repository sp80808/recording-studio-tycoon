
import { Project } from '@/types/game';

export const generateInitialProjects = (playerLevel: number): Project[] => {
  const projects: Project[] = [
    {
      id: '60s-rock-1',
      title: 'Local Band Demo',
      genre: 'Rock',
      difficulty: 1,
      description: 'Record a simple demo for a local rock band',
      payoutBase: 500,
      creativityRequired: 20,
      technicalRequired: 15,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      isComplete: false,
      clientName: 'The Garage Rockers',
      eraRequirement: 'analog60s'
    },
    {
      id: '60s-folk-1',
      title: 'Folk Singer Single',
      genre: 'Folk',
      difficulty: 1,
      description: 'Record an intimate folk single',
      payoutBase: 400,
      creativityRequired: 25,
      technicalRequired: 10,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      isComplete: false,
      clientName: 'Sarah Moonlight',
      eraRequirement: 'analog60s'
    },
    {
      id: '60s-soul-1',
      title: 'Soul Ballad Recording',
      genre: 'Soul',
      difficulty: 2,
      description: 'Capture the emotion of a powerful soul ballad',
      payoutBase: 750,
      creativityRequired: 30,
      technicalRequired: 25,
      accumulatedCPoints: 0,
      accumulatedTPoints: 0,
      isComplete: false,
      clientName: 'Marcus Williams',
      eraRequirement: 'analog60s'
    }
  ];

  // Return projects appropriate for player level
  return projects.filter(project => project.difficulty <= Math.max(1, playerLevel));
};

export const get60sProjects = (): Project[] => {
  return generateInitialProjects(1);
};
