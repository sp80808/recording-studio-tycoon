/** Content Workbench (#64): schemas, validator rules, previews. */
import { liveRegistry } from '../src/content/registry';
import { summarise, validateRegistry, SYNERGY_CAPS } from '../src/content/validate';
import { EVENT_FIXTURES, SYNERGY_FIXTURES, explainBriefGenre, explainEvent, explainSynergy } from '../src/content/preview';
import { DIRECTOR_EVENTS } from '../src/narrative/directorEvents';
import { resolveEligibleEvents } from '../src/narrative/eventDirector';
import { evaluateProjectSynergies } from '../src/utils/synergyUtils';
import { STUDIO_SYNERGIES } from '../src/data/synergies';
import { diffToText, structuredDiff } from '../src/content/diff';
import fs from 'node:fs';

let n = 0;
const ok = (c: boolean, m: string) => { if (!c) throw new Error(`FAIL: ${m}`); n++; console.log(`PASS: ${m}`); };
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const strings = JSON.parse(fs.readFileSync('public/locales/en/events.json', 'utf8'));
const reg = liveRegistry();
const rules = (r = reg, s: Record<string, string> | undefined = strings) => validateRegistry(r, s);
const has = (issues: ReturnType<typeof rules>, rule: string, id?: string) => issues.some((i) => i.rule === rule && (!id || i.id === id));

// Shipped content is clean.
ok(summarise(rules()).errors === 0, 'shipped content has no validation errors');
ok(reg.synergies.length >= 20 && reg.events.length >= 60, 'registry sees every synergy and event');
ok(JSON.stringify(liveRegistry()) === JSON.stringify(reg), 'the registry projection is stable');

// Synergy rules.
let r = clone(reg); r.synergies.push({ ...clone(r.synergies[0]) });
ok(has(rules(r), 'duplicate-id'), 'duplicate synergy ids are an error');
ok(has(rules(r), 'duplicate-conditions'), 'duplicate conditions are flagged');
r = clone(reg); r.synergies[0].bonuses.creativityMultiplier = SYNERGY_CAPS.creativityMultiplier + 0.1;
ok(has(rules(r), 'modifier-over-cap', r.synergies[0].id), 'a modifier over the cap is an error');
r = clone(reg); r.synergies[0].bonuses = { staffXpMultiplier: 1.7 };
ok(has(rules(r), 'modifier-near-cap'), 'a modifier using most of the headroom is a warning');
r = clone(reg); r.synergies[0].bonuses = {};
ok(has(rules(r), 'no-bonus'), 'a synergy with no bonus is an error');
r = clone(reg); r.synergies[0].criteria = { requiredStaffRoles: ['Engineer', 'Producer'], minStaffCount: 1 };
ok(has(rules(r), 'impossible'), 'more required roles than staff is impossible');
r = clone(reg); r.synergies[0].criteria = {};
ok(has(rules(r), 'matches-everything'), 'no conditions is flagged');
r = clone(reg); (r.synergies[0].criteria as any).roomTypes = ['garage'];
ok(has(rules(r), 'schema'), 'an unknown room type fails the schema');
r = clone(reg); r.synergies[0].id = 'Bad Id';
ok(has(rules(r), 'schema'), 'a badly formed id fails the schema');

// Event rules.
const ev = (i = 0) => reg.events[i].id;
r = clone(reg); r.events.push(clone(r.events[0]));
ok(has(rules(r), 'duplicate-id') && has(rules(r), 'duplicate-narrative-key'), 'duplicate event id and narrative key are errors');
r = clone(reg); r.events[0].delegable = true; r.events[0].defaultOptionId = undefined;
ok(has(rules(r), 'delegable-without-default', ev()), 'delegable without a default option is an error');
r = clone(reg); r.events[0].defaultOptionId = 'nope';
ok(has(rules(r), 'bad-default', ev()), 'a default that is not an option is an error');
r = clone(reg); r.events[0].cooldownDays = 0; r.events[0].maxOccurrences = undefined;
ok(has(rules(r), 'modal-no-cooldown', ev()), 'a modal event with no cooldown and no limit is a warning');
r = clone(reg); r.events[0].options[0].effects = [{ kind: 'money', amount: 999999 }];
ok(has(rules(r), 'effect-over-limit', ev()), 'a reward beyond the safe range is an error');
r = clone(reg); r.events[0].requiredMemories = ['x-mem']; r.events[0].blockedMemories = ['x-mem'];
ok(has(rules(r), 'impossible', ev()), 'a memory both required and blocked is impossible');
r = clone(reg); r.events[0].requiredMemories = ['memory-nobody-writes'];
ok(has(rules(r), 'unwritten-memory', ev()), 'a memory no option writes is flagged');
ok(has(rules(reg, { ...strings, [`event.${ev()}.title`]: '' }), 'missing-text', ev()), 'missing English text is an error');
r = clone(reg); r.events[0].narrativeKey = 'Bad Key';
ok(has(rules(r), 'schema'), 'a malformed narrative key fails the schema');

