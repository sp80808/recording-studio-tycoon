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

// tests/minigames-audio.check.ts
var import_node_assert = __toESM(require("node:assert"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var baseDir = process.cwd();
var beatMakingPath = import_node_path.default.join(baseDir, "src/components/minigames/BeatMakingGame.tsx");
var mixingBoardPath = import_node_path.default.join(baseDir, "src/components/minigames/MixingBoardGame.tsx");
var tapeSplicingPath = import_node_path.default.join(baseDir, "src/components/minigames/TapeSplicingGame.tsx");
var beatContent = import_node_fs.default.readFileSync(beatMakingPath, "utf8");
(0, import_node_assert.default)(beatContent.includes("Tone") || beatContent.includes("getTransport"), "BeatMakingGame must integrate Tone.js timing");
(0, import_node_assert.default)(beatContent.includes("playTactileClick"), "BeatMakingGame must use tactile click feedback");
var mixContent = import_node_fs.default.readFileSync(mixingBoardPath, "utf8");
(0, import_node_assert.default)(mixContent.includes("triggerMilestoneCelebration") || mixContent.includes("triggerProjectCompleteJuice"), "MixingBoardGame must integrate celebration juice");
var tapeContent = import_node_fs.default.readFileSync(tapeSplicingPath, "utf8");
(0, import_node_assert.default)(tapeContent.includes("gameAudio"), "TapeSplicingGame must use gameAudio");
(0, import_node_assert.default)(tapeContent.includes("playTactileClick") || tapeContent.includes("playGearSwitch"), "TapeSplicingGame must use tactile audio feedback");
console.log("PASS: minigames audio and juice enhancements verified");
