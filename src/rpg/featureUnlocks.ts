/** Progressive disclosure of console techniques (#260).
 *
 * Overdrive, Combo and Streak Bank are earned, not front-loaded. Unlock truth is
 * DERIVED from existing progression (level, settled sessions in the financial
 * history) plus a tiny persisted counter set (`featureProgress`). Only the
 * "seen" acknowledgement is stored for presentation; the unlock itself is
 * recomputed, so it is deterministic and survives reloads.
 *
 * Legacy saves (no `featureProgress`) that already show progress keep every
 * technique: nothing that existed is removed, it is only paced for new careers.
 *
 * Pure functions only - no RNG, no dates, no React.
 */
import type { GameState } from '@/types/game';

export type ProducerFeature = 'overdrive' | 'combo' | 'streak-bank';

/** Reveal / dependency order. A later feature never unlocks before an earlier one. */
export const FEATURE_ORDER: readonly ProducerFeature[] = ['overdrive', 'combo', 'streak-bank'];

/** Combo level the player must reach (after Combo unlocks) to earn Streak Bank. */
export const BANK_COMBO_GOAL = 3;

export interface FeatureProgress {
  /** Highest same-day combo reached while Combo was unlocked. */
  bestCombo: number;
  /** A Silver or Gold stage grade has been earned at least once. */
  goodTake: boolean;
  /** Reveals the player has acknowledged. */
  seen: ProducerFeature[];
  /** Features kept from a pre-#260 save so progressed players never lose them. */
  grandfathered?: ProducerFeature[];
}

export interface FeatureUnlockState {
  unlocked: boolean;
  /** Unlocked but its reveal has not been acknowledged yet. */
  newlyUnlocked: boolean;
  reason: string;
  /** Short copy describing what is still needed (empty once unlocked). */
  requirement: string;
}

export const FEATURE_COPY: Record<ProducerFeature, { title: string; body: string; chronicle: string }> = {
  overdrive: {
    title: 'New technique: Overdrive',
    body: 'Spend extra energy to push a take harder.',
    chronicle: 'You know the desk well enough to push it harder: Overdrive is yours.',
  },
  combo: {
    title: "You're finding a groove",
    body: 'Strong consecutive takes can now build Combo.',
    chronicle: 'Back-to-back takes started to flow: Combo unlocked.',
  },
  'streak-bank': {
    title: 'New technique: Bank the streak',
    body: "Cash out the room's momentum, or risk holding it.",
    chronicle: "You learned to cash in the room's momentum: Streak Bank unlocked.",
  },
};

type Unlockable = Pick<GameState, 'financials' | 'playerData' | 'featureProgress' | 'activeProject'>;

const sessionsCompleted = (s: Unlockable): number => s.financials?.reports?.length ?? 0;

/** A pre-#260 save: no tracker, but real progress already exists. */
const isLegacyProgressed = (s: Unlockable): boolean =>
  !s.featureProgress &&
  (sessionsCompleted(s) >= 1 || (s.playerData?.level ?? 1) >= 2 || (s.activeProject?.workSessionCount ?? 0) > 0);

const emptyProgress = (): FeatureProgress => ({ bestCombo: 0, goodTake: false, seen: [] });

const rules = (s: Unlockable, p: FeatureProgress): Record<ProducerFeature, boolean> => {
  const sessions = sessionsCompleted(s);
  const overdrive = (sessions >= 2 && p.goodTake) || sessions >= 4;
  const combo = overdrive && sessions >= 4;
  const bank = combo && (p.bestCombo >= BANK_COMBO_GOAL || sessions >= 8);
  return { overdrive, combo, 'streak-bank': bank };
};

const REQUIREMENT: Record<ProducerFeature, string> = {
  overdrive: 'Finish 2 sessions and land a Silver or Gold take (or finish 4 sessions).',
  combo: 'Finish 4 sessions.',
  'streak-bank': `Reach a x${BANK_COMBO_GOAL} combo once Combo is unlocked (or finish 8 sessions).`,
};

export const resolveProducerFeatureUnlocks = (state: Unlockable): Record<ProducerFeature, FeatureUnlockState> => {
  const legacy = isLegacyProgressed(state);
  const progress = state.featureProgress ?? emptyProgress();
  const earned = rules(state, progress);
  const out = {} as Record<ProducerFeature, FeatureUnlockState>;
  for (const f of FEATURE_ORDER) {
    const grand = legacy || !!progress.grandfathered?.includes(f);
    const unlocked = grand || earned[f];
    const seen = grand || progress.seen.includes(f);
    out[f] = {
      unlocked,
      newlyUnlocked: unlocked && !seen,
      reason: grand ? 'Kept from an earlier save.' : unlocked ? 'Earned through play.' : 'Not unlocked yet.',
      requirement: unlocked ? '' : REQUIREMENT[f],
    };
  }
  return out;
};

export const isFeatureUnlocked = (state: Unlockable, feature: ProducerFeature): boolean =>
  resolveProducerFeatureUnlocks(state)[feature].unlocked;

/** Reveal queue head: at most one reveal is ever shown; the rest wait their turn. */
export const nextFeatureReveal = (state: Unlockable): ProducerFeature | null => {
  const r = resolveProducerFeatureUnlocks(state);
  return FEATURE_ORDER.find((f) => r[f].newlyUnlocked) ?? null;
};

/** Materialise tracker + grandfathered features so later writes never lose legacy unlocks. */
const materialise = (state: GameState): FeatureProgress => {
  if (state.featureProgress) return state.featureProgress;
  const r = resolveProducerFeatureUnlocks(state);
  const kept = FEATURE_ORDER.filter((f) => r[f].unlocked);
  return { ...emptyProgress(), seen: kept, grandfathered: kept };
};

/** Record the evidence the rules read: best combo (only while Combo is unlocked) and a Silver/Gold take. */
export const recordTechniqueProgress = (
  state: GameState,
  evt: { combo?: number; grade?: 'Gold' | 'Silver' | 'Bronze' | null },
): GameState => {
  const base = materialise(state);
  const comboOn = isFeatureUnlocked({ ...state, featureProgress: base }, 'combo');
  const bestCombo = comboOn ? Math.max(base.bestCombo, evt.combo ?? 0) : base.bestCombo;
  const goodTake = base.goodTake || evt.grade === 'Gold' || evt.grade === 'Silver';
  if (state.featureProgress && bestCombo === base.bestCombo && goodTake === base.goodTake) return state;
  return { ...state, featureProgress: { ...base, bestCombo, goodTake } };
};

/** Acknowledge the reveal: persists only the "seen" flag and writes a Chronicle line. */
export const acknowledgeFeatureReveal = (state: GameState, feature: ProducerFeature): GameState => {
  const base = materialise(state);
  if (base.seen.includes(feature)) return state.featureProgress ? state : { ...state, featureProgress: base };
  const story = state.storylineState;
  return {
    ...state,
    featureProgress: { ...base, seen: [...base.seen, feature] },
    storylineState: story
      ? {
          ...story,
          chronicle: [
            ...(story.chronicle ?? []),
            { day: state.currentDay, kind: 'event' as const, title: FEATURE_COPY[feature].title, outcome: FEATURE_COPY[feature].chronicle },
          ].slice(-60),
        }
      : story,
  };
};
