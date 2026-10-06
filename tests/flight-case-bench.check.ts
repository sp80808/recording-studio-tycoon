import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { BENCH_TESTS, benchVerdict, gearKindOf, wrongSocketMessage } from '../src/features/boxDrops/gearKind';
import { LOOT_TABLE } from '../src/features/boxDrops/lootGenerator';

let passed = 0;
const ok = (c: boolean, m: string) => { assert.ok(c, m); passed++; console.log(`PASS: ${m}`); };
const kind = (name: string, category?: string) => gearKindOf({ name, equipment: category ? ({ category } as never) : undefined });

ok(kind('Tube Microphone') === 'mic' && kind('Modern Condenser Mic') === 'mic', 'microphones are mics');
ok(kind('Microphone Stand') === 'stand', 'a mic stand is a stand, not a mic');
ok(kind('MIDI Controller') === 'keys' && kind('Synthesizer') === 'keys', 'keyboards and controllers are keys');
ok(kind('Studio Headphones') === 'headphones' && kind('Guitar Amp') === 'amp', 'headphones and amps recognised');
ok(kind('Plugin Bundle License (used key)') === 'software', 'licence keys are software');
ok(kind('Reel-to-Reel Tape Machine') === 'recorder' && kind('Analog Console') === 'console', 'tape and consoles recognised');
ok(kind('Mystery Box', 'microphone') === 'mic' && kind('Thing', 'mixer') === 'console', 'catalogue category wins over name');

ok(BENCH_TESTS.mic.plug === 'xlr' && BENCH_TESTS.keys.plug === 'trs', 'mics test on XLR, synths on 1/4"');
ok(BENCH_TESTS.stand.plug === null && Boolean(BENCH_TESTS.stand.noTestReason), 'nothing to plug in for a stand');
const names = Object.values(LOOT_TABLE).flat().map((e) => e.item.name);
ok(names.every((n) => BENCH_TESTS[kind(n)] !== undefined), 'every loot item maps to a bench test');

ok(benchVerdict(90).tone === 'good' && benchVerdict(60).tone === 'ok' && benchVerdict(20).tone === 'bad', 'bench verdict follows visible condition bands');
ok(benchVerdict(90).level > benchVerdict(20).level, 'healthier gear lights more meter');
ok(wrongSocketMessage('xlr', 'trs') === 'An XLR plug won\'t go in a 1/4" socket.', 'wrong socket explains itself in plain words');

const bench = readFileSync('src/features/boxDrops/connectors/TestBench.tsx', 'utf8');
const reveal = readFileSync('src/components/motion/primitives/FlightCaseReveal.tsx', 'utf8');
ok(/SNAP_RADIUS_PX = \d+/.test(bench) && /onPointerUp/.test(bench) && /onWrongSocket/.test(bench), 'bench snaps by radius and refuses wrong sockets');
ok(/offsetLeft/.test(bench), 'snap targets are measured from layout, not mid-animation rects');
ok(!/SnakeCableConnector|ChassisGroundClip/.test(reveal), 'opening a case no longer means unplugging an audio snake or ground strap');
ok(/<TestBench/.test(reveal) && !/<HardwarePatchPanel|<InteractivePatchCable/.test(reveal), 'unboxing uses the bench test');
ok(/GearSilhouette/.test(reveal) && !/'🎛️'/.test(reveal), 'foam cutout is shaped like the gear');
ok(/leftLatchOpen \|\| lidFree/.test(reveal), 'flipping one latch does not show both as open');

console.log(`\n${passed} flight-case bench checks passed`);
