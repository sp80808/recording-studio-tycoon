// Data-driven isometric room layouts (#248). Each StudioRoomType maps to a layout profile: footprint,
// palette, lighting, props, wall treatments, hotspots and staff spots. The Pixi scene is built from this
// data by `roomLayoutScene.ts` on the one shared Pixi Application. Pure data and helpers: no Pixi imports.
//
// Coordinates are floor tiles with the room's back corner at (0,0): the left wall runs along x = 0 and the
// right wall along y = 0 (same convention as `isoMath`). A prop's (x, y) is its centre.
import type { StudioRoomType } from '@/types/game';

/** Hotspot ids the layout engine may expose; a subset of the studio's StudioHotspotId union. */
export type RoomHotspotId = 'console' | 'liveRoom' | 'shelf' | 'phone' | 'tv';

export type RoomPropKind =
  | 'rug'
  | 'micStand'
  | 'desk'
  | 'sofa'
  | 'headphoneStand'
  | 'drumKit'
  | 'ampStack'
  | 'micBoom'
  | 'stageBox'
  | 'console'
  | 'nearfield'
  | 'rack'
  | 'bassTrap'
  | 'plant'
  | 'lamp';

export interface RoomPropSpec {
  id: string;
  kind: RoomPropKind;
  x: number;
  y: number;
  /** Interactive hotspot this prop provides (at most one prop per hotspot id). */
  hotspot?: RoomHotspotId;
  /** Footprint override in tiles (rugs scale per room). */
  w?: number;
  d?: number;
}

export type RoomWallTreatmentKind = 'foam' | 'diffuser' | 'panel' | 'brick';

export interface RoomWallSpec {
  side: 'left' | 'right';
  /** Tile range along the wall (y for the left wall, x for the right wall). */
  from: number;
  to: number;
  kind: RoomWallTreatmentKind;
  /** Height range in px above the floor. */
  lift0?: number;
  lift1?: number;
}

export interface RoomPalette {
  floorA: number;
  floorB: number;
  wallLeft: number;
  wallRight: number;
  trim: number;
  rug: number;
  /** Accent used for lamps, the on-air light and hotspot hints. */
  accent: number;
}

export interface RoomHotspotSpec {
  id: RoomHotspotId;
  propId: string;
  label: string;
}

export interface RoomLayoutProfile {
  type: StudioRoomType;
  label: string;
  footprint: { width: number; depth: number };
  palette: RoomPalette;
  /** 0 (bright) .. 1 (dark): how much the room is dimmed so each suite has its own lighting identity. */
  dim: number;
  props: RoomPropSpec[];
  walls: RoomWallSpec[];
  hotspots: RoomHotspotSpec[];
  /** Floor spots reserved for people (producer, artist, crew); no prop may sit on one. */
  staffSpots: { x: number; y: number }[];
  /** Tile where the on-air lamp is mounted on the right wall. */
  onAirX: number;
  /** Window with a live sky, sun/moon and skyline driven by the studio clock. */
  window: RoomWindowSpec;
  /** Where the booked artist stands during a session, and the floor tile they walk in from. */
  artistSpot: { x: number; y: number };
  doorSpot: { x: number; y: number };
  /** Resting camera: the tile centred on screen and a zoom multiplier on top of the fit-to-room scale. */
  camera: { focus: { x: number; y: number }; zoom: number };
}

export interface RoomWindowSpec {
  side: 'left' | 'right';
  /** Tile range along the wall; keep it clear of wall treatments and the on-air lamp. */
  from: number;
  to: number;
}

/** Half-width of the right-wall ON AIR lightbox, in tiles. */
export const ROOM_ON_AIR_HALF = 0.6;

/** Door in the left wall, centred on doorSpot.y: half its width in tiles and its height in px. */
export const ROOM_DOOR = { half: 0.55, height: 82 } as const;

/** Glass extent above the floor in px, shared by the scene and the layout checks. */
export const ROOM_WINDOW_LIFT = { bottom: 34, top: 96 } as const;

/** Footprint of each prop kind in tiles (width along x, depth along y) and its rough height in px. */
export const PROP_METRICS: Record<RoomPropKind, { w: number; d: number; h: number }> = {
  rug: { w: 3, d: 3, h: 0 },
  micStand: { w: 1, d: 1, h: 92 },
  desk: { w: 2, d: 1, h: 58 },
  sofa: { w: 2, d: 1, h: 36 },
  headphoneStand: { w: 0.6, d: 0.6, h: 50 },
  drumKit: { w: 2, d: 2, h: 66 },
  ampStack: { w: 1, d: 0.8, h: 70 },
  micBoom: { w: 0.6, d: 0.6, h: 80 },
  stageBox: { w: 1, d: 0.8, h: 22 },
  console: { w: 3, d: 1.3, h: 46 },
  nearfield: { w: 0.6, d: 0.6, h: 70 },
  rack: { w: 0.9, d: 0.7, h: 58 },
  bassTrap: { w: 0.6, d: 0.6, h: 96 },
  plant: { w: 0.7, d: 0.7, h: 56 },
  lamp: { w: 0.5, d: 0.5, h: 80 },
};

