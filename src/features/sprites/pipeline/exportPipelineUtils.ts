import type { AssetProvenanceManifest, PixiTextureAtlasSchema } from './assetAtlasTypes';
import {
  ASSET_CONVENTIONS,
  ASSET_ID_PATTERN,
  FRAME_NAME_PATTERN,
  SUPPORTED_ATLAS_FORMATS,
  type AssetKind,
} from './assetConventions';

export type IssueSeverity = 'error' | 'warning';
export interface AtlasIssue {
  code: string;
  severity: IssueSeverity;
  path: string;
  message: string;
}
export interface AtlasValidationReport {
  valid: boolean;
  errors: string[];
  issues: AtlasIssue[];
}

export interface ValidateAtlasOptions {
  /** When set, also enforce that kind's required tags, pivot range and naming convention. */
  kind?: AssetKind;
  /** Enforce `<kind>/<id>/<tag>[/nnn]` frame names (pipeline-built atlases only). */
  enforceNaming?: boolean;
}

const inRange01 = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1;

/** Machine-readable validation: each issue has a stable `code` for CI annotations. */
export function validateAtlasReport(atlas: PixiTextureAtlasSchema, options: ValidateAtlasOptions = {}): AtlasValidationReport {
  const issues: AtlasIssue[] = [];
  const add = (code: string, path: string, message: string, severity: IssueSeverity = 'error') =>
    issues.push({ code, severity, path, message });
  const finish = (): AtlasValidationReport => {
    const errors = issues.filter((i) => i.severity === 'error').map((i) => i.message);
    return { valid: errors.length === 0, errors, issues };
  };

  if (!atlas || typeof atlas !== 'object') {
    add('ATLAS_NOT_OBJECT', '', 'Atlas is not an object.');
    return finish();
  }
  const meta = atlas.meta;
  if (!meta || !meta.image) {
    add('META_IMAGE_MISSING', 'meta.image', 'Atlas metadata missing or lacks target image filename.');
  }
  if (meta && !(SUPPORTED_ATLAS_FORMATS as readonly string[]).includes(meta.format)) {
    add('META_FORMAT_UNSUPPORTED', 'meta.format', `Unsupported or unknown atlas format: ${String(meta.format)}.`);
  }
  const size = meta?.size;
  const sizeOk = !!size && size.w > 0 && size.h > 0;
  if (meta && !sizeOk) add('META_SIZE_INVALID', 'meta.size', 'Atlas meta.size must be positive.');
  if (meta && !(Number(meta.scale) > 0)) add('META_SCALE_INVALID', 'meta.scale', `Atlas scale must be a positive number string, got ${String(meta.scale)}.`);

  if (!atlas.frames || Object.keys(atlas.frames).length === 0) {
    add('FRAMES_EMPTY', 'frames', 'Atlas contains no frames.');
    return finish();
  }

  const seenNames = new Set<string>();
  for (const [key, fd] of Object.entries(atlas.frames)) {
    const path = `frames.${key}`;
    if (seenNames.has(key)) add('FRAME_DUPLICATE', path, `Duplicate frame name: ${key}`);
    seenNames.add(key);
    if (options.enforceNaming && !FRAME_NAME_PATTERN.test(key)) {
      add('FRAME_NAME_INVALID', path, `Frame ${key} does not match <kind>/<id>/<tag>[/nnn].`);
    }
    if (!fd.frame) {
      add('FRAME_RECT_MISSING', path, `Frame ${key} is missing rect definition.`);
      continue;
    }
    const { x, y, w, h } = fd.frame;
    if (!(w > 0) || !(h > 0)) {
      add('FRAME_SIZE_INVALID', path, `Frame ${key} has invalid dimensions (${w}x${h}).`);
      continue;
    }
    if (x < 0 || y < 0 || (sizeOk && (x + w > size.w || y + h > size.h))) {
      add('FRAME_OUT_OF_BOUNDS', path, `Frame ${key} (${x},${y} ${w}x${h}) lies outside the ${size?.w}x${size?.h} atlas.`);
    }
    if (fd.pivot && !(inRange01(fd.pivot.x) && inRange01(fd.pivot.y))) {
      add('PIVOT_INVALID', `${path}.pivot`, `Frame ${key} has invalid pivot (${fd.pivot.x}, ${fd.pivot.y}); expected 0..1.`);
    }
    if (!fd.trimmed && fd.sourceSize && (fd.sourceSize.w !== w || fd.sourceSize.h !== h)) {
      add('SOURCE_SIZE_MISMATCH', path, `Frame ${key} is untrimmed but sourceSize differs from frame size.`, 'warning');
    }
    if (fd.trimmed && options.kind && !ASSET_CONVENTIONS[options.kind].trimAllowed) {
      add('TRIM_NOT_ALLOWED', path, `Frame ${key}: trimming is not allowed for ${options.kind} assets.`);
    }
  }

  // Overlapping frames are almost always a packer bug (warning: aliases are legitimate).
  const rects = Object.entries(atlas.frames).filter(([, f]) => f.frame && f.frame.w > 0 && f.frame.h > 0);
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i][1].frame, b = rects[j][1].frame;
      const same = a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
      if (!same && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) {
        add('FRAME_OVERLAP', `frames.${rects[i][0]}`, `Frames ${rects[i][0]} and ${rects[j][0]} overlap.`, 'warning');
      }
    }
  }

  const animNames = new Set<string>();
  if (atlas.animations) {
    for (const [name, list] of Object.entries(atlas.animations)) {
      animNames.add(name);
      if (!Array.isArray(list) || list.length === 0) {
        add('ANIMATION_EMPTY', `animations.${name}`, `Animation ${name} has empty or invalid frame list.`);
        continue;
      }
      for (const frameId of list) {
        if (!atlas.frames[frameId]) {
          add('ANIMATION_BAD_REFERENCE', `animations.${name}`, `Animation ${name} references non-existent frame: ${frameId}`);
        }
      }
    }
  }
  for (const tag of meta?.tags ?? []) {
    if (tag.from > tag.to || tag.from < 0) add('TAG_RANGE_INVALID', `meta.tags.${tag.name}`, `Tag ${tag.name} has an invalid frame range ${tag.from}..${tag.to}.`);
    animNames.add(tag.name);
  }

  if (options.kind) {
    const conv = ASSET_CONVENTIONS[options.kind];
    for (const req of conv.requiredTags) {
      if (!animNames.has(req)) add('TAG_REQUIRED_MISSING', 'animations', `Missing required animation tag "${req}" for ${options.kind} assets.`);
    }
    for (const name of animNames) {
      if (!conv.freeformTags && ![...conv.requiredTags, ...conv.optionalTags].includes(name)) {
        add('TAG_UNKNOWN', `animations.${name}`, `Animation tag "${name}" is not in the ${options.kind} convention.`, 'warning');
      }
    }
    if (conv.nativeFrame) {
      for (const [key, fd] of Object.entries(atlas.frames)) {
        const src = fd.sourceSize;
        if (src && (src.w !== conv.nativeFrame.w || src.h !== conv.nativeFrame.h)) {
          add('FRAME_NATIVE_SIZE', `frames.${key}`, `Frame ${key} canvas ${src.w}x${src.h} is not the native ${conv.nativeFrame.w}x${conv.nativeFrame.h} for ${options.kind}.`);
        }
      }
    }
  }

  return finish();
}

