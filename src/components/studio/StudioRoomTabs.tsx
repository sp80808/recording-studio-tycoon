import React from 'react';
import type { StudioRoom } from '@/types/game';

export interface StudioRoomTabsProps {
  rooms: StudioRoom[];
  activeId: string;
  occupied: ReadonlySet<string>;
  onSelect: (roomId: string) => void;
}

/** Room switcher: only shown once a second room is unlocked. The original studio stays the first tab. */
export const StudioRoomTabs: React.FC<StudioRoomTabsProps> = ({ rooms, activeId, occupied, onSelect }) => {
  if (rooms.length < 2) return null;
  return (
    <div className="absolute left-1/2 top-[6.5rem] z-[9] sm:top-12 flex max-w-[92%] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-[var(--rst-line-strong,#6b5a3a)] bg-black/55 p-1 backdrop-blur-sm" role="tablist" aria-label="Studio rooms">
      {rooms.map((room) => {
        const active = room.id === activeId;
        return (
          <button
            key={room.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(room.id)}
            className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${active ? 'bg-amber-300 text-stone-900' : 'text-stone-300 hover:bg-white/10'}`}
          >
            {room.name}
            {occupied.has(room.id) && <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" aria-label="in session" />}
          </button>
        );
      })}
    </div>
  );
};
