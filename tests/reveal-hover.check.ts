/** k6e.2 remainder: rank reveal wiring + hover preview attach. */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const read = (p: string): string => fs.readFileSync(path.join(baseDir, p), 'utf8');

const overlay = read('src/components/RankRevealOverlay.tsx');
const modal = read('src/components/modals/ProjectReviewModal.tsx');
const hover = read('src/components/HoverPreview.tsx');
const charts = read('src/components/charts/ChartDisplay.tsx');
const css = read('src/components/chip-fidelity.css');

let passed = 0;
const ok = (cond: boolean, msg: string): void => {
  assert(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

// Overlay contract: non-blocking, S/S+ sting, near-miss, a11y, reduced-motion safe
ok(overlay.includes(`playUISound('rankSPlus')`) && overlay.includes(`playUISound('rankS')`), 'overlay fires S/S+ stings (k6e.1 voices)');
ok(overlay.includes('setTimeout(onDone, 1600)') && overlay.includes('onClick={onDone}'), 'overlay auto-dismisses 1.6s or click');
ok(overlay.includes('NEED +'), 'overlay shows near-miss chase text');
ok(overlay.includes('role="status"') && overlay.includes('aria-live="polite"'), 'overlay announces to screen readers');
ok(!overlay.includes('showContinueButton') && !overlay.includes('handleNextAnimation'), 'overlay never blocks review flow');

// Modal wiring: rank source, gating, lifecycle
ok(modal.includes('gradeQuality') && modal.includes('@/rpg/rankChase'), 'modal grades via pure rankChase');
ok(modal.includes('setRankStamp(gradeQuality(targetQuality))'), 'stamp set at count-up completion');
ok(modal.includes('if (targetQuality >= 80)'), 'stamp gated to A and above (no flop noise)');
ok(modal.includes('setRankStamp(null)'), 'stamp resets on open + dismiss');
ok(modal.includes('<RankRevealOverlay'), 'overlay rendered in modal');
ok(modal.includes('triggerMilestoneCelebration'), 'existing confetti path preserved');

// Hover preview contract + attach
ok(hover.includes('setTimeout(() => setOpen(true), 250)'), 'hover delay 250ms');
ok(hover.includes('pointer-events-none') && hover.includes('sr-only'), 'pointer-safe + screen-reader mirror');
ok(hover.includes('onFocus={show}') && hover.includes('onBlur={hide}'), 'keyboard accessible');
ok(charts.includes('<HoverPreview') && charts.includes('Peak #'), 'chart titles preview meta');
ok(css.includes('.rank-stamp-in') && css.includes('.hover-preview-card'), 'new motion owns chip curves');
ok(css.includes('.rank-stamp-in { animation-duration: 0.01s;') || css.includes('.rank-stamp-in { animation-duration:0.01s;') || /rank-stamp-in \{ animation-duration: 0\.01s/.test(css), 'stamp collapses under reduced-motion');

console.log(`reveal-hover: all ${passed} checks passed`);
