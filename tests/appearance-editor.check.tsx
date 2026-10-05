/**
 * #212: the appearance editor is rendered from one descriptor table; one control surface per property,
 * visible label + value on every row, no raw enum ids, no arrow rails around the preview.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppearanceEditor } from '../src/components/AppearanceEditor';
import { ProducerCreator } from '../src/components/ProducerCreator';
import {
  APPEARANCE_FIELDS,
  APPEARANCE_UI,
  appearanceCopy,
  appearanceValueLabel,
  cycleAppearanceField,
  getAppearanceField,
  setAppearanceField,
} from '../src/features/sprites/appearanceFields';
import { DEFAULT_PRODUCER_APPEARANCE, PRODUCER_APPEARANCE_KEYS, buildProducerNpc, sanitizeProducerAppearance } from '../src/features/sprites/producerAppearance';
import { registerContent, setContentLocale } from '../src/i18n/content';

const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const A = DEFAULT_PRODUCER_APPEARANCE;

describe('appearance field descriptors (#212)', () => {
  it('has exactly one descriptor per editable property (everything but the face seed)', () => {
    assert.deepEqual(APPEARANCE_FIELDS.map((f) => f.id).sort(), PRODUCER_APPEARANCE_KEYS.filter((k) => k !== 'seed').sort());
    assert.equal(new Set(APPEARANCE_FIELDS.map((f) => f.id)).size, APPEARANCE_FIELDS.length);
    assert.deepEqual(APPEARANCE_FIELDS.filter((f) => f.kind === 'swatch').map((f) => f.id), ['skinTone', 'hairColour', 'clothesColour']);
  });

  it('cycles forwards and backwards with wrap-around', () => {
    for (const field of APPEARANCE_FIELDS) {
      const first = field.options[0].value;
      const last = field.options[field.options.length - 1].value;
      const atFirst = field.set(A, first);
      assert.equal(field.get(cycleAppearanceField(field, atFirst, -1)), last, `${field.id}: back from first wraps to last`);
      assert.equal(field.get(cycleAppearanceField(field, field.set(A, last), 1)), first, `${field.id}: forward from last wraps to first`);
      let walk = atFirst;
      for (const option of field.options) {
        assert.equal(field.get(walk), option.value, `${field.id}: visits options in order`);
        walk = cycleAppearanceField(field, walk, 1);
      }
      assert.equal(field.get(walk), first, `${field.id}: full lap returns to start`);
    }
  });

  it('cycling only changes its own field and returns a sanitised appearance', () => {
    for (const field of APPEARANCE_FIELDS) {
      const next = cycleAppearanceField(field, A, 1);
      for (const key of PRODUCER_APPEARANCE_KEYS) if (key !== field.id) assert.equal(next[key], A[key], `${field.id} must not touch ${key}`);
      assert.deepEqual(sanitizeProducerAppearance(next), next);
    }
  });

  it('direct selection sets the value; unknown values cannot enter the appearance', () => {
    const hair = getAppearanceField('hairColour');
    assert.equal(setAppearanceField(hair, A, 'neon_pink').hairColour, 'neon_pink');
    assert.equal(setAppearanceField(hair, A, 'not-a-colour').hairColour, A.hairColour);
  });

  it('every option carries a name (not a raw id) and swatch fields carry a swatch', () => {
    for (const field of APPEARANCE_FIELDS) {
      for (const option of field.options) {
        assert.notEqual(option.label, option.value, `${field.id}.${option.value} label must not be the raw id`);
        assert.doesNotMatch(option.label, /_/, `${field.id}.${option.value} label must read as a name`);
        if (field.kind === 'swatch') assert.ok(option.swatch, `${field.id}.${option.value} needs a swatch`);
      }
      assert.equal(new Set(field.options.map((o) => o.value)).size, field.options.length, `${field.id}: duplicate option ids`);
    }
  });
});

describe('appearance copy / i18n (#212)', () => {
  it('en/appearance.json mirrors the descriptor English exactly', () => {
    const en = JSON.parse(fs.readFileSync('public/locales/en/appearance.json', 'utf8')) as Record<string, string>;
    assert.deepEqual(en, appearanceCopy());
    assert.ok(Object.keys(APPEARANCE_UI).every((k) => k in en));
  });

  it('labels resolve through the content overlay', () => {
    const hair = getAppearanceField('hair');
    registerContent('de', { 'appearance.field.hair': 'Frisur', 'appearance.hair.afro': 'Afro-Look' });
    setContentLocale('de');
    const markup = html(<AppearanceEditor appearance={{ ...A, hair: 'afro' }} onChange={() => {}} />);
    assert.match(markup, /Frisur/);
    assert.match(markup, /Afro-Look/);
    assert.equal(appearanceValueLabel(hair, { ...A, hair: 'afro' }), 'Afro-Look');
    assert.match(markup, /Previous Frisur/, 'interpolated aria label uses the translated field name');
    setContentLocale('en');
  });
});

describe('AppearanceEditor markup (#212)', () => {
  const markup = html(<AppearanceEditor appearance={{ ...A, hair: 'messy_curly', accessory: 'headphones' }} onChange={() => {}} />);

  it('shows a visible label and value for every row', () => {
    for (const field of APPEARANCE_FIELDS) {
      assert.match(markup, new RegExp(`data-field="${field.id}"`));
      assert.match(markup, new RegExp(`>${field.label}</span>`), `${field.id} label is visible text`);
      assert.match(markup, new RegExp(`data-testid="appearance-value-${field.id}"[^>]*>[^<]+<`), `${field.id} value is visible text`);
    }
    assert.match(markup, />Messy curls</);
  });

  it('has one control surface per property: 6 prev/next pairs and swatches only for colour rows', () => {
    const choiceRows = APPEARANCE_FIELDS.filter((f) => f.kind === 'choice').length;
    assert.equal((markup.match(/aria-label="Previous /g) ?? []).length, choiceRows);
    assert.equal((markup.match(/aria-label="Next /g) ?? []).length, choiceRows);
    const swatchCount = APPEARANCE_FIELDS.filter((f) => f.kind === 'swatch').reduce((n, f) => n + f.options.length, 0);
    assert.equal((markup.match(/role="radio"/g) ?? []).length, swatchCount);
  });

  it('never exposes raw enum ids as text', () => {
    const text = markup.replace(/<[^>]*>/g, ' ');
    for (const field of APPEARANCE_FIELDS) for (const o of field.options) if (o.value.includes('_')) assert.ok(!text.includes(o.value), `${o.value} leaked`);
  });
});

describe('ProducerCreator layout (#212)', () => {
  const npc = buildProducerNpc(A, 'Test', 'golden_age');
  const markup = html(<ProducerCreator moniker="Test" onMoniker={() => {}} look={A} npc={npc} onLookChange={() => {}} onRandomise={() => {}} />);

  it('has no arrow rails around the preview: prev/next buttons live only in the editor rows', () => {
    const preview = markup.match(/data-testid="producer-preview".*?<\/div>/s)![0];
    assert.doesNotMatch(preview, /<button/);
    assert.equal((markup.match(/aria-label="Previous /g) ?? []).length, 6);
    assert.doesNotMatch(markup, /dressing-/);
  });

  it('keeps name, Surprise me and Undo', () => {
    assert.match(markup, /Producer name/);
    assert.match(markup, /data-testid="producer-randomise"/);
    assert.match(markup, / Undo</);
  });

  it('source has no leftover rail components', () => {
    for (const file of ['src/components/ProducerCreator.tsx', 'src/components/modals/CharacterCustomizationModal.tsx', 'src/components/CareerStartScreen.tsx']) {
      const src = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(src, /dressing-arrow|AppearanceArrowRow|dressing-part/, file);
    }
    assert.doesNotMatch(fs.readFileSync('src/components/producer-creator.css', 'utf8'), /dressing-/);
  });
});