const VOCAL_SUITE: RoomLayoutProfile = {
  type: 'vocal-suite',
  label: 'Vocal Suite',
  footprint: { width: 6, depth: 6 },
  palette: { floorA: 0x5a4636, floorB: 0x52402f, wallLeft: 0x3a2f3c, wallRight: 0x463a48, trim: 0x261b22, rug: 0x7a3340, accent: 0xff5a4a },
  dim: 0.08,
  props: [
    { id: 'boothRug', kind: 'rug', x: 3.0, y: 2.9 },
    { id: 'vocalMic', kind: 'micStand', x: 3.0, y: 2.9, hotspot: 'liveRoom' },
    { id: 'cueDesk', kind: 'desk', x: 4.5, y: 0.9, hotspot: 'console' },
    { id: 'headphones', kind: 'headphoneStand', x: 0.8, y: 1.6 },
    { id: 'lounge', kind: 'sofa', x: 1.9, y: 5.2 },
    { id: 'trapCorner', kind: 'bassTrap', x: 0.7, y: 0.7 },
    { id: 'fern', kind: 'plant', x: 5.2, y: 5.2 },
  ],
  walls: [
    { side: 'right', from: 0.4, to: 3.1, kind: 'foam', lift0: 30, lift1: 112 },
    { side: 'left', from: 0.4, to: 2.75, kind: 'foam', lift0: 30, lift1: 112 },
    { side: 'left', from: 4.05, to: 5.6, kind: 'foam', lift0: 30, lift1: 112 },
  ],
  hotspots: [
    { id: 'liveRoom', propId: 'vocalMic', label: 'Vocal booth' },
    { id: 'console', propId: 'cueDesk', label: 'Cue desk' },
  ],
  staffSpots: [{ x: 4.5, y: 2.1 }, { x: 1.7, y: 3.4 }],
  onAirX: 2.9,
  window: { side: 'right', from: 3.8, to: 5.5 },
  artistSpot: { x: 3.0, y: 3.8 },
  doorSpot: { x: 0.5, y: 3.4 },
  camera: { focus: { x: 3.0, y: 3.0 }, zoom: 1.0 },
};

const LIVE_ROOM: RoomLayoutProfile = {
  type: 'live-room',
  label: 'Live Room',
  footprint: { width: 8, depth: 8 },
  palette: { floorA: 0x6b4a33, floorB: 0x634430, wallLeft: 0x5a3a30, wallRight: 0x6a463a, trim: 0x2c1c16, rug: 0x8c3b3b, accent: 0xff7a4a },
  dim: 0,
  props: [
    { id: 'liveRug', kind: 'rug', x: 4.4, y: 3.6, w: 5, d: 4 },
    { id: 'drums', kind: 'drumKit', x: 4.4, y: 3.2, hotspot: 'liveRoom' },
    { id: 'ampWall', kind: 'ampStack', x: 6.9, y: 0.8, hotspot: 'shelf' },
    { id: 'ampTwo', kind: 'ampStack', x: 5.8, y: 0.8 },
    { id: 'stageBox', kind: 'stageBox', x: 1.2, y: 1.2, hotspot: 'console' },
    { id: 'boomA', kind: 'micBoom', x: 3.1, y: 5.3 },
    { id: 'boomB', kind: 'micBoom', x: 5.9, y: 5.2 },
    { id: 'bench', kind: 'sofa', x: 1.6, y: 6.8 },
    { id: 'trapCorner', kind: 'bassTrap', x: 0.5, y: 0.5 },
  ],
  walls: [
    { side: 'right', from: 0.4, to: 5.2, kind: 'brick', lift0: 0, lift1: 120 },
    { side: 'right', from: 5.2, to: 7.8, kind: 'foam', lift0: 24, lift1: 104 },
    { side: 'left', from: 0.4, to: 2.55, kind: 'diffuser', lift0: 24, lift1: 108 },
    { side: 'left', from: 6.6, to: 7.6, kind: 'foam', lift0: 24, lift1: 108 },
  ],
  hotspots: [
    { id: 'liveRoom', propId: 'drums', label: 'Live floor' },
    { id: 'shelf', propId: 'ampWall', label: 'Amp wall' },
    { id: 'console', propId: 'stageBox', label: 'Tracking patch' },
  ],
  staffSpots: [{ x: 4.4, y: 6.3 }, { x: 2.6, y: 3.4 }, { x: 6.8, y: 4.2 }],
  onAirX: 3.4,
  window: { side: 'left', from: 3.9, to: 6.4 },
  artistSpot: { x: 4.4, y: 4.9 },
  doorSpot: { x: 0.5, y: 3.2 },
  camera: { focus: { x: 4.4, y: 4.0 }, zoom: 1.0 },
};

