import React, { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { visualEraId } from '@/utils/eraProgression';
import { useSettings } from '@/contexts/SettingsContext';

export const calculateEffectiveResolution = (dpr: number, scale?: number) => {
  const clampedDpr = Math.max(1.0, Math.min(2.0, dpr || 1.0));
  return Math.max(0.5, Math.min(3.0, clampedDpr * (scale || 1.0)));
};

export const shouldSkipFrame = (targetFps: number, elapsedMs: number) => {
  if (targetFps <= 0) return false;
  const budgetMs = 1000 / targetFps;
  return elapsedMs < budgetMs - 1.0;
};

/**
 * Studio hotspots the player can click in the isometric room scene.
 */
export type StudioHotspotId = 'console' | 'liveRoom' | 'phone' | 'clock' | 'tv' | 'shelf';

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
  /** Number of staff physically on the studio floor */
  staffOnFloor: number;
  /** Player's equipment count (fills the gear shelf) */
  ownedEquipment: number;
  /** In-game day counter (drives the wall clock) */
  day: number;
  /** Current era id — drives the room's colour grade + signage (bead goj.3) */
  eraId?: string;
  /** Studio tier 1-5 from ProgressionSystem — drives visible room upgrades (bead ifx.3) */
  roomTier?: number;
}

interface WebGLCanvasProps {
  state?: Partial<StudioSceneState>;
  onHotspotSelect?: (id: StudioHotspotId) => void;
  resetCameraKey?: number;
  className?: string;
}

const DEFAULT_STATE: StudioSceneState = {
  activity: 0.2,
  hasActiveProject: false,
  staffOnFloor: 1,
  ownedEquipment: 3,
  day: 1,
  eraId: 'analog60s',
  roomTier: 1,
};

export const IDLE_HINT_DELAY_MS = 8_000;

export const getIdleHintTarget = (
  hasActiveProject: boolean,
  idleMs: number,
): 'phone' | 'console' | null => {
  if (idleMs < IDLE_HINT_DELAY_MS) return null;
  return hasActiveProject ? 'console' : 'phone';
};

/* ---------------------------------------------------------------------------
 * Isometric helpers
 * ------------------------------------------------------------------------- */
const TILE_W = 56;
const TILE_H = 28;
const ROOM_W = 8; // tiles along +x
const ROOM_D = 7; // tiles along +y
const WALL_H = 132;

const iso = (x: number, y: number) => ({
  x: (x - y) * (TILE_W / 2),
  y: (x + y) * (TILE_H / 2),
});

/** Start an isometric quad path from tile coords (a,b) -> (c,d), lifted off the floor */
const isoQuad = (g: Graphics, a: number, b: number, c: number, d: number, lift = 0) => {
  const p1 = iso(a, b);
  const p2 = iso(c, b);
  const p3 = iso(c, d);
  const p4 = iso(a, d);
  g.poly([p1.x, p1.y - lift, p2.x, p2.y - lift, p3.x, p3.y - lift, p4.x, p4.y - lift]);
};

/** Room palette */
const COLORS = {
  floorA: 0x624a39,
  floorB: 0x5d4737,
  rug: 0x8c3b3b,
  rugInner: 0x9c4747,
  wallLeft: 0x2a3345,
  wallRight: 0x323d52,
  wallTrim: 0x1d2433,
  deskTop: 0x3d4459,
  deskSide: 0x2b3142,
  deskRight: 0x232a3a,
  shelf: 0x4a3a2c,
  shelfSide: 0x382c21,
  gear: [0xd9a441, 0x5aa9e6, 0xe05c5c, 0x7bd389, 0xc77dff, 0xf2f2f2],
  staff: [0x5aa9e6, 0xe08fa8, 0x7bd389, 0xf2c14e, 0xc77dff],
  glass: 0x9fd3ff,
  glassFrame: 0x7fb5dd,
};

/**
 * Era colour grades (bead goj.3): each era tints the room and shifts the wall
 * tones so the studio visibly ages with the technology. `tint` is the ambient
 * overlay colour animated by the day/night cycle.
 */
