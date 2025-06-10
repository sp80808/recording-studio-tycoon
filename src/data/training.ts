
import { TrainingCourse } from '@/types/game';

export const availableTrainingCourses: TrainingCourse[] = [
  {
    id: 'train01',
    name: 'Basic Audio Engineering',
    description: 'Learn the fundamentals of audio recording and mixing.',
    cost: 750,
    duration: 3,
    requiredLevel: 1,
    effects: {
      statBoosts: {
        technical: 5,
        creativity: 2
      }
    }
  },
  {
    id: 'train02',
    name: 'Pop Arrangement Seminar',
    description: 'Master the art of pop music composition and arrangement.',
    cost: 1200,
    duration: 5,
    requiredLevel: 3,
    effects: {
      statBoosts: {
        creativity: 8,
        technical: 3
      },
      skillXP: {
        skill: 'Pop',
        amount: 200
      }
    }
  },
  {
    id: 'train03',
    name: 'Advanced Mixing Techniques',
    description: 'Professional mixing strategies and advanced processing.',
    cost: 2000,
    duration: 7,
    requiredLevel: 5,
    effects: {
      statBoosts: {
        technical: 10,
        creativity: 5
      },
      specialEffects: ['Mixing Master']
    }
  },
  {
    id: 'train04',
    name: 'Electronic Music Production',
    description: 'Synthesizer programming and electronic music techniques.',
    cost: 1500,
    duration: 4,
    requiredLevel: 2,
    effects: {
      statBoosts: {
        creativity: 7,
        technical: 6
      },
      skillXP: {
        skill: 'Electronic',
        amount: 150
      }
    }
  },
  {
    id: 'train05',
    name: 'Studio Management & Leadership',
    description: 'Learn to manage teams and improve studio workflow.',
    cost: 1800,
    duration: 6,
    requiredLevel: 4,
    effects: {
      statBoosts: {
        speed: 8,
        creativity: 4,
        technical: 4
      },
      specialEffects: ['Team Leader']
    }
  }
];
