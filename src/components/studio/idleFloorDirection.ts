/**
 * Idle floor direction — pick a subtle next hotspot and ease the camera toward it.
 * Pure helpers so WebGLCanvas can drive chrome without a parallel idle stack.
 */

export const IDLE_HINT_DELAY_MS = 8_000;
export const DOOR_HINT_DELAY_MS = 12_000;

/** Gentle zoom when the floor nudges attention toward a hotspot. */
export const IDLE_CAMERA_ZOOM = 1.16;
/** Per-frame lerp toward idle focus / restore (≈2.5s feel at 60fps). */
export const IDLE_CAMERA_LERP = 0.045;
/** Faster settle when the player cancels idle direction. */
export const IDLE_CAMERA_RESTORE_LERP = 0.12;

export type IdleDirectionHotspot = 'phone' | 'console' | 'liveRoom' | 'shelf' | 'door';
export type PendingChoreHotspot = 'console' | 'liveRoom' | 'shelf';

export interface IdleDirectionInput {
  idleMs: number;
  /** False while a ContextDrawer / inspector owns attention. */
  floorFocused: boolean;
  enquiryWaiting: boolean;
  hasActiveProject: boolean;
  pendingChoreHotspot: PendingChoreHotspot | null;
}

export interface CameraPose {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Priority:
 * 1. pending enquiries → phone
 * 2. active session → console
 * 3. pending chores → chore hotspot
 * 4. else door (soft explore) after the longer door delay
 */
export function pickIdleDirectionTarget(input: IdleDirectionInput): IdleDirectionHotspot | null {
  if (!input.floorFocused) return null;
  if (input.idleMs < IDLE_HINT_DELAY_MS) return null;

  if (input.enquiryWaiting && !input.hasActiveProject) return 'phone';
  if (input.hasActiveProject) return 'console';
  if (input.pendingChoreHotspot) return input.pendingChoreHotspot;
  if (input.idleMs >= DOOR_HINT_DELAY_MS) return 'door';
  return null;
}

/** @deprecated Prefer pickIdleDirectionTarget — kept for callers that only know session state. */
export function getIdleHintTarget(
  hasActiveProject: boolean,
  idleMs: number,
): 'phone' | 'console' | null {
  const target = pickIdleDirectionTarget({
    idleMs,
    floorFocused: true,
    enquiryWaiting: !hasActiveProject,
    hasActiveProject,
    pendingChoreHotspot: null,
  });
  if (target === 'phone' || target === 'console') return target;
  return null;
}

export function shouldShowDoorHint(idleMs: number): boolean {
  return idleMs >= DOOR_HINT_DELAY_MS;
}

export function clampCameraPose(
  pose: CameraPose,
  screen: { width: number; height: number },
  minZoom: number,
  maxZoom: number,
): CameraPose {
  const zoom = Math.max(minZoom, Math.min(maxZoom, pose.zoom));
  const limitX = Math.max(screen.width * 0.35, screen.width * zoom * 0.5);
  const limitY = Math.max(screen.height * 0.35, screen.height * zoom * 0.5);
  return {
    zoom,
    x: Math.max(-limitX, Math.min(limitX, pose.x)),
    y: Math.max(-limitY, Math.min(limitY, pose.y)),
  };
}

/**
 * Camera offset that places a local-space focus point near the screen centre
 * at the given zoom (relative to the scene's base fit).
 */
export function cameraPoseForFocus(params: {
  focusLocal: { x: number; y: number };
  basePosition: { x: number; y: number };
  baseScale: number;
  screen: { width: number; height: number };
  targetZoom: number;
  minZoom: number;
  maxZoom: number;
}): CameraPose {
  const zoom = Math.max(params.minZoom, Math.min(params.maxZoom, params.targetZoom));
  const scale = params.baseScale * zoom;
  const rootX = params.screen.width * 0.5 - params.focusLocal.x * scale;
  const rootY = params.screen.height * 0.52 - params.focusLocal.y * scale;
  return clampCameraPose(
    {
      x: rootX - params.basePosition.x,
      y: rootY - params.basePosition.y,
      zoom,
    },
    params.screen,
    params.minZoom,
    params.maxZoom,
  );
}

export function lerpCameraPose(from: CameraPose, to: CameraPose, t: number): CameraPose {
  const k = Math.max(0, Math.min(1, t));
  return {
    x: from.x + (to.x - from.x) * k,
    y: from.y + (to.y - from.y) * k,
    zoom: from.zoom + (to.zoom - from.zoom) * k,
  };
}

export function cameraPoseNear(a: CameraPose, b: CameraPose, epsilon = 0.35): boolean {
  return (
    Math.abs(a.x - b.x) < epsilon &&
    Math.abs(a.y - b.y) < epsilon &&
    Math.abs(a.zoom - b.zoom) < 0.008
  );
}
