/**
 * Authoritative 7-Phase Reveal State Machine for Flight Case Unboxing.
 *
 * Sequence:
 *   closed -> latch -> open -> silhouette -> reveal -> details -> collect
 *
 * Non-negotiable invariants:
 * 1. The game result/outcome MUST be fixed and settled authoritatively BEFORE
 *    the animation or state machine begins. The animation NEVER alters
 *    probability, drop rates, item roll, or reward content.
 * 2. Outcome is strictly immutable across all transitions and phases.
 * 3. Instant skip reaches the `details` state immediately without modifying the outcome.
 * 4. Reduced-motion mode transitions immediately to `details` on unlatch.
 * 5. Strict ban on gambling-style casino spinners, reels, near-miss effects, or countdown pressure.
 */

export type RevealPhase =
  | 'closed'
  | 'latch'
  | 'open'
  | 'silhouette'
  | 'reveal'
  | 'details'
  | 'collect';

export const REVEAL_PHASES: readonly RevealPhase[] = [
  'closed',
  'latch',
  'open',
  'silhouette',
  'reveal',
  'details',
  'collect',
] as const;

/** Canonical ordered phase progression */
export const NEXT_PHASE_MAP: Record<RevealPhase, RevealPhase> = {
  closed: 'latch',
  latch: 'open',
  open: 'silhouette',
  silhouette: 'reveal',
  reveal: 'details',
  details: 'collect',
  collect: 'collect',
};

/** Default duration (ms) spent in automatic animation phases */
export const REVEAL_PHASE_TIMINGS: Record<RevealPhase, number> = {
  closed: 0,       // Interactive wait
  latch: 240,      // Mechanical latch snap
  open: 320,       // Lid hinge elevation
  silhouette: 340, // Foam cutout back-illumination
  reveal: 450,     // Gear elevation & shine
  details: 0,      // Interactive decision dock
  collect: 0,      // Terminal state
};

export interface RevealPhaseMeta {
  phase: RevealPhase;
  isAutomatic: boolean;
  canSkip: boolean;
  soundCue?: 'ui-gear-switch' | 'ui-tactile-click' | 'project-complete';
  description: string;
}

export const REVEAL_PHASE_METADATA: Record<RevealPhase, RevealPhaseMeta> = {
  closed: {
    phase: 'closed',
    isAutomatic: false,
    canSkip: false,
    description: 'Rugged flight case sealed with spring-loaded butterfly latches.',
  },
  latch: {
    phase: 'latch',
    isAutomatic: true,
    canSkip: true,
    soundCue: 'ui-gear-switch',
    description: 'Spring latches rotate and snap open with mechanical tactile click.',
  },
  open: {
    phase: 'open',
    isAutomatic: true,
    canSkip: true,
    description: 'Heavy flight case lid hinges open to expose protective foam cavity.',
  },
  silhouette: {
    phase: 'silhouette',
    isAutomatic: true,
    canSkip: true,
    description: 'Mysterious gear silhouette cradled in custom die-cut foam inlay.',
  },
  reveal: {
    phase: 'reveal',
    isAutomatic: true,
    canSkip: true,
    soundCue: 'project-complete',
    description: 'Hardware elevates from foam with illuminated finish and celebratory sheen.',
  },
  details: {
    phase: 'details',
    isAutomatic: false,
    canSkip: false,
    description: 'Full hardware readout, condition meter, appraisal, and action dock.',
  },
  collect: {
    phase: 'collect',
    isAutomatic: false,
    canSkip: false,
    description: 'Item claimed, equipped to rack, stashed in inventory, or sold.',
  },
};

export interface RevealState<T> {
  readonly phase: RevealPhase;
  readonly outcome: Readonly<T>;
  readonly isSkipped: boolean;
  readonly isReducedMotion: boolean;
  readonly selectedAction: string | null;
  readonly history: readonly RevealPhase[];
}

export type RevealAction =
  | { type: 'START_UNLATCH' }
  | { type: 'STEP_FORWARD' }
  | { type: 'SKIP' }
  | { type: 'CHOOSE_ACTION'; action: string }
  | { type: 'RESET'; nextOutcome?: any };

/**
 * Creates the initial reveal state with an authoritatively settled outcome.
 * The outcome object is frozen to guarantee immutability.
 */
export function createInitialRevealState<T>(
  outcome: T,
  options?: { reducedMotion?: boolean }
): RevealState<T> {
  if (outcome === undefined || outcome === null) {
    throw new Error('RevealStateMachine requires an authoritatively settled outcome before initialization.');
  }

  // Shallow freeze the outcome to prevent accidental in-place mutation
  const frozenOutcome = Object.freeze(outcome);

  return {
    phase: 'closed',
    outcome: frozenOutcome,
    isSkipped: false,
    isReducedMotion: Boolean(options?.reducedMotion),
    selectedAction: null,
    history: ['closed'],
  };
}

/**
 * Pure state reducer driving the 7-phase reveal machine.
 */
export function revealReducer<T>(
  state: RevealState<T>,
  action: RevealAction
): RevealState<T> {
  switch (action.type) {
    case 'START_UNLATCH': {
      if (state.phase !== 'closed') return state;

      // Reduced-motion bypasses all intermediate animation phases directly to details
      if (state.isReducedMotion) {
        return {
          ...state,
          phase: 'details',
          history: [...state.history, 'details'],
        };
      }

      return {
        ...state,
        phase: 'latch',
        history: [...state.history, 'latch'],
      };
    }

    case 'STEP_FORWARD': {
      if (state.phase === 'closed') {
        return revealReducer(state, { type: 'START_UNLATCH' });
      }

      const nextPhase = NEXT_PHASE_MAP[state.phase];
      // Cannot step past details via automatic progression; requires explicit CHOOSE_ACTION
      if (state.phase === 'details' || state.phase === 'collect') {
        return state;
      }

      return {
        ...state,
        phase: nextPhase,
        history: [...state.history, nextPhase],
      };
    }

    case 'SKIP': {
      // If already in details or collect, skip is a no-op
      if (state.phase === 'details' || state.phase === 'collect') {
        return state;
      }

      return {
        ...state,
        phase: 'details',
        isSkipped: true,
        history: [...state.history, 'details'],
      };
    }

    case 'CHOOSE_ACTION': {
      if (state.phase === 'collect') return state;

      return {
        ...state,
        phase: 'collect',
        selectedAction: action.action,
        history: [...state.history, 'collect'],
      };
    }

    case 'RESET': {
      const next = action.nextOutcome !== undefined ? action.nextOutcome : state.outcome;
      return createInitialRevealState(next, { reducedMotion: state.isReducedMotion });
    }

    default:
      return state;
  }
}
