import React, { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';

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
  floorA: 0x6b4f3a,
  floorB: 0x5d4433,
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

const getEraGrade = (eraId?: string) => ERA_GRADES[eraId ?? 'analog60s'] ?? ERA_GRADES.analog60s;

/** Studio tier furniture/upgrade thresholds (bead ifx.3). */
const clampTier = (tier?: number): 1 | 2 | 3 | 4 | 5 => {
  const t = Math.max(1, Math.min(5, Math.round(tier ?? 1)));
  return t as 1 | 2 | 3 | 4 | 5;
};

/** An animatable bar (VU meters, TV equalizer) with a fixed baseline */
interface AnimBar {
  g: Graphics;
  x: number;
  y: number;
  color: number;
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
}

interface BuiltScene {
  root: Container;
  refs: SceneRefs;
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
  hit.on('pointerdown', () => { onSelect?.(id); });

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
  };

  // Era colour grade + studio tier drive the room's look (beads goj.3 / ifx.3)
  const grade = getEraGrade(state.eraId);
  const tier = clampTier(state.roomTier);

  // Fit the whole room into the viewport so walls/floor never clip
  const bounds = { minX: -196, maxX: 224, minY: -135, maxY: 215 };
  const fitScale = Math.min(
    (width - 60) / (bounds.maxX - bounds.minX),
    (height - 40) / (bounds.maxY - bounds.minY),
    1.15
  );
  root.scale.set(fitScale);
  const originX = width / 2 - ((bounds.minX + bounds.maxX) / 2) * fitScale;
  const originY = height / 2 - ((bounds.minY + bounds.maxY) / 2) * fitScale;
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
  // Top trim
  walls
    .poly([wl0.x, wl0.y - WALL_H, wl1.x, wl1.y - WALL_H, wr1.x, wr1.y - WALL_H])
    .stroke({ width: 6, color: COLORS.wallTrim });
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
    }
  }
  // Rug in the middle of the floor
  isoQuad(floor, 3, 4, 6, 6.4);
  floor.fill(COLORS.rug);
  isoQuad(floor, 3.2, 4.2, 5.8, 6.2);
  floor.fill(COLORS.rugInner);
  root.addChild(floor);

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
  const p1 = iso(3.1, 3.4); // back-left
  const p2 = iso(5.9, 3.4); // back-right
  const p3 = iso(5.9, 4.8); // front-right
  const p4 = iso(3.1, 4.8); // front-left
  const deskH = 40;
  const desk = new Graphics();
  desk
    .poly([p1.x, p1.y - deskH, p2.x, p2.y - deskH, p3.x, p3.y - deskH, p4.x, p4.y - deskH])
    .fill(COLORS.deskTop);
  desk.poly([p4.x, p4.y - deskH, p3.x, p3.y - deskH, p3.x, p3.y, p4.x, p4.y]).fill(COLORS.deskSide);
  desk.poly([p2.x, p2.y - deskH, p3.x, p3.y - deskH, p3.x, p3.y, p2.x, p2.y]).fill(COLORS.deskRight);
  deskWrap.addChild(desk);

  // Two studio monitors sitting on the desk
  const deskCx = (p1.x + p3.x) / 2;
  const deskCy = (p1.y + p3.y) / 2 - deskH;
  const monitors = new Graphics();
  monitors.rect(deskCx - 44, deskCy - 30, 36, 30).fill(0x141a26);
  monitors.rect(deskCx - 44, deskCy - 30, 36, 30).stroke({ width: 3, color: 0x0d111a });
  monitors.rect(deskCx + 8, deskCy - 30, 36, 30).fill(0x141a26);
  monitors.rect(deskCx + 8, deskCy - 30, 36, 30).stroke({ width: 3, color: 0x0d111a });
  monitors.rect(deskCx - 41, deskCy - 27, 30, 24).fill(0x2f6fb3);
  monitors.rect(deskCx + 11, deskCy - 27, 30, 24).fill(0x3f8f6f);
  deskWrap.addChild(monitors);

  // Fader strip along the front edge of the desk (animated every frame)
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8;
    const vx = p4.x + (p3.x - p4.x) * t;
    const vy = p4.y + (p3.y - p4.y) * t - deskH;
    const bar = new Graphics();
    deskWrap.addChild(bar);
    refs.vuBars.push({ g: bar, x: vx, y: vy, color: COLORS.gear[i % COLORS.gear.length] });
  }

  const deskHit = new Graphics();
  deskHit.poly([p1.x, p1.y - deskH - 55, p2.x, p2.y - deskH - 55, p3.x, p3.y, p4.x, p4.y]).fill(0xffffff);
  addHotspot(root, 'console', deskHit, deskWrap, refs, onSelect);
  refs.hoverGlows['console']
    ?.poly([p1.x, p1.y - deskH - 55, p2.x, p2.y - deskH - 55, p3.x, p3.y, p4.x, p4.y])
    .stroke({ width: 3, color: 0x7bd389 });

  /* ---- Studio phone (on the desk corner) ------------------------------ */
  const phoneWrap = new Container();
  const pPos = iso(5.6, 3.6);
  const phone = new Graphics();
  phone.rect(pPos.x - 10, pPos.y - deskH - 8, 20, 12).fill(0xd94f4f);
  phone.rect(pPos.x - 7, pPos.y - deskH - 5, 14, 6).fill(0x8f2f2f);
  phoneWrap.addChild(phone);
  const ring = new Graphics();
  ring.circle(pPos.x, pPos.y - deskH - 2, 16).stroke({ width: 2, color: 0xffd166, alpha: 0.9 });
  refs.phoneRing = ring;
  phoneWrap.addChild(ring);
  const phoneHit = new Graphics();
  phoneHit.circle(pPos.x, pPos.y - deskH - 2, 26).fill(0xffffff);
  addHotspot(root, 'phone', phoneHit, phoneWrap, refs, onSelect);
  refs.hoverGlows['phone']
    ?.circle(pPos.x, pPos.y - deskH - 2, 22)
    .stroke({ width: 3, color: 0xffd166 });

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
    body.ellipse(0, 0, 13, 6).fill({ color: 0x000000, alpha: 0.3 });
    body.roundRect(-8, -30, 16, 30, 6).fill(color);
    body.circle(0, -38, 10).fill(0xf2c9a0);
    fig.addChild(body);
    fig.zIndex = spot.y;
    refs.staffFigures.push({ fig, baseY: spot.y });
    root.addChild(fig);
  }

  /* ---- Diegetic room signage ------------------------------------------ */
  const sign = new Text({
    text: `${grade.label} · ${tier >= 5 ? 'HIT FACTORY' : tier >= 4 ? 'STUDIO A' : tier >= 3 ? 'PROJECT STUDIO' : tier >= 2 ? 'BEDROOM+ STUDIO' : 'HOME STUDIO'}`,
    style: { fontFamily: 'Arial', fontSize: 13, fill: 0xdbe4ff, letterSpacing: 3 },
  });
  const signPos = iso(2.3, 0.9);
  sign.position.set(signPos.x - sign.width / 2, signPos.y - 96);
  root.addChild(sign);

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

  return { root, refs };
};

