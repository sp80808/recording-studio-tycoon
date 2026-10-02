/** Gear reliability in the session forecast (#62): named, factual, deterministic, no hidden penalty. */
import { gearReliabilityFacts } from '../src/rpg/gearReliability';
import type { Equipment } from '../src/types/game';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const gear = (id: string, over: Partial<Equipment> = {}): Equipment => ({
  id, name: `Gear ${id}`, category: 'interface', price: 400, description: '', bonuses: {}, icon: '', condition: 90, ...over,
} as Equipment);
const day = 10;
const st = (items: Equipment[]) => ({ ownedEquipment: items, currentDay: day });

ok(gearReliabilityFacts(st([gear('a')]), [gear('a')]).length === 0, 'a single healthy piece produces no facts');

const poor = gear('p', { condition: 35 });
const f1 = gearReliabilityFacts(st([poor]), [poor]);
ok(f1.length === 1 && f1[0].points < 0 && /Poor|Worn/i.test(f1[0].label) && /interruption/.test(f1[0].label), 'poor seated gear is named with an interruption risk');
ok(f1[0].hint !== undefined && /quiet slot/.test(f1[0].hint), 'poor gear comes with an actionable hint');
ok(!/destroy|permanent|lose/i.test(f1[0].label), 'the risk is not framed as destruction');

const crit = gear('c', { condition: 10 });
ok(gearReliabilityFacts(st([crit]), [crit])[0].impact === 'large', 'critical gear is a large risk');

const spare = gear('s', { condition: 85 });
const withSpare = gearReliabilityFacts(st([poor, spare]), [poor]);
ok(/spare/i.test(withSpare[0].hint ?? ''), 'a ready spare is suggested in the hint');

const benched = gear('b', { maintenance: { id: 'j', kind: 'service', mode: 'outsource', status: 'scheduled', startedDay: 9, readyDay: 12, conditionAfter: 80, costPaid: 20, clearsQuirks: true } });
const down = gearReliabilityFacts(st([benched]), []);
ok(down.length === 1 && /until day 12/.test(down[0].label) && down[0].points === -3, 'benched gear with no spare is a medium risk with its return day');
const downSpare = gearReliabilityFacts(st([benched, spare]), [spare]);
ok(downSpare.some((f) => /spare is ready/.test(f.label) && f.points === -1), 'a ready spare softens the downtime');

const faulted = gear('f', { fault: { family: 'contact-noise', startedDay: 10, readyDay: 11, milestone: 3 } });
ok(gearReliabilityFacts(st([faulted]), []).some((f) => /until day 11/.test(f.label)), 'a fault names the day the gear is back');
const recovered = gear('r', { fault: { family: 'contact-noise', startedDay: 8, readyDay: 9, milestone: 2 } });
ok(gearReliabilityFacts(st([recovered]), [recovered]).length === 0, 'a fault that has expired no longer counts');

const top = gear('t', { condition: 95 });
const comfort = gearReliabilityFacts(st([top, spare]), [top]);
ok(comfort.length === 1 && comfort[0].points > 0 && /backup/.test(comfort[0].label), 'healthy gear with a backup is named as a comfort');
ok(JSON.stringify(gearReliabilityFacts(st([poor, spare]), [poor])) === JSON.stringify(withSpare), 'facts are deterministic');

const nonMaint = gear('m', { category: 'monitor', condition: 5 });
ok(gearReliabilityFacts(st([nonMaint]), [nonMaint]).length === 0, 'categories outside the maintenance slice are ignored');
const frozen = JSON.stringify(st([poor, spare]));
gearReliabilityFacts(st([poor, spare]), [poor]);
ok(JSON.stringify(st([poor, spare])) === frozen, 'facts never mutate state');
console.log(`gear-reliability: ${n} checks passed`);
