import React from 'react';
import type { GameState, Project } from '@/types/game';
import { money } from '@/utils/displayMoney';
import { buildBookingCalendar, previewBooking, reschedulePreview, SLOT_NAMES, SLOTS_PER_DAY } from '@/rpg/bookingCalendar';
import { quoteFor, MARGIN_LABEL } from '@/rpg/serviceQuote';

type CalState = Pick<GameState, 'currentDay' | 'studioRooms' | 'activeProject' | 'activeProjects' | 'cityId' | 'clientRelationships' | 'hiredStaff'> & Partial<Pick<GameState, 'saveSeed' | 'money' | 'freelancers' | 'premisesTier' | 'serviceLog'>>;

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

const TERMS_LABEL = {
  fixed: 'Fixed: client needs the first slot',
  narrow: 'Narrow: client can wait up to 2 days',
  flexible: 'Flexible: client can wait up to 5 days',
} as const;

export const BookingCostLine: React.FC<{ state: CalState; project: Project }> = ({ state, project }) => {
  const p = previewBooking(state, project);
  const q = quoteFor(state, project);
  const later = reschedulePreview(state, project, (p.firstSlot ? p.firstSlot.day - state.currentDay : 0) + 1);
  return (
    <div data-testid="booking-cost-line" className="mb-3 rounded-lg border border-[var(--rst-line)] bg-black/20 p-2 text-xs text-stone-300">
      Takes {p.sessions} session{p.sessions === 1 ? '' : 's'}
      {p.firstSlot ? <> · starts {SLOT_NAMES[p.firstSlot.slot].toLowerCase()} day {p.firstSlot.day}{p.roomName ? ` in ${p.roomName}` : ''}</> : ' · no free slot this week'}
      {' '}· {money(p.payoutPerSlot)} per slot ({money(p.payout)} total)
      <span data-testid="booking-quote" className="mt-1 block text-stone-400">
        {q.serviceLabel}: about {q.roomHours} room hours, {q.staffHours} staff hours{q.setupSavedHours > 0 ? ` (setup reused: ${q.setupSavedHours}h saved)` : ''} · {q.revisionAllowance > 0 ? `${q.revisionAllowance} revision round${q.revisionAllowance === 1 ? '' : 's'} included · ` : ''}margin <strong className="text-stone-200">{MARGIN_LABEL[q.marginBand]}</strong>
        {q.freelancerFees > 0 && <span className="block">Outside specialists already booked: {money(q.freelancerFees)} (in the margin)</span>}
        {q.outsideHint && q.freelancerFees === 0 && <span data-testid="booking-outside-hint" className="block">Outside help is available for {q.outsideHint.stageName} from {money(q.outsideHint.from)}; it only counts against the margin if you book it.</span>}
        <span data-testid="booking-deposit" className="block">{q.deposit.reason}{q.deposit.required ? ` (${money(q.deposit.amount)} now, ${money(Math.max(0, q.fee - q.deposit.amount))} on delivery)` : ''}</span>
      </span>
      <span data-testid="booking-terms" className={`mt-1 block ${p.startBufferDays < 0 ? 'text-amber-300' : 'text-stone-400'}`}>
        {TERMS_LABEL[p.terms.flexibility]}
        {!p.firstSlot ? '' : p.startBufferDays < 0
          ? ` · first free start is ${-p.startBufferDays} day${p.startBufferDays === -1 ? '' : 's'} too late`
          : ` · ${p.startBufferDays} day${p.startBufferDays === 1 ? '' : 's'} of slack`}
      </span>
      <span data-testid="booking-opportunity" className="mt-1 block text-stone-400">
        Studio {Math.round(p.utilizationAfter * 100)}% booked after this
        {p.nextFreeAfter
          ? <> · next free slot {SLOT_NAMES[p.nextFreeAfter.slot].toLowerCase()} day {p.nextFreeAfter.day}</>
          : ' · takes the last free slot this week'}
      </span>
      <span data-testid="booking-reschedule" className="mt-1 block text-stone-400">
        {later.slot
          ? <>Start a day later ({SLOT_NAMES[later.slot.slot].toLowerCase()} day {later.slot.day}{later.roomName ? `, ${later.roomName}` : ''}): {later.clientAccepts ? 'within the client\'s terms' : 'outside the client\'s terms'} · studio {Math.round(later.utilizationAfter * 100)}% booked</>
          : 'Starting a day later leaves no free slot this week'}
      </span>
    </div>
  );
};
