import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { studioProps, usesCrispProceduralProp } from '../src/features/sprites/studioKit';
import { getPremisesProps } from '../src/components/studio/studioPremisesDecor';

console.log('studio-kit-props checks…');

for (const model of ['cardboardBoxClosed', 'pottedPlant', 'plantSmall1', 'plantSmall2', 'plantSmall3']) {
  assert.equal(usesCrispProceduralProp(model), true, `${model} avoids enlarged atlas art`);
}
assert.equal(usesCrispProceduralProp('chairDesk'), false, 'Unrelated authored furniture stays on the atlas path');

const visibleModels = new Set(studioProps(5, 'analog60s').map(prop => prop.model));
assert.ok(visibleModels.has('pottedPlant') && visibleModels.has('cardboardBoxClosed'), 'Crisp replacements preserve intended room dressing');

const source = readFileSync('src/features/sprites/studioKit.ts', 'utf8');
assert.match(source, /:procedural/, 'Procedural props are labelled for runtime inspection');
assert.match(source, /buildCrispPlant|buildCrispBox/, 'Blur-prone models use sharp Pixi geometry');
assert.ok(
  getPremisesProps(3).every(prop => prop.id !== 'waterCooler'),
  'Ambiguous blue floor cylinder is removed from premises dressing',
);

console.log('✓ studio-kit-props checks passed');
