/**
 * Pixi AnimatedSprite spike (#81): a tape-reel spin built from authored frames, driven by the
 * serializable GearSpriteVisualState. One shared frame set per renderer; no DOM, no React.
 */
import { AnimatedSprite, Graphics, type Renderer, type Texture } from 'pixi.js';
import type { GearSpriteVisualState } from './gearVisualState';
import { REEL_SPOKES, reelAnimationSpeed, reelFrameAngles } from './gearReelMath';

export { REEL_FRAME_COUNT, reelAnimationSpeed, reelFrameAngles } from './gearReelMath';

const SPOKES = REEL_SPOKES;

export const buildReelTextures = (renderer: Renderer, radius = 10): Texture[] =>
  reelFrameAngles().map((angle) => {
    const g = new Graphics();
    g.circle(0, 0, radius).fill(0x1c1917).stroke({ width: 1, color: 0x78716c });
    for (let s = 0; s < SPOKES; s++) {
      const a = angle + (s * Math.PI * 2) / SPOKES;
      g.moveTo(0, 0).lineTo(Math.cos(a) * (radius - 2), Math.sin(a) * (radius - 2)).stroke({ width: 2, color: 0xd6d3d1 });
    }
    const texture = renderer.generateTexture(g);
    g.destroy();
    return texture;
  });

export const createReelSprite = (textures: Texture[]): AnimatedSprite => {
  const sprite = new AnimatedSprite(textures, false);
  sprite.anchor.set(0.5);
  sprite.animationSpeed = 0;
  return sprite;
};

/** Idempotent: applies state; stopped/static when speed is 0 so no ticker work is spent. */
export const applyReelState = (sprite: AnimatedSprite, state: GearSpriteVisualState, reducedMotion: boolean): void => {
  const speed = reelAnimationSpeed(state, reducedMotion);
  if (speed === 0) {
    sprite.stop();
    sprite.gotoAndStop(0);
    return;
  }
  sprite.animationSpeed = speed;
  if (!sprite.playing) sprite.play();
};
