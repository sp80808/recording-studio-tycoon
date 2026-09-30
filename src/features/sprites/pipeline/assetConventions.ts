/**
 * Canonical asset conventions for the sprite/asset factory (issue #79).
 * Human-readable version: docs/ASSET_PIPELINE.md. This file is what the validator enforces.
 *
 * Frame names:   <kind>/<id>/<tag>/<index3>   e.g. npc/engineer/idle/000, fx/sparkle/000
 *                gear and prop single-state art use <kind>/<id>/<tag> (no index) for one frame.
 * Static props consumed by the prop loader (PR #98, public/assets/props/<id>.png) stay single PNGs;
 * the `prop` kind here can also emit that flat PNG, see `flatPngPath`.
 */
export const ASSET_KINDS = ['npc', 'layer', 'gear', 'prop', 'fx'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export interface AssetConvention {
  /** Native (authored, unscaled) frame size in px. `null` = any size, but uniform within an atlas. */
  nativeFrame: { w: number; h: number } | null;
  /** Default pivot (normalised). Characters pivot at the feet/contact point. */
  pivot: { x: number; y: number };
  /** Animation tags every atlas of this kind must define. */
  requiredTags: readonly string[];
  /** Tags allowed in addition to the required ones. */
  optionalTags: readonly string[];
  /** Transparent padding around each frame inside the atlas (extrusion-free gutter). */
  padding: number;
  /** Trimming is allowed only if spriteSourceSize/sourceSize keep the original canvas. */
  trimAllowed: boolean;
  scaleVariants: readonly string[];
  /** Any tag name is fine (layer sheets use one single-frame tag per part variant, e.g. `hair_afro`). */
  freeformTags?: boolean;
}

export const ASSET_CONVENTIONS: Record<AssetKind, AssetConvention> = {
  npc: {
    nativeFrame: { w: 32, h: 48 },
    pivot: { x: 0.5, y: 1 },
    requiredTags: ['idle'],
    optionalTags: ['walk', 'wait', 'work', 'record', 'mix', 'break', 'celebrate', 'headbob'],
    padding: 1,
    trimAllowed: false,
    scaleVariants: ['1', '2'],
  },
  // Shared-canvas body/clothing/hair parts for layered NPCs: each tag is one single-frame part drawn
  // white/grey so it can be tinted at runtime. Frame name: layer/<set>/<slot>_<variant>/000.
  layer: {
    nativeFrame: { w: 32, h: 48 },
    pivot: { x: 0.5, y: 1 },
    requiredTags: [],
    optionalTags: [],
    padding: 1,
    trimAllowed: false,
    scaleVariants: ['1', '2'],
    freeformTags: true,
  },
  gear: {
    nativeFrame: null,
    pivot: { x: 0.5, y: 1 },
    requiredTags: ['idle'],
    optionalTags: ['powered', 'active', 'broken'],
    padding: 1,
    trimAllowed: false,
    scaleVariants: ['1', '2'],
  },
  prop: {
    nativeFrame: null,
    pivot: { x: 0.5, y: 1 },
    requiredTags: ['idle'],
    optionalTags: ['active'],
    padding: 1,
    trimAllowed: false,
    scaleVariants: ['1', '2'],
  },
  fx: {
    nativeFrame: null,
    pivot: { x: 0.5, y: 0.5 },
    requiredTags: ['play'],
    optionalTags: ['loop'],
    padding: 1,
    trimAllowed: true,
    scaleVariants: ['1', '2'],
  },
};

export const ASSET_ID_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const FRAME_NAME_PATTERN = /^(npc|layer|gear|prop|fx)\/[a-z0-9]+(?:[-_][a-z0-9]+)*\/[a-z0-9_]+(?:\/\d{3})?$/;
export const SUPPORTED_ATLAS_FORMATS = ['RGBA8888', 'RGBA4444', 'RGB888'] as const;

export const flatPngPath = (id: string) => `assets/props/${id}.png`;
export const atlasOutputPaths = (kind: AssetKind, id: string) => ({
  json: `assets/atlases/${kind}/${id}.json`,
  image: `assets/atlases/${kind}/${id}.png`,
  provenance: `assets/atlases/${kind}/${id}.provenance.json`,
});
