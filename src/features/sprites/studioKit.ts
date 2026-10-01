import { Assets, Container, Sprite } from 'pixi.js';
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
