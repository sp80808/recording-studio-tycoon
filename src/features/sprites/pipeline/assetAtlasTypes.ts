/**
 * TexturePacker / Aseprite / PixiJS v8 Texture Atlas & Metadata Schema
 * Supports frame slices, 9-slice bounds, animation tags, and provenance manifests.
 */

export interface AtlasFrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasFrameData {
  frame: AtlasFrameRect;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: AtlasFrameRect;
  sourceSize: { w: number; h: number };
  pivot?: { x: number; y: number }; // Default 0.5, 0.5 or feet baseline 0.5, 1.0
}

export interface AtlasSliceNinePatch {
  name: string;
  keys: Array<{
    frame: number;
    bounds: AtlasFrameRect;
    center?: AtlasFrameRect; // 9-slice center region
    pivot?: { x: number; y: number };
  }>;
}

export interface PixiAtlasMetadata {
  app: string;            // e.g. 'Aseprite v1.3.8-x64' or 'TexturePacker Pro 7.1'
  version: string;
  image: string;          // Texture image filename (e.g. 'characters-atlas.webp')
  format: 'RGBA8888' | 'RGBA4444' | 'RGB888';
  size: { w: number; h: number };
  scale: string;          // '1', '2', '0.5'
  smartupdate?: string;
  tags?: Array<{
    name: string;
    from: number;
    to: number;
    direction: 'forward' | 'reverse' | 'pingpong';
  }>;
  slices?: AtlasSliceNinePatch[];
}

export interface PixiTextureAtlasSchema {
  frames: Record<string, AtlasFrameData>;
  animations?: Record<string, string[]>; // e.g. 'idle': ['char_idle_0', 'char_idle_1', ...]
  meta: PixiAtlasMetadata;
}

/**
 * One provenance schema for atlases AND repo-wide art logging (#58). Fields beyond the original
 * v1 set are optional in the type so older manifests still parse, but `validateProvenance`
 * requires them for anything built by the asset pipeline (schemaVersion 2).
 */
export type AssetSourceType =
  | 'aseprite'
  | 'pixelorama'
  | 'blender_render'
  | 'vector_authored'
  | 'generative_ai_cleaned';

export interface AssetProvenanceManifest {
  schemaVersion?: 2;
  assetId: string;
  sourceType: AssetSourceType;
  author: string;
  creationTimestamp: string;
  toolVersion: string;
  pipelineSteps: string[];
  /** Exported atlas pixel size. */
  dimensions: { width: number; height: number };
  paletteId: string;
  frameTags: string[];
  /** Content hash of the exported atlas image + json (sha256 hex from the CLI). */
  checksum: string;
  license?: string;
  /** Required when the art is not in-house. */
  sourceUrl?: string;
  sourceDimensions?: { width: number; height: number };
  palette?: string[];
  generationSteps?: string[];
  sourceChecksum?: string;
}
