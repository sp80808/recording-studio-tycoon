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

// tests/first-session-guide.check.ts
var import_strict = __toESM(require("node:assert/strict"), 1);

// src/utils/firstSessionGuide.ts
var hasSessionProgress = (state2) => !!state2.activeProject?.stages.some((stage) => stage.workUnitsCompleted > 0 || stage.completed);
var hasFirstUpgrade = (state2) => state2.ownedEquipment.some((item) => !["basic_mic", "basic_monitors"].includes(item.id)) || state2.hiredStaff.length > 0 || state2.ownedUpgrades.length > 0;
var getFirstSessionGuideStep = (state2) => {
  const hasPayout = state2.financials.reports.length > 0;
  if (hasPayout && hasFirstUpgrade(state2)) return "complete";
  if (hasPayout) return "reinvest";
  if (state2.activeProject?.awaitingReview) return "deliver";
  if (state2.activeProject && hasSessionProgress(state2)) return "deliver";
  if (state2.activeProject) return "work";
  return "book";
};

// tests/first-session-guide.check.ts
var state = {
  activeProject: null,
  ownedEquipment: [{ id: "basic_mic" }, { id: "basic_monitors" }],
  hiredStaff: [],
  ownedUpgrades: [],
  financials: { reports: [], income: 0 }
};
import_strict.default.equal(getFirstSessionGuideStep(state), "book");
var booked = { ...state, activeProject: { stages: [{ workUnitsCompleted: 0, completed: false }] } };
import_strict.default.equal(getFirstSessionGuideStep(booked), "work");
var working = { ...booked, activeProject: { ...booked.activeProject, stages: [{ workUnitsCompleted: 1, completed: false }] } };
import_strict.default.equal(getFirstSessionGuideStep(working), "deliver");
import_strict.default.equal(getFirstSessionGuideStep({ ...booked, activeProject: { ...booked.activeProject, awaitingReview: true } }), "deliver");
import_strict.default.equal(getFirstSessionGuideStep({ ...state, financials: { ...state.financials, income: 100 } }), "book", "non-session income must not skip onboarding");
var paid = { ...state, financials: { ...state.financials, reports: [{}] } };
import_strict.default.equal(getFirstSessionGuideStep(paid), "reinvest");
import_strict.default.equal(getFirstSessionGuideStep({ ...paid, ownedEquipment: [{ id: "upgrade" }] }), "complete");
import_strict.default.equal(getFirstSessionGuideStep({ ...paid, hiredStaff: [{}] }), "complete");
import_strict.default.equal(getFirstSessionGuideStep({ ...state, hiredStaff: [{}] }), "book", "upgrade alone is not a paid session");
console.log("PASS first-session guide: booking, work, review, payout, reinvestment and loaded state");
