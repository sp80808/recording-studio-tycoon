/**
 * Draws the in-house proprietary original layered-NPC part set into assets-src/layer/npc-parts/frames/.
 * Parts share one 32x48 canvas and are drawn white/grey so the Pixi renderer can tint them
 * (skin, hair, clothing colours come from the NPC definition). Face and shadow keep their own colours.
 * Frame file names are `<slot>_<variant>_000.png`, matching npcLayers.ts variant keys (`hair/afro` -> hair_afro).
 */
import fs from 'node:fs';
import path from 'node:path';
import { encodePng, type Rgba } from './png';

const W = '#ffffff', L = '#d6d6d6', D = '#9b9b9b';
const dir = path.join(process.cwd(), 'assets-src', 'layer', 'npc-parts', 'frames');
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const make = (draw: (r: (x: number, y: number, w: number, h: number, c: string, a?: number) => void) => void): Rgba => {
  const img: Rgba = { w: 32, h: 48, data: new Uint8Array(32 * 48 * 4) };
  draw((x, y, w, h, c, a = 255) => {
    const [r, g, b] = hex(c);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (xx >= 0 && yy >= 0 && xx < 32 && yy < 48) img.data.set([r, g, b, a], (yy * 32 + xx) * 4);
  });
  return img;
};
const parts: Record<string, Rgba> = {};
const add = (name: string, img: Rgba) => { parts[name] = img; };

add('body_shadow', make((r) => { r(8, 45, 16, 3, '#000000', 90); r(10, 44, 12, 1, '#000000', 60); }));

for (const [build, hw] of [['slim', 5], ['average', 6], ['stocky', 7]] as const) {
  add(`body_${build}`, make((r) => {
    r(11, 6, 10, 12, W); r(11, 6, 2, 12, L); r(14, 18, 4, 2, L); // head, neck
    r(16 - hw, 18, hw * 2, 15, W); r(16 - hw, 18, 2, 15, L); // torso
    r(16 - hw - 3, 20, 3, 12, W); r(16 + hw, 20, 3, 12, W); // arms
    r(16 - hw - 3, 30, 3, 2, D); r(16 + hw, 30, 3, 2, D); // hands shade
  }));
}

const legs = (r: Parameters<Parameters<typeof make>[0]>[0], w: number, top = 32) => { r(11, top, w, 12, W); r(21 - w, top, w, 12, W); r(11, top, 1, 12, L); r(21 - w, top, 1, 12, L); };
add('lower_denim_jeans', make((r) => legs(r, 4)));
add('lower_corduroy_trousers', make((r) => { legs(r, 4); for (let y = 34; y < 44; y += 2) { r(11, y, 4, 1, L); r(17, y, 4, 1, L); } }));
add('lower_bell_bottoms', make((r) => { legs(r, 4); r(9, 40, 6, 4, W); r(17, 40, 6, 4, W); r(9, 40, 1, 4, L); r(17, 40, 1, 4, L); }));
add('lower_cargo_pants', make((r) => { legs(r, 5); r(11, 37, 3, 3, D); r(18, 37, 3, 3, D); }));
add('lower_joggers', make((r) => { legs(r, 4); r(11, 42, 4, 2, D); r(17, 42, 4, 2, D); }));
add('lower_ripped_jeans', make((r) => { legs(r, 4); r(12, 36, 2, 2, D); r(18, 39, 2, 2, D); r(12, 41, 2, 1, D); }));

const shoe = (r: Parameters<Parameters<typeof make>[0]>[0], top: number, w: number, sole: number) => {
  for (const x of [11 - (w - 4), 17]) { r(x, top, w, 48 - top, W); r(x, 47 - sole + 1, w, sole, D); }
};
add('shoes_vintage_sneakers', make((r) => shoe(r, 44, 5, 1)));
add('shoes_leather_boots', make((r) => shoe(r, 42, 5, 1)));
add('shoes_creepers', make((r) => shoe(r, 44, 5, 2)));
add('shoes_hi_tops', make((r) => shoe(r, 41, 5, 1)));
add('shoes_loafers', make((r) => shoe(r, 45, 5, 1)));
add('shoes_canvas_skaters', make((r) => shoe(r, 44, 6, 1)));

const torso = (r: Parameters<Parameters<typeof make>[0]>[0], half = 7, sleeves = true) => {
  r(16 - half, 18, half * 2, 15, W); r(16 - half, 18, 2, 15, L);
  if (sleeves) { r(16 - half - 3, 19, 3, 11, W); r(16 + half, 19, 3, 11, W); r(16 - half - 3, 19, 1, 11, L); }
};
add('top_flannel_shirt', make((r) => { torso(r); for (let x = 11; x < 22; x += 3) r(x, 18, 1, 15, D); for (let y = 21; y < 33; y += 4) r(9, y, 14, 1, L); }));
add('top_band_tee', make((r) => { torso(r, 7, false); r(7, 19, 3, 6, W); r(22, 19, 3, 6, W); r(12, 22, 8, 6, D); r(14, 24, 4, 2, W); }));
add('top_turtleneck', make((r) => { torso(r); r(13, 16, 6, 4, D); }));
add('top_leather_jacket', make((r) => { torso(r); r(15, 18, 2, 15, D); r(11, 18, 3, 6, L); r(18, 18, 3, 6, L); r(9, 30, 14, 3, L); }));
add('top_tracksuit_jacket', make((r) => { torso(r); r(9, 18, 1, 15, D); r(22, 18, 1, 15, D); r(6, 19, 1, 11, D); r(25, 19, 1, 11, D); r(15, 18, 2, 15, L); }));
add('top_oversized_hoodie', make((r) => { torso(r, 8); r(11, 16, 10, 4, D); r(12, 27, 8, 5, L); }));
add('top_denim_vest', make((r) => { torso(r, 7, false); r(15, 18, 2, 15, D); r(9, 18, 3, 3, D); r(20, 18, 3, 3, D); }));
add('top_vintage_cardigan', make((r) => { torso(r); r(15, 18, 2, 15, L); for (let y = 21; y < 32; y += 3) r(15, y, 2, 1, D); r(9, 31, 14, 2, D); }));

