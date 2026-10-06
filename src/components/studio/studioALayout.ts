// Studio A (`project-studio`) layout profile (#248). Data-only description of the geometry and hotspot anchors
// that the hand-built scene in `WebGLCanvas.buildScene` uses today. It is NOT yet consumed by the renderer
// (`getRoomLayoutProfile('project-studio')` still returns null); `tests/studio-a-layout.check.ts` pins every
// number here against the hardcoded scene so the later switch-over (see the follow-up issue) is provably
// behaviour-neutral. Tile coordinates follow `isoMath`: left wall on x = 0, right wall on y = 0.
import { ROOM_D, ROOM_W, WALL_H } from './isoMath';
import { CASE_STACK_TILE } from './studioCaseStack';

export type StudioAHotspotId = 'console' | 'liveRoom' | 'shelf' | 'phone' | 'tv' | 'clock' | 'door' | 'cases' | 'promotion';

export interface StudioAHotspotAnchor {
  id: StudioAHotspotId;
  /** Where the hotspot sits: a floor tile, or a span along a wall (tile range on that wall). */
  at: { kind: 'floor'; x: number; y: number } | { kind: 'wall'; side: 'left' | 'right'; from: number; to: number };
}

export const STUDIO_A_LAYOUT = {
  type: 'project-studio',
  label: 'Studio A',
  footprint: { width: ROOM_W, depth: ROOM_D },
  wallHeight: WALL_H,
  window: { side: 'right', from: 5.1, to: 6.9 },
  /** Floor tile the clients walk in from (door sits on the left wall). */
  doorFloor: { x: 0.45, y: 3.75 },
  doorWall: { side: 'left', from: 3.15, to: 4.35 },
  /** Live-room glass: a run along y = 1.0 plus the mic stand floor tile. */
  booth: { x0: 1.0, x1: 3.5, glassY: 1.0, stand: { x: 2.3, y: 1.55 } },
  /** Desk contact-shadow tile (the console hotspot hugs this footprint). */
  deskFoot: { x: 4.5, y: 4.25 },
  shelf: { x0: 0.5, x1: 2.0, y0: 5.0, y1: 6.0 },
  hotspots: [
    { id: 'tv', at: { kind: 'wall', side: 'left', from: 4.6, to: 6.4 } },
    { id: 'clock', at: { kind: 'wall', side: 'left', from: 2.0, to: 2.0 } },
    { id: 'door', at: { kind: 'wall', side: 'left', from: 3.15, to: 4.35 } },
    { id: 'promotion', at: { kind: 'floor', x: 7.3, y: 1.6 } },
    { id: 'liveRoom', at: { kind: 'floor', x: 2.3, y: 1.55 } },
    { id: 'shelf', at: { kind: 'floor', x: 1.25, y: 5.5 } },
    { id: 'console', at: { kind: 'floor', x: 4.5, y: 4.25 } },
    { id: 'cases', at: { kind: 'floor', x: CASE_STACK_TILE.x, y: CASE_STACK_TILE.y } },
  ] as StudioAHotspotAnchor[],
} as const;
