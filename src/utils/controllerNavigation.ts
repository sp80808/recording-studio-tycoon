export type ControllerNavDirection = 'up' | 'down' | 'left' | 'right';

export interface ControllerNavPoint {
  x: number;
  y: number;
}

/**
 * Converts an analog stick vector into a single navigation direction.
 * Requiring a dominant axis prevents diagonal jitter from bouncing focus
 * between two targets.
 */
export function getStickDirection(
  x: number,
  y: number,
  threshold = 0.55,
  dominance = 1.15,
): ControllerNavDirection | null {
  const absX = Math.abs(x);
  const absY = Math.abs(y);
  if (Math.max(absX, absY) < threshold) return null;

  if (absX > absY * dominance) return x > 0 ? 'right' : 'left';
  if (absY > absX * dominance) return y > 0 ? 'down' : 'up';

  // On a true diagonal, favour the stronger axis but keep the decision stable.
  return absX >= absY ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
}

/**
 * Picks the nearest sensible target in the requested screen-space direction.
 * This makes floor navigation follow the room layout instead of cycling a
 * hidden linear list. Falls back to list order when anchors are unavailable.
 */
export function getDirectionalTargetIndex<T extends string>(
  ids: readonly T[],
  anchors: Partial<Record<T, ControllerNavPoint>>,
  currentIndex: number,
  direction: ControllerNavDirection,
): number {
  if (ids.length === 0) return 0;

  const safeIndex = ((currentIndex % ids.length) + ids.length) % ids.length;
  const current = anchors[ids[safeIndex]];
  const fallbackDelta = direction === 'right' || direction === 'down' ? 1 : -1;
  const fallback = (safeIndex + fallbackDelta + ids.length) % ids.length;
  if (!current) return fallback;

  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;

  ids.forEach((id, index) => {
    if (index === safeIndex) return;
    const point = anchors[id];
    if (!point) return;

    const dx = point.x - current.x;
    const dy = point.y - current.y;
    const primary =
      direction === 'right' ? dx :
      direction === 'left' ? -dx :
      direction === 'down' ? dy :
      -dy;

    // Reject targets that are not actually in the requested half-plane.
    if (primary <= 1) return;

    const cross = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    // Lateral travel is deliberately expensive so the chosen target feels
    // visually aligned with the player's input.
    const score = primary + cross * 1.6;
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex >= 0 ? bestIndex : fallback;
}
