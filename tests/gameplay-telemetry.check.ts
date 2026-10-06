/** Gameplay telemetry and deterministic traces (#59 first slice). */
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeProperties, ALLOWED_PROPERTIES, TRACE_SCHEMA_VERSION, feeBand, qualityBand, durationBand, type GameplayEventSink, type GameplayTelemetryEvent } from '../src/telemetry/gameplayEvents';
import { BufferedSink, GameplayTelemetry, BUFFER_LIMIT, telemetry as shared } from '../src/telemetry/sink';
import { buildScenarioTrace, replayGameplayTrace, exportLiveTrace, hashState, balanceHash, type GameplayTrace } from '../src/telemetry/trace';
import { summarizeTrace } from '../src/telemetry/analyze';
import { trackEnquiry, trackSessionSettled } from '../src/telemetry/instrument';
import { generateNewProjects } from '../src/utils/projectUtils';
import { createNewGameState } from '../src/utils/newGameState';
import type { GameState, ProjectReport } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };

// Privacy boundary: allowlisted keys, enum-like strings only.
const clean = sanitizeProperties('enquiry_accepted', {
  service: 'mix', feeBand: 'mid', deposit: true, roomsFree: 2,
  clientName: 'Maya Ross', title: 'Glass Rooms', note: 'free text with spaces', email: 'a@b.c',
});
ok(Object.keys(clean).sort().join() === 'deposit,feeBand,roomsFree,service', 'unknown keys (names, titles, free text, email) are dropped');
ok(sanitizeProperties('enquiry_accepted', { service: 'Maya Ross' }).service === undefined, 'a string with spaces is dropped even under an allowed key');
ok(sanitizeProperties('enquiry_accepted', { service: 'x'.repeat(80) }).service === undefined, 'long strings are dropped');
ok(sanitizeProperties('session_settled', { quality: Number.NaN }).quality === undefined, 'non-finite numbers are dropped');
ok(sanitizeProperties('staff_hired', { role: 'Engineer', extra: 1 }).extra === undefined, 'each event has its own allowlist');
ok(Object.keys(ALLOWED_PROPERTIES).length === 22, 'all vocabulary events are present in allowlist');
ok(sanitizeProperties('gear_bought', { source: 'retail', priceBand: 'high', cheat: 99 }).cheat === undefined, 'gear_bought drops unlisted keys');
ok(sanitizeProperties('repair_completed', { kind: 'service', condition: 85.4 }).condition === 85.4, 'repair_completed preserves valid primitives');
ok(Object.values(ALLOWED_PROPERTIES).every((keys) => keys.every((k) => !/name|email|text|path|ip|id$/i.test(k))), 'no allowlisted key looks like identity or free text');
ok(feeBand(100) === 'low' && feeBand(5000) === 'top' && qualityBand(40) === 'poor' && qualityBand(95) === 'excellent' && durationBand(1) === 'short', 'values are banded before capture');

// Sink: bounded, never blocks gameplay.
const sink = new BufferedSink(5);
for (let i = 0; i < 12; i++) sink.capture({ name: 'staff_hired', runId: 'r', gameDay: i, simulationVersion: 'v', balanceVersion: 'b', properties: {} });
ok(sink.snapshot().length === 5 && sink.snapshot()[0].gameDay === 7, 'the buffer is bounded and the oldest events roll off');
ok(BUFFER_LIMIT > 0, 'the default buffer has a finite limit');
const t = new GameplayTelemetry();
const boom: GameplayEventSink = { capture() { throw new Error('adapter down'); } };
t.setSink(boom);
let threw = false;
try { t.capture('staff_hired', 3, { role: 'Engineer' }); t.capture('staff_hired', 4, { role: 'Engineer' }); } catch { threw = true; }
ok(!threw, 'a throwing sink can never break gameplay');
ok(t.buffer.snapshot().length >= 1, 'the local buffer keeps recording when the adapter fails');
const run = t.startRun('seed-1');
t.capture('session_settled', 5, { service: 'mix' }, 'p1');
t.capture('session_settled', 5, { service: 'mix' }, 'p1');
ok(t.buffer.snapshot().length === 1, 'a once-key makes a capture idempotent (strict-mode and reload safe)');
const ev = t.buffer.snapshot()[0];
ok(ev.runId === run && ev.seed === 'seed-1' && ev.simulationVersion.length > 0 && ev.balanceVersion.length > 0, 'events carry run id, seed and versions');
const live = exportLiveTrace(t);
ok(live.schemaVersion === TRACE_SCHEMA_VERSION && live.runId === run && live.events.length === 1 && live.balanceHash === balanceHash(), 'the live export is versioned and carries the balance hash');
ok(!JSON.stringify(live).match(/@|Maya|clientName/), 'the export holds no identity');

