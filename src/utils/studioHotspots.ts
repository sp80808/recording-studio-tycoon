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

export function isFloorHotspot(raw: string | null | undefined): raw is CanonicalHotspotId {
  return normalizeHotspotId(raw) !== null;
}