const MIX_SUITE: RoomLayoutProfile = {
  type: 'mix-suite',
  label: 'Mix Suite',
  footprint: { width: 7, depth: 6 },
  palette: { floorA: 0x3c322b, floorB: 0x362d27, wallLeft: 0x22282c, wallRight: 0x2a3136, trim: 0x14181a, rug: 0x2c4a4a, accent: 0x59d98a },
  dim: 0.32,
  props: [
    { id: 'mixRug', kind: 'rug', x: 3.4, y: 3.4, w: 4, d: 3 },
    { id: 'mixConsole', kind: 'console', x: 3.4, y: 2.2, hotspot: 'console' },
    { id: 'mainL', kind: 'nearfield', x: 1.6, y: 1.0 },
    { id: 'mainR', kind: 'nearfield', x: 5.2, y: 1.0 },
    { id: 'outboardA', kind: 'rack', x: 6.3, y: 0.8, hotspot: 'shelf' },
    { id: 'outboardB', kind: 'rack', x: 6.3, y: 1.8 },
    { id: 'clientCouch', kind: 'sofa', x: 3.4, y: 5.0 },
    { id: 'trapCorner', kind: 'bassTrap', x: 0.7, y: 0.7 },
    { id: 'lamp', kind: 'lamp', x: 0.8, y: 4.6 },
  ],
  walls: [
    { side: 'right', from: 0.4, to: 3.9, kind: 'diffuser', lift0: 26, lift1: 112 },
    { side: 'left', from: 0.4, to: 2.35, kind: 'foam', lift0: 26, lift1: 112 },
    { side: 'left', from: 3.65, to: 5.6, kind: 'foam', lift0: 26, lift1: 112 },
  ],
  hotspots: [
    { id: 'console', propId: 'mixConsole', label: 'Mix console' },
    { id: 'shelf', propId: 'outboardA', label: 'Outboard racks' },
  ],
  staffSpots: [{ x: 3.4, y: 3.9 }, { x: 1.8, y: 3.3 }],
  onAirX: 3.4,
  window: { side: 'right', from: 4.3, to: 5.7 },
  artistSpot: { x: 5.3, y: 4.4 },
  doorSpot: { x: 0.5, y: 3.0 },
  camera: { focus: { x: 3.4, y: 2.8 }, zoom: 1.1 },
};

/**
 * Profiles for the extra rooms. `project-studio` (Studio A) is intentionally absent: it keeps the rich
 * hand-built scene in `WebGLCanvas.buildScene`, so the lookup returns null and the caller uses that path.
 */
export const ROOM_LAYOUT_PROFILES: Partial<Record<StudioRoomType, RoomLayoutProfile>> = {
  'vocal-suite': VOCAL_SUITE,
  'live-room': LIVE_ROOM,
  'mix-suite': MIX_SUITE,
};

export const getRoomLayoutProfile = (type?: StudioRoomType | null): RoomLayoutProfile | null =>
  (type ? ROOM_LAYOUT_PROFILES[type] : null) ?? null;

export const propRect = (p: RoomPropSpec) => {
  const m = PROP_METRICS[p.kind];
  const w = p.w ?? m.w;
  const d = p.d ?? m.d;
  return { x0: p.x - w / 2, x1: p.x + w / 2, y0: p.y - d / 2, y1: p.y + d / 2 };
};

