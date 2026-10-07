/** #306 backlog 6: concept codex derives from conceptsMet, hides unmet text, and has locale keys everywhere. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConceptCodexPanel } from '../src/components/ConceptCodexPanel';
import { AUDIO_CONCEPT_IDS } from '../src/rpg/audioConcepts';
import { CODEX_COMPLETE_XP, CODEX_CONCEPTS, noteConceptsWithReward, codexLineId, codexNameId, codexProgress, deriveCodex } from '../src/rpg/conceptCodex';
import { MIC_LINE_TEXT, micLineId, micPlacementLine } from '../src/rpg/micPlacementLine';
import { createInitialKnowHow, noteConceptsMet } from '../src/rpg/studioKnowHow';

// Every concept has a name and a short one-line explanation.
for (const id of AUDIO_CONCEPT_IDS) {
  const c = CODEX_CONCEPTS[id];
  assert.ok(c && c.name && c.line.length > 20 && c.line.length < 140, id);
}

// Fresh and legacy saves: all locked, no text leaked.
assert.ok(deriveCodex(undefined).every(e => !e.met && !e.concept));
assert.deepEqual(codexProgress(createInitialKnowHow()), { met: 0, total: AUDIO_CONCEPT_IDS.length, complete: false });
const fresh = renderToStaticMarkup(<ConceptCodexPanel knowHow={undefined} />);
assert.match(fresh, /Nothing here yet/);
assert.doesNotMatch(fresh, /Gain staging/, 'unmet names are not spoiled');

// Deterministic, order-stable derivation from play.
const g = noteConceptsMet({ studioKnowHow: createInitialKnowHow() }, ['polarity', 'eq']);
const entries = deriveCodex(g.studioKnowHow);
assert.deepEqual(entries.map(e => e.id), [...AUDIO_CONCEPT_IDS]);
assert.deepEqual(entries.filter(e => e.met).map(e => e.id), ['eq', 'polarity']);
assert.deepEqual(deriveCodex(g.studioKnowHow), entries);
const html = renderToStaticMarkup(<ConceptCodexPanel knowHow={g.studioKnowHow} />);
assert.match(html, /2\/6/);
assert.match(html, /out of phase/);
assert.doesNotMatch(html, /Compression/);

// Complete set.
const all = noteConceptsMet({ studioKnowHow: createInitialKnowHow() }, AUDIO_CONCEPT_IDS);
assert.equal(codexProgress(all.studioKnowHow).complete, true);

// Completion reward: paid once, XP only, badge shown in the panel.
const base = { studioKnowHow: createInitialKnowHow(), playerData: { xp: 10 } };
const part = noteConceptsWithReward(base, ['eq']);
assert.equal(part.playerData.xp, 10);
assert.doesNotMatch(renderToStaticMarkup(<ConceptCodexPanel knowHow={part.studioKnowHow} />), /Good Ears/);
const done = noteConceptsWithReward(base, AUDIO_CONCEPT_IDS);
assert.equal(done.playerData.xp, 10 + CODEX_COMPLETE_XP);
assert.equal(noteConceptsWithReward(done, AUDIO_CONCEPT_IDS).playerData.xp, done.playerData.xp, 'one-time');
assert.equal(noteConceptsWithReward(done, ['eq']), done);
assert.match(renderToStaticMarkup(<ConceptCodexPanel knowHow={done.studioKnowHow} />), /Good Ears/);

// Mic-placement line: needs a mic, deterministic, no digits, marks the concept.
assert.equal(micPlacementLine('vocal-suite', false, 's'), null);
const ml = micPlacementLine('vocal-suite', true, 's')!;
assert.deepEqual(micPlacementLine('vocal-suite', true, 's'), ml);
assert.equal(ml.concept, 'mic-placement');
assert.equal(micPlacementLine(undefined, true, 's')!.id.startsWith('mic.line.project-studio.'), true);
for (const lines of Object.values(MIC_LINE_TEXT)) for (const l of lines) assert.doesNotMatch(l, /\d/);
const met = noteConceptsMet({ studioKnowHow: createInitialKnowHow() }, [ml.concept]);
assert.equal(deriveCodex(met.studioKnowHow).find(e => e.id === 'mic-placement')!.met, true);

// Locale keys exist in every content.json.
const dir = path.join(process.cwd(), 'public', 'locales');
const micKeys = Object.entries(MIC_LINE_TEXT).flatMap(([r, ls]) => ls.map((_, i) => micLineId(r as keyof typeof MIC_LINE_TEXT, i)));
const keys = ['mic.line.title', 'codex.badge.name', 'codex.badge.line', ...micKeys, 'codex.title', 'codex.empty', 'codex.locked', ...AUDIO_CONCEPT_IDS.flatMap(id => [codexNameId(id), codexLineId(id)])];
for (const loc of fs.readdirSync(dir)) {
  const f = path.join(dir, loc, 'content.json');
  if (!fs.existsSync(f)) continue;
  const json = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const k of keys) assert.ok(typeof json[k] === 'string' && json[k], `${loc} missing ${k}`);
}
console.log('concept codex checks passed');
