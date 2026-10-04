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

// tests/pocket-meter-pacing.check.ts
var import_strict = __toESM(require("node:assert/strict"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var meter = import_node_fs.default.readFileSync("src/components/console/PocketMeter.tsx", "utf8");
var active = import_node_fs.default.readFileSync("src/components/ActiveProject.tsx", "utf8");
var takeEval = import_node_fs.default.readFileSync("src/rpg/takeEvaluation.ts", "utf8");
var stageWork = import_node_fs.default.readFileSync("src/hooks/useStageWork.tsx", "utf8");
var timingValue = (name) => {
  const match = meter.match(new RegExp(`${name}:\\s*([0-9.]+)`));
  import_strict.default.ok(match, `PocketMeter must declare ${name}`);
  const value = Number(match[1]);
  import_strict.default.ok(Number.isFinite(value) && value > 0, `${name} must be a positive duration`);
  return value;
};
var cycleSeconds = timingValue("cycleSeconds");
var autoLockSeconds = timingValue("autoLockSeconds");
var crossingSeconds = (Math.asin((0.85 - 0.53) / 0.41) - Math.asin((0.7 - 0.53) / 0.41)) / (Math.PI * 2) * cycleSeconds;
import_strict.default.ok(
  crossingSeconds >= 0.09 && crossingSeconds <= 0.16,
  `Gold crossing must remain readable without dragging (${Math.round(crossingSeconds * 1e3)}ms)`
);
var cyclesBeforeFallback = autoLockSeconds / cycleSeconds;
import_strict.default.ok(
  cyclesBeforeFallback >= 1.5 && cyclesBeforeFallback <= 2,
  `auto-lock must allow more than one pass without becoming a wait (${cyclesBeforeFallback.toFixed(2)} cycles)`
);
import_strict.default.ok(autoLockSeconds <= 3.5, "safe fallback must resolve the console check promptly");
import_strict.default.match(meter, /prefers-reduced-motion: reduce/, "reduced motion must use the static accessible path");
import_strict.default.match(meter, /role="meter"/, "meter must expose its live value to assistive technology");
import_strict.default.match(active, /postTakeRearmMs:\s*320/, "post-take rearm should be a short beat, not a pause");
import_strict.default.match(active, /takeToastMs:\s*1400/, "take toast should clear before the next arm feels blocked");
import_strict.default.match(active, /setTakeState\('tracking'\)/, "energy burst should auto-rearm the next take");
import_strict.default.match(active, /Stand down/, "players need an explicit way to stop the take burst");
import_strict.default.match(takeEval, /return energyCost \* 3/, "base units should clear early stages in ~2 takes");
import_strict.default.match(stageWork, /calculateTakeBaseUnits\(energyCost\)/, "session work must use shared take base units");
console.log("PASS: PocketMeter pacing, burst rearm, throughput and meter semantics");
