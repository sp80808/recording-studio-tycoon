/**
 * Booking calendar (#61, first slice): a read-only "slot" view of the studio's week.
 *
 * Each operational room offers SLOTS_PER_DAY session slots per day (morning, afternoon,
 * evening). A booked project holds one slot per day, in its room, for the days of work it
 * still has. Everything is derived on render from `activeProjects` and `bookingRoomId`;
 * nothing is persisted and the booking flow itself is unchanged.
 */
import type { GameState, Project, StudioRoom } from '@/types/game';

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
  return {
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
