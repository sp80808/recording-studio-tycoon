import { staffActivityCue, staffDestination, stepStaffPosition } from '@/components/studio/staffStaging';
import type { NpcVisualIdentity } from '@/features/sprites/npcAppearance';
import type { ModularNpcDefinition } from '@/features/sprites/spriteTypes';
import { lastTake, nodOffset } from '@/utils/takeFeedback';
import React, { useEffect, useRef } from 'react';
import { AnimatedSprite, Application, Container, Graphics, Matrix, Rectangle, Sprite, Text, type Renderer } from 'pixi.js';
import { createDiegeticCrtFilter, type DiegeticCrtFilterHandle } from '@/lib/render/shaders/diegeticCrtFilter';
import { createTubeGlowFilter, calculateTubeGlowIntensity, type TubeGlowFilterHandle } from '@/lib/render/shaders/tubeGlowFilter';
import { applyReelState, buildReelTextures, createReelSprite } from '@/features/gearStudio/gearSpriteAnimation';
import { STATUS_LED_HEX, gearAttention, gearVisualKey, getConsoleTierGear, statusLedColor, tubeGlowLevel } from '@/features/gearStudio/consoleTierGear';
import { dimTint, gearConditionKey, shelfConditionStyle, toSpriteVisualState } from '@/features/gearStudio/gearVisualState';
import { getPropTexture, loadPropSprites } from '@/components/studio/propSprites';
import {
  resolveRackFaceplate,
  resolveShelfCapacity,
  shelfStructuralKey,
} from '@/components/studio/equipmentShelfSprites';
import {
  layoutGearLocker,
  lockerQuadPoints,
  projectPointInLockerQuad,
} from '@/components/studio/gearLocker';
import {
  ensureEquipmentTexture,
  getEquipmentTexture,
  prefetchEquipmentTextures,
} from '@/components/studio/equipmentTextures';
import {
  advanceClientTransit,
  clientTransitPose,
  createClientTransitState,
  isClientTransitAnimating,
  skipClientTransit,
  type ClientTransitState,
} from '@/components/studio/clientDoorTransit';
import {
  IDLE_CAMERA_LERP,
  IDLE_CAMERA_RESTORE_LERP,
  IDLE_CAMERA_ZOOM,
  IDLE_HINT_DELAY_MS,
  DOOR_HINT_DELAY_MS,
  cameraPoseForFocus,
  cameraPoseNear,
  getIdleHintTarget,
  lerpCameraPose,
  pickIdleDirectionTarget,
  shouldShowDoorHint,
  type CameraPose,
  type IdleDirectionHotspot,
  type PendingChoreHotspot,
} from '@/components/studio/idleFloorDirection';
import { visualEraId } from '@/utils/eraProgression';
import { useSettings } from '@/contexts/SettingsContext';
import { resolveRendererOrder } from '@/lib/render/rendererChoice';
import { claimPixiApplication, STUDIO_FLOOR_OWNER } from '@/lib/motion/pixiGuard';
import { cityWallColors } from '@/components/studio/cityWallTint';
import { TILE_W, TILE_H, ROOM_W, ROOM_D, WALL_H, iso, isoQuad, leftWallPt } from '@/components/studio/isoMath';
import { buildCaseStack, CASE_STACK_TILE, type CaseStack } from '@/components/studio/studioCaseStack';
import { buildWindowView, type WindowView } from '@/components/studio/studioWindowView';
import { buildPremisesDecor } from '@/components/studio/studioPremisesDecor';
import { buildFurnishingRenderLayer, type FurnishingRenderItem } from '@/components/studio/studioFurnishingRender';
import { getRoomLayoutProfile, PROP_METRICS, type RoomLayoutProfile } from '@/components/studio/roomLayouts';
import { buildRoomLayoutScene, computeRoomView } from '@/components/studio/roomLayoutScene';
import { buildRoomFigures } from '@/components/studio/roomFigures';
import type { StudioRoomType } from '@/types/game';
import { buildFurnishingLayer, type StudioCat } from '@/components/studio/studioFloorFurnishings';
import {
  buildDecorLights,
  buildDeskProps,
  buildCandleTable,
  buildCandleDrink,
  buildCandleBeers,
  CANDLE_DRINK_SETTLE_SEC,
  buildLiveBooth,
  buildPlankFloor,
  buildWallClock,
  radialGradientSprite,
  buildRoomShell,
  buildRug,
  buildUnderlay,
  buildWallDressing,
  type DecorLights,
} from '@/components/studio/studioDecor';
import {
  getDaynessFromClockMinutes,
  getDayPhase,
  getEraDecor,
  getEraLightingKit,
  getNightTintAlpha,
  getWallClockTime,
  getWallClockTimeFromMinutes,
  getWindowSkyColor,
  REDUCED_MOTION_DAYNESS,
  trophyKey,
  type TrophyInput,
} from '@/components/studio/studioDecorConfig';
import {
  shelfIdleMotion,
  statusLedPulse,
  vuNeedleAngle,
  vuNeedleNorm,
} from '@/components/studio/studioFloorLife';
import { addStudioProps, loadStudioKit, type StudioKitTextures } from '@/features/sprites/studioKit';
import type { FloorNpcFigure, FloorNpcHandle, StagedStaffHandle } from '@/features/sprites/floorNpcs';
import {
  applyFloorNpcMotion,
  createFloorNpcVisual,
  hashSeed,
  loadNpcPartsAtlas,
  resolveFloorNpcDefinition,
} from '@/features/sprites/floorNpcs';
import type { LoadedAtlas } from '@/features/sprites/pipeline/pixiAtlasLoader';

export const calculateEffectiveResolution = (dpr: number, scale?: number) => {
  const clampedDpr = Math.max(1.0, Math.min(2.0, dpr || 1.0));
  return Math.max(0.5, Math.min(3.0, clampedDpr * (scale || 1.0)));
};

export const shouldSkipFrame = (targetFps: number, elapsedMs: number) => {
  if (targetFps <= 0) return false;
  const budgetMs = 1000 / targetFps;
  return elapsedMs < budgetMs - 1.0;
};

export interface EraPostFxTuning {
  scanlineAlpha: number;
  scanlinePitch: number;
  vignetteColor: number;
  vignetteAlpha: number;
}

export const getEraPostFxTuning = (eraId?: string): EraPostFxTuning => {
  const era = visualEraId(eraId ?? 'analog60s');
  switch (era) {
    case 'digital80s':
      return {
        scanlineAlpha: 0.022,
        scanlinePitch: 4,
        vignetteColor: 0x160c24, // Deep slate-violet
        vignetteAlpha: 0.18,
      };
    case 'internet2000s':
      return {
        scanlineAlpha: 0.016,
        scanlinePitch: 3,
        vignetteColor: 0x0a141d, // Cool studio navy
        vignetteAlpha: 0.15,
      };
    case 'streaming2020s':
      return {
        scanlineAlpha: 0.0,
        scanlinePitch: 3,
        vignetteColor: 0x080f0c, // Ultra-subtle charcoal
        vignetteAlpha: 0.12,
      };
    case 'analog60s':
    default:
      return {
        scanlineAlpha: 0.0,
        scanlinePitch: 4,
        vignetteColor: 0x1d1107, // Warm tape amber-sepia
        vignetteAlpha: 0.20,
      };
  }
};

export interface DynamicBloomResult {
  meterAlpha: number;
  lampAlpha: number;
  radiusMultiplier: number;
  meterColor: number;
  lampColor: number;
}

export const calculateDynamicBloom = (
  activity = 0,
  hasActiveProject = false,
  eraId?: string,
  isReducedMotion = false
): DynamicBloomResult => {
  const clampedActivity = Math.max(0, Math.min(1, activity));
  // Subtle meter core alpha between 0.10 and 0.25 (never overpowering)
  const meterAlpha = 0.10 + clampedActivity * 0.15;
  // Pilot lamp / record indicator alpha: 0.20 when recording, subtle 0.06 pilot when idle
  const lampAlpha = hasActiveProject ? 0.20 : 0.06;
  const radiusMultiplier = isReducedMotion ? 1.0 : 1.0 + clampedActivity * 0.35;

  const era = visualEraId(eraId ?? 'analog60s');
  let meterColor = 0xffaa33; // Warm tungsten amber for analog
  let lampColor = 0xff5533; // Warm tube record lamp

  if (era === 'digital80s') {
    meterColor = 0xc77dff; // Synth magenta / fluorescent
    lampColor = 0x5aa9e6; // Cool digital blue
  } else if (era === 'internet2000s') {
    meterColor = 0x5aa9e6; // Precision DAW cyan
    lampColor = 0x7bd389; // Soft green lock
  } else if (era === 'streaming2020s') {
    meterColor = 0x7bd389; // Modern emerald studio LED
    lampColor = 0x48dbfb; // Clean smart studio cyan
  }

  return {
    meterAlpha,
    lampAlpha,
    radiusMultiplier,
    meterColor,
    lampColor,
  };
};

export const calculateTapeSaturationWarmth = (
  activity = 0,
  hasActiveProject = false,
  baseAlpha = 1.0
): number => {
  const clampedActivity = Math.max(0, Math.min(1, activity));
  // Warmth subtly deepens under heavy activity and session takes (max +0.06 boost)
  const saturationBoost = (hasActiveProject ? 0.03 : 0.0) + clampedActivity * 0.03;
  return Math.min(1.25, Math.max(0.1, baseAlpha * (1.0 + saturationBoost)));
};

/**
 * Studio hotspots the player can click in the isometric room scene.
 */
export type StudioHotspotId = 'console' | 'liveRoom' | 'phone' | 'clock' | 'tv' | 'shelf' | 'door' | 'promotion' | 'cases' | 'producer';

/**
 * Draw-order bands inside the room. Floor, walls and big fixed furniture keep add order at `world`;
 * y-sorted pieces (characters, free-standing tier props) share `depth + y`; glow/light FX always sit on top.
 */
const Z = { world: 0, depth: 100, fx: 3000 } as const;

export type HotspotAnchors = Partial<Record<StudioHotspotId | 'coffee', { x: number; y: number }>>;

/**
 * Live state fed into the scene. Purely presentational — the scene reads the
 * latest values from a ref every animation frame, so React can update it
 * cheaply without rebuilding the room.
 */
export interface StudioSceneState {
  /** 0..1 — how much work is happening right now (drives VU meters) */
  activity: number;
  /** Whether a project is currently in production */
  hasActiveProject: boolean;
  /** Who is in the booth (client / band name) for the active session */
  artistName?: string;
  /** Number of staff physically on the studio floor */
  staffOnFloor: number;
  /**
   * Optional per-figure looks + anim states (creator / recruitment identities).
   * When shorter than `staffOnFloor`, remaining slots use deterministic seeds.
   */
  floorFigures?: FloorNpcFigure[];
  /** Producer look when the first floor slot has no figure identity (sibling creator merge). */
  producerAppearance?: NpcVisualIdentity;
  /**
   * Fully resolved producer definition from career-start customisation (#126/k5v).
   * When present, floor slot 0 renders it directly instead of seed-deriving a face,
   * so the on-floor producer matches the creator preview exactly.
   */
  producerNpc?: ModularNpcDefinition;
  /**
   * Owned gear IDs for the equipment shelf sprites.
   * Falls back to horizontal rack faceplates when PNG art is missing.
   * `ownedEquipment` count is derived when ids are omitted (legacy / tests).
   */
  ownedEquipmentIds?: string[];
  /**
   * Authoritative gear condition (0..100) by equipment ID — drives restrained
   * shelf wear (dimmed faces, failing-item warning LED). Absent = no wear.
   */
  gearConditions?: Record<string, number>;
  /** @deprecated Prefer ownedEquipmentIds — count still accepted for structural fallbacks. */
  ownedEquipment?: number;
  /** In-game day counter (drives the wall clock) */
  day: number;
  /** Shared playable-day clock (0..1439). When present, wall, window and tint use it together. */
  clockMinutes?: number;
  /** Current era id — drives the room's colour grade + signage (bead goj.3) */
  eraId?: string;
  /** Home city id: nudges the wall colours toward the city accent. */
  cityId?: string;
  /** Studio tier 1-5 from ProgressionSystem — drives visible room upgrades (bead ifx.3) */
  roomTier?: number;
  /** Extra room being viewed (#248). Absent or 'project-studio' renders the full Studio A scene. */
  roomType?: StudioRoomType;
  /** A project is booked into the viewed extra room right now (drives the on-air lamp). */
  roomOccupied?: boolean;
  /** Premises tier (#70): 3 adds a premium sofa and third rack; 1 adds the client bench + storage rack, 2 adds reception, water cooler and a second rack. */
  premisesTier?: number;
  premisesArchetype?: string;
  /** Equipped room furnishings from studioCustomization (#258), already mapped by mapFurnishingsToRender. */
  furnishings?: FurnishingRenderItem[];
  /** Tier ids of earned, unopened flight cases (drives the floor stack). */
  pendingCases?: string[];
  /** Completed-project album covers hung above the booth (from financials.reports). */
  trophies?: TrophyInput;
  /** Stable per-run seed so plank layout / motes are identical across rebuilds. */
  decorSeed?: string | number;
  /** True when artist enquiries wait on the phone — strengthens the ring pulse. */
  enquiryWaiting?: boolean;
  /** First incomplete floor chore hotspot (console / liveRoom / shelf), if any. */
  pendingChoreHotspot?: PendingChoreHotspot | null;
  /** Explicitly focus the camera on one hotspot and ignore all others (diegetic interactions). */
  lockedHotspot?: StudioHotspotId | null;
  /**
   * True when the floor owns attention (no ContextDrawer / inspector).
   * Idle auto-zoom + hints stay quiet while drawers are open.
   */
  floorFocused?: boolean;
  /**
   * True after today's `brew_espresso` chore completes — candle-table mug + steam.
   * Derived from `choreState.chores.brew_espresso.completed` (clears on daily refresh).
   */
  coffeeSteaming?: boolean;
  /**
   * True when the active session's rider asks for beers — bottles on the candle table.
   * Coffee stays brew-gated (`coffeeSteaming`); beers are rider-driven.
   */
  riderBeers?: boolean;
}

interface WebGLCanvasProps {
  state?: Partial<StudioSceneState>;
  onHotspotSelect?: (id: StudioHotspotId) => void;
  resetCameraKey?: number;
  /** Top-centre of each hotspot in canvas CSS pixels; follows pan/zoom so DOM badges stay attached. */
  onHotspotAnchors?: (anchors: HotspotAnchors) => void;
  /** Fired once after the first rendered frame so the shell can reveal GUI + 3D together. */
  onFirstFrame?: () => void;
  className?: string;
}

const DEFAULT_STATE: StudioSceneState = {
  activity: 0.2,
  hasActiveProject: false,
  staffOnFloor: 1,
  ownedEquipmentIds: ['basic_mic', 'basic_monitors', 'audio_interface'],
  ownedEquipment: 3,
  day: 1,
  eraId: 'analog60s',
  roomTier: 1,
};

export {
  IDLE_HINT_DELAY_MS,
  DOOR_HINT_DELAY_MS,
  getIdleHintTarget,
  pickIdleDirectionTarget,
  shouldShowDoorHint,
};

/* ---------------------------------------------------------------------------
 * Isometric helpers live in ./studio/isoMath (shared with the decor layer)
 * ------------------------------------------------------------------------- */

/** Room palette */
const COLORS = {
  floorA: 0x624a39,
  floorB: 0x5d4737,
  rug: 0x8c3b3b,
  rugInner: 0x9c4747,
  wallLeft: 0x2a3345,
  wallRight: 0x323d52,
  wallTrim: 0x2a1f18,
  deskTop: 0x3d4459,
  deskSide: 0x2b3142,
  deskRight: 0x232a3a,
  shelf: 0x4a3a2c,
  shelfSide: 0x382c21,
  gear: [0xd9a441, 0x5aa9e6, 0xe05c5c, 0x7bd389, 0xc77dff, 0xf2f2f2],
  staff: [0x5aa9e6, 0xe08fa8, 0x7bd389, 0xf2c14e, 0xc77dff],
  glass: 0xa6d8e6,
  glassFrame: 0x8fc0c8,
};

/**
 * Era colour grades (bead goj.3): each era tints the room and shifts the wall
 * tones so the studio visibly ages with the technology. `tint` is the ambient
 * overlay colour animated by the day/night cycle.
 */
const ERA_GRADES: Record<string, { tint: number; wallLeft: number; wallRight: number; accent: number; label: string }> = {
  analog60s:    { tint: 0x2a1c08, wallLeft: 0x4a3a33, wallRight: 0x5a4740, accent: 0xe6b866, label: 'ANALOG 60s' },
  digital80s:   { tint: 0x1b0a2e, wallLeft: 0x3a2c4d, wallRight: 0x4a3862, accent: 0xd98cff, label: 'DIGITAL 80s' },
  internet2000s:{ tint: 0x08171f, wallLeft: 0x2e4048, wallRight: 0x3a5058, accent: 0x5fd0c0, label: 'MILLENNIUM 2000s' },
  streaming2020s:{ tint: 0x06140f, wallLeft: 0x2b3b36, wallRight: 0x35483f, accent: 0x7bd389, label: 'STREAMING 2020s' },
};

export const getEraGrade = (eraId?: string) => ERA_GRADES[visualEraId(eraId ?? 'analog60s')] ?? ERA_GRADES.analog60s;

/** Studio tier furniture/upgrade thresholds (bead ifx.3). */
export const clampTier = (tier?: number): 1 | 2 | 3 | 4 | 5 => {
  const t = Math.max(1, Math.min(5, Math.round(tier ?? 1)));
  return t as 1 | 2 | 3 | 4 | 5;
};

export const getStudioTierName = (tier: number): string => {
  if (tier >= 5) return 'HIT FACTORY';
  if (tier >= 4) return 'STUDIO A';
  if (tier >= 3) return 'PROJECT STUDIO';
  if (tier >= 2) return 'BEDROOM+ STUDIO';
  return 'HOME STUDIO';
};

export const getStudioSignage = (eraId?: string, milestonesCount = 0, cityName?: string): string => {
  const grade = getEraGrade(eraId);
  const tier = clampTier(Math.floor(milestonesCount / 2) + 1);
  return `${cityName ? `${cityName.toUpperCase()} · ` : ''}${grade.label} · ${getStudioTierName(tier)}`;
};

