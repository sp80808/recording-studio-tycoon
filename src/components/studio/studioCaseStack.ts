// Earned flight cases waiting to be opened, shown as a stack on the studio floor (diegetic link to the
// Flight Case Depot: tap the stack to open it). In-house proprietary original, Pixi Graphics, no image files.

import { Container, Graphics } from 'pixi.js';
import { iso } from './isoMath';

export type CaseLook = 'cardboard' | 'road' | 'trunk' | 'vintage' | 'vault';

interface CaseStyle { left: number; right: number; top: number; trim: number; w: number; h: number }

export const CASE_STYLES: Record<CaseLook, CaseStyle> = {
  cardboard: { left: 0x9a7448, right: 0x7d5c37, top: 0xb78a57, trim: 0xd6b27a, w: 13, h: 12 },
  road: { left: 0x2b2e3a, right: 0x20222b, top: 0x3a3e4d, trim: 0xbdc3cf, w: 14, h: 14 },
  trunk: { left: 0x14485a, right: 0x0f3644, top: 0x1d6a85, trim: 0x06b6d4, w: 15, h: 16 },
  vintage: { left: 0x6b6f78, right: 0x52555d, top: 0x8c9099, trim: 0xe6b866, w: 14, h: 14 },
  vault: { left: 0x6a4a10, right: 0x4f3708, top: 0xd4a017, trim: 0xfff0a8, w: 15, h: 16 },
};

/** Legacy 2-tier ids resolve to the new catalogue (matches economy/flightCaseEconomy). */
export const caseLookForTier = (tier: string): CaseLook => {
  switch (tier) {
    case 'cardboard_box': return 'cardboard';
    case 'tour_trunk': return 'trunk';
    case 'vintage_flight_case': return 'vintage';
    case 'holy_grail_vault': return 'vault';
    default: return 'road';
  }
};

export const MAX_VISIBLE_CASES = 4;
/** Tile the stack stands on. */
export const CASE_STACK_TILE = { x: 4.5, y: 6.45 } as const;

const drawCase = (g: Graphics, s: CaseStyle, cx: number, baseY: number) => {
  const { w, h } = s;
  const d = w / 2; // iso depth offset
  // left face, right face, top
  g.poly([cx - w, baseY - d, cx, baseY, cx, baseY - h, cx - w, baseY - h - d]).fill(s.left);
  g.poly([cx, baseY, cx + w, baseY - d, cx + w, baseY - h - d, cx, baseY - h]).fill(s.right);
  g.poly([cx - w, baseY - h - d, cx, baseY - h, cx + w, baseY - h - d, cx, baseY - h - d * 2]).fill(s.top);
  // trim bands and latch
  g.poly([cx - w, baseY - h * 0.5 - d, cx, baseY - h * 0.5, cx, baseY - h * 0.5 - 2, cx - w, baseY - h * 0.5 - d - 2]).fill({ color: s.trim, alpha: 0.7 });
  g.rect(cx - 2, baseY - h * 0.5 - 1, 4, 3).fill(s.trim);
};

export interface CaseStack {
  container: Container;
  /** Hit polygon in local coordinates (flat array). */
  hit: number[];
  update: (tSeconds: number, reduceMotion: boolean) => void;
}

/** Newest case on top; at most MAX_VISIBLE_CASES drawn, extras shown as small pips. */
export const buildCaseStack = (tiers: readonly string[], accent: number): CaseStack | null => {
  if (!tiers.length) return null;
  const origin = iso(CASE_STACK_TILE.x, CASE_STACK_TILE.y);
  const container = new Container();
  container.position.set(origin.x, origin.y);
  const glow = new Graphics();
  container.addChild(glow);
  const body = new Graphics();
  container.addChild(body);
  const shown = tiers.slice(-MAX_VISIBLE_CASES);
  // Two on the floor side by side, then one on top of each.
  const slots = [{ x: -12, lift: 0 }, { x: 12, lift: 0 }, { x: -12, lift: 15 }, { x: 12, lift: 15 }];
  shown.forEach((tier, i) => {
    drawCase(body, CASE_STYLES[caseLookForTier(tier)], slots[i].x, 6 - slots[i].lift);
  });
  const overflow = tiers.length - shown.length;
  for (let i = 0; i < Math.min(overflow, 6); i++) body.circle(-18 + i * 6, 14, 1.8).fill(accent);
  const hit = [-30, 10, 0, 22, 30, 10, 30, -36, 0, -48, -30, -36];
  return {
    container,
    hit,
    update: (t, reduceMotion) => {
      glow.clear();
      const pulse = reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(t * 2.2);
      glow.ellipse(0, 4, 34 + pulse * 4, 12 + pulse * 1.5).fill({ color: accent, alpha: 0.12 + pulse * 0.14 });
      glow.ellipse(0, 4, 24, 8).stroke({ width: 1, color: accent, alpha: 0.35 + pulse * 0.4 });
      if (!reduceMotion) container.y = origin.y + Math.sin(t * 2.2) * 0.6;
    },
  };
};
