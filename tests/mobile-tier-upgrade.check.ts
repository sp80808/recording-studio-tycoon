import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Source-level layout guard. A real-device screenshot pass is still required (#399).
// Keep the milestone above the studio HUD and usable at 320px PWA width.
const source = readFileSync('src/components/TierUpgradeAnimation.tsx', 'utf8');

assert.match(source, /createPortal\(/, 'milestone must escape StudioRoom stacking contexts');
assert.match(source, /document\.body/, 'milestone must mount at the document overlay layer');
assert.match(source, /z-\[220\]/, 'blocking milestone must outrank HUD, toasts and reward flights');
assert.match(source, /aria-modal="true"/, 'blocking milestone must advertise modal semantics');
assert.match(source, /aria-labelledby="rst-tier-upgrade-title"/, 'screen reader heading must be bound to dialog');
assert.match(source, /continueRef\.current\?\.focus\(\)/, 'continue action must receive keyboard focus');
assert.match(source, /e\.key === 'Tab'/, 'background tab focus must be trapped');
assert.match(source, /--rst-safe-top/, 'overlay must respect notch or Dynamic Island');
assert.match(source, /--rst-safe-bottom/, 'overlay must respect home indicator');
assert.match(source, /max-h-full overflow-y-auto/, 'long perk lists must have contained scrolling');
assert.match(source, /sticky bottom-0/, 'continue action must remain available when scrolling');
assert.match(source, /min-h-11/, 'continue touch target must be at least 44 CSS px');
assert.match(source, /sm:hidden/, 'phone layout must have its own compact comparison');
assert.match(source, /hidden grid-cols-2 gap-3 sm:grid/, 'two-column cards must be desktop-only');
assert.match(source, /statChanges\.map/, 'phone comparison must show all deltas explicitly');
assert.doesNotMatch(source, /text-2xl font-black[^\n]*flex items-center/, 'avoid an oversized unbroken heading');
assert.match(source, /completedRef\.current/, 'timed and manually skipped completion must be idempotent');

console.log('Mobile tier-up overlay static layout guards passed (#399); device screenshot verification remains pending.');
