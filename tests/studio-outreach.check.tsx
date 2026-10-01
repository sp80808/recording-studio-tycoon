import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getEraDecor } from '../src/components/studio/studioDecorConfig';
import { StudioInspector, type StudioInspectorProps } from '../src/components/StudioInspector';
import { createDefaultGameState } from '../src/utils/newGameState';

const props: StudioInspectorProps = {
  hotspot: 'promotion',
  gameState: { ...createDefaultGameState({ selectedEra: 'modern', currentYear: 2024 }), currentDay: 4 },
  onClose: () => {}, onAdvanceDay: () => {}, onRefreshProjects: () => true,
  onStartProject: () => {}, onAssignStaff: () => {}, onUnassignStaff: () => {},
  onOpenDashboardTab: () => {},
};
const render = (overrides: Partial<StudioInspectorProps> = {}) => renderToStaticMarkup(<StudioInspector {...props} {...overrides} />);
const marketingButton = (markup: string) => markup.match(/<button[^>]*>[\s\S]*?Create marketing content[^<]*<\/button>/)?.[0];

for (const era of ['analog60s', 'classic_rock', 'digital80s', 'golden_age', 'internet2000s', 'digital_age', 'unknown']) {
  assert.notEqual(getEraDecor(era).prop, 'led-strip', `${era} must not have a ring light`);
  assert.equal(render({ gameState: { ...props.gameState, currentEra: era, currentYear: 1960 } }), '');
}
for (const era of ['streaming2020s', 'modern']) {
  assert.equal(getEraDecor(era).prop, 'led-strip');
  assert.equal(getEraDecor(era, 1960).eraId, 'analog60s', 'date wins over a stale saved era');
  assert.equal(getEraDecor(era, 1980).prop, 'neon-sign');
  assert.equal(getEraDecor(era, 2000).prop, 'lava-lamp');
  assert.equal(getEraDecor(era, 2020).prop, 'led-strip');
}
const ready = render();
assert.match(ready, /Create marketing content/);
assert.match(ready, /Contact artists/);
assert.match(ready, /Plan shows &amp; promotions/);
assert.ok(marketingButton(ready) && !marketingButton(ready)!.includes('disabled=""'));
assert.match(marketingButton(render({ gameState: { ...props.gameState, money: 0 } }))!, /disabled=""/);
assert.match(marketingButton(render({ gameState: { ...props.gameState, lastGigRefreshDay: 4 } }))!, /disabled=""/);
assert.match(marketingButton(render({ onRefreshProjects: undefined }))!, /disabled=""/);
assert.match(render({ gameState: { ...props.gameState, lastGigRefreshDay: 4 } }), /Outreach ready in 3 days/);
const freeOutreach = { ...props.gameState, money: 0, playerData: { ...props.gameState.playerData, originId: 'bedroom-beatmaker' as const } };
assert.ok(!marketingButton(render({ gameState: freeOutreach }))!.includes('disabled=""'), 'free-outreach origin works without cash');
const door = render({ hotspot: 'door' });
assert.match(door, /Buy equipment/);
assert.match(door, /Meet artists &amp; book shows/);
assert.match(door, /Scout studio crew/);
console.log('✓ studio outreach: era/date gates, costs, cooldown, origin perk and door menu passed');
