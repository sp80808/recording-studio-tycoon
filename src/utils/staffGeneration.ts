import { StaffMember, StaffRole, StaffStats, GenreAffinity, StudioSkill } from '@/types/game';

const names = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
  'Liam', 'Olivia', 'Noah', 'Emma', 'Jackson', 'Ava', 'Lucas', 'Sophia', 'Aiden', 'Mia'
];

const primaryStatsRange = { min: 15, max: 40 };
const xpToNextLevelBase = 50;
const statIncreasePerLevel = 3;

const roleSkills: Record<StaffRole, string[]> = { // Changed to string[]
  'Engineer': ['technical', 'soundDesign'],
  'Producer': ['creativity', 'arrangement'],
  'Songwriter': ['creativity', 'songwriting'],
  'Mix Engineer': ['technical', 'ear'],
  'Mastering Engineer': ['technical', 'mastering'],
  'Sound Designer': ['creativity', 'soundDesign']
};

const genreAffinities = [
  { genre: 'Rock', bonus: 10 },
  { genre: 'Pop', bonus: 10 },
  { genre: 'Electronic', bonus: 10 },
  { genre: 'Hip-hop', bonus: 10 },
  { genre: 'Acoustic', bonus: 10 },
  { genre: 'Jazz', bonus: 10 },
  { genre: 'Classical', bonus: 10 },
  { genre: 'Folk', bonus: 10 },
  { genre: 'R&B', bonus: 10 }
];

export const generateStaffMember = (role: StaffRole): StaffMember => {
  const name = names[Math.floor(Math.random() * names.length)];
  const hasAffinity = Math.random() > 0.6; // 40% chance of genre affinity
  const affinity = hasAffinity ? genreAffinities[Math.floor(Math.random() * genreAffinities.length)] : null;

  const primaryStats: StaffStats = {
    creativity: primaryStatsRange.min + Math.floor(Math.random() * (primaryStatsRange.max - primaryStatsRange.min + 1)),
    technical: primaryStatsRange.min + Math.floor(Math.random() * (primaryStatsRange.max - primaryStatsRange.min + 1)),
    speed: primaryStatsRange.min + Math.floor(Math.random() * (primaryStatsRange.max - primaryStatsRange.min + 1))
  };

  // Adjust stats based on role
  if (roleSkills[role]) {
    roleSkills[role].forEach(skillName => {
      // This cast is necessary because skillName is a string, but primaryStats expects a keyof StaffStats
      (primaryStats as any)[skillName] = Math.min(100, (primaryStats as any)[skillName] + 10 + Math.floor(Math.random() * 10)); // Boost relevant stats
    });
  }

  return {
    id: `staff_${Date.now()}_${Math.random()}`,
    name,
    role,
    primaryStats,
    xpInRole: 0,
    levelInRole: 1,
    genreAffinity: affinity,
    energy: 100,
    mood: 75,
    salary: 80 + Math.floor(Math.random() * 120), // $80-200 per week
    status: 'Idle',
    assignedProjectId: null
  };
};

export const levelUpStaff = (staff: StaffMember): StaffMember => {
  const newLevel = staff.levelInRole + 1;
  const xpForNextLevel = newLevel * xpToNextLevelBase;
  
  return {
    ...staff,
    levelInRole: newLevel,
    xpInRole: staff.xpInRole - xpForNextLevel,
    primaryStats: {
      creativity: staff.primaryStats.creativity + statIncreasePerLevel,
      technical: staff.primaryStats.technical + statIncreasePerLevel,
      speed: staff.primaryStats.speed + statIncreasePerLevel
    }
  };
};