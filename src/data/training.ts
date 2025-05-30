
import { TrainingCourse } from '@/types/game';

export const availableTrainingCourses: TrainingCourse[] = [
  {
    id: 'basic_audio_engineering',
    name: 'Basic Audio Engineering Workshop',
    description: 'Learn the fundamentals of signal flow, microphone placement, and recording techniques.',
    cost: 500,
    duration: 3,
    effects: {
      statBoosts: { technical: 15, creativity: 5 },
      skillXP: { skill: 'Rock', amount: 50 }
    }
  },
  {
    id: 'pop_arrangement_seminar',
    name: 'Pop Song Arrangement Seminar',
    description: 'Master the art of creating catchy hooks and commercial arrangements.',
    cost: 700,
    duration: 5,
    effects: {
      statBoosts: { creativity: 20, technical: 5 },
      skillXP: { skill: 'Pop', amount: 75 }
    }
  },
  {
    id: 'electronic_production',
    name: 'Electronic Music Production Bootcamp',
    description: 'Dive deep into synthesis, sampling, and digital audio manipulation.',
    cost: 900,
    duration: 7,
    effects: {
      statBoosts: { creativity: 25, technical: 15 },
      skillXP: { skill: 'Electronic', amount: 100 }
    }
  },
  {
    id: 'mixing_masterclass',
    name: 'Advanced Mixing Masterclass',
    description: 'Learn professional mixing techniques and industry secrets.',
    cost: 1200,
    duration: 6,
    effects: {
      statBoosts: { technical: 30, creativity: 10 },
      specialEffects: ['mixing_expert']
    }
  }
];
