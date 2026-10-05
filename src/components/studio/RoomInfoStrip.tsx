// Compact info pill for the room being viewed (#248). The room itself is a full isometric Pixi scene
// (see roomLayoutScene.ts); this strip only carries the numbers and the booking state.
import React from 'react';
import type { StudioRoom } from '@/types/game';

export interface RoomInfoStripProps {
  room: StudioRoom;
  /** Title of the project booked into this room right now, if any. */
  occupiedBy?: string | null;
  /** Labels of the room's interactive hotspots, shown as a hint. */
  hotspots?: string[];
}

const KIND_LABEL: Record<string, string> = {
  tracking: 'Tracking', production: 'Production', mixing: 'Mixing', mastering: 'Mastering', general: 'General',
};

export const RoomInfoStrip: React.FC<RoomInfoStripProps> = ({ room, occupiedBy, hotspots }) => {
  const live = Boolean(occupiedBy);
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[9.5rem] z-[8] flex max-w-[94%] -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-0.5 rounded-lg border border-stone-700/80 bg-black/60 px-3 py-1 text-[11px] text-stone-200 backdrop-blur-sm sm:top-[5.25rem]"
      data-testid={`room-info-${room.id}`}
      role="status"
      aria-label={`${room.name}: ${live ? `booked, ${occupiedBy}` : 'free'}`}
    >
      <span className="font-black uppercase tracking-[0.18em] text-amber-200">{room.name}</span>
      <span>Quality +{room.qualityBonus}</span>
      <span>Speed +{room.speedBonus}</span>
      <span className="hidden sm:inline">{room.supportedStageKinds.map((k) => KIND_LABEL[k] ?? k).join(' · ')}</span>
      <span className={`font-semibold ${live ? 'text-red-300' : 'text-emerald-300'}`}>{live ? `Booked: ${occupiedBy}` : 'Free: book a session'}</span>
      {hotspots && hotspots.length > 0 && <span className="hidden text-stone-400 md:inline">Tap: {hotspots.join(' · ')}</span>}
    </div>
  );
};
