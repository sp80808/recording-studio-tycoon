/**
 * Skill practice loop — maps craft skills to short minigames and awards
 * skill XP from performance grade (not flat button clicks).
 */
import type { GameState, PlayerData, Skill } from '@/types/game';
import type { MinigameType } from '@/components/minigames/MinigameManager';
import { grantSkillXp } from '@/utils/skillUtils';

export type PlayerSkillName = keyof PlayerData['skills'];

export type PracticeGrade = 'S' | 'A' | 'B' | 'C' | 'F';

export interface SkillPracticeDef {
  skill: PlayerSkillName;
  label: string;
  blurb: string;
  /** Primary practice minigame (must exist in MinigameManager). */
  minigame: MinigameType;
  accent: 'blue' | 'green' | 'red' | 'yellow' | 'cyan' | 'purple';
  icon: string;
}

/** Energy burned per practice session (same unit as take energy). */
export const PRACTICE_ENERGY_COST = 1;

/** Tiny XP from the accessibility "study notes" fallback (no minigame). */
export const STUDY_NOTES_SKILL_XP = 6;

export const SKILL_PRACTICE_CATALOG: readonly SkillPracticeDef[] = [
  {
    skill: 'songwriting',
    label: 'Songwriting',
    blurb: 'Pick hooks and themes under pressure.',
    minigame: 'lyric-focus',
    accent: 'purple',
    icon: '✎',
  },
  {
    skill: 'rhythm',
    label: 'Rhythm',
    blurb: 'Lock grooves on the pads.',
    minigame: 'beat-pad',
    accent: 'yellow',
    icon: '🥁',
  },
  {
    skill: 'tracking',
    label: 'Tracking',
    blurb: 'Punch takes on the count.',
    minigame: 'punch-in',
    accent: 'red',
    icon: '🎙',
  },
  {
    skill: 'mixing',
    label: 'Mixing',
    blurb: 'Balance faders to target levels.',
    minigame: 'mixing',
    accent: 'blue',
    icon: '🎚️',
  },
  {
    skill: 'mastering',
    label: 'Mastering',
    blurb: 'Polish loudness and dynamics.',
    minigame: 'mastering',
    accent: 'cyan',
    icon: '✨',
  },
  {
    skill: 'tapeSplicing',
    label: 'Tape Splicing',
    blurb: 'Cut and join tape with precision.',
    minigame: 'tape-splicing',
    accent: 'yellow',
    icon: '✂',
  },
  {
    skill: 'vocalComping',
    label: 'Vocal Comping',
    blurb: 'Assemble the best takes.',
    minigame: 'vocal-comp',
    accent: 'purple',
    icon: '🎤',
  },
  {
    skill: 'soundDesign',
    label: 'Sound Design',
    blurb: 'Build creative effect chains.',
    minigame: 'effectchain',
    accent: 'green',
    icon: '∿',
  },
  {
    skill: 'sampleWarping',
    label: 'Sample Warping',
    blurb: 'Sequence and reshape samples.',
    minigame: 'sampling',
    accent: 'cyan',
    icon: '🎹',
  },
  {
    skill: 'management',
    label: 'Management',
    blurb: 'Sequence an album release plan.',
    minigame: 'album-sequence',
    accent: 'green',
    icon: '📋',
  },
] as const;

export function getPracticeDef(skill: PlayerSkillName): SkillPracticeDef {
  const def = SKILL_PRACTICE_CATALOG.find((d) => d.skill === skill);
  if (!def) {
    throw new Error(`No practice definition for skill: ${skill}`);
  }
  return def;
}

export function minigameForSkill(skill: PlayerSkillName): MinigameType {
  return getPracticeDef(skill).minigame;
}

/**
 * Soft ceilings for minigames that do not score on the common 0–1000 band.
 * Used only for practice XP grading — project C/T rewards stay unchanged.
 */
const PRACTICE_SCORE_CEILING: Partial<Record<MinigameType, number>> = {
  mixing: 80, // MixingBoardGame: perfect four-channel mix
  'lyric-focus': 100,
  mastering: 800, // 4 targets × up to ~200 pts
  effectchain: 280,
  'tape-splicing': 400,
  sampling: 600, // 3 patterns × 2 tracks × up to 100
  maintenance: 20,
};

