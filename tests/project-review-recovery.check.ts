/** #255: a completed project can never be stranded behind an inert review CTA. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  canOpenProjectReview, getReviewTrace, isProjectReadyForReview, resetReviewTrace, traceReviewFlow,
} from '../src/utils/projectReviewFlow';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8');
let passed = 0;
const ok = (c: boolean, m: string) => { assert.ok(c, `FAIL: ${m}`); passed += 1; console.log(`PASS: ${m}`); };

const stage = (completed: boolean) => ({ completed }) as never;
ok(isProjectReadyForReview({ stages: [stage(true), stage(true), stage(true)] }), 'all stages complete -> review-ready');
ok(!isProjectReadyForReview({ stages: [stage(true), stage(false)] }), 'partial project is not review-ready');
ok(!isProjectReadyForReview({ stages: [] }), 'empty stage list is not review-ready');
ok(!isProjectReadyForReview(null), 'no project is not review-ready');

ok(canOpenProjectReview({ reviewOpen: false, hasReport: false, hasPendingDelivery: false }), 'review may open when idle');
ok(!canOpenProjectReview({ reviewOpen: true, hasReport: false, hasPendingDelivery: false }), 'no second review while modal open');
ok(!canOpenProjectReview({ reviewOpen: false, hasReport: true, hasPendingDelivery: false }), 'no second review while report held');
ok(!canOpenProjectReview({ reviewOpen: false, hasReport: false, hasPendingDelivery: true }), 'no second review during delivery prompt');

resetReviewTrace();
traceReviewFlow('final-take'); // node: DEV is undefined so this is a no-op
ok(getReviewTrace().length === 0, 'diagnostics are a no-op outside dev builds');

const ap = read('src/components/ActiveProject.tsx');
ok(/handleOpenProjectReview/.test(ap), 'ActiveProject defines the review transition');
ok(/onClick=\{isProjectComplete \? handleOpenProjectReview : handleArmTake\}/.test(ap), 'complete-state CTA invokes review, not record');
ok(!/handleArmTake\}\s*\n\s*disabled=\{availableEnergy <= 0 \|\| isProjectComplete\}/.test(ap), 'no inert complete-state record button remains');
ok(/disabled=\{!isProjectComplete && availableEnergy <= 0\}/.test(ap), 'complete-state CTA is never disabled');
ok(/if \(isProjectComplete\) \{\s*handleOpenProjectReview\(\)/.test(ap), 'gamepad South opens review when complete');
for (const stg of ['final-take', 'on-project-complete', 'recovery-cta']) ok(ap.includes(`traceReviewFlow('${stg}'`), `ActiveProject traces ${stg}`);

const ix = read('src/pages/Index.tsx');
ok(/canOpenProjectReview\(/.test(ix), 'handleShowProjectReview is guarded against duplicate reviews');
ok(/finalizingReviewRef/.test(ix), 'finalize is guarded against double settlement');
for (const stg of ['show-review', 'review-modal-open', 'finalize']) ok(ix.includes(`traceReviewFlow('${stg}'`), `Index traces ${stg}`);
console.log(`project-review-recovery: ${passed} checks passed`);
