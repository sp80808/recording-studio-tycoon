
import { TrainingCourse } from '@/types/game';

export const availableTrainingCourses: TrainingCourse[] = [
  {
    id: 'basic_audio_engineering',
    name: 'Basic Audio Engineering Workshop',
    description: 'Learn the fundamentals of signal flow, microphone placement, and recording techniques.',
    cost: 500,
    duration: 3,
    effects: {
      statBoosts: { 
        techKnowledge: 10,
        mixing: 5,
        ear: 5
      },
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
      statBoosts: { 
        songwriting: 15,
        arrangement: 5,
        ear: 5
      },
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
      statBoosts: { 
        soundDesign: 15,
        techKnowledge: 10,
        arrangement: 5
      },
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
      statBoosts: { 
        mixing: 20,
        mastering: 10,
        ear: 10
      },
      specialEffects: ['mixing_expert']
    }
  },
  {
    id: 'diy_mic_modding',
    name: 'DIY Mic Modding',
    description: 'Hands-on workshop for microphone modification techniques.',
    cost: 600,
    duration: 1,
    effects: {
      statBoosts: {
        techKnowledge: 5
      }
    }
  },
  {
    id: 'improv_jamming',
    name: 'Improv Jamming',
    description: 'Develop spontaneous musical creativity and collaboration skills.',
    cost: 550,
    duration: 1,
    effects: {
      statBoosts: {
        songwriting: 5
      }
    }
  },
  {
    id: 'analog_tape_tricks',
    name: 'Analog Tape Tricks',
    description: 'Learn vintage recording techniques using analog tape machines.',
    cost: 800,
    duration: 2,
    effects: {
      statBoosts: {
        techKnowledge: 8,
        mixing: 3
      }
    },
    prerequisites: {
      techKnowledge: 30
    }
  },
  {
    id: 'advanced_vocal_production',
    name: 'Advanced Vocal Production',
    description: 'Master professional vocal recording and processing techniques.',
    cost: 1000,
    duration: 3,
    effects: {
      statBoosts: {
        ear: 7,
        mixing: 5
      }
    },
    prerequisites: {
      ear: 40
    }
  },
  {
    id: 'electronic_soundscapes',
    name: 'Electronic Soundscapes',
    description: 'Create immersive electronic textures and atmospheres.',
    cost: 950,
    duration: 2,
    effects: {
      statBoosts: {
        soundDesign: 10
      }
    },
    prerequisites: {
      soundDesign: 25
    }
  }
];
