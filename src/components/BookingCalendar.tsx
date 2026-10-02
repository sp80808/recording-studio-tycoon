import React from 'react';
import type { GameState, Project } from '@/types/game';
import { formatMoney } from '@/rpg/cities';
import { buildBookingCalendar, previewBooking, SLOT_NAMES, SLOTS_PER_DAY } from '@/rpg/bookingCalendar';

type CalState = Pick<GameState, 'currentDay' | 'studioRooms' | 'activeProject' | 'activeProjects' | 'cityId'>;

export const BookingCalendar: React.FC<{ state: CalState }> = ({ state }) => {
  const cal = buildBookingCalendar(state);
  const rooms = (state.studioRooms ?? []).filter((r) => r.unlocked);
  return (
    <section aria-label="Booking calendar" data-testid="booking-calendar" className="rounded-lg border border-[var(--rst-line)] bg-black/20 p-2.5 text-xs text-stone-300">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wide text-stone-200">Week ahead</span>
        <span>{Math.round(cal.utilization * 100)}% booked · {rooms.length} room{rooms.length === 1 ? '' : 's'} × {SLOTS_PER_DAY} slots</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cal.days.map((d) => (
          <div key={d.day} className="text-center">
            <div className="mb-0.5 text-[10px] text-stone-400">Day {d.day}</div>
            <div className="flex flex-col gap-0.5" title={`${d.booked} of ${d.capacity} slots booked`}>
              {Array.from({ length: SLOTS_PER_DAY }, (_, s) => {
                const taken = d.slots.filter((x) => x.slot === s && x.projectId).length;
                const full = rooms.length > 0 && taken >= rooms.length;
                return (
                  <div
                    key={s}
                    aria-label={`${SLOT_NAMES[s]} day ${d.day}: ${taken}/${rooms.length} rooms booked`}
                    className={`h-3 rounded-sm ${full ? 'bg-amber-500/80' : taken ? 'bg-amber-500/40' : 'bg-stone-700/60'}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const BookingCostLine: React.FC<{ state: CalState; project: Project }> = ({ state, project }) => {
  const p = previewBooking(state, project);
  return (
    <div data-testid="booking-cost-line" className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2 text-xs text-stone-300">
      Takes {p.sessions} session{p.sessions === 1 ? '' : 's'}
      {p.firstSlot ? <> · starts {SLOT_NAMES[p.firstSlot.slot].toLowerCase()} day {p.firstSlot.day}{p.roomName ? ` in ${p.roomName}` : ''}</> : ' · no free slot this week'}
      {' '}· {formatMoney(p.payoutPerSlot, state.cityId)} per slot ({formatMoney(p.payout, state.cityId)} total)
    </div>
  );
};
