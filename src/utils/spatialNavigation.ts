export type SpatialDirection = 'up' | 'down' | 'left' | 'right';

export interface SpatialPoint {
  x: number;
  y: number;
}

export interface SpatialBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Returns the geometric center point of a bounding box.
 */
export function getBoxCenter(box: { left: number; top: number; right: number; bottom: number }): SpatialPoint {
  return {
    x: box.left + (box.right - box.left) / 2,
    y: box.top + (box.bottom - box.top) / 2,
  };
}

/**
 * Evaluates whether a target point lies within the directional half-plane and 50° cone
 * from origin, returning a weighted Euclidean distance score (lower is better), or null if rejected.
 */
export function computeSpatialScore(
  origin: SpatialPoint,
  target: SpatialPoint,
  direction: SpatialDirection,
  maxConeAngleDeg = 50
): number | null {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;

  let primary = 0;
  let secondary = 0;

  switch (direction) {
    case 'right':
      primary = dx;
      secondary = Math.abs(dy);
      break;
    case 'left':
      primary = -dx;
      secondary = Math.abs(dy);
      break;
    case 'down':
      primary = dy;
      secondary = Math.abs(dx);
      break;
    case 'up':
      primary = -dy;
      secondary = Math.abs(dx);
      break;
  }

  // Must strictly advance in the primary direction
  if (primary <= 0) {
    return null;
  }

  // Angular deviation from heading
  const angleRad = Math.atan2(secondary, primary);
  const maxAngleRad = (maxConeAngleDeg * Math.PI) / 180;
  if (angleRad > maxAngleRad) {
    return null;
  }

  const distance = Math.hypot(primary, secondary);
  // Alignment penalty: elements directly aligned are prioritized over off-axis ones
  const sinAngle = Math.sin(angleRad);
  const penalty = distance * (1 + 1.8 * sinAngle * sinAngle);

  return penalty;
}

const FOCUSABLE_SELECTOR =
  '[role="slider"], button:not([disabled]):not([aria-hidden="true"]), [role="button"]:not([aria-disabled="true"]):not([aria-hidden="true"]), [role="tab"]:not([aria-disabled="true"]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([aria-hidden="true"])';

/**
 * Finds the nearest interactable DOM element in the specified 2D spatial direction from activeEl.
 */
export function findNextSpatialFocus(
  activeEl: HTMLElement,
  direction: SpatialDirection,
  container: HTMLElement = document.body
): HTMLElement | null {
  if (!activeEl || !container) return null;

  const originRect = activeEl.getBoundingClientRect();
  const originCenter = getBoxCenter(originRect);

  const rawCandidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

  let bestEl: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of rawCandidates) {
    if (candidate === activeEl) continue;

    const rect = candidate.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    // Check visibility if in browser environment
    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
      const style = window.getComputedStyle(candidate);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
    }

    const candidateCenter = getBoxCenter(rect);
    const score = computeSpatialScore(originCenter, candidateCenter, direction);

    if (score !== null && score < bestScore) {
      bestScore = score;
      bestEl = candidate;
    }
  }

  return bestEl;
}
