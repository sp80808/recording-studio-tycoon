/**
 * Layered Pixi NPC: a Container of tinted Sprites built from the renderer-neutral layer stack
 * (npcLayers.ts) and a `layer` atlas (assets-src/layer/npc-parts). Presentation only; nothing
 * here belongs in GameState. Missing optional art is skipped; missing required art is reported
 * so the caller can fall back to the DOM/SVG renderer.
 */
import { Container, Sprite } from 'pixi.js';
import type { LoadedAtlas } from './pipeline/pixiAtlasLoader';
import { framePivot } from './pipeline/atlasResolver';
import { buildNpcLayerStack, layerFrameName, resolveLayerFrames } from './npcLayers';
import type { ModularNpcDefinition } from './spriteTypes';

const hexToNumber = (hex?: string) => (hex ? parseInt(hex.replace('#', ''), 16) : 0xffffff);

export interface LayeredNpc {
  container: Container;
  /** Layer variants the atlas could not supply (required ones only). */
  missingRequired: string[];
  spriteCount: number;
}

export const createLayeredNpc = (loaded: LoadedAtlas, npc: ModularNpcDefinition, set = 'npc-parts'): LayeredNpc => {
  const { drawable, missingRequired } = resolveLayerFrames(buildNpcLayerStack(npc), (v) => !!loaded.sheet.textures[layerFrameName(v, set)]);
  const container = new Container();
  for (const layer of drawable) {
    const frame = layerFrameName(layer.variant, set);
    const sprite = new Sprite(loaded.sheet.textures[frame]);
    const pivot = framePivot(loaded.atlas, frame);
    sprite.anchor.set(pivot.x, pivot.y);
    // Face, shadow and untinted parts keep their authored colours.
    if (layer.tint && layer.slot !== 'face' && layer.slot !== 'shadow') sprite.tint = hexToNumber(layer.tint);
    container.addChild(sprite);
  }
  return { container, missingRequired, spriteCount: drawable.length };
};
