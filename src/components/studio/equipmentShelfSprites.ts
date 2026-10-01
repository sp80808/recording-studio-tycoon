/**
 * Equipment shelf layout for the living studio.
 * Driven by owned gear IDs + equipmentArt / equipmentSpriteMap.
 * Missing PNG art falls back to tinted procedural bars (never blank slots).
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
    return {
      equipmentId,
      x: gx,
      y: gy,
      width: gearW,
      height: itemH,
      tint: resolveEquipmentTint(equipmentId, i, palette),
      spritePath,
      spriteFile,
    };
  });
}

/** Stable structural key fragment for shelf contents (order-sensitive within cap). */
export function shelfStructuralKey(ownedIds: string[] | undefined, fallbackCount = 0): string {
  if (ownedIds && ownedIds.length > 0) return ownedIds.slice(0, 24).join(',');
  return `count:${fallbackCount}`;
}
