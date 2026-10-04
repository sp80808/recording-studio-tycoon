/**
 * Booking calendar (#61, first slice): a read-only "slot" view of the studio's week.
 *
 * Each operational room offers SLOTS_PER_DAY session slots per day (morning, afternoon,
 * evening). A booked project holds one slot per day, in its room, for the days of work it
 * still has. Everything is derived on render from `activeProjects` and `bookingRoomId`;
 * nothing is persisted and the booking flow itself is unchanged.
 */
import type { GameState, Project, StudioRoom } from '@/types/game';
import { createSeededRandom } from '@/simulation/seededRandom';

export const SLOTS_PER_DAY = 3;
export const WINDOW_DAYS = 7;
export const SLOT_NAMES = ['Morning', 'Afternoon', 'Evening'] as const;

export interface CalendarSlot {
  day: number;
  slot: number;
  roomId: string;
  projectId?: string;
}

export interface CalendarDay {
  day: number;
  slots: CalendarSlot[]; // one entry per room x slot
  booked: number;
  capacity: number;
}

export interface BookingCalendar {
  startDay: number;
  days: CalendarDay[];
  utilization: number; // 0-1 across the whole window
  nextFree?: CalendarSlot;
}

export type BookingFlexibility = 'fixed' | 'narrow' | 'flexible';

/** Scheduling terms (#61): how long this client will wait for a start. Derived from the project id, never stored. */
export interface BookingTerms {
  flexibility: BookingFlexibility;
  /** Days from the day the enquiry is seen that the client will still accept a start. */
  startWindowDays: number;
}

const WINDOW_BY_FLEX: Record<BookingFlexibility, number> = { fixed: 0, narrow: 2, flexible: 5 };

export const termsFor = (project: Pick<Project, 'id'>): BookingTerms => {
  const roll = createSeededRandom(`booking-terms:${project.id}`)();
  const flexibility: BookingFlexibility = roll < 0.25 ? 'fixed' : roll < 0.65 ? 'narrow' : 'flexible';
  return { flexibility, startWindowDays: WINDOW_BY_FLEX[flexibility] };
};

export interface BookingPreview {
  sessions: number;
  roomName?: string;
  firstSlot?: CalendarSlot;
  endDay: number;
  payout: number;
  payoutPerSlot: number;
  /** Opportunity cost (#61): window utilization (0-1) if this booking is taken. */
  utilizationAfter: number;
  /** Next free slot once this booking holds its slots; undefined when it takes the last one. */
  nextFreeAfter?: CalendarSlot;
  terms: BookingTerms;
  /** Days of slack between the first free start and the client's latest acceptable start; negative means too late. */
  startBufferDays: number;
}

/** Days of work still ahead for a project: unfinished stages, at least one, at most the window. */
export const remainingWorkDays = (project: Pick<Project, 'stages' | 'completedStages'>): number => {
  const total = project.stages?.length ?? 1;
  const done = project.completedStages?.length ?? 0;
  return Math.min(WINDOW_DAYS, Math.max(1, total - done));
};

const operationalRooms = (state: Pick<GameState, 'studioRooms'>): StudioRoom[] =>
  (state.studioRooms ?? []).filter((r) => r.unlocked);

const bookedProjects = (state: Pick<GameState, 'activeProject' | 'activeProjects'>): Project[] => {
  const seen = new Set<string>();
  const out: Project[] = [];
  for (const p of [state.activeProject, ...(state.activeProjects ?? [])]) {
    if (p && p.bookingRoomId && !seen.has(p.id)) { seen.add(p.id); out.push(p); }
  }
  return out;
};

