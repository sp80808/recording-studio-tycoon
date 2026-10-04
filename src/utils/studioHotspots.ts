/**
 * Canonical floor hotspot ids (audit §5).
 * The Pixi scene emits `liveRoom` + `tv`; legacy saves, gamepad maps and
 * chore records may still carry `liveroom` / `crt`. Normalise once at the
 * boundary so controllers, chores and inspectors never drift apart.
 */
export type CanonicalHotspotId =
  | 'console'
  | 'liveRoom'
  | 'phone'
  | 'clock'
  | 'tv'
  | 'shelf'
  | 'door'
  | 'promotion';

const ALIASES: Record<string, CanonicalHotspotId> = {
  console: 'console',
  liveroom: 'liveRoom',
  liveroom_: 'liveRoom',
  'live-room': 'liveRoom',
  liverroom: 'liveRoom',
  phone: 'phone',
  clock: 'clock',
  tv: 'tv',
  crt: 'tv',
  'charts-tv': 'tv',
  shelf: 'shelf',
  vinyl: 'shelf',
  door: 'door',
  promotion: 'promotion',
  promo: 'promotion',
};

export function normalizeHotspotId(raw: string | null | undefined): CanonicalHotspotId | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, '');
  // `liveRoom` lowercases to `liveroom`; keep the explicit table above first.
  if (key === 'liveroom') return 'liveRoom';
  return ALIASES[key] ?? null;
}

import { computeSpatialScore, SpatialDirection, SpatialPoint } from './spatialNavigation';

export function isFloorHotspot(raw: string | null | undefined): raw is CanonicalHotspotId {
  return normalizeHotspotId(raw) !== null;
}

export const HOTSPOT_POSITIONS: Record<CanonicalHotspotId, SpatialPoint> = {
  clock: { x: -40, y: -200 },
  tv: { x: 200, y: -150 },
  phone: { x: -110, y: -50 },
  liveRoom: { x: 170, y: -10 },
  console: { x: 0, y: 70 },
  shelf: { x: -210, y: 80 },
  door: { x: 260, y: 130 },
  promotion: { x: 40, y: 190 },
};

/**
 * Calculates the next floor hotspot in a 2D isometric direction from current.
 * Returns the candidate with the lowest directional penalty, or current if none in cone.
 */
export function getNextHotspotDirectional(
  current: CanonicalHotspotId,
  direction: SpatialDirection,
  availableHotspots: readonly CanonicalHotspotId[] = Object.keys(HOTSPOT_POSITIONS) as CanonicalHotspotId[]
): CanonicalHotspotId {
  const origin = HOTSPOT_POSITIONS[current];
  if (!origin) return current;

  let bestHotspot: CanonicalHotspotId = current;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of availableHotspots) {
    if (candidate === current) continue;
    const pos = HOTSPOT_POSITIONS[candidate];
    if (!pos) continue;

    const score = computeSpatialScore(origin, pos, direction, 65);
    if (score !== null && score < bestScore) {
      bestScore = score;
      bestHotspot = candidate;
    }
  }

  return bestHotspot;
}

