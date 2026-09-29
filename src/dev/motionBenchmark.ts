/**
 * Motion Platform Qualification & Regression Benchmark Harness (#74).
 *
 * Runs offline or in-engine to audit OriginKit adaptations, WebGL isolation,
 * hidden-tab suspension, and quality mode adherence.
 *
 * Usage:
 *   ./node_modules/.bin/esbuild src/dev/motionBenchmark.ts --bundle --platform=node --format=cjs --outfile=/tmp/rst-motion-bench.cjs --alias:@=./src
 *   node /tmp/rst-motion-bench.cjs
 */

import {
  EFFECT_REGISTRY,
  getAllEffects,
  getContinuousEffects,
  detectUnapprovedWebGLContexts,
  validateHiddenTabSuppression,
  measureActiveContinuousEffects,
  evaluateSystemModes,
  measureEstimatedFrameTime,
  auditMotionRuntime,
  UI_MOTION_FRAME_BUDGET_MS,
  MAX_CONTINUOUS_AMBIENT_EFFECTS,
  type MotionAuditReport,
} from "../lib/motion/qualification";

export interface BenchmarkMetrics {
  totalRegisteredEffects: number;
  continuousEffectsCount: number;
  disqualifiedEffectsCount: number;
  approvedGameplayEffectsCount: number;
  estimatedNormalFrameTimeMs: number;
  withinUiBudget: boolean;
  webglIsolationPassed: boolean;
  hiddenTabSuppressionPassed: boolean;
  systemModesPassed: boolean;
}

/**
 * Executes the complete motion qualification benchmark and returns structured metrics.
 */
export function runMotionBenchmark(): {
  metrics: BenchmarkMetrics;
  report: MotionAuditReport;
  summary: string;
} {
  const allEffects = getAllEffects();
  const continuousEffects = getContinuousEffects();
  const disqualified = allEffects.filter((e) => e.disqualified);
  const approved = allEffects.filter((e) => e.gameplayAllowed && !e.disqualified);

  // Audit normal mode
  const normalReport = auditMotionRuntime({ mode: "normal", isTabVisible: true });
  const hiddenReport = auditMotionRuntime({ mode: "normal", isTabVisible: false });

  const activeContinuousNames = normalReport.continuousMeasurement.activeContinuousEffects;
  const frameBudget = measureEstimatedFrameTime(activeContinuousNames);

  const metrics: BenchmarkMetrics = {
    totalRegisteredEffects: allEffects.length,
    continuousEffectsCount: continuousEffects.length,
    disqualifiedEffectsCount: disqualified.length,
    approvedGameplayEffectsCount: approved.length,
    estimatedNormalFrameTimeMs: frameBudget.totalEstimatedMs,
    withinUiBudget: frameBudget.withinBudget,
    webglIsolationPassed: normalReport.webglAudit.passed,
    hiddenTabSuppressionPassed: hiddenReport.continuousMeasurement.activeContinuousCount === 0,
    systemModesPassed: normalReport.qualityMatrixPassed,
  };

  const lines = [
    "======================================================",
    "OriginKit Motion Qualification & Regression Benchmark",
    "======================================================",
    `Total Registered Effects: ${metrics.totalRegisteredEffects}`,
    `Approved Gameplay Effects: ${metrics.approvedGameplayEffectsCount}`,
    `Disqualified Candidates:  ${metrics.disqualifiedEffectsCount}`,
    `Continuous Effects:        ${metrics.continuousEffectsCount} registered, max ${MAX_CONTINUOUS_AMBIENT_EFFECTS} concurrent in Normal`,
    `Estimated Normal UI Cost:  ${metrics.estimatedNormalFrameTimeMs.toFixed(2)}ms (Budget: ${UI_MOTION_FRAME_BUDGET_MS}ms)`,
    `WebGL GPU Isolation:       ${metrics.webglIsolationPassed ? "PASS (Exclusive PixiJS)" : "FAIL"}`,
    `Hidden-Tab Suppression:    ${metrics.hiddenTabSuppressionPassed ? "PASS (0 active on hidden)" : "FAIL"}`,
    `Quality Modes Conformance: ${metrics.systemModesPassed ? "PASS (Normal/Focus/Minimal/Reduced)" : "FAIL"}`,
    "======================================================",
  ];

  return {
    metrics,
    report: normalReport,
    summary: lines.join("\n"),
  };
}

// Standalone execution entrypoint
if (typeof require !== "undefined" && require.main === module) {
  const result = runMotionBenchmark();
  console.log(result.summary);
  if (!result.report.passed || !result.metrics.withinUiBudget) {
    console.error("Motion benchmark qualification FAILED violations:", result.report.violations);
    process.exit(1);
  }
}
