// Facility blueprint (#248 follow-up): turns the facility map cells into a drawn floor plan.
// Rooms keep their real footprints (tiles), sit either side of a shared corridor, and show their
// actual furniture from the room layout profiles, so the plan matches the rooms you walk into.
// Pure geometry only; FacilityMap renders it as SVG.
import type { StudioRoom } from '@/types/game';
import { getRoomLayoutProfile, propRect, type RoomPropKind } from '@/components/studio/roomLayouts';
import type { FacilityMapRoom } from '@/utils/facilityMap';

/** Pixels per tile on the plan. */
export const PLAN_TILE = 14;
/** Corridor depth in tiles. */
export const PLAN_CORRIDOR = 1.6;
/** Outer wall / gap between rooms, in tiles. */
export const PLAN_WALL = 0.35;
/** Door opening width in tiles. */
export const PLAN_DOOR = 1.2;

export type PlanFurnitureKind = RoomPropKind | 'booth' | 'shelf';

export interface PlanFurniture {
  kind: PlanFurnitureKind;
  /** Rect in plan pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlanRoom {
  id: string;
  name: string;
  status: FacilityMapRoom['status'];
  lockedReason?: string;
  clickable: boolean;
  /** Room interior in plan pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Footprint in tiles, for the label ("7 x 7"). */
  tilesW: number;
  tilesD: number;
  /** Door gap on the corridor wall: hinge point, width and which way the leaf swings (into the room). */
  door: { hingeX: number; y: number; width: number; swing: 1 | -1 };
  furniture: PlanFurniture[];
}

export interface FacilityPlan {
  width: number;
  height: number;
  corridor: { x: number; y: number; w: number; h: number };
  rooms: PlanRoom[];
}

/** Studio A is hand-built (no layout profile); these mirror its scene so the plan matches the room. */
const STUDIO_A_FURNITURE: { kind: PlanFurnitureKind; x0: number; y0: number; x1: number; y1: number }[] = [
  { kind: 'booth', x0: 1.0, y0: 0, x1: 3.5, y1: 1.0 },
  { kind: 'console', x0: 3.5, y0: 3.4, x1: 5.8, y1: 4.7 },
  { kind: 'shelf', x0: 0.5, y0: 5.0, x1: 2.0, y1: 6.0 },
  { kind: 'rack', x0: 6.2, y0: 2.6, x1: 6.9, y1: 3.4 },
  { kind: 'sofa', x0: 0.4, y0: 2.6, x1: 1.4, y1: 4.4 },
  { kind: 'rug', x0: 2.6, y0: 2.8, x1: 6.0, y1: 5.6 },
  { kind: 'plant', x0: 6.2, y0: 5.6, x1: 6.8, y1: 6.2 },
];
const STUDIO_A_FOOTPRINT = { width: 7, depth: 7 };

const footprintOf = (room: StudioRoom) => getRoomLayoutProfile(room.type)?.footprint ?? STUDIO_A_FOOTPRINT;

/**
 * Lay the rooms out as a building: grid row 0 above the corridor (doors on their bottom wall),
 * row 1 below it (doors on their top wall). Columns follow the facility map cells.
 */
export const buildFacilityPlan = (cells: FacilityMapRoom[], rooms: StudioRoom[]): FacilityPlan => {
  const T = PLAN_TILE;
  const wall = PLAN_WALL * T;
  const byId = new Map(rooms.map((r) => [r.id, r]));
  const fp = (cell: FacilityMapRoom) => {
    const room = byId.get(cell.id);
    return room ? footprintOf(room) : STUDIO_A_FOOTPRINT;
  };
  const rowsUsed = Math.max(1, ...cells.map((c) => c.row + 1));
  // Column widths and row depths take the largest room in each.
  const colW = [0, 1].map((col) => Math.max(0, ...cells.filter((c) => c.col === col).map((c) => fp(c).width)) * T);
  const rowD = Array.from({ length: rowsUsed }, (_, row) => Math.max(0, ...cells.filter((c) => c.row === row).map((c) => fp(c).depth)) * T);
  const corridorH = PLAN_CORRIDOR * T;
  const width = wall + colW[0] + wall + (colW[1] > 0 ? colW[1] + wall : 0);
  // Pairs of rows share one corridor between them.
  const rowTop: number[] = [];
  let y = wall;
  for (let row = 0; row < rowsUsed; row++) {
    rowTop.push(y);
    y += rowD[row];
    y += row % 2 === 0 ? corridorH : wall;
  }
  const height = y;
  const corridor = { x: wall, y: wall + rowD[0], w: width - wall * 2, h: corridorH };

  const planRooms = cells.map((cell): PlanRoom => {
    const f = fp(cell);
    const w = f.width * T;
    const h = f.depth * T;
    const colX = cell.col === 0 ? wall : wall + colW[0] + wall;
    // Row 0 hugs the corridor from above, row 1 from below.
    const above = cell.row % 2 === 0;
    const x = cell.col === 0 ? colX + (colW[0] - w) : colX;
    const yTop = above ? rowTop[cell.row] + (rowD[cell.row] - h) : rowTop[cell.row];
    const doorW = PLAN_DOOR * T;
    // Doors sit near the building's centre line so the corridor reads as one shared hallway.
    const hingeX = cell.col === 0 ? x + w - T * 0.6 - doorW : x + T * 0.6;
    const door = { hingeX, y: above ? yTop + h : yTop, width: doorW, swing: (above ? -1 : 1) as 1 | -1 };

    const room = byId.get(cell.id);
    const profile = room ? getRoomLayoutProfile(room.type) : null;
    const rects = profile
      ? profile.props.map((p) => ({ kind: p.kind as PlanFurnitureKind, ...propRect(p) }))
      : STUDIO_A_FURNITURE;
    // Rooms above the corridor are drawn with their back wall at the top; rooms below are mirrored
    // vertically so their back wall faces away from the corridor too.
    const furniture = rects.map((r) => {
      const ry0 = above ? r.y0 : f.depth - r.y1;
      return {
        kind: r.kind,
        x: x + Math.max(0, r.x0) * T,
        y: yTop + Math.max(0, ry0) * T,
        w: (Math.min(f.width, r.x1) - Math.max(0, r.x0)) * T,
        h: (Math.min(f.depth, r.y1) - Math.max(0, r.y0)) * T,
      };
    });
    return {
      id: cell.id,
      name: cell.name,
      status: cell.status,
      lockedReason: cell.lockedReason,
      clickable: cell.clickable,
      x,
      y: yTop,
      w,
      h,
      tilesW: f.width,
      tilesD: f.depth,
      door,
      furniture,
    };
  });
  return { width, height, corridor, rooms: planRooms };
};

/** SVG path for a door leaf standing open 90 degrees plus its swing arc (blueprint convention). */
export const doorSwingPath = (door: PlanRoom['door']): { leaf: string; arc: string } => {
  const { hingeX, y, width, swing } = door;
  const tipY = y + swing * width;
  return {
    leaf: `M ${hingeX} ${y} L ${hingeX} ${tipY}`,
    arc: `M ${hingeX} ${tipY} A ${width} ${width} 0 0 ${swing > 0 ? 0 : 1} ${hingeX + width} ${y}`,
  };
};

/** Rects must stay inside their room; the checks use this. */
export const furnitureInside = (room: PlanRoom): boolean =>
  room.furniture.every((f) => f.x >= room.x - 0.01 && f.y >= room.y - 0.01 && f.x + f.w <= room.x + room.w + 0.01 && f.y + f.h <= room.y + room.h + 0.01);
