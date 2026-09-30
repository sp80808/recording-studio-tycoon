import assert from 'node:assert';
import { advanceChartWeek, debutChartRun, weeksDue } from '../src/utils/chartRun';

console.log('Testing weekly chart run...');
assert.strictEqual(debutChartRun('p', 't', 50, 10), null, 'low quality never debuts');
const debut = debutChartRun('p', 't', 88, 10)!;
assert.ok(debut.position >= 11 && debut.position <= 25);
assert.strictEqual(weeksDue(debut, 16), 0);
assert.strictEqual(weeksDue(debut, 17), 1);
assert.strictEqual(weeksDue(debut, 200), 4, 'day skips are capped');

let e = debut, exited = false, sawRise = false, sawFall = false;
for (let i = 0; i < 20 && !exited; i++) {
  const u = advanceChartWeek(e, 17 + i * 7);
  assert.deepStrictEqual(u, advanceChartWeek(e, 17 + i * 7), 'deterministic');
  if (u.entry.position < u.previousPosition) sawRise = true;
  if (u.entry.position > u.previousPosition) sawFall = true;
  assert.ok(u.entry.peak <= debut.position && u.entry.peak <= u.entry.position);
  e = u.entry; exited = u.exited;
}
assert.ok(sawRise && sawFall, 'a hit climbs then decays');
assert.ok(exited, 'every run eventually leaves the chart');
console.log('chart-run: all checks passed');