export interface ConsoleProfile {
  tier: number;
  channels: number;
  displays: 0 | 1 | 2;
  outboardUnits: number;
  finish: number;
  trim: number;
  leatherRest: number;
  sideCheeks: number;
}

/** Visible progression from a compact valve-era desk to a full mastering console. */
export const getConsoleProfile = (tier: number): ConsoleProfile => {
  const t = clampTier(tier);
  switch (t) {
    case 1: // Home Studio: Warm retro wood chassis & compact 4-ch valve desk
      return {
        tier: 1,
        channels: 4,
        displays: 0,
        outboardUnits: 1,
        finish: 0x4a3627,
        trim: 0x735138,
        leatherRest: 0x2e1f16,
        sideCheeks: 0x5c3d28,
      };
    case 2: // Project Studio: Classic 70s/80s analog slate console
      return {
        tier: 2,
        channels: 8,
        displays: 1,
        outboardUnits: 2,
        finish: 0x3d4554,
        trim: 0x576378,
        leatherRest: 0x1f232b,
        sideCheeks: 0x453123,
      };
    case 3: // Commercial Facility: British console blue-grey (SSL/Neve)
      return {
        tier: 3,
        channels: 12,
        displays: 1,
        outboardUnits: 3,
        finish: 0x2c3b4d,
        trim: 0x4d6482,
        leatherRest: 0x18202b,
        sideCheeks: 0x3b2a1e,
      };
    case 4: // Pro Complex: Large-format matte charcoal & precision anodized aluminum
      return {
        tier: 4,
        channels: 16,
        displays: 2,
        outboardUnits: 4,
        finish: 0x222730,
        trim: 0x464e5e,
        leatherRest: 0x14171d,
        sideCheeks: 0x2e231b,
      };
    case 5: // World-Class: Flagship custom master console with brushed gold accents
    default:
      return {
        tier: 5,
        channels: 20,
        displays: 2,
        outboardUnits: 5,
        finish: 0x1a1e26,
        trim: 0xd4a553,
        leatherRest: 0x101318,
        sideCheeks: 0x421d12,
      };
  }
};

/** An animatable bar (VU meters, TV equalizer) with a fixed baseline */
interface AnimBar {
  g: Graphics;
  x: number;
  y: number;
  color: number;
  width?: number;
  range?: number;
  /** When set, the bar is drawn as a quad on the left-wall plane (tile y span + base lift). */
  plane?: { y0: number; y1: number; lift: number };
  /** Vintage analog needle mode (tier-1 meter bridge). */
  needle?: boolean;
  /** Top of the dial slot (needle pivots near `y`, tips toward `needleTopY`). */
  needleTopY?: number;
}

/** Status LED jewel animated by the ticker (console / outboard). */
interface StatusLed {
  g: Graphics;
  x: number;
  y: number;
  color: number;
  radius: number;
}

/** Shelf gear sprite kept for idle micro-motion (hit target stays on the shelf wrap). */
interface ShelfAnimItem {
  display: Container;
  baseY: number;
  baseRot: number;
  phase: number;
  /** Rack-mounted items stay physically seated in the cabinet. */
  seated?: boolean;
}

/** Per-build dynamic refs the ticker animates */
interface SceneRefs {
  vuBars: AnimBar[];
  tvBars: AnimBar[];
  tvWrap: Container | null;
  tvCrtFilter: DiegeticCrtFilterHandle | null;
  tubeGlowFilter: TubeGlowFilterHandle | null;
  statusLeds: StatusLed[];
  shelfItems: ShelfAnimItem[];
  phoneRing: Graphics | null;
  clockHand: Graphics | null;
  setClockTime: ((hour: number, minute: number) => void) | null;
  staffFigures: StagedStaffHandle[];
  /** The booked artist, standing at the live-room mic while a session is in progress. */
  artist: (FloorNpcHandle & { tag: Text; shown: string; baseX: number }) | null;
  /** Floor anchor just inside the door threshold (client enter/exit). */
  doorFloor: { x: number; y: number } | null;
  /** Live-room mic stand pose for the booked artist. */
  artistStand: { x: number; y: number } | null;
  nightTintLayer: Container | null;
  /** Right-wall window pane fill — sky colour driven by the studio clock. */
  windowPane: Graphics | null;
  windowPanePoly: number[] | null;
  /** Sun, moon, stars and city lights seen through the window. */
  windowView: WindowView | null;
  /** Earned flight cases waiting on the floor; tapping opens the depot. */
  caseStack: CaseStack | null;
  /** performance.now() of the last tap on the player character (drives the hop + emote). */
  producerTapAt: number;
  producerEmote: Text | null;
  setWindowSky: ((color: number) => void) | null;
  hoverGlows: Record<string, Graphics>;
  hoverGlowTargets: Record<string, number>;
  hotspotHits: Partial<Record<StudioHotspotId, Container>>;
  idleHints: Partial<Record<IdleDirectionHotspot, Graphics>>;
  /** Local-space centres used by idle auto-zoom. */
  idleFocusPoints: Partial<Record<IdleDirectionHotspot, { x: number; y: number }>>;
  crtLayer: Container | null;
  bloomLayer: Container | null;
  vignetteLayer: Container | null;
  dynamicBloomG: Graphics | null;
  decor: DecorLights | null;
  /** Lounge candle table container for diegetic coffee anchor tracking. */
  candleTable: Container | null;
  /** Brew mug on the candle table — visible only after `brew_espresso`. */
  candleDrink: Container | null;
  /** Local y rest pose for the candle drink settle animation. */
  candleDrinkBaseY: number;
  /** Rider beers on the candle table — visible during sessions with a beer ask. */
  candleBeers: Container | null;
  /** Tape machine reels (Pixi AnimatedSprite, #81): tier 1 baked machine, tiers 2-5 outboard deck. */
  reels: AnimatedSprite[];
  /** Tier 2-5 outboard deck: valve glow lamps and status LEDs, restyled only when state changes (#81). */
  gearTubes: Graphics[];
  gearLeds: Graphics[];
  /** Studio cat: follows the studio clock (see studioFloorFurnishings). */
  floorCat: StudioCat | null;
}

interface BuiltScene {
  root: Container;
  underlayRoot: Container;
  overlayRoot: Container;
  refs: SceneRefs;
  basePosition: { x: number; y: number };
  baseScale: number;
  /** Per-frame animation hook for scenes that are not the Studio A scene. */
  tick?: (seconds: number, reduceMotion: boolean) => void;
}

/** Hover colours per hotspot (match the legacy rings). */
const HOVER_COLORS: Partial<Record<StudioHotspotId, number>> = {
  tv: 0x5aa9e6, console: 0x7bd389, phone: 0xffd166, liveRoom: 0xff9c6e, shelf: 0xe6b866, cases: 0xffd166,
};

/**
 * Redraw a hotspot's hover highlight so it hugs the item's real sprite bounds (corner brackets plus a
 * faint wash) instead of the looser click polygon. Falls back to the legacy ring when the visual is
 * empty or unreasonably large (e.g. a whole wall).
 */
const fitHoverGlow = (glow: Graphics, visual: Container | null, hitArea: Graphics, parent: Container, color: number) => {
  if (!visual) return;
  const vb = visual.getBounds();
  const hb = hitArea.getBounds();
  // The click shape is the rough footprint; the sprite can poke past it (a console's front edge, a shelf's
  // top) but its bounds also include soft shadows and glow pools. Grow the click shape toward the sprite
  // by at most `reach` px per side so the highlight covers the real edges without swallowing the shadows.
  const reach = 26;
  const b = {
    minX: Math.max(vb.minX, hb.minX - reach), minY: Math.max(vb.minY, hb.minY - reach),
    maxX: Math.min(vb.maxX, hb.maxX + reach), maxY: Math.min(vb.maxY, hb.maxY + reach),
  };
  // Never smaller than the item's overlap with the click shape.
  b.minX = Math.min(b.minX, Math.max(vb.minX, hb.minX)); b.minY = Math.min(b.minY, Math.max(vb.minY, hb.minY));
  b.maxX = Math.max(b.maxX, Math.min(vb.maxX, hb.maxX)); b.maxY = Math.max(b.maxY, Math.min(vb.maxY, hb.maxY));
  if (!(b.maxX > b.minX + 8) || !(b.maxY > b.minY + 8)) { b.minX = hb.minX; b.minY = hb.minY; b.maxX = hb.maxX; b.maxY = hb.maxY; }
  if (!(b.maxX > b.minX) || !(b.maxY > b.minY)) return;
  const tl = parent.toLocal({ x: b.minX, y: b.minY });
  const br = parent.toLocal({ x: b.maxX, y: b.maxY });
  const pad = 3;
  const x0 = tl.x - pad, y0 = tl.y - pad, x1 = br.x + pad, y1 = br.y + pad;
  const w = x1 - x0, h = y1 - y0;
  if (w < 8 || h < 8 || w > 460 || h > 380) return;
  const len = Math.max(6, Math.min(14, Math.min(w, h) * 0.28));
  glow.clear();
  glow.roundRect(x0, y0, w, h, 4).fill({ color, alpha: 0.07 });
  const brackets = (g: Graphics) => {
    g.moveTo(x0, y0 + len).lineTo(x0, y0).lineTo(x0 + len, y0)
      .moveTo(x1 - len, y0).lineTo(x1, y0).lineTo(x1, y0 + len)
      .moveTo(x1, y1 - len).lineTo(x1, y1).lineTo(x1 - len, y1)
      .moveTo(x0 + len, y1).lineTo(x0, y1).lineTo(x0, y1 - len);
  };
  brackets(glow);
  glow.stroke({ width: 5, color: 0x0b0906, alpha: 0.5, cap: 'round', join: 'round' });
  brackets(glow);
  glow.stroke({ width: 2.5, color, alpha: 0.95, cap: 'round', join: 'round' });
};

/** Attach an interactive hit area + hover glow around a visual group. */
const addHotspot = (
  parent: Container,
  id: StudioHotspotId,
  hitArea: Graphics,
  visual: Container,
  refs: SceneRefs,
  onSelect?: (id: StudioHotspotId) => void,
  zIndex?: number
) => {
  const wrap = new Container();
  if (zIndex !== undefined) wrap.zIndex = zIndex;
  if (visual) wrap.addChild(visual);

  // Glow ring shown on hover (populated by the caller with real coordinates)
  const glow = new Graphics();
  glow.alpha = 0;
  refs.hoverGlows[id] = glow;
  refs.hoverGlowTargets[id] = 0;
  wrap.addChild(glow);

  const hit = new Container();
  hit.addChild(hitArea);
  hit.eventMode = 'static';
  hit.cursor = 'pointer';
  hit.alpha = 0; // invisible for rendering, still receives pointer events
  if (zIndex !== undefined) hit.zIndex = zIndex;
  refs.hotspotHits[id] = hit;
  hit.on('pointerover', () => {
    fitHoverGlow(glow, visual, hitArea, parent, HOVER_COLORS[id] ?? 0xffe3a3);
    refs.hoverGlowTargets[id] = 1;
  });
  hit.on('pointerout', () => { refs.hoverGlowTargets[id] = 0; });
  // The canvas gesture guard suppresses selection after a two-finger pan.
  hit.on('pointertap', () => { onSelect?.(id); });

  parent.addChild(wrap);
  parent.addChild(hit);
};

const createSceneRefs = (): SceneRefs => ({
    vuBars: [],
    tvBars: [],
    tvWrap: null,
    tvCrtFilter: null,
    tubeGlowFilter: null,
    statusLeds: [],
    shelfItems: [],
    phoneRing: null,
    clockHand: null,
    setClockTime: null,
    staffFigures: [],
    artist: null,
    doorFloor: null,
    artistStand: null,
    nightTintLayer: null,
    windowPane: null,
    windowPanePoly: null,
    windowView: null,
    caseStack: null,
    producerTapAt: -1e9,
    producerEmote: null,
    setWindowSky: null,
    hoverGlows: {},
    hoverGlowTargets: {},
    hotspotHits: {},
    idleHints: {},
    idleFocusPoints: {},
    crtLayer: null,
    bloomLayer: null,
    vignetteLayer: null,
    dynamicBloomG: null,
    decor: null,
    candleTable: null,
    candleDrink: null,
    candleDrinkBaseY: 0,
    candleBeers: null,
    reels: [],
    gearTubes: [],
    gearLeds: [],
    floorCat: null,
  });

