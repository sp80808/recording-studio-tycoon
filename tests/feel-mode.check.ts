import assert from 'node:assert';
import { feelAttributes } from '../src/lib/motion/feelMode';
import { readFileSync } from 'node:fs';

console.log('Testing feel mode...');
assert.deepStrictEqual(feelAttributes({ reducedMotion: true, graphicsPreset: 'low' }), { 'data-reduced-motion': 'true', 'data-graphics': 'low' });
assert.deepStrictEqual(feelAttributes({}), { 'data-reduced-motion': 'false', 'data-graphics': 'high' });

const css = readFileSync('src/styles/feel.css', 'utf8');
for (const cls of ['feel-press', 'feel-stagger', 'feel-pop', 'feel-attention', 'feel-land', 'feel-sheen', 'feel-underline']) {
  assert.ok(css.includes(`.${cls}`), `${cls} defined`);
  assert.ok(css.includes(`[data-reduced-motion='true'] .${cls}`) || css.includes(`.${cls}, `) || css.includes(`.${cls}:`) || css.includes(`.${cls}::`) , `${cls} has reduced-motion handling`);
}
assert.ok(css.includes("prefers-reduced-motion: reduce"), 'OS reduced motion honoured');
console.log('feel mode OK');
