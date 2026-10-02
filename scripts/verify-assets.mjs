#!/usr/bin/env node
/**
 * pnpm assets:verify — GitHub issue #58 first slice.
 *
 * Verifies assets/provenance.json against the actual repo tree. This is a
 * mechanical integrity check, NOT a legal opinion: it confirms every manifest
 * entry has a non-empty, recognised license value and a local file that
 * actually exists, and it flags any file inside a "tracked" third-party asset
 * directory that has no manifest entry at all. It does not — and cannot —
 * verify that a license claim is actually correct.
 *
 * Scope: only directories listed in TRACKED_DIRS are audited for "committed
 * but unprovenanced" files. That is deliberately narrow (this pass's own
 * additions) rather than the whole public/ tree, which carries a lot of
 * pre-existing audio/art this pass did not touch or attempt to re-license.
 * Widening TRACKED_DIRS is the natural next step for a future slice of #58.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const MANIFEST_PATH = join(ROOT, 'assets', 'provenance.json');
const ALLOWED_LICENSES = new Set(['CC0-1.0', 'CC0', 'MIT', 'Apache-2.0', 'original']);

// Directories this manifest is the source of truth for. A file living here
// without a manifest entry fails the check; files elsewhere are out of scope
// for this slice (see module docblock).
const TRACKED_DIRS = ['public/assets/kenney-ui/PNG', 'public/audio/ui-sfx/kenney'];

// In-house work is declared per directory in manifest.originalTrees; every file under one is covered.
// A top-level file under public/assets that is in neither list is also a failure (see below).

// Files loose in public/assets that are not in a tree need an assets[] entry. Nothing is allowlisted.
const UNREVIEWED_ALLOWLIST = [];

let failed = false;
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};

if (!existsSync(MANIFEST_PATH)) {
  console.error(`FAIL: manifest not found at ${relative(ROOT, MANIFEST_PATH)}`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`FAIL: manifest is not valid JSON: ${err.message}`);
  process.exit(1);
}

const assets = Array.isArray(manifest.assets) ? manifest.assets : [];
if (assets.length === 0) {
  fail('manifest has no asset entries');
}

const seenLocalPaths = new Set();
const seenIds = new Set();

for (const entry of assets) {
  const label = entry.id ?? entry.localPath ?? '<unnamed entry>';

  if (!entry.id) fail(`${label}: missing "id"`);
  if (entry.id && seenIds.has(entry.id)) fail(`${label}: duplicate id "${entry.id}"`);
  if (entry.id) seenIds.add(entry.id);

  if (!entry.localPath) {
    fail(`${label}: missing "localPath"`);
  } else {
    seenLocalPaths.add(entry.localPath.replace(/\\/g, '/'));
    const abs = join(ROOT, entry.localPath);
    if (!existsSync(abs)) {
      fail(`${label}: localPath "${entry.localPath}" does not exist on disk`);
    }
  }

  const license = (entry.license ?? '').trim();
  if (!license) {
    fail(`${label}: license is empty/unknown`);
  } else if (!ALLOWED_LICENSES.has(license)) {
    fail(`${label}: license "${license}" is not a recognised value (${[...ALLOWED_LICENSES].join(', ')})`);
  }

  if (!entry.sourcePack && !entry.sourceName) fail(`${label}: missing source pack/name`);
  if (!entry.author) fail(`${label}: missing author/provider`);
  if (entry.modifications === undefined || entry.modifications === null) {
    fail(`${label}: missing "modifications" (use "none" if unmodified)`);
  }
  if (!entry.intendedUse && !entry.purpose) fail(`${label}: missing intended use / purpose`);
}

// Flag committed files in tracked directories that have no manifest entry.
const walk = (dir) => {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (st.isFile() && name !== 'License.txt') out.push(full);
  }
  return out;
};

const originalTrees = Array.isArray(manifest.originalTrees) ? manifest.originalTrees : [];
const treeRoots = [];
for (const tree of originalTrees) {
  const label = tree.id ?? tree.path ?? '<unnamed tree>';
  if (!tree.id) fail(`${label}: originalTrees entry missing "id"`);
  if (!tree.path) { fail(`${label}: originalTrees entry missing "path"`); continue; }
  if (tree.license !== 'original') fail(`${label}: originalTrees entries must have license "original"`);
  if (!tree.author) fail(`${label}: missing author`);
  if (!tree.sourceLog) fail(`${label}: missing "sourceLog" (where this work is documented)`);
  if (!existsSync(join(ROOT, tree.path)) || walk(join(ROOT, tree.path)).length === 0) fail(`${label}: path "${tree.path}" is missing or empty`);
  treeRoots.push(tree.path.replace(/\\/g, '/').replace(/\/$/, ''));
}
const inOriginalTree = (rel) => treeRoots.some((root) => rel === root || rel.startsWith(`${root}/`));

// Anything else sitting loose in public/assets (or in a new subdirectory) must be declared one way or the other.
const assetsRoot = join(ROOT, 'public', 'assets');
for (const absFile of walk(assetsRoot)) {
  const rel = relative(ROOT, absFile).replace(/\\/g, '/');
  if (seenLocalPaths.has(rel) || inOriginalTree(rel)) continue;
  if (TRACKED_DIRS.some((d) => rel.startsWith(`${d}/`))) continue; // reported below with a clearer message
  if (UNREVIEWED_ALLOWLIST.includes(rel)) continue;
  fail(`${rel}: under public/assets but not in assets[] or an originalTrees directory. Add a manifest entry (and a line in docs/ART_SOURCING_LOG.md).`);
}

for (const trackedDir of TRACKED_DIRS) {
  const absDir = join(ROOT, trackedDir);
  for (const absFile of walk(absDir)) {
    const rel = relative(ROOT, absFile).replace(/\\/g, '/');
    if (!seenLocalPaths.has(rel)) {
      fail(`${rel}: committed under a tracked third-party asset directory but has no provenance manifest entry`);
    }
  }
}

if (failed) {
  console.error(`\nassets:verify failed (${assets.length} manifest entries checked).`);
  process.exit(1);
}

console.log(`PASS: assets:verify — ${assets.length} third-party entries and ${originalTrees.length} in-house trees; public/assets fully accounted for.`);
