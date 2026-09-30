/**
 * Asset factory CLI (issue #79): pnpm assets:build | assets:validate | assets:inspect
 *
 * Source layout (committed):  assets-src/<kind>/<id>/asset.json
 *   + sheet.json + sheet.png     an Aseprite/Pixelorama spritesheet export (hash or array JSON), OR
 *   + frames/<tag>_<nnn>.png     loose frames (Blender renders, PNG sequences)
 * Output (committed, deterministic):  public/assets/atlases/<kind>/<id>.{json,png,provenance.json}
 *
 * No proprietary tool is required: Aseprite/Blender are only needed to AUTHOR the sources.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng, blit, type Rgba } from './png';
import { normalizeAsepriteExport } from '../../src/features/sprites/pipeline/asepriteImport';
import { atlasOutputPaths, ASSET_KINDS, type AssetKind } from '../../src/features/sprites/pipeline/assetConventions';
import { packFrames, parseFrameFilename, type LooseFrame } from '../../src/features/sprites/pipeline/framePacker';
import { createProvenanceManifest, validateAtlasReport, validateProvenance } from '../../src/features/sprites/pipeline/exportPipelineUtils';
import type { AssetProvenanceManifest, PixiTextureAtlasSchema } from '../../src/features/sprites/pipeline/assetAtlasTypes';

const root = process.cwd(); // scripts are bundled to a temp dir, so __dirname is not the repo
const srcRoot = path.join(root, 'assets-src');
const outRoot = path.join(root, 'public');

interface AssetSource {
  id: string;
  kind: AssetKind;
  sourceType: AssetProvenanceManifest['sourceType'];
  author: string;
  license: string;
  toolVersion: string;
  paletteId: string;
  palette: string[];
  createdAt: string;
  pipelineSteps: string[];
  sourceUrl?: string;
  generationSteps?: string[];
  pivot?: { x: number; y: number };
}

const sha256 = (...parts: (string | Uint8Array)[]) => {
  const h = crypto.createHash('sha256');
  parts.forEach((p) => h.update(p));
  return h.digest('hex');
};
const stable = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
const rel = (p: string) => path.relative(root, p);

const discover = (only?: string): Array<{ dir: string; meta: AssetSource }> => {
  const found: Array<{ dir: string; meta: AssetSource }> = [];
  for (const kind of ASSET_KINDS) {
    const kdir = path.join(srcRoot, kind);
    if (!fs.existsSync(kdir)) continue;
    for (const id of fs.readdirSync(kdir).sort()) {
      const dir = path.join(kdir, id);
      const file = path.join(dir, 'asset.json');
      if (!fs.existsSync(file)) continue;
      const meta = JSON.parse(fs.readFileSync(file, 'utf8')) as AssetSource;
      if (meta.id !== id || meta.kind !== kind) throw new Error(`${rel(file)}: id/kind must match the folder (${kind}/${id}).`);
      if (!only || `${kind}/${id}` === only || id === only) found.push({ dir, meta });
    }
  }
  return found;
};

const buildOne = (dir: string, meta: AssetSource) => {
  const paths = atlasOutputPaths(meta.kind, meta.id);
  const imageName = path.basename(paths.image);
  let atlas: PixiTextureAtlasSchema;
  let image: Buffer;
  let sourceDims: { width: number; height: number };
  const steps = [...meta.pipelineSteps];

  if (fs.existsSync(path.join(dir, 'sheet.json'))) {
    const aseJson = JSON.parse(fs.readFileSync(path.join(dir, 'sheet.json'), 'utf8'));
    const { atlas: a, warnings } = normalizeAsepriteExport(aseJson, { kind: meta.kind, id: meta.id, pivot: meta.pivot, image: imageName });
    warnings.forEach((w) => console.warn(`  warn ${meta.kind}/${meta.id}: ${w}`));
    atlas = a;
    image = fs.readFileSync(path.join(dir, 'sheet.png'));
    sourceDims = { width: a.meta.size.w, height: a.meta.size.h };
    steps.push('normalize-aseprite-json');
  } else if (fs.existsSync(path.join(dir, 'frames'))) {
    const files = fs.readdirSync(path.join(dir, 'frames')).filter((f) => f.endsWith('.png')).sort();
    const loose: Array<LooseFrame & { pixels: Rgba }> = [];
    for (const f of files) {
      const parsed = parseFrameFilename(f);
      if (!parsed) throw new Error(`${meta.kind}/${meta.id}: frame "${f}" must be named <tag>_<nnn>.png`);
      const pixels = decodePng(fs.readFileSync(path.join(dir, 'frames', f)));
      loose.push({ ...parsed, w: pixels.w, h: pixels.h, pixels });
    }
    const layout = packFrames(loose, { kind: meta.kind, id: meta.id, image: imageName, pivot: meta.pivot });
    const sheet: Rgba = { w: layout.atlas.meta.size.w, h: layout.atlas.meta.size.h, data: new Uint8Array(layout.atlas.meta.size.w * layout.atlas.meta.size.h * 4) };
    for (const p of layout.placements) blit(sheet, (p.source as (typeof loose)[number]).pixels, p.x, p.y);
    atlas = layout.atlas;
    image = encodePng(sheet);
    sourceDims = { width: Math.max(...loose.map((l) => l.w)), height: Math.max(...loose.map((l) => l.h)) };
    steps.push('pack-frames');
  } else {
    throw new Error(`${meta.kind}/${meta.id}: needs sheet.json+sheet.png or frames/`);
  }

  const atlasJson = stable(atlas);
  const manifest = createProvenanceManifest({
    schemaVersion: 2,
    assetId: `${meta.kind}/${meta.id}`.replace('/', '-'),
    sourceType: meta.sourceType,
    author: meta.author,
    license: meta.license,
    sourceUrl: meta.sourceUrl,
    toolVersion: meta.toolVersion,
    pipelineSteps: steps,
    generationSteps: meta.generationSteps,
    dimensions: { width: atlas.meta.size.w, height: atlas.meta.size.h },
    sourceDimensions: sourceDims,
    paletteId: meta.paletteId,
    palette: meta.palette,
    frameTags: Object.keys(atlas.animations ?? {}),
    creationTimestamp: meta.createdAt,
    checksum: sha256(image, atlasJson),
  });

  for (const [p, content] of [[paths.json, atlasJson], [paths.image, image], [paths.provenance, stable(manifest)]] as const) {
    const dest = path.join(outRoot, p);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  }
  console.log(`built ${meta.kind}/${meta.id}: ${Object.keys(atlas.frames).length} frames, tags [${manifest.frameTags.join(', ')}]`);
};

const validateOne = (meta: AssetSource): string[] => {
  const paths = atlasOutputPaths(meta.kind, meta.id);
  const fail: string[] = [];
  const read = (p: string) => path.join(outRoot, p);
  for (const p of Object.values(paths)) if (!fs.existsSync(read(p))) fail.push(`[OUTPUT_MISSING] ${p} (run pnpm assets:build)`);
  if (fail.length) return fail;
  const atlasText = fs.readFileSync(read(paths.json), 'utf8');
  const atlas = JSON.parse(atlasText) as PixiTextureAtlasSchema;
  const image = fs.readFileSync(read(paths.image));
  const manifest = JSON.parse(fs.readFileSync(read(paths.provenance), 'utf8')) as AssetProvenanceManifest;

  const report = validateAtlasReport(atlas, { kind: meta.kind, enforceNaming: true });
  report.issues.forEach((i) => (i.severity === 'error' ? fail.push(`[${i.code}] ${meta.kind}/${meta.id} ${i.path}: ${i.message}`) : console.warn(`  warn [${i.code}] ${meta.kind}/${meta.id} ${i.path}: ${i.message}`)));
  if (atlas.meta.image !== path.basename(paths.image)) fail.push(`[META_IMAGE_MISMATCH] meta.image "${atlas.meta.image}" != ${path.basename(paths.image)}`);
  if (image.length > 24 && (image.readUInt32BE(16) !== atlas.meta.size.w || image.readUInt32BE(20) !== atlas.meta.size.h)) {
    fail.push(`[IMAGE_SIZE_MISMATCH] ${paths.image} is ${image.readUInt32BE(16)}x${image.readUInt32BE(20)} but meta.size says ${atlas.meta.size.w}x${atlas.meta.size.h}`);
  }
  validateProvenance(manifest).issues.forEach((i) => fail.push(`[${i.code}] ${meta.kind}/${meta.id} ${i.path}: ${i.message}`));
  if (manifest.checksum !== sha256(image, atlasText)) fail.push(`[CHECKSUM_MISMATCH] ${meta.kind}/${meta.id}: built files changed since provenance was written`);
  return fail;
};

const inspectOne = (meta: AssetSource) => {
  const paths = atlasOutputPaths(meta.kind, meta.id);
  const atlas = JSON.parse(fs.readFileSync(path.join(outRoot, paths.json), 'utf8')) as PixiTextureAtlasSchema;
  console.log(`\n${meta.kind}/${meta.id}  ${atlas.meta.size.w}x${atlas.meta.size.h}  ${meta.sourceType}  license: ${meta.license}`);
  for (const [tag, frames] of Object.entries(atlas.animations ?? {})) {
    const f = atlas.frames[frames[0]];
    console.log(`  ${tag.padEnd(10)} ${frames.length} frame(s)  ${f.frame.w}x${f.frame.h}  pivot ${f.pivot?.x},${f.pivot?.y}`);
  }
};

const [cmd, target] = process.argv.slice(2);
const assets = discover(target);
if (!assets.length) { console.error(target ? `No asset matches "${target}".` : 'No assets found in assets-src/.'); process.exit(1); }

if (cmd === 'build') {
  assets.forEach(({ dir, meta }) => buildOne(dir, meta));
} else if (cmd === 'validate') {
  const failures = assets.flatMap(({ meta }) => validateOne(meta));
  if (process.env.ASSETS_JSON) fs.writeFileSync(process.env.ASSETS_JSON, stable({ valid: !failures.length, failures }));
  if (failures.length) { failures.forEach((f) => console.error(`FAIL ${f}`)); process.exit(1); }
  console.log(`assets:validate OK (${assets.length} asset${assets.length === 1 ? '' : 's'})`);
} else if (cmd === 'inspect') {
  assets.forEach(({ meta }) => inspectOne(meta));
} else {
  console.error('Usage: assets build|validate|inspect [kind/id]');
  process.exit(2);
}
