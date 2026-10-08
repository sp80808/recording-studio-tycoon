/** #258 slice 2: the compact customisation panel lists owned items, hides locked names, and shows spoiler-free hints. */
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudioCustomizationPanel } from '../src/components/StudioCustomizationPanel';
import { createInitialCustomization } from '../src/rpg/studioCustomization';

const noop = () => undefined;
const fresh = renderToStaticMarkup(<StudioCustomizationPanel customization={undefined} premisesTier={0} onChange={noop} />);
assert.match(fresh, /customise-slot-tray/, 'room anchor tray is visible on a new career');
assert.match(fresh, /customise-equipment-tray/, 'owned item tray is visible instead of a dropdown list');
assert.match(fresh, /Wall art/, 'first room anchor is available');
assert.doesNotMatch(fresh, /<select/, 'native form dropdowns do not dominate the game UI');
assert.doesNotMatch(fresh, /Framed first cheque/, 'locked item names are not spoiled');
assert.match(fresh, /Get paid for a session/, 'spoiler-free unlock goal is available under the disclosure');
assert.doesNotMatch(fresh, /Corduroy sofa/, 'sofa is not selectable at premises tier 0');

const earned = { ...createInitialCustomization(), unlockedItems: ['first-cheque-frame', 'session-cans'], provenance: { 'first-cheque-frame': 'First Paid Session: Demo' }, equippedByAnchor: { 'wall-art': 'first-cheque-frame' } };
const owned = renderToStaticMarkup(<StudioCustomizationPanel customization={earned} premisesTier={1} onChange={noop} />);
assert.match(owned, /Framed first cheque/, 'equipped souvenir is visible in the room slot and tray');
assert.match(owned, /First Paid Session: Demo/, 'milestone provenance is always visible for the selected keepsake');
assert.match(owned, /Sofa/, 'new premises room anchors become available');
assert.match(owned, /customise-locked-goals/, 'unlock hints are deduplicated in a collapsed cabinet');
console.log('studio customization panel checks passed');
