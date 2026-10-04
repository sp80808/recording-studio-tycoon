/** Pure isometric geometry for the studio gear locker front. */

import {
  resolveEquipmentTint,
  resolveRackFaceplate,
  selectShelfEquipmentIds,
  type RackFaceplate,
} from './equipmentShelfSprites';

export interface LockerPoint {
  x: number;
  y: number;
}

export interface LockerQuad {
  topLeft: LockerPoint;
  topRight: LockerPoint;
  bottomRight: LockerPoint;
  bottomLeft: LockerPoint;
}

export interface GearLockerSlot {
  equipmentId: string;
  quad: LockerQuad;
  faceplate: RackFaceplate;
  tint: number;
  /** Sprite anchor at the centre-bottom of this rack bay. */
  spriteAnchor: LockerPoint;
  spriteMaxWidth: number;
  spriteMaxHeight: number;
}

export interface GearLockerGeometry {
  outer: LockerQuad;
  opening: LockerQuad;
  shadow: LockerPoint[];
  feet: Array<{ top: LockerPoint; bottom: LockerPoint }>;
  rails: Array<{ from: LockerPoint; to: LockerPoint }>;
  shelves: Array<{ from: LockerPoint; to: LockerPoint }>;
  slots: GearLockerSlot[];
  columns: number;
  rows: number;
}

export interface GearLockerInput {
  ownedIds: string[];
  capacity: number;
  /** Bottom-left and bottom-right corners of the visible cabinet face. */
  q4: LockerPoint;
  q3: LockerPoint;
  shelfH: number;
  palette: number[];
}

/** Project normalised front-face coordinates onto the cabinet's isometric plane. */
export function projectLockerPoint(
  q4: LockerPoint,
  q3: LockerPoint,
  shelfH: number,
  u: number,
  v: number,
): LockerPoint {
  return {
    x: q4.x + (q3.x - q4.x) * u,
    y: q4.y - shelfH + (q3.y - q4.y) * u + shelfH * v,
  };
}

export function projectLockerQuad(
  q4: LockerPoint,
  q3: LockerPoint,
  shelfH: number,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
): LockerQuad {
  return {
    topLeft: projectLockerPoint(q4, q3, shelfH, u0, v0),
    topRight: projectLockerPoint(q4, q3, shelfH, u1, v0),
    bottomRight: projectLockerPoint(q4, q3, shelfH, u1, v1),
    bottomLeft: projectLockerPoint(q4, q3, shelfH, u0, v1),
  };
}

/** Bilinear point within an already-projected locker quad (for knobs/meters). */
export function projectPointInLockerQuad(quad: LockerQuad, u: number, v: number): LockerPoint {
  const top = {
    x: quad.topLeft.x + (quad.topRight.x - quad.topLeft.x) * u,
    y: quad.topLeft.y + (quad.topRight.y - quad.topLeft.y) * u,
  };
  const bottom = {
    x: quad.bottomLeft.x + (quad.bottomRight.x - quad.bottomLeft.x) * u,
    y: quad.bottomLeft.y + (quad.bottomRight.y - quad.bottomLeft.y) * u,
  };
  return {
    x: top.x + (bottom.x - top.x) * v,
    y: top.y + (bottom.y - top.y) * v,
  };
}

function lineAt(
  q4: LockerPoint,
  q3: LockerPoint,
  shelfH: number,
  u0: number,
  v0: number,
  u1: number,
  v1: number,
) {
  return {
    from: projectLockerPoint(q4, q3, shelfH, u0, v0),
    to: projectLockerPoint(q4, q3, shelfH, u1, v1),
  };
}

/**
 * Lay owned gear into horizontal rack bays across the visible front face.
 * Early lockers use one broad bay; expanded lockers split into two realistic rails.
 */
export function layoutGearLocker(input: GearLockerInput): GearLockerGeometry {
  const { ownedIds, capacity, q4, q3, shelfH, palette } = input;
  const ids = selectShelfEquipmentIds(ownedIds, capacity);
  const columns = capacity > 8 ? 2 : 1;
  const rows = Math.max(3, Math.ceil(capacity / columns));
  const outer = projectLockerQuad(q4, q3, shelfH, 0, 0, 1, 1);
  const opening = projectLockerQuad(q4, q3, shelfH, 0.07, 0.08, 0.93, 0.88);
  const bayGapU = columns === 2 ? 0.025 : 0;
  const usableU = 0.82 - bayGapU * (columns - 1);
  const bayW = usableU / columns;
  const usableV = 0.74;
  const rowH = usableV / rows;
  const slots = ids.map((equipmentId, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const u0 = 0.09 + column * (bayW + bayGapU);
    const u1 = u0 + bayW;
    const v0 = 0.11 + row * rowH;
    const v1 = v0 + rowH * 0.78;
    const tint = resolveEquipmentTint(equipmentId, index, palette);
    const quad = projectLockerQuad(q4, q3, shelfH, u0, v0, u1, v1);
    const leftWidth = Math.hypot(quad.topRight.x - quad.topLeft.x, quad.topRight.y - quad.topLeft.y);
    return {
      equipmentId,
      quad,
      tint,
      faceplate: resolveRackFaceplate(equipmentId, tint),
      spriteAnchor: projectLockerPoint(q4, q3, shelfH, (u0 + u1) / 2, v1),
      spriteMaxWidth: leftWidth * 0.86,
      spriteMaxHeight: shelfH * (v1 - v0) * 0.9,
    };
  });

  const shelves = Array.from({ length: rows + 1 }, (_, row) => {
    const v = 0.095 + row * rowH;
    return lineAt(q4, q3, shelfH, 0.075, v, 0.925, v);
  });
  const rails = [
    lineAt(q4, q3, shelfH, 0.075, 0.09, 0.075, 0.87),
    lineAt(q4, q3, shelfH, 0.925, 0.09, 0.925, 0.87),
  ];
  if (columns === 2) rails.push(lineAt(q4, q3, shelfH, 0.5, 0.09, 0.5, 0.87));

  const leftFootTop = projectLockerPoint(q4, q3, shelfH, 0.14, 0.9);
  const rightFootTop = projectLockerPoint(q4, q3, shelfH, 0.86, 0.9);
  return {
    outer,
    opening,
    slots,
    columns,
    rows,
    shelves,
    rails,
    feet: [
      { top: leftFootTop, bottom: { x: leftFootTop.x, y: leftFootTop.y + 5 } },
      { top: rightFootTop, bottom: { x: rightFootTop.x, y: rightFootTop.y + 5 } },
    ],
    shadow: [
      { x: q4.x - 4, y: q4.y + 4 },
      { x: q3.x + 8, y: q3.y + 4 },
      { x: q3.x + 13, y: q3.y + 9 },
      { x: q4.x + 1, y: q4.y + 10 },
    ],
  };
}

/** Flatten a projected quad for Pixi Graphics.poly(). */
export function lockerQuadPoints(quad: LockerQuad): number[] {
  return [
    quad.topLeft.x,
    quad.topLeft.y,
    quad.topRight.x,
    quad.topRight.y,
    quad.bottomRight.x,
    quad.bottomRight.y,
    quad.bottomLeft.x,
    quad.bottomLeft.y,
  ];
}
