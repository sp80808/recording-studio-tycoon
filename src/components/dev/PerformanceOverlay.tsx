import React, { useState } from "react";
import {
  useMotionQualificationAudit,
  UI_MOTION_FRAME_BUDGET_MS,
  type EffectQualification,
} from "@/lib/motion/qualification";

export interface PerformanceOverlayProps {
  /** Initial collapsed state */
  defaultExpanded?: boolean;
  /** Optional callback on dismiss */
  onClose?: () => void;
  className?: string;
}

/**
 * In-Game Developer Motion & Performance Qualification Overlay (#74).
 * Monitors active OriginKit visual effects, WebGL isolation, frame budget,
 * and tab visibility compliance in real time.
 */
export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  defaultExpanded = false,
  onClose,
  className = "",
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { mode, auditReport, effects } = useMotionQualificationAudit();

  const isCompliant = auditReport.passed && auditReport.withinFrameBudget;

  return (
    <div
      data-testid="motion-performance-overlay"
      className={`fixed bottom-3 left-3 z-50 font-mono text-xs shadow-2xl rounded-lg border ${
        isCompliant
          ? "bg-stone-950/95 border-emerald-500/40 text-stone-200"
          : "bg-rose-950/95 border-rose-500 text-rose-100"
      } backdrop-blur-md transition-all duration-200 ${className}`}
    >
      {/* Status Bar Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer select-none hover:bg-white/5 rounded-t-lg"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isCompliant ? "bg-emerald-400 animate-pulse" : "bg-rose-500 animate-ping"
          }`}
        />
        <span className="font-bold text-amber-400">OriginKit Perf HUD</span>
        <span className="text-stone-400">|</span>
        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-sky-300 font-semibold">
          {mode}
        </span>
        <span className="text-stone-400">|</span>
        <span className="text-[11px]">
          UI: <span className="text-emerald-300">{auditReport.estimatedFrameTimeMs.toFixed(2)}ms</span> /
          {UI_MOTION_FRAME_BUDGET_MS}ms
        </span>
        <span className="text-stone-400">|</span>
        <span className="text-[11px]">
          Cont: <span className="text-cyan-300">{auditReport.continuousMeasurement.activeContinuousCount}</span>/
          {auditReport.continuousMeasurement.budgetLimit}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="ml-auto text-stone-400 hover:text-white px-1.5 py-0.5 rounded text-[10px] bg-stone-800/80"
        >
          {expanded ? "▲ Hide Details" : "▼ Inspect Matrix"}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-stone-400 hover:text-rose-400 font-bold px-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Expanded Inspection Matrix */}
      {expanded && (
        <div className="p-3 border-t border-stone-800/80 max-h-96 overflow-y-auto space-y-3">
          {/* System Audit Invariants */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded bg-stone-900/80 border border-stone-800">
              <span className="text-stone-400 block">WebGL GPU Exclusivity:</span>
              <span
                className={`font-semibold ${
                  auditReport.webglAudit.passed ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {auditReport.webglAudit.passed ? "✓ Exclusive PixiJS" : "✗ Secondary Canvas Detected"}
              </span>
            </div>
            <div className="p-2 rounded bg-stone-900/80 border border-stone-800">
              <span className="text-stone-400 block">Tab Visibility Suspension:</span>
              <span
                className={`font-semibold ${
                  auditReport.hiddenTabSuppressionPassed ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {auditReport.isTabVisible ? "Active Tab (Running)" : "Hidden Tab (100% Suspended)"}
              </span>
            </div>
          </div>

          {/* Candidate Effects Table */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1.5">
              OriginKit Qualification Matrix
            </div>
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 text-[10px]">
                  <th className="pb-1">Effect</th>
                  <th className="pb-1">Renderer</th>
                  <th className="pb-1">Continuous</th>
                  <th className="pb-1">Target FPS</th>
                  <th className="pb-1">Status in {mode}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/50">
                {effects.map((effect: EffectQualification) => {
                  const isAllowed = Boolean(
                    effect.gameplayAllowed && !effect.disqualified && effect.allowedInModes[mode]
                  );
                  return (
                    <tr key={effect.name} className="hover:bg-stone-800/30">
                      <td className="py-1 font-semibold text-stone-200">
                        {effect.name}
                        {effect.disqualified && (
                          <span className="ml-1 text-[9px] text-rose-400 uppercase">[Banned]</span>
                        )}
                      </td>
                      <td className="py-1 text-stone-400">{effect.renderer}</td>
                      <td className="py-1 text-stone-300">{effect.continuous ? "Yes" : "No"}</td>
                      <td className="py-1 text-stone-300">{effect.maxFpsTarget} fps</td>
                      <td className="py-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            effect.disqualified
                              ? "bg-rose-950 text-rose-300"
                              : isAllowed
                              ? "bg-emerald-950 text-emerald-300"
                              : "bg-stone-800 text-stone-400"
                          }`}
                        >
                          {effect.disqualified ? "DISQUALIFIED" : isAllowed ? "ACTIVE" : "FALLBACK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Violations notice if any */}
          {auditReport.violations.length > 0 && (
            <div className="p-2 rounded bg-rose-950/80 border border-rose-600/60 text-rose-200 text-[10px]">
              <div className="font-bold mb-1">Violations Detected:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {auditReport.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceOverlay;
