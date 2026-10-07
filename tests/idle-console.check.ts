/** Idle console summary: bounded, derived, best enquiry first. */
import { buildIdleConsoleSummary, IDLE_ENQUIRY_LIMIT } from '../src/rpg/idleConsole';
import { createNewGameState } from '../src/utils/newGameState';
import type { Project } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

const base = createNewGameState();
const mk = (id: string, matchRating: Project['matchRating'], payoutBase: number): Project =>
  ({ ...(base.availableProjects[0] ?? ({} as Project)), id, matchRating, payoutBase });
const s = buildIdleConsoleSummary({ ...base, activeProject: null, activeProjects: [], availableProjects: [mk('a', 'Poor', 900), mk('b', 'Excellent', 100), mk('c', 'Excellent', 500), mk('d', 'Good', 700)] });
ok(s.enquiryCount === 4, 'counts every enquiry');
ok(s.enquiries.length === IDLE_ENQUIRY_LIMIT, 'shows a bounded number of enquiries');
ok(s.enquiries[0].id === 'c' && s.enquiries[1].id === 'b', 'best match then payout first');
ok(s.waiting.length === 0 && s.lastRelease === null, 'fresh studio has nothing waiting or released');
const none = buildIdleConsoleSummary({ ...base, availableProjects: [], hiredStaff: [] });
ok(none.enquiries.length === 0 && none.crew.total === 0, 'empty studio is handled');
console.log(`${n} checks passed`);
