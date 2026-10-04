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

// tests/audio-system.check.ts
var import_node_assert = __toESM(require("node:assert"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var baseDir = process.cwd();
var audioSystemPath = import_node_path.default.join(baseDir, "src/utils/audioSystem.ts");
var content = import_node_fs.default.readFileSync(audioSystemPath, "utf8");
(0, import_node_assert.default)(content.includes("playTactileClick"), "audioSystem must export playTactileClick");
(0, import_node_assert.default)(content.includes("playGearSwitch"), "audioSystem must export playGearSwitch");
(0, import_node_assert.default)(content.includes("from 'tone'") || content.includes("Tone."), "audioSystem must integrate Tone.js");
(0, import_node_assert.default)(content.includes("ui-tactile-click") || content.includes("kenney/click"), "audioSystem must preload tactile click");
(0, import_node_assert.default)(content.includes("ui-gear-switch") || content.includes("kenney/switch"), "audioSystem must preload gear switch");
console.log("PASS: audioSystem interfaces verified");
