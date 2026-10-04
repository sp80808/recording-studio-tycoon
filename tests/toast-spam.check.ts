/** Toast gate + first-session coach host checks (source + behavioral, DOM-free). */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ToastGate, fingerprintToast } from '../src/lib/toastGate';

const baseDir = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(baseDir, p), 'utf8');

let passed = 0;
const ok = (cond: boolean, msg: string) => {
  assert.ok(cond, `FAIL: ${msg}`);
  passed += 1;
  console.log(`PASS: ${msg}`);
};

const gate = new ToastGate();
gate.reset();
const first = gate.admit({ title: 'Work Progress', description: '+2 units', now: 1000 });
ok(first.allow, 'first toast admitted');
const dup = gate.admit({ title: 'Work Progress', description: '+2 units', now: 1200 });
ok(!dup.allow, 'identical toast within window is deduped');
ok(fingerprintToast('A', 'B') === 'a::b', 'fingerprint normalizes case');

gate.reset();
for (let i = 0; i < 3; i += 1) {
  ok(gate.admit({ title: `n${i}`, now: 2000 + i }).allow, `rate slot ${i} admitted`);
}
ok(!gate.admit({ title: 'n3', now: 2500 }).allow, '4th non-critical toast rate-limited');
ok(
  gate.admit({ title: 'Boom', variant: 'destructive', now: 2501 }).allow,
  'critical/destructive bypasses rate limit'
);

const quiet = gate.admit({ title: 'log only', priority: 'quiet', now: 3000 });
ok(!quiet.allow, 'quiet priority never surfaces');

const app = read('src/App.tsx');
ok(app.includes('<Toaster />'), 'App mounts Toaster');
ok(!/import\s+\{\s*Toaster as Sonner\s*\}/.test(app) && !app.includes('<Sonner />'), 'App does not mount a second Sonner toaster');

const toaster = read('src/components/ui/toaster.tsx');
ok(toaster.includes('visibleToasts={2}'), 'Sonner host caps visible toasts at 2');

const guideCss = read('src/components/first-session-guide.css');
ok(guideCss.includes("data-chrome-busy='take-calibration'"), 'coach CSS hides during take-calibration');
ok(guideCss.includes('max-width: 1100px'), 'coach parks for mid viewports');

const tutorial = read('src/components/TutorialModal.tsx');
ok(tutorial.includes('takeCalibrationFocused'), 'TutorialModal reads chrome take-calibration signal');
ok(/if\s*\([^\n]*\|\|\s*takeCalibrationFocused\s*\|\|\s*consoleFocused\s*\)\s*return null/.test(tutorial), 'coach unmounts while calibration or console owns input');

const active = read('src/components/ActiveProject.tsx');
ok(active.includes('setTakeCalibrationFocused'), 'ActiveProject publishes take-calibration focus');
ok(!active.includes('Studio kept moving'), 'skip-intervention confirm toast removed');
ok(!active.includes('Focus Aligned'), 'focus-align confirm toast removed');

const actions = read('src/hooks/useGameActions.tsx');
ok(!actions.includes('Daily Expenses Paid'), 'routine payroll toast removed');

const stage = read('src/hooks/useStageWork.tsx');
ok(!stage.includes('Work Progress'), 'routine work-progress toast removed');
ok(!stage.includes('Stage Already Complete'), 'redundant stage-complete toast removed');
ok(!stage.includes("title: '🔥 OVERDRIVE!'"), 'routine overdrive success toast removed');

const playCss = read('src/components/studio-play.css');
ok(!playCss.includes('.first-session-guide { position:absolute'), 'studio-play no longer owns coach absolute position');

console.log(`toast-spam: all ${passed} checks passed`);
