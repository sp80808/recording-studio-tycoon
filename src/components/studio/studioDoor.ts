/**
 * Studio A door swing (#194 follow-up): the leaf turns on its back hinge into the room
 * while a client walks through, revealing a lit hallway behind it. Pure geometry in tile
 * space so the renderer only projects points; no gameplay state.
 */

/** Left-wall door span in tiles (x = 0 plane). The hinge sits at the back jamb. */
export const DOOR_HINGE_Y = 3.15;
export const DOOR_FREE_Y = 4.35;
export const DOOR_WIDTH = DOOR_FREE_Y - DOOR_HINGE_Y;
/** Fully open swing, in degrees: wide enough to walk through, short of hitting the wall. */
export const DOOR_MAX_SWING_DEG = 78;

export interface TilePoint { x: number; y: number }

/**
 * Swing angle for an open amount (0..1) with a little overshoot-and-settle as it
 * reaches full open, like a door pushed and caught. Monotonic enough to never flap.
 */
export function doorSwingDeg(amount: number): number {
  const a = Math.max(0, Math.min(1, amount));
  const settle = a > 0.82 ? Math.sin(((a - 0.82) / 0.18) * Math.PI) * 4 : 0;
  return a * DOOR_MAX_SWING_DEG + settle;
}

/** Floor point of the leaf's free edge for a swing angle (0 = shut in the wall plane). */
export function doorFreeEdge(deg: number): TilePoint {
  const r = (deg * Math.PI) / 180;
  return { x: Math.sin(r) * DOOR_WIDTH, y: DOOR_HINGE_Y + Math.cos(r) * DOOR_WIDTH };
}

/**
 * Leaf shade: the face turns toward the light as it opens, so it brightens slightly,
 * then the edge strip reads as the door's thickness.
 */
export function doorLeafShade(deg: number): number {
  return 0.78 + 0.22 * Math.sin((Math.max(0, Math.min(90, deg)) * Math.PI) / 180);
}

/**
 * Floor light pool through the gap between the leaf's free edge and the front jamb,
 * fanning into the room. Empty when the door is shut.
 */
export function doorLightPool(deg: number): TilePoint[] {
  if (deg <= 0.5) return [];
  const edge = doorFreeEdge(deg);
  const reach = 1.1 + 1.0 * Math.min(1, deg / DOOR_MAX_SWING_DEG);
  return [
    { x: 0.02, y: Math.max(DOOR_HINGE_Y + 0.05, edge.y) },
    { x: 0.02, y: DOOR_FREE_Y - 0.03 },
    { x: reach, y: DOOR_FREE_Y + reach * 0.42 },
    { x: Math.max(edge.x, reach * 0.9), y: edge.y + reach * 0.15 },
  ];
}