const cap = (r: Parameters<Parameters<typeof make>[0]>[0], x: number, y: number, w: number, h: number) => { r(x, y, w, h, W); r(x, y, w, 1, L); r(x, y, 1, h, L); };
add('hair_afro', make((r) => { cap(r, 8, 0, 16, 11); r(8, 8, 3, 6, W); r(21, 8, 3, 6, W); }));
add('hair_pompadour', make((r) => { cap(r, 10, 2, 12, 6); cap(r, 12, 0, 10, 3); }));
add('hair_dreads', make((r) => { cap(r, 10, 3, 12, 4); for (const x of [9, 11, 13, 17, 19, 21]) r(x, 6, 2, 14, x % 4 ? W : L); }));
add('hair_bob', make((r) => { cap(r, 9, 3, 14, 5); r(9, 7, 3, 10, W); r(20, 7, 3, 10, W); r(9, 7, 1, 10, L); }));
add('hair_messy_curly', make((r) => { cap(r, 9, 2, 14, 6); for (const [x, y] of [[8, 4], [23, 4], [10, 1], [14, 0], [19, 1], [8, 8], [23, 8]]) r(x, y, 2, 2, W); }));
add('hair_slicked', make((r) => { cap(r, 10, 4, 12, 4); r(10, 7, 2, 3, W); }));
add('hair_buzzcut', make((r) => { r(10, 4, 12, 3, L); r(10, 4, 12, 1, D); }));
add('hair_long_wavy', make((r) => { cap(r, 9, 3, 14, 5); r(8, 7, 4, 19, W); r(20, 7, 4, 19, W); r(8, 10, 1, 16, L); r(9, 12, 2, 2, L); r(21, 18, 2, 2, L); }));
add('hair_topknot', make((r) => { cap(r, 10, 4, 12, 4); cap(r, 14, 0, 5, 4); }));

const eyes = (r: Parameters<Parameters<typeof make>[0]>[0], h: number, y = 11) => { r(13, y, 2, h, '#171717'); r(18, y, 2, h, '#171717'); };
add('face_focused', make((r) => { eyes(r, 2); r(12, 9, 3, 1, '#3f2212'); r(18, 9, 3, 1, '#3f2212'); r(14, 15, 4, 1, '#7c2d12'); }));
add('face_eager', make((r) => { eyes(r, 3, 10); r(14, 15, 4, 2, '#7c2d12'); }));
add('face_chill', make((r) => { r(13, 12, 2, 1, '#171717'); r(18, 12, 2, 1, '#171717'); r(14, 15, 5, 1, '#7c2d12'); }));
add('face_stern', make((r) => { eyes(r, 2); r(12, 10, 4, 1, '#3f2212'); r(17, 9, 4, 1, '#3f2212'); r(14, 16, 4, 1, '#7c2d12'); }));
add('face_ecstatic', make((r) => { eyes(r, 2, 10); r(13, 14, 7, 1, '#7c2d12'); r(14, 15, 5, 2, '#7c2d12'); r(15, 15, 3, 1, '#fecaca'); }));
add('face_vintage_shades', make((r) => { r(11, 10, 10, 3, '#111111'); r(14, 10, 1, 1, '#374151'); r(14, 15, 4, 1, '#7c2d12'); }));

add('prop_headphones', make((r) => { r(9, 4, 14, 2, D); r(8, 6, 2, 9, D); r(22, 6, 2, 9, D); r(7, 9, 3, 5, W); r(22, 9, 3, 5, W); }));

fs.mkdirSync(dir, { recursive: true });
for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) fs.unlinkSync(path.join(dir, f));
for (const [name, img] of Object.entries(parts)) fs.writeFileSync(path.join(dir, `${name}_000.png`), encodePng(img));
fs.writeFileSync(path.join(dir, '..', 'asset.json'), JSON.stringify({
  id: 'npc-parts', kind: 'layer', sourceType: 'vector_authored', author: 'RST in-house', license: 'original',
  toolVersion: 'scripts/assets/make-layer-parts.ts (procedural rectangles)', paletteId: 'rst-npc-parts-tintable', palette: [W, L, D, '#171717', '#7c2d12', '#3f2212'],
  createdAt: '2026-09-30T00:00:00.000Z', pipelineSteps: ['draw-in-house', 'export-png-sequence'],
}, null, 2) + '\n');
console.log(`wrote ${Object.keys(parts).length} layer parts`);
