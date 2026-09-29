// Config-driven monetisation experiments A–E — Flight Case Monetisation (bead 89o.7).
// Presentation / copy / shelf emphasis only. Never allowed to worsen free
// progression (earned cases, chore loot, settlement, energy, etc.).
// PRODUCT RULE: experiments must NEVER gate storyline / narrative / campaign /
// branch / finale / act unlocks — monetisation is cosmetics & rare/skinned gear only.

export type ExperimentId = 'A' | 'B' | 'C' | 'D' | 'E';

/** Dealer presentation surfaces only — never story / campaign / narrative. */
export type ExperimentSurface =
  | 'dealer_layout'
  | 'preview_default'
  | 'dealer_copy'
  | 'celebration_framing';

export interface ExperimentConfig {
  id: ExperimentId;
  label: string;
  /** Human-readable hypothesis; never a free-progression or story lever. */
  hypothesis: string;
  surface: ExperimentSurface;
  /** Hard invariant: must always be false. Enforced at module load. */
  worsensFreeProgression: false;
  params: {
    /** Featured shelf weight relative to control (1 = same). */
    featuredWeight?: number;
    /** Expand product previews by default. */
    previewExpanded?: boolean;
    /** Optional dealer subtitle override (copy only). */
    dealerTagline?: string;
    /** Premium celebration framing intensity 0–1 (visual only). */
    celebrationEmphasis?: number;
  };
}

/** Param names that would imply free-progression nerfs. */
const FORBIDDEN_PROGRESSION_PARAM =
  /loot|earn|energy|streak|grade|settlement|chore|free[_-]?case/i;

/** Surfaces / copy that would imply story or campaign paywalls. */
const FORBIDDEN_STORY_SURFACE =
  /storyline|narrative|campaign|branch|finale|act[_-]?unlock|story[_-]?path|story[_-]?gate/i;

export const MONETISATION_EXPERIMENTS: Record<ExperimentId, ExperimentConfig> = {
  A: {
    id: 'A',
    label: 'Control',
    hypothesis: 'Baseline dealer layout and copy.',
    surface: 'dealer_layout',
    worsensFreeProgression: false,
    params: { featuredWeight: 1, previewExpanded: false, celebrationEmphasis: 0.5 },
  },
  B: {
    id: 'B',
    label: 'Featured boost',
    hypothesis: 'Emphasising Featured Cases lifts view→start without touching free loot.',
    surface: 'dealer_layout',
    worsensFreeProgression: false,
    params: { featuredWeight: 1.4, previewExpanded: false, celebrationEmphasis: 0.5 },
  },
  C: {
    id: 'C',
    label: 'Preview expanded',
    hypothesis: 'Pre-expanded disclosed contents increase trust and starts.',
    surface: 'preview_default',
    worsensFreeProgression: false,
    params: { featuredWeight: 1, previewExpanded: true, celebrationEmphasis: 0.5 },
  },
  D: {
    id: 'D',
    label: 'Soft proof copy',
    hypothesis: 'Warehouse-crew copy improves opens without paywalling progression.',
    surface: 'dealer_copy',
    worsensFreeProgression: false,
    params: {
      featuredWeight: 1,
      previewExpanded: false,
      dealerTagline: 'Tour crews stock these for the look — earned cases stay free and random as ever.',
      celebrationEmphasis: 0.5,
    },
  },
  E: {
    id: 'E',
    label: 'Celebration emphasis',
    hypothesis: 'Richer premium reveal framing lifts equip rate after verified purchase.',
    surface: 'celebration_framing',
    worsensFreeProgression: false,
    params: { featuredWeight: 1, previewExpanded: false, celebrationEmphasis: 0.9 },
  },
};

export const EXPERIMENT_IDS: ExperimentId[] = ['A', 'B', 'C', 'D', 'E'];

export function assertExperimentsSafe(
  configs: Record<ExperimentId, ExperimentConfig> = MONETISATION_EXPERIMENTS,
): void {
  for (const id of EXPERIMENT_IDS) {
    const cfg = configs[id];
    if (!cfg) throw new Error(`Missing monetisation experiment ${id}`);
    if (cfg.worsensFreeProgression !== false) {
      throw new Error(`Experiment ${id} must not worsen free progression`);
    }
    if (cfg.id !== id) throw new Error(`Experiment key/id mismatch for ${id}`);
    if (FORBIDDEN_STORY_SURFACE.test(cfg.surface)) {
      throw new Error(`Experiment ${id} must not use a storyline/narrative surface`);
    }
    // Guard: no param name that smells like progression nerfs or story gates.
    for (const key of Object.keys(cfg.params)) {
      if (FORBIDDEN_PROGRESSION_PARAM.test(key) || FORBIDDEN_STORY_SURFACE.test(key)) {
        throw new Error(`Experiment ${id} param "${key}" touches free progression or story`);
      }
    }
  }
}

assertExperimentsSafe();

let assigned: ExperimentId = 'A';

/** Sticky assignment for the session (tests may override). */
export function assignMonetisationExperiment(id: ExperimentId): ExperimentId {
  if (!MONETISATION_EXPERIMENTS[id]) throw new Error(`Unknown experiment ${id}`);
  assigned = id;
  return assigned;
}

export function getActiveMonetisationExperiment(): ExperimentConfig {
  return MONETISATION_EXPERIMENTS[assigned];
}

export function getActiveExperimentId(): ExperimentId {
  return assigned;
}

/** Deterministic cohort from an opaque subject key (no PII required). */
export function cohortFromSubject(subjectKey: string): ExperimentId {
  let h = 0;
  for (let i = 0; i < subjectKey.length; i++) {
    h = (h * 31 + subjectKey.charCodeAt(i)) >>> 0;
  }
  return EXPERIMENT_IDS[h % EXPERIMENT_IDS.length];
}
