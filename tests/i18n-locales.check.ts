/**
 * Locale load + key-parity checks for en / en-GB / pl.
 * Ensures British English is a first-class locale and translation files stay aligned.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOCALE, SUPPORTED_LOCALE_CODES, isSupportedLocale } from '../src/i18n/supportedLocales';

const localesRoot = path.join(process.cwd(), 'public', 'locales');

function loadLocale(code: string): Record<string, string> {
  const filePath = path.join(localesRoot, code, 'common.json');
  assert.ok(fs.existsSync(filePath), `missing locale file: ${filePath}`);
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  assert.equal(typeof parsed, 'object');
  assert.ok(parsed && !Array.isArray(parsed), `${code} common.json must be an object`);
  for (const [key, value] of Object.entries(parsed)) {
    assert.equal(typeof value, 'string', `${code}.${key} must be a string`);
  }
  return parsed as Record<string, string>;
}

console.log('Testing i18n locale registry & key parity...');

assert.deepEqual([...SUPPORTED_LOCALE_CODES], ['en', 'en-GB', 'pl']);
assert.equal(DEFAULT_LOCALE, 'en');
assert.equal(isSupportedLocale('en-GB'), true);
assert.equal(isSupportedLocale('en-US'), false);
assert.equal(isSupportedLocale('fr'), false);

const i18nSrc = fs.readFileSync(path.join(process.cwd(), 'src/i18n.ts'), 'utf8');
assert.match(i18nSrc, /SUPPORTED_LOCALE_CODES/);
assert.match(i18nSrc, /nonExplicitSupportedLngs:\s*false/);
assert.match(i18nSrc, /load:\s*'currentOnly'/);

const settingsCtx = fs.readFileSync(path.join(process.cwd(), 'src/contexts/SettingsContext.tsx'), 'utf8');
assert.match(settingsCtx, /i18n\.changeLanguage/);
assert.match(settingsCtx, /isSupportedLocale/);

const settingsModal = fs.readFileSync(path.join(process.cwd(), 'src/components/modals/SettingsModal.tsx'), 'utf8');
assert.match(settingsModal, /SUPPORTED_LOCALES/);
assert.match(settingsModal, /SUPPORTED_LOCALES\.map/);

const localeRegistry = fs.readFileSync(path.join(process.cwd(), 'src/i18n/supportedLocales.ts'), 'utf8');
assert.match(localeRegistry, /en-GB/);
assert.match(localeRegistry, /English \(UK\)/);

const byLocale = Object.fromEntries(
  SUPPORTED_LOCALE_CODES.map((code) => [code, loadLocale(code)])
) as Record<(typeof SUPPORTED_LOCALE_CODES)[number], Record<string, string>>;

const baseKeys = Object.keys(byLocale.en).sort();
assert.ok(baseKeys.length >= 80, `expected expanded en coverage, got ${baseKeys.length} keys`);

for (const code of SUPPORTED_LOCALE_CODES) {
  const keys = Object.keys(byLocale[code]).sort();
  assert.deepEqual(keys, baseKeys, `${code} keys must match en key set (parity)`);
  for (const key of baseKeys) {
    assert.ok(byLocale[code][key].trim().length > 0, `${code}.${key} must be non-empty`);
  }
}

assert.match(byLocale['en-GB'].splash_tagline, /analogue/i);
assert.match(byLocale['en-GB'].settings_analog_tape_warmth, /Analogue/);
assert.match(byLocale['en-GB'].settings_pocket_strict, /analogue/i);
assert.doesNotMatch(byLocale['en-GB'].settings_pocket_meter_assist, /Metre/i, 'PocketMeter product name stays Meter');
assert.equal(byLocale.en.splash_tagline.includes('analog'), true);
assert.equal(byLocale['en-GB'].splash_tagline.includes('analogue'), true);

const defaults = fs.readFileSync(path.join(process.cwd(), 'src/data/defaultSettings.ts'), 'utf8');
assert.match(defaults, /language:\s*'en'/);

console.log(`PASS: ${baseKeys.length} keys aligned across ${SUPPORTED_LOCALE_CODES.join(', ')}`);
console.log('i18n-locales: all checks passed');
