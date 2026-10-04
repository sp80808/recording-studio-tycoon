import { Assets, Container, Graphics, Sprite } from 'pixi.js';
import type { Spritesheet, Texture } from 'pixi.js';

export const STUDIO_KIT_URL = '/assets/studio-kit/studio-kit.json';
export type StudioKitTextures = Record<string, Texture>;
let loading: Promise<StudioKitTextures | null> | undefined;

/** One shared atlas; failed downloads leave the existing Graphics furniture usable. */
export const loadStudioKit = (): Promise<StudioKitTextures | null> => loading ??= Assets.load<Spritesheet>(STUDIO_KIT_URL)
  .then(sheet => {
    if (['analog60s', 'streaming2020s'].some(era => studioProps(5, era).some(prop => !sheet.textures?.[prop.model]))) {
      throw new Error('Incomplete studio atlas');
    }
    return sheet.textures;
  })
  .catch(error => {
    loading = undefined;
    console.warn('Studio art unavailable; using built-in furniture.', error);
    return null;
  });

interface StudioProp {
  model: string;
  x: number;
  y: number;
  tier: number;
  scale: number;
  lift?: number;
}

const CRISP_PROCEDURAL_MODELS = new Set([
  'cardboardBoxClosed',
  'pottedPlant',
  'plantSmall1',
  'plantSmall2',
  'plantSmall3',
]);

/** Low-resolution atlas props that become muddy when enlarged in the WebGL room. */
export const usesCrispProceduralProp = (model: string): boolean => CRISP_PROCEDURAL_MODELS.has(model);

const buildCrispPlant = (model: string, scale: number): Graphics => {
  const g = new Graphics();
  const large = model === 'pottedPlant';
  const size = (large ? 1.15 : 0.82) * Math.min(1.35, scale);
  const pot = large ? 9 : 6.5;
  const leaf = large ? 13 : 8.5;
  g.ellipse(0, 2, pot * 1.2, 3.2).fill({ color: 0x0c0907, alpha: 0.28 });
  g.poly([-pot, -10, pot, -10, pot * 0.7, 0, -pot * 0.7, 0])
    .fill(model === 'plantSmall2' ? 0x315f68 : 0x9a6038)
    .stroke({ width: 1, color: 0x241810, alpha: 0.9 });
  g.rect(-pot, -12, pot * 2, 3).fill(model === 'plantSmall2' ? 0x477d83 : 0xbd7a49);
  g.moveTo(0, -11).lineTo(0, -24 * size).stroke({ width: 2, color: 0x315c38 });
  const leaves = large
    ? [[-8, -27, -16, -35], [7, -29, 16, -37], [-5, -38, -9, -48], [5, -40, 11, -50], [0, -30, 1, -45]]
    : [[-5, -22, -10, -29], [5, -23, 11, -31], [-3, -30, -5, -37], [3, -31, 7, -39]];
  leaves.forEach(([x0, y0, x1, y1], index) => {
    const green = index % 2 ? 0x5b8b55 : 0x3f7147;
    g.moveTo(x0 * size, y0 * size).lineTo(x1 * size, y1 * size)
      .stroke({ width: leaf * 0.48, color: green, cap: 'round' });
    g.moveTo(x0 * size, y0 * size).lineTo(x1 * size, y1 * size)
      .stroke({ width: 1, color: 0xa6b878, alpha: 0.45, cap: 'round' });
  });
  return g;
};

const buildCrispBox = (): Graphics => {
  const g = new Graphics();
  g.ellipse(0, 3, 15, 4).fill({ color: 0x0c0907, alpha: 0.26 });
  g.poly([-13, -15, 7, -20, 15, -14, -5, -9]).fill(0xb98750)
    .stroke({ width: 1, color: 0x52351e });
  g.poly([-13, -15, -5, -9, -5, 1, -13, -5]).fill(0x815530);
  g.poly([-5, -9, 15, -14, 15, -3, -5, 1]).fill(0xa66f3d)
    .stroke({ width: 1, color: 0x52351e });
  g.moveTo(1, -17.5).lineTo(2, -11).stroke({ width: 1.2, color: 0x76502f });
  g.moveTo(-1, -7).lineTo(11, -10).stroke({ width: 1, color: 0xd3a66c, alpha: 0.55 });
  return g;
};

