import { Skill, PlayerData, StaffMember } from '@/types/game';

/**
 * Calculates the XP needed to reach the next level for a skill.
 * Formula: Math.floor(100 * Math.pow(currentLevel, 1.5))
 * @param currentLevel - The current level of the skill.
 * @returns The total XP needed for the next level.
 */
export const calculateXpToNextLevel = (currentLevel: number): number => {
  if (currentLevel <= 0) return 100; // Base XP for level 1
  return Math.floor(100 * Math.pow(currentLevel, 1.5));
};

/**
 * Grants XP to a skill and handles level-ups.
 * A skill can level up multiple times from a single XP grant.
 * @param currentSkill - The current state of the skill.
 * @param amount - The amount of XP to grant.
 * @returns An object containing the updated skill and the number of times it leveled up.
 */
export const grantSkillXp = (currentSkill: Skill, amount: number): { updatedSkill: Skill, levelUps: number } => {
  let newXp = currentSkill.xp + amount;
  let newLevel = currentSkill.level;
  let xpForNext = currentSkill.xpToNextLevel;
  let levelUps = 0;

  while (newXp >= xpForNext) {
    newXp -= xpForNext;
    newLevel++;
    levelUps++;
    xpForNext = calculateXpToNextLevel(newLevel);
  }

  return {
    updatedSkill: {
      xp: newXp,
      level: newLevel,
      xpToNextLevel: xpForNext,
    },
    levelUps,
  };
};

/**
 * Initializes the skill object for a new player.
 * All skills start at level 1 with 0 XP.
 * @returns The initialized skills object for PlayerData.
 */
export const initializeSkillsPlayer = (): PlayerData['skills'] => {
  const initialLevel = 1;
  const initialXp = 0;
  const xpToNext = calculateXpToNextLevel(initialLevel);

  const initialSkill: Skill = {
    level: initialLevel,
    xp: initialXp,
    xpToNextLevel: xpToNext,
  };

  return {
    songwriting: { ...initialSkill },
    rhythm: { ...initialSkill },
    tracking: { ...initialSkill },
    mixing: { ...initialSkill },
    mastering: { ...initialSkill },
    tapeSplicing: { ...initialSkill },
    vocalComping: { ...initialSkill },
    soundDesign: { ...initialSkill },
    sampleWarping: { ...initialSkill },
    management: { ...initialSkill }, // Player-specific skill
  };
};

/**
 * Initializes the skill object for a new staff member.
 * All skills start at level 1 with 0 XP.
 * @returns The initialized skills object for StaffMember.
 */
export const initializeSkillsStaff = (): StaffMember['skills'] => {
  const initialLevel = 1;
  const initialXp = 0;
  const xpToNext = calculateXpToNextLevel(initialLevel);

  const initialSkill: Skill = {
    level: initialLevel,
    xp: initialXp,
    xpToNextLevel: xpToNext,
  };

  return {
    songwriting: { ...initialSkill },
    rhythm: { ...initialSkill },
    tracking: { ...initialSkill },
    mixing: { ...initialSkill },
    mastering: { ...initialSkill },
    tapeSplicing: { ...initialSkill },
    vocalComping: { ...initialSkill },
    soundDesign: { ...initialSkill },
    sampleWarping: { ...initialSkill },
    // Management skill is excluded for staff
  };
};