// Instrumentation from real game objects stays inside the allowlist.
const base: GameState = { ...createNewGameState(), money: 1000, currentDay: 10, saveSeed: 'fixture' };
const offer = generateNewProjects(2, 4, 'modern', [], 1, 10)[0];
shared.startRun('inst');
trackEnquiry('accepted', base, offer);
trackEnquiry('declined', base, offer);
trackEnquiry('declined', base, undefined);
const report = (id: string, gained: number, quality = 70): ProjectReport => ({
  projectId: id, projectTitle: 'Demo', overallQualityScore: quality, moneyGained: gained, reputationGained: 2,
  playerManagementXpGained: 0, skillBreakdown: [], reviewSnippet: 'ok',
  assignedPerson: { type: 'player', id: 'player', name: 'You' },
}) as ProjectReport;
trackSessionSettled(base, undefined, report('s1', 500));
const captured: GameplayTelemetryEvent[] = shared.buffer.snapshot();
ok(captured.length === 3 && captured[0].name === 'enquiry_accepted', 'enquiry and settlement helpers capture events (an undefined enquiry is skipped)');
ok(captured.every((e) => Object.keys(e.properties).every((k) => ALLOWED_PROPERTIES[e.name].includes(k))), 'every captured property is on its event allowlist');
ok(captured.every((e) => Object.values(e.properties).every((v) => typeof v !== 'string' || !/\s/.test(v))), 'no captured string contains spaces or prose');

// Deterministic replay: same actions, same end state; duplicate settlement is idempotent.
const actions = [
  { kind: 'settle' as const, day: 10, report: report('a', 500) },
  { kind: 'settle' as const, day: 11, report: report('b', 800, 90) },
  { kind: 'settle' as const, day: 11, report: report('a', 500) }, // the duplicate-settlement bug class
];
const trace = buildScenarioTrace('duplicate-settlement', base, actions);
ok(replayGameplayTrace(base, trace).ok, 'a sealed trace replays to the same state');
ok(JSON.stringify(buildScenarioTrace('duplicate-settlement', base, actions)) === JSON.stringify(trace), 'building the trace twice is deterministic');
ok(trace.actions[2].expectedHash === trace.actions[1].expectedHash, 'a duplicate settlement leaves the authoritative state unchanged');
const tampered: GameplayTrace = { ...trace, actions: trace.actions.map((a, i) => (i === 1 ? { ...a, report: { ...a.report, moneyGained: 801 } } : a)) };
const bad = replayGameplayTrace(base, tampered);
ok(!bad.ok && bad.divergence?.index === 1 && bad.divergence.expected === trace.actions[1].expectedHash && bad.divergence.actual !== bad.divergence.expected, 'a divergence names the first bad action with expected and actual hashes');
const wrongStart = replayGameplayTrace({ ...base, money: 1 }, trace);
ok(!wrongStart.ok && wrongStart.divergence?.kind === 'initial-state', 'a different starting state is reported before any action runs');
ok(!replayGameplayTrace(base, { ...trace, schemaVersion: 99 }).ok, 'an unknown schema version is refused');
ok(hashState(base) === hashState({ ...base }), 'the state hash is stable');

// Historical-bug fixture: replay a stored trace against the same starting state.
const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'traces', 'duplicate-settlement.json');
if (process.env.UPDATE_FIXTURES === '1' || !fs.existsSync(fixturePath)) { fs.mkdirSync(path.dirname(fixturePath), { recursive: true }); fs.writeFileSync(fixturePath, JSON.stringify(trace, null, 2) + '\n'); }
const stored = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as GameplayTrace;
const replayed = replayGameplayTrace(base, stored);
ok(replayed.ok, `the stored duplicate-settlement trace still reproduces (${replayed.divergence ? `diverged at ${replayed.divergence.index}` : 'ok'})`);

// Analysis: the first metrics from a trace.
const e = (name: GameplayTelemetryEvent['name'], gameDay: number, properties: GameplayTelemetryEvent['properties']): GameplayTelemetryEvent => ({ name, runId: 'r', gameDay, simulationVersion: 'v', balanceVersion: 'b', properties });
const synthetic: GameplayTrace = { ...trace, runId: 'r', events: [
  e('management_panel_opened', 1, { destination: 'bookings' }),
  e('enquiry_declined', 1, { service: 'mix', feeBand: 'low', roomsFree: 1 }),
  e('enquiry_accepted', 1, { service: 'tracking', feeBand: 'mid', roomsFree: 1 }),
  e('session_booked', 1, { service: 'tracking' }),
  e('intervention_intervened', 2, { kind: 'rhythm' }), e('intervention_delegated', 2, { kind: 'vocal' }), e('intervention_skipped', 3, { kind: 'vocal' }),
  e('session_settled', 3, { qualityBand: 'good' }),
  e('management_panel_opened', 4, { destination: 'gear' }),
  e('staff_hired', 5, { role: 'Engineer' }),
  e('enquiry_declined', 6, { service: 'mix', feeBand: 'low', roomsFree: 0 }),
  e('session_settled', 7, { qualityBand: 'excellent' }),
] };
const s = summarizeTrace(synthetic);
ok(s.enquiries.accepted === 1 && s.enquiries.declined === 2 && s.enquiries.declineRateByFeeBand.low === 1 && s.enquiries.declineRateByService.mix === 1, 'metric: which enquiry attributes cause declines');
ok(s.firstDayNoRoomFree === 6, 'metric: where capacity pressure begins');
ok(s.interventions.played === 1 && s.interventions.delegated === 1 && s.interventions.skipped === 1, 'metric: interventions played vs delegated vs skipped');
ok(s.firstHireDay === 5 && s.bookings.topService === 'tracking' && s.bookings.topServiceShare === 1, 'metric: first hire and repeated choices');
ok(s.quality.good === 0.5 && s.quality.excellent === 0.5, 'metric: share of sessions per quality band');
ok(s.panelsBeforeFirstSettle === 1 && s.panelsByDestination.gear === 1, 'metric: management panels opened before the first settled session');
console.log(`gameplay-telemetry: all ${n} checks passed`);
