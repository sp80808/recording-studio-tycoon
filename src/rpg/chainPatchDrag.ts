/** Pure hit-test and magnetic-snap maths for dragging a gear chip onto a ChainComposer jack. */

export interface Point { x: number; y: number }
export interface Rect { left: number; top: number; width: number; height: number }
export interface JackTarget<T extends string = string> { id: T; rect: Rect; accepts: boolean }

/** Pixels the pointer must travel before a press becomes a drag (below it, the tap still seats). */
export const DRAG_START_PX = 8;
/** Extra reach beyond a jack's edge within which it pulls the dragged chip in. */
export const SNAP_RADIUS_PX = 40;

export const rectCenter = (r: Rect): Point => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

export const exceedsDragThreshold = (start: Point, now: Point, threshold = DRAG_START_PX): boolean =>
  Math.hypot(now.x - start.x, now.y - start.y) > threshold;

/** Distance from a point to the nearest edge of a rect (0 when inside). */
export const distanceToRect = (p: Point, r: Rect): number => {
  const dx = Math.max(r.left - p.x, 0, p.x - (r.left + r.width));
  const dy = Math.max(r.top - p.y, 0, p.y - (r.top + r.height));
  return Math.hypot(dx, dy);
};

/**
 * Picks the accepting jack closest to the pointer within the snap radius.
 * Ties fall to the jack whose centre is nearer, so overlapping reach zones stay stable.
 */
export const findSnapTarget = <T extends string>(
  p: Point,
  targets: ReadonlyArray<JackTarget<T>>,
  radius = SNAP_RADIUS_PX,
): T | null => {
  let best: { id: T; edge: number; centre: number } | null = null;
  for (const t of targets) {
    if (!t.accepts) continue;
    const edge = distanceToRect(p, t.rect);
    if (edge > radius) continue;
    const c = rectCenter(t.rect);
    const centre = Math.hypot(p.x - c.x, p.y - c.y);
    if (!best || edge < best.edge || (edge === best.edge && centre < best.centre)) best = { id: t.id, edge, centre };
  }
  return best ? best.id : null;
};

/** Where the dragged ghost is drawn: pulled onto the jack centre once snapped, else under the pointer. */
export const magneticPosition = (p: Point, snapped: Rect | null, reducedMotion = false): Point => {
  if (!snapped || reducedMotion) return p;
  const c = rectCenter(snapped);
  return { x: c.x, y: c.y };
};
