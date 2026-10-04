var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/toast-spam.check.ts
var import_strict = __toESM(require("node:assert/strict"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);

// src/lib/toastGate.ts
var DEFAULT_TOAST_GATE_CONFIG = {
  dedupeWindowMs: 2800,
  rateLimitCount: 3,
  rateLimitWindowMs: 4e3,
  defaultDurationMs: 3200,
  criticalDurationMs: 5200,
  routineDurationMs: 2200,
  reducedMotionDurationMs: 1800
};
function fingerprintToast(title, description) {
  return `${String(title ?? "").trim()}::${String(description ?? "").trim()}`.toLowerCase();
}
function resolveToastPriority(variant, explicit) {
  if (explicit) return explicit;
  if (variant === "destructive") return "critical";
  return "important";
}
function prefersReducedMotion(matchMedia = typeof window !== "undefined" ? window.matchMedia.bind(window) : void 0) {
  try {
    return Boolean(matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  } catch {
    return false;
  }
}
var ToastGate = class {
  constructor(config = DEFAULT_TOAST_GATE_CONFIG) {
    this.config = config;
  }
  recent = [];
  admittedAt = [];
  seq = 0;
  level = "all";
  reset() {
    this.recent = [];
    this.admittedAt = [];
    this.seq = 0;
  }
  /** Quiet priority never surfaces as a toast — callers may log instead. */
  admit(input) {
    const now = input.now ?? Date.now();
    const priority = resolveToastPriority(input.variant, input.priority);
    if (priority === "quiet") {
      return { allow: false };
    }
    if (priority !== "critical" && (this.level === "off" || this.level === "important" && priority === "routine")) {
      return { allow: false };
    }
    this.prune(now);
    const key = fingerprintToast(String(input.title ?? ""), input.description ? String(input.description) : void 0);
    const duplicate = this.recent.find((entry) => entry.key === key);
    if (duplicate) {
      if (priority === "critical") {
        return {
          allow: true,
          coalesceId: duplicate.id,
          durationMs: this.durationFor(priority, input.duration)
        };
      }
      return { allow: false, coalesceId: duplicate.id };
    }
    if (priority !== "critical") {
      const inWindow = this.admittedAt.filter((at) => now - at < this.config.rateLimitWindowMs);
      if (inWindow.length >= this.config.rateLimitCount) {
        return { allow: false };
      }
    }
    this.seq += 1;
    const id = `rst-toast-${this.seq}`;
    this.recent.push({ key, at: now, id });
    this.admittedAt.push(now);
    return {
      allow: true,
      coalesceId: id,
      durationMs: this.durationFor(priority, input.duration)
    };
  }
  durationFor(priority, explicit) {
    if (typeof explicit === "number" && Number.isFinite(explicit)) {
      return prefersReducedMotion() ? Math.min(explicit, this.config.reducedMotionDurationMs) : explicit;
    }
    if (prefersReducedMotion()) return this.config.reducedMotionDurationMs;
    if (priority === "critical") return this.config.criticalDurationMs;
    if (priority === "routine") return this.config.routineDurationMs;
    return this.config.defaultDurationMs;
  }
  prune(now) {
    const keepMs = Math.max(this.config.dedupeWindowMs, this.config.rateLimitWindowMs);
    this.recent = this.recent.filter((entry) => now - entry.at < this.config.dedupeWindowMs);
    this.admittedAt = this.admittedAt.filter((at) => now - at < keepMs);
  }
};
var toastGate = new ToastGate();

// tests/toast-spam.check.ts
var baseDir = process.cwd();
var read = (p) => import_node_fs.default.readFileSync(import_node_path.default.join(baseDir, p), "utf8");
var passed = 0;
var ok = (cond, msg) => {
  import_strict.default.ok(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};
var gate = new ToastGate();
gate.reset();
var first = gate.admit({ title: "Work Progress", description: "+2 units", now: 1e3 });
ok(first.allow, "first toast admitted");
var dup = gate.admit({ title: "Work Progress", description: "+2 units", now: 1200 });
ok(!dup.allow, "identical toast within window is deduped");
ok(fingerprintToast("A", "B") === "a::b", "fingerprint normalizes case");
gate.reset();
for (let i = 0; i < 3; i += 1) {
  ok(gate.admit({ title: `n${i}`, now: 2e3 + i }).allow, `rate slot ${i} admitted`);
}
ok(!gate.admit({ title: "n3", now: 2500 }).allow, "4th non-critical toast rate-limited");
ok(
  gate.admit({ title: "Boom", variant: "destructive", now: 2501 }).allow,
  "critical/destructive bypasses rate limit"
);
var quiet = gate.admit({ title: "log only", priority: "quiet", now: 3e3 });
ok(!quiet.allow, "quiet priority never surfaces");
var app = read("src/App.tsx");
ok(app.includes("<Toaster />"), "App mounts Toaster");
ok(!/import\s+\{\s*Toaster as Sonner\s*\}/.test(app) && !app.includes("<Sonner />"), "App does not mount a second Sonner toaster");
var toaster = read("src/components/ui/toaster.tsx");
ok(toaster.includes("visibleToasts={2}"), "Sonner host caps visible toasts at 2");
var guideCss = read("src/components/first-session-guide.css");
ok(guideCss.includes("data-chrome-busy='take-calibration'"), "coach CSS hides during take-calibration");
ok(guideCss.includes("max-width: 1100px"), "coach parks for mid viewports");
var tutorial = read("src/components/TutorialModal.tsx");
ok(tutorial.includes("takeCalibrationFocused"), "TutorialModal reads chrome take-calibration signal");
ok(/if\s*\([^\n]*\|\|\s*takeCalibrationFocused\s*\|\|\s*consoleFocused\s*\)\s*return null/.test(tutorial), "coach unmounts while calibration or console owns input");
var active = read("src/components/ActiveProject.tsx");
ok(active.includes("setTakeCalibrationFocused"), "ActiveProject publishes take-calibration focus");
ok(!active.includes("Studio kept moving"), "skip-intervention confirm toast removed");
ok(!active.includes("Focus Aligned"), "focus-align confirm toast removed");
var actions = read("src/hooks/useGameActions.tsx");
ok(!actions.includes("Daily Expenses Paid"), "routine payroll toast removed");
var stage = read("src/hooks/useStageWork.tsx");
ok(!stage.includes("Work Progress"), "routine work-progress toast removed");
ok(!stage.includes("Stage Already Complete"), "redundant stage-complete toast removed");
ok(!stage.includes("title: '\u{1F525} OVERDRIVE!'"), "routine overdrive success toast removed");
var playCss = read("src/components/studio-play.css");
ok(!playCss.includes(".first-session-guide { position:absolute"), "studio-play no longer owns coach absolute position");
console.log(`toast-spam: all ${passed} checks passed`);