const buildScene = (
  width: number,
  height: number,
  state: StudioSceneState,
  onSelect?: (id: StudioHotspotId) => void,
  renderer?: Renderer,
  kitTextures?: StudioKitTextures | null,
  npcAtlas?: LoadedAtlas | null,
): BuiltScene => {
  const root = new Container();
  const refs: SceneRefs = createSceneRefs();

  // Era colour grade + studio tier drive the room's look (beads goj.3 / ifx.3)
  const eraGrade = getEraGrade(state.eraId);
  const grade = { ...eraGrade, ...cityWallColors(eraGrade.wallLeft, eraGrade.wallRight, state.cityId) };
  const tier = clampTier(state.roomTier);
  const postFxTuning = getEraPostFxTuning(state.eraId);

  // Fit the whole room into the viewport so walls/floor never clip
  const bounds = { minX: -196, maxX: 224, minY: -135, maxY: 215 };
  const topInset = width <= 540 ? 116 : 68;
  const bottomInset = height < 500 ? 96 : 160;
  const fitScale = Math.min(
    (width - 60) / (bounds.maxX - bounds.minX),
    Math.max(80, height - topInset - bottomInset - 20) / (bounds.maxY - bounds.minY),
    2.4
  );
  root.scale.set(fitScale);
  const originX = width / 2 - ((bounds.minX + bounds.maxX) / 2) * fitScale;
  const originY = (topInset + height - bottomInset) / 2 - ((bounds.minY + bounds.maxY) / 2) * fitScale;
  root.position.set(originX, originY);

  const decorSpec = getEraDecor(state.eraId);
  const decorSeed = state.decorSeed ?? 'studio';
  const trophyInput: TrophyInput = state.trophies ?? { covers: [] };

  // Room slab + ground shadow sit under everything else.
  root.addChild(buildRoomShell());

  /* ---- Back walls ------------------------------------------------------ */
  const walls = new Graphics();
  const wl0 = iso(0, 0);
  const wl1 = iso(0, ROOM_D);
  const wr1 = iso(ROOM_W, 0);
  // Left wall: runs from the back corner down the left edge
  walls
    .poly([wl0.x, wl0.y, wl1.x, wl1.y, wl1.x, wl1.y - WALL_H, wl0.x, wl0.y - WALL_H])
    .fill(grade.wallLeft);
  // Right wall
  walls
    .poly([wl0.x, wl0.y, wr1.x, wr1.y, wr1.x, wr1.y - WALL_H, wl0.x, wl0.y - WALL_H])
    .fill(grade.wallRight);
  // Wall trim / roof outline (left wall front -> left top -> back corner top -> right top -> right wall front)
  walls
    .poly([
      wl1.x, wl1.y,
      wl1.x, wl1.y - WALL_H,
      wl0.x, wl0.y - WALL_H,
      wr1.x, wr1.y - WALL_H,
      wr1.x, wr1.y,
    ])
    .stroke({ width: 4, color: COLORS.wallTrim });
  // Center corner vertical seam
  walls
    .poly([wl0.x, wl0.y, wl0.x, wl0.y - WALL_H])
    .stroke({ width: 2, color: COLORS.wallTrim, alpha: 0.6 });
  root.addChild(walls);
  const dressing = buildWallDressing(decorSpec, trophyInput, tier);
  root.addChild(dressing.container);

  /* ---- Window (right wall) — pane sky tracks the studio clock ------------ */
  const windowWrap = new Container();
  const winA = iso(5.1, 0);
  const winB = iso(6.9, 0);
  const winPoly = [winA.x, winA.y - 96, winB.x, winB.y - 96, winB.x, winB.y - 34, winA.x, winA.y - 34];
  const windowPane = new Graphics();
  const initialClockMinutes = state.clockMinutes ?? getWallClockTime(state.day, 0).minutesOfDay;
  const initialSky = getWindowSkyColor(initialClockMinutes);
  windowPane.poly(winPoly).fill(initialSky);
  windowWrap.addChild(windowPane);
  {
    const view = buildWindowView(winA, winB, 34, 96, hashSeed(decorSeed), state.cityId);
    const initial = initialClockMinutes;
    view.update(initial, getDaynessFromClockMinutes(initial), 0, false);
    windowWrap.addChild(view.container);
    refs.windowView = view;
  }
  const windowFrame = new Graphics();
  // Closed pane outline — keep the mullion inside the glass so no orphan black stub hangs below the sill
  windowFrame.poly(winPoly).stroke({ width: 3.5, color: COLORS.wallTrim });
  const winMidX = (winA.x + winB.x) / 2;
  const winMidY = (winA.y + winB.y) / 2;
  const paneTop = winMidY - 96;
  const paneBot = winMidY - 34;
  const mullionInset = 4;
  windowFrame
    .rect(winMidX - 1.5, paneTop + mullionInset, 3, paneBot - paneTop - mullionInset * 2)
    .fill(COLORS.wallTrim);
  windowWrap.addChild(windowFrame);
  root.addChild(windowWrap);
  refs.windowPane = windowPane;
  refs.windowPanePoly = winPoly;
  let lastSky = initialSky;
  refs.setWindowSky = (color: number) => {
    if (color === lastSky || !refs.windowPane || !refs.windowPanePoly) return;
    lastSky = color;
    refs.windowPane.clear();
    refs.windowPane.poly(refs.windowPanePoly).fill(color);
  };

  /* ---- Charts TV (left wall) ------------------------------------------ */
  const tvWrap = new Container();
  const tvA = iso(0, 4.6);
  const tvB = iso(0, 6.4);
  const tvPoly = [tvA.x, tvA.y - 104, tvB.x, tvB.y - 104, tvB.x, tvB.y - 56, tvA.x, tvA.y - 56];
  const tv = new Graphics();
  tv.poly(tvPoly).fill(0x11151f);
  tv.poly(tvPoly).stroke({ width: 3, color: 0x0a0d14 });
  tvWrap.addChild(tv);
  // Animated equalizer bars on the TV screen — drawn as wall-plane quads so they sit inside the bezel
  for (let i = 0; i < 5; i++) {
    const bar = new Graphics();
    const y0 = 4.72 + i * 0.32;
    tvWrap.addChild(bar);
    refs.tvBars.push({ g: bar, x: 0, y: 0, color: COLORS.gear[i % COLORS.gear.length], plane: { y0, y1: y0 + 0.22, lift: 60 } });
  }
  root.addChild(tvWrap);
  refs.tvWrap = tvWrap;
  const isCrtEra = state.eraId === 'digital80s' || state.eraId === 'internet2000s';
  if (isCrtEra) {
    const crt = createDiegeticCrtFilter({
      pitch: postFxTuning.scanlinePitch,
      scanlineAlpha: postFxTuning.scanlineAlpha,
      curvature: 0.04,
    });
    if (crt) {
      refs.tvCrtFilter = crt;
      tvWrap.filters = [crt.filter];
    }
  }
  const tvHit = new Graphics();
  tvHit
    .poly([tvA.x, tvA.y - 110, tvB.x, tvB.y - 110, tvB.x, tvB.y - 50, tvA.x, tvA.y - 50])
    .fill(0xffffff);
  addHotspot(root, 'tv', tvHit, tvWrap, refs, onSelect);
  refs.hoverGlows['tv']
    ?.poly([tvA.x, tvA.y - 110, tvB.x, tvB.y - 110, tvB.x, tvB.y - 50, tvA.x, tvA.y - 50])
    .stroke({ width: 3, color: 0x5aa9e6 });

  /* ---- Wall clock (left wall) — a real face drawn in the wall plane ------ */
  const clockPos = iso(0, 2.0);
  const clockCx = clockPos.x;
  const clockCy = clockPos.y - 92;
  const clockFace = buildWallClock(clockCx, clockCy);
  refs.setClockTime = clockFace.setTime;
  const clockWrap = clockFace.container;
  root.addChild(clockWrap);
  const clockHit = new Graphics();
  clockHit.ellipse(clockCx, clockCy, 26, 24).fill(0xffffff);
  addHotspot(root, 'clock', clockHit, clockWrap, refs, onSelect);
  refs.hoverGlows['clock']
    ?.ellipse(clockCx, clockCy, 21, 19)
    .stroke({ width: 2, color: 0xffd166 });

  /* ---- Floor ---------------------------------------------------------- */
  const floor = buildPlankFloor(decorSpec, decorSeed);
  root.addChild(floor);
  root.addChild(buildRug());
  // Floor spill is clipped to the room diamond and must sit below every prop/figure.
  const lights = buildDecorLights({ spec: decorSpec, kit: getEraLightingKit(state.eraId), tier });
  refs.decor = lights;
  root.addChild(lights.floorContainer);
  root.addChild(dressing.props); // free-standing era props sit on top of the floor

  // Streaming-era phone/ring-light: same era gate as the visible led-strip prop.
  if (decorSpec.prop === 'led-strip') {
    const s = iso(7.3, 1.6);
    const promoHit = new Graphics().roundRect(s.x - 24, s.y - 92, 48, 98, 6).fill(0xffffff);
    addHotspot(root, 'promotion', promoHit, dressing.props, refs, onSelect);
    refs.hoverGlows.promotion?.roundRect(s.x - 24, s.y - 92, 48, 98, 6)
      .stroke({ width: 2, color: decorSpec.glow });
  }

  // Window spill and contact shadow place furniture on the floor plane.
  const lightAndShadow = new Graphics();
  const deskFoot = iso(4.5, 4.25);
  lightAndShadow.ellipse(deskFoot.x, deskFoot.y + 3, 63, 23).fill({ color: 0x131620, alpha: .28 });
  root.addChild(lightAndShadow);

  const outline = new Graphics();
  isoQuad(outline, 0, 0, ROOM_W, ROOM_D);
  outline.stroke({ width: 3, color: COLORS.wallTrim });
  root.addChild(outline);

  /* ---- Studio door (left wall, between clock & TV) ----------------------
   * Drawn after the floor so the threshold sits on the tile plane.
   * Door floor anchor drives diegetic client enter/exit walks. */
  {
    const doorA = iso(0, 3.15);
    const doorB = iso(0, 4.35);
    const doorH = 92;
    const doorJam = 6;
    const doorWrap = new Container();
    const doorGfx = new Graphics();
    doorGfx
      .poly([
        doorA.x, doorA.y,
        doorB.x, doorB.y,
        doorB.x, doorB.y - doorH,
        doorA.x, doorA.y - doorH,
      ])
      .fill(0x1a1520);
    doorGfx
      .poly([
        doorA.x + 1, doorA.y - 2,
        doorB.x - 1, doorB.y - 2,
        doorB.x - 1, doorB.y - doorH + doorJam,
        doorA.x + 1, doorA.y - doorH + doorJam,
      ])
      .fill(0x3a2a1c);
    const dpA = iso(0, 3.25);
    const dpB = iso(0, 4.25);
    doorGfx
      .poly([
        dpA.x + 3, dpA.y - 8,
        dpB.x - 2, dpB.y - 8,
        dpB.x - 2, dpB.y - doorH + 14,
        dpA.x + 3, dpA.y - doorH + 14,
      ])
      .fill(0x5c4030);
    doorGfx
      .poly([
        dpB.x - 2, dpB.y - 8,
        dpB.x + 4, dpB.y - 4,
        dpB.x + 4, dpB.y - doorH + 18,
        dpB.x - 2, dpB.y - doorH + 14,
      ])
      .fill(0x3d2a1e);
    const handle = iso(0, 4.05);
    doorGfx.circle(handle.x + 2, handle.y - 42, 2.4).fill(0xd9a441);
    doorGfx
      .poly([
        doorA.x + 2, doorA.y - 10,
        doorB.x - 2, doorB.y - 10,
        doorB.x - 2, doorB.y - 18,
        doorA.x + 2, doorA.y - 18,
      ])
      .fill({ color: 0x2a1e16, alpha: 0.7 });
    const thresh = new Graphics();
    isoQuad(thresh, 0, 3.15, 0.55, 4.35, 0);
    thresh.fill({ color: 0x2a2118, alpha: 0.85 });
    doorWrap.addChild(thresh);
    const doorTex = getPropTexture('door');
    if (doorTex) {
      // Sprite is authored flat; shear it into the left-wall plane.
      const doorSprite = new Sprite(doorTex);
      doorSprite.setFromMatrix(new Matrix(
        (doorB.x - doorA.x) / doorTex.width, (doorB.y - doorA.y) / doorTex.width,
        0, doorH / doorTex.height,
        doorA.x, doorA.y - doorH,
      ));
      doorWrap.addChild(doorSprite);
    } else {
      doorWrap.addChild(doorGfx);
    }
    const lintel = new Graphics();
    lintel
      .poly([
        doorA.x, doorA.y - doorH,
        doorB.x, doorB.y - doorH,
        doorB.x, doorB.y - doorH - 5,
        doorA.x, doorA.y - doorH - 5,
      ])
      .fill(COLORS.wallTrim);
    doorWrap.addChild(lintel);
    root.addChild(doorWrap);
    const doorHit = new Graphics()
      .poly([
        doorA.x, doorA.y,
        doorB.x, doorB.y,
        doorB.x, doorB.y - doorH,
        doorA.x, doorA.y - doorH,
      ])
      .fill(0xffffff);
    addHotspot(root, 'door', doorHit, doorWrap, refs, onSelect);
    refs.hoverGlows.door
      ?.poly([
        doorA.x, doorA.y,
        doorB.x, doorB.y,
        doorB.x, doorB.y - doorH,
        doorA.x, doorA.y - doorH,
      ])
      .stroke({ width: 2, color: 0xd9a441 });
    const doorHintPoly = [
      doorA.x, doorA.y,
      doorB.x, doorB.y,
      doorB.x, doorB.y - doorH,
      doorA.x, doorA.y - doorH,
    ];
    const doorHint = new Graphics();
    doorHint.poly(doorHintPoly).stroke({ width: 6, color: 0x0b0906, alpha: 0.5 });
    doorHint.poly(doorHintPoly).stroke({ width: 2.5, color: 0xd9a441, alpha: 0.9 });
    doorHint.alpha = 0;
    doorHint.eventMode = 'none';
    doorHint.zIndex = Z.fx;
    refs.idleHints.door = doorHint;
    refs.idleFocusPoints.door = {
      x: (doorA.x + doorB.x) / 2,
      y: (doorA.y + doorB.y) / 2 - doorH * 0.45,
    };
    root.addChild(doorHint);
    // Just inside the threshold — start/end of client walk paths
    refs.doorFloor = iso(0.45, 3.75);
  }

  /* ---- Live room booth: enclosed (walls, roof, header, foam, glass front) ---- */
  const liveWrap = buildLiveBooth();
  if (kitTextures) addStudioProps(root, kitTextures, tier, visualEraId(state.eraId ?? 'analog60s'));
  {
    const stack = buildCaseStack(state.pendingCases ?? [], grade.accent);
    if (stack) {
      const o = iso(CASE_STACK_TILE.x, CASE_STACK_TILE.y);
      const hit = new Graphics().poly(stack.hit.map((v, i) => v + (i % 2 === 0 ? o.x : o.y))).fill(0xffffff);
      addHotspot(root, 'cases', hit, stack.container, refs, onSelect, Z.depth + o.y + 2);
      refs.caseStack = stack;
    }
  }
  for (const prop of buildPremisesDecor(state.premisesTier ?? 0, grade.accent, state.premisesArchetype)) {
    prop.container.zIndex = Z.depth + prop.y;
    root.addChild(prop.container);
  }
  for (const prop of buildFurnishingRenderLayer(state.furnishings ?? [])) {
    prop.container.zIndex = Z.depth + prop.y;
    root.addChild(prop.container);
  }
  {
    // Tier-gated floor furnishings + the studio cat (procedural, y-sorted with the other floor pieces).
    const furnishings = buildFurnishingLayer(tier, { accent: grade.accent, glow: decorSpec.glow }, decorSeed);
    for (const { def, container } of furnishings.items) {
      container.zIndex = Z.depth + iso(def.x, def.y).y;
      root.addChild(container);
    }
    root.addChild(furnishings.cat.container);
    refs.floorCat = furnishings.cat;
  }
  const boothX0 = 1.0;
  const boothX1 = 3.5;
  const boothGlassY = 1.0;
  const gA = iso(boothX0, boothGlassY);
  const gB = iso(boothX1, boothGlassY);

  const liveHit = new Graphics();
  // Cover the glass front and the mic stand floor so booth + band taps share one hotspot.
  const stand = iso(2.3, 1.55);
  liveHit.poly([gA.x, gA.y, gB.x, gB.y, gB.x, gB.y - 90, gA.x, gA.y - 90]).fill(0xffffff);
  liveHit.poly([stand.x - 36, stand.y + 10, stand.x + 36, stand.y + 10, stand.x + 36, stand.y - 80, stand.x - 36, stand.y - 80]).fill(0xffffff);
  addHotspot(root, 'liveRoom', liveHit, liveWrap, refs, onSelect);
  refs.hoverGlows['liveRoom']
    ?.poly([gA.x, gA.y - 90, gB.x, gB.y - 90, gB.x, gB.y, gA.x, gA.y])
    .stroke({ width: 3, color: COLORS.glass });
  {
    const liveHintPoly = [gA.x, gA.y - 90, gB.x, gB.y - 90, gB.x, gB.y, gA.x, gA.y];
    const liveHint = new Graphics();
    liveHint.poly(liveHintPoly).stroke({ width: 7, color: 0x0b0906, alpha: 0.5 });
    liveHint.poly(liveHintPoly).stroke({ width: 2.5, color: 0xd9a441, alpha: 0.88 });
    liveHint.alpha = 0;
    liveHint.eventMode = 'none';
    liveHint.zIndex = Z.fx;
    refs.idleHints.liveRoom = liveHint;
    refs.idleFocusPoints.liveRoom = {
      x: (gA.x + gB.x) / 2,
      y: (gA.y + gB.y) / 2 - 45,
    };
    root.addChild(liveHint);
  }

  /* ---- Gear shelf (left side) — half-tile grid snap -------------------- */
  const shelfWrap = new Container();
  // The shelf physically grows with the studio tier (bead ifx.3).
  const shelfExtension = tier >= 5 ? 2.0 : tier >= 3 ? 1.0 : 0;
  // Half-tile snap: shelf sits along left wall at y=5..6
  const q1 = iso(0.5, 5.0); // back-left
  const q2 = iso(2.0 + shelfExtension, 5.0); // back-right
  const q3 = iso(2.0 + shelfExtension, 6.0); // front-right
  const q4 = iso(0.5, 6.0); // front-left
  const shelfH = 44;
  const shelf = new Graphics();
  shelf
    .poly([q1.x, q1.y - shelfH, q2.x, q2.y - shelfH, q3.x, q3.y - shelfH, q4.x, q4.y - shelfH])
    .fill(COLORS.shelf);
  shelf.poly([q2.x, q2.y - shelfH, q3.x, q3.y - shelfH, q3.x, q3.y, q2.x, q2.y]).fill(COLORS.shelfSide);
  shelfWrap.addChild(shelf);
  // Owned gear sits inside the visible front face as horizontal rack modules.
  const gearCapacity = resolveShelfCapacity(tier);
  const ownedIds = state.ownedEquipmentIds?.length
    ? state.ownedEquipmentIds
    : Array.from(
        {
          length: Math.max(
            0,
            Math.min(gearCapacity, Math.ceil((state.ownedEquipment ?? 0) / 2)),
          ),
        },
        (_, i) => `legacy_slot_${i}`,
      );
  const locker = layoutGearLocker({
    ownedIds,
    capacity: gearCapacity,
    q4,
    q3,
    shelfH,
    palette: COLORS.gear,
  });
  const cabinet = new Graphics();
  cabinet.poly(locker.shadow.flatMap(point => [point.x, point.y])).fill({ color: 0x090705, alpha: 0.42 });
  cabinet.poly(lockerQuadPoints(locker.outer)).fill(0x33251b).stroke({ width: 1.4, color: 0x806549 });
  cabinet.poly(lockerQuadPoints(locker.opening)).fill(0x100e0c).stroke({ width: 2, color: 0x594534 });
  for (const rail of locker.rails) {
    cabinet.moveTo(rail.from.x, rail.from.y).lineTo(rail.to.x, rail.to.y)
      .stroke({ width: 2.2, color: 0x8a6c48, alpha: 0.82 });
  }
  for (const ledge of locker.shelves) {
    cabinet.moveTo(ledge.from.x, ledge.from.y).lineTo(ledge.to.x, ledge.to.y)
      .stroke({ width: 1, color: 0x6d5947, alpha: 0.62 });
  }
  for (const foot of locker.feet) {
    cabinet.moveTo(foot.top.x, foot.top.y).lineTo(foot.bottom.x, foot.bottom.y)
      .stroke({ width: 4, color: 0x1b1511 });
  }
  shelfWrap.addChild(cabinet);

  for (const slot of locker.slots) {
    // Restrained wear from authoritative condition; unknown ids show no wear.
    const rawCond = state.gearConditions?.[slot.equipmentId];
    const wear = typeof rawCond === 'number' ? shelfConditionStyle(rawCond) : null;
    const faceTint = wear ? dimTint(slot.tint, wear.dim) : slot.tint;
    const fp = wear ? resolveRackFaceplate(slot.equipmentId, faceTint) : slot.faceplate;
    if (wear?.warn) {
      const warnLed = new Graphics();
      shelfWrap.addChild(warnLed);
      refs.statusLeds.push({
        g: warnLed,
        x: slot.quad.topRight.x - 3,
        y: slot.quad.topRight.y + 3,
        color: 0xef4444,
        radius: 1.4,
      });
    }
    const item = new Graphics();
    item.poly(lockerQuadPoints(slot.quad)).fill(fp.panel).stroke({ width: 1, color: fp.edge, alpha: 0.9 });
    const moduleScale = Math.min(slot.spriteMaxWidth, slot.spriteMaxHeight);
    for (const detail of fp.details) {
      if (detail.shape === 'circle') {
        const point = projectPointInLockerQuad(slot.quad, detail.x, detail.y);
        item.circle(point.x, point.y, (detail.radius ?? 0.04) * moduleScale)
          .fill({ color: detail.color, alpha: detail.alpha ?? 1 });
      } else {
        const u1 = detail.x + (detail.width ?? 0.1);
        const v1 = detail.y + (detail.height ?? 0.1);
        const detailQuad = {
          topLeft: projectPointInLockerQuad(slot.quad, detail.x, detail.y),
          topRight: projectPointInLockerQuad(slot.quad, u1, detail.y),
          bottomRight: projectPointInLockerQuad(slot.quad, u1, v1),
          bottomLeft: projectPointInLockerQuad(slot.quad, detail.x, v1),
        };
        item.poly(lockerQuadPoints(detailQuad)).fill({ color: detail.color, alpha: detail.alpha ?? 1 });
      }
    }
    shelfWrap.addChild(item);

    const tex = getEquipmentTexture(slot.equipmentId);
    if (tex) {
      const sprite = new Sprite(tex);
      const scale = Math.min(
        slot.spriteMaxWidth / Math.max(1, tex.width),
        slot.spriteMaxHeight / Math.max(1, tex.height),
      );
      sprite.scale.set(scale);
      sprite.anchor.set(0.5, 1);
      sprite.position.set(slot.spriteAnchor.x, slot.spriteAnchor.y);
      sprite.tint = faceTint;
      shelfWrap.addChild(sprite);
      refs.shelfItems.push({
        display: sprite,
        baseY: slot.spriteAnchor.y,
        baseRot: 0,
        phase: refs.shelfItems.length * 0.9,
        seated: true,
      });
      void ensureEquipmentTexture(slot.equipmentId);
    } else {
      refs.shelfItems.push({
        display: item,
        baseY: item.y,
        baseRot: 0,
        phase: refs.shelfItems.length * 0.9,
        seated: true,
      });
      void ensureEquipmentTexture(slot.equipmentId);
    }
  }
  const shelfHit = new Graphics();
  shelfHit.poly([q1.x, q1.y - 60, q2.x, q2.y - 60, q3.x, q3.y, q4.x, q4.y]).fill(0xffffff);
  addHotspot(root, 'shelf', shelfHit, shelfWrap, refs, onSelect);
  refs.hoverGlows['shelf']
    ?.poly([q1.x, q1.y - 60, q2.x, q2.y - 60, q3.x, q3.y, q4.x, q4.y])
    .stroke({ width: 3, color: 0xc77dff });
  {
    const shelfHintPoly = [q1.x, q1.y - 60, q2.x, q2.y - 60, q3.x, q3.y, q4.x, q4.y];
    const shelfHint = new Graphics();
    shelfHint.poly(shelfHintPoly).stroke({ width: 7, color: 0x0b0906, alpha: 0.5 });
    shelfHint.poly(shelfHintPoly).stroke({ width: 2.5, color: 0xd9a441, alpha: 0.88 });
    shelfHint.alpha = 0;
    shelfHint.eventMode = 'none';
    shelfHint.zIndex = Z.fx;
    refs.idleHints.shelf = shelfHint;
    refs.idleFocusPoints.shelf = {
      x: (q1.x + q3.x) / 2,
      y: (q1.y + q3.y) / 2 - 30,
    };
    root.addChild(shelfHint);
  }

  /* ---- Mixing console (center) ---------------------------------------- */
  const deskWrap = new Container();
  const deskH = 40;
  const consoleProfile = getConsoleProfile(tier);

  // Isometric point on the desk (or lifted above it)
  const dPt = (gx: number, gy: number, lift = deskH) => {
    const p = iso(gx, gy);
    return { x: p.x, y: p.y - lift };
  };

  const p1 = dPt(3.0, 3.5); // back-left
  const p2 = dPt(6.0, 3.5); // back-right
  const p3 = dPt(6.0, 5.0); // front-right
  const p4 = dPt(3.0, 5.0); // front-left

  const desk = new Graphics();
  // Main desk surface
  desk.poly([p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]).fill(consoleProfile.finish);
  // Front face (down-left)
  desk.poly([p4.x, p4.y, p3.x, p3.y, p3.x, p3.y + deskH, p4.x, p4.y + deskH]).fill(COLORS.deskSide);
  // Right face (down-right)
  desk.poly([p2.x, p2.y, p3.x, p3.y, p3.x, p3.y + deskH, p2.x, p2.y + deskH]).fill(COLORS.deskRight);

  // Padded leather armrest along the front edge
  const a1 = dPt(3.15, 4.85);
  const a2 = dPt(5.85, 4.85);
  const a3 = dPt(5.85, 5.0);
  const a4 = dPt(3.15, 5.0);
  desk.poly([a1.x, a1.y, a2.x, a2.y, a3.x, a3.y, a4.x, a4.y]).fill(consoleProfile.leatherRest);
  desk.poly([a4.x, a4.y, a3.x, a3.y, a3.x, a3.y + 4, a4.x, a4.y + 4]).fill(0x0e1116);

  // Hardwood side cheek end-panels
  const lCheekTop = [dPt(3.0, 3.5, deskH + 2), dPt(3.15, 3.5, deskH + 2), dPt(3.15, 5.0, deskH + 2), dPt(3.0, 5.0, deskH + 2)];
  desk.poly([lCheekTop[0].x, lCheekTop[0].y, lCheekTop[1].x, lCheekTop[1].y, lCheekTop[2].x, lCheekTop[2].y, lCheekTop[3].x, lCheekTop[3].y]).fill(consoleProfile.sideCheeks);
  desk.poly([lCheekTop[3].x, lCheekTop[3].y, lCheekTop[2].x, lCheekTop[2].y, lCheekTop[2].x, lCheekTop[2].y + deskH + 2, lCheekTop[3].x, lCheekTop[3].y + deskH + 2]).fill(0x1a120b);

  const rCheekTop = [dPt(5.85, 3.5, deskH + 2), dPt(6.0, 3.5, deskH + 2), dPt(6.0, 5.0, deskH + 2), dPt(5.85, 5.0, deskH + 2)];
  desk.poly([rCheekTop[0].x, rCheekTop[0].y, rCheekTop[1].x, rCheekTop[1].y, rCheekTop[2].x, rCheekTop[2].y, rCheekTop[3].x, rCheekTop[3].y]).fill(consoleProfile.sideCheeks);
  desk.poly([rCheekTop[1].x, rCheekTop[1].y, rCheekTop[2].x, rCheekTop[2].y, rCheekTop[2].x, rCheekTop[2].y + deskH + 2, rCheekTop[1].x, rCheekTop[1].y + deskH + 2]).fill(0x130d08);

  // Tier 5 gold pinstripe inlay
  if (tier >= 5) {
    const goldPinstripe = [dPt(3.18, 4.67, deskH + 1), dPt(5.82, 4.67, deskH + 1), dPt(5.82, 4.69, deskH + 1), dPt(3.18, 4.69, deskH + 1)];
    desk.poly([goldPinstripe[0].x, goldPinstripe[0].y, goldPinstripe[1].x, goldPinstripe[1].y, goldPinstripe[2].x, goldPinstripe[2].y, goldPinstripe[3].x, goldPinstripe[3].y]).fill(0xd4a553);
  }
  deskWrap.addChild(desk);

  // Meter Bridge (angled bridge at back of desk)
  const bridgeH = 14;
  const bridgeG = new Graphics();
  const mbTop = [
    dPt(3.22, 3.42, deskH + bridgeH),
    dPt(5.42, 3.42, deskH + bridgeH),
    dPt(5.42, 3.64, deskH + bridgeH),
    dPt(3.22, 3.64, deskH + bridgeH),
  ];
  bridgeG.poly([mbTop[0].x, mbTop[0].y, mbTop[1].x, mbTop[1].y, mbTop[2].x, mbTop[2].y, mbTop[3].x, mbTop[3].y]).fill(0x222834);
  const mbFront = [
    mbTop[3],
    mbTop[2],
    dPt(5.42, 3.68, deskH),
    dPt(3.22, 3.68, deskH),
  ];
  bridgeG.poly([mbFront[0].x, mbFront[0].y, mbFront[1].x, mbFront[1].y, mbFront[2].x, mbFront[2].y, mbFront[3].x, mbFront[3].y]).fill(0x141820);
  bridgeG.poly([mbTop[0].x, mbTop[0].y, mbTop[1].x, mbTop[1].y, mbTop[2].x, mbTop[2].y, mbTop[3].x, mbTop[3].y]).stroke({ width: 1, color: consoleProfile.trim });

  // VU Meters on the Meter Bridge face
  const numMeters = Math.min(consoleProfile.channels, 12);
  for (let i = 0; i < numMeters; i++) {
    const mgx = 3.30 + (i + 0.5) / numMeters * (5.34 - 3.30);
    const mBase = dPt(mgx, 3.68, deskH + 1);
    const mTopPt = dPt(mgx, 3.64, deskH + bridgeH - 1);
    const slotW = 3.5;
    if (tier === 1) {
      // Vintage amber backlit dial (needle drawn live by the ticker)
      bridgeG.rect(mBase.x - slotW / 2, mTopPt.y, slotW, mBase.y - mTopPt.y).fill(0xffeaa7);
      bridgeG.rect(mBase.x - slotW / 2, mTopPt.y, slotW, mBase.y - mTopPt.y).stroke({ width: 0.5, color: 0x3d3122 });
    } else {
      // Dark LED ladder slot
      bridgeG.rect(mBase.x - slotW / 2, mTopPt.y, slotW, mBase.y - mTopPt.y).fill(0x0c0f14);
    }
    const bar = new Graphics();
    deskWrap.addChild(bar);
    refs.vuBars.push({
      g: bar,
      x: mBase.x,
      y: mBase.y,
      color: tier === 1 ? 0x8a2323 : COLORS.gear[i % COLORS.gear.length],
      width: slotW,
      range: 9,
      needle: tier === 1,
      needleTopY: mTopPt.y,
    });
  }

  // DAW Displays
  if (consoleProfile.displays === 1) {
    // 1 Central Display
    const scL = dPt(4.02, 3.40, deskH + bridgeH + 2);
    const scR = dPt(4.62, 3.40, deskH + bridgeH + 2);
    const dispW = scR.x - scL.x;
    const dispH = 24;
    // Display frame
    bridgeG.roundRect(scL.x, scL.y - dispH, dispW, dispH, 2).fill(0x0f141d);
    bridgeG.roundRect(scL.x, scL.y - dispH, dispW, dispH, 2).stroke({ width: 1.5, color: 0x475569 });
    // Screen contents: glowing DAW tracks
    bridgeG.rect(scL.x + 2, scL.y - dispH + 2, dispW - 4, dispH - 4).fill(0x0a1622);
    for (let track = 0; track < 3; track++) {
      const trackColors = [0x38bdf8, 0x4ade80, 0xfbbf24];
      bridgeG.rect(scL.x + 5, scL.y - dispH + 4 + track * 6, dispW - 10 - (track % 2) * 6, 3).fill({ color: trackColors[track], alpha: 0.85 });
    }
    // Stand mount
    bridgeG.rect(scL.x + dispW / 2 - 2, scL.y, 4, 3).fill(0x334155);
  } else if (consoleProfile.displays === 2) {
    // 2 Displays
    for (let d = 0; d < 2; d++) {
      const gx1 = d === 0 ? 3.65 : 4.40;
      const gx2 = d === 0 ? 4.25 : 5.00;
      const scL = dPt(gx1, 3.40, deskH + bridgeH + 2);
      const scR = dPt(gx2, 3.40, deskH + bridgeH + 2);
      const dispW = scR.x - scL.x;
      const dispH = 24;
      bridgeG.roundRect(scL.x, scL.y - dispH, dispW, dispH, 2).fill(0x0f141d);
      bridgeG.roundRect(scL.x, scL.y - dispH, dispW, dispH, 2).stroke({ width: 1.5, color: 0x475569 });
      bridgeG.rect(scL.x + 2, scL.y - dispH + 2, dispW - 4, dispH - 4).fill(d === 0 ? 0x091b29 : 0x141026);
      for (let track = 0; track < 3; track++) {
        const c = d === 0 ? [0x38bdf8, 0x4ade80, 0xfbbf24][track] : [0xa855f7, 0xec4899, 0x06b6d4][track];
        bridgeG.rect(scL.x + 4, scL.y - dispH + 4 + track * 6, dispW - 8 - (track * 3), 3).fill({ color: c, alpha: 0.82 });
      }
      bridgeG.rect(scL.x + dispW / 2 - 2, scL.y, 4, 3).fill(0x334155);
    }
  }

  // Near-field studio monitors (speakers)
  if (tier === 1) {
    // 1 compact cube Auratone speaker on left
    const spL = dPt(3.22, 3.46, deskH + bridgeH + 1);
    bridgeG.roundRect(spL.x - 7, spL.y - 14, 14, 14, 1).fill(0x3e2c1e);
    bridgeG.roundRect(spL.x - 7, spL.y - 14, 14, 14, 1).stroke({ width: 1, color: 0x5a432f });
    bridgeG.circle(spL.x, spL.y - 7, 4.5).fill(0x1f1710);
    bridgeG.circle(spL.x, spL.y - 7, 2).fill(0x6e5238);
  } else {
    // Pair of studio monitors (Yamaha NS-10 style with white cones)
    const speakerCoords = [dPt(3.20, 3.46, deskH + bridgeH + 1), dPt(5.34, 3.46, deskH + bridgeH + 1)];
    for (const sp of speakerCoords) {
      bridgeG.roundRect(sp.x - 8, sp.y - 20, 16, 20, 2).fill(0x181c24);
      bridgeG.roundRect(sp.x - 8, sp.y - 20, 16, 20, 2).stroke({ width: 1.5, color: 0x3d4756 });
      // Tweeter
      bridgeG.circle(sp.x, sp.y - 15, 2).fill(0x475569);
      // Woofer with iconic white cone
      bridgeG.circle(sp.x, sp.y - 7, 5).fill(0xeeeae1);
      bridgeG.circle(sp.x, sp.y - 7, 2).fill(0x252c38);
    }
  }
  deskWrap.addChild(bridgeG);

  // Channel Strips on desk surface
  const channelG = new Graphics();
  for (let i = 0; i < consoleProfile.channels; i++) {
    const cgx = 3.30 + (i + 0.5) / consoleProfile.channels * (5.22 - 3.30);
    // Knobs (gain, 3-band EQ, pan)
    const gainPt = dPt(cgx, 3.82);
    channelG.circle(gainPt.x, gainPt.y, 1.9).fill(i % 2 ? 0xd93838 : 0x3b82f6);
    const eqHPt = dPt(cgx, 3.96);
    channelG.circle(eqHPt.x, eqHPt.y, 1.6).fill(0x2dd4bf);
    const eqMPt = dPt(cgx, 4.08);
    channelG.circle(eqMPt.x, eqMPt.y, 1.6).fill(0xf59e0b);
    const eqLPt = dPt(cgx, 4.20);
    channelG.circle(eqLPt.x, eqLPt.y, 1.6).fill(0xa855f7);
    const panPt = dPt(cgx, 4.32);
    channelG.circle(panPt.x, panPt.y, 1.5).fill(0xd1d5db);

    // Solo/Mute indicator dots — animate a subset so high channel counts stay cheap
    const soloPt = dPt(cgx - 0.02, 4.40);
    const mutePt = dPt(cgx + 0.02, 4.40);
    if (i % 2 === 0 && refs.statusLeds.length < 16) {
      const soloLed = new Graphics();
      const muteLed = new Graphics();
      deskWrap.addChild(soloLed);
      deskWrap.addChild(muteLed);
      refs.statusLeds.push({ g: soloLed, x: soloPt.x, y: soloPt.y, color: 0x22c55e, radius: 0.9 });
      refs.statusLeds.push({ g: muteLed, x: mutePt.x, y: mutePt.y, color: 0xef4444, radius: 0.9 });
    } else {
      channelG.circle(soloPt.x, soloPt.y, 0.9).fill({ color: 0x22c55e, alpha: 0.45 });
      channelG.circle(mutePt.x, mutePt.y, 0.9).fill({ color: 0xef4444, alpha: 0.35 });
    }

    // Fader groove line along isometric depth
    const fStart = dPt(cgx, 4.46);
    const fEnd = dPt(cgx, 4.65);
    channelG.poly([fStart.x - 0.8, fStart.y, fEnd.x - 0.8, fEnd.y, fEnd.x + 0.8, fEnd.y, fStart.x + 0.8, fStart.y]).fill(0x10141a);

    // Fader cap (metallic slider)
    const fGy = 4.49 + ((i * 7) % 5) * 0.032;
    const fCapPt = dPt(cgx, fGy);
    channelG.roundRect(fCapPt.x - 2.5, fCapPt.y - 1.5, 5, 3, 0.5).fill(0xe5e7eb);
    channelG.rect(fCapPt.x - 0.5, fCapPt.y - 1.5, 1, 3).fill(0x1f2937);
  }

  // Master Section on right side
  const masterFaderL = dPt(5.32, 4.57);
  const masterFaderR = dPt(5.40, 4.57);
  channelG.roundRect(masterFaderL.x - 2.5, masterFaderL.y - 1.5, 5, 3, 0.5).fill(0xef4444);
  channelG.roundRect(masterFaderR.x - 2.5, masterFaderR.y - 1.5, 5, 3, 0.5).fill(0xef4444);
  // Big Master Volume Knob
  const masterVol = dPt(5.36, 4.12);
  channelG.circle(masterVol.x, masterVol.y, 3.5).fill(0xd4d8e2);
  channelG.circle(masterVol.x, masterVol.y, 1.2).fill(0x475569);

  // Outboard Gear Rack / Tape Machine on far right
  if (tier === 1) {
    // Vintage reel-to-reel tape recorder in true isometric
    const tp1 = dPt(5.54, 4.05);
    const tp2 = dPt(5.80, 4.05);
    const tp3 = dPt(5.80, 4.58);
    const tp4 = dPt(5.54, 4.58);
    channelG.poly([tp1.x, tp1.y, tp2.x, tp2.y, tp3.x, tp3.y, tp4.x, tp4.y]).fill(0x242d3d);
    channelG.poly([tp1.x, tp1.y, tp2.x, tp2.y, tp3.x, tp3.y, tp4.x, tp4.y]).stroke({ width: 1, color: 0x475569 });
    // Tape reels
    const reel1 = dPt(5.64, 4.20);
    const reel2 = dPt(5.70, 4.42);
    if (renderer) {
      // Authored-frame reels: parked on frame 0 (static) until the transport runs
      const textures = buildReelTextures(renderer, 10);
      [reel1, reel2].forEach((pt) => {
        const reel = createReelSprite(textures);
        reel.position.set(pt.x, pt.y);
        reel.scale.set(0.45, 0.25); // iso squash to match the desk plane
        reel.gotoAndStop(0);
        channelG.addChild(reel);
        refs.reels.push(reel);
      });
    } else {
      channelG.ellipse(reel1.x, reel1.y, 4.5, 2.5).fill(0x718096);
      channelG.ellipse(reel1.x, reel1.y, 1.8, 1.0).fill(0x1a202c);
      channelG.ellipse(reel2.x, reel2.y, 4.5, 2.5).fill(0x718096);
      channelG.ellipse(reel2.x, reel2.y, 1.8, 1.0).fill(0x1a202c);
    }
  } else {
    // Outboard Rack modules
    for (let u = 0; u < consoleProfile.outboardUnits; u++) {
      const uGy1 = 4.02 + u * (0.62 / consoleProfile.outboardUnits);
      const uGy2 = uGy1 + 0.62 / consoleProfile.outboardUnits * 0.85;
      const r1 = dPt(5.54, uGy1);
      const r2 = dPt(5.80, uGy1);
      const r3 = dPt(5.80, uGy2);
      const r4 = dPt(5.54, uGy2);
      channelG.poly([r1.x, r1.y, r2.x, r2.y, r3.x, r3.y, r4.x, r4.y]).fill(0x1e2430);
      channelG.poly([r1.x, r1.y, r2.x, r2.y, r3.x, r3.y, r4.x, r4.y]).stroke({ width: 0.8, color: 0x475569 });
      // Status LEDs on rack unit (animated by the ticker)
      const ledPt = dPt(5.58, (uGy1 + uGy2) / 2);
      const led = new Graphics();
      deskWrap.addChild(led);
      refs.statusLeds.push({
        g: led,
        x: ledPt.x,
        y: ledPt.y,
        color: u % 2 === 0 ? 0x22c55e : 0xf59e0b,
        radius: 1.2,
      });
      const meterPt = dPt(5.66, (uGy1 + uGy2) / 2);
      channelG.rect(meterPt.x, meterPt.y - 1, 6, 2).fill(0x38bdf8);
    }
  }
  deskWrap.addChild(channelG);

  // Tiers 2-5 outboard deck (#81): tape machine reels, valve glow and status LEDs. Drawn on top of
  // the baked body so it shows with or without the Blender sprite; reels fall back to static
  // ellipses when there is no renderer. All of it is parked/static unless gearAttention allows spin.
  if (tier >= 2) {
    const gear = getConsoleTierGear(tier);
    const gearG = new Graphics();
    // No panel of its own: the reels, tubes and LEDs sit on the outboard rack modules drawn above.
    const deckReels = [dPt(5.64, 4.20), dPt(5.70, 4.42)];
    if (renderer) {
      const textures = buildReelTextures(renderer, 10);
      deckReels.forEach((pt) => {
        const reel = createReelSprite(textures);
        reel.position.set(pt.x, pt.y);
        reel.scale.set(gear.reelScale, gear.reelScale * 0.55);
        reel.tint = gear.reelTint;
        reel.gotoAndStop(0);
        gearG.addChild(reel);
        refs.reels.push(reel);
      });
    } else {
      deckReels.forEach((pt) => {
        gearG.ellipse(pt.x, pt.y, 4.5, 2.5).fill(0x718096);
        gearG.ellipse(pt.x, pt.y, 1.8, 1.0).fill(0x1a202c);
      });
    }
    for (let i = 0; i < gear.tubes; i++) {
      const tp = dPt(5.58 + i * 0.07, 4.09);
      const tube = new Graphics();
      tube.circle(0, 0, 2.6).fill({ color: 0xff9a3c, alpha: 0.35 });
      tube.circle(0, 0, 1.2).fill(0xffd08a);
      tube.position.set(tp.x, tp.y);
      tube.alpha = 0.35;
      gearG.addChild(tube);
      refs.gearTubes.push(tube);
    }
    for (let i = 0; i < gear.statusLeds; i++) {
      const lp = dPt(5.58 + i * (0.2 / Math.max(1, gear.statusLeds - 1 || 1)), 4.56);
      const led = new Graphics();
      led.circle(0, 0, 1.1).fill(0xffffff);
      led.tint = STATUS_LED_HEX.green;
      led.position.set(lp.x, lp.y);
      gearG.addChild(led);
      refs.gearLeds.push(led);
    }
    deskWrap.addChild(gearG);
  }

  // Desk interaction hit area and hover glow
  const deskHit = new Graphics();
  deskHit.poly([p1.x, p1.y - bridgeH - 18, p2.x, p2.y - bridgeH - 18, p3.x, p3.y + 4, p4.x, p4.y + 4]).fill(0xffffff);
  // The desk (and everything sitting on it) y-sorts with the staff at its front-left corner, so
  // staff standing behind it are hidden by it and staff in front of it draw over it.
  const deskZ = Z.depth + iso(3.0, 5.0).y;
  addHotspot(root, 'console', deskHit, deskWrap, refs, onSelect, deskZ);
  refs.hoverGlows['console']
    ?.poly([p1.x, p1.y - bridgeH - 18, p2.x, p2.y - bridgeH - 18, p3.x, p3.y + 4, p4.x, p4.y + 4])
    .stroke({ width: 3, color: 0x7bd389 });

  const consoleHint = new Graphics();
  const consoleHintPoly = [p1.x, p1.y - bridgeH - 20, p2.x, p2.y - bridgeH - 20, p3.x, p3.y + 6, p4.x, p4.y + 6];
  // Dark keyline under the coloured ring keeps the hint findable under every era / night tint.
  consoleHint.poly(consoleHintPoly).stroke({ width: 7, color: 0x0b0906, alpha: 0.55 });
  consoleHint.poly(consoleHintPoly).stroke({ width: 3.5, color: grade.accent, alpha: 0.95 });
  consoleHint.alpha = 0;
  consoleHint.eventMode = 'none';
  refs.idleHints.console = consoleHint;
  consoleHint.zIndex = Z.fx;
  refs.idleFocusPoints.console = {
    x: (p1.x + p3.x) / 2,
    y: (p1.y + p3.y) / 2 - bridgeH * 0.35,
  };
  root.addChild(consoleHint);
  const deskProps = buildDeskProps(deskH);
  deskProps.zIndex = deskZ;
  root.addChild(deskProps);

  // Listening candle table — lounge coffee hotspot + presentation
  {
    const candleTable = buildCandleTable();
    candleTable.zIndex = Z.depth + iso(6.55, 5.35).y;
    candleTable.eventMode = 'static';
    candleTable.cursor = 'pointer';
    candleTable.on('pointertap', () => {
      onSelect?.('shelf');
    });
    root.addChild(candleTable);
    refs.candleTable = candleTable;
    // Drink/mug only after brew_espresso — settle anim driven by the ticker
    const drink = buildCandleDrink();
    drink.zIndex = candleTable.zIndex + 1;
    refs.candleDrink = drink;
    refs.candleDrinkBaseY = drink.y;
    // If brew already complete on this rebuild, show settled (no re-drop)
    if (state.coffeeSteaming) {
      drink.visible = true;
      drink.alpha = 1;
    }
    root.addChild(drink);
    // Rider beers — opposite side of the candle from the brew mug
    const beers = buildCandleBeers();
    beers.zIndex = candleTable.zIndex + 1;
    refs.candleBeers = beers;
    if (state.riderBeers) {
      beers.visible = true;
      beers.alpha = 1;
    }
    root.addChild(beers);
  }

  /* ---- Studio phone (on the desk corner) ------------------------------ */
  const phoneWrap = new Container();
  const pPos = dPt(5.66, 3.58, deskH);
  const phone = new Graphics();
  // Isometric base quad for phone
  const ph1 = dPt(5.55, 3.48, deskH);
  const ph2 = dPt(5.77, 3.48, deskH);
  const ph3 = dPt(5.77, 3.68, deskH);
  const ph4 = dPt(5.55, 3.68, deskH);
  phone.poly([ph1.x, ph1.y, ph2.x, ph2.y, ph3.x, ph3.y, ph4.x, ph4.y]).fill(0xd94f4f);
  phone.poly([ph4.x, ph4.y, ph3.x, ph3.y, ph3.x, ph3.y + 5, ph4.x, ph4.y + 5]).fill(0x8f2f2f);
  // Phone receiver handset
  phone.roundRect(pPos.x - 7, pPos.y - 7, 14, 4, 1.5).fill(0x3b1515);
  phoneWrap.addChild(phone);

  const ring = new Graphics();
  ring.position.set(pPos.x, pPos.y - 3);
  ring.ellipse(0, 0, 18, 9).stroke({ width: 2, color: 0xffd166, alpha: 0.9 });
  refs.phoneRing = ring;
  phoneWrap.addChild(ring);

  const phoneHit = new Graphics();
  phoneHit.ellipse(pPos.x, pPos.y - 3, 24, 14).fill(0xffffff);
  addHotspot(root, 'phone', phoneHit, phoneWrap, refs, onSelect, deskZ);
  refs.hoverGlows['phone']
    ?.ellipse(pPos.x, pPos.y - 3, 22, 12)
    .stroke({ width: 3, color: 0xffd166 });

  const phoneHint = new Graphics();
  phoneHint.ellipse(pPos.x, pPos.y - 3, 24, 13).stroke({ width: 7, color: 0x0b0906, alpha: 0.55 });
  phoneHint.ellipse(pPos.x, pPos.y - 3, 24, 13).stroke({ width: 3.5, color: 0xffd166, alpha: 0.95 });
  phoneHint.alpha = 0;
  phoneHint.eventMode = 'none';
  refs.idleHints.phone = phoneHint;
  phoneHint.zIndex = Z.fx;
  refs.idleFocusPoints.phone = { x: pPos.x, y: pPos.y - 3 };
  root.addChild(phoneHint);

  /* ---- Staff / artist figures on the floor ---------------------------- */
  const spots = [
    iso(3.0, 5.6),
    iso(6.2, 4.6),
    iso(4.4, 2.4),
    iso(6.8, 6.2),
    iso(1.8, 3.2),
  ];
  const figureCount = Math.max(1, Math.min(spots.length, state.staffOnFloor));
  const seedBase = hashSeed(state.decorSeed ?? 'studio');
  for (let i = 0; i < figureCount; i++) {
    const spot = spots[i];
    const provided = state.floorFigures?.[i];
    const figure: FloorNpcFigure = provided ?? {
      identity: i === 0 ? state.producerAppearance : undefined,
      seed: seedBase + i * 97,
      role: i === 0 ? 'producer' : 'engineer',
      animState: state.hasActiveProject ? (i === 0 ? 'mixing' : 'working') : 'idle',
    };
    // Slot 0 is the player: prefer the career-start customisation over a seed fill-in.
    const npc = i === 0 && state.producerNpc ? state.producerNpc : resolveFloorNpcDefinition(figure, state.eraId, seedBase + i * 97);
    const visual = createFloorNpcVisual(npc, {
      renderer,
      atlas: npcAtlas,
      accent: grade.accent,
    });
    visual.display.position.set(spot.x, spot.y);
    visual.display.zIndex = Z.depth + spot.y;
    const activityCue = new Text({ text: '', style: { fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: 0xffffff, stroke: { color: 0x151b22, width: 3 } } });
    activityCue.anchor.set(0.5, 1);
    activityCue.position.set(0, -70);
    activityCue.eventMode = 'none';
    visual.display.addChild(activityCue);
    // Short station paths remain in each figure's floor lane; no simulated tasks or needs.
    const workSpots = [iso(3.0, 4.8), iso(5.7, 4.4), iso(3.5, 2.0), iso(6.1, 5.7), iso(2.3, 2.8)];
    const restSpots = [spot, iso(4.4, 6.7), iso(5.6, 6.8), iso(7.2, 6.5), iso(1.7, 4.0)];
    refs.staffFigures.push({
      fig: visual.display,
      baseX: spot.x,
      baseY: spot.y,
      stations: { home: spot, work: workSpots[i], rest: restSpots[i] },
      activityCue,
      animState: figure.animState ?? (state.hasActiveProject ? 'working' : 'idle'),
      destroy: visual.destroy,
    });
    if (i === 0) {
      // Tapping the player's own character opens the producer card (name, energy, task, quick actions).
      const d = visual.display;
      d.eventMode = 'static';
      d.cursor = 'pointer';
      d.hitArea = new Rectangle(-24, -70, 48, 78);
      const ring = new Graphics();
      ring.ellipse(0, 0, 22, 10).stroke({ width: 3, color: 0x0b0906, alpha: 0.5 });
      ring.ellipse(0, 0, 22, 10).stroke({ width: 1.8, color: 0xffe3a3, alpha: 0.95 });
      ring.position.set(spot.x, spot.y + 2);
      ring.zIndex = Z.depth + spot.y - 1;
      ring.alpha = 0;
      ring.eventMode = 'none';
      refs.hoverGlows.producer = ring;
      refs.hoverGlowTargets.producer = 0;
      root.addChild(ring);
      const emote = new Text({
        text: '♪',
        style: { fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: 16, fontWeight: '800', fill: 0xffe3a3, stroke: { color: 0x0b0906, width: 3 } },
      });
      emote.anchor.set(0.5, 1);
      emote.position.set(0, -76);
      emote.alpha = 0;
      emote.eventMode = 'none';
      d.addChild(emote);
      refs.producerEmote = emote;
      d.on('pointerover', () => { refs.hoverGlowTargets.producer = 1; });
      d.on('pointerout', () => { refs.hoverGlowTargets.producer = 0; });
      d.on('pointertap', () => {
        refs.producerTapAt = performance.now();
        onSelect?.('producer');
      });
    }
    root.addChild(visual.display);
  }

  /* ---- Booked artist: enters via the door, stands at the live-room mic ---- */
  {
    const spot = iso(2.3, 1.55);
    refs.artistStand = spot;
    const artistNpc = resolveFloorNpcDefinition(
      {
        seed: seedBase + 777,
        role: 'artist',
        name: state.artistName,
        animState: 'recording',
      },
      state.eraId,
      seedBase + 777,
    );
    const visual = createFloorNpcVisual(artistNpc, {
      renderer,
      atlas: npcAtlas,
      accent: 0xc2414b,
    });
    visual.display.position.set(spot.x, spot.y);
    const tag = new Text({
      text: '',
      style: { fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontSize: 11, fontWeight: '700', fill: 0xffe3a3, stroke: { color: 0x0b0906, width: 3 } },
    });
    tag.anchor.set(0.5, 1);
    tag.position.set(0, -66);
    tag.eventMode = 'none';
    visual.display.addChild(tag);
    // Band character shares the live-room → session work route (StudioRoom.handleHotspot).
    visual.display.eventMode = 'static';
    visual.display.cursor = 'pointer';
    visual.display.hitArea = new Rectangle(-28, -72, 56, 80);
    visual.display.on('pointertap', () => { onSelect?.('liveRoom'); });
    visual.display.visible = false;
    visual.display.zIndex = Z.depth + spot.y;
    refs.artist = {
      fig: visual.display,
      baseY: spot.y,
      baseX: spot.x,
      animState: 'recording',
      tag,
      shown: '',
      destroy: visual.destroy,
    };
    root.addChild(visual.display);
  }

  root.sortableChildren = true;

  /* ---- Tier upgrade furniture (bead ifx.3) ---------------------------- */
  // Each ProgressionSystem milestone visibly adds/replaces studio furniture.
  if (tier >= 2) {
    const upgrades = new Graphics();
    // Potted plant in the back-left corner
    const plantBase = iso(0.55, 1.5);
    if (!kitTextures) {
      upgrades.ellipse(plantBase.x, plantBase.y, 12, 6).fill(0x1c2433);
      upgrades.rect(plantBase.x - 8, plantBase.y - 16, 16, 16).fill(0x7a4a2b);
      upgrades.circle(plantBase.x, plantBase.y - 30, 16).fill(0x3f7d4f);
      upgrades.circle(plantBase.x - 10, plantBase.y - 24, 10).fill(0x4f9a5f);
      upgrades.circle(plantBase.x + 10, plantBase.y - 26, 11).fill(0x357044);
    }
    upgrades.zIndex = Z.depth + plantBase.y;
    root.addChild(upgrades);
  }

  if (tier >= 3) {
    const lounge = new Graphics();
    // Green-room sofa along the front-right corner
    const sofa = iso(6.0, 5.6);
    if (!kitTextures) {
      lounge.roundRect(sofa.x - 26, sofa.y - 26, 52, 24, 6).fill(0x5b3f6e);
      lounge.roundRect(sofa.x - 26, sofa.y - 34, 52, 12, 5).fill(0x6d4c85);
      lounge.rect(sofa.x - 22, sofa.y - 2, 6, 6).fill(0x2a1f33);
      lounge.rect(sofa.x + 16, sofa.y - 2, 6, 6).fill(0x2a1f33);
    }
    lounge.zIndex = Z.depth + sofa.y;
    root.addChild(lounge);
    // Road case next to the console (its own node so it sorts by its own depth)
    const roadCase = new Graphics();
    const rc = iso(4.9, 2.4);
    roadCase.rect(rc.x - 14, rc.y - 22, 28, 22).fill(0x38414f);
    roadCase.rect(rc.x - 14, rc.y - 22, 28, 6).fill(0x4c5769);
    roadCase.rect(rc.x - 14, rc.y - 11, 28, 3).fill(0x232a36);
    roadCase.zIndex = Z.depth + rc.y;
    root.addChild(roadCase);
  }

  if (tier >= 4) {
    const pro = new Graphics();
    // Second workstation rig
    const rig = iso(7.0, 3.2);
    if (!kitTextures) {
      pro.rect(rig.x - 16, rig.y - 34, 32, 34).fill(0x2a221c);
      pro.rect(rig.x - 12, rig.y - 29, 24, 16).fill(grade.accent);
      pro.rect(rig.x - 16, rig.y - 34, 32, 34).stroke({ width: 2, color: 0x120d09 });
    }
    pro.zIndex = Z.depth + rig.y;
    root.addChild(pro);
  }

  if (tier >= 5) {
    const empire = new Graphics();
    // Gold trim around the whole floor: the room reads as "hit factory"
    isoQuad(empire, 0, 0, ROOM_W, ROOM_D);
    empire.stroke({ width: 4, color: 0xd9a441 });
    // Trophy wall — second and third gold records
    [4.6, 5.6].forEach((yTile, idx) => {
      const f = iso(7.7, yTile);
      const ry = f.y - 70 - idx * 30;
      empire.rect(f.x - 10, ry - 10, 20, 20).fill(0x2a1f0d);
      empire.rect(f.x - 10, ry - 10, 20, 20).stroke({ width: 2, color: 0xffd166 });
      empire.circle(f.x, ry, 6).fill(0xffd166);
    });
    // Neon strip lives in buildDecorLights (era lighting kit) once tier unlocks it.
    root.addChild(empire);
  }

  /* ---- Additive lighting: window shaft, motes, lamp pools, era glow ------- */
  lights.container.zIndex = Z.fx;
  root.addChild(lights.container);

  /* ---- Screen-space backdrop behind the room ---------------------------- */
  const underlayRoot = buildUnderlay(width, height, { x: width / 2, y: (topInset + height - bottomInset) / 2 }, fitScale);

  /* ---- Screen-space Post-FX container (unaffected by camera pan/zoom) --- */
  const overlayRoot = new Container();
  overlayRoot.eventMode = 'none';
  overlayRoot.position.set(0, 0);

  /* ---- Day/night + era tint overlay (screen space, on top) ------------ */
  const tintLayer = new Container();
  const tintRect = new Graphics();
  tintRect.rect(0, 0, width, height).fill(grade.tint);
  tintLayer.addChild(tintRect);
  tintLayer.alpha = 0;
  tintLayer.eventMode = 'none';
  refs.nightTintLayer = tintLayer;
  overlayRoot.addChild(tintLayer);

  /* ---- CRT scanlines & Vignette Post-FX layers (screen space) ------------ */
  const vignetteLayer = new Container();
  vignetteLayer.eventMode = 'none';
  {
    const vc = postFxTuning.vignetteColor;
    const css = (a: number) => `rgba(${(vc >> 16) & 255}, ${(vc >> 8) & 255}, ${vc & 255}, ${a})`;
    const edge = Math.min(0.55, postFxTuning.vignetteAlpha * 2.6);
    const sprite = radialGradientSprite(width * 1.5, height * 1.5, [
      [0, css(0)],
      [0.55, css(0)],
      [0.82, css(edge * 0.55)],
      [1, css(edge)],
    ]);
    if (sprite) {
      sprite.anchor.set(0.5);
      sprite.position.set(width / 2, height / 2);
      vignetteLayer.addChild(sprite);
    }
  }
  refs.vignetteLayer = vignetteLayer;
  overlayRoot.addChild(vignetteLayer);

  const crtLayer = new Container();
  crtLayer.eventMode = 'none';
  if (postFxTuning.scanlineAlpha > 0) {
    const crtG = new Graphics();
    const pitch = postFxTuning.scanlinePitch;
    for (let y = 0; y < height; y += pitch) {
      crtG.rect(0, y, width, 1.0).fill({ color: 0x000000, alpha: postFxTuning.scanlineAlpha });
    }
    crtLayer.addChild(crtG);
  }
  refs.crtLayer = crtLayer;
  overlayRoot.addChild(crtLayer);

  /* ---- Emissive Bloom & Glow Layer (world space, additive blend) ------------ */
  const bloomLayer = new Container();
  bloomLayer.eventMode = 'none';
  bloomLayer.blendMode = 'add';
  const tubeFilter = createTubeGlowFilter();
  if (tubeFilter) {
    bloomLayer.filters = [tubeFilter.filter];
    refs.tubeGlowFilter = tubeFilter;
  }
  const dynamicBloomG = new Graphics();
  bloomLayer.addChild(dynamicBloomG);
  refs.dynamicBloomG = dynamicBloomG;
  refs.bloomLayer = bloomLayer;
  bloomLayer.zIndex = Z.fx;
  root.addChild(bloomLayer);

  return { root, underlayRoot, overlayRoot, refs, basePosition: { x: originX, y: originY }, baseScale: fitScale };
};

