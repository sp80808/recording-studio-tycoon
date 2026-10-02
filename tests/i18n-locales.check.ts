/**
 * Locale load + key-parity checks for every supported locale.
 * Ensures British English is a first-class locale and translation files stay aligned.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALE_CODES,
  isSupportedLocale,
  resolveSupportedLocale,
} from '../src/i18n/supportedLocales';

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

assert.deepEqual(
  [...SUPPORTED_LOCALE_CODES],
  ['en', 'en-GB', 'pl', 'es', 'fr', 'de', 'it', 'pt-BR', 'ru', 'ja', 'ko', 'zh-CN']
);
assert.deepEqual(
  SUPPORTED_LOCALES.map((l) => l.code),
  [...SUPPORTED_LOCALE_CODES],
  'picker entries must mirror SUPPORTED_LOCALE_CODES'
);
assert.equal(DEFAULT_LOCALE, 'en');
assert.equal(isSupportedLocale('en-GB'), true);
assert.equal(isSupportedLocale('en-US'), false);
assert.equal(isSupportedLocale('fr'), true);
assert.equal(isSupportedLocale('xx'), false);
assert.equal(resolveSupportedLocale('en-US'), 'en');
assert.equal(resolveSupportedLocale('pt'), 'pt-BR');
assert.equal(resolveSupportedLocale('pt-PT'), 'pt-BR');
assert.equal(resolveSupportedLocale('zh'), 'zh-CN');
assert.equal(resolveSupportedLocale('zh-Hans'), 'zh-CN');
assert.equal(resolveSupportedLocale('es-MX'), 'es');
assert.equal(resolveSupportedLocale('de_AT'), 'de');
assert.equal(resolveSupportedLocale('en-AU'), 'en-GB');
assert.equal(resolveSupportedLocale('xx'), DEFAULT_LOCALE);
assert.equal(resolveSupportedLocale(undefined), DEFAULT_LOCALE);

const i18nSrc = fs.readFileSync(path.join(process.cwd(), 'src/i18n.ts'), 'utf8');
assert.match(i18nSrc, /SUPPORTED_LOCALE_CODES/);
assert.match(i18nSrc, /nonExplicitSupportedLngs:\s*false/);
assert.match(i18nSrc, /load:\s*'currentOnly'/);

const settingsCtx = fs.readFileSync(path.join(process.cwd(), 'src/contexts/SettingsContext.tsx'), 'utf8');
assert.match(settingsCtx, /i18n\.changeLanguage/);
assert.match(settingsCtx, /resolveSupportedLocale/);

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

const placeholders = (value: string) => (value.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((m) => m.replace(/\s/g, '')).sort();
// i18next plural forms differ per language (ja has only _other, ru adds _few/_many): compare the plural family, not each suffix.
const PLURAL = /_(zero|one|two|few|many|other)$/;
const family = (key: string) => key.replace(PLURAL, '');
const familySet = (keys: string[]) => [...new Set(keys.map(family))].sort();
const enFamilies = familySet(baseKeys);

for (const code of SUPPORTED_LOCALE_CODES) {
  const keys = Object.keys(byLocale[code]).sort();
  assert.deepEqual(familySet(keys), enFamilies, `${code} keys must match en key set (parity)`);
  for (const key of keys) {
    assert.ok(byLocale[code][key].trim().length > 0, `${code}.${key} must be non-empty`);
    const reference = byLocale.en[key] ?? byLocale.en[`${family(key)}_other`];
    assert.deepEqual(
      placeholders(byLocale[code][key]),
      placeholders(reference),
      `${code}.${key} must keep the same {{placeholders}} as en`
    );
  }
}

for (const { code, labelKey, nativeLabel } of SUPPORTED_LOCALES) {
  assert.ok(nativeLabel.trim().length > 0, `${code} needs a native label`);
  for (const viewer of SUPPORTED_LOCALE_CODES) {
    assert.ok(byLocale[viewer][labelKey], `${viewer} is missing language label key ${labelKey}`);
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

// Locale-aware formatting + English fallback behaviour
import { formatNumber, formatPercent, getFormatLocale, setFormatLocale } from '../src/i18n/formatLocale';
import { formatMoney } from '../src/rpg/cities';
setFormatLocale('en');
assert.equal(formatNumber(1234567), '1,234,567');
assert.equal(formatMoney(1240), '$1,240');
setFormatLocale('de');
assert.equal(getFormatLocale(), 'de');
assert.equal(formatNumber(1234567), '1.234.567');
assert.equal(formatMoney(1240, 'london'), formatMoney(1240, 'london').replace(/[\d.,]+/, (m) => m), 'city currency symbol survives locale grouping');
assert.match(formatMoney(-1240), /^-\$1\.240$/);
assert.match(formatPercent(0.12), /12/);
setFormatLocale('xx');
assert.equal(getFormatLocale(), 'en', 'unknown locale falls back to en');
setFormatLocale('en');
console.log('i18n-formatting: all checks passed');

// Content overlay (city lore etc.): key/placeholder parity with en, and English fallback.
import { registerContent, setContentLocale, tc } from '../src/i18n/content';
import { CITIES, describeCity } from '../src/rpg/cities';
const contentEn = JSON.parse(fs.readFileSync(path.join(localesRoot, 'en', 'content.json'), 'utf8')) as Record<string, string>;
for (const city of CITIES) {
  for (const key of ['tagline', 'scene', 'blurb', 'legend', 'edge_label', 'edge_why']) {
    assert.ok(contentEn[`city.${city.id}.${key}`], `content.json missing city.${city.id}.${key}`);
  }
}
import { DIRECTOR_EVENTS } from '../src/narrative/directorEvents';
const eventsEn = JSON.parse(fs.readFileSync(path.join(localesRoot, 'en', 'events.json'), 'utf8')) as Record<string, string>;
for (const e of DIRECTOR_EVENTS) {
  assert.ok(eventsEn[`event.${e.id}.title`], `events.json missing title for ${e.id} (re-dump en/events.json)`);
  for (const op of e.options) assert.ok(eventsEn[`event.${e.id}.opt.${op.id}.label`], `events.json missing option ${e.id}/${op.id}`);
}
for (const [file, en] of [['content', contentEn], ['events', eventsEn]] as const) {
  for (const code of SUPPORTED_LOCALE_CODES) {
    const f = path.join(localesRoot, code, `${file}.json`);
    if (!fs.existsSync(f)) continue; // missing file => English fallback
    const dict = JSON.parse(fs.readFileSync(f, 'utf8')) as Record<string, string>;
    assert.deepEqual(Object.keys(dict).sort(), Object.keys(en).sort(), `${code} ${file}.json keys must match en`);
    for (const key of Object.keys(en)) {
      assert.ok(dict[key].trim().length > 0, `${code} ${file} ${key} empty`);
      assert.deepEqual(placeholders(dict[key]), placeholders(en[key]), `${code} ${file} ${key} placeholders`);
    }
  }
}
const london = CITIES.find((c) => c.id === 'london')!;
setContentLocale('en');
const englishLines = describeCity(london, 'streaming2020s');
registerContent('de', { 'city_ui.demand': 'Gefragt: {{genres}}' });
setContentLocale('de');
const germanLines = describeCity(london, 'streaming2020s');
assert.match(germanLines[1], /^Gefragt: /);
assert.equal(germanLines[2], englishLines[2], 'ids missing from the dictionary fall back to English');
setContentLocale('en');
assert.equal(tc('nope', 'Hello {{n}}', { n: 3 }), 'Hello 3');
console.log('i18n-content: all checks passed');
