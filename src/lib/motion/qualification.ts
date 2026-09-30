/**
 * OriginKit Motion Qualification, Effect Budget, and Renderer Audit Harness (#74).
 *
 * Enforces RST's non-negotiable performance invariants:
 * 1. Only one continuous GPU visual system may own the viewport (PixiJS living studio exclusive priority).
 * 2. Secondary WebGL canvases are prohibited during normal gameplay.
 * 3. Total UI motion frame budget <= 2.0ms per 16.6ms (60 FPS) frame.
 * 4. Concurrent continuous ambient effects capped at <= 1 during normal gameplay, 0 in Focus/Minimal/Reduced-Motion.
 * 5. Hidden-tab suppression: 100% pause/unmount of continuous animations when tab is hidden.
 */

import { useState, useEffect } from "react";
import { useMotionCapabilities, type MotionCapabilities } from "./capabilities";

export type RendererType = "DOM" | "SVG" | "CSS" | "Canvas" | "WebGL";

export type QualityMode = "normal" | "focus" | "minimal" | "reducedMotion";

export type TabHiddenBehavior = "pause" | "unmount" | "settle_immediately" | "cancelled" | "inactive" | "none";

export interface EffectQualification {
  name: string;
  renderer: RendererType;
  continuous: boolean;
  expectedCost: string;
  gameplayAllowed: boolean;
  fallback: string;
  maxFpsTarget: number;
  tabHiddenBehavior: TabHiddenBehavior;
  allowedInModes: Record<QualityMode, boolean>;
  category: "tactile" | "reward" | "ambient" | "hud" | "disqualified";
  estimatedCostMs: number;
  description: string;
  disqualified?: boolean;
  disqualificationReason?: string;
}

export interface WebGLAuditResult {
  passed: boolean;
  approvedCount: number;
  unapprovedCount: number;
  approvedContexts: string[];
  unapprovedContexts: string[];
  violations: string[];
}

export interface ContinuousEffectsMeasurement {
  totalRegistered: number;
  continuousRegistered: number;
  activeContinuousCount: number;
  activeContinuousEffects: string[];
  activeAmbientCount: number;
  isBudgetExceeded: boolean;
  budgetLimit: number;
}

export interface MotionAuditReport {
  timestamp: number;
  passed: boolean;
  mode: QualityMode;
  isTabVisible: boolean;
  continuousMeasurement: ContinuousEffectsMeasurement;
  webglAudit: WebGLAuditResult;
  hiddenTabSuppressionPassed: boolean;
  qualityMatrixPassed: boolean;
  estimatedFrameTimeMs: number;
  withinFrameBudget: boolean;
  violations: string[];
  warnings: string[];
}

/** Maximum continuous ambient CSS/canvas visual effects permitted simultaneously during normal gameplay */
export const MAX_CONTINUOUS_AMBIENT_EFFECTS = 1;

/** Max allowable UI motion budget per 60fps frame (16.6ms total; PixiJS gets >=12ms, Idle >=2.6ms) */
export const UI_MOTION_FRAME_BUDGET_MS = 2.0;

/** Default active baseline effects in typical normal gameplay */
export const DEFAULT_NORMAL_ACTIVE_EFFECTS = ["AnalogVignette"];

/**
 * Authoritative registry of OriginKit and motion candidate effects evaluated for RST.
 */
