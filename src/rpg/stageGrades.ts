/** Stage grades — every stage gets a Gold/Silver/Bronze verdict at completion.
 * Pure; wiring attaches the result at the stageCompleted branch in useStageWork.
 */

export type StageGrade = 'Gold' | 'Silver' | 'Bronze';

export interface StageGradeInput {
  sessionsTaken: number;
  /** Expected sessions for the stage (par). */
  parSessions: number;
  /** Best minigame take this stage: 'S' | 'A' | 'B' | 'C' | null (skipped). */
  minigameTake: 'S' | 'A' | 'B' | 'C' | null;
  /** 0-1 fraction of sessions matching the stage focus areas. */
  focusMatch: number;
}

export interface StageGradeResult {
  grade: StageGrade;
  /** Quality points carried into the project score. */
  qualityCarry: number;
  /** When true the project rank caps at A no matter the final score. */
  capsProjectAtA: boolean;
}

export const gradeStage = (input: StageGradeInput): StageGradeResult => {
  const { sessionsTaken, parSessions, minigameTake, focusMatch } = input;
  const onPar = sessionsTaken <= Math.max(1, parSessions);
  const sharpFocus = focusMatch >= 0.6;

  if ((minigameTake === 'S' || minigameTake === 'A') && onPar && sharpFocus) {
    return { grade: 'Gold', qualityCarry: 4, capsProjectAtA: false };
  }
  if (minigameTake === null) {
    // Skipped take = auto C-take: stage completes but never shines.
    return { grade: 'Bronze', qualityCarry: 0, capsProjectAtA: true };
  }
  if (onPar || sharpFocus) {
    return { grade: 'Silver', qualityCarry: 2, capsProjectAtA: false };
  }
  return { grade: 'Bronze', qualityCarry: 0, capsProjectAtA: true };
};

/** A-grade ceiling applied when any stage capped the project. */
export const A_GRADE_CAP = 89;

/** Quality carry-forward per grade (summed at settlement, clamped 0-12). */
export const STAGE_GRADE_CARRY: Record<StageGrade, number> = {
  Gold: 4,
  Silver: 2,
  Bronze: 0,
};

/** Only a skipped/rough stage caps the project. */
export const gradeCapsProject = (grade: StageGrade): boolean => grade === 'Bronze';

/** Minigame take per stage — best take counts, skipped stays null. */
export type StageTake = 'S' | 'A' | 'B' | 'C';

const TAKE_ORDER: StageTake[] = ['C', 'B', 'A', 'S'];

/**
 * Maps a minigame rawScore to a take grade. Calibrated to the settlement
 * weight in useGameLogic (points added = rawScore/1000*2, clamped 0-10):
 * a take worth 1.6+ quality points is S-tier work.
 */
export const takeFromRawScore = (rawScore: number): StageTake => {
  const added = (rawScore / 1000) * 2;
  if (added >= 1.6) return 'S';
  if (added >= 1.0) return 'A';
  if (added >= 0.5) return 'B';
  return 'C';
};

export const bestTake = (
  a: StageTake | null | undefined,
  b: StageTake | null | undefined
): StageTake | null => {
  if (!a) return b ?? null;
  if (!b) return a;
  return TAKE_ORDER.indexOf(a) >= TAKE_ORDER.indexOf(b) ? a : b;
};

/** Focus fraction from a focus-match boolean (focus always splits 3 ways). */
export const focusMatchFraction = (matched: boolean): number => (matched ? 1 : 0.4);