export const buildBookingCalendar = (
  state: Pick<GameState, 'currentDay' | 'studioRooms' | 'activeProject' | 'activeProjects'>,
): BookingCalendar => {
  const rooms = operationalRooms(state);
  const projects = bookedProjects(state);
  const days: CalendarDay[] = [];
  let booked = 0;
  let nextFree: CalendarSlot | undefined;

  for (let d = 0; d < WINDOW_DAYS; d++) {
    const day = state.currentDay + d;
    const slots: CalendarSlot[] = [];
    for (const room of rooms) {
      // Projects in this room still working on this day, in a stable order.
      const holders = projects.filter((p) => p.bookingRoomId === room.id && d < remainingWorkDays(p));
      for (let s = 0; s < SLOTS_PER_DAY; s++) {
        const holder = holders[s];
        const slot: CalendarSlot = { day, slot: s, roomId: room.id, projectId: holder?.id };
        slots.push(slot);
        if (holder) booked++;
        else if (!nextFree) nextFree = slot;
      }
    }
    days.push({ day, slots, booked: slots.filter((s) => s.projectId).length, capacity: slots.length });
  }
  const capacity = rooms.length * SLOTS_PER_DAY * WINDOW_DAYS;
  return { startDay: state.currentDay, days, utilization: capacity ? booked / capacity : 0, nextFree };
};

/** What booking this enquiry would take up and be worth, before the player commits. */
export const previewBooking = (
  state: Pick<GameState, 'currentDay' | 'studioRooms' | 'activeProject' | 'activeProjects'>,
  project: Project,
): BookingPreview => {
  const sessions = remainingWorkDays(project);
  const cal = buildBookingCalendar(state);
  const rooms = operationalRooms(state);
  const firstDay = cal.days.find((d) => d.slots.some((s) => !s.projectId));
  const firstSlot = firstDay?.slots.find((s) => !s.projectId);
  const room = rooms.find((r) => r.id === firstSlot?.roomId);
  const startOffset = firstDay ? firstDay.day - state.currentDay : 0;
  const payout = Math.round(project.payoutBase ?? 0);

  // Reserve the first free slot on each of the booking's working days, then see what is left.
  const reserved = new Set<CalendarSlot>();
  let held = 0;
  for (let i = 0; i < sessions; i++) {
    const day = cal.days[startOffset + i];
    const slot = day?.slots.find((x) => !x.projectId);
    if (slot) { reserved.add(slot); held++; }
  }
  const capacity = cal.days.reduce((n, d) => n + d.capacity, 0);
  const booked = cal.days.reduce((n, d) => n + d.booked, 0);
  const nextFreeAfter = cal.days.flatMap((d) => d.slots).find((x) => !x.projectId && !reserved.has(x));
  const terms = termsFor(project);
  return {
    terms,
    startBufferDays: terms.startWindowDays - startOffset,
    utilizationAfter: capacity ? (booked + held) / capacity : 0,
    nextFreeAfter,
    sessions,
    roomName: room?.name,
    firstSlot,
    endDay: state.currentDay + startOffset + sessions - 1,
    payout,
    payoutPerSlot: Math.round(payout / sessions),
  };
};

export interface ReschedulePreview {
  delayDays: number;
  /** First free slot on or after the delayed start, if the week still has one. */
  slot?: CalendarSlot;
  roomName?: string;
  /** Whether the client's terms still allow this start. */
  clientAccepts: boolean;
  /** Whole-week utilization if booked at the delayed start. */
  utilizationAfter: number;
}

/** What waiting `delayDays` before starting would mean: the slot you would get and whether the client still takes it. */
export const reschedulePreview = (
  state: Pick<GameState, 'currentDay' | 'studioRooms' | 'activeProject' | 'activeProjects'>,
  project: Project,
  delayDays: number,
): ReschedulePreview => {
  const cal = buildBookingCalendar(state);
  const sessions = remainingWorkDays(project);
  const startIndex = cal.days.findIndex((d, i) => i >= delayDays && d.slots.some((s) => !s.projectId));
  const slot = startIndex >= 0 ? cal.days[startIndex].slots.find((s) => !s.projectId) : undefined;
  const room = operationalRooms(state).find((r) => r.id === slot?.roomId);
  const capacity = cal.days.reduce((n, d) => n + d.capacity, 0);
  const booked = cal.days.reduce((n, d) => n + d.booked, 0);
  const held = startIndex >= 0 ? Math.min(sessions, cal.days.length - startIndex) : 0;
  const offset = startIndex >= 0 ? startIndex : delayDays;
  return {
    delayDays,
    slot,
    roomName: room?.name,
    clientAccepts: slot !== undefined && offset <= termsFor(project).startWindowDays,
    utilizationAfter: capacity ? (booked + held) / capacity : 0,
  };
};
