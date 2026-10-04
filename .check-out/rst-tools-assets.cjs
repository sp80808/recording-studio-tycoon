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

// tests/tools-assets.check.ts
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_assert = __toESM(require("node:assert"), 1);
var baseDir = process.cwd();
var pkgPath = import_node_path.default.join(baseDir, "package.json");
var pkg = JSON.parse(import_node_fs.default.readFileSync(pkgPath, "utf8"));
(0, import_node_assert.default)(pkg.dependencies && pkg.dependencies["tone"], "Expected tone to be in dependencies");
(0, import_node_assert.default)(pkg.dependencies && pkg.dependencies["canvas-confetti"], "Expected canvas-confetti to be in dependencies");
var kenneyDir = import_node_path.default.join(baseDir, "public/audio/ui-sfx/kenney");
(0, import_node_assert.default)(import_node_fs.default.existsSync(kenneyDir), "Expected public/audio/ui-sfx/kenney directory to exist");
var requiredFiles = ["click1.wav", "click2.wav", "switch1.wav", "switch2.wav"];
for (const f of requiredFiles) {
  (0, import_node_assert.default)(import_node_fs.default.existsSync(import_node_path.default.join(kenneyDir, f)), `Missing expected Kenney asset: ${f}`);
}
console.log("PASS: tools and assets verified");
