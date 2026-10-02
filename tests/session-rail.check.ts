/** GH #41 SessionRail: compact active-session state, studio-native, no emoji. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

let passed = 0;
const ok = (c: boolean, m: string) => {
  assert(c, `FAIL: ${m}`);
  passed += 1;
  console.log(`PASS: ${m}`);
};

const rail = readFileSync('src/components/SessionRail.tsx', 'utf8');
ok(rail.includes('getBookedStudioRoom'), 'rail shows the booked room');
ok(rail.includes('currentStageIndex') && rail.includes('workUnitsCompleted'), 'rail shows stage + progress');
ok(rail.includes('assignedProjectId'), 'rail shows assigned staff');
ok(rail.includes('unresolvedIssues'), 'rail surfaces open issues');
ok(rail.includes('awaitingReview'), 'rail flags review-ready sessions');
ok(rail.includes('dailyWorkCapacity'), 'rail keeps daily sessions visible');
ok(rail.includes('onOpenSession') && rail.includes('onOpenBookings'), 'rail routes to session and bookings');
ok(rail.includes('data-testid="session-rail"'), 'rail is queryable in tests');
ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(rail), 'rail uses Lucide, not emoji');
ok(/from 'lucide-react'/.test(rail), 'rail uses the single icon system');

const css = readFileSync('src/components/studio-play.css', 'utf8');
ok(css.includes('.session-rail-progress'), 'rail progress bar is styled');
ok(css.includes('.session-rail-rec'), 'rail REC indicator is styled');
ok(css.includes('prefers-reduced-motion') && css.includes('.session-rail-rec'), 'rail REC respects reduced motion');

const shell = readFileSync('src/components/MainGameContent.tsx', 'utf8');
ok(shell.includes('<SessionRail'), 'shell mounts the rail');
ok(shell.includes("openPanel('session')") && shell.includes("openPanel('bookings')"), 'rail callbacks reach the drawer flow');

console.log(`${passed} session rail checks passed`);