const ERA_GRADES: Record<string, { tint: number; wallLeft: number; wallRight: number; accent: number; label: string }> = {
  analog60s:    { tint: 0x2a1c08, wallLeft: 0x3b3243, wallRight: 0x4a3c47, accent: 0xd9a441, label: 'ANALOG 60s' },
  digital80s:   { tint: 0x1b0a2e, wallLeft: 0x2c2a4d, wallRight: 0x3a3058, accent: 0xc77dff, label: 'DIGITAL 80s' },
  internet2000s:{ tint: 0x08171f, wallLeft: 0x263a44, wallRight: 0x2f4a52, accent: 0x5aa9e6, label: 'MILLENNIUM 2000s' },
  streaming2020s:{ tint: 0x06140f, wallLeft: 0x22352e, wallRight: 0x2b463a, accent: 0x7bd389, label: 'STREAMING 2020s' },
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

export const getStudioSignage = (eraId?: string, milestonesCount = 0): string => {
  const grade = getEraGrade(eraId);
  const tier = clampTier(Math.floor(milestonesCount / 2) + 1);
  return `${grade.label} · ${getStudioTierName(tier)}`;
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
}

/** Per-build dynamic refs the ticker animates */
interface SceneRefs {
  vuBars: AnimBar[];
  tvBars: AnimBar[];
  phoneRing: Graphics | null;
  clockHand: Graphics | null;
  staffFigures: { fig: Container; baseY: number }[];
  nightTintLayer: Container | null;
  hoverGlows: Record<string, Graphics>;
  idleHints: Partial<Record<'phone' | 'console', Graphics>>;
  crtLayer: Container | null;
  bloomLayer: Container | null;
  vignetteLayer: Container | null;
}

interface BuiltScene {
  root: Container;
  refs: SceneRefs;
  basePosition: { x: number; y: number };
  baseScale: number;
}

/** Attach an interactive hit area + hover glow around a visual group. */
const addHotspot = (
  parent: Container,
  id: StudioHotspotId,
  hitArea: Graphics,
  visual: Container,
  refs: SceneRefs,
  onSelect?: (id: StudioHotspotId) => void
) => {
  const wrap = new Container();
  if (visual) wrap.addChild(visual);

  // Glow ring shown on hover (populated by the caller with real coordinates)
  const glow = new Graphics();
  glow.alpha = 0;
  refs.hoverGlows[id] = glow;
  wrap.addChild(glow);

  const hit = new Container();
  hit.addChild(hitArea);
  hit.eventMode = 'static';
  hit.cursor = 'pointer';
  hit.alpha = 0; // invisible for rendering, still receives pointer events
  hit.on('pointerover', () => { glow.alpha = 1; });
  hit.on('pointerout', () => { glow.alpha = 0; });
  // The canvas gesture guard suppresses selection after a two-finger pan.
  hit.on('pointertap', () => { onSelect?.(id); });

  parent.addChild(wrap);
  parent.addChild(hit);
};

const buildScene = (
  width: number,
  height: number,
  state: StudioSceneState,
  onSelect?: (id: StudioHotspotId) => void
): BuiltScene => {
  const root = new Container();
  const refs: SceneRefs = {
    vuBars: [],
    tvBars: [],
    phoneRing: null,
    clockHand: null,
    staffFigures: [],
    nightTintLayer: null,
    hoverGlows: {},
    idleHints: {},
  };

  // Era colour grade + studio tier drive the room's look (beads goj.3 / ifx.3)
  const grade = getEraGrade(state.eraId);
  const tier = clampTier(state.roomTier);

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
  // Shallow acoustic panels make the room read as a recording space at every zoom.
  for (let i = 0; i < 6; i++) {
    const a = iso(0, i + .2);
    const b = iso(0, i + .8);
    walls.poly([a.x, a.y - 102, b.x, b.y - 102, b.x, b.y - 46, a.x, a.y - 46])
      .fill({ color: 0x121a29, alpha: .22 });
    const c = iso(i + .2, 0);
    const d = iso(i + .8, 0);
    walls.poly([c.x, c.y - 104, d.x, d.y - 104, d.x, d.y - 53, c.x, c.y - 53])
      .fill({ color: 0x101827, alpha: .19 });
  }
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

  /* ---- Window (right wall) -------------------------------------------- */
  const windowGfx = new Graphics();
  const winA = iso(5.1, 0);
  const winB = iso(6.9, 0);
  const winPoly = [winA.x, winA.y - 96, winB.x, winB.y - 96, winB.x, winB.y - 34, winA.x, winA.y - 34];
  windowGfx.poly(winPoly).fill(0x8fbfe6);
  windowGfx.poly(winPoly).stroke({ width: 4, color: COLORS.wallTrim });
  const winMidX = (winA.x + winB.x) / 2;
  const winMidY = (winA.y + winB.y) / 2;
  windowGfx.rect(winMidX - 2, winMidY - 78, 4, 64).fill(COLORS.wallTrim);
  root.addChild(windowGfx);

  /* ---- Charts TV (left wall) ------------------------------------------ */
  const tvWrap = new Container();
  const tvA = iso(0, 4.6);
  const tvB = iso(0, 6.4);
  const tvPoly = [tvA.x, tvA.y - 104, tvB.x, tvB.y - 104, tvB.x, tvB.y - 56, tvA.x, tvA.y - 56];
  const tv = new Graphics();
  tv.poly(tvPoly).fill(0x11151f);
  tv.poly(tvPoly).stroke({ width: 3, color: 0x0a0d14 });
  tvWrap.addChild(tv);
  // Animated equalizer bars on the TV screen
  for (let i = 0; i < 5; i++) {
    const bar = new Graphics();
    const t = (i + 0.5) / 5;
    const bx = tvA.x + (tvB.x - tvA.x) * t;
    const by = tvA.y - 66 + (tvB.y - tvA.y) * t;
    tvWrap.addChild(bar);
    refs.tvBars.push({ g: bar, x: bx, y: by, color: COLORS.gear[i % COLORS.gear.length] });
  }
  root.addChild(tvWrap);
  const tvHit = new Graphics();
  tvHit
    .poly([tvA.x, tvA.y - 110, tvB.x, tvB.y - 110, tvB.x, tvB.y - 50, tvA.x, tvA.y - 50])
    .fill(0xffffff);
  addHotspot(root, 'tv', tvHit, tvWrap, refs, onSelect);
  refs.hoverGlows['tv']
    ?.poly([tvA.x, tvA.y - 110, tvB.x, tvB.y - 110, tvB.x, tvB.y - 50, tvA.x, tvA.y - 50])
    .stroke({ width: 3, color: 0x5aa9e6 });

  /* ---- Wall clock (left wall, near back) ------------------------------ */
  const clockWrap = new Container();
  const clockPos = iso(0, 2.2);
  const clock = new Graphics();
  clock.circle(clockPos.x, clockPos.y - 100, 17).fill(0xf2f2f2);
  clock.circle(clockPos.x, clockPos.y - 100, 17).stroke({ width: 3, color: COLORS.wallTrim });
  clockWrap.addChild(clock);
  const hand = new Graphics();
  hand.rect(-1.5, -12, 3, 12).fill(0x222222);
  hand.position.set(clockPos.x, clockPos.y - 100);
  refs.clockHand = hand;
  clockWrap.addChild(hand);
  root.addChild(clockWrap);
  const clockHit = new Graphics();
  clockHit.circle(clockPos.x, clockPos.y - 100, 30).fill(0xffffff);
  addHotspot(root, 'clock', clockHit, clockWrap, refs, onSelect);
  refs.hoverGlows['clock']
    ?.circle(clockPos.x, clockPos.y - 100, 22)
    .stroke({ width: 3, color: 0xffd166 });

  /* ---- Floor ---------------------------------------------------------- */
  const floor = new Graphics();
  for (let x = 0; x < ROOM_W; x++) {
    for (let y = 0; y < ROOM_D; y++) {
      const shade = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      isoQuad(floor, x, y, x + 1, y + 1);
      floor.fill(shade);
      isoQuad(floor, x, y, x + 1, y + 1);
      floor.stroke({ width: .7, color: 0xf1d6a4, alpha: .08 });
    }
  }
  // Rug in the middle of the floor
  isoQuad(floor, 3, 4, 6, 6.4);
  floor.fill(COLORS.rug);
  isoQuad(floor, 3.2, 4.2, 5.8, 6.2);
  floor.fill(COLORS.rugInner);
  isoQuad(floor, 3.2, 4.2, 5.8, 6.2);
  floor.stroke({ width: 1.5, color: 0xe29d6c, alpha: .38 });
  root.addChild(floor);

  // Window spill and contact shadow place furniture on the floor plane.
  const lightAndShadow = new Graphics();
  const sun = [iso(5.1, .2), iso(6.9, .2), iso(6.6, 3.8), iso(4.9, 3.8)];
  lightAndShadow.poly(sun.flatMap(point => [point.x, point.y])).fill({ color: 0xb8ddf6, alpha: .075 });
  const deskFoot = iso(4.5, 4.2);
  lightAndShadow.ellipse(deskFoot.x, deskFoot.y + 3, 63, 23).fill({ color: 0x131620, alpha: .28 });
  root.addChild(lightAndShadow);

  const outline = new Graphics();
  isoQuad(outline, 0, 0, ROOM_W, ROOM_D);
  outline.stroke({ width: 3, color: COLORS.wallTrim });
  root.addChild(outline);

  /* ---- Live room glass + mic (back area) ------------------------------ */
  const liveWrap = new Container();
  const gA = iso(1.0, 0.9);
  const gB = iso(3.6, 0.9);
  const glassPoly = [gA.x, gA.y, gB.x, gB.y, gB.x, gB.y - 74, gA.x, gA.y - 74];
  const glass = new Graphics();
  glass.poly(glassPoly).fill({ color: COLORS.glass, alpha: 0.22 });
  glass.poly(glassPoly).stroke({ width: 3, color: COLORS.glassFrame, alpha: 0.85 });
  liveWrap.addChild(glass);

  const micBase = iso(2.2, 1.7);
  const mic = new Graphics();
  mic.ellipse(micBase.x, micBase.y, 14, 7).fill(0x22283a);
  mic.rect(micBase.x - 2, micBase.y - 46, 4, 46).fill(0x9aa4bf);
  mic.circle(micBase.x, micBase.y - 52, 8).fill(0xd9a441);
  liveWrap.addChild(mic);

  const liveHit = new Graphics();
  liveHit.poly([gA.x, gA.y, gB.x, gB.y, gB.x, gB.y - 90, gA.x, gA.y - 90]).fill(0xffffff);
  addHotspot(root, 'liveRoom', liveHit, liveWrap, refs, onSelect);
  refs.hoverGlows['liveRoom']
    ?.poly([gA.x, gA.y - 90, gB.x, gB.y - 90, gB.x, gB.y, gA.x, gA.y])
    .stroke({ width: 3, color: COLORS.glass });

  /* ---- Gear shelf (left side) ----------------------------------------- */
  const shelfWrap = new Container();
  // The shelf physically grows with the studio tier (bead ifx.3).
  const shelfExtension = tier >= 5 ? 2.0 : tier >= 3 ? 1.0 : 0;
  const q1 = iso(0.6, 4.6); // back-left
  const q2 = iso(2.2 + shelfExtension, 4.6); // back-right
  const q3 = iso(2.2 + shelfExtension, 5.6); // front-right
  const q4 = iso(0.6, 5.6); // front-left
  const shelfH = 44;
  const shelf = new Graphics();
  shelf
    .poly([q1.x, q1.y - shelfH, q2.x, q2.y - shelfH, q3.x, q3.y - shelfH, q4.x, q4.y - shelfH])
    .fill(COLORS.shelf);
  shelf.poly([q4.x, q4.y - shelfH, q3.x, q3.y - shelfH, q3.x, q3.y, q4.x, q4.y]).fill(COLORS.shelfSide);
  shelf.poly([q2.x, q2.y - shelfH, q3.x, q3.y - shelfH, q3.x, q3.y, q2.x, q2.y]).fill(COLORS.shelfSide);
  shelfWrap.addChild(shelf);
  // Gear items — count scales with owned equipment; shelf capacity grows with tier
  const gearCapacity = 6 + Math.round(shelfExtension * 4);
  const gearCount = Math.max(1, Math.min(gearCapacity, Math.ceil(state.ownedEquipment / 2)));
  const shelfSpanPx = Math.abs(q2.x - q1.x);
  const gearW = Math.max(6, Math.min(16, Math.floor(shelfSpanPx / gearCapacity) - 1));
  for (let i = 0; i < gearCount; i++) {
    const t = (i + 0.5) / gearCapacity;
    const gx = q1.x + (q2.x - q1.x) * t;
    const gy = q1.y + (q2.y - q1.y) * t - shelfH;
    const item = new Graphics();
    const itemH = 13 + (i % 3) * 3;
    item.rect(gx - gearW / 2, gy - itemH, gearW, itemH).fill(COLORS.gear[i % COLORS.gear.length]);
    shelfWrap.addChild(item);
  }
  const shelfHit = new Graphics();
  shelfHit.poly([q1.x, q1.y - 60, q2.x, q2.y - 60, q3.x, q3.y, q4.x, q4.y]).fill(0xffffff);
  addHotspot(root, 'shelf', shelfHit, shelfWrap, refs, onSelect);
  refs.hoverGlows['shelf']
    ?.poly([q1.x, q1.y - 60, q2.x, q2.y - 60, q3.x, q3.y, q4.x, q4.y])
    .stroke({ width: 3, color: 0xc77dff });

  /* ---- Mixing console (center) ---------------------------------------- */
  const deskWrap = new Container();
  const deskH = 40;
  const consoleProfile = getConsoleProfile(tier);

  // Isometric point on the desk (or lifted above it)
  const dPt = (gx: number, gy: number, lift = deskH) => {
    const p = iso(gx, gy);
    return { x: p.x, y: p.y - lift };
  };

  const p1 = dPt(3.1, 3.4); // back-left
  const p2 = dPt(5.9, 3.4); // back-right
  const p3 = dPt(5.9, 4.8); // front-right
  const p4 = dPt(3.1, 4.8); // front-left

  const desk = new Graphics();
  // Main desk surface
  desk.poly([p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y]).fill(consoleProfile.finish);
  // Front face (down-left)
  desk.poly([p4.x, p4.y, p3.x, p3.y, p3.x, p3.y + deskH, p4.x, p4.y + deskH]).fill(COLORS.deskSide);
  // Right face (down-right)
  desk.poly([p2.x, p2.y, p3.x, p3.y, p3.x, p3.y + deskH, p2.x, p2.y + deskH]).fill(COLORS.deskRight);

  // Padded leather armrest along the front edge
  const a1 = dPt(3.18, 4.68);
  const a2 = dPt(5.82, 4.68);
  const a3 = dPt(5.82, 4.80);
  const a4 = dPt(3.18, 4.80);
  desk.poly([a1.x, a1.y, a2.x, a2.y, a3.x, a3.y, a4.x, a4.y]).fill(consoleProfile.leatherRest);
  desk.poly([a4.x, a4.y, a3.x, a3.y, a3.x, a3.y + 4, a4.x, a4.y + 4]).fill(0x0e1116);

  // Hardwood side cheek end-panels
  const lCheekTop = [dPt(3.10, 3.4, deskH + 2), dPt(3.18, 3.4, deskH + 2), dPt(3.18, 4.8, deskH + 2), dPt(3.10, 4.8, deskH + 2)];
  desk.poly([lCheekTop[0].x, lCheekTop[0].y, lCheekTop[1].x, lCheekTop[1].y, lCheekTop[2].x, lCheekTop[2].y, lCheekTop[3].x, lCheekTop[3].y]).fill(consoleProfile.sideCheeks);
  desk.poly([lCheekTop[3].x, lCheekTop[3].y, lCheekTop[2].x, lCheekTop[2].y, lCheekTop[2].x, lCheekTop[2].y + deskH + 2, lCheekTop[3].x, lCheekTop[3].y + deskH + 2]).fill(0x1a120b);

  const rCheekTop = [dPt(5.82, 3.4, deskH + 2), dPt(5.90, 3.4, deskH + 2), dPt(5.90, 4.8, deskH + 2), dPt(5.82, 4.8, deskH + 2)];
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
      // Vintage amber backlit dial
      bridgeG.rect(mBase.x - slotW / 2, mTopPt.y, slotW, mBase.y - mTopPt.y).fill(0xffeaa7);
      bridgeG.rect(mBase.x - slotW / 2, mTopPt.y, slotW, mBase.y - mTopPt.y).stroke({ width: 0.5, color: 0x3d3122 });
      // Needle tick
      bridgeG.rect(mBase.x - 0.5, mTopPt.y + 2, 1, mBase.y - mTopPt.y - 3).fill(0x8a2323);
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
      color: tier === 1 ? 0xcc3333 : COLORS.gear[i % COLORS.gear.length],
      width: slotW,
      range: 9,
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

    // Solo/Mute indicator dots
    const soloPt = dPt(cgx - 0.02, 4.40);
    channelG.circle(soloPt.x, soloPt.y, 0.9).fill(0x22c55e);
    const mutePt = dPt(cgx + 0.02, 4.40);
    channelG.circle(mutePt.x, mutePt.y, 0.9).fill(0xef4444);

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
    channelG.ellipse(reel1.x, reel1.y, 4.5, 2.5).fill(0x718096);
    channelG.ellipse(reel1.x, reel1.y, 1.8, 1.0).fill(0x1a202c);
    channelG.ellipse(reel2.x, reel2.y, 4.5, 2.5).fill(0x718096);
    channelG.ellipse(reel2.x, reel2.y, 1.8, 1.0).fill(0x1a202c);
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
      // Status LEDs on rack unit
      const ledPt = dPt(5.58, (uGy1 + uGy2) / 2);
      channelG.circle(ledPt.x, ledPt.y, 1.2).fill(u % 2 === 0 ? 0x22c55e : 0xf59e0b);
      const meterPt = dPt(5.66, (uGy1 + uGy2) / 2);
      channelG.rect(meterPt.x, meterPt.y - 1, 6, 2).fill(0x38bdf8);
    }
  }
  deskWrap.addChild(channelG);

  // Desk interaction hit area and hover glow
  const deskHit = new Graphics();
  deskHit.poly([p1.x, p1.y - bridgeH - 18, p2.x, p2.y - bridgeH - 18, p3.x, p3.y + 4, p4.x, p4.y + 4]).fill(0xffffff);
  addHotspot(root, 'console', deskHit, deskWrap, refs, onSelect);
  refs.hoverGlows['console']
    ?.poly([p1.x, p1.y - bridgeH - 18, p2.x, p2.y - bridgeH - 18, p3.x, p3.y + 4, p4.x, p4.y + 4])
    .stroke({ width: 3, color: 0x7bd389 });

  const consoleHint = new Graphics();
  consoleHint
    .poly([p1.x, p1.y - bridgeH - 20, p2.x, p2.y - bridgeH - 20, p3.x, p3.y + 6, p4.x, p4.y + 6])
    .stroke({ width: 3.5, color: grade.accent, alpha: 0.95 });
  consoleHint.alpha = 0;
  consoleHint.eventMode = 'none';
  refs.idleHints.console = consoleHint;
  root.addChild(consoleHint);

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
  addHotspot(root, 'phone', phoneHit, phoneWrap, refs, onSelect);
  refs.hoverGlows['phone']
    ?.ellipse(pPos.x, pPos.y - 3, 22, 12)
    .stroke({ width: 3, color: 0xffd166 });

  const phoneHint = new Graphics();
  phoneHint.ellipse(pPos.x, pPos.y - 3, 24, 13).stroke({ width: 3.5, color: 0xffd166, alpha: 0.95 });
  phoneHint.alpha = 0;
  phoneHint.eventMode = 'none';
  refs.idleHints.phone = phoneHint;
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
  for (let i = 0; i < figureCount; i++) {
    const spot = spots[i];
    const fig = new Container();
    fig.position.set(spot.x, spot.y);
    const body = new Graphics();
    const color = COLORS.staff[i % COLORS.staff.length];
    body.ellipse(0, 1, 15, 7).fill({ color: 0x000000, alpha: .35 });
    body.roundRect(-8, -13, 7, 14, 2).fill(0x253047);
    body.roundRect(1, -13, 7, 14, 2).fill(0x253047);
    body.roundRect(-15, -34, 5, 18, 2).fill(0xe9bd96);
    body.roundRect(10, -34, 5, 18, 2).fill(0xe9bd96);
    body.roundRect(-11, -36, 22, 27, 5).fill(color);
    body.roundRect(-11, -36, 22, 27, 5).stroke({ width: 2, color: 0x243044, alpha: .55 });
    body.circle(0, -45, 11).fill(0xf2c9a0);
    body.ellipse(0, -52, 11, 5).fill(0x2e3040);
    body.circle(-4, -44, 1).fill(0x273040);
    body.circle(4, -44, 1).fill(0x273040);
    body.circle(-11, -43, 3).fill(grade.accent);
    body.circle(11, -43, 3).fill(grade.accent);
    fig.addChild(body);
    fig.zIndex = spot.y;
    refs.staffFigures.push({ fig, baseY: spot.y });
    root.addChild(fig);
  }

  root.sortableChildren = true;

  /* ---- Tier upgrade furniture (bead ifx.3) ---------------------------- */
  // Each ProgressionSystem milestone visibly adds/replaces studio furniture.
  if (tier >= 2) {
    const upgrades = new Graphics();
    // Potted plant in the back-left corner
    const plantBase = iso(0.55, 1.5);
    upgrades.ellipse(plantBase.x, plantBase.y, 12, 6).fill(0x1c2433);
    upgrades.rect(plantBase.x - 8, plantBase.y - 16, 16, 16).fill(0x7a4a2b);
    upgrades.circle(plantBase.x, plantBase.y - 30, 16).fill(0x3f7d4f);
    upgrades.circle(plantBase.x - 10, plantBase.y - 24, 10).fill(0x4f9a5f);
    upgrades.circle(plantBase.x + 10, plantBase.y - 26, 11).fill(0x357044);
    // First gold record frame on the right wall
    const frameA = iso(6.6, 0);
    const rec = { x: frameA.x, y: frameA.y - 88 };
    upgrades.rect(rec.x - 12, rec.y - 12, 24, 24).fill(0x2a1f0d);
    upgrades.rect(rec.x - 12, rec.y - 12, 24, 24).stroke({ width: 3, color: grade.accent });
    upgrades.circle(rec.x, rec.y, 8).fill(0xd9a441);
    root.addChild(upgrades);
  }

  if (tier >= 3) {
    const lounge = new Graphics();
    // Green-room sofa along the front-right corner
    const sofa = iso(6.0, 5.6);
    lounge.roundRect(sofa.x - 26, sofa.y - 26, 52, 24, 6).fill(0x5b3f6e);
    lounge.roundRect(sofa.x - 26, sofa.y - 34, 52, 12, 5).fill(0x6d4c85);
    lounge.rect(sofa.x - 22, sofa.y - 2, 6, 6).fill(0x2a1f33);
    lounge.rect(sofa.x + 16, sofa.y - 2, 6, 6).fill(0x2a1f33);
    // Road case next to the console
    const rc = iso(4.9, 2.4);
    lounge.rect(rc.x - 14, rc.y - 22, 28, 22).fill(0x38414f);
    lounge.rect(rc.x - 14, rc.y - 22, 28, 6).fill(0x4c5769);
    lounge.rect(rc.x - 14, rc.y - 11, 28, 3).fill(0x232a36);
    root.addChild(lounge);
  }

  if (tier >= 4) {
    const pro = new Graphics();
    // Acoustic treatment panels on the left wall
    for (let i = 0; i < 3; i++) {
      const p = iso(0, 3.1 + i * 0.8);
      pro.rect(p.x - 10, p.y - 78, 20, 34).fill(i % 2 === 0 ? 0x37506b : 0x2d4257);
      pro.rect(p.x - 10, p.y - 78, 20, 34).stroke({ width: 2, color: 0x1d2a3a });
    }
    // Second workstation rig
    const rig = iso(7.0, 3.2);
    pro.rect(rig.x - 16, rig.y - 34, 32, 34).fill(0x1d2433);
    pro.rect(rig.x - 12, rig.y - 29, 24, 16).fill(grade.accent);
    pro.rect(rig.x - 16, rig.y - 34, 32, 34).stroke({ width: 2, color: 0x0f1420 });
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
    // Neon strip behind the live room glass
    const neonA = iso(1.0, 0.7);
    const neonB = iso(3.6, 0.7);
    empire
      .poly([neonA.x, neonA.y - 82, neonB.x, neonB.y - 82, neonB.x, neonB.y - 76, neonA.x, neonA.y - 76])
      .fill(grade.accent);
    root.addChild(empire);
  }

  /* ---- Day/night + era tint overlay (screen space, on top) ------------ */
  const tintLayer = new Container();
  const tintRect = new Graphics();
  tintRect.rect(0, 0, width / fitScale, height / fitScale).fill(grade.tint);
  tintLayer.addChild(tintRect);
  tintLayer.alpha = 0;
  tintLayer.eventMode = 'none';
  tintLayer.position.set(-originX / fitScale, -originY / fitScale);
  refs.nightTintLayer = tintLayer;
  root.addChild(tintLayer);

  /* ---- CRT scanlines & Vignette Post-FX layers ------------ */
  const vignetteLayer = new Container();
  const vignetteG = new Graphics();
  const maxDim = Math.max(width, height) / fitScale;
  vignetteG.circle((width / 2) / fitScale, (height / 2) / fitScale, maxDim * 0.72)
    .stroke({ color: 0x140a04, width: 85, alpha: 0.28 });
  vignetteLayer.addChild(vignetteG);
  vignetteLayer.eventMode = 'none';
  vignetteLayer.position.set(-originX / fitScale, -originY / fitScale);
  refs.vignetteLayer = vignetteLayer;
  root.addChild(vignetteLayer);

  const crtLayer = new Container();
  const crtG = new Graphics();
  const screenW = width / fitScale;
  const screenH = height / fitScale;
  for (let y = 0; y < screenH; y += 4) {
    crtG.rect(0, y, screenW, 1.5).fill({ color: 0x000000, alpha: 0.14 });
  }
  crtLayer.addChild(crtG);
  crtLayer.eventMode = 'none';
  crtLayer.position.set(-originX / fitScale, -originY / fitScale);
  refs.crtLayer = crtLayer;
  root.addChild(crtLayer);

  /* ---- Emissive Bloom & Glow Layer (additive blend) ------------ */
  const bloomLayer = new Container();
  bloomLayer.eventMode = 'none';
  bloomLayer.blendMode = 'add';
  const meterBloom = new Graphics();
  refs.vuBars.forEach((bar) => {
    meterBloom.circle(bar.x, bar.y - 4, 7).fill({ color: 0xffb347, alpha: 0.35 });
  });
  refs.tvBars.forEach((bar) => {
    meterBloom.circle(bar.x, bar.y, 6).fill({ color: 0x5aa9e6, alpha: 0.25 });
  });
  bloomLayer.addChild(meterBloom);
  refs.bloomLayer = bloomLayer;
  root.addChild(bloomLayer);

  return { root, refs, basePosition: { x: originX, y: originY }, baseScale: fitScale };
};

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */
const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ state, onHotspotSelect, className, resetCameraKey }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<BuiltScene | null>(null);
  const stateRef = useRef<StudioSceneState>({ ...DEFAULT_STATE, ...state });
  const selectRef = useRef(onHotspotSelect);
  const timeRef = useRef(0);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1.0 });
  const gestureRef = useRef(new Map<number, { x: number; y: number }>());
  const suppressTapRef = useRef(false);
  const gestureMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const lastCanvasInputRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  const { settings } = useSettings();
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    const app = appRef.current;
    if (app && app.renderer) {
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
    cameraRef.current = { x: 0, y: 0, zoom: 1.0 };
    const sc = sceneRef.current;
    if (sc) {
      sc.root.scale.set(sc.baseScale);
      sc.root.position.set(sc.basePosition.x, sc.basePosition.y);
    }
  }, [resetCameraKey]);

  // Structural key: only layout-affecting state triggers a scene rebuild
  const structuralKey = `${state?.staffOnFloor ?? 1}|${state?.ownedEquipment ?? 3}|${state?.eraId ?? 'analog60s'}|${state?.roomTier ?? 1}`;

  // Rebuild the room (new window size or layout change)
  const rebuild = () => {
    const app = appRef.current;
    if (!app) return;
    if (sceneRef.current) {
      app.stage.removeChild(sceneRef.current.root);
      sceneRef.current.root.destroy({ children: true });
    }
    const scene = buildScene(
      app.screen.width,
      app.screen.height,
      stateRef.current,
      (id) => { if (!suppressTapRef.current) selectRef.current?.(id); }
    );
    const zoom = cameraRef.current.zoom ?? 1.0;
    scene.root.scale.set(scene.baseScale * zoom);
    scene.root.position.set(
      scene.basePosition.x + cameraRef.current.x,
      scene.basePosition.y + cameraRef.current.y,
    );
    if (settingsRef.current) {
      if (scene.refs.crtLayer) scene.refs.crtLayer.visible = Boolean(settingsRef.current.crtScanlines);
      if (scene.refs.vignetteLayer) scene.refs.vignetteLayer.visible = Boolean(settingsRef.current.analogTapeWarmth);
      if (scene.refs.bloomLayer) scene.refs.bloomLayer.visible = Boolean(settingsRef.current.bloomAndGlow);
    }
    app.stage.addChild(scene.root);
    sceneRef.current = scene;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let lastW = 0;
    let lastH = 0;
    let detachInteractions: (() => void) | undefined;
    let gestureDistance: number | null = null;
    let lastGestureScale = 1;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const MIN_ZOOM = 0.75;
    const MAX_ZOOM = 2.6;

    const zoomAt = (clientX: number, clientY: number, factor: number) => {
      const app = appRef.current;
      const scene = sceneRef.current;
      if (!app || !scene || !Number.isFinite(factor) || factor <= 0) return;

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
        const app = new Application();
        const initialRes = calculateEffectiveResolution(
          window.devicePixelRatio || 1,
          settingsRef.current?.resolutionScale
        );
        await app.init({
          background: 0x11151f,
          resizeTo: container,
          antialias: true,
          autoDensity: true,
          resolution: initialRes,
        });
        if (disposed) {
          app.destroy(true, { children: true });
          return;
        }
        appRef.current = app;
        container.appendChild(app.canvas);
        app.canvas.style.touchAction = 'none';
        app.canvas.setAttribute('aria-label', 'Interactive studio floor. Tap objects to inspect. Pinch to zoom or use two fingers to pan.');
        lastW = app.screen.width;
        lastH = app.screen.height;
        rebuild();

        const markCanvasInput = () => {
          lastCanvasInputRef.current = performance.now();
          const hints = sceneRef.current?.refs.idleHints;
          if (hints?.phone) hints.phone.alpha = 0;
          if (hints?.console) hints.console.alpha = 0;
        };
        markCanvasInput();

        const midpoint = () => {
          const pointers = [...gestureRef.current.values()];
          return { x: (pointers[0].x + pointers[1].x) / 2, y: (pointers[0].y + pointers[1].y) / 2 };
        };
        const onPointerDown = (event: PointerEvent) => {
          markCanvasInput();
          if (gestureRef.current.size === 0) suppressTapRef.current = false;
          gestureRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
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
          cameraRef.current = { x: 0, y: 0, zoom: 1.0 };
          const sc = sceneRef.current;
          if (sc) {
            sc.root.scale.set(sc.baseScale);
            sc.root.position.set(sc.basePosition.x, sc.basePosition.y);
          }
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

          const idleMs = performance.now() - lastCanvasInputRef.current;
          const hintedHotspot = getIdleHintTarget(s.hasActiveProject, idleMs);
          (['phone', 'console'] as const).forEach((id) => {
            const hint = refs.idleHints[id];
            if (!hint) return;
            if (id !== hintedHotspot) {
              hint.alpha = 0;
              return;
            }
            const pulse = reduceMotion ? 0.72 : 0.42 + (Math.sin(t * 3.2) + 1) * 0.24;
            hint.alpha = pulse;
          });

          // Console VU meters — amplitude follows live activity
          refs.vuBars.forEach((bar, i) => {
            const wobble = 0.5 + 0.5 * Math.sin(t * (3 + i * 0.7) + i * 1.3);
            const maxRange = bar.range ?? 9;
            const h = Math.min(maxRange, 1.5 + wobble * (1.5 + s.activity * (maxRange - 3)));
            const width = bar.width ?? 3.5;
            bar.g.clear();
            bar.g.rect(bar.x - width / 2, bar.y - h, width, h).fill(bar.color);
          });

          // Charts TV equalizer
          refs.tvBars.forEach((bar, i) => {
            const h = 5 + (0.5 + 0.5 * Math.sin(t * 4 + i * 1.1)) * (5 + s.activity * 24);
            bar.g.clear();
            bar.g.rect(bar.x - 5, bar.y - h, 10, h).fill(bar.color);
          });

          // Staff idle bobbing
          refs.staffFigures.forEach((f, i) => {
            f.fig.y = f.baseY + Math.sin(t * 2 + i * 1.4) * 2;
            f.fig.scale.y = 1 + Math.sin(t * 3 + i) * 0.02;
          });

          // Phone ring pulse (faster when the studio is waiting for a gig)
          if (refs.phoneRing) {
            const speed = s.hasActiveProject ? 1.2 : 3;
            const pulse = (Math.sin(t * speed) + 1) / 2;
            refs.phoneRing.alpha = 0.15 + pulse * 0.85;
            refs.phoneRing.scale.set(1 + pulse * 0.25);
          }

          // Wall clock hand sweeps as days pass
          if (refs.clockHand) {
            refs.clockHand.rotation = (t * 0.35 + s.day * 0.4) % (Math.PI * 2);
          }

          // Ambient day/night tint — slow 90s cycle keeps the room alive
          if (refs.nightTintLayer) {
            const cycle = (Math.sin((t * Math.PI * 2) / 90) + 1) / 2;
            refs.nightTintLayer.alpha = 0.05 + cycle * 0.28;
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
                cameraRef.current = { x: 0, y: 0, zoom: 1.0 };
                const sc = sceneRef.current;
                if (sc) {
                  sc.root.scale.set(sc.baseScale);
                  sc.root.position.set(sc.basePosition.x, sc.basePosition.y);
                }
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
        cameraRef.current = { x: 0, y: 0, zoom: 1 };
        if (!disposed) rebuild();
      }
    });
    observer.observe(container);

    return () => {
      disposed = true;
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
