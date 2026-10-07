/**
 * World attention director (#194): points at the interesting thing inside the studio
 * without taking control away from the player.
 *
 * Presentation only. Cues are ephemeral (never saved, never read back as gameplay truth),
 * and every helper here is pure so the Pixi ticker can drive it from refs and tests can
 * pin the guardrails: priority + coalescing, manual-input grace, cancel-on-interaction,
 * and a full non-camera equivalent under Reduced Motion.
 */
import type { IdleDirectionHotspot } from './idleFloorDirection';

export type AttentionTarget = IdleDirectionHotspot;
export type AttentionReason = 'enquiry' | 'arrival' | 'issue' | 'take' | 'wrap';
export type AttentionPriority = 'low' | 'normal' | 'high';

export interface AttentionCue {
  id: string;
  target: AttentionTarget;
  reason: AttentionReason;
  priority: AttentionPriority;
  startedAt: number;
  durationMs: number;
  /** 0..1 Lock Take emphasis; 0 for every other cue. */
  punch: number;
}

export interface AttentionDirectorState {
  active: AttentionCue | null;
  /** performance.now() of the last pan / zoom / tap on the floor. */
  lastManualInputAt: number;
  /** Cue whose camera framing the player already overrode; it keeps only its static highlight. */
  cameraYieldedId: string | null;
  seq: number;
}

/** Manual camera input suppresses automatic framing for this long. */
export const ATTENTION_MANUAL_GRACE_MS = 2_500;
/** Lock Take scene punch length. */
export const TAKE_PUNCH_MS = 360;
/** Peak extra scale of the Lock Take punch at full (Gold) intensity. */
export const TAKE_PUNCH_SCALE = 0.022;
/** Bounded framing: never zoom further than this for a cue. */
export const ATTENTION_CAMERA_ZOOM = 1.12;
/** Fraction of the soft target the camera is allowed to travel (keeps the move a bias, not a lock). */
export const ATTENTION_CAMERA_BLEND = 0.45;

const RANK: Record<AttentionPriority, number> = { low: 0, normal: 1, high: 2 };

export const CUE_SPECS: Readonly<Record<AttentionReason, { priority: AttentionPriority; durationMs: number }>> = {
  enquiry: { priority: 'normal', durationMs: 6_000 },
  arrival: { priority: 'normal', durationMs: 4_500 },
  issue: { priority: 'high', durationMs: 9_000 },
  take: { priority: 'normal', durationMs: 1_400 },
  wrap: { priority: 'low', durationMs: 4_000 },
};

export const createAttentionDirector = (): AttentionDirectorState => ({
  active: null,
  lastManualInputAt: Number.NEGATIVE_INFINITY,
  cameraYieldedId: null,
  seq: 0,
});

export const cueExpired = (cue: AttentionCue, now: number): boolean => now - cue.startedAt >= cue.durationMs;

export interface CueRequest {
  target: AttentionTarget;
  reason: AttentionReason;
  /** 0..1, only meaningful for `take`. */
  punch?: number;
}

/**
 * Offer a cue. One cue owns attention at a time:
 * - same target + reason coalesces (refreshes the timer, keeps the id, keeps the strongest punch);
 * - a lower-priority cue never preempts a live higher one;
 * - equal or higher priority replaces it.
 */
export function pushCue(state: AttentionDirectorState, request: CueRequest, now: number): AttentionDirectorState {
  const spec = CUE_SPECS[request.reason];
  const punch = request.reason === 'take' ? Math.max(0, Math.min(1, request.punch ?? 0.5)) : 0;
  const live = state.active && !cueExpired(state.active, now) ? state.active : null;

  if (live && live.target === request.target && live.reason === request.reason) {
    return { ...state, active: { ...live, startedAt: now, punch: Math.max(live.punch, punch) } };
  }
  if (live && RANK[spec.priority] < RANK[live.priority]) return state;

  const seq = state.seq + 1;
  return {
    ...state,
    seq,
    active: {
      id: `${request.reason}-${seq}`,
      target: request.target,
      reason: request.reason,
      priority: spec.priority,
      startedAt: now,
      durationMs: spec.durationMs,
      punch,
    },
  };
}

/** Drop the active cue once its time is up. Returns the same object when nothing changed. */
export function expireCue(state: AttentionDirectorState, now: number): AttentionDirectorState {
  if (!state.active || !cueExpired(state.active, now)) return state;
  return { ...state, active: null, cameraYieldedId: null };
}

/** Pan / zoom / tap: the player owns the camera for the grace period; a live cue yields its framing. */
export function noteManualInput(state: AttentionDirectorState, now: number): AttentionDirectorState {
  return { ...state, lastManualInputAt: now, cameraYieldedId: state.active?.id ?? state.cameraYieldedId };
}

