import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PATCH_LESSON_TEXT, patchLesson, patchLessonId, suggestedGearForSlot } from '../src/rpg/patchLearning';
import { SIGNAL_SLOTS, type SignalChain } from '../src/rpg/signalChain';
import type { Equipment, GameState } from '../src/types/game';

const gear = (id: string, category: Equipment['category'], condition = 100): Equipment =>
  ({ id, name: id, category, price: 0, description: '', bonuses: {}, icon: '', condition }) as Equipment;
const owned = [
  gear('ribbon_vintage_mic', 'microphone'), gear('condenser_mic', 'microphone'),
  gear('api_the_wiser', 'outboard'), gear('fairychild_comp', 'outboard'), gear('audio_interface', 'interface'),
];
const state = { ownedEquipment: owned, activeProject: null, activeProjects: [], hiredStaff: [] } as unknown as GameState;
const empty: SignalChain = { id: 'c', name: 'v', service: 'vocal-recording', roomId: 'studio-a', slots: {} };
const warm = { direction: 'intimate' as const, priority: 'quality' as const, genre: 'Soul' };
const clean = { direction: 'polished' as const, priority: 'quality' as const, genre: 'Pop' };

// Lessons: one short real-recording line per jack, stable id.
for (const slot of SIGNAL_SLOTS) {
  const t = PATCH_LESSON_TEXT[slot];
  assert.ok(t.length > 40 && t.length < 220, `${slot} lesson is short plain text`);
  assert.ok(!/\d/.test(t), `${slot} lesson exposes no numbers`);
  assert.equal(patchLesson(slot).id, patchLessonId(slot));
  assert.equal(patchLessonId(slot), `chain.learn.${slot}`);
}

// Suggested chain hint: deterministic, brief-sensitive, never a lone or tied pick.
assert.equal(suggestedGearForSlot('microphone', empty, state, [], warm), 'ribbon_vintage_mic');
assert.equal(suggestedGearForSlot('microphone', empty, state, [], clean), 'condenser_mic');
assert.equal(suggestedGearForSlot('microphone', empty, state, [], warm), suggestedGearForSlot('microphone', empty, state, [], warm));
assert.equal(suggestedGearForSlot('dynamics', empty, state, [], warm), undefined, 'single option is not a recommendation');

// Busy gear (in another live chain) is never suggested.
const busy = { ...state, activeProjects: [{ id: 'other', signalChain: { ...empty, slots: { microphone: 'ribbon_vintage_mic' } } }] } as unknown as GameState;
assert.notEqual(suggestedGearForSlot('microphone', empty, busy, [], warm), 'ribbon_vintage_mic');

// Locale keys exist in every content.json that ships.
const keys = ['chain.hint.suggested', ...SIGNAL_SLOTS.map(patchLessonId)];
const root = join(process.cwd(), 'public', 'locales');
let files = 0;
for (const lng of readdirSync(root)) {
  const f = join(root, lng, 'content.json');
  if (!existsSync(f)) continue;
  const dict = JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>;
  for (const k of keys) assert.equal(typeof dict[k], 'string', `${lng} missing ${k}`);
  files++;
}
assert.ok(files >= 11, 'checked every shipped content.json');

// The rack wires both features in.
const src = readFileSync(join(process.cwd(), 'src/components/ChainComposer.tsx'), 'utf8');
assert.match(src, /patchLesson\(/);
assert.match(src, /suggestedGearForSlot\(/);

console.log('patch-learning checks passed');
