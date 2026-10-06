import React, { useMemo, useState } from 'react';
import type { StudioRoom } from '@/types/game';
import { buildFacilityMap, type FacilityRoomStatus } from '@/utils/facilityMap';

export interface FacilityMapProps {
  /** All rooms, owned and locked. */
  rooms: StudioRoom[];
  activeId: string;
  occupied: ReadonlySet<string>;
  premisesTier?: number;
  playerLevel?: number;
  onSelect: (roomId: string) => void;
}

const STATUS_STYLE: Record<FacilityRoomStatus, string> = {
  viewing: 'border-amber-300 bg-amber-300/25 text-amber-100',
  booked: 'border-red-400/80 bg-red-500/15 text-red-100',
  free: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20',
  locked: 'border-stone-600 border-dashed bg-stone-900/60 text-stone-400',
};
const STATUS_LABEL: Record<FacilityRoomStatus, string> = { viewing: 'viewing', booked: 'in session', free: 'free', locked: 'locked' };

/** Floorplan of the whole facility (#248). Shows locked rooms with why, and jumps to any owned room. */
export const FacilityMap: React.FC<FacilityMapProps> = ({ rooms, activeId, occupied, premisesTier, playerLevel, onSelect }) => {
  const [open, setOpen] = useState(false);
  const cells = useMemo(() => buildFacilityMap(rooms, { activeId, occupied, premisesTier, playerLevel }), [rooms, activeId, occupied, premisesTier, playerLevel]);
  return (
    <div className="absolute left-2 top-[12.5rem] z-[9] sm:top-12" data-testid="facility-map">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Facility map"
        className="min-h-9 rounded-full border border-stone-600 bg-black/55 px-3 text-[11px] font-bold uppercase tracking-wider text-stone-200 backdrop-blur-sm hover:bg-white/10"
      >
        Map
      </button>
      {open && (
        <div className="mt-1 grid w-56 grid-cols-2 gap-1.5 rounded-lg border border-stone-700 bg-black/75 p-2 backdrop-blur-sm" role="group" aria-label="Studio floorplan">
          {cells.map((cell) => (
            <button
              key={cell.id}
              type="button"
              disabled={!cell.clickable}
              data-room={cell.id}
              data-status={cell.status}
              aria-current={cell.status === 'viewing' ? 'true' : undefined}
              onClick={() => { onSelect(cell.id); setOpen(false); }}
              style={{ gridColumn: cell.col + 1, gridRow: cell.row + 1, minHeight: `${Math.round(cell.size * 72)}px` }}
              className={`flex flex-col items-start justify-between rounded border p-1.5 text-left text-[10px] leading-tight transition-colors ${STATUS_STYLE[cell.status]}`}
            >
              <span className="font-black uppercase tracking-wider">{cell.name}</span>
              <span>{cell.status === 'locked' ? cell.lockedReason : STATUS_LABEL[cell.status]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
