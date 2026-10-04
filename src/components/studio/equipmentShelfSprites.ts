/**
 * Equipment shelf layout for the living studio.
 * Driven by owned gear IDs + equipmentArt / equipmentSpriteMap.
 * Missing PNG art falls back to compact, diegetic rack faceplates (never blank slots).
 */

import { getEquipmentArt, getEquipmentSprite } from '@/data/equipmentArt';
import { equipmentSpriteMap } from '@/data/equipmentSprites';

export interface ShelfSlotLayout {
  equipmentId: string;
  /** Local shelf pixel X (centre of item). */
  x: number;
  /** Local shelf pixel Y (top of shelf surface; item grows upward). */
  y: number;
  width: number;
  height: number;
  /** Pixi tint / fill colour when drawing the bar fallback. */
  tint: number;
  /** Public-relative sprite path from equipmentArt (may be missing on disk). */
  spritePath: string;
  /** Bare filename from equipmentSpriteMap when present. */
  spriteFile: string | null;
  /** Procedural faceplate used while authored art is unavailable. */
  faceplate: RackFaceplate;
}

export interface RackFaceplateDetail {
  shape: 'rect' | 'circle';
  /** Normalised coordinates within the faceplate, 0..1. */
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: number;
  alpha?: number;
}

export interface RackFaceplate {
  chassis: number;
  panel: number;
  edge: number;
  details: RackFaceplateDetail[];
}

function mixRgb(color: number, target: number, amount: number): number {
  const mix = (shift: number) => {
    const from = (color >> shift) & 0xff;
    const to = (target >> shift) & 0xff;
    return Math.round(from + (to - from) * amount);
  };
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

/**
 * Build a restrained piece of rack hardware instead of exposing an item's tint
 * as a full, floating block. The accent survives as a tiny label/LED while the
 * chassis stays in the studio's warm charcoal and brass material language.
 */
export function resolveRackFaceplate(
  equipmentId: string,
  accent: number,
): RackFaceplate {
  const category = getEquipmentArt(equipmentId)?.category ?? 'unknown';
  const chassis = 0x211c18;
  const panel = 0x393029;
  const edge = 0x6b5844;
  const brass = 0xb89661;
  const ink = 0x151210;
  const softAccent = mixRgb(accent, 0xd7b982, 0.38);
  const led = mixRgb(accent, 0xffd37a, 0.2);
  const details: RackFaceplateDetail[] = [
    { shape: 'circle', x: 0.1, y: 0.5, radius: 0.035, color: brass, alpha: 0.85 },
    { shape: 'circle', x: 0.9, y: 0.5, radius: 0.035, color: brass, alpha: 0.85 },
  ];

  if (category === 'monitor') {
    details.push(
      { shape: 'circle', x: 0.5, y: 0.6, radius: 0.22, color: ink },
      { shape: 'circle', x: 0.5, y: 0.6, radius: 0.11, color: softAccent },
      { shape: 'circle', x: 0.5, y: 0.23, radius: 0.06, color: 0xc6b49a },
    );
  } else if (category === 'microphone') {
    details.push(
      { shape: 'rect', x: 0.38, y: 0.16, width: 0.24, height: 0.43, color: 0x877b6e },
      { shape: 'rect', x: 0.45, y: 0.59, width: 0.1, height: 0.25, color: brass },
      { shape: 'rect', x: 0.25, y: 0.78, width: 0.5, height: 0.06, color: ink },
    );
  } else if (category === 'instrument') {
    details.push(
      { shape: 'rect', x: 0.2, y: 0.3, width: 0.6, height: 0.16, color: softAccent, alpha: 0.72 },
      { shape: 'rect', x: 0.2, y: 0.59, width: 0.6, height: 0.07, color: ink },
      { shape: 'rect', x: 0.2, y: 0.72, width: 0.6, height: 0.07, color: ink },
    );
  } else if (category === 'software') {
    details.push(
      { shape: 'rect', x: 0.2, y: 0.2, width: 0.6, height: 0.48, color: ink },
      { shape: 'rect', x: 0.26, y: 0.28, width: 0.48, height: 0.28, color: softAccent, alpha: 0.72 },
      { shape: 'circle', x: 0.5, y: 0.82, radius: 0.045, color: brass },
    );
  } else {
    // Interfaces, outboard and unknown legacy slots read as ordinary 1U rack gear.
    details.push(
      { shape: 'rect', x: 0.2, y: 0.29, width: 0.36, height: 0.18, color: ink },
      { shape: 'rect', x: 0.23, y: 0.33, width: 0.3, height: 0.1, color: softAccent, alpha: 0.7 },
      { shape: 'circle', x: 0.68, y: 0.49, radius: 0.11, color: 0xa99a86 },
      { shape: 'circle', x: 0.82, y: 0.49, radius: 0.065, color: led },
      { shape: 'rect', x: 0.2, y: 0.71, width: 0.62, height: 0.055, color: brass, alpha: 0.55 },
    );
  }

  return { chassis, panel, edge, details };
}

/** Shelf capacity grows with studio tier (matches WebGLCanvas shelfExtension). */
export function resolveShelfCapacity(tier: number): number {
  const shelfExtension = tier >= 5 ? 2.0 : tier >= 3 ? 1.0 : 0;
  return 6 + Math.round(shelfExtension * 4);
}

/**
 * Prefer mapped gear first (has authored art entries), then any remaining owned ids.
 * Cap to shelf capacity; stable order preserves purchase chronology within the cap.
 */
export function selectShelfEquipmentIds(ownedIds: string[], capacity: number): string[] {
  if (capacity <= 0 || ownedIds.length === 0) return [];
  const seen = new Set<string>();
  const preferred: string[] = [];
  const rest: string[] = [];
  for (const id of ownedIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (equipmentSpriteMap[id] || getEquipmentArt(id)) preferred.push(id);
    else rest.push(id);
  }
  return [...preferred, ...rest].slice(0, capacity);
}

/** Parse `#rrggbb` / `#rgb` CSS tints into a Pixi-friendly 0xRRGGBB int. */
export function parseCssHexTint(hex: string | undefined, fallback = 0xd9a441): number {
  if (!hex) return fallback;
  const raw = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return Number.parseInt(raw, 16);
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    const r = raw[0];
    const g = raw[1];
    const b = raw[2];
    return Number.parseInt(`${r}${r}${g}${g}${b}${b}`, 16);
  }
  return fallback;
}

