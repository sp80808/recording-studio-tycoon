// Modular low-poly staff/artist characters built from Blender-rendered, tintable layers.
// Render script: tools/blender/make_characters.py -> public/assets/studio/characters.
//
// Every layer is rendered at the same origin, so a character is just the layers stacked
// bottom -> top with a flat tint each (skin, hair, top, bottom, shoes, accessories).

import { Assets, Container, Sprite, Texture } from 'pixi.js';
import { studioAssetUrl } from './studioSprites';

export type Facing = 'se' | 'ne' | 'nw' | 'sw';
export type Pose = 'idle' | 'work';
export const FACINGS: Facing[] = ['se', 'ne', 'nw', 'sw'];
export const POSES: Pose[] = ['idle', 'work'];

export const HAIR_STYLES = ['none', 'short', 'quiff', 'long', 'bun', 'puffy'] as const;
export const TOP_STYLES = ['tee', 'hoodie', 'jacket'] as const;
export const BOTTOM_STYLES = ['jeans', 'shorts', 'skirt'] as const;
export const ACCESSORIES = ['headphones', 'glasses', 'cap', 'beanie'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export type TopStyle = (typeof TOP_STYLES)[number];
export type BottomStyle = (typeof BOTTOM_STYLES)[number];
export type Accessory = (typeof ACCESSORIES)[number];

export interface CharacterLook {
  skin: number;
  hair: { style: HairStyle; color: number };
  top: { style: TopStyle; color: number };
  bottom: { style: BottomStyle; color: number };
  shoes: number;
  accessories: { kind: Accessory; color: number }[];
}

export const SKIN_TONES = [0xffdcb8, 0xf2c9a0, 0xe0ac88, 0xc68b62, 0x8d5a3b, 0x5d3a26];
export const HAIR_COLORS = [0x1b1b1b, 0x2e3040, 0x5a3a26, 0x7a3b2a, 0xc98a2e, 0xe8d8a8, 0xc77dff, 0x5aa9e6];
export const OUTFIT_COLORS = [0x5aa9e6, 0xe08fa8, 0x7bd389, 0xf2c14e, 0xc77dff, 0xe05c5c, 0xf2f2f2, 0x2a2f3c, 0x253047, 0x7a5a43];

/** Hand-picked starting crew so a fresh studio already looks varied. */
export const CHARACTER_PRESETS: CharacterLook[] = [
  { skin: 0xf2c9a0, hair: { style: 'quiff', color: 0x2e3040 }, top: { style: 'hoodie', color: 0x5aa9e6 }, bottom: { style: 'jeans', color: 0x253047 }, shoes: 0xf2f2f2, accessories: [{ kind: 'headphones', color: 0xe6b866 }] },
  { skin: 0x8d5a3b, hair: { style: 'puffy', color: 0x1b1b1b }, top: { style: 'jacket', color: 0xc77dff }, bottom: { style: 'skirt', color: 0x2a2f3c }, shoes: 0x1b2130, accessories: [{ kind: 'glasses', color: 0xffffff }] },
  { skin: 0xe0ac88, hair: { style: 'long', color: 0xc98a2e }, top: { style: 'tee', color: 0xe05c5c }, bottom: { style: 'shorts', color: 0x7a5a43 }, shoes: 0xd9a441, accessories: [{ kind: 'cap', color: 0x7bd389 }] },
  { skin: 0xffdcb8, hair: { style: 'bun', color: 0x7a3b2a }, top: { style: 'tee', color: 0xf2c14e }, bottom: { style: 'jeans', color: 0x5aa9e6 }, shoes: 0x1b2130, accessories: [{ kind: 'beanie', color: 0xe08fa8 }, { kind: 'glasses', color: 0xffffff }] },
  { skin: 0x5d3a26, hair: { style: 'short', color: 0x1b1b1b }, top: { style: 'hoodie', color: 0x7bd389 }, bottom: { style: 'jeans', color: 0x2a2f3c }, shoes: 0xf2f2f2, accessories: [{ kind: 'headphones', color: 0xe6b866 }] },
];

/** Deterministic look for the n-th crew member; `accent` recolours headphones to the era accent. */
export const getPresetLook = (index: number, accent?: number): CharacterLook => {
  const base = CHARACTER_PRESETS[((index % CHARACTER_PRESETS.length) + CHARACTER_PRESETS.length) % CHARACTER_PRESETS.length];
  if (accent === undefined) return base;
  return { ...base, accessories: base.accessories.map((a) => (a.kind === 'headphones' ? { ...a, color: accent } : a)) };
};

interface LayerSpec {
  layer: string;
  tint: number | null;
}

/** Layers bottom -> top with their tints. Face and glasses are baked colours (no tint). */
export const getLayers = (look: CharacterLook): LayerSpec[] => {
  const out: LayerSpec[] = [
    { layer: 'skin', tint: look.skin },
    { layer: 'face', tint: null },
    { layer: 'shoes', tint: look.shoes },
    { layer: `bottom_${look.bottom.style}`, tint: look.bottom.color },
    { layer: `top_${look.top.style}`, tint: look.top.color },
  ];
  if (look.hair.style !== 'none') out.push({ layer: `hair_${look.hair.style}`, tint: look.hair.color });
  for (const a of look.accessories) {
    out.push({ layer: `acc_${a.kind}`, tint: a.kind === 'glasses' ? null : a.color });
  }
  return out;
};

const textures = new Map<string, Texture>();
const key = (layer: string, facing: Facing, pose: Pose) => `${layer}_${facing}_${pose}`;

/** Loads every facing/pose of every layer a look needs (idempotent). */
export const ensureLook = async (look: CharacterLook): Promise<void> => {
  const jobs: Promise<void>[] = [];
  for (const { layer } of getLayers(look)) {
    for (const f of FACINGS) {
      for (const p of POSES) {
        const k = key(layer, f, p);
        if (textures.has(k)) continue;
        jobs.push(
          Assets.load<Texture>(studioAssetUrl(`assets/studio/characters/${k}.png`))
            .then((t) => { textures.set(k, t); })
            .catch(() => undefined),
        );
      }
    }
  }
  await Promise.all(jobs);
};

export const isLookReady = (look: CharacterLook): boolean =>
  getLayers(look).every(({ layer }) => textures.has(key(layer, 'se', 'idle')));

/** Sprite origin inside the 128x160 layer PNGs (feet), as a fraction. */
const ANCHOR_X = 64 / 128;
const ANCHOR_Y = 140 / 160;

export interface CharacterSprite {
  container: Container;
  setView: (facing: Facing, pose: Pose) => void;
}

/** Stack the tinted layers for a look. Returns null if its textures are not loaded yet. */
export const buildCharacter = (look: CharacterLook, facing: Facing = 'se', pose: Pose = 'idle'): CharacterSprite | null => {
  if (!isLookReady(look)) return null;
  const layers = getLayers(look);
  const container = new Container();
  const sprites = layers.map(({ layer, tint }) => {
    const s = new Sprite();
    s.anchor.set(ANCHOR_X, ANCHOR_Y);
    s.scale.set(0.5);
    if (tint !== null) s.tint = tint;
    container.addChild(s);
    return { s, layer };
  });
  const setView = (f: Facing, p: Pose) => {
    for (const { s, layer } of sprites) {
      const t = textures.get(key(layer, f, p));
      s.texture = t ?? Texture.EMPTY;
    }
  };
  setView(facing, pose);
  return { container, setView };
};

/** Which way to face so a character at `from` looks towards `to` (game tile coords). */
export const facingTowards = (from: { x: number; y: number }, to: { x: number; y: number }): Facing => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'se' : 'nw';
  return dy >= 0 ? 'sw' : 'ne';
};
