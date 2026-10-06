/**
 * Regression: multi-project "At the console" view.
 *  - "Open session" did nothing in the Simple/Multi (transition) view because onWorkSession was never wired.
 *  - Cards truncated titles and clipped buttons; sliders must stay on each compact card.
 *  - Booking enquiries collapse secondary text behind expanders but keep fee/rep/time and warnings.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const dash = read('src/components/MultiProjectDashboard.tsx');
const prog = read('src/components/ProgressiveProjectInterface.tsx');
const list = read('src/components/ProjectList.tsx');
const cost = read('src/components/BookingCalendar.tsx');

// Every MultiProjectDashboard mount passes a working-session handler.
const mounts = prog.split('<MultiProjectDashboard').slice(1);
assert.equal(mounts.length, 2, 'expected two dashboard mounts');
for (const m of mounts) assert.match(m.slice(0, 600), /onWorkSession=/, 'dashboard mount missing onWorkSession');
assert.match(dash, /onWorkSession \?\? onProjectSelect/, 'Open session must fall back instead of silently doing nothing');
assert.match(dash, /onClick=\{\(\) => openSession\?\.\(project\)\}/);

assert.equal(prog.split('<ProjectSwitcher').length - 1, 2, 'both session views offer the project switcher');

assert.match(dash, /useState\('projects'\)/, 'dashboard opens on the project cards');
assert.match(dash, /multi-project-current/, 'card marks the project on the desk');
assert.match(dash, /Remove\?/, 'remove needs a second tap');

// Compact cards: sliders present, no truncated titles, buttons wrap.
assert.match(dash, /data-testid="multi-project-sliders"/);
assert.match(dash, /<Slider/);
for (const k of ['performance', 'soundCapture', 'layering']) assert.ok(dash.includes(`key: '${k}'`), `slider for ${k}`);
const card = dash.slice(dash.indexOf('multi-project-cards'), dash.indexOf('Add Project Card'));
assert.ok(!/truncate/.test(card), 'project card titles must not truncate');
assert.match(card, /flex-wrap/);

// Bookings: details collapsed, headline numbers + warnings kept.
assert.match(list, /data-testid="enquiry-brief-details"/);
assert.ok(!/open=\{index === 0\}/.test(list), 'session details collapsed by default');
assert.match(list, /Time · Diff/);
assert.match(cost, /data-testid="booking-warning"/);
assert.match(cost, /data-testid="booking-cost-details"/);
assert.match(cost, /data-testid="booking-cost-line"/);

console.log('multi-project session view checks passed');