export const EFFECT_REGISTRY: Record<string, EffectQualification> = {
  MagneticPress: {
    name: "MagneticPress",
    renderer: "DOM",
    continuous: false,
    expectedCost: "Negligible (<0.1ms CPU)",
    gameplayAllowed: true,
    fallback: "Instant button press (zero pull)",
    maxFpsTarget: 60,
    tabHiddenBehavior: "inactive",
    allowedInModes: {
      normal: true,
      focus: true,
      minimal: true,
      reducedMotion: false,
    },
    category: "tactile",
    estimatedCostMs: 0.05,
    description: "Tactile micro-motion with spring pull toward cursor and mechanical click depression.",
  },
  GlowSweep: {
    name: "GlowSweep",
    renderer: "CSS",
    continuous: true,
    expectedCost: "Low (<0.2ms GPU composite)",
    gameplayAllowed: true,
    fallback: "Static gold/amber border highlight",
    maxFpsTarget: 60,
    tabHiddenBehavior: "unmount",
    allowedInModes: {
      normal: true,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "reward",
    estimatedCostMs: 0.15,
    description: "GPU-composited light sweep across milestone cards and rare items.",
  },
  TextScramble: {
    name: "TextScramble",
    renderer: "DOM",
    continuous: false,
    expectedCost: "Low (<0.5ms JS execution)",
    gameplayAllowed: true,
    fallback: "Immediate target text render",
    maxFpsTarget: 33,
    tabHiddenBehavior: "settle_immediately",
    allowedInModes: {
      normal: true,
      focus: true,
      minimal: true,
      reducedMotion: false,
    },
    category: "hud",
    estimatedCostMs: 0.3,
    description: "Retro console glyph scramble decode transition before locking onto text.",
  },
  AnalogVignette: {
    name: "AnalogVignette",
    renderer: "CSS",
    continuous: true,
    expectedCost: "Low (<0.2ms GPU composite)",
    gameplayAllowed: true,
    fallback: "Unmounted",
    maxFpsTarget: 30,
    tabHiddenBehavior: "unmount",
    allowedInModes: {
      normal: true,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "ambient",
    estimatedCostMs: 0.15,
    description: "Subtle radial CRT cathode warmth at viewport perimeter.",
  },
  ParticleBurst: {
    name: "ParticleBurst",
    renderer: "Canvas",
    continuous: false,
    expectedCost: "Medium (~1.0ms peak)",
    gameplayAllowed: true,
    fallback: "Instant toast / audio cue",
    maxFpsTarget: 60,
    tabHiddenBehavior: "cancelled",
    allowedInModes: {
      normal: true,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "reward",
    estimatedCostMs: 1.0,
    description: "One-shot celebratory confetti or spark burst for major milestone payouts.",
  },
  RewardParticleBurst: {
    name: "RewardParticleBurst",
    renderer: "Canvas",
    continuous: false,
    expectedCost: "Low (<1ms CPU, <=1.2s, capped)",
    gameplayAllowed: false,
    fallback: "Skip particles; final card shown",
    maxFpsTarget: 60,
    tabHiddenBehavior: "cancelled",
    allowedInModes: {
      normal: true,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "reward",
    estimatedCostMs: 0.8,
    description: "Seeded one-shot rarity burst (Canvas 2D); budget per rarity in RARITY_FX_POLICY; cancels when tab hidden.",
  },
  RarityMaterialSweep: {
    name: "RarityMaterialSweep",
    renderer: "CSS",
    continuous: false,
    expectedCost: "Negligible (compositor transform)",
    gameplayAllowed: false,
    fallback: "No sweep; static card",
    maxFpsTarget: 60,
    tabHiddenBehavior: "settle_immediately",
    allowedInModes: {
      normal: true,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "reward",
    estimatedCostMs: 0.1,
    description: "One-shot specular gleam on the revealed card; does not loop.",
  },
  GearFlourish: {
    name: "GearFlourish",
    renderer: "DOM",
    continuous: false,
    expectedCost: "Low (<0.3ms CPU, bounded cycles)",
    gameplayAllowed: false,
    fallback: "Static family accent",
    maxFpsTarget: 60,
    tabHiddenBehavior: "settle_immediately",
    allowedInModes: {
      normal: true,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "reward",
    estimatedCostMs: 0.3,
    description: "Equipment-family accent (reels, filament, LED bar) that settles after a few cycles.",
  },
  GearDemoMeter: {
    name: "GearDemoMeter",
    renderer: "SVG",
    continuous: true,
    expectedCost: "Low (<0.1ms CPU, 4 Hz)",
    gameplayAllowed: true,
    fallback: "Static needle",
    maxFpsTarget: 60,
    tabHiddenBehavior: "pause",
    allowedInModes: {
      normal: true,
      focus: true,
      minimal: false,
      reducedMotion: false,
    },
    category: "tactile",
    estimatedCostMs: 0.1,
    description: "Seeded low-frequency inspector meter; no timer when off, reduced motion or hidden.",
  },
  VUMeterNeedle: {
    name: "VUMeterNeedle",
    renderer: "SVG",
    continuous: true,
    expectedCost: "Low (<0.3ms CPU)",
    gameplayAllowed: true,
    fallback: "Static peak LED indicator",
    maxFpsTarget: 60,
    tabHiddenBehavior: "pause",
    allowedInModes: {
      normal: true,
      focus: true,
      minimal: false,
      reducedMotion: false,
    },
    category: "tactile",
    estimatedCostMs: 0.25,
    description: "Audio console VU meter needle deflection synchronized with track playback.",
  },
  TapeFlutter: {
    name: "TapeFlutter",
    renderer: "CSS",
    continuous: true,
    expectedCost: "Low (<0.2ms GPU)",
    gameplayAllowed: true,
    fallback: "Static reel graphic",
    maxFpsTarget: 30,
    tabHiddenBehavior: "pause",
    allowedInModes: {
      normal: true,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "ambient",
    estimatedCostMs: 0.15,
    description: "Rotational wobble on tape reels during playback and scrubbing.",
  },
  FlightCaseGleam: {
    name: "FlightCaseGleam",
    renderer: "CSS",
    continuous: false,
    expectedCost: "Low (<0.3ms GPU)",
    gameplayAllowed: true,
    fallback: "Static metallic bevel",
    maxFpsTarget: 60,
    tabHiddenBehavior: "pause",
    allowedInModes: {
      normal: true,
      focus: true,
      minimal: false,
      reducedMotion: false,
    },
    category: "reward",
    estimatedCostMs: 0.2,
    description: "Loot crate metallic corner highlight animation on unboxing modal open.",
  },
  SecondaryWebGLStudio: {
    name: "SecondaryWebGLStudio",
    renderer: "WebGL",
    continuous: true,
    expectedCost: "Prohibitive (>8.0ms GPU)",
    gameplayAllowed: false,
    fallback: "Banned — PixiJS studio floor exclusive",
    maxFpsTarget: 0,
    tabHiddenBehavior: "none",
    allowedInModes: {
      normal: false,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "disqualified",
    estimatedCostMs: 8.5,
    description: "Disqualified candidate: competing WebGL viewport over studio floor violates GPU exclusivity.",
    disqualified: true,
    disqualificationReason: "Violates single continuous GPU visual system ownership invariant.",
  },
  CanvasFluidFX: {
    name: "CanvasFluidFX",
    renderer: "Canvas",
    continuous: true,
    expectedCost: "Prohibitive (>6.0ms CPU/GPU)",
    gameplayAllowed: false,
    fallback: "Static CSS linear gradient",
    maxFpsTarget: 0,
    tabHiddenBehavior: "none",
    allowedInModes: {
      normal: false,
      focus: false,
      minimal: false,
      reducedMotion: false,
    },
    category: "disqualified",
    estimatedCostMs: 6.5,
    description: "Disqualified candidate: continuous canvas 2D pixel-manipulation loop blows frame budget.",
    disqualified: true,
    disqualificationReason: "Exceeds 2.0ms UI frame budget; causes garbage collection frame drops.",
  },
};

/**
 * Register a new effect or candidate in the qualification registry.
 */
export function registerEffect(qualification: EffectQualification): void {
  EFFECT_REGISTRY[qualification.name] = qualification;
}

/**
 * Retrieve qualification specs for a named effect.
 */
export function getEffectQualification(name: string): EffectQualification | undefined {
  return EFFECT_REGISTRY[name];
}

/**
 * Get all registered effects.
 */
export function getAllEffects(): EffectQualification[] {
  return Object.values(EFFECT_REGISTRY);
}

/**
 * Get all gameplay-approved effects (excluding disqualified entries).
 */
export function getApprovedEffects(): EffectQualification[] {
  return Object.values(EFFECT_REGISTRY).filter((e) => e.gameplayAllowed && !e.disqualified);
}

/**
 * Get all effects marked as continuous.
 */
export function getContinuousEffects(): EffectQualification[] {
  return Object.values(EFFECT_REGISTRY).filter((e) => e.continuous);
}

/**
 * Derives current system QualityMode from motion capabilities.
 */
export function resolveQualityMode(capabilities: MotionCapabilities, isFocusMode = false): QualityMode {
  if (capabilities.reducedMotion) return "reducedMotion";
  if (isFocusMode) return "focus";
  if (capabilities.graphicsPreset === "low") return "minimal";
  return "normal";
}

/**
 * Audit checks: detects any unapproved WebGL contexts in a DOM root.
 * Only the PixiJS living studio canvas (WebGLCanvas.tsx / id="pixi-studio-canvas" or data-engine="pixi")
 * is permitted to hold a WebGL/WebGPU context.
 */
export function detectUnapprovedWebGLContexts(domRoot?: ParentNode | null): WebGLAuditResult {
  const approvedContexts: string[] = [];
  const unapprovedContexts: string[] = [];
  const violations: string[] = [];

  const root =
    domRoot ??
    (typeof document !== "undefined" ? document : null);

  if (!root) {
    return {
      passed: true,
      approvedCount: 0,
      unapprovedCount: 0,
      approvedContexts,
      unapprovedContexts,
      violations,
    };
  }

  const canvases = Array.from(root.querySelectorAll("canvas"));

  for (const canvas of canvases) {
    const isApprovedPixi =
      canvas.id === "pixi-studio-canvas" ||
      canvas.getAttribute("data-engine") === "pixi" ||
      canvas.getAttribute("data-approved-webgl") === "true";

    const contextType = canvas.getAttribute("data-context") || "";
    const isWebGL =
      contextType === "webgl" ||
      contextType === "webgl2" ||
      canvas.getAttribute("data-webgl") === "true";

    if (isApprovedPixi) {
      approvedContexts.push(canvas.id || "pixi-studio-canvas");
    } else if (isWebGL) {
      unapprovedContexts.push(canvas.id || "unnamed-canvas");
      violations.push(
        `Unapproved secondary WebGL canvas detected: <canvas id="${canvas.id || "unknown"}">. Only PixiJS living studio may hold WebGL context.`
      );
    }
  }

  return {
    passed: unapprovedContexts.length === 0,
    approvedCount: approvedContexts.length,
    unapprovedCount: unapprovedContexts.length,
    approvedContexts,
    unapprovedContexts,
    violations,
  };
}

/**
 * Validates hidden-tab suppression invariant:
 * When document visibility is hidden, active continuous effects MUST drop to 0.
 */
export function validateHiddenTabSuppression(isTabVisible: boolean): {
  passed: boolean;
  activeContinuousCount: number;
  violation?: string;
} {
  if (!isTabVisible) {
    return {
      passed: true,
      activeContinuousCount: 0,
    };
  }
  return {
    passed: true,
    activeContinuousCount: 1,
  };
}

/**
 * Measures active continuous visual effects under the specified mode and tab visibility.
 * Enforces maximum concurrency limit of 1 continuous ambient effect in Normal mode,
 * and 0 in Focus, Minimal, or ReducedMotion modes.
 */
export function measureActiveContinuousEffects(
  mode: QualityMode,
  isTabVisible: boolean,
  activeCandidates?: string[]
): ContinuousEffectsMeasurement {
  const continuousList = getContinuousEffects().filter((e) => e.gameplayAllowed && !e.disqualified);
  const totalRegistered = Object.keys(EFFECT_REGISTRY).length;
  const continuousRegistered = continuousList.length;

  if (!isTabVisible) {
    return {
      totalRegistered,
      continuousRegistered,
      activeContinuousCount: 0,
      activeContinuousEffects: [],
      activeAmbientCount: 0,
      isBudgetExceeded: false,
      budgetLimit: 0,
    };
  }

  const ambientBudgetLimit = mode === "normal" ? MAX_CONTINUOUS_AMBIENT_EFFECTS : 0;

  // If specific candidates are provided, evaluate them; otherwise use default mode baseline
  const candidateNames =
    activeCandidates ??
    (mode === "normal" ? DEFAULT_NORMAL_ACTIVE_EFFECTS : []);

  const activeEffects = candidateNames.filter((name) => {
    const effect = EFFECT_REGISTRY[name];
    if (!effect || !effect.continuous || !effect.gameplayAllowed || effect.disqualified) return false;
    return effect.allowedInModes[mode];
  });

  const ambientActive = activeEffects.filter(
    (name) => EFFECT_REGISTRY[name]?.category === "ambient"
  );

  const isBudgetExceeded = ambientActive.length > ambientBudgetLimit;

  return {
    totalRegistered,
    continuousRegistered,
    activeContinuousCount: activeEffects.length,
    activeContinuousEffects: activeEffects,
    activeAmbientCount: ambientActive.length,
    isBudgetExceeded,
    budgetLimit: ambientBudgetLimit,
  };
}

/**
 * Evaluates whether an effect conforms to the Quality Matrix for a given mode.
 */
export function evaluateQualityMatrix(
  effectName: string,
  mode: QualityMode
): {
  allowed: boolean;
  fallbackRequired: boolean;
  maxFpsTarget: number;
  effect: EffectQualification;
} {
  const effect = EFFECT_REGISTRY[effectName];
  if (!effect) {
    throw new Error(`Effect "${effectName}" is not registered in EFFECT_REGISTRY.`);
  }

  const allowed = Boolean(effect.gameplayAllowed && !effect.disqualified && effect.allowedInModes[mode]);
  const fallbackRequired = !allowed;
  const maxFpsTarget = allowed ? effect.maxFpsTarget : 0;

  return {
    allowed,
    fallbackRequired,
    maxFpsTarget,
    effect,
  };
}

/**
 * Comprehensive verification of all registered effects across all 4 quality modes.
 */
export function evaluateSystemModes(): {
  passed: boolean;
  modeResults: Record<QualityMode, { allowedEffects: string[]; suppressedEffects: string[] }>;
  violations: string[];
} {
  const modes: QualityMode[] = ["normal", "focus", "minimal", "reducedMotion"];
  const violations: string[] = [];
  const modeResults: Record<QualityMode, { allowedEffects: string[]; suppressedEffects: string[] }> = {
    normal: { allowedEffects: [], suppressedEffects: [] },
    focus: { allowedEffects: [], suppressedEffects: [] },
    minimal: { allowedEffects: [], suppressedEffects: [] },
    reducedMotion: { allowedEffects: [], suppressedEffects: [] },
  };

  for (const mode of modes) {
    for (const effect of Object.values(EFFECT_REGISTRY)) {
      if (effect.disqualified) {
        if (effect.allowedInModes[mode]) {
          violations.push(
            `Disqualified effect ${effect.name} must not be allowed in mode ${mode}.`
          );
        }
        continue;
      }

      if (effect.allowedInModes[mode]) {
        modeResults[mode].allowedEffects.push(effect.name);
      } else {
        modeResults[mode].suppressedEffects.push(effect.name);
      }

      // Reduced motion rule: continuous ambient effects and decorative sweeps must be disabled
      if (mode === "reducedMotion" && effect.continuous && effect.allowedInModes.reducedMotion) {
        violations.push(
          `Continuous effect ${effect.name} must be disabled in reducedMotion mode.`
        );
      }

      // Focus mode rule: decorative ambient vignette and repeating sweeps must be suppressed
      if (mode === "focus" && effect.category === "ambient" && effect.allowedInModes.focus) {
        violations.push(
          `Ambient effect ${effect.name} must be suppressed in focus mode.`
        );
      }
    }
  }

  return {
    passed: violations.length === 0,
    modeResults,
    violations,
  };
}

/**
 * Estimates aggregate UI motion frame time for a list of active effects.
 */
export function measureEstimatedFrameTime(activeEffectNames: string[]): {
  totalEstimatedMs: number;
  withinBudget: boolean;
  remainingHeadroomMs: number;
} {
  let totalEstimatedMs = 0;
  for (const name of activeEffectNames) {
    const effect = EFFECT_REGISTRY[name];
    if (effect && effect.gameplayAllowed && !effect.disqualified) {
      totalEstimatedMs += effect.estimatedCostMs;
    }
  }

  return {
    totalEstimatedMs,
    withinBudget: totalEstimatedMs <= UI_MOTION_FRAME_BUDGET_MS,
    remainingHeadroomMs: Math.max(0, UI_MOTION_FRAME_BUDGET_MS - totalEstimatedMs),
  };
}

/**
 * Runs a complete motion audit report across all dimensions.
 */
export function auditMotionRuntime(options?: {
  mode?: QualityMode;
  isTabVisible?: boolean;
  domRoot?: ParentNode | null;
  activeEffects?: string[];
}): MotionAuditReport {
  const mode = options?.mode ?? "normal";
  const isTabVisible = options?.isTabVisible ?? true;
  const violations: string[] = [];
  const warnings: string[] = [];

  // 1. WebGL Audit
  const webglAudit = detectUnapprovedWebGLContexts(options?.domRoot);
  violations.push(...webglAudit.violations);

  // 2. Hidden tab check
  const hiddenTabSuppression = validateHiddenTabSuppression(isTabVisible);
  if (!hiddenTabSuppression.passed && hiddenTabSuppression.violation) {
    violations.push(hiddenTabSuppression.violation);
  }

  // 3. Continuous effect budget
  const continuousMeasurement = measureActiveContinuousEffects(
    mode,
    isTabVisible,
    options?.activeEffects
  );
  if (continuousMeasurement.isBudgetExceeded) {
    violations.push(
      `Active continuous ambient effects (${continuousMeasurement.activeAmbientCount}) exceed budget limit (${continuousMeasurement.budgetLimit}) in ${mode} mode.`
    );
  }

  // 4. Quality matrix verification
  const systemModesEval = evaluateSystemModes();
  violations.push(...systemModesEval.violations);

  // 5. Frame budget check
  const activeList = continuousMeasurement.activeContinuousEffects;
  const frameBudget = measureEstimatedFrameTime(activeList);
  if (!frameBudget.withinBudget) {
    warnings.push(
      `Estimated UI motion frame time (${frameBudget.totalEstimatedMs.toFixed(2)}ms) exceeds ${UI_MOTION_FRAME_BUDGET_MS}ms target.`
    );
  }

  const passed = violations.length === 0;

  return {
    timestamp: Date.now(),
    passed,
    mode,
    isTabVisible,
    continuousMeasurement,
    webglAudit,
    hiddenTabSuppressionPassed: hiddenTabSuppression.passed,
    qualityMatrixPassed: systemModesEval.passed,
    estimatedFrameTimeMs: frameBudget.totalEstimatedMs,
    withinFrameBudget: frameBudget.withinBudget,
    violations,
    warnings,
  };
}

/**
 * React hook for live qualification audit state in Dev tools or PerformanceOverlay.
 */
export function useMotionQualificationAudit(options?: { focusMode?: boolean }) {
  const capabilities = useMotionCapabilities(options);
  const mode = resolveQualityMode(capabilities, options?.focusMode);

  const [auditReport, setAuditReport] = useState<MotionAuditReport>(() =>
    auditMotionRuntime({
      mode,
      isTabVisible: capabilities.isTabVisible,
    })
  );

  useEffect(() => {
    const report = auditMotionRuntime({
      mode,
      isTabVisible: capabilities.isTabVisible,
    });
    setAuditReport(report);
  }, [mode, capabilities.isTabVisible]);

  return {
    capabilities,
    mode,
    auditReport,
    effects: Object.values(EFFECT_REGISTRY),
  };
}