/**
 * Scene for the extra rooms (#248): same Pixi Application, same camera/fit rules and hotspot plumbing as
 * Studio A, but the floor, walls and props come from a data-driven RoomLayoutProfile.
 */
const buildRoomScene = (
  profile: RoomLayoutProfile,
  width: number,
  height: number,
  state: StudioSceneState,
  onSelect?: (id: StudioHotspotId) => void,
  renderer?: Renderer | null,
  npcAtlas?: LoadedAtlas | null,
): BuiltScene => {
  const refs = createSceneRefs();
  const eraGrade = getEraGrade(state.eraId);
  const grade = { ...eraGrade, ...cityWallColors(eraGrade.wallLeft, eraGrade.wallRight, state.cityId) };
  const built = buildRoomLayoutScene(profile, {
    occupied: Boolean(state.roomOccupied),
    seed: state.decorSeed ?? 'studio',
    cityId: state.cityId,
    tint: { wallLeft: grade.wallLeft, wallRight: grade.wallRight, accent: grade.accent },
    addHotspot: (id, hit, visual, zIndex, parent) => addHotspot(parent, id, hit, visual, refs, onSelect, zIndex),
    clockMinutes: state.clockMinutes ?? getWallClockTime(state.day, 0).minutesOfDay,
    depthBase: Z.depth,
  });
  const { bounds } = built;
  const topInset = width <= 540 ? 116 : 68;
  const bottomInset = height < 500 ? 96 : 160;
  const view = computeRoomView(profile, bounds, { width, height, topInset, bottomInset });
  const fitScale = view.scale;
  const originX = view.x;
  const originY = view.y;
  built.root.scale.set(fitScale);
  built.root.position.set(originX, originY);

  // Window + day/night: same clock-driven refs Studio A uses, so the shared ticker keeps them live.
  refs.windowView = built.windowView;
  refs.setWindowSky = built.setWindowSky;

  // Per-room idle camera targets and hint rings on this room's hotspots.
  for (const spec of profile.props) {
    const id = spec.hotspot;
    if (id !== 'console' && id !== 'liveRoom' && id !== 'shelf') continue;
    const m = PROP_METRICS[spec.kind];
    const c = iso(spec.x, spec.y);
    const rx = Math.max(m.w, m.d) * 30 + 12;
    const hint = new Graphics();
    hint.ellipse(c.x, c.y + 2, rx, rx * 0.5).stroke({ width: 7, color: 0x0b0906, alpha: 0.5 });
    hint.ellipse(c.x, c.y + 2, rx, rx * 0.5).stroke({ width: 2.5, color: 0xd9a441, alpha: 0.88 });
    hint.alpha = 0;
    hint.eventMode = 'none';
    hint.zIndex = Z.fx;
    refs.idleHints[id] = hint;
    refs.idleFocusPoints[id] = { x: c.x, y: c.y - m.h / 2 };
    built.root.addChild(hint);
  }

  // People: producer + crew on the room's staff spots, booked artist at the room's mic.
  const figures = buildRoomFigures({
    profile,
    parent: built.root,
    depthBase: Z.depth,
    renderer,
    atlas: npcAtlas,
    eraId: state.eraId,
    accent: grade.accent,
    decorSeed: state.decorSeed ?? 'studio',
    staffOnFloor: state.staffOnFloor,
    hasActiveProject: Boolean(state.roomOccupied && state.hasActiveProject),
    floorFigures: state.floorFigures,
    producerNpc: state.producerNpc,
    producerAppearance: state.producerAppearance,
    artistName: state.artistName,
    onSelect,
  });
  refs.staffFigures = figures.staff;
  refs.artist = figures.artist;
  refs.artistStand = figures.artistStand;
  refs.doorFloor = figures.doorFloor;

  const underlayRoot = buildUnderlay(width, height, { x: width / 2, y: (topInset + height - bottomInset) / 2 }, fitScale);
  const overlayRoot = new Container();
  overlayRoot.eventMode = 'none';
  // Night tint over the whole canvas, driven by the studio clock like Studio A's.
  const tintLayer = new Container();
  tintLayer.addChild(new Graphics().rect(0, 0, width, height).fill(grade.tint));
  tintLayer.alpha = 0;
  tintLayer.eventMode = 'none';
  refs.nightTintLayer = tintLayer;
  overlayRoot.addChild(tintLayer);
  return { root: built.root, underlayRoot, overlayRoot, refs, basePosition: { x: originX, y: originY }, baseScale: fitScale, tick: built.tick };
};

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */
const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ state, onHotspotSelect, className, resetCameraKey, onHotspotAnchors, onFirstFrame }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<BuiltScene | null>(null);
  const kitTexturesRef = useRef<StudioKitTextures | null>(null);
  const npcAtlasRef = useRef<LoadedAtlas | null>(null);
  const stateRef = useRef<StudioSceneState>({ ...DEFAULT_STATE, ...state });
  const selectRef = useRef(onHotspotSelect);
  const anchorsCbRef = useRef(onHotspotAnchors);
  const firstFrameRef = useRef(onFirstFrame);
  const firstFrameFiredRef = useRef(false);
  const fireFirstFrame = () => {
    if (firstFrameFiredRef.current) return;
    firstFrameFiredRef.current = true;
    firstFrameRef.current?.();
  };
  const lastAnchorsRef = useRef<HotspotAnchors>({});
  const timeRef = useRef(0);
  const roomKeyRef = useRef('project-studio');
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const idleCameraRef = useRef({
    mode: 'idle' as 'idle' | 'focusing' | 'restoring',
    saved: { x: 0, y: 0, zoom: 1.0 } as CameraPose,
    targetId: null as StudioHotspotId | null,
  });
  const gestureRef = useRef(new Map<number, { x: number; y: number }>());
  const suppressTapRef = useRef(false);
  const gestureMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const lastCanvasInputRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const reelKeyRef = useRef('');
  const clockMinuteRef = useRef(-1);
  const windowSkyRef = useRef(-1);
  /** Seconds into candle-drink settle; -1 = hidden / idle settled. */
  const drinkSettleRef = useRef(-1);
  const coffeeWasSteamingRef = useRef(false);
  const clientTransitRef = useRef<ClientTransitState>(
    createClientTransitState(Boolean(state?.hasActiveProject)),
  );
  const shelfPrefetchKeyRef = useRef('');

  const { settings } = useSettings();
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    const app = appRef.current;
    if (app && app.renderer) {
      // Hard-cap the ticker so 90/120Hz phones don't wake the GPU every vsync (0 = uncapped)
      app.ticker.maxFPS = settings.targetFps > 0 ? settings.targetFps : 0;
      const dpr = window.devicePixelRatio || 1;
      const effectiveRes = calculateEffectiveResolution(dpr, settings.resolutionScale);
      if (Math.abs(app.renderer.resolution - effectiveRes) > 0.01) {
        app.renderer.resolution = effectiveRes;
        app.renderer.resize(app.screen.width, app.screen.height);
      }
    }
    const sc = sceneRef.current;
    if (sc) {
      if (sc.refs.crtLayer) sc.refs.crtLayer.visible = Boolean(settings.crtScanlines);
      if (sc.refs.tvWrap && sc.refs.tvCrtFilter) {
        sc.refs.tvWrap.filters = settings.crtScanlines ? [sc.refs.tvCrtFilter.filter] : [];
      }
      if (sc.refs.vignetteLayer) sc.refs.vignetteLayer.visible = Boolean(settings.analogTapeWarmth);
      if (sc.refs.bloomLayer) sc.refs.bloomLayer.visible = Boolean(settings.bloomAndGlow);
    }
  }, [settings]);

  // Keep the latest props in refs so the ticker/callbacks never go stale
  useEffect(() => {
    stateRef.current = { ...DEFAULT_STATE, ...state };
  }, [state]);

  useEffect(() => {
    selectRef.current = onHotspotSelect;
  }, [onHotspotSelect]);

  useEffect(() => {
    anchorsCbRef.current = onHotspotAnchors;
  }, [onHotspotAnchors]);

  useEffect(() => {
    firstFrameRef.current = onFirstFrame;
  }, [onFirstFrame]);

  useEffect(() => {
    idleCameraRef.current = {
      mode: 'idle',
      saved: { x: 0, y: 0, zoom: 1.0 },
      targetId: null,
    };
    cameraRef.current = { x: 0, y: 0, zoom: 1.0 };
    const sc = sceneRef.current;
    if (sc) {
      sc.root.scale.set(sc.baseScale);
      sc.root.position.set(sc.basePosition.x, sc.basePosition.y);
    }
  }, [resetCameraKey]);

  // Structural key: only layout-affecting state triggers a scene rebuild
  const gearKey = shelfStructuralKey(state?.ownedEquipmentIds, state?.ownedEquipment ?? 0);
  const floorKey = (state?.floorFigures ?? [])
    .map((f) => `${f.identity?.seed ?? f.seed ?? ''}:${f.role ?? ''}`)
    .join(',');
  const producerLookKey = state?.producerNpc
    ? [state.producerNpc.hair.shape, state.producerNpc.hair.colour, state.producerNpc.body.build, state.producerNpc.clothes.topPrimaryHex, state.producerNpc.clothes.top, state.producerNpc.details.headwear ?? '', state.producerNpc.details.headphones ? 1 : 0, state.producerNpc.details.glasses, state.producerNpc.details.jewellery].join(':')
    : '';
  const structuralKey = `${JSON.stringify(state?.producerAppearance ?? null)}|${producerLookKey}|${floorKey}|${state?.staffOnFloor ?? 1}|${gearKey}|${gearConditionKey(state?.gearConditions)}|${state?.eraId ?? 'analog60s'}|${state?.roomTier ?? 1}|${state?.premisesTier ?? 0}|${state?.premisesArchetype ?? ''}|${(state?.pendingCases ?? []).join(',')}|${trophyKey(state?.trophies ?? { covers: [] })}|${state?.decorSeed ?? 'studio'}|${state?.roomType ?? 'project-studio'}|${state?.roomOccupied ? 1 : 0}|${(state?.furnishings ?? []).map((f) => `${f.anchorId}=${f.itemId}`).join(',')}`;

  // Rebuild the room (new window size or layout change)
  const rebuild = () => {
    const app = appRef.current;
    if (!app) return;
    if (sceneRef.current) {
      sceneRef.current.refs.staffFigures.forEach((f) => f.destroy());
      sceneRef.current.refs.artist?.destroy();
      app.stage.removeChild(sceneRef.current.underlayRoot);
      sceneRef.current.underlayRoot.destroy({ children: true });
      app.stage.removeChild(sceneRef.current.root);
      sceneRef.current.root.destroy({ children: true });
      if (sceneRef.current.overlayRoot) {
        app.stage.removeChild(sceneRef.current.overlayRoot);
        sceneRef.current.overlayRoot.destroy({ children: true });
      }
    }
    const onSelectHotspot = (id: StudioHotspotId) => {
      // Skip in-flight door walk so selection never feels blocked
      if (isClientTransitAnimating(clientTransitRef.current)) {
        clientTransitRef.current = skipClientTransit(
          clientTransitRef.current,
          Boolean(stateRef.current.hasActiveProject),
        );
      }
      if (!suppressTapRef.current) selectRef.current?.(id);
    };
    // Switching rooms swaps the scene on this same Application; the camera starts fresh for each room.
    const roomProfile = getRoomLayoutProfile(stateRef.current.roomType);
    const roomKey = roomProfile?.type ?? 'project-studio';
    if (roomKeyRef.current !== roomKey) {
      roomKeyRef.current = roomKey;
      // Snap the artist transit to the destination room's session status (no walk-out on room switch).
      const destSession = Boolean(
        stateRef.current.hasActiveProject && (roomKey === 'project-studio' || stateRef.current.roomOccupied),
      );
      clientTransitRef.current = createClientTransitState(destSession);
      cameraRef.current = { x: 0, y: 0, zoom: 1.0 };
      idleCameraRef.current = { mode: 'idle', saved: { x: 0, y: 0, zoom: 1.0 }, targetId: null };
      lastAnchorsRef.current = {};
    }
    const scene = roomProfile
      ? buildRoomScene(roomProfile, app.screen.width, app.screen.height, stateRef.current, onSelectHotspot, app.renderer, npcAtlasRef.current)
      : buildScene(
          app.screen.width,
          app.screen.height,
          stateRef.current,
          onSelectHotspot,
          app.renderer,
          kitTexturesRef.current,
          npcAtlasRef.current,
        );
    reelKeyRef.current = '';
    const zoom = cameraRef.current.zoom ?? 1.0;
    scene.root.scale.set(scene.baseScale * zoom);
    scene.root.position.set(
      scene.basePosition.x + cameraRef.current.x,
      scene.basePosition.y + cameraRef.current.y,
    );
    if (settingsRef.current) {
      if (scene.refs.crtLayer) scene.refs.crtLayer.visible = Boolean(settingsRef.current.crtScanlines);
      if (scene.refs.tvWrap && scene.refs.tvCrtFilter) {
        scene.refs.tvWrap.filters = settingsRef.current.crtScanlines ? [scene.refs.tvCrtFilter.filter] : [];
      }
      if (scene.refs.vignetteLayer) scene.refs.vignetteLayer.visible = Boolean(settingsRef.current.analogTapeWarmth);
      if (scene.refs.bloomLayer) scene.refs.bloomLayer.visible = Boolean(settingsRef.current.bloomAndGlow);
    }
    app.stage.addChild(scene.underlayRoot);
    app.stage.addChild(scene.root);
    if (scene.overlayRoot) {
      app.stage.addChild(scene.overlayRoot);
    }
    sceneRef.current = scene;
    app.canvas.dataset.studioArt = kitTexturesRef.current ? 'cc0-v1' : 'built-in';
    // Keep brew-drink settle in sync across rebuilds (no re-drop if already brewed today)
    coffeeWasSteamingRef.current = Boolean(stateRef.current.coffeeSteaming);
    drinkSettleRef.current = stateRef.current.coffeeSteaming ? CANDLE_DRINK_SETTLE_SEC : -1;

    // Soft-upgrade coloured bars → sprites once PNG art resolves (one shot per gear set)
    const ids = stateRef.current.ownedEquipmentIds ?? [];
    const prefetchKey = ids.join('|');
    if (prefetchKey && shelfPrefetchKeyRef.current !== prefetchKey) {
      void prefetchEquipmentTextures(ids).then(() => {
        if (shelfPrefetchKeyRef.current === prefetchKey) return;
        shelfPrefetchKeyRef.current = prefetchKey;
        rebuild();
      });
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let releasePixiClaim: (() => void) | null = null;
    let lastW = 0;
    let lastH = 0;
    let detachInteractions: (() => void) | undefined;
    let gestureDistance: number | null = null;
    let lastGestureScale = 1;

    const MIN_ZOOM = 0.75;
    const MAX_ZOOM = 2.6;
    const osReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const readReduceMotion = () =>
      osReduceMotion || Boolean(settingsRef.current?.reducedMotion);

    const applyCameraPose = (pose: CameraPose) => {
      const app = appRef.current;
      const scene = sceneRef.current;
      if (!app || !scene) return;
      const clamped = {
        ...pose,
        zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pose.zoom)),
      };
      const limitX = Math.max(app.screen.width * 0.35, app.screen.width * clamped.zoom * 0.5);
      const limitY = Math.max(app.screen.height * 0.35, app.screen.height * clamped.zoom * 0.5);
      clamped.x = Math.max(-limitX, Math.min(limitX, clamped.x));
      clamped.y = Math.max(-limitY, Math.min(limitY, clamped.y));
      cameraRef.current = clamped;
      scene.root.scale.set(scene.baseScale * clamped.zoom);
      scene.root.position.set(
        scene.basePosition.x + clamped.x,
        scene.basePosition.y + clamped.y,
      );
    };

    const beginIdleCameraRestore = () => {
      if (idleCameraRef.current.mode !== 'focusing') return;
      idleCameraRef.current.mode = 'restoring';
      idleCameraRef.current.targetId = null;
    };

    const cancelIdleCamera = () => {
      idleCameraRef.current.mode = 'idle';
      idleCameraRef.current.targetId = null;
    };

    const zoomAt = (clientX: number, clientY: number, factor: number) => {
      const app = appRef.current;
      const scene = sceneRef.current;
      if (!app || !scene || !Number.isFinite(factor) || factor <= 0) return;
      cancelIdleCamera();

      const currentZoom = cameraRef.current.zoom ?? 1.0;
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * factor));
      if (Math.abs(nextZoom - currentZoom) < 0.001) return;

      const rect = app.canvas.getBoundingClientRect();
      const focalX = clientX - rect.left;
      const focalY = clientY - rect.top;

      const scaleRatio = nextZoom / currentZoom;
      const currentRootX = scene.root.position.x;
      const currentRootY = scene.root.position.y;

      const newRootX = focalX - (focalX - currentRootX) * scaleRatio;
      const newRootY = focalY - (focalY - currentRootY) * scaleRatio;

      let nextX = newRootX - scene.basePosition.x;
      let nextY = newRootY - scene.basePosition.y;

      const limitX = Math.max(app.screen.width * 0.35, app.screen.width * nextZoom * 0.5);
      const limitY = Math.max(app.screen.height * 0.35, app.screen.height * nextZoom * 0.5);
      nextX = Math.max(-limitX, Math.min(limitX, nextX));
      nextY = Math.max(-limitY, Math.min(limitY, nextY));

      cameraRef.current.zoom = nextZoom;
      cameraRef.current.x = nextX;
      cameraRef.current.y = nextY;

      scene.root.scale.set(scene.baseScale * nextZoom);
      scene.root.position.set(scene.basePosition.x + nextX, scene.basePosition.y + nextY);
    };

    const panBy = (dx: number, dy: number) => {
      const app = appRef.current;
      const scene = sceneRef.current;
      if (!app || !scene) return;
      cancelIdleCamera();
      const zoom = cameraRef.current.zoom ?? 1.0;
      const limitX = Math.max(app.screen.width * 0.35, app.screen.width * zoom * 0.5);
      const limitY = Math.max(app.screen.height * 0.35, app.screen.height * zoom * 0.5);
      cameraRef.current.x = Math.max(-limitX, Math.min(limitX, cameraRef.current.x + dx));
      cameraRef.current.y = Math.max(-limitY, Math.min(limitY, cameraRef.current.y + dy));
      scene.root.position.set(
        scene.basePosition.x + cameraRef.current.x,
        scene.basePosition.y + cameraRef.current.y,
      );
    };

    const boot = async () => {
      try {
        releasePixiClaim = claimPixiApplication(STUDIO_FLOOR_OWNER);
        const app = new Application();
        const initialRes = calculateEffectiveResolution(
          window.devicePixelRatio || 1,
          settingsRef.current?.resolutionScale
        );
        const rendererOrder = await resolveRendererOrder();
        await app.init({
          preference: rendererOrder[0],
          background: 0x0e0c0a,
          resizeTo: container,
          antialias: !(typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches),
          autoDensity: true,
          powerPreference: 'high-performance',
          resolution: initialRes,
        });
        if (disposed) {
          app.destroy(true, { children: true });
          releasePixiClaim?.();
          return;
        }
        appRef.current = app;
        container.appendChild(app.canvas);
        app.canvas.id = 'pixi-studio-canvas';
        app.canvas.setAttribute('data-engine', 'pixi');
        app.canvas.setAttribute('data-renderer', String(app.renderer.name ?? 'unknown'));
        app.canvas.style.touchAction = 'none';
        app.canvas.setAttribute('aria-label', 'Interactive studio floor. Tap objects to inspect. Pinch to zoom or use two fingers to pan.');
        await loadPropSprites();
        if (disposed) {
          app.destroy(true, { children: true });
          return;
        }
        lastW = app.screen.width;
        lastH = app.screen.height;
        rebuild();
        // Reveal GUI + 3D together: notify once the first frame is on screen.
        try {
          app.ticker.addOnce(() => {
            if (!disposed) fireFirstFrame();
          });
        } catch {
          if (!disposed) fireFirstFrame();
        }
        void loadStudioKit().then(textures => {
          if (disposed || !textures) return;
          kitTexturesRef.current = textures;
          rebuild();
        });
        void loadNpcPartsAtlas().then(atlas => {
          if (disposed || !atlas) return;
          npcAtlasRef.current = atlas;
          rebuild();
        });

        const markCanvasInput = () => {
          lastCanvasInputRef.current = performance.now();
          const hints = sceneRef.current?.refs.idleHints;
          if (hints) {
            (Object.keys(hints) as IdleDirectionHotspot[]).forEach((id) => {
              const hint = hints[id];
              if (hint) hint.alpha = 0;
            });
          }
          beginIdleCameraRestore();
        };
        markCanvasInput();

        const midpoint = () => {
          const pointers = [...gestureRef.current.values()];
          return { x: (pointers[0].x + pointers[1].x) / 2, y: (pointers[0].y + pointers[1].y) / 2 };
        };
        // Touch: one-finger drag pans (after a 10px slop so taps on hotspots still select); double-tap resets the camera.
        let touchDrag: { id: number; x: number; y: number; moved: boolean } | null = null;
        let lastTap = { t: 0, x: 0, y: 0 };
        const resetCamera = () => {
          cancelIdleCamera();
          idleCameraRef.current.saved = { x: 0, y: 0, zoom: 1.0 };
          applyCameraPose({ x: 0, y: 0, zoom: 1.0 });
        };
        const skipDoorTransit = () => {
          if (!isClientTransitAnimating(clientTransitRef.current)) return;
          clientTransitRef.current = skipClientTransit(
            clientTransitRef.current,
            Boolean(stateRef.current.hasActiveProject),
          );
        };
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
            if (isClientTransitAnimating(clientTransitRef.current)) {
              event.preventDefault();
              skipDoorTransit();
            }
          }
        };
        const onPointerDown = (event: PointerEvent) => {
          markCanvasInput();
          skipDoorTransit();
          if (gestureRef.current.size === 0) suppressTapRef.current = false;
          gestureRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          touchDrag = event.pointerType !== 'mouse' && gestureRef.current.size === 1
            ? { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }
            : null;
          if (gestureRef.current.size === 2) {
            suppressTapRef.current = true;
            gestureMidpointRef.current = midpoint();
            const pointers = [...gestureRef.current.values()];
            gestureDistance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
            try {
              app.canvas.setPointerCapture(event.pointerId);
            } catch {
              // ponytail: keep pan local when capture is unavailable.
            }
          }
        };
        const onPointerMove = (event: PointerEvent) => {
          markCanvasInput();
          if (!gestureRef.current.has(event.pointerId)) return;
          gestureRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (gestureRef.current.size === 1 && touchDrag && touchDrag.id === event.pointerId) {
            const dx = event.clientX - touchDrag.x;
            const dy = event.clientY - touchDrag.y;
            if (!touchDrag.moved && Math.hypot(dx, dy) < 10) return;
            touchDrag.moved = true;
            suppressTapRef.current = true;
            event.preventDefault();
            panBy(dx, dy);
            touchDrag.x = event.clientX;
            touchDrag.y = event.clientY;
            return;
          }
          if (gestureRef.current.size !== 2) return;
          event.preventDefault();

          const nextMid = midpoint();
          const prevMid = gestureMidpointRef.current;
          const pointers = [...gestureRef.current.values()];
          const nextDist = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);

          if (gestureDistance && gestureDistance > 0 && nextDist > 0) {
            const scaleRatio = nextDist / gestureDistance;
            if (Math.abs(scaleRatio - 1) > 0.002) {
              zoomAt(nextMid.x, nextMid.y, scaleRatio);
            }
          }
          if (prevMid) {
            panBy(nextMid.x - prevMid.x, nextMid.y - prevMid.y);
          }

          gestureMidpointRef.current = nextMid;
          gestureDistance = nextDist;
        };
        const onPointerUp = (event: PointerEvent) => {
          if (touchDrag && touchDrag.id === event.pointerId) {
            if (!touchDrag.moved && event.type === 'pointerup' && event.pointerType !== 'mouse') {
              const now = performance.now();
              if (now - lastTap.t < 300 && Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 30) {
                resetCamera();
                lastTap = { t: 0, x: 0, y: 0 };
              } else {
                lastTap = { t: now, x: event.clientX, y: event.clientY };
              }
            }
            touchDrag = null;
          }
          gestureRef.current.delete(event.pointerId);
          if (gestureRef.current.size < 2) {
            gestureMidpointRef.current = null;
            gestureDistance = null;
          }
        };
        const onWheel = (event: WheelEvent) => {
          markCanvasInput();
          event.preventDefault();
          if (event.ctrlKey) {
            // Trackpad pinch-to-zoom (Chrome / Safari / Firefox on Mac/Win send wheel with ctrlKey)
            // deltaY < 0 is pinch out (zoom in), deltaY > 0 is pinch in (zoom out)
            const zoomFactor = Math.exp(-event.deltaY * 0.01);
            zoomAt(event.clientX, event.clientY, zoomFactor);
          } else {
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? app.screen.height : 1;
            panBy(-event.deltaX * unit, -event.deltaY * unit);
          }
        };

        // Safari native gesture events (macOS trackpad pinch)
        const onGestureStart = (e: Event) => {
          markCanvasInput();
          e.preventDefault();
          lastGestureScale = 1;
        };
        const onGestureChange = (e: Event) => {
          markCanvasInput();
          e.preventDefault();
          const gesture = e as Event & { scale: number; clientX: number; clientY: number };
          const currentScale = gesture.scale || 1;
          const scaleRatio = currentScale / lastGestureScale;
          lastGestureScale = currentScale;
          zoomAt(gesture.clientX, gesture.clientY, scaleRatio);
        };
        const onGestureEnd = (e: Event) => {
          e.preventDefault();
          lastGestureScale = 1;
        };

        const onDblClick = (e: MouseEvent) => {
          markCanvasInput();
          e.preventDefault();
          resetCamera();
        };

        app.canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
        app.canvas.addEventListener('pointermove', onPointerMove, { passive: false });
        app.canvas.addEventListener('pointerup', onPointerUp, { passive: true });
        app.canvas.addEventListener('pointercancel', onPointerUp, { passive: true });
        app.canvas.addEventListener('wheel', onWheel, { passive: false });
        app.canvas.addEventListener('gesturestart', onGestureStart, { passive: false });
        app.canvas.addEventListener('gesturechange', onGestureChange, { passive: false });
        app.canvas.addEventListener('gestureend', onGestureEnd, { passive: false });
        app.canvas.addEventListener('dblclick', onDblClick);
        window.addEventListener('keydown', onKeyDown);

        detachInteractions = () => {
          app.canvas.removeEventListener('pointerdown', onPointerDown);
          app.canvas.removeEventListener('pointermove', onPointerMove);
          app.canvas.removeEventListener('pointerup', onPointerUp);
          app.canvas.removeEventListener('pointercancel', onPointerUp);
          app.canvas.removeEventListener('wheel', onWheel);
          app.canvas.removeEventListener('gesturestart', onGestureStart);
          app.canvas.removeEventListener('gesturechange', onGestureChange);
          app.canvas.removeEventListener('gestureend', onGestureEnd);
          app.canvas.removeEventListener('dblclick', onDblClick);
          window.removeEventListener('keydown', onKeyDown);
        };

        // Animation loop: VU meters, TV equalizer, phone ring, clock, staff, day tint
        app.ticker.add((ticker) => {
          if (typeof document !== 'undefined' && document.hidden) return;

          const now = performance.now();
          const targetFps = settingsRef.current?.targetFps ?? 60;
          if (shouldSkipFrame(targetFps, now - lastFrameTimeRef.current)) {
            return;
          }
          lastFrameTimeRef.current = now;

          const s = stateRef.current;
          timeRef.current += ticker.deltaMS;
          const t = timeRef.current / 1000;
          const scene = sceneRef.current;
          if (!scene) return;
          const refs = scene.refs;
          scene.tick?.(t, readReduceMotion());

          const reduceMotion = readReduceMotion();
          const floorFocused = s.floorFocused !== false;
          // Don't bank idle time while drawers/inspectors own attention, UNLESS we have a locked hotspot.
          if (!floorFocused && !s.lockedHotspot) {
            lastCanvasInputRef.current = performance.now();
            (['phone', 'console', 'liveRoom', 'shelf', 'door'] as const).forEach((id) => {
              const hint = refs.idleHints[id];
              if (hint) hint.alpha = 0;
            });
            if (idleCameraRef.current.mode === 'focusing') beginIdleCameraRestore();
            else if (idleCameraRef.current.mode === 'restoring') {
              const saved = idleCameraRef.current.saved;
              const next = lerpCameraPose(cameraRef.current, saved, IDLE_CAMERA_RESTORE_LERP);
              applyCameraPose(next);
              if (cameraPoseNear(next, saved)) {
                applyCameraPose(saved);
                cancelIdleCamera();
              }
            }
          } else {
          const idleMs = performance.now() - lastCanvasInputRef.current;
          // If locked, we immediately target it. Otherwise, use normal idle logic.
          const hintedHotspot = s.lockedHotspot || pickIdleDirectionTarget({
            idleMs,
            floorFocused: true,
            enquiryWaiting: Boolean(s.enquiryWaiting),
            hasActiveProject: s.hasActiveProject,
            pendingChoreHotspot: s.pendingChoreHotspot ?? null,
          });
          (['phone', 'console', 'liveRoom', 'shelf', 'door'] as const).forEach((id) => {
            const hint = refs.idleHints[id];
            if (!hint) return;
            if (id !== hintedHotspot) {
              hint.alpha = 0;
              return;
            }
            const pulse = reduceMotion
              ? id === 'door'
                ? 0.55
                : 0.72
              : id === 'door'
                ? 0.28 + (Math.sin(t * 2.1) + 1) * 0.2
                : 0.42 + (Math.sin(t * 3.2) + 1) * 0.24;
            hint.alpha = pulse;
          });

          // Subtle auto-zoom / pan toward the idle target; restore on cancel.
          if (!reduceMotion && hintedHotspot) {
            const focus = refs.idleFocusPoints[hintedHotspot];
            if (focus) {
              const cam = idleCameraRef.current;
              if (cam.mode === 'idle' || cam.targetId !== hintedHotspot) {
                if (cam.mode === 'idle') {
                  cam.saved = { ...cameraRef.current };
                }
                cam.mode = 'focusing';
                cam.targetId = hintedHotspot;
              }
              const desired = cameraPoseForFocus({
                focusLocal: focus,
                basePosition: scene.basePosition,
                baseScale: scene.baseScale,
                screen: { width: app.screen.width, height: app.screen.height },
                targetZoom: Math.max(cameraRef.current.zoom, IDLE_CAMERA_ZOOM),
                minZoom: MIN_ZOOM,
                maxZoom: MAX_ZOOM,
              });
              // Keep the nudge mild — blend toward a soft pull, not a hard lock.
              const softTarget = lerpCameraPose(cam.saved, desired, 0.55);
              applyCameraPose(lerpCameraPose(cameraRef.current, softTarget, IDLE_CAMERA_LERP));
            }
          } else if (idleCameraRef.current.mode === 'restoring') {
            const saved = idleCameraRef.current.saved;
            const next = lerpCameraPose(cameraRef.current, saved, IDLE_CAMERA_RESTORE_LERP);
            applyCameraPose(next);
            if (cameraPoseNear(next, saved)) {
              applyCameraPose(saved);
              cancelIdleCamera();
            }
          } else if (idleCameraRef.current.mode === 'focusing' && !hintedHotspot) {
            beginIdleCameraRestore();
          }
          }

          // Smoothly interpolate hotspot hover glow alphas for tactile feedback
          Object.keys(refs.hoverGlows).forEach((key) => {
            const glow = refs.hoverGlows[key];
            const target = refs.hoverGlowTargets[key] ?? 0;
            if (glow && Math.abs(glow.alpha - target) > 0.005) {
              glow.alpha += (target - glow.alpha) * 0.18;
            }
          });

          // Report hotspot screen anchors (only when something moved) so DOM badges follow pan/zoom
          if (anchorsCbRef.current) {
            const next: HotspotAnchors = {};
            let changed = false;
            (Object.keys(refs.hotspotHits) as StudioHotspotId[]).forEach((id) => {
              const b = refs.hotspotHits[id]?.getBounds();
              if (!b || b.maxX <= b.minX) return;
              const pt = { x: Math.round((b.minX + b.maxX) / 2), y: Math.round(b.minY) };
              next[id] = pt;
              const prev = lastAnchorsRef.current[id];
              if (!prev || prev.x !== pt.x || prev.y !== pt.y) changed = true;
            });
            if (refs.candleTable) {
              const cb = refs.candleTable.getBounds();
              if (cb && cb.maxX > cb.minX) {
                const pt = { x: Math.round((cb.minX + cb.maxX) / 2), y: Math.round(cb.minY) };
                next.coffee = pt;
                const prev = lastAnchorsRef.current.coffee;
                if (!prev || prev.x !== pt.x || prev.y !== pt.y) changed = true;
              }
            }
            if (changed) {
              lastAnchorsRef.current = next;
              anchorsCbRef.current(next);
            }
          }

          // Console VU meters — needles (tier 1) or LED ladders (later tiers)
          const vuPeaks: { x: number; y: number; width: number }[] = [];
          refs.vuBars.forEach((bar, i) => {
            bar.g.clear();
            if (bar.needle) {
              const norm = vuNeedleNorm(s.activity, t, i, reduceMotion);
              const ang = vuNeedleAngle(norm);
              const len = Math.max(4, (bar.y - (bar.needleTopY ?? bar.y - 9)) * 0.85);
              const tipX = bar.x + Math.sin(ang) * len;
              const tipY = bar.y - Math.cos(ang) * len;
              bar.g.moveTo(bar.x, bar.y - 1).lineTo(tipX, tipY).stroke({
                width: 1.1,
                color: bar.color,
                cap: 'round',
              });
              bar.g.circle(bar.x, bar.y - 1, 0.9).fill(0x2b2118);
              vuPeaks.push({ x: tipX, y: tipY, width: bar.width ?? 3.5 });
            } else {
              const wobble = reduceMotion
                ? 0.55
                : 0.5 + 0.5 * Math.sin(t * (3 + i * 0.7) + i * 1.3);
              const maxRange = bar.range ?? 9;
              const h = Math.min(maxRange, 1.5 + wobble * (1.5 + s.activity * (maxRange - 3)));
              const width = bar.width ?? 3.5;
              // Peak LED blink on the ladder tip when the session is live
              const tipBoost = statusLedPulse(s.activity, t, i, s.hasActiveProject, reduceMotion);
              bar.g.rect(bar.x - width / 2, bar.y - h, width, h).fill(bar.color);
              bar.g.rect(bar.x - width / 2, bar.y - h - 1.2, width, 1.4).fill({
                color: 0xfff1c2,
                alpha: 0.25 + tipBoost * 0.55,
              });
              vuPeaks.push({ x: bar.x, y: bar.y - h, width });
            }
          });

          // Console / outboard status LED jewels
          refs.statusLeds.forEach((led, i) => {
            const pulse = statusLedPulse(s.activity, t, i, s.hasActiveProject, reduceMotion);
            led.g.clear();
            led.g.circle(led.x, led.y, led.radius * (0.92 + pulse * 0.12)).fill({
              color: led.color,
              alpha: pulse,
            });
          });

          // Shelf gear micro-sway (does not move hotspot hit geometry)
          refs.shelfItems.forEach((item, i) => {
            if (item.seated) {
              item.display.y = item.baseY;
              item.display.rotation = item.baseRot;
              item.display.alpha = 1;
              return;
            }
            const m = shelfIdleMotion(t, i + item.phase, s.hasActiveProject, reduceMotion);
            item.display.y = item.baseY + m.dy;
            item.display.rotation = item.baseRot + m.rot;
            item.display.alpha = m.alpha;
          });

          // Charts TV equalizer & diegetic CRT filter time drift
          if (refs.tvCrtFilter && !reduceMotion) {
            refs.tvCrtFilter.updateTime(t);
          }
          const tvPeaks: { x: number; y: number }[] = [];
          refs.tvBars.forEach((bar, i) => {
            const h = reduceMotion
              ? 4 + (0.5 + 0.5 * Math.sin(i * 1.1)) * (4 + s.activity * 22)
              : 4 + (0.5 + 0.5 * Math.sin(t * 4 + i * 1.1)) * (4 + s.activity * 22);
            bar.g.clear();
            if (bar.plane) {
              const a0 = leftWallPt(bar.plane.y0, bar.plane.lift);
              const a1 = leftWallPt(bar.plane.y1, bar.plane.lift);
              const b1 = leftWallPt(bar.plane.y1, bar.plane.lift + h);
              const b0 = leftWallPt(bar.plane.y0, bar.plane.lift + h);
              bar.g.poly([a0.x, a0.y, a1.x, a1.y, b1.x, b1.y, b0.x, b0.y]).fill(bar.color);
              tvPeaks.push({ x: (b0.x + b1.x) / 2, y: b0.y });
            } else {
              bar.g.rect(bar.x - 5, bar.y - h, 10, h).fill(bar.color);
              tvPeaks.push({ x: bar.x, y: bar.y - h });
            }
          });

          // Emissive dynamic bloom & thermionic tube glow updates (world-space, additive blend)
          if (refs.dynamicBloomG && refs.bloomLayer?.visible) {
            if (refs.tubeGlowFilter) {
              const tubeIntensity = calculateTubeGlowIntensity(s.activity, s.hasActiveProject);
              refs.tubeGlowFilter.update(tubeIntensity, t, s.hasActiveProject, s.activity, reduceMotion);
            }
            const bg = refs.dynamicBloomG;
            bg.clear();

            const bloomParams = calculateDynamicBloom(
              s.activity,
              s.hasActiveProject,
              s.eraId,
              reduceMotion
            );

            // 1. Console VU meters glowing cores
            for (let i = 0; i < vuPeaks.length; i++) {
              const peak = vuPeaks[i];
              const r = (peak.width ? peak.width * 1.3 : 4.5) * bloomParams.radiusMultiplier;
              bg.circle(peak.x, peak.y, r * 1.8)
                .fill({ color: bloomParams.meterColor, alpha: bloomParams.meterAlpha * 0.35 });
              bg.circle(peak.x, peak.y, r)
                .fill({ color: bloomParams.meterColor, alpha: bloomParams.meterAlpha });
            }

            // 2. Active recording status lamp (on console meter bridge)
            if (s.hasActiveProject && vuPeaks.length > 0) {
              const midBar = vuPeaks[Math.floor(vuPeaks.length / 2)];
              const lampX = midBar.x;
              const lampY = midBar.y - 12;
              const lampPulse = reduceMotion ? 1.0 : 0.88 + 0.12 * Math.sin(t * 3.5);
              bg.circle(lampX, lampY, 7 * bloomParams.radiusMultiplier)
                .fill({ color: bloomParams.lampColor, alpha: bloomParams.lampAlpha * 0.35 * lampPulse });
              bg.circle(lampX, lampY, 3.5 * bloomParams.radiusMultiplier)
                .fill({ color: bloomParams.lampColor, alpha: bloomParams.lampAlpha * lampPulse });
            }

            // 3. TV equalizer display bloom (era lighting kit accent)
            const tvBloom = getEraLightingKit(s.eraId).bloomAccent;
            for (let i = 0; i < tvPeaks.length; i++) {
              const peak = tvPeaks[i];
              bg.circle(peak.x, peak.y, 5 * bloomParams.radiusMultiplier)
                .fill({ color: tvBloom, alpha: bloomParams.meterAlpha * 0.35 });
            }
          }

          // Decor lighting (shaft/motes/practicals) updates with the clock sample below.

          // Tape reels, valve glow and deck LEDs (#81): restyle only when a visible value changes.
          // Budget (#46/#74): reels are the single continuous effect, parked in calm/Focus modes.
          if (refs.reels.length > 0 || refs.gearTubes.length > 0 || refs.gearLeds.length > 0) {
            const calm = reduceMotion || Boolean(settingsRef.current?.reducedMotion);
            const attention = gearAttention({ hasActiveProject: s.hasActiveProject, reducedMotion: reduceMotion, focusMode: Boolean(settingsRef.current?.reducedMotion) });
            const reelState = toSpriteVisualState('studio-tape', 'tape-machine', {
              powered: true,
              activity: s.activity,
              condition: 100,
              transport: s.hasActiveProject ? 'play' : 'stopped',
            });
            const reelKey = gearVisualKey(reelState, attention);
            if (reelKeyRef.current !== reelKey) {
              reelKeyRef.current = reelKey;
              refs.reels.forEach((r) => applyReelState(r, reelState, calm));
              const glow = tubeGlowLevel(reelState);
              refs.gearTubes.forEach((g) => { g.alpha = glow; });
              const ledHex = STATUS_LED_HEX[statusLedColor(reelState)];
              refs.gearLeds.forEach((g) => { g.tint = ledHex; });
            }
            // Manual update: honours the frame-rate cap and hidden-tab early return above
            if (attention.reelsSpin) refs.reels.forEach((r) => { if (r.playing) r.update(ticker); });
          }

          // Staff / artist motion from npcAnimation states (presentation only).
          // Extra rooms only show a session when the project is booked into the room being viewed.
          const sessionHere = s.hasActiveProject && (roomKeyRef.current === 'project-studio' || Boolean(s.roomOccupied));
          refs.staffFigures.forEach((f, i) => {
            const supplied = stateRef.current.floorFigures?.[i]?.animState;
            // Extra rooms: supplied states are not room-scoped for staff; stay idle unless a session is here.
            const live = roomKeyRef.current !== 'project-studio' && !sessionHere ? 'idle' : supplied;
            if (live) f.animState = live;
            else if (sessionHere && f.animState === 'idle') f.animState = 'working';
            else if (!sessionHere && (f.animState === 'working' || f.animState === 'mixing' || f.animState === 'recording')) {
              f.animState = 'idle';
            }
            const target = staffDestination(f.animState, f.stations);
            const position = stepStaffPosition({ x: f.baseX, y: f.baseY }, target, ticker.deltaMS, reduceMotion);
            f.baseX = position.x;
            f.baseY = position.y;
            f.fig.x = position.x;
            f.fig.zIndex = Z.depth + position.y;
            const walking = Math.hypot(target.x - position.x, target.y - position.y) > 0.5;
            const cue = staffActivityCue(f.animState);
            if (f.activityCue.text !== cue.text) f.activityCue.text = cue.text;
            if (f.activityCue.style.fill !== cue.color) f.activityCue.style.fill = cue.color;
            f.activityCue.visible = !walking && cue.text !== '';
            applyFloorNpcMotion({ ...f, animState: walking ? 'walk' : f.animState }, t, i * 1.4, reduceMotion);
            applyFloorNpcMotion(f, t, i * 1.4, reduceMotion);
            if (i === 0 && refs.producerEmote) {
              // Tap reaction: a quick hop with a squash, and a note that floats up and fades.
              const since = (performance.now() - refs.producerTapAt) / 1000;
              if (since >= 0 && since < 0.9) {
                if (!reduceMotion && since < 0.45) {
                  const k = since / 0.45;
                  f.fig.y -= Math.sin(k * Math.PI) * 9;
                  f.fig.scale.y *= 1 + Math.sin(k * Math.PI) * 0.04;
                }
                refs.producerEmote.alpha = Math.min(1, (0.9 - since) * 3);
                refs.producerEmote.y = -76 - (reduceMotion ? 0 : since * 16);
              } else if (refs.producerEmote.alpha !== 0) {
                refs.producerEmote.alpha = 0;
              }
            }
          });

          // Booked artist: diegetic door enter/exit, then mic motion during the session
          if (refs.artist) {
            const a = refs.artist;
            const door = refs.doorFloor ?? { x: a.baseX, y: a.baseY };
            const stand = refs.artistStand ?? { x: a.baseX, y: a.baseY };
            clientTransitRef.current = advanceClientTransit(clientTransitRef.current, {
              sessionActive: sessionHere,
              dtMs: ticker.deltaMS,
              reduceMotion,
            });
            const pose = clientTransitPose(clientTransitRef.current, door, stand);
            a.fig.visible = pose.visible;
            a.fig.alpha = pose.alpha;
            a.fig.x = pose.x;
            const name = s.artistName ?? '';
            if (a.shown !== name) { a.tag.text = name; a.shown = name; }
            const atMic = clientTransitRef.current.phase === 'present';
            if (atMic && sessionHere) {
              a.animState = 'recording';
              a.baseY = pose.y;
              applyFloorNpcMotion(a, t, 0.7, reduceMotion);
              const tk = lastTake();
              const nod = tk && !reduceMotion ? nodOffset(performance.now() - tk.at, tk.grade) : 0;
              a.fig.y += nod;
            } else {
              a.fig.y = pose.y;
              a.fig.rotation = 0;
              a.fig.scale.y = 1;
            }
            a.fig.zIndex = Z.depth + pose.y;
          }

          // Phone ring pulse — stronger when enquiries are waiting
          if (refs.phoneRing) {
            const waiting = Boolean(s.enquiryWaiting) && !s.hasActiveProject;
            const speed = waiting ? 4.2 : s.hasActiveProject ? 1.2 : 2.4;
            const pulse = (Math.sin(t * speed) + 1) / 2;
            refs.phoneRing.alpha = waiting
              ? 0.35 + pulse * 0.65
              : 0.15 + pulse * 0.85;
            refs.phoneRing.scale.set(1 + pulse * (waiting ? 0.35 : 0.25));
          }

          // Candle-table drink: spawn after brew_espresso; clear when daily chores reset
          {
            const want = Boolean(s.coffeeSteaming);
            const drink = refs.candleDrink;
            if (drink) {
              const baseY = refs.candleDrinkBaseY;
              if (want && !coffeeWasSteamingRef.current) {
                drink.visible = true;
                drinkSettleRef.current = 0;
                if (reduceMotion) {
                  drink.alpha = 1;
                  drink.y = baseY;
                  drinkSettleRef.current = CANDLE_DRINK_SETTLE_SEC;
                } else {
                  drink.alpha = 0;
                  drink.y = baseY - 7;
                }
              } else if (!want) {
                drink.visible = false;
                drink.alpha = 0;
                drink.y = baseY;
                drinkSettleRef.current = -1;
              }
              coffeeWasSteamingRef.current = want;

              if (want && drinkSettleRef.current >= 0 && drinkSettleRef.current < CANDLE_DRINK_SETTLE_SEC) {
                drinkSettleRef.current = Math.min(
                  CANDLE_DRINK_SETTLE_SEC,
                  drinkSettleRef.current + ticker.deltaMS / 1000,
                );
                const u = drinkSettleRef.current / CANDLE_DRINK_SETTLE_SEC;
                // Soft ease-out settle with a tiny overshoot
                const ease = 1 - Math.pow(1 - u, 3);
                const bounce = Math.sin(u * Math.PI) * 1.2 * (1 - u);
                drink.alpha = Math.min(1, ease * 1.15);
                drink.y = baseY - 7 * (1 - ease) + bounce;
              } else if (want && drinkSettleRef.current >= CANDLE_DRINK_SETTLE_SEC) {
                drink.alpha = 1;
                drink.y = baseY;
              }
            }
            // Rider beers: show while session + beer ask; hide otherwise
            if (refs.candleBeers) {
              const showBeers = Boolean(s.riderBeers);
              refs.candleBeers.visible = showBeers;
              refs.candleBeers.alpha = showBeers ? 1 : 0;
            }
            const steamReady =
              want &&
              (reduceMotion || drinkSettleRef.current < 0 || drinkSettleRef.current >= CANDLE_DRINK_SETTLE_SEC * 0.35);

            // Wall clock + day/night ambience share one minute stream (studioDecorConfig).
            // Hands: 12h face. Lighting/window: 24h day so morning ≠ evening exterior.
            const { hour, minute, minutesOfDay } = getWallClockTimeFromMinutes(
              s.clockMinutes ?? getWallClockTime(s.day, t).minutesOfDay,
            );
            const faceMins = hour * 60 + minute;
            if (faceMins !== clockMinuteRef.current) {
              clockMinuteRef.current = faceMins;
              refs.setClockTime?.(hour, minute);
            }

            const dayness = reduceMotion
              ? REDUCED_MOTION_DAYNESS
              : getDaynessFromClockMinutes(minutesOfDay);
            const dayPhase = reduceMotion ? 'day' : getDayPhase(minutesOfDay);
            const sky = reduceMotion
              ? getWindowSkyColor(720) // noon keyframe — stable day sky
              : getWindowSkyColor(minutesOfDay);

            if (sky !== windowSkyRef.current) {
              windowSkyRef.current = sky;
              refs.setWindowSky?.(sky);
            }

            refs.windowView?.update(minutesOfDay, dayness, t, reduceMotion);
            refs.caseStack?.update(t, reduceMotion);

            if (refs.nightTintLayer) {
              refs.nightTintLayer.alpha = getNightTintAlpha(dayness);
            }

            refs.decor?.update(t, reduceMotion, s.hasActiveProject, {
              dayness,
              dayPhase,
              coffeeSteaming: steamReady,
            });
            if (refs.floorCat) {
              refs.floorCat.update(ticker.deltaMS / 1000, t, dayPhase, reduceMotion);
              const cp = refs.floorCat.tile();
              refs.floorCat.container.zIndex = Z.depth + iso(cp.x, cp.y).y;
            }
          }

          // Dynamic analog tape saturation warmth (deepens subtly during active session takes)
          if (refs.vignetteLayer && refs.vignetteLayer.visible) {
            refs.vignetteLayer.alpha = calculateTapeSaturationWarmth(s.activity, s.hasActiveProject, 1.0);
          }

          // Subtle phosphor micro-drift on CRT scanlines (disabled when reducedMotion is active)
          if (refs.crtLayer && refs.crtLayer.visible) {
            const drift = reduceMotion ? 1.0 : 1.0 + Math.sin(t * 1.6) * 0.04;
            refs.crtLayer.alpha = drift;
          }

          // Gamepad analog camera controls (Right stick pans, triggers zoom, R3 centers)
          if (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function') {
            const gamepads = navigator.getGamepads();
            let pad: Gamepad | null = null;
            for (let i = 0; i < gamepads.length; i++) {
              if (gamepads[i]?.connected) {
                pad = gamepads[i];
                break;
              }
            }
            if (pad) {
              const rx = pad.axes[2] ?? 0;
              const ry = pad.axes[3] ?? 0;
              const deadzone = 0.18;
              const stickDx = Math.abs(rx) > deadzone ? (rx > 0 ? rx - deadzone : rx + deadzone) : 0;
              const stickDy = Math.abs(ry) > deadzone ? (ry > 0 ? ry - deadzone : ry + deadzone) : 0;
              if (stickDx !== 0 || stickDy !== 0) {
                markCanvasInput();
                panBy(-stickDx * 10, -stickDy * 10);
              }

              // Triggers zoom
              const lt = pad.buttons[6]?.value ?? 0;
              const rt = pad.buttons[7]?.value ?? 0;
              if (lt > 0.15 || rt > 0.15) {
                markCanvasInput();
                const zoomFactor = 1 + (rt - lt) * 0.02;
                zoomAt(app.screen.width / 2, app.screen.height / 2, zoomFactor);
              }

              // R3 click (button 11) recenters camera
              if (pad.buttons[11]?.pressed) {
                markCanvasInput();
                resetCamera();
              }
            }
          }
        });
      } catch (err) {
        console.error('Studio room failed to initialize:', err);
      }
    };

    boot();

    // Recenter/rebuild when the container is resized (panel layout changes)
    const observer = new ResizeObserver(() => {
      const app = appRef.current;
      if (!app) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (Math.abs(w - lastW) > 2 || Math.abs(h - lastH) > 2) {
        lastW = w;
        lastH = h;
        app.renderer.resize(w, h);
        idleCameraRef.current = {
          mode: 'idle',
          saved: { x: 0, y: 0, zoom: 1 },
          targetId: null,
        };
        cameraRef.current = { x: 0, y: 0, zoom: 1 };
        if (!disposed) rebuild();
      }
    });
    observer.observe(container);

    return () => {
      disposed = true;
      releasePixiClaim?.();
      observer.disconnect();
      detachInteractions?.();
      const app = appRef.current;
      if (app) {
        app.destroy(true, { children: true });
        appRef.current = null;
        sceneRef.current = null;
      }
      if (container) container.innerHTML = '';
    };
  }, []);

  // Rebuild when the room layout changes (staff hired, gear bought) — after boot
  useEffect(() => {
    if (appRef.current) rebuild();
  }, [structuralKey]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    />
  );
};

export default WebGLCanvas;