/** Backwards-compatible entry point. */
export function validatePixiAtlas(atlas: PixiTextureAtlasSchema, options?: ValidateAtlasOptions): { valid: boolean; errors: string[] } {
  const { valid, errors } = validateAtlasReport(atlas, options);
  return { valid, errors };
}

/** Provenance must be complete before anything ships (#58). */
export function validateProvenance(manifest: Partial<AssetProvenanceManifest> | null | undefined): AtlasValidationReport {
  const issues: AtlasIssue[] = [];
  const need = (ok: unknown, field: string, message?: string) => {
    if (!ok) issues.push({ code: 'PROVENANCE_FIELD_MISSING', severity: 'error', path: field, message: message ?? `Provenance field "${field}" is missing or empty.` });
  };
  if (!manifest) {
    issues.push({ code: 'PROVENANCE_MISSING', severity: 'error', path: '', message: 'No provenance manifest.' });
  } else {
    need(manifest.assetId && ASSET_ID_PATTERN.test(manifest.assetId), 'assetId', 'assetId missing or not kebab/snake case.');
    need(manifest.sourceType, 'sourceType');
    need(manifest.author, 'author');
    need(manifest.license, 'license');
    need(manifest.toolVersion, 'toolVersion');
    need(manifest.creationTimestamp, 'creationTimestamp');
    need(manifest.pipelineSteps?.length, 'pipelineSteps');
    need(manifest.dimensions && manifest.dimensions.width > 0 && manifest.dimensions.height > 0, 'dimensions');
    need(manifest.sourceDimensions && manifest.sourceDimensions.width > 0, 'sourceDimensions');
    need(manifest.paletteId, 'paletteId');
    need(manifest.palette?.length, 'palette');
    need(manifest.frameTags?.length, 'frameTags');
    need(manifest.checksum, 'checksum');
    const external = manifest.sourceType === 'generative_ai_cleaned' || (manifest.license && !/in-house|cc0|own|original/i.test(manifest.license));
    if (external) need(manifest.sourceUrl || manifest.sourceType === 'generative_ai_cleaned', 'sourceUrl', 'External art needs sourceUrl.');
    if (manifest.sourceType === 'generative_ai_cleaned') need(manifest.generationSteps?.length, 'generationSteps', 'Generated art must record generation/cleanup steps.');
  }
  const errors = issues.map((i) => i.message);
  return { valid: errors.length === 0, errors, issues };
}

/** FNV-1a 32-bit over a string: cheap, deterministic, browser-safe (the CLI uses sha256 for real checksums). */
export const fnv1a = (content: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `0x${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

/**
 * Builds a provenance manifest. Pass `creationTimestamp` (and `checksum`) for reproducible
 * builds; without them the timestamp is "now" and the checksum is derived from the inputs.
 */
export function createProvenanceManifest(
  params: Omit<AssetProvenanceManifest, 'creationTimestamp' | 'checksum'> &
    Partial<Pick<AssetProvenanceManifest, 'creationTimestamp' | 'checksum'>>,
): AssetProvenanceManifest {
  const creationTimestamp = params.creationTimestamp ?? new Date().toISOString();
  const checksum =
    params.checksum ?? fnv1a(`${params.assetId}-${params.sourceType}-${params.toolVersion}-${creationTimestamp}`);
  return { ...params, creationTimestamp, checksum };
}
