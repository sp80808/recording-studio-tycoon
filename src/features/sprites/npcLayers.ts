/**
 * Renderer-agnostic layer stack for an NPC.
 *
 * Both the DOM/SVG ModularSpriteRenderer and a future Pixi living-studio renderer can consume
 * this: it is an ordered list of plain layer descriptors (slot + variant key + tint) derived
 * from the serialisable definition. Layers whose optional art is missing in a given atlas are
 * dropped by `resolveLayerFrames`, so a partial atlas degrades instead of failing.
 */
import type { ModularNpcDefinition } from './spriteTypes';

export type NpcLayerSlot =
  | 'shadow' | 'lower' | 'shoes' | 'body' | 'top' | 'outerwear' | 'face'
  | 'facialHair' | 'hair' | 'glasses' | 'jewellery' | 'headphones' | 'rolePropBack' | 'rolePropFront';

export interface NpcLayer {
  slot: NpcLayerSlot;
  /** Atlas frame-name stem, e.g. `hair/afro`. Frame names follow pipeline/assetConventions.ts. */
  variant: string;
  tint?: string;
  optional: boolean;
}

export const buildNpcLayerStack = (npc: ModularNpcDefinition): NpcLayer[] => {
  const { body, hair, clothes, details, roleProps } = npc;
  const layers: NpcLayer[] = [
    { slot: 'shadow', variant: 'body/shadow', optional: false },
    { slot: 'rolePropBack', variant: `prop/${roleProps.renderProp}_back`, tint: roleProps.accentColor, optional: true },
    { slot: 'lower', variant: `lower/${clothes.lower}`, tint: clothes.lowerHex, optional: false },
    { slot: 'shoes', variant: `shoes/${clothes.shoes}`, tint: clothes.shoesHex, optional: false },
    { slot: 'body', variant: `body/${body.build}`, tint: body.skinHex, optional: false },
    { slot: 'top', variant: `top/${clothes.top}`, tint: clothes.topPrimaryHex, optional: false },
  ];
  if (clothes.outerwear !== 'none') {
    layers.push({ slot: 'outerwear', variant: `outerwear/${clothes.outerwear}`, tint: clothes.outerwearHex, optional: true });
  }
  layers.push({ slot: 'face', variant: `face/${body.face}`, optional: false });
  if (hair.facialHair !== 'none') layers.push({ slot: 'facialHair', variant: `facial/${hair.facialHair}`, tint: hair.hairHex, optional: true });
  if (hair.shape !== 'bald') layers.push({ slot: 'hair', variant: `hair/${hair.shape}`, tint: hair.hairHex, optional: false });
  if (details.glasses !== 'none') layers.push({ slot: 'glasses', variant: `glasses/${details.glasses}`, optional: true });
  if (details.jewellery !== 'none') layers.push({ slot: 'jewellery', variant: `jewellery/${details.jewellery}`, optional: true });
  if (roleProps.renderProp === 'headphones') layers.push({ slot: 'headphones', variant: 'prop/headphones', tint: details.headphoneColor, optional: true });
  layers.push({ slot: 'rolePropFront', variant: `prop/${roleProps.renderProp}`, tint: roleProps.accentColor, optional: true });
  return layers;
};

/**
 * Keep only layers the atlas can draw. Missing optional layers are skipped; a missing required
 * layer is reported so callers can fall back to the DOM/SVG renderer for that NPC.
 */
export const resolveLayerFrames = (
  layers: readonly NpcLayer[],
  hasFrame: (variant: string) => boolean,
): { drawable: NpcLayer[]; missingRequired: string[] } => {
  const drawable: NpcLayer[] = [];
  const missingRequired: string[] = [];
  for (const layer of layers) {
    if (hasFrame(layer.variant)) drawable.push(layer);
    else if (!layer.optional) missingRequired.push(layer.variant);
  }
  return { drawable, missingRequired };
};

/** Atlas frame name for a layer variant (`hair/afro` -> `layer/npc-parts/hair_afro/000`). */
export const layerFrameName = (variant: string, set = 'npc-parts') => `layer/${set}/${variant.replace('/', '_')}/000`;
