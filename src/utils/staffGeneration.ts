import { StaffMember, StaffRole, StaffStats, GenreAffinity, StudioSkill } from '@/types/game';

// Constants for staff generation
const MIN_STAT = 1;
const MAX_STAT = 5;
const MIN_SALARY = 50;
const MAX_SALARY = 200;
const MIN_SKILL_LEVEL = 1;
const MAX_SKILL_LEVEL = 3;

// Available genres for specialization
const GENRES = [
  'Rock', 'Pop', 'Hip Hop', 'Electronic', 'Jazz', 'Classical',
  'Country', 'R&B', 'Metal', 'Folk', 'Blues', 'Reggae'
];

// Available roles and their primary stats
const ROLE_STATS: Record<StaffRole, { primary: keyof StaffStats; secondary: keyof StaffStats }> = {
  'Engineer': { primary: 'technical', secondary: 'speed' },
  'Producer': { primary: 'creativity', secondary: 'technical' },
  'Songwriter': { primary: 'creativity', secondary: 'speed' },
  'Assistant': { primary: 'speed', secondary: 'technical' }
};

// Generate a random number between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a random name
const generateName = (): string => {
  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley',
    'Jamie', 'Quinn', 'Avery', 'Blake', 'Dakota', 'Emerson'
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
    'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'
  ];
  return `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`;
};

// Generate random stats based on role
const generateStats = (role: StaffRole): StaffStats => {
  const { primary, secondary } = ROLE_STATS[role];
  const stats: StaffStats = {
    creativity: MIN_STAT,
    technical: MIN_STAT,
    speed: MIN_STAT
  };

  // Set primary stat higher
  stats[primary] = randomInt(MAX_STAT - 1, MAX_STAT);
  // Set secondary stat medium
  stats[secondary] = randomInt(MIN_STAT + 1, MAX_STAT - 1);
  // Set remaining stat lower
  const remainingStat = Object.keys(stats).find(
    stat => stat !== primary && stat !== secondary
  ) as keyof StaffStats;
  stats[remainingStat] = randomInt(MIN_STAT, MIN_STAT + 1);

  return stats;
};

// Generate random skills based on role
const generateSkills = (role: StaffRole): Record<string, StudioSkill> => {
  const skills: Record<string, StudioSkill> = {};
  
  // Role-specific skills
  const roleSkills = {
    'Engineer': ['recording', 'mixing', 'mastering'],
    'Producer': ['arrangement', 'composition', 'production'],
    'Songwriter': ['lyrics', 'melody', 'harmony'],
    'Assistant': ['organization', 'communication', 'technical']
  };

  // Generate skills for the role
  roleSkills[role].forEach(skillName => {
    skills[skillName] = {
      name: skillName,
      level: randomInt(MIN_SKILL_LEVEL, MAX_SKILL_LEVEL),
      xp: 0,
      xpToNext: 100 // Assuming xpToNext is always 100 for new skills
    };
  });

  return skills;
};

// Generate random genre affinity
const generateGenreAffinity = (): GenreAffinity | null => {
  // 30% chance to have a genre affinity
  if (Math.random() > 0.3) return null;

  return {
    genre: GENRES[randomInt(0, GENRES.length - 1)],
    bonus: randomInt(5, 15)
  };
};

// Generate a new staff member
export const generateStaffMember = (): StaffMember => {
  const role = Object.keys(ROLE_STATS)[randomInt(0, Object.keys(ROLE_STATS).length - 1)] as StaffRole;
  const stats = generateStats(role);
  const skills = generateSkills(role);
  const salary = randomInt(MIN_SALARY, MAX_SALARY);

  return {
    id: `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: generateName(),
    role,
    primaryStats: stats,
    skills,
    xpInRole: 0,
    levelInRole: 1,
    genreAffinity: generateGenreAffinity(),
    energy: 100,
    mood: 100, // Default mood to 100
    salary,
    status: 'Idle',
    assignedProjectId: null
  };
};

// Generate a list of new candidates
export const generateCandidates = (count: number = 3): StaffMember[] => {
  return Array.from({ length: count }, () => generateStaffMember());
}; 