/** Normalize raw minigame scores into a shared 0–1000 practice band. */
export function normalizePracticeScore(rawScore: number, minigame: MinigameType): number {
  if (!Number.isFinite(rawScore) || rawScore < 0) return 0;
  const ceiling = PRACTICE_SCORE_CEILING[minigame] ?? 1000;
  return Math.min(1000, Math.round((rawScore / ceiling) * 1000));
}

export function gradeFromScore(normalizedScore: number): PracticeGrade {
  if (normalizedScore >= 850) return 'S';
  if (normalizedScore >= 700) return 'A';
  if (normalizedScore >= 500) return 'B';
  if (normalizedScore >= 300) return 'C';
  return 'F';
}

/**
 * Skill XP from a practice grade. Tuned below project completion XP so
 * practice is meaningful but not a replacement for real sessions.
 */
export function skillXpFromPracticeScore(normalizedScore: number): number {
  const grade = gradeFromScore(normalizedScore);
  switch (grade) {
    case 'S':
      return 48 + Math.floor(normalizedScore / 40); // ~48–73
    case 'A':
      return 32 + Math.floor(normalizedScore / 50); // ~32–51
    case 'B':
      return 16 + Math.floor(normalizedScore / 60); // ~16–32
    case 'C':
      return 6 + Math.floor(normalizedScore / 80); // ~6–18
    case 'F':
    default:
      return Math.max(0, 2 + Math.floor(normalizedScore / 120)); // ~2–4
  }
}

export function canAffordPractice(gameState: GameState, energyCost = PRACTICE_ENERGY_COST): boolean {
  return (gameState.playerData.dailyWorkCapacity ?? 0) >= energyCost;
}

export interface PracticeRewardResult {
  skillXp: number;
  producerXp: number;
  grade: PracticeGrade;
  levelUps: number;
  updatedSkill: Skill;
  energySpent: number;
}

export function computePracticeReward(
  skill: Skill,
  rawScore: number,
  minigame: MinigameType
): Omit<PracticeRewardResult, 'energySpent'> {
  const normalized = normalizePracticeScore(rawScore, minigame);
  const skillXp = skillXpFromPracticeScore(normalized);
  const grade = gradeFromScore(normalized);
  const { updatedSkill, levelUps } = grantSkillXp(skill, skillXp);
  const producerXp = Math.max(0, Math.floor(skillXp / 4));
  return { skillXp, producerXp, grade, levelUps, updatedSkill };
}

/**
 * Apply a completed practice minigame: spend energy, grant skill + producer XP.
 * Returns null if the player cannot afford the energy cost.
 */
export function applySkillPractice(
  gameState: GameState,
  skillName: PlayerSkillName,
  rawScore: number
): { next: GameState; reward: PracticeRewardResult } | null {
  if (!canAffordPractice(gameState)) return null;

  const def = getPracticeDef(skillName);
  const current = gameState.playerData.skills[skillName];
  if (!current) return null;

  const computed = computePracticeReward(current, rawScore, def.minigame);
  const reward: PracticeRewardResult = {
    ...computed,
    energySpent: PRACTICE_ENERGY_COST,
  };

  const next: GameState = {
    ...gameState,
    playerData: {
      ...gameState.playerData,
      dailyWorkCapacity: Math.max(0, gameState.playerData.dailyWorkCapacity - PRACTICE_ENERGY_COST),
      xp: gameState.playerData.xp + reward.producerXp,
      lastMinigameType: def.minigame,
      skills: {
        ...gameState.playerData.skills,
        [skillName]: reward.updatedSkill,
      },
    },
  };

  return { next, reward };
}

/**
 * Accessibility fallback: spend energy for a tiny fixed skill XP grant.
 * Deliberately weak so the minigame remains the primary path.
 */
export function applyStudyNotes(
  gameState: GameState,
  skillName: PlayerSkillName
): { next: GameState; skillXp: number; levelUps: number } | null {
  if (!canAffordPractice(gameState)) return null;
  const current = gameState.playerData.skills[skillName];
  if (!current) return null;

  const { updatedSkill, levelUps } = grantSkillXp(current, STUDY_NOTES_SKILL_XP);
  const next: GameState = {
    ...gameState,
    playerData: {
      ...gameState.playerData,
      dailyWorkCapacity: Math.max(0, gameState.playerData.dailyWorkCapacity - PRACTICE_ENERGY_COST),
      skills: {
        ...gameState.playerData.skills,
        [skillName]: updatedSkill,
      },
    },
  };
  return { next, skillXp: STUDY_NOTES_SKILL_XP, levelUps };
}
