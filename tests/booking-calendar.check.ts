/** Booking calendar (#61 first slice): slot model is derived, read-only and bounded. */
import { buildBookingCalendar, previewBooking, remainingWorkDays, SLOTS_PER_DAY, WINDOW_DAYS } from '../src/rpg/bookingCalendar';
import { createNewGameState } from '../src/utils/newGameState';
import type { Project } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const base = createNewGameState();
const rooms = (base.studioRooms ?? []).filter((r) => r.unlocked);
ok(rooms.length >= 1, 'a new game has at least one unlocked room');
const mk = (id: string, roomId: string | undefined, stages: number, done = 0): Project =>
  ({ ...(base.availableProjects?.[0] ?? ({} as Project)), id, bookingRoomId: roomId, stages: Array.from({ length: stages }, () => ({}) as never), completedStages: Array.from({ length: done }, (_, i) => i), payoutBase: 900 }) as Project;

const empty = buildBookingCalendar({ ...base, activeProject: null, activeProjects: [] });
ok(empty.days.length === WINDOW_DAYS, 'window is seven days');
ok(empty.utilization === 0, 'empty studio is 0% booked');
ok(empty.days.every((d) => d.capacity === rooms.length * SLOTS_PER_DAY), 'capacity is rooms x three slots per day');
ok(empty.nextFree?.day === base.currentDay && empty.nextFree.slot === 0, 'next free slot is this morning');

const r0 = rooms[0].id;
const a = mk('a', r0, 3);
const one = buildBookingCalendar({ ...base, activeProject: null, activeProjects: [a] });
ok(one.days[0].booked === 1 && one.days[2].booked === 1 && one.days[3].booked === 0, 'a 3-stage project holds one slot for 3 days');
ok(one.utilization > 0 && one.utilization < 1, 'utilization is a fraction');
ok(one.nextFree?.slot === (rooms.length > 1 ? 0 : 1), 'next free skips the held slot');

const b = mk('b', r0, 1);
const two = buildBookingCalendar({ ...base, activeProject: null, activeProjects: [a, b] });
ok(two.days[0].booked === 2 && two.days[1].booked === 1, 'two projects in one room stack into separate slots');

const dup = buildBookingCalendar({ ...base, activeProject: a, activeProjects: [a] });
ok(dup.days[0].booked === 1, 'the same project in activeProject and activeProjects counts once');
const unroomed = buildBookingCalendar({ ...base, activeProject: null, activeProjects: [mk('c', undefined, 4)] });
ok(unroomed.utilization === 0, 'projects with no room do not take slots');

ok(remainingWorkDays(mk('d', r0, 5, 3)) === 2, 'remaining days = unfinished stages');
ok(remainingWorkDays(mk('e', r0, 2, 2)) === 1, 'remaining days is at least one');
ok(remainingWorkDays(mk('f', r0, 20)) === WINDOW_DAYS, 'remaining days is capped at the window');

const full = buildBookingCalendar({ ...base, activeProject: null, activeProjects: Array.from({ length: SLOTS_PER_DAY * rooms.length }, (_, i) => mk(`x${i}`, rooms[i % rooms.length].id, 1)) });
ok(full.days[0].booked === full.days[0].capacity && full.nextFree?.day === base.currentDay + 1, 'a full day pushes next free to tomorrow');

const prev = previewBooking({ ...base, activeProject: null, activeProjects: [] }, mk('p', r0, 4));
ok(prev.sessions === 4 && prev.endDay === base.currentDay + 3, 'preview spans the project sessions');
ok(prev.payoutPerSlot === 225 && prev.payout === 900, 'preview shows total and per-slot payout');
ok(prev.roomName === rooms[0].name, 'preview names the room');

// Opportunity cost: utilization after booking and what is left.
const emptyState = { ...base, activeProject: null, activeProjects: [] };
const cost = previewBooking(emptyState, mk('c', r0, 3));
const cap = rooms.length * SLOTS_PER_DAY * WINDOW_DAYS;
ok(Math.abs(cost.utilizationAfter - 3 / cap) < 1e-9, 'utilization after booking adds one slot per working day');
ok(cost.utilizationAfter > empty.utilization, 'booking raises utilization');
ok(!!cost.nextFreeAfter && !(cost.nextFreeAfter.day === cost.firstSlot?.day && cost.nextFreeAfter.slot === cost.firstSlot?.slot && cost.nextFreeAfter.roomId === cost.firstSlot?.roomId), 'next free slot after booking skips the reserved one');
const packed = Array.from({ length: SLOTS_PER_DAY * 3 }, (_, i) => mk(`f${i}`, r0, WINDOW_DAYS));
const crowded = previewBooking({ ...base, activeProject: null, activeProjects: packed }, mk('z', r0, 2));
ok(crowded.utilizationAfter <= 1 && (rooms.length > 1 || crowded.nextFreeAfter === undefined), 'a full room leaves no next free slot and utilization stays capped');
ok(previewBooking(emptyState, mk('c', r0, 3)).utilizationAfter === cost.utilizationAfter, 'opportunity preview is deterministic');

const frozen = JSON.stringify(base);
buildBookingCalendar(base); previewBooking(base, a);
ok(JSON.stringify(base) === frozen, 'calendar and preview never mutate state');
console.log(`booking-calendar: ${n} checks passed`);
