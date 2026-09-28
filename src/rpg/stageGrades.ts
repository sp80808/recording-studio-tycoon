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
