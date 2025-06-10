import { MilestoneReward } from '@/types/game';

export const MILESTONE_REWARDS: MilestoneReward[] = [
  {
    id: 'level_5',
    level: 5,
    name: 'Aspiring Producer',
    description: 'Your growing reputation attracts new opportunities.',
    unlockedFeatures: ['new_project_types', 'basic_staff_training'],
    attributePoints: 2,
    perkPoints: 1,
    newProjectTemplates: ['indie_ep', 'local_band_album'],
    newTrainingCourses: ['basic_mixing', 'recording_fundamentals']
  },
  {
    id: 'level_10',
    level: 10,
    name: 'Established Studio',
    description: 'Your studio gains recognition in the local scene.',
    unlockedFeatures: ['advanced_staff_training', 'genre_specialization'],
    attributePoints: 3,
    perkPoints: 2,
    newEquipment: ['pro_condenser_mic', 'vintage_preamp'],
    newTrainingCourses: ['advanced_mixing', 'vocal_production']
  },
  {
    id: 'level_15',
    level: 15,
    name: 'Industry Professional',
    description: 'High-profile clients begin seeking your services.',
    unlockedFeatures: ['high_profile_clients', 'specialized_equipment'],
    attributePoints: 3,
    perkPoints: 2,
    newProjectTemplates: ['major_label_album', 'soundtrack_production'],
    newEquipment: ['mastering_suite', 'analog_console']
  },
  {
    id: 'level_20',
    level: 20,
    name: 'Production Master',
    description: 'Your studio becomes a premier destination for top artists.',
    unlockedFeatures: ['master_techniques', 'premium_clients'],
    attributePoints: 4,
    perkPoints: 3,
    newProjectTemplates: ['platinum_artist_album', 'film_score'],
    newTrainingCourses: ['master_production', 'advanced_sound_design']
  },
  {
    id: 'level_25',
    level: 25,
    name: 'Industry Legend',
    description: 'Your influence shapes the future of music production.',
    unlockedFeatures: ['legendary_projects', 'mentorship'],
    attributePoints: 5,
    perkPoints: 3,
    newProjectTemplates: ['groundbreaking_album', 'orchestral_recording'],
    newEquipment: ['legendary_console', 'rare_microphone_collection']
  }
];

// Utility function to get milestone reward for a specific level
export const getMilestoneReward = (level: number): MilestoneReward | undefined => {
  return MILESTONE_REWARDS.find(reward => reward.level === level);
};

// Get the next milestone level after the current level
export const getNextMilestoneLevel = (currentLevel: number): number => {
  const nextMilestone = MILESTONE_REWARDS.find(reward => reward.level > currentLevel);
  return nextMilestone?.level ?? Infinity;
};

// Check if a level is a milestone level
export const isMilestoneLevel = (level: number): boolean => {
  return MILESTONE_REWARDS.some(reward => reward.level === level);
};