export function resolveEquipmentTint(equipmentId: string, slotIndex: number, palette: number[]): number {
  const art = getEquipmentArt(equipmentId);
  if (art?.tint) return parseCssHexTint(art.tint, palette[slotIndex % palette.length]);
  return palette[slotIndex % palette.length];
}

export interface ShelfLayoutInput {
  ownedIds: string[];
  capacity: number;
  /** Back-left shelf corner in world pixels. */
  q1: { x: number; y: number };
  /** Back-right shelf corner in world pixels. */
  q2: { x: number; y: number };
  shelfH: number;
  palette: number[];
}

/**
 * Place owned gear along the top face of the shelf.
 * Uses equipmentSpriteMap / equipmentArt for paths + tints; geometry is iso-local.
 */
export function layoutShelfSlots(input: ShelfLayoutInput): ShelfSlotLayout[] {
  const { ownedIds, capacity, q1, q2, shelfH, palette } = input;
  const ids = selectShelfEquipmentIds(ownedIds, capacity);
  if (ids.length === 0) return [];

  const shelfSpanPx = Math.abs(q2.x - q1.x);
  const gearW = Math.max(6, Math.min(18, Math.floor(shelfSpanPx / Math.max(1, capacity)) - 1));

  return ids.map((equipmentId, i) => {
    const t = (i + 0.5) / capacity;
    const gx = q1.x + (q2.x - q1.x) * t;
    const gy = q1.y + (q2.y - q1.y) * t - shelfH;
    const itemH = 13 + (i % 3) * 3;
    const mapped = equipmentSpriteMap[equipmentId];
    const spritePath = getEquipmentSprite(equipmentId);
    const spriteFile = mapped?.sprite ?? spritePath.split('/').pop() ?? null;
    const tint = resolveEquipmentTint(equipmentId, i, palette);
    return {
      equipmentId,
      x: gx,
      y: gy,
      width: gearW,
      height: itemH,
      tint,
      spritePath,
      spriteFile,
      faceplate: resolveRackFaceplate(equipmentId, tint),
    };
  });
}

/** Stable structural key fragment for shelf contents (order-sensitive within cap). */
export function shelfStructuralKey(ownedIds: string[] | undefined, fallbackCount = 0): string {
  if (ownedIds && ownedIds.length > 0) return ownedIds.slice(0, 24).join(',');
  return `count:${fallbackCount}`;
}
