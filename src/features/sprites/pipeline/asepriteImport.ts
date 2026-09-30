/**
 * Aseprite (and Pixelorama, which exports the same Aseprite-compatible JSON shape) -> canonical
 * PixiTextureAtlasSchema. Pure function; the CLI feeds it parsed JSON.
 *
 * Frames are renamed to the canonical `<kind>/<id>/<tag>/<nnn>` by the order they appear in each
 * frameTag, so artists never have to fight Aseprite's filename-format templates.
 * Pivots: a slice named `pivot` (Aseprite slice pivot is in px) wins, else `options.pivot`, else the kind default.
 */
import type { AtlasFrameData, PixiAtlasMetadata, PixiTextureAtlasSchema } from './assetAtlasTypes';
import { ASSET_CONVENTIONS, type AssetKind } from './assetConventions';

interface AsepriteFrame {
  filename?: string;
  frame: { x: number; y: number; w: number; h: number };
  rotated?: boolean;
  trimmed?: boolean;
  spriteSourceSize?: { x: number; y: number; w: number; h: number };
  sourceSize?: { w: number; h: number };
  duration?: number;
}
export interface AsepriteExport {
  frames: AsepriteFrame[] | Record<string, AsepriteFrame>;
  meta: {
    app?: string;
    version?: string;
    image?: string;
    format?: string;
    size?: { w: number; h: number };
    scale?: string;
    frameTags?: Array<{ name: string; from: number; to: number; direction?: string }>;
    slices?: Array<{ name: string; keys: Array<{ frame: number; bounds: { x: number; y: number; w: number; h: number }; pivot?: { x: number; y: number } }> }>;
  };
}

export interface AsepriteImportOptions {
  kind: AssetKind;
  id: string;
  /** Override pivot (normalised). */
  pivot?: { x: number; y: number };
  /** Image filename to write into meta.image (defaults to the export's own). */
  image?: string;
}

export interface AsepriteImportResult {
  atlas: PixiTextureAtlasSchema;
  /** Per-frame durations in ms keyed by canonical name (Pixi atlas JSON has no slot for them). */
  durations: Record<string, number>;
  warnings: string[];
}

export function normalizeAsepriteExport(src: AsepriteExport, options: AsepriteImportOptions): AsepriteImportResult {
  const warnings: string[] = [];
  const list: AsepriteFrame[] = Array.isArray(src.frames) ? src.frames : Object.values(src.frames);
  const tags = src.meta?.frameTags ?? [];
  if (!tags.length) throw new Error('Aseprite export has no frameTags; define animation tags (idle/work/celebrate...).');

  const pivotSlice = src.meta.slices?.find((s) => s.name === 'pivot');
  const conv = ASSET_CONVENTIONS[options.kind];
  const frames: Record<string, AtlasFrameData> = {};
  const animations: Record<string, string[]> = {};
  const durations: Record<string, number> = {};
  const metaTags: NonNullable<PixiAtlasMetadata['tags']> = [];
  let cursor = 0;

  for (const tag of [...tags].sort((a, b) => a.from - b.from)) {
    const names: string[] = [];
    for (let i = tag.from; i <= tag.to; i++) {
      const f = list[i];
      if (!f) throw new Error(`Tag "${tag.name}" references frame ${i} which does not exist.`);
      const name = `${options.kind}/${options.id}/${tag.name}/${String(i - tag.from).padStart(3, '0')}`;
      const w = f.frame.w, h = f.frame.h;
      let pivot = options.pivot ?? conv.pivot;
      const key = pivotSlice?.keys.find((k) => k.frame <= i) ?? pivotSlice?.keys[0];
      if (key?.pivot) {
        const sw = f.sourceSize?.w ?? w, sh = f.sourceSize?.h ?? h;
        pivot = { x: key.pivot.x / sw, y: key.pivot.y / sh };
      }
      frames[name] = {
        frame: { ...f.frame },
        rotated: !!f.rotated,
        trimmed: !!f.trimmed,
        spriteSourceSize: f.spriteSourceSize ? { ...f.spriteSourceSize } : { x: 0, y: 0, w, h },
        sourceSize: f.sourceSize ? { ...f.sourceSize } : { w, h },
        pivot,
      };
      durations[name] = f.duration ?? 100;
      names.push(name);
    }
    animations[tag.name] = names;
    metaTags.push({ name: tag.name, from: cursor, to: cursor + names.length - 1, direction: (tag.direction as 'forward' | 'reverse' | 'pingpong') ?? 'forward' });
    cursor += names.length;
  }
  if (cursor < list.length) warnings.push(`${list.length - cursor} frame(s) are not covered by any tag and were dropped.`);

  return {
    atlas: {
      frames,
      animations,
      meta: {
        app: src.meta.app ?? 'aseprite',
        version: src.meta.version ?? '1.0',
        image: options.image ?? src.meta.image ?? '',
        format: (src.meta.format as PixiAtlasMetadata['format']) ?? 'RGBA8888',
        size: src.meta.size ?? { w: 0, h: 0 },
        scale: src.meta.scale ?? '1',
        tags: metaTags,
      },
    },
    durations,
    warnings,
  };
}
