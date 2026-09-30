/**
 * Deterministic shelf packer for frame sets that arrive as loose images (Blender renders,
 * exported PNG sequences). Stable sort + fixed width rules mean identical input -> identical
 * layout, so atlas JSON and image hashes are reproducible.
 */
import type { AtlasFrameData, PixiTextureAtlasSchema } from './assetAtlasTypes';
import { ASSET_CONVENTIONS, type AssetKind } from './assetConventions';

export interface LooseFrame {
  /** Tag the frame belongs to and its order within the tag, from names like `idle_003.png`. */
  tag: string;
  index: number;
  w: number;
  h: number;
}

/** `idle_003.png` / `work-001.png` / `celebrate.0002.png` / `hair_afro_000.png` -> { tag, index }; null if unparseable. */
export const parseFrameFilename = (filename: string): { tag: string; index: number } | null => {
  const m = /^([a-z][a-z0-9_]*)[_.-](\d{1,4})\.png$/i.exec(filename);
  return m ? { tag: m[1].toLowerCase(), index: Number(m[2]) } : null;
};

export interface PackOptions {
  kind: AssetKind;
  id: string;
  image: string;
  maxWidth?: number;
  padding?: number;
  pivot?: { x: number; y: number };
  app?: string;
  appVersion?: string;
}

export interface PackedLayout {
  atlas: PixiTextureAtlasSchema;
  /** Input frame -> destination, for the image compositor. */
  placements: Array<{ source: LooseFrame; name: string; x: number; y: number }>;
}

export function packFrames(frames: readonly LooseFrame[], options: PackOptions): PackedLayout {
  if (!frames.length) throw new Error('packFrames: no frames.');
  const padding = options.padding ?? ASSET_CONVENTIONS[options.kind].padding;
  const maxWidth = options.maxWidth ?? 512;
  const pivot = options.pivot ?? ASSET_CONVENTIONS[options.kind].pivot;
  const sorted = [...frames].sort((a, b) => a.tag.localeCompare(b.tag) || a.index - b.index);

  let x = padding, y = padding, rowH = 0, usedW = 0;
  const placements: PackedLayout['placements'] = [];
  const atlasFrames: Record<string, AtlasFrameData> = {};
  const animations: Record<string, string[]> = {};
  const counters: Record<string, number> = {};

  for (const f of sorted) {
    if (x + f.w + padding > maxWidth && x > padding) {
      x = padding;
      y += rowH + padding;
      rowH = 0;
    }
    const n = counters[f.tag] ?? 0;
    counters[f.tag] = n + 1;
    const name = `${options.kind}/${options.id}/${f.tag}/${String(n).padStart(3, '0')}`;
    atlasFrames[name] = {
      frame: { x, y, w: f.w, h: f.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h },
      sourceSize: { w: f.w, h: f.h },
      pivot,
    };
    (animations[f.tag] ??= []).push(name);
    placements.push({ source: f, name, x, y });
    x += f.w + padding;
    rowH = Math.max(rowH, f.h);
    usedW = Math.max(usedW, x);
  }
  const height = y + rowH + padding;
  const pow2 = (n: number) => 2 ** Math.ceil(Math.log2(Math.max(n, 1)));
  const tags = Object.entries(animations).map(([name, list]) => ({ name, from: Object.keys(atlasFrames).indexOf(list[0]), to: Object.keys(atlasFrames).indexOf(list[list.length - 1]), direction: 'forward' as const }));

  return {
    placements,
    atlas: {
      frames: atlasFrames,
      animations,
      meta: {
        app: options.app ?? 'rst-frame-packer',
        version: options.appVersion ?? '1',
        image: options.image,
        format: 'RGBA8888',
        size: { w: pow2(usedW), h: pow2(height) },
        scale: '1',
        tags,
      },
    },
  };
}