/* ---------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------- */
const WebGLCanvas: React.FC<WebGLCanvasProps> = ({ state, onHotspotSelect, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<BuiltScene | null>(null);
  const stateRef = useRef<StudioSceneState>({ ...DEFAULT_STATE, ...state });
  const selectRef = useRef(onHotspotSelect);
  const timeRef = useRef(0);

  // Keep the latest props in refs so the ticker/callbacks never go stale
  useEffect(() => {
    stateRef.current = { ...DEFAULT_STATE, ...state };
  }, [state]);

  useEffect(() => {
    selectRef.current = onHotspotSelect;
  }, [onHotspotSelect]);

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
      (id) => selectRef.current?.(id)
    );
    app.stage.addChild(scene.root);
    sceneRef.current = scene;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let lastW = 0;
    let lastH = 0;

    const boot = async () => {
      try {
        const app = new Application();
        await app.init({
          background: 0x11151f,
          resizeTo: container,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        });
        if (disposed) {
          app.destroy(true, { children: true });
          return;
        }
        appRef.current = app;
        container.appendChild(app.canvas);
        lastW = app.screen.width;
        lastH = app.screen.height;
        rebuild();

        // Animation loop: VU meters, TV equalizer, phone ring, clock, staff, day tint
        app.ticker.add((ticker) => {
          const s = stateRef.current;
          timeRef.current += ticker.deltaMS;
          const t = timeRef.current / 1000;
          const scene = sceneRef.current;
          if (!scene) return;
          const refs = scene.refs;

          // Console VU meters — amplitude follows live activity
          refs.vuBars.forEach((bar, i) => {
            const wobble = 0.5 + 0.5 * Math.sin(t * (3 + i * 0.7) + i * 1.3);
            const h = 5 + wobble * (5 + s.activity * 30);
            bar.g.clear();
            bar.g.rect(bar.x - 5, bar.y - h, 10, h).fill(bar.color);
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
      const w = app.screen.width;
      const h = app.screen.height;
      if (Math.abs(w - lastW) > 2 || Math.abs(h - lastH) > 2) {
        lastW = w;
        lastH = h;
        if (!disposed) rebuild();
      }
    });
    observer.observe(container);

    return () => {
      disposed = true;
      observer.disconnect();
      const app = appRef.current;
      if (app) {
        app.destroy(true, { children: true });
        appRef.current = null;
        sceneRef.current = null;
      }
      if (container) container.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild when the room layout changes (staff hired, gear bought) — after boot
  useEffect(() => {
    if (appRef.current) rebuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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





