/**
 * #215: every appearance option maps to a distinct, valid renderer input and a visibly different preview.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ModularNpcDefinition } from '../src/features/sprites/spriteTypes';
import { ModularSpriteRenderer } from '../src/features/sprites/ModularSpriteRenderer';
import { APPEARANCE_FIELDS, isAppearanceFieldRelevant } from '../src/features/sprites/appearanceFields';
import { DEFAULT_PRODUCER_APPEARANCE, buildProducerNpc, randomiseProducerAppearance, sanitizeProducerAppearance } from '../src/features/sprites/producerAppearance';
import { SKIN_PALETTES } from '../src/features/sprites/npcAppearanceData';
import { createSeededRandom } from '../src/simulation/seededRandom';
import { AUDIT_BASELINES, enumerateAppearanceOptions, findNoOpOptions, INTENTIONAL_SHARED_RENDER } from '../src/dev/appearanceAudit';

const draw = (npc: ModularNpcDefinition) =>
  renderToStaticMarkup(<ModularSpriteRenderer npc={npc} animationState="idle" scale={9} showBadge={false} />);
const probes = enumerateAppearanceOptions(DEFAULT_PRODUCER_APPEARANCE, draw);

describe('appearance option audit (#215)', () => {
  it('probes every option of every field once', () => {
    assert.equal(probes.length, APPEARANCE_FIELDS.reduce((n, f) => n + f.options.length, 0));
  });

  it('no two options of a field share a definition, layer stack or drawing (unless listed as intentional)', () => {
    for (const by of ['definitionKey', 'layerKey', 'drawing'] as const) {
      assert.deepEqual(findNoOpOptions(probes, by), [], `no-op options by ${by}`);
    }
    assert.equal(INTENTIONAL_SHARED_RENDER.size, 0, 'update this test if sharing is introduced on purpose');
  });

  it('no option is a no-op from any audited state (every hair shape x face seeds, accessories, tops)', () => {
    let relevantProbes = 0;
    for (const baseline of AUDIT_BASELINES) {
      const states = enumerateAppearanceOptions(baseline, draw);
      relevantProbes += states.length;
      assert.deepEqual(findNoOpOptions(states, 'drawing'), [], `no-op from ${JSON.stringify(baseline)}`);
    }
    assert.ok(relevantProbes > 1000);
  });

  it('hair colour is gated off exactly when it cannot show (bald, no drawn facial hair)', () => {
    const hairColour = APPEARANCE_FIELDS.find((f) => f.id === 'hairColour')!;
    let gated = 0;
    let shown = 0;
    for (let seed = 0; seed < 40; seed++) {
      const bald = { ...DEFAULT_PRODUCER_APPEARANCE, hair: 'bald' as const, seed };
      const draws = new Set(hairColour.options.map((o) => draw(buildProducerNpc(hairColour.set(bald, o.value), 'Audit', 'modern'))));
      if (isAppearanceFieldRelevant(hairColour, bald)) { shown++; assert.equal(draws.size, hairColour.options.length, `seed ${seed}: relevant but no-op`); }
      else { gated++; assert.equal(draws.size, 1, `seed ${seed}: gated off but colour would show`); }
    }
    assert.ok(gated > 0 && shown > 0, `both cases must occur in the seed sample (gated ${gated}, shown ${shown})`);
    assert.equal(isAppearanceFieldRelevant(hairColour, DEFAULT_PRODUCER_APPEARANCE), true);
  });

  it('the detector flags a no-op option when one exists', () => {
    const hair = probes.filter((p) => p.field === 'hair');
    const doctored = probes.map((p) => (p.field === 'hair' && p.value === hair[1].value ? { ...p, drawing: hair[0].drawing } : p));
    assert.deepEqual(findNoOpOptions(doctored, 'drawing'), [`hair:${hair[0].value}=${hair[1].value}`]);
  });

  it('cycling a field from the baseline changes the derived NPC and the drawing', () => {
    const baseDrawing = draw(buildProducerNpc(DEFAULT_PRODUCER_APPEARANCE, 'Audit', 'modern'));
    for (const field of APPEARANCE_FIELDS) {
      const others = probes.filter((p) => p.field === field.id && p.value !== field.get(DEFAULT_PRODUCER_APPEARANCE));
      assert.ok(others.length > 0);
      for (const probe of others) assert.notEqual(probe.drawing, baseDrawing, `${field.id}=${probe.value} draws like the baseline`);
    }
  });

  it('every option resolves to valid renderer values (hex tints, known slots)', () => {
    const hex = /^#[0-9a-f]{6}$/i;
    for (const probe of probes) {
      const { body, hair, clothes } = probe.npc;
      for (const value of [body.skinHex, body.shadowHex, hair.hairHex, clothes.topPrimaryHex, clothes.topSecondaryHex, clothes.lowerHex, clothes.shoesHex]) {
        assert.match(value, hex, `${probe.field}=${probe.value}`);
      }
      assert.equal(JSON.stringify(sanitizeProducerAppearance(probe.appearance)), JSON.stringify(probe.appearance));
    }
  });

  it('option ids are unique per field and across the descriptor i18n ids', () => {
    const ids = APPEARANCE_FIELDS.flatMap((f) => f.options.map((o) => o.labelKey));
    assert.equal(new Set(ids).size, ids.length);
  });

  it('colour swatches match what the preview paints', () => {
    const skin = APPEARANCE_FIELDS.find((f) => f.id === 'skinTone')!;
    for (const o of skin.options) {
      const probe = probes.find((p) => p.field === 'skinTone' && p.value === o.value)!;
      assert.equal(o.swatch, probe.npc.body.skinHex, `skin swatch ${o.value}`);
      assert.ok(probe.drawing!.includes(probe.npc.body.skinHex));
    }
    const hair = APPEARANCE_FIELDS.find((f) => f.id === 'hairColour')!;
    for (const o of hair.options) assert.equal(o.swatch, probes.find((p) => p.field === 'hairColour' && p.value === o.value)!.npc.hair.hairHex, `hair swatch ${o.value}`);
    const clothes = APPEARANCE_FIELDS.find((f) => f.id === 'clothesColour')!;
    for (const o of clothes.options) {
      const npc = probes.find((p) => p.field === 'clothesColour' && p.value === o.value)!.npc;
      assert.ok(o.swatch!.includes(npc.clothes.topPrimaryHex) && o.swatch!.includes(npc.clothes.topSecondaryHex), `clothes swatch ${o.value}`);
    }
  });

  it('skin tones read as skin: no saturated yellow/green/blue and a monotonic light-to-dark order', () => {
    const lum = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255); };
    const order = ['fair', 'warm', 'olive', 'tan', 'deep', 'rich'] as const;
    for (const tone of order) {
      const n = parseInt(SKIN_PALETTES[tone].base.slice(1), 16);
      const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
      assert.ok(r >= g && g >= b, `${tone} must be warm-hued (r >= g >= b)`);
      assert.ok(g / r > 0.55, `${tone} must not be a saturated yellow`);
    }
    const lums = order.map((t) => lum(SKIN_PALETTES[t].base));
    assert.deepEqual([...lums].sort((a, b) => b - a), lums, 'swatches run light to dark');
  });
});

describe('Surprise me keeps controls and preview in step (#215)', () => {
  it('a randomised appearance yields labels and a preview from the same sanitised value', () => {
    for (let i = 0; i < 25; i++) {
      const a = randomiseProducerAppearance(createSeededRandom(`s${i}`));
      const npc = buildProducerNpc(a, 'P', 'modern');
      for (const field of APPEARANCE_FIELDS) {
        if (!isAppearanceFieldRelevant(field, a)) continue;
        const probe = enumerateAppearanceOptions(a).find((p) => p.field === field.id && p.value === field.get(a))!;
        assert.equal(probe.appearance[field.id], field.get(a));
      }
      assert.deepEqual(npc, buildProducerNpc(sanitizeProducerAppearance(a), 'P', 'modern'));
    }
  });
});
