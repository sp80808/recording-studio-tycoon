import { PixiTextureAtlasSchema, AssetProvenanceManifest } from './assetAtlasTypes';

/**
 * Validates a PixiJS v8 texture atlas for completeness, correct frame bounds,
 * and valid animation frame sequences.
 */
export function validatePixiAtlas(atlas: PixiTextureAtlasSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!atlas.meta || !atlas.meta.image) {
    errors.push('Atlas metadata missing or lacks target image filename.');
  }

  if (!atlas.frames || Object.keys(atlas.frames).length === 0) {
    errors.push('Atlas contains no frames.');
    return { valid: false, errors };
  }

  for (const [frameKey, frameData] of Object.entries(atlas.frames)) {
    if (!frameData.frame) {
      errors.push(`Frame ${frameKey} is missing rect definition.`);
      continue;
    }
    if (frameData.frame.w <= 0 || frameData.frame.h <= 0) {
      errors.push(`Frame ${frameKey} has invalid dimensions (${frameData.frame.w}x${frameData.frame.h}).`);
    }
  }

  // Check animation sequences
  if (atlas.animations) {
    for (const [animName, frameList] of Object.entries(atlas.animations)) {
      if (!Array.isArray(frameList) || frameList.length === 0) {
        errors.push(`Animation ${animName} has empty or invalid frame list.`);
        continue;
      }
      for (const frameId of frameList) {
        if (!atlas.frames[frameId]) {
          errors.push(`Animation ${animName} references non-existent frame: ${frameId}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Creates an authoritative provenance manifest for tracking assets from creation to production.
 */
export function createProvenanceManifest(
  params: Omit<AssetProvenanceManifest, 'creationTimestamp' | 'checksum'>
): AssetProvenanceManifest {
  const ts = new Date().toISOString();
  // Simple checksum generator for reproducibility
  const content = `${params.assetId}-${params.sourceType}-${params.toolVersion}-${ts}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }

  return {
    ...params,
    creationTimestamp: ts,
    checksum: `0x${Math.abs(hash).toString(16).padStart(8, '0')}`,
  };
}