/** Interacting with the cue's own object cancels it at once, mid-animation. */
export function noteTargetInteraction(state: AttentionDirectorState, target: string): AttentionDirectorState {
  if (!state.active || state.active.target !== target) return state;
  return { ...state, active: null, cameraYieldedId: null };
}

/** Lock Take punch: a single damped swell, back to exactly 1 by the end. */
export function takePunchScale(elapsedMs: number, strength: number): number {
  if (elapsedMs <= 0 || elapsedMs >= TAKE_PUNCH_MS || strength <= 0) return 1;
  const k = elapsedMs / TAKE_PUNCH_MS;
  return 1 + TAKE_PUNCH_SCALE * Math.min(1, strength) * Math.sin(Math.PI * k) * (1 - k * 0.6);
}

export interface AttentionFrameInput {
  now: number;
  reduceMotion: boolean;
  /** False while a drawer / inspector owns attention. */
  floorFocused: boolean;
  /** Whether the cue's target sits well away from the screen centre (normal cues only frame then). */
  targetOffCentre: boolean;
}

export interface AttentionFrame {
  target: AttentionTarget | null;
  reason: AttentionReason | null;
  /** 0..1 strength for the static ring on the cause. */
  highlight: number;
  /** 0..1 ripple phase, or null when the ripple is off (Reduced Motion or no cue). */
  ripple: number | null;
  /** Target the camera may gently frame this frame, or null. */
  cameraTarget: AttentionTarget | null;
  /** Multiplier for the scene scale (Lock Take punch); exactly 1 when idle. */
  punchScale: number;
}

const EMPTY_FRAME: AttentionFrame = { target: null, reason: null, highlight: 0, ripple: null, cameraTarget: null, punchScale: 1 };

/** Everything the renderer needs this frame, derived from the director state. */
export function attentionFrame(state: AttentionDirectorState, input: AttentionFrameInput): AttentionFrame {
  const cue = state.active;
  if (!cue || cueExpired(cue, input.now)) return EMPTY_FRAME;
  const elapsed = input.now - cue.startedAt;
  const remaining = cue.durationMs - elapsed;

  // Fade in quickly, fade out over the last 600ms; reduced motion holds a steady ring.
  const fadeIn = Math.min(1, elapsed / 180);
  const fadeOut = Math.min(1, remaining / 600);
  const base = cue.priority === 'high' ? 1 : cue.priority === 'normal' ? 0.85 : 0.6;
  const highlight = (input.reduceMotion ? base * 0.9 : base) * Math.min(fadeIn, fadeOut);

  const ripplePeriod = cue.priority === 'high' ? 900 : 1_300;
  const ripple = input.reduceMotion ? null : (elapsed % ripplePeriod) / ripplePeriod;

  const idleEnough = input.now - state.lastManualInputAt >= ATTENTION_MANUAL_GRACE_MS;
  const cameraAllowed =
    !input.reduceMotion &&
    input.floorFocused &&
    cue.priority !== 'low' &&
    cue.reason !== 'take' &&
    state.cameraYieldedId !== cue.id &&
    idleEnough &&
    (cue.priority === 'high' || input.targetOffCentre);

  const punchScale = input.reduceMotion || cue.punch <= 0 ? 1 : takePunchScale(elapsed, cue.punch);

  return {
    target: cue.target,
    reason: cue.reason,
    highlight,
    ripple,
    cameraTarget: cameraAllowed ? cue.target : null,
    punchScale,
  };
}

/** A focus point counts as off-centre once it is beyond a quarter of the short screen side. */
export function isOffCentre(point: { x: number; y: number }, screen: { width: number; height: number }): boolean {
  const dx = point.x - screen.width / 2;
  const dy = point.y - screen.height / 2;
  return Math.hypot(dx, dy) > Math.min(screen.width, screen.height) * 0.25;
}

/** Scene-state edges that start cues. Pure so tests can feed before/after snapshots. */
export interface AttentionEdgeInput {
  enquiryWaiting: boolean;
  hasActiveProject: boolean;
  /** Where the active session's issue lives, if one is open. */
  issueTarget: AttentionTarget | null;
}

export function cuesForTransition(prev: AttentionEdgeInput, next: AttentionEdgeInput): CueRequest[] {
  const out: CueRequest[] = [];
  if (next.issueTarget && next.issueTarget !== prev.issueTarget) out.push({ target: next.issueTarget, reason: 'issue' });
  if (!prev.hasActiveProject && next.hasActiveProject) out.push({ target: 'liveRoom', reason: 'arrival' });
  if (prev.hasActiveProject && !next.hasActiveProject) out.push({ target: 'door', reason: 'wrap' });
  if (!prev.enquiryWaiting && next.enquiryWaiting && !next.hasActiveProject) out.push({ target: 'phone', reason: 'enquiry' });
  return out;
}
