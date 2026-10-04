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

// tests/staff-staging.check.ts
var import_strict = __toESM(require("node:assert/strict"), 1);

// src/components/studio/staffStaging.ts
function staffDestination(state, stations2) {
  if (state === "working" || state === "mixing" || state === "recording" || state === "headbob") return stations2.work;
  if (state === "break") return stations2.rest;
  return stations2.home;
}
function stepStaffPosition(current, target, dtMs, reducedMotion) {
  if (reducedMotion) return { ...target };
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const distance = Math.hypot(dx, dy);
  const step = 42 * Math.max(0, Math.min(dtMs, 100)) / 1e3;
  if (distance <= step || distance === 0) return { ...target };
  return { x: current.x + dx / distance * step, y: current.y + dy / distance * step };
}
function staffActivityCue(state) {
  switch (state) {
    case "mixing":
      return { text: "\u266A", color: 8115081 };
    case "recording":
      return { text: "\u25CF", color: 16747382 };
    case "working":
    case "headbob":
      return { text: "\u266A", color: 8115081 };
    case "waiting":
      return { text: "\u2026", color: 15255672 };
    case "break":
      return { text: "z", color: 9551336 };
    case "celebrate":
      return { text: "\u2713", color: 8115081 };
    default:
      return { text: "", color: 16777215 };
  }
}
function pickFloorStaff(staff, capacity = 4) {
  const priority = (status) => status === "Working" ? 0 : status === "Training" || status === "Researching" ? 1 : status === "Idle" ? 2 : 3;
  const present = staff.filter((member) => member.status !== "On Tour");
  if (present.length <= capacity) return present;
  return present.sort((a, b) => priority(a.status) - priority(b.status)).slice(0, capacity);
}

// tests/staff-staging.check.ts
var stations = { home: { x: 0, y: 0 }, work: { x: 100, y: 50 }, rest: { x: -20, y: 10 } };
import_strict.default.equal(staffDestination("mixing", stations), stations.work);
import_strict.default.equal(staffDestination("break", stations), stations.rest);
import_strict.default.equal(staffDestination("waiting", stations), stations.home);
var position = stations.home;
for (let i = 0; i < 300; i++) position = stepStaffPosition(position, stations.work, 16, false);
import_strict.default.deepEqual(position, stations.work, "arrives without overshoot");
import_strict.default.deepEqual(stepStaffPosition(stations.home, stations.work, 16, true), stations.work);
import_strict.default.deepEqual(stepStaffPosition(stations.home, stations.work, -16, false), stations.home);
import_strict.default.ok(Math.hypot(...Object.values(stepStaffPosition(stations.home, stations.work, 1e4, false))) <= 4.21, "hidden-tab delta bounded");
import_strict.default.equal(staffActivityCue("idle").text, "");
import_strict.default.equal(staffActivityCue("break").text, "z");
console.log("staff staging destinations and motion passed");
var crew = [
  { id: "rest-a", status: "Resting" },
  { id: "idle-a", status: "Idle" },
  { id: "rest-b", status: "Resting" },
  { id: "idle-b", status: "Idle" },
  { id: "worker", status: "Working" },
  { id: "tour", status: "On Tour" }
];
import_strict.default.equal(pickFloorStaff(crew)[0].id, "worker", "active worker survives four-person floor cap");
import_strict.default.ok(!pickFloorStaff(crew).some((member) => member.id === "tour"));
import_strict.default.equal(crew[0].id, "rest-a", "presentation ranking never mutates saved hire order");
