import assert from 'node:assert/strict';
import { gearWhyHint, gearWhyKind, GEAR_WHY_TEXT } from '../src/rpg/gearWhy';
import { createInitialKnowHow, noteConceptsMet } from '../src/rpg/studioKnowHow';

const comp = { id: 'urei_1176_compressor', name: 'UREI 1176', category: 'outboard' };
const neve = { id: 'mixing_board_60s', name: 'Neve 1073', category: 'outboard' };
const mic = { id: 'm1', name: 'Dynamic Mic', category: 'microphone' };
const kh = createInitialKnowHow();

assert.equal(gearWhyKind(comp), 'compressor');
assert.equal(gearWhyKind(neve), 'preamp');
assert.equal(gearWhyKind(mic), 'microphone');
assert.equal(gearWhyKind({ category: 'instrument' }), null);
assert.equal(gearWhyKind({}), null);

// Locked until owned or concept met.
assert.equal(gearWhyHint(comp, [], kh), null);
assert.equal(gearWhyHint(comp, ['microphone'], kh), null);
assert.equal(gearWhyHint(comp, ['outboard'], kh)?.id, 'gear.why.compressor');
assert.equal(gearWhyHint(mic, [undefined], undefined), null);
const met = noteConceptsMet({ studioKnowHow: kh }, ['mic-placement']).studioKnowHow;
assert.equal(gearWhyHint(mic, [], met)?.id, 'gear.why.microphone');
assert.equal(gearWhyHint({ id: 'x', category: 'instrument' }, ['instrument'], met), null);

// Every kind has short plain text.
for (const t of Object.values(GEAR_WHY_TEXT)) assert.ok(t.length > 40 && t.length < 260);
console.log('gear-why checks passed');