/** Tile coordinates and baked ground origins share the room's 28x14 projection. */
export const studioProps = (tier: number, era?: string): StudioProp[] => [
  { model: 'chairDesk', x: 3, y: 5.25, tier: 1, scale: 1.3 },
  { model: 'speakerSmall', x: 6.8, y: 2.3, tier: 1, scale: 1.4 },
  { model: 'plantSmall1', x: 7.3, y: 1, tier: 1, scale: 1.7 },
  { model: 'cardboardBoxClosed', x: 1, y: 6.65, tier: 1, scale: 1.2 },
  { model: 'pottedPlant', x: 0.55, y: 1.5, tier: 2, scale: 1.8 },
  { model: 'sideTable', x: 1.9, y: 6.2, tier: 2, scale: 1.5 },
  { model: 'kitchenCoffeeMachine', x: 1.7, y: 6.2, tier: 2, scale: 1.3, lift: 21 },
  { model: 'radio', x: 2.15, y: 6.2, tier: 2, scale: 1.1, lift: 21 },
  { model: 'plantSmall2', x: 1.3, y: 6.4, tier: 2, scale: 1.3 },
  { model: era === 'streaming2020s' ? 'loungeDesignSofa' : 'loungeSofa', x: 6, y: 5.6, tier: 3, scale: 1.6 },
  { model: 'tableCoffee', x: 6, y: 6.45, tier: 3, scale: 1.3 },
  { model: 'loungeChair', x: 7.15, y: 5.4, tier: 3, scale: 1.3 },
  { model: 'lampRoundFloor', x: 7.4, y: 5.9, tier: 3, scale: 1.4 },
  { model: 'speaker', x: 3.4, y: 1, tier: 3, scale: 1.4 },
  { model: 'bookcaseOpen', x: 7.1, y: 0.7, tier: 4, scale: 1.5 },
  { model: 'sideTable', x: 7, y: 3.2, tier: 4, scale: 1.5 },
  { model: 'laptop', x: 7, y: 3.2, tier: 4, scale: 1.5, lift: 21 },
  { model: 'lampRoundTable', x: 7.25, y: 3.2, tier: 4, scale: 1.2, lift: 21 },
  { model: 'plantSmall3', x: 4.5, y: 6.5, tier: 5, scale: 1.7 },
].filter(prop => prop.tier <= tier);

export const addStudioProps = (root: Container, textures: StudioKitTextures, tier: number, era?: string): void => {
  for (const prop of studioProps(tier, era)) {
    if (usesCrispProceduralProp(prop.model)) {
      const procedural = prop.model === 'cardboardBoxClosed'
        ? buildCrispBox()
        : buildCrispPlant(prop.model, prop.scale);
      procedural.label = `studio-prop:${prop.model}:procedural`;
      procedural.position.set((prop.x - prop.y) * 28, (prop.x + prop.y) * 14 - (prop.lift ?? 0));
      procedural.eventMode = 'none';
      root.addChild(procedural);
      continue;
    }
    const texture = textures[prop.model];
    if (!texture) continue;
    const sprite = new Sprite(texture);
    sprite.label = `studio-prop:${prop.model}`;
    sprite.anchor.set(0.5); // The shared source canvas puts the ground origin at its center.
    sprite.scale.set(prop.scale);
    sprite.position.set((prop.x - prop.y) * 28, (prop.x + prop.y) * 14 - (prop.lift ?? 0));
    sprite.eventMode = 'none';
    // Floor props sit behind the interactive console/booth; people remain in front.
    root.addChild(sprite);
  }
};
