/**
 * Regression: iPhone career start.
 *  1. Blank screen after "Open the studio": ChoreHotspotButton received a lucide icon (a forwardRef
 *     object, not a function) and rendered it as a React child, unmounting the whole app.
 *  2. Creator controls dead on iOS: autofocused <16px input (page zoom + keyboard), native <select>,
 *     and a hover-lifting .rst-option card wrapped around the controls.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Wrench } from 'lucide-react';
import { ChoreHotspotButton } from '../src/components/chores/ChoreHotspotButton';

// 1. icon prop accepts a component (function or forwardRef object), an element, or nothing
const component = renderToStaticMarkup(<ChoreHotspotButton label="Fix" icon={Wrench} />);
assert.match(component, /<svg/, 'lucide component icon must render as an svg');
assert.match(renderToStaticMarkup(<ChoreHotspotButton label="Fix" icon={<span data-x="1" />} />), /data-x="1"/);
assert.match(renderToStaticMarkup(<ChoreHotspotButton label="Fix" />), /<svg/);

// 2. creator source guards
const creator = fs.readFileSync('src/components/CareerStartScreen.tsx', 'utf8');
assert.ok(!/autoFocus/.test(creator), 'creator must not autofocus the name input (iOS zoom/keyboard)');
assert.ok(!/<select/.test(creator), 'creator must use tap controls, not a native select');
assert.ok(!/rst-option mx-auto mt-6/.test(creator), 'creator panel must not be a hover-lifting rst-option card');
const css = fs.readFileSync('src/styles/studio-theme.css', 'utf8');
const input = css.match(/\.rst-input\s*\{[^}]*\}/)?.[0] ?? '';
assert.match(input, /font-size:\s*16px/, '.rst-input must be >=16px so iOS does not zoom on focus');
assert.match(css, /\.creator-tap\s*\{[^}]*min-height:\s*44px/, 'arrow buttons need 44px touch targets');

// 3. root has an error boundary
assert.match(fs.readFileSync('src/main.tsx', 'utf8'), /<AppErrorBoundary>/, 'App must be wrapped in AppErrorBoundary');

console.log('mobile onboarding regression checks passed');
