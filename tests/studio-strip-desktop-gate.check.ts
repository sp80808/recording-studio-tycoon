/** zel.6: compact Studio Strip must stay gated to Tauri + feature flag (browser = full UI). */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const baseDir = process.cwd();
const read = (p: string): string => fs.readFileSync(path.join(baseDir, p), 'utf8');

const platform = read('src/utils/platform.ts');
assert(platform.includes('export function isTauriShell'), 'platform.ts exports isTauriShell');
assert(platform.includes('__TAURI_INTERNALS__') || platform.includes('__TAURI__'), 'detects Tauri globals');

const flags = read('src/stores/featureFlagStore.ts');
assert(flags.includes("'desktop-studio-strip'"), 'featureFlagStore owns desktop-studio-strip');

const index = read('src/pages/Index.tsx');
assert(index.includes('isTauriShell'), 'Index imports Tauri shell gate');
assert(index.includes('effectiveCompactStudioMode'), 'Index uses effectiveCompactStudioMode');
assert(index.includes('desktopStripEnabled'), 'Index computes desktopStripEnabled');

const main = read('src/components/MainGameContent.tsx');
assert(main.includes('desktopStripEnabled'), 'MainGameContent accepts desktopStripEnabled');
assert(
  main.includes('compactStudioMode && desktopStripEnabled'),
  'compact strip branch requires desktopStripEnabled'
);
assert(
  main.includes('{desktopStripEnabled && ('),
  'Desktop studio strip entry button is gated'
);

console.log('PASS: zel.6 Studio Strip desktop gate verified');
