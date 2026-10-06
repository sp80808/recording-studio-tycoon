/** #258 slice 2: the compact customisation panel lists owned items, hides locked names, and shows spoiler-free hints. */
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudioCustomizationPanel } from '../src/components/StudioCustomizationPanel';
import { createInitialCustomization } from '../src/rpg/studioCustomization';

const noop = () => undefined;
const fresh = renderToStaticMarkup(<StudioCustomizationPanel customization={undefined} premisesTier={0} onChange={noop} />);
assert.match(fresh, /Brass desk lamp/, 'default furnishing is selectable');
assert.doesNotMatch(fresh, /Framed first cheque/, 'locked item names are not spoiled');
assert.match(fresh, /Get paid for a session/, 'locked item shows its source hint');
assert.doesNotMatch(fresh, /Corduroy sofa/, 'sofa anchor is absent at premises tier 0');

const earned = { ...createInitialCustomization(), unlockedItems: ['first-cheque-frame', 'session-cans'], provenance: { 'first-cheque-frame': 'First Paid Session: Demo' }, equippedByAnchor: { 'wall-art': 'first-cheque-frame' } };
const owned = renderToStaticMarkup(<StudioCustomizationPanel customization={earned} premisesTier={1} onChange={noop} />);
assert.match(owned, /Framed first cheque/);
assert.match(owned, /Session cans/);
assert.match(owned, /Corduroy sofa/);
assert.match(owned, /First Paid Session: Demo/, 'provenance shown for equipped item');
console.log('studio customization panel checks passed');