// Brief rules.
r = clone(reg); r.briefs.services = r.briefs.services.filter((s) => s.service !== 'mix');
ok(has(rules(r), 'no-room-path'), 'a service with no room path is an error');
r = clone(reg); r.briefs.services[0].room = 'garage' as any;
ok(has(rules(r), 'schema'), 'an unknown room in a brief fails the schema');
r = clone(reg); r.briefs.approaches[0].focus = { performance: 10, soundCapture: 10, layering: 10 };
ok(has(rules(r), 'focus-sum'), 'focus that does not add up is flagged');

// Previews explain, and agree with the engine.
let agree = 0, total = 0;
for (const fx of EVENT_FIXTURES) {
  const eng = new Set(resolveEligibleEvents(fx.state, DIRECTOR_EVENTS).map((e) => e.def.id));
  for (const def of DIRECTOR_EVENTS) {
    const p = explainEvent(fx.state, def);
    total++; if (p.eligible === eng.has(def.id)) agree++;
    if (!p.eligible && !p.reason) throw new Error('blocked event without a reason');
  }
}
ok(agree === total, `event preview agrees with the engine on ${total} event/fixture pairs`);
ok(EVENT_FIXTURES.some((fx) => DIRECTOR_EVENTS.some((d) => explainEvent(fx.state, d).eligible)), 'at least one fixture makes events eligible');

const synAgree = (() => {
  let a = 0, t = 0;
  for (const f of SYNERGY_FIXTURES) {
    const staff = f.staffRoles.map((role, i) => ({ id: `st${i}`, name: role, role, assignedProjectId: 'p1', primaryStats: { creativity: i === 0 ? f.maxCreativity : 0, technical: i === 0 ? f.maxTechnical : 0 } }));
    const state: any = {
      studioRooms: [{ id: 'studio-a', type: f.room }], hiredStaff: staff,
      ownedEquipment: f.categories.map((category, i) => ({ id: `e${i}`, name: category, category, condition: 100 })),
      clientRelationships: { c1: { tier: f.clientTier } },
    };
    const project: any = { id: 'p1', genre: f.genre, clientId: 'c1', bookingRoomId: 'studio-a' };
    let engine: Set<string>;
    try { engine = new Set(evaluateProjectSynergies(project, state).map((s) => s.id)); } catch { return null; }
    for (const s of STUDIO_SYNERGIES) { t++; if (explainSynergy(s as any, f).matches === engine.has(s.id)) a++; }
  }
  return { a, t };
})();
if (synAgree) ok(synAgree.a === synAgree.t, `synergy preview agrees with the engine on ${synAgree.t} pairs`);
const vocal = explainSynergy(STUDIO_SYNERGIES[0] as any, SYNERGY_FIXTURES[1]);
ok(vocal.matches && vocal.checks.length >= 3, 'the vocal chain explains each condition it matched');
ok(!explainSynergy(STUDIO_SYNERGIES[0] as any, SYNERGY_FIXTURES[0]).matches, 'the vocal chain does not match the bedroom fixture');
const bp = explainBriefGenre(reg.briefs, 'Rock');
ok(bp.directions.length > 0 && bp.samples.length === 5 && !bp.usesDefault, 'brief preview lists directions and sample briefs');
ok(explainBriefGenre(reg.briefs, 'Zydeco').usesDefault, 'an unmapped genre falls back to the default directions');

// Structured diff.
ok(structuredDiff(reg.events[0], clone(reg.events[0])).length === 0, 'an unchanged entry has an empty diff');
const d1 = structuredDiff({ a: 1, b: [1, 2], c: 'x' }, { a: 2, b: [1], d: true });
ok(d1.length === 4 && d1.some((l) => l.kind === 'changed' && l.path === 'a') && d1.some((l) => l.kind === 'removed' && l.path === 'b[1]') && d1.some((l) => l.kind === 'added' && l.path === 'd') && d1.some((l) => l.kind === 'removed' && l.path === 'c'), 'the diff reports changed, added and removed fields by path');
ok(diffToText(d1).split('\n').length === 4, 'the diff prints one line per change');

console.log(`content workbench: ${n} checks passed`);
