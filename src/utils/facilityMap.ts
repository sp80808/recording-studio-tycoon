// Facility map model (#248): a pure projection of room economy state into a floorplan the UI can draw.
// It invents no parallel state: unlock/occupancy come from StudioRoom + getOccupiedRoomIds.
import type { StudioRoom } from '@/types/game';
import { getRoomLayoutProfile } from '@/components/studio/roomLayouts';
import { ROOM_REQUIRED_PREMISES_TIER } from '@/utils/studioRoomUtils';

export type FacilityRoomStatus = 'viewing' | 'booked' | 'free' | 'locked';

export interface FacilityMapRoom {
  id: string;
  name: string;
  status: FacilityRoomStatus;
  /** Floorplan cell, 2 columns wide. */
  col: number;
  row: number;
  /** Relative footprint area scaled 0.6..1 for drawing. */
  size: number;
  /** Why a locked room is locked (premises first, then level, then cost). */
  lockedReason?: string;
  clickable: boolean;
}

/** Studio A has no layout profile (hand-built scene); give it a nominal footprint for the floorplan. */
const STUDIO_A_FOOTPRINT = { width: 7, depth: 7 };
const SLOT_ORDER = ['studio-a', 'vocal-suite', 'live-room', 'mix-suite'];

export const buildFacilityMap = (
  rooms: StudioRoom[],
  opts: { activeId: string; occupied: ReadonlySet<string>; premisesTier?: number; playerLevel?: number }
): FacilityMapRoom[] => {
  const areaOf = (room: StudioRoom) => {
    const fp = getRoomLayoutProfile(room.type)?.footprint ?? STUDIO_A_FOOTPRINT;
    return fp.width * fp.depth;
  };
  const maxArea = Math.max(1, ...rooms.map(areaOf));
  const ordered = [...rooms].sort((a, b) => {
    const ia = SLOT_ORDER.indexOf(a.id);
    const ib = SLOT_ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return ordered.map((room, i) => {
    let status: FacilityRoomStatus = 'free';
    let lockedReason: string | undefined;
    if (!room.unlocked) {
      status = 'locked';
      const tier = ROOM_REQUIRED_PREMISES_TIER[room.id];
      if (tier !== undefined && opts.premisesTier !== undefined && opts.premisesTier < tier) lockedReason = `Needs premises tier ${tier}`;
      else if (opts.playerLevel !== undefined && opts.playerLevel < room.requiredPlayerLevel) lockedReason = `Reach level ${room.requiredPlayerLevel}`;
      else lockedReason = `Buy for $${room.purchaseCost.toLocaleString()}`;
    } else if (room.id === opts.activeId) status = 'viewing';
    else if (opts.occupied.has(room.id)) status = 'booked';
    return {
      id: room.id,
      name: room.name,
      status,
      col: i % 2,
      row: Math.floor(i / 2),
      size: 0.6 + 0.4 * (areaOf(room) / maxArea),
      lockedReason,
      clickable: room.unlocked,
    };
  });
};
