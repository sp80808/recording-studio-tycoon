/** Focused content batch (bead sb3): Berlin + Tokyo events, Lacquer Room rival, gear + mods. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIRECTOR_EVENTS } from '../src/narrative/directorEvents';
import { RIVAL_STUDIOS } from '../src/narrative/studioLore';
import { RIVAL_LINES, RIVAL_ACCENT } from '../src/narrative/rivalCast';
import { availableEquipment } from '../src/data/equipment';
import { availableMods } from '../src/data/equipmentMods';

console.log('Testing content batch...');

const strings = JSON.parse(readFileSync('public/locales/en/events.json', 'utf8')) as Record<string, string>;
const byId = (id: string) => DIRECTOR_EVENTS.find((e) => e.id === id);

// New city events are live in the director pool with two options + a valid default.
for (const id of ['berlin_stranded_truck', 'tokyo_test_pressing']) {
  const e = byId(id);
  assert.ok(e, `${id} registered`);
  assert.equal(e!.options.length, 2);
  assert.ok(e!.options.some((o) => o.id === e!.defaultOptionId), `${id} default option exists`);
  assert.ok(e!.delegable, `${id} delegable`);
  for (const key of ['kicker', 'title', 'context']) {
    assert.ok(strings[`event.${id}.${key}`], `${id} en ${key}`);
  }
  for (const o of e!.options) {
    for (const part of ['label', 'flavor', 'outcome'] as const) {
      assert.ok(strings[`event.${id}.opt.${o.id}.${part}`], `${id} en ${o.id} ${part}`);
    }
  }
}

// Lacquer Room rival is fully wired: lore entry, campaign lines, accent.
const rival = RIVAL_STUDIOS.find((r) => r.id === 'lacquer-room');
assert.ok(rival);
assert.equal(rival!.threatLevel, 'Rising');
const lines = RIVAL_LINES['lacquer-room'];
assert.ok(lines && lines.taunt && lines.challenge && lines.showdown && lines.defeated && lines.respect);
assert.ok(RIVAL_ACCENT['lacquer-room']);

// New gear: unique ids, valid categories, sane prices.
const ids = availableEquipment.map((g) => g.id);
assert.equal(new Set(ids).size, ids.length, 'gear ids unique');
const validCategories = new Set(['microphone', 'monitor', 'interface', 'outboard', 'instrument', 'software', 'recorder', 'mixer']);
for (const id of ['tour_di_box', 'spring_reverb_tank', 'cassette_portastudio', 'dub_siren', 'ribbon_room_pair']) {
  const g = availableEquipment.find((e) => e.id === id);
  assert.ok(g, `${id} present`);
  assert.ok(validCategories.has(g!.category), `${id} valid category`);
  assert.ok(g!.price > 0 && Number.isFinite(g!.price), `${id} priced`);
}

// New mods reference real equipment and carry research costs.
const modIds = availableMods.map((m) => m.id);
assert.equal(new Set(modIds).size, modIds.length, 'mod ids unique');
for (const id of ['api_opamp_swap', 'modular_quantizer_brain']) {
  const m = availableMods.find((x) => x.id === id);
  assert.ok(m, `${id} present`);
  assert.ok(ids.includes(m!.modifiesEquipmentId), `${id} targets real gear`);
  assert.ok(m!.researchRequirements.cost > 0, `${id} has research cost`);
}

// Ultra-rare one-shots (bead 422): weight 1, single occurrence, own family,
// delegable safe default, full English strings.
const RARE_IDS = [
  'la_sunset_marquee',
  'nashville_last_song',
  'london_royalty_audit',
  'berlin_72_hour_club',
  'tokyo_sumo_choir',
  'rio_carnival_float',
  'detroit_shift_anthem',
  'lagos_shrine_session',
];
assert.equal(new Set(RARE_IDS).size, 8, 'one rare event per city');
for (const id of RARE_IDS) {
  const e = DIRECTOR_EVENTS.find((x) => x.id === id);
  assert.ok(e, `${id} registered`);
  assert.equal(e!.family, 'city-rare');
  assert.equal(e!.baseWeight, 1);
  assert.equal(e!.maxOccurrences, 1);
  assert.equal(e!.options.length, 2);
  assert.ok(e!.delegable && e!.options.some((o) => o.id === e!.defaultOptionId), `${id} safe default`);
  for (const key of ['kicker', 'title', 'context']) {
    assert.ok(strings[`event.${id}.${key}`], `${id} en ${key}`);
  }
  for (const o of e!.options) {
    for (const part of ['label', 'flavor', 'outcome'] as const) {
      assert.ok(strings[`event.${id}.opt.${o.id}.${part}`], `${id} en ${o.id} ${part}`);
    }
  }
}

console.log('content-batch.check.ts: ok');
