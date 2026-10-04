/** Filler jobs and reschedule preview (#61): derived, deterministic, never better than real work. */
import { fillerJobsFor, isFillerJob, FILLER_MAX, FILLER_PAY_FACTOR } from '../src/rpg/fillerJobs';
import { reschedulePreview, termsFor } from '../src/rpg/bookingCalendar';
import { createNewGameState } from '../src/utils/newGameState';
import { GIG_TEMPLATES } from '../src/data/gigTemplates';
import type { Project } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const base = { ...createNewGameState(), saveSeed: 'seed-a', availableProjects: [], activeProject: null, activeProjects: [] };
const a = fillerJobsFor(base);
ok(a.length === FILLER_MAX, 'an empty board with a free week gets the maximum fillers');
ok(a.every(isFillerJob), 'fillers are identifiable by id');
ok(JSON.stringify(a) === JSON.stringify(fillerJobsFor(base)), 'fillers are deterministic for a seed and day');
ok(fillerJobsFor({ ...base, currentDay: base.currentDay + 1 })[0].id !== a[0].id, 'a new day brings new fillers');
ok(a.every((p) => p.stages.length === 1 && p.durationDaysTotal === 1), 'fillers are a single session');
ok(a.every((p) => p.payoutBase >= 50 && p.repGainBase === 1), 'fillers pay little and give 1 rep');
for (const p of a) {
  const tpl = GIG_TEMPLATES.find((t) => t.genre === p.genre && t.tier === 'starter' && p.title.includes(''));
  ok(!!tpl, `a source template exists for ${p.genre}`);
}
const perSlotCeiling = Math.max(...GIG_TEMPLATES.filter((t) => t.tier === 'starter').map((t) => t.basePayout / t.baseStages.length)) * FILLER_PAY_FACTOR;
ok(a.every((p) => p.payoutBase <= Math.round(perSlotCeiling)), 'a filler never pays more than 70% of a real per-session fee');

const stub = (id: string) => ({ ...(base.availableProjects[0] ?? ({} as Project)), id }) as Project;
ok(fillerJobsFor({ ...base, availableProjects: [stub('x')] }).length === 2, 'one real enquiry leaves room for two fillers');
ok(fillerJobsFor({ ...base, availableProjects: [stub('x'), stub('y')] }).length === 1, 'two real enquiries leave room for one filler');
ok(fillerJobsFor({ ...base, availableProjects: [stub('x'), stub('y'), stub('z')] }).length === 0, 'a full board gets no fillers');

const rooms = (base.studioRooms ?? []).filter((r) => r.unlocked);
const busy = rooms.flatMap((r) => [0, 1, 2].map((i) => ({ ...stub(`b-${r.id}-${i}`), bookingRoomId: r.id, stages: Array.from({ length: 7 }, () => ({}) as never), completedStages: [] }) as Project));
ok(fillerJobsFor({ ...base, activeProjects: busy }).length === 0, 'a busy week gets no fillers');

ok(fillerJobsFor({ ...base, claimedOffers: [a[0].id] }).every((p) => p.id !== a[0].id), 'a claimed filler does not come back');

const frozen = JSON.stringify(base);
const proj = a[0];
const r0 = reschedulePreview(base, proj, 0);
ok(r0.slot?.day === base.currentDay && r0.clientAccepts, 'no delay starts today and is accepted');
const rLate = reschedulePreview(base, proj, 6);
ok(rLate.slot?.day === base.currentDay + 6, 'a six day delay lands on day six');
ok(rLate.clientAccepts === (6 <= termsFor(proj).startWindowDays), 'acceptance follows the client terms');
ok(reschedulePreview(base, proj, 7).slot === undefined && !reschedulePreview(base, proj, 7).clientAccepts, 'past the week there is no slot and the client walks');
ok(JSON.stringify(base) === frozen, 'fillers and preview never mutate state');
console.log(`filler-jobs: ${n} checks passed`);