/** Structural validation used by the checks: returns a list of human-readable problems (empty = valid). */
export const validateRoomLayout = (profile: RoomLayoutProfile): string[] => {
  const problems: string[] = [];
  const { width, depth } = profile.footprint;
  const solids = profile.props.filter((p) => p.kind !== 'rug');
  const ids = new Set<string>();
  for (const p of profile.props) {
    if (ids.has(p.id)) problems.push(`duplicate prop id ${p.id}`);
    ids.add(p.id);
    const r = propRect(p);
    if (r.x0 < 0 || r.y0 < 0 || r.x1 > width || r.y1 > depth) problems.push(`${p.id} leaves the footprint`);
  }
  for (let i = 0; i < solids.length; i++) {
    for (let j = i + 1; j < solids.length; j++) {
      const a = propRect(solids[i]);
      const b = propRect(solids[j]);
      if (a.x0 < b.x1 - 0.05 && a.x1 > b.x0 + 0.05 && a.y0 < b.y1 - 0.05 && a.y1 > b.y0 + 0.05) problems.push(`${solids[i].id} overlaps ${solids[j].id}`);
    }
  }
  for (const s of profile.staffSpots) {
    if (s.x < 0 || s.y < 0 || s.x > width || s.y > depth) problems.push('staff spot outside the footprint');
    for (const p of solids) {
      const r = propRect(p);
      if (s.x > r.x0 - 0.15 && s.x < r.x1 + 0.15 && s.y > r.y0 - 0.15 && s.y < r.y1 + 0.15) problems.push(`staff spot (${s.x},${s.y}) is blocked by ${p.id}`);
    }
  }
  for (const [label, spot] of [['artist spot', profile.artistSpot], ['door spot', profile.doorSpot]] as const) {
    if (spot.x < 0 || spot.y < 0 || spot.x > width || spot.y > depth) problems.push(`${label} outside the footprint`);
  }
  for (const p of solids) {
    const r = propRect(p);
    const a = profile.artistSpot;
    if (a.x > r.x0 - 0.15 && a.x < r.x1 + 0.15 && a.y > r.y0 - 0.15 && a.y < r.y1 + 0.15) problems.push(`artist spot is blocked by ${p.id}`);
  }
  for (const s of profile.staffSpots) {
    if (Math.hypot(s.x - profile.artistSpot.x, s.y - profile.artistSpot.y) < 0.9) problems.push('artist spot crowds a staff spot');
  }
  {
    const win = profile.window;
    const max = win.side === 'right' ? width : depth;
    if (win.from < 0 || win.to > max || win.to <= win.from) problems.push('window out of range');
    for (const w of profile.walls) {
      if (w.side === win.side && w.from < win.to && w.to > win.from) problems.push(`window overlaps ${w.kind} wall treatment`);
    }
    if (win.side === 'right' && profile.onAirX + ROOM_ON_AIR_HALF > win.from && profile.onAirX - ROOM_ON_AIR_HALF < win.to) problems.push('window overlaps the on-air lamp');
  }
  {
    // The door is cut into the left wall where the artist walks in: keep it on the wall, clear of
    // the window and of wall treatments, and with nothing standing in front of it.
    const d0 = profile.doorSpot.y - ROOM_DOOR.half;
    const d1 = profile.doorSpot.y + ROOM_DOOR.half;
    if (d0 < 0.15 || d1 > depth - 0.15) problems.push('door runs off the left wall');
    if (profile.window.side === 'left' && d0 < profile.window.to && d1 > profile.window.from) problems.push('door overlaps the window');
    for (const w of profile.walls) if (w.side === 'left' && d0 < w.to && d1 > w.from) problems.push(`door overlaps ${w.kind} wall treatment`);
    for (const p of solids) {
      const r = propRect(p);
      if (r.x0 < 0.9 && r.y0 < d1 && r.y1 > d0) problems.push(`${p.id} blocks the door`);
    }
  }
  if (profile.camera.zoom < 0.8 || profile.camera.zoom > 1.6) problems.push('camera zoom out of range');
  if (profile.camera.focus.x < 0 || profile.camera.focus.y < 0 || profile.camera.focus.x > width || profile.camera.focus.y > depth) problems.push('camera focus outside the footprint');
  const seen = new Set<RoomHotspotId>();
  for (const h of profile.hotspots) {
    if (seen.has(h.id)) problems.push(`hotspot ${h.id} declared twice`);
    seen.add(h.id);
    const prop = profile.props.find((p) => p.id === h.propId);
    if (!prop) problems.push(`hotspot ${h.id} points at missing prop ${h.propId}`);
    else if (prop.hotspot !== h.id) problems.push(`prop ${prop.id} does not declare hotspot ${h.id}`);
  }
  for (const p of profile.props) if (p.hotspot && !seen.has(p.hotspot)) problems.push(`prop ${p.id} hotspot ${p.hotspot} missing from hotspots`);
  if (profile.hotspots.length < 1) problems.push('room needs at least one hotspot');
  for (const w of profile.walls) {
    const max = w.side === 'right' ? width : depth;
    if (w.from < 0 || w.to > max || w.to <= w.from) problems.push(`wall treatment ${w.kind} out of range`);
  }
  return problems;
};